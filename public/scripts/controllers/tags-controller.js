app.controller('tagsCtr', ['$scope', '$filter', '$window', '$stateParams', '$timeout', 'ngDialog', 'bookmarkService', 'pubSubService', function($scope, $filter, $window, $stateParams, $timeout, ngDialog, bookmarkService, pubSubService) {
    console.log("Hello tagsCtr...", $stateParams);
    getTags({});

    const perPageItems = 20;
    var dialog = null;
    $scope.order = [false, false, false];
    $scope.order[($stateParams && $stateParams.orderIndex) || 1] = true;
    $scope.loadBookmarks = false;
    $scope.loadTags = false;
    $scope.tags = []; // 书签数据
    $scope.tagsIndex = []; // 书签索引
    $scope.bookmarkClicked = false;
    $scope.bookmarks = [];
    $scope.bookmarkCount = 0;
    $scope.totalPages = 0;
    $scope.currentPage = 1;
    $scope.inputPage = '';
    $scope.currentTagId = ($stateParams && $stateParams.tagId) || '';
    $scope.editMode = false;
    $scope.newTag = '';
    $scope.waitDelTag = {};
    $scope.waitDelBookmark = {};
    $scope.bookmarkData = {};

    pubSubService.subscribe('MenuCtr.tags', $scope, function(event, data) {
        console.log('subscribe MenuCtr.tags', data);
        getTags({});
    });

    $scope.changeOrder = function(index) {
        if (index < 0 || index >= $scope.order.length) {
            return;
        }
        $scope.order = $scope.order.map(() => false);
        $scope.order[index] = true;
        if ($scope.order[0]) {
            $scope.bookmarks = $scope.bookmarkData.bookmarksClickCount;
        } else if ($scope.order[1]) {
            $scope.bookmarks = $scope.bookmarkData.bookmarksCreatedAt;
        } else {
            $scope.bookmarks = $scope.bookmarkData.bookmarksLatestClick;
        }
        $timeout(function() {
            var timeagoInstance = timeago();
            timeagoInstance.render(document.querySelectorAll('.need_to_be_rendered'), 'zh_CN');
        }, 100)
    }

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
        $('.js-tags-table').transition('hide');

        bookmarkService.getBookmarksByTag(params)
            .then((data) => {
                $scope.bookmarkData = data;
                $scope.changeOrder($scope.order.indexOf(true));
                $scope.bookmarkCount = $scope.bookmarkData.totalItems;
                $scope.totalPages = Math.ceil($scope.bookmarkCount / perPageItems);

                $scope.inputPage = '';
                $scope.loadBookmarks = false;

                pubSubService.publish('Common.menuActive', {
                    login: true,
                    index: 1
                });
                transition();
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
        if (!$scope.editMode) {
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
        console.log(JSON.stringify(bookmark));
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
                // 更新分类里面含有书签的数量
                $scope.tags.forEach((t1) => {
                    $scope.waitDelBookmark.tags.forEach((t2) => {
                        if (t1.id == t2.id) {
                            t1.cnt--;
                        }
                    })
                })
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
        bookmark.own = true;
        pubSubService.publish('TagCtr.showBookmarkInfo', bookmark);
        bookmarkService.clickBookmark({
            id: bookmark.id
        });
    }

    $scope.copy = function(id, url) {
        var clipboard = new Clipboard('#tagurl' + id, {
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

    $scope.toggleMode = function() {
        $scope.editMode = !$scope.editMode;
        if (!$scope.editMode) {
            getTags({});
        } else {
            $('.js-edit').transition('hide'); // 没装完逼之前，不允许切换编辑模式，否则动画模式乱了。
            $('.js-tags-table').transition('hide');
            $('.stackable.cards .card').transition('hide');
            $('.stackable.cards .card').transition({
                animation: animation(),
                reverse: 'auto', // default setting
                interval: 50,
                onComplete: function() {
                    $('.js-edit').transition('show');
                }
            });
        }
        updateEditPos();
    }

    $scope.editTag = function(tag) {
        if (tag.name == "未分类" || tag.name == "收藏") {
            toastr.warning('这个是系统默认分类，暂时不允许更新名字！', "警告");
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
        ngDialog.close(dialog);
        var params = {
            del: (tagName == '未分类' || tagName == "收藏") ? false : true,
            id: tagId,
        }
        bookmarkService.delTag(params)
            .then((data) => {
                if (data.retCode == 0) {
                    toastr.success('[ ' + tagName + ' ]分类删除成功！', "提示");
                    var index = -1;
                    $scope.tags.forEach((tag, i) => {
                        if (tag.id == tagId) {
                            index = i;
                        }
                    })
                    if (index !== -1 && tagName != '未分类' && tagName != "收藏") {
                        $("#tag" + tagId).transition({
                            animation: animation(),
                            duration: 500,
                            onComplete: function() {
                                $("#tag" + tagId).remove();
                                $scope.tags.splice(index, 1);
                            }
                        });
                    } else {
                        getTags({});
                    }
                } else {
                    toastr.error('[ ' + tagName + ' ]分类删除失败！', "提示");
                    getTags({});
                }
            })
            .catch((err) => {
                toastr.error('分类删除失败！错误提示：' + JSON.stringify(err), "提示");
                getTags({});
            });
    }

    $scope.showAddTag = function() {
        if ($scope.tags.length < 30) {
            console.log('showAddTag..........')
            $scope.newTag = "";
            dialog = ngDialog.open({
                template: './views/dialog-add-tag.html',
                className: 'ngdialog-theme-default',
                scope: $scope
            });
        } else {
            toastr.error('标签个数总数不能超过30个！不允许再添加新分类，如有需求，请联系管理员。', "提示");
        }
    }

    $scope.addTag = function(tag) {
        console.log(tag);
        tag = tag.replace(/(^\s*)|(\s*$)/g, '').replace(/\s+/g, ' '); // 去除前后空格，多个空格转为一个空格;
        if (tag) {
            ngDialog.close(dialog);

            var tags = [];
            tags.push(tag);
            bookmarkService.addTags(tags)
                .then((data) => {
                    toastr.success('[ ' + tag + ' ]插入分类成功！将自动更新分类信息', "提示");
                    getTags({});
                })
                .catch((err) => {
                    toastr.warning('[ ' + tag + ' ]插入分类失败：' + JSON.stringify(err), "提示");
                });
        } else {
            toastr.warning('您可能没有输入分类或者输入的分类有误', "提示");
        }
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
        $scope.loadTags = true;
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
                    if (!$scope.editMode) {
                        $scope.getBookmarks($scope.currentTagId, $scope.currentPage);
                    }
                } else {
                    toastr.info('您还没有书签分类，请点击菜单栏的添加按钮进行添加', "提示");
                }
                $scope.loadTags = false;
                updateEditPos();
            })
            .catch((err) => {
                console.log('getTags err', err);
                $scope.loadTags = false;
                updateEditPos();
            });

        pubSubService.publish('Common.menuActive', {
            login: true,
            index: 1
        });
    }

    pubSubService.subscribe('EditCtr.inserBookmarsSuccess', $scope, function(event, data) {
        console.log('subscribe EditCtr.inserBookmarsSuccess', data);

        var menusScope = $('div[ng-controller="menuCtr"]').scope();
        if (menusScope.login && menusScope.selectLoginIndex == 1) {
            getTags({});
        }
    });

    pubSubService.subscribe('EditCtr.addTagsSuccess', $scope, function(event, data) {
        console.log('subscribe EditCtr.addTagsSuccess', data);

        var menusScope = $('div[ng-controller="menuCtr"]').scope();
        if (menusScope.login && menusScope.selectLoginIndex == 1) {
            getTags({});
        }
    });

    // TODO: 我要将编辑按钮固定在容器的右上角
    $(window).resize(updateEditPos);
    updateEditPos();

    function updateEditPos() {
        for (var i = 1; i <= 100; i += 10) {
            setTimeout(function() {
                var offset = $('.js-tags').offset();
                if (offset) {
                    var t = offset.top;
                    var l = offset.left;
                    var w = $('.js-tags').width();
                    $('.js-edit').offset({
                        top: t + 10,
                        left: l + w - 10,
                    })
                }
            }, 100 * i)
        }
    }

    function animation() {
        var data = ['scale', 'fade', 'fade up', 'fade down', 'fade left', 'fade right', 'horizontal flip',
            'vertical flip', 'drop', 'fly left', 'fly right', 'fly up', 'fly down', 'swing left', 'swing right', 'swing up',
            'swing down', 'browse', 'browse right', 'slide down', 'slide up', 'slide left', 'slide right'
        ];
        var t = data[parseInt(Math.random() * 1000) % data.length];

        return t;
    }

    function transition() {
        var className = 'js-tags-table';
        $('.' + className).transition('hide');
        $('.' + className).transition({
            animation: animation(),
            duration: 500,
        });
    }
}]);
