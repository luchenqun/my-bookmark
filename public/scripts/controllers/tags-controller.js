app.controller('tagsCtr', ['$scope', '$filter', '$window', '$stateParams', '$timeout', 'ngDialog', 'bookmarkService', 'pubSubService', function($scope, $filter, $window, $stateParams, $timeout, ngDialog, bookmarkService, pubSubService) {
    console.log("Hello tagsCtr...", $stateParams);
    getTags({});

    const perPageItems = 20;
    var dialog = null;
    $scope.loadBookmarks = false;
    $scope.tags = []; // 书签数据
    $scope.tagsIndex = []; // 书签索引
    $scope.bookmarkClicked = false;
    $scope.bookmarks = [];
    $scope.bookmarkCount = 0;
    $scope.totalPages = 0;
    $scope.currentPage = 1;
    $scope.inputPage = '';
    $scope.currentTagId = ($stateParams && $stateParams.tagId) || '';
    $scope.edit = false;
    $scope.waitDelTag = {};
    $scope.waitDelBookmark = {};

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

    $scope.delBookmark = function(bookmark) {
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
        if (tag.name == tag.oldName) {
            toastr.warning('您没有编辑分类', "警告");
            return;
        }
        tag.edit = false;
        var params = {
            id: tag.id,
            name: tag.name,
        }

        bookmarkService.updateTagName(params)
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
        console.log('delTag..........')
        $scope.waitDelTag = $.extend(true, {}, tag); // 利用jQuery执行深度拷贝
        dialog = ngDialog.open({
            template: './views/dialog-del-tag.html',
            className: 'ngdialog-theme-default',
            scope: $scope
        });
    }

    $scope.confirmDelTag = function(tagId, tagName) {
        console.log(tagId);
        ngDialog.close(dialog);
        var params = {
            del: tagName == '未分类' ? false : true,
            id: tagId,
        }
        bookmarkService.delTag(params)
            .then((data) => {
                if (data.retCode == 0) {
                    toastr.success('分类删除成功！将自动更新分类信息', "提示");
                    getTags({});
                } else {
                    toastr.error('分类删除失败！', "提示");
                    getTags({});
                }
            })
            .catch((err) => {
                toastr.error('分类删除失败！错误提示：' + JSON.stringify(err), "提示");
                getTags({});
            });
    }

    $scope.backTag = function(tag) {
        tag.edit = false;
        tag.name = tag.oldName;
    }

    $scope.storeTagIndex = function() {
        $scope.tagsIndex = [];
        $scope.tags.forEach((tag, index) => {
            $scope.tagsIndex[index] = {
                id: tag.id,
                index: index,
            }
        })
        console.log('storeTagIndex');
    }

    $scope.updateTagIndex = function() {
        // 要开个timer，因为释放鼠标模型还没更新
        setTimeout(function() {
            var needUpdate = false;
            for (var i = 0; i < $scope.tags.length; i++) {
                if ($scope.tags[i].id != $scope.tagsIndex[i].id) {
                    needUpdate = true;
                }
                $scope.tagsIndex[i] = {
                    id: $scope.tags[i].id,
                    index: i,
                }
            }
            if (needUpdate) {
                bookmarkService.updateTagsIndex($scope.tagsIndex)
                    .then((data) => {
                        if (data.retCode == 0) {
                            toastr.success('分类排序更新成功！', "提示");
                        } else {
                            toastr.error('分类排序更新失败！', "提示");
                            getTags({});
                        }
                    })
                    .catch((err) => {
                        toastr.error('分类排序更新失败！错误提示：' + JSON.stringify(err), "提示");
                        getTags({});
                    });
            }
            console.log('updateTagIndex needUpdate = ' + needUpdate)
        }, 300)
    }

    function getTags(params) {
        bookmarkService.getTags(params)
            .then((data) => {
                $scope.tags = []
                var find = false;
                data.forEach((tag) => {
                    tag.edit = false;
                    tag.oldName = tag.name;
                    $scope.tags.push(tag);
                    if (tag.id == $scope.currentTagId) {
                        find = true; // 如果是删了分类返回来，那么要重新默认选中第一个分类
                    }
                })
                if (!find) $scope.currentTagId = null;
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
    setTimeout(updateEditPos, 500);
    setTimeout(updateEditPos, 1000);
    setTimeout(updateEditPos, 10000);

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
