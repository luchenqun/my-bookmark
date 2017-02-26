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
        console.log(JSON.stringify(bookmark), ' ddddd ', JSON.stringify(b));
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
    $scope.copyBookmark = function(bookmarkUrl) {
        toastr.warning('功能暂未实现。。。', "警告");
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
        params.showStyle = $scope.showStyle;
        console.log('subscribe EditCtr.inserBookmarsSuccess', params);
        getBookmarks(params);
        if ($scope.showStyle == 'card') {
            $scope.currentPage = 1;
            $scope.bookmarks = [];
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
            })
            .catch((err) => console.log('getBookmarks err', err));
    }

    // TODO: 我要将编辑按钮固定在容器的右上角
    $(window).resize(updateEditPos);
    setTimeout(updateEditPos, 100);

    function updateEditPos() {
        setTimeout(function() {
            if ($scope.showStyl == 'navigate') {
                var top = $('.js-segment-navigate').offset().top;
                var left = $('.js-segment-navigate').offset().left;
                var width = $('.js-segment-navigate').width();
                // console.log('js-edit position update', top+10, left+width-10)
                $('.js-edit').offset({
                    top: top + 10,
                    left: left + width - 10,
                })
            }
        }, 100)
    }
}]);
