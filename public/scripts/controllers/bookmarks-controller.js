app.controller('bookmarksCtr', ['$scope', '$state', '$stateParams', '$filter', '$window', '$timeout', 'ngDialog', 'bookmarkService', 'pubSubService', function($scope, $state, $stateParams, $filter, $window, $timeout, ngDialog, bookmarkService, pubSubService) {
    console.log("Hello bookmarksCtr...", $stateParams);
    $scope.bookmarks = []; // 书签数据
    $scope.showSearch = false; // 搜索对话框
    $scope.bookmarkNormalHover = false;
    $scope.bookmarkEditHover = false;
    $scope.showStyle = ($stateParams && $stateParams.showStyle) || 'navigate'; // 显示风格'navigate', 'card', 'table'
    $('.js-radio-' + $scope.showStyle).checkbox('set checked');
    $scope.edit = false;
    const perPageItems = 20;
    var dialog = null;
    $scope.totalPages = 0;
    $scope.currentPage = 1;
    $scope.inputPage = '';
    $scope.loadBusy = false;
    $scope.waitDelBookmark = {};

    $scope.changeCurrentPage = function(currentPage) {
        currentPage = parseInt(currentPage) || 0;
        console.log('currentPage = ', currentPage);
        if (currentPage <= $scope.totalPages && currentPage >= 1) {
            $scope.loadBusy = true;
            $scope.currentPage = currentPage;
            $scope.inputPage = '';
            getBookmarks(params);
        } else {
            $scope.currentPage = $scope.totalPages
        }
    }

    var params = {
        showStyle: $scope.showStyle,
    }
    getBookmarks(params);

    $scope.jumpToUrl = function(url, id) {
        if (!$scope.edit) {
            $window.open(url, '_blank');
            bookmarkService.clickBookmark({
                id: id
            });

            if (params.showStyle != 'navigate') {
                $scope.bookmarks.forEach(function(bookmark) {
                    if (bookmark.id == id) {
                        bookmark.click_count += 1;
                        bookmark.last_click = $filter("date")(new Date(), "yyyy-MM-dd");
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
                $("#" + bookmarkId).remove();
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
            bookmark.last_click = bookmark.last_click.substring(0, 10);
            bookmark.created_at = bookmark.created_at.substring(0, 10);
            bookmark.tags = [{
                id: bookmark.tag_id,
                name: bookmark.tag_name
            }];
        } else if ($scope.showStyle == 'card') {
            bookmark.last_click = bookmark.last_click.substring(0, 10);
            bookmark.created_at = bookmark.created_at.substring(0, 10);
        }
        pubSubService.publish('TagCtr.showBookmarkInfo', bookmark);
        bookmarkService.clickBookmark({
            id: bookmark.id
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
        $(".js-msg").remove();
    }

    $scope.loadCardData = function() {
        console.log('loadCardData.........')
        if (!$scope.loadBusy) {
            $scope.changeCurrentPage($scope.currentPage += 1)
        }
    }

    pubSubService.subscribe('EditCtr.inserBookmarsSuccess', $scope, function(event, data) {
        console.log('subscribe EditCtr.inserBookmarsSuccess', params);

        var menusScope = $('div[ng-controller="menuCtr"]').scope();
        if (menusScope.login && menusScope.selectLoginIndex == 0) {
            params.showStyle = $scope.showStyle;
            if ($scope.showStyle == 'card') {
                $scope.currentPage = 1;
                $scope.bookmarks = [];
            }
            getBookmarks(params);
        }
    });

    function getBookmarks(params) {
        if (params.showStyle != 'navigate') {
            params.currentPage = $scope.currentPage;
            params.perPageItems = perPageItems;
        }
        bookmarkService.getBookmarks(params)
            .then((data) => {
                if (params.showStyle != 'navigate') {
                    $scope.totalPages = Math.ceil(data.totalItems / perPageItems);
                    if (data.totalItems == 0) {
                        toastr.info('您还没有书签，请点击菜单栏的添加按钮进行添加', "提示");
                    }
                    if (params.showStyle == 'card') {
                        data.bookmarks.forEach(bookmark => {
                            $scope.bookmarks.push(bookmark);
                        })
                        $scope.loadBusy = false;
                    } else {
                        $scope.bookmarks = data.bookmarks;
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
                // transition();
            })
            .catch((err) => console.log('getBookmarks err', err));
    }


    function transition() {
        setTimeout(function() {
            var data = ['scale', 'fade', 'fade up', 'fade down', 'fade left', 'fade right', 'horizontal flip',
                'vertical flip', 'drop', 'fly left', 'fly right', 'fly up', 'fly down', 'swing left', 'swing right', 'swing up',
                'swing down', 'browse', 'browse right', 'slide down', 'slide up', 'slide left', 'slide right'
            ];
            var t = data[parseInt(Math.random() * 1000) % data.length];

            var className = 'js-segment-navigate';
            if ($scope.showStyle == 'card') {
                className = 'js-segment-card'
            } else if ($scope.showStyle == 'table') {
                className = 'js-table-bookmarks'
            }
            $('.' + className).transition('hide');
            $('.' + className).transition({
                animation: t,
                duration: 500,
            });
        }, 10)
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
}]);
