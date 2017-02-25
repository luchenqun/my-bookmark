app.controller('tagsCtr', ['$scope', '$filter', '$window', '$stateParams', '$timeout', 'bookmarkService', 'pubSubService', function($scope, $filter, $window, $stateParams, $timeout, bookmarkService, pubSubService) {
    console.log("Hello tagsCtr...", $stateParams);
    getTags({});

    const perPageItems = 20;
    $scope.loadBookmarks = false;
    $scope.tags = []; // 书签数据
    $scope.bookmarkClicked = false;
    $scope.bookmarks = [];
    $scope.bookmarkCount = 0;
    $scope.totalPages = 0;
    $scope.currentPage = 1;
    $scope.inputPage = '';
    $scope.currentTagId = ($stateParams && $stateParams.tagId) || '';
    $scope.edit = true;

    pubSubService.subscribe('MenuCtr.tags', $scope, function(event, data) {
        console.log('subscribe MenuCtr.tags', data);
        getTags({});
    });

    $scope.getBookmarks = function(tagId, currentPage) {
        $scope.bookmarkClicked = true;
        $scope.currentTagId = tagId;
        $scope.currentPage = currentPage;
        $scope.loadBookmarks = true;

        $scope.tags.forEach(function(tag) {
            tag.bookmarkClicked = false;
            if (tag.id == tagId) {
                tag.bookmarkClicked = true;
            }
        });

        var params = {
            tagId: tagId,
            currentPage: currentPage,
            perPageItems: perPageItems,
        };

        bookmarkService.getBookmarksByTag(params)
            .then((data) => {
                $scope.bookmarks = data.bookmarks;
                $scope.bookmarkCount = data.totalItems;
                $scope.totalPages = Math.ceil($scope.bookmarkCount / perPageItems);

                $scope.inputPage = '';
                $scope.loadBookmarks = false;

                pubSubService.publish('Common.menuActive', {
                    login: true,
                    index: 1
                });
            })
            .catch((err) => {
                console.log('getTags err', err);
                $scope.loadBookmarks = false;
            });
    };

    $scope.changeCurrentPage = function(currentPage) {
        currentPage = parseInt(currentPage) || 0;
        console.log(currentPage);
        if (currentPage <= $scope.totalPages && currentPage >= 1) {
            $scope.getBookmarks($scope.currentTagId, currentPage);
            $scope.currentPage = currentPage;
        }
    }

    $scope.jumpToUrl = function(url, id) {
        if (!$scope.edit) {
            $window.open(url, '_blank');
            bookmarkService.clickBookmark({
                id: id
            });
            $scope.bookmarks.forEach(function(bookmark) {
                if (bookmark.id == id) {
                    bookmark.click_count += 1;
                    bookmark.last_click = $filter("date")(new Date(), "yyyy-MM-dd");
                }
            })
        }
    }

    $scope.delBookmark = function(bookmarkId) {
        var params = {
            id: bookmarkId
        }
        bookmarkService.delBookmark(params)
            .then((data) => $("#" + bookmarkId).remove())
            .catch((err) => {
                console.log('delBookmark err ', err)
            });
    }
    $scope.editBookmark = function(bookmarkId) {
        pubSubService.publish('bookmarksCtr.editBookmark', {
            'bookmarkId': bookmarkId
        });
    }

    $scope.detailBookmark = function(bookmark) {
        pubSubService.publish('TagCtr.showBookmarkInfo', bookmark);
        bookmarkService.clickBookmark({
            id: bookmark.id
        });
    }

    $scope.copyBookmark = function(bookmarkUrl) {
        toastr.warning('功能暂未实现。。。', "警告");
    }

    $scope.toggleMode = function() {
        $scope.edit = !$scope.edit;
        if (!$scope.edit) {
            getTags({});
        }
        setTimeout(updateEditPos, 100);
    }

    $scope.editTag = function(tag) {
        if (tag.name == "未分类") {
            toastr.warning('这个是系统默认分类，暂时不允许更新！', "警告");
            return;
        }
        tag.oldName = tag.name;
        tag.edit = true;
    }
    $scope.updateTag = function(tag) {
        tag.edit = false;
        var params = {
            id: tag.id,
            name: tag.name,
        }

        bookmarkService.updateTag(params)
            .then((data) => {
                if (data.retCode == 0) {
                    toastr.success(tag.name + ' 更新成功！', "提示");
                } else {
                    toastr.error(tag.name + ' 更新失败！错误提示：' + data.msg, "提示");
                    $scope.backTag(tag);
                }
            })
            .catch((err) => {
                toastr.error(tag.name + ' 更新失败！错误提示：' + err, "提示");
                $scope.backTag(tag);
            });
    }

    $scope.delTag = function(tag) {
        if (tag.name == "未分类") {
            toastr.warning('这个是系统默认分类，暂时不允许删除！', "警告");
            return;
        }
    }

    $scope.backTag = function(tag) {
        tag.edit = false;
        tag.name = tag.oldName;
    }

    function getTags(params) {
        bookmarkService.getTags(params)
            .then((data) => {
                $scope.tags = []
                data.forEach((tag) => {
                    tag.edit = false;
                    tag.oldName = tag.name;
                    $scope.tags.push(tag);
                })

                if (!$scope.currentTagId && $scope.tags.length > 0) {
                    $scope.currentTagId = $scope.tags[0].id;
                    $scope.tags[0].bookmarkClicked = true;
                }

                if ($scope.currentTagId) {
                    $scope.getBookmarks($scope.currentTagId, 1);
                } else {
                    toastr.info('您还没有书签分类，请点击菜单栏的添加按钮进行添加', "提示");
                }
            })
            .catch((err) => console.log('getTags err', err));

        pubSubService.publish('Common.menuActive', {
            login: true,
            index: 1
        });
    }

    // TODO: 我要将编辑按钮固定在容器的右上角
    $(window).resize(updateEditPos);
    setTimeout(updateEditPos, 100);

    function updateEditPos() {
        var top = $('.js-tags').offset().top;
        var left = $('.js-tags').offset().left;
        var width = $('.js-tags').width();
        // console.log('js-edit position update', top+10, left+width-10)
        $('.js-edit').offset({
            top: top + 10,
            left: left + width - 10,
        })
    }

}]);
