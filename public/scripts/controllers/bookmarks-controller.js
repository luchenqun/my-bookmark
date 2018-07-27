app.controller('bookmarksCtr', ['$scope', '$state', '$stateParams', '$filter', '$window', '$timeout', '$document', 'ngDialog', 'bookmarkService', 'pubSubService', 'dataService', function($scope, $state, $stateParams, $filter, $window, $timeout, $document, ngDialog, bookmarkService, pubSubService, dataService) {
    console.log("Hello bookmarksCtr...", $stateParams);
    if(dataService.smallDevice()){
        $window.location = "http://m.mybookmark.cn/#/tags";
        return;
    }

    $scope.bookmarks = []; // 书签数据
    $scope.showSearch = false; // 搜索对话框
    $scope.bookmarkNormalHover = false;
    $scope.bookmarkEditHover = false;
    $scope.hoverBookmark = null;
    var menusScope = $('div[ng-controller="menuCtr"]').scope();
    $scope.showStyle = ($stateParams && $stateParams.showStyle) || (menusScope && menusScope.showStyle); // 显示风格'navigate', 'costomTag', 'card', 'table'
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
            $scope.currentPage = currentPage;
            $scope.inputPage = '';
            getBookmarks();
        } else {
            $scope.currentPage = $scope.totalPages
        }
    }

    $scope.jumpToUrl = function(url, id) {
        $window.open(url, '_blank');
        bookmarkService.clickBookmark({
            id: id
        });

        if ($scope.showStyle != 'navigate') {
            var bookmarks = $scope.showStyle == 'table' ? $scope.bookmarkData.bookmarks : $scope.bookmarkData;
            bookmarks.forEach(function(bookmark) {
                if (bookmark.id == id) {
                    bookmark.click_count += 1;
                    bookmark.last_click = $filter("date")(new Date(), "yyyy-MM-dd HH:mm:ss");
                }
            })
        } else {

        }

        $timeout(function() {
            timeagoInstance.cancel();
            timeagoInstance.render(document.querySelectorAll('.need_to_be_rendered'), 'zh_CN');
        }, 100)
    }

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
                    animation: dataService.animation(),
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

    $scope.copy = function(url) {
        dataService.clipboard(url);
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
            index: dataService.LoginIndexSettings
        });
    }

    $scope.closeMsg = function() {
        $('.js-msg').transition({
            animation: dataService.animation(),
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
        $scope.bookmarks = $scope.bookmarkData.slice(0, 79);
    }

    pubSubService.subscribe('EditCtr.inserBookmarsSuccess', $scope, function(event, data) {
        console.log('subscribe EditCtr.inserBookmarsSuccess', JSON.stringify(data));

        var menusScope = $('div[ng-controller="menuCtr"]').scope();
        if (menusScope.login && menusScope.selectLoginIndex == 0) {
            $scope.forbidTransition = true;
            if ($scope.showStyle == 'card') {
                var find = false;
                $scope.bookmarks.forEach((bookmark) => {
                    if (bookmark.id == data.id) {
                        bookmark.title = data.title;
                        bookmark.url = data.url;
                        bookmark.tags = data.tags;
                        bookmark.description = data.description;
                        find = true;
                    }
                })
                if (!find) {
                    $scope.bookmarks.unshift(data);
                    $timeout(function() {
                        timeagoInstance.cancel();
                        timeagoInstance.render(document.querySelectorAll('.need_to_be_rendered'), 'zh_CN');
                    }, 100)
                }
            } else {
                $scope.forbidTransition = true;
                getBookmarks();
            }
        }
    });

    $scope.setHoverBookmark = function(bookmark) {
        $scope.hoverBookmark = bookmark;
    }

    // 在输入文字的时候也会触发，所以不要用Ctrl,Shift之类的按键
    $document.bind("keydown", function(event) {
        $scope.$apply(function() {
            var key = event.key.toUpperCase();
            console.log(key);
            if ($scope.hoverBookmark && dataService.keyShortcuts()) {
                if (key == 'E') {
                    $scope.editBookmark($scope.hoverBookmark.id)
                } else if (key == 'I') {
                    $scope.detailBookmark($scope.hoverBookmark)
                } else if (key == 'D') {
                    $scope.delBookmark($scope.hoverBookmark)
                } else if (key == 'C') {
                    $scope.copy($scope.hoverBookmark.url)
                }
            }
        })
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
                .catch((err) => dataService.netErrorHandle(err, $state));
        } else {
            $scope.loadBusy = true;
            if (params.showStyle == 'table' && (!$scope.forbidTransition)) {
                $('.js-table-bookmarks').transition('hide');
            }
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
                            $scope.bookmarkData.bookmarks.forEach(bookmark => {
                                if (bookmark.type == 2) {
                                    bookmark.edit = false;
                                    $scope.bookmarks.push(bookmark);
                                }
                            })
                            $timeout(function() {
                                timeagoInstance.cancel();
                                timeagoInstance.render(document.querySelectorAll('.need_to_be_rendered'), 'zh_CN');
                            }, 100)
                        } else if (params.showStyle == 'costomTag') {
                            $scope.costomTags.forEach((tag) => {
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
                        index: dataService.LoginIndexBookmarks
                    });
                    if (!$scope.forbidTransition) {
                        transition();
                    }
                    $scope.forbidTransition = false;
                    $scope.loadBusy = false;
                })
                .catch((err) => { 
                    dataService.netErrorHandle(err, $state);
                    $scope.loadBusy = false;
                });
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
        }, 1000)
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
            animation: dataService.animation(),
            duration: 500,
        });
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

    function clickCmp(a, b) {
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
