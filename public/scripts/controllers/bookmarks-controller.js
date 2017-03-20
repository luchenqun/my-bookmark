app.controller('bookmarksCtr', ['$scope', '$state', '$stateParams', '$filter', '$window', '$timeout', 'ngDialog', 'bookmarkService', 'pubSubService', function($scope, $state, $stateParams, $filter, $window, $timeout, ngDialog, bookmarkService, pubSubService) {
    console.log("Hello bookmarksCtr...", $stateParams);
    $scope.bookmarks = []; // 书签数据
    $scope.showSearch = false; // 搜索对话框
    $scope.bookmarkNormalHover = false;
    $scope.bookmarkEditHover = false;
    var menusScope = $('div[ng-controller="menuCtr"]').scope();
    $scope.showStyle = ($stateParams && $stateParams.showStyle) || (menusScope && menusScope.showStyle); // 显示风格'navigate', 'costomTag', 'card', 'table'
    $scope.edit = false;
    const perPageItems = 20;
    var dialog = null;
    $scope.totalPages = 0;
    $scope.currentPage = 1;
    $scope.inputPage = '';
    $scope.loadBusy = false;
    $scope.waitDelBookmark = {};
    $scope.order = [false, false, false];
    $scope.order[($stateParams && $stateParams.orderIndex) || 0] = true;
    $scope.bookmarkData = {};
    $scope.costomTags = [{
        index: 0,
        clicked: true,
        name: '最近使用'
    }, {
        index: 1,
        clicked: false,
        name: '最近添加'
    }, {
        index: 2,
        clicked: false,
        name: '最多使用'
    }]
    var timeagoInstance = timeago();

    updateShowStyle();
    getBookmarks();

    $scope.changeCurrentPage = function(currentPage) {
        currentPage = parseInt(currentPage) || 0;
        console.log('currentPage = ', currentPage);
        if (currentPage <= $scope.totalPages && currentPage >= 1) {
            $scope.loadBusy = true;
            $scope.currentPage = currentPage;
            $scope.inputPage = '';
            getBookmarks();
        } else {
            $scope.currentPage = $scope.totalPages
        }
    }

    $scope.jumpToUrl = function(url, id) {
        if (!$scope.edit) {
            $window.open(url, '_blank');
            bookmarkService.clickBookmark({
                id: id
            });

            if ($scope.showStyle != 'navigate') {
                $scope.bookmarks.forEach(function(bookmark) {
                    if (bookmark.id == id) {
                        bookmark.click_count += 1;
                        bookmark.last_click = $filter("date")(new Date(), "yyyy-MM-dd HH:mm:ss");
                        $("#time"+bookmark.id).attr('data-timeago', bookmark.last_click);
                        timeagoInstance.render(document.querySelectorAll("#time"+bookmark.id), 'zh_CN');
                    }
                })
            }
        }
    }
    $scope.toggleMode = function() {
        $scope.edit = !$scope.edit
    };

    $scope.delBookmark = function(bookmark) {
        console.log('delBookmark..........')
        $scope.waitDelBookmark = $.extend(true, {}, bookmark); // 利用jQuery执行深度拷贝
        dialog = ngDialog.open({
            template: './views/dialog-del-bookmark.html',
            className: 'ngdialog-theme-default',
            scope: $scope
        });
    }

    $scope.confirmDelBookmark = function(bookmarkId) {
        var params = {
            id: bookmarkId
        }
        ngDialog.close(dialog);
        bookmarkService.delBookmark(params)
            .then((data) => {
                $("#" + bookmarkId).transition({
                    animation: animation(),
                    duration: 500,
                    onComplete: function() {
                        $("#" + bookmarkId).remove();
                    }
                });
                toastr.success($scope.waitDelBookmark.title + ' 书签删除成功！', "提示");
            })
            .catch((err) => {
                toastr.error($scope.waitDelBookmark.title + ' 书签删除失败！错误提示：' + JSON.stringify(err), "提示");
            });
    }

    $scope.editBookmark = function(bookmarkId) {
        pubSubService.publish('bookmarksCtr.editBookmark', {
            'bookmarkId': bookmarkId
        });
    }

    $scope.detailBookmark = function(b) {
        var bookmark = $.extend(true, {}, b); // 利用jQuery执行深度拷贝
        bookmark.own = true;
        if ($scope.showStyle == 'navigate') {
            bookmark.tags = [{
                id: bookmark.tag_id,
                name: bookmark.tag_name
            }];
        }
        pubSubService.publish('TagCtr.showBookmarkInfo', bookmark);
        bookmarkService.clickBookmark({
            id: bookmark.id
        });
    }

    $scope.copy = function(id, url) {
        var clipboard = new Clipboard('#url' + id, {
            text: function() {
                return url;
            }
        });

        clipboard.on('success', function(e) {
            toastr.success(url + '<br/>已复制到您的剪切板', "提示");
            clipboard.destroy();
        });

        clipboard.on('error', function(e) {
            toastr.error(url + '<br/>复制失败', "提示");
            clipboard.destroy();
        });
    }

    $scope.jumpToTags = function(tagId) {
        $state.go('tags', {
            tagId: tagId,
        })
    }

    $scope.addBookmarkbyFile = function() {
        console.log("addBookmarkbyFile");
        $state.go('settings', {
            formIndex: 2,
        });
        pubSubService.publish('Common.menuActive', {
            login: true,
            index: 3
        });
    }

    $scope.closeMsg = function() {
        $('.js-msg').transition({
            animation: animation(),
            duration: '500ms',
            onComplete: function() {
                $(".js-msg").remove();
            }
        });
    }

    $scope.loadCardData = function() {
        console.log('loadCardData.........')
        if (!$scope.loadBusy) {
            $scope.changeCurrentPage($scope.currentPage += 1)
        }
    }

    $scope.changeOrder = function(index) {
        if (index < 0 || index >= $scope.order.length) {
            return;
        }
        $scope.order = $scope.order.map(() => false);
        $scope.order[index] = true;
        $scope.bookmarks = [];
        if ($scope.order[0]) {
            $scope.bookmarkData.bookmarks.sort(clickCmp)
            $scope.bookmarkData.bookmarks.forEach((bookmark) => {
                if (bookmark.type == 1) {
                    $scope.bookmarks.push(bookmark);
                }
            })
        } else if ($scope.order[1]) {
            $scope.bookmarkData.bookmarks.sort((a, b) => a.created_at >= b.created_at ? -1 : 1);
            $scope.bookmarkData.bookmarks.forEach((bookmark) => {
                if (bookmark.type == 2) {
                    $scope.bookmarks.push(bookmark);
                }
            })
        } else {
            $scope.bookmarkData.bookmarks.sort((a, b) => a.last_click >= b.last_click ? -1 : 1);
            $scope.bookmarkData.bookmarks.forEach((bookmark) => {
                if (bookmark.type == 3) {
                    $scope.bookmarks.push(bookmark);
                }
            })
        }

        $timeout(function() {
            timeagoInstance.cancel();
            timeagoInstance.render(document.querySelectorAll('.need_to_be_rendered'), 'zh_CN');
        }, 100)
    }

    $scope.updateCostomTagBookmarks = function(index) {
        console.log('updateCostomTagBookmarks index = ' + index);
        $scope.costomTags.forEach((tag, i) => {
            $scope.costomTags[i].clicked = false;
        })
        $scope.costomTags[index].clicked = true;

        if (index == 0) {
            $scope.bookmarkData.sort((a, b) => a.last_click >= b.last_click ? -1 : 1);
        } else if (index == 1) {
            $scope.bookmarkData.sort((a, b) => a.created_at >= b.created_at ? -1 : 1);
        } else {
            $scope.bookmarkData.sort(clickCmp)
        }
        $scope.bookmarks = $scope.bookmarkData.slice(0, 68);
    }

    pubSubService.subscribe('EditCtr.inserBookmarsSuccess', $scope, function(event, data) {
        console.log('subscribe EditCtr.inserBookmarsSuccess', params);

        var menusScope = $('div[ng-controller="menuCtr"]').scope();
        if (menusScope.login && menusScope.selectLoginIndex == 0) {
            $scope.showStyle = $scope.showStyle;
            $scope.forbidTransition = true;
            if ($scope.showStyle == 'card') {
                $scope.currentPage = 1;
                $scope.bookmarks = [];
            }
            getBookmarks();
        }
    });

    function getBookmarks() {
        var params = {}
        params.showStyle = $scope.showStyle
        params.currentPage = $scope.currentPage;
        params.perPageItems = perPageItems;

        if (!params.showStyle) {
            bookmarkService.userInfo({})
                .then((user) => {
                    $scope.showStyle = (user && user.show_style) || 'navigate';
                    updateShowStyle();
                    getBookmarks(); // 拿到默认显示风格了，继续取获取书签
                })
                .catch((err) => {
                    toastr.error('获取信息失败。错误信息：' + JSON.stringify(err), "错误");
                });
        } else {
            bookmarkService.getBookmarks(params)
                .then((data) => {
                    if (params.showStyle != 'navigate') {
                        $scope.bookmarkData = data;
                        $scope.totalPages = Math.ceil(data.totalItems / perPageItems);
                        if (data.totalItems == 0) {
                            toastr.info('您还没有书签，请点击菜单栏的添加按钮进行添加', "提示");
                        }
                        if (params.showStyle == 'card') {
                            $scope.bookmarkData.bookmarks.sort((a, b) => a.created_at >= b.created_at ? -1 : 1);
                            var begin = ($scope.currentPage - 1) * perPageItems;
                            var end = $scope.currentPage * perPageItems;
                            var bookmarks = $scope.bookmarkData.bookmarks.slice(begin, end);
                            bookmarks.forEach(bookmark => {
                                bookmark.edit = false;
                                $scope.bookmarks.push(bookmark);
                            })
                            $scope.loadBusy = false;
                        } else if (params.showStyle == 'costomTag') {
                            $scope.costomTags.forEach((tag) => {
                                console.log('tag', tag)
                                if (tag.clicked) {
                                    $scope.updateCostomTagBookmarks(tag.index)
                                }
                            })
                        } else {
                            $scope.changeOrder($scope.order.indexOf(true));
                        }
                    } else {
                        $scope.bookmarks = data;
                        if ($scope.bookmarks.length <= 2) {
                            $(".js-msg").removeClass("hidden");
                        }
                        if ($scope.bookmarks.length == 0) {
                            toastr.info('您还没有书签，请点击菜单栏的添加按钮进行添加', "提示");
                        }
                    }
                    pubSubService.publish('Common.menuActive', {
                        login: true,
                        index: 0
                    });
                    if (!($scope.forbidTransition && $scope.forbidTransition == true)) {
                        transition();
                    }
                })
                .catch((err) => console.log('getBookmarks err', err));
        }
    }

    function updateShowStyle() {
        $timeout(function() {
            if ($scope.showStyle) {
                $('.js-bookmark-dropdown' + ' .radio.checkbox').checkbox('set unchecked');
                $('.js-radio-' + $scope.showStyle).checkbox('set checked');
                $('.js-bookmark-dropdown' + ' .field.item').removeClass('active selected');
                $('.js-field-' + $scope.showStyle).addClass('active selected');
            }
        }, 100)
    }

    function transition() {
        if ($scope.showStyle == 'card' && $scope.currentPage > 1) {
            return;
        }
        var className = 'js-segment-navigate';
        if ($scope.showStyle == 'card') {
            className = 'js-segment-card'
        } else if ($scope.showStyle == 'table') {
            className = 'js-table-bookmarks'
        } else if ($scope.showStyle == 'costomTag') {
            className = 'js-segment-costomTag'
        }
        $('.' + className).transition('hide');
        $('.' + className).transition({
            animation: animation(),
            duration: 500,
        });
    }

    function animation() {
        var data = ['scale', 'fade', 'fade up', 'fade down', 'fade left', 'fade right', 'horizontal flip',
            'vertical flip', 'drop', 'fly left', 'fly right', 'fly up', 'fly down', 'swing left', 'swing right', 'swing up',
            'swing down', 'browse', 'browse right', 'slide down', 'slide up', 'slide left', 'slide right'
        ];
        var t = data[parseInt(Math.random() * 1000) % data.length];

        return t;
    }

    // TODO: 我要将编辑按钮固定在容器的右上角
    $(window).resize(updateEditPos);
    updateEditPos();

    function updateEditPos() {
        if ($scope.showStyle == 'navigate') {
            for (var i = 1; i <= 100; i += 10) {
                setTimeout(function() {
                    var offset = $('.js-segment-navigate').offset();
                    if (offset) {
                        var t = offset.top;
                        var l = offset.left;
                        var w = $('.js-segment-navigate').width();
                        $('.js-bookmark-edit').offset({
                            top: t + 10,
                            left: l + w - 10,
                        })
                    }
                }, 100 * i)
            }
        }
    }

    function clickCmp(a, b){
        var click1 = parseInt(a.click_count);
        var click2 = parseInt(b.click_count);
        if (click1 > click2) {
            return -1;
        } else if (click1 == click2) {
            return a.created_at >= b.created_at ? -1 : 1;
        } else {
            return 1;
        }
    }
}]);
