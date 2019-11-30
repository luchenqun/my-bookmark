app.controller('tagsCtr', ['$scope', '$filter', '$state', '$window', '$stateParams', '$timeout', '$document', 'ngDialog', 'bookmarkService', 'pubSubService', 'dataService', function ($scope, $filter, $state, $window, $stateParams, $timeout, $document, ngDialog, bookmarkService, pubSubService, dataService) {
    console.log("Hello tagsCtr...", $stateParams);
    if(dataService.smallDevice()){
        $window.location = "http://m.mybookmark.cn/#/tags";
        return;
    }

    getTags({});

    var perPageItems = 20;
    var dialog = null;
    var forbidTransition = false;
    var addBookmarkId = -1;
    $scope.hoverBookmark = null;
    $scope.order = [false, false, false];
    $scope.order[($stateParams && $stateParams.orderIndex) || 1] = true;
    $scope.loadBookmarks = false;
    $scope.loadTags = false;
    $scope.tags = []; // 书签数据
    $scope.tagsIndex = []; // 书签索引
    $scope.bookmarkClicked = false;
    $scope.bookmarksByTag = [];
    $scope.bookmarkCount = 0;
    $scope.totalPages = 0;
    $scope.currentPage = 1;
    $scope.inputPage = '';
    $scope.currentTagId = ($stateParams && $stateParams.tagId) || '';
    $scope.editMode = false;
    $scope.showMode = 'item';
    $scope.newTag = '';
    $scope.waitDelTag = {};
    $scope.waitDelBookmark = {};
    $scope.bookmarkData = {};
    $scope.bookmarkNormalHover = false;
    $scope.costomTag = {
        id: -1,
        cnt: 50,
        bookmarkClicked: false,
        name: '个人定制',
    }
    $scope.costomAllUsersTag = {
        id: -1,
        cnt: 50,
        bookmarkClicked: false,
        name: '全站定制',
    }

    var timeagoInstance = timeago();

    pubSubService.subscribe('MenuCtr.tags', $scope, function (event, data) {
        console.log('subscribe MenuCtr.tags', data);
        getTags({});
    });

    $scope.changeOrder = function (index) {
        if (index < 0 || index >= $scope.order.length) {
            return;
        }
        $scope.order = $scope.order.map(() => false);
        $scope.order[index] = true;
        $scope.bookmarksByTag = [];

        if ($scope.order[0]) {
            $scope.bookmarkData.bookmarks.sort(clickCmp);
            $scope.bookmarkData.bookmarks.forEach((bookmark) => {
                if (bookmark.type == 1) {
                    $scope.bookmarksByTag.push(bookmark);
                }
            })
        } else if ($scope.order[1]) {
            $scope.bookmarkData.bookmarks.sort((a, b) => a.created_at >= b.created_at ? -1 : 1);
            $scope.bookmarkData.bookmarks.forEach((bookmark) => {
                if (bookmark.type == 2) {
                    $scope.bookmarksByTag.push(bookmark);
                }
            })
        } else {
            $scope.bookmarkData.bookmarks.sort((a, b) => a.last_click >= b.last_click ? -1 : 1);
            $scope.bookmarkData.bookmarks.forEach((bookmark) => {
                if (bookmark.type == 3) {
                    $scope.bookmarksByTag.push(bookmark);
                }
            })
        }

        $timeout(function () {
            timeagoInstance.cancel();
            timeagoInstance.render(document.querySelectorAll('.need_to_be_rendered'), 'zh_CN');
        }, 100)
    }

    $scope.getBookmarks = function (tagId, currentPage) {
        console.log(tagId, currentPage)
        $scope.bookmarkClicked = true;
        $scope.currentTagId = tagId;
        $scope.currentPage = currentPage;
        if (!forbidTransition) {
            $scope.loadBookmarks = true;
        }
        $scope.costomTag.bookmarkClicked = false;
        $scope.costomAllUsersTag.bookmarkClicked = false;

        perPageItems = ($scope.showMode == 'item') ? 50 : 20;

        $scope.tags.forEach(function (tag) {
            tag.bookmarkClicked = false;
            if (tag.id == tagId) {
                tag.bookmarkClicked = true;
            }
        });

        if (tagId == -1) {
            $scope.costomTag.bookmarkClicked = true;
        }

        if (tagId == -2) {
            $scope.costomAllUsersTag.bookmarkClicked = true;
        }

        var params = {
            tagId: tagId,
            currentPage: currentPage,
            perPageItems: perPageItems,
        };
        if (!forbidTransition) {
            $($scope.showMode == 'item' ? '.js-tag-costomTag' : '.js-tags-table').transition('hide');
        }
        bookmarkService.getBookmarksByTag(params)
            .then((data) => {
                $scope.bookmarkData = data;
                $scope.changeOrder($scope.order.indexOf(true));
                $scope.bookmarkCount = $scope.bookmarkData.totalItems;
                $scope.totalPages = tagId <= -1 ? 1 : Math.ceil($scope.bookmarkCount / perPageItems);

                $scope.inputPage = '';
                $scope.loadBookmarks = false;

                pubSubService.publish('Common.menuActive', {
                    login: true,
                    index: dataService.LoginIndexTags
                });
                if (!forbidTransition) {
                    dataService.transition($scope.showMode == 'item' ? '.js-tag-costomTag' : '.js-tags-table');
                }
                $timeout(function () {
                    dataService.transition('#' + addBookmarkId, {
                        duration: 1000,
                    });
                    addBookmarkId = -1;
                }, 1000);
                forbidTransition = false;
            })
            .catch((err) => {
                console.log('getTags err', err);
                $scope.loadBookmarks = false;
                forbidTransition = false;
                addBookmarkId = -1;
            });
    };

    $scope.changeCurrentPage = function (currentPage) {
        currentPage = parseInt(currentPage) || 0;
        console.log(currentPage);
        if (currentPage <= $scope.totalPages && currentPage >= 1) {
            $scope.getBookmarks($scope.currentTagId, currentPage);
            $scope.currentPage = currentPage;
        }
    }

    $scope.jumpToUrl = function (url, id) {
        if (!$scope.editMode) {
            $window.open(url, '_blank');
            bookmarkService.clickBookmark({
                id: id
            });
            $scope.bookmarkData.bookmarks.forEach(function (bookmark, index) {
                if (bookmark.id == id) {
                    bookmark.click_count += 1;
                    bookmark.last_click = $filter("date")(new Date(), "yyyy-MM-dd HH:mm:ss");
                }
            })
            // $scope.changeOrder($scope.order.indexOf(true));
            $timeout(function () {
                timeagoInstance.cancel();
                timeagoInstance.render(document.querySelectorAll('.need_to_be_rendered'), 'zh_CN');
            }, 100)
        }
    }

    $scope.delBookmark = function (bookmark) {
        $scope.waitDelBookmark = $.extend(true, {}, bookmark); // 利用jQuery执行深度拷贝
        console.log(JSON.stringify(bookmark));
        dialog = ngDialog.open({
            template: './views/dialog-del-bookmark.html',
            className: 'ngdialog-theme-default',
            scope: $scope
        });
    }

    $scope.confirmDelBookmark = function (bookmarkId) {
        var params = {
            id: bookmarkId
        }
        ngDialog.close(dialog);
        bookmarkService.delBookmark(params)
            .then((data) => {
                $("#" + bookmarkId).transition({
                    animation: dataService.animation(),
                    duration: 500,
                    onComplete: function () {
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

    $scope.editBookmark = function (bookmarkId) {
        pubSubService.publish('bookmarksCtr.editBookmark', {
            'bookmarkId': bookmarkId
        });
    }

    $scope.detailBookmark = function (bookmark) {
        bookmark.own = true;
        pubSubService.publish('TagCtr.showBookmarkInfo', bookmark);
        bookmarkService.clickBookmark({
            id: bookmark.id
        });
    }

    $scope.copy = function (url) {
        dataService.clipboard(url);
    }

    $scope.toggleMode = function (mode) {
        $scope.editMode = mode;
        if (!$scope.editMode) {
            getTags({});
        } else {
            $('.js-tags-table').transition('hide');
            $('.js-tag-costomTag').transition('hide');
            $('.stackable.cards .card').transition('hide');
            $('.stackable.cards .card').transition({
                animation: dataService.animation(),
                reverse: 'auto', // default setting
                interval: 50
            });
        }
    }

    $scope.toggleShowMode = function (showMode) {
        $scope.showMode = showMode;
        $scope.getBookmarks($scope.currentTagId, 1);
    }

    $scope.editTag = function (tag) {
        if (tag.name == "未分类" || tag.name == "收藏") {
            toastr.warning('这个是系统默认分类，暂时不允许更新名字！', "警告");
            return;
        }
        tag.oldName = tag.name;
        tag.edit = true;
    }
    
    $scope.updateTagShow = function (tag, show) {
        var params = {
            id: tag.id,
            show: show,
        }
        bookmarkService.updateTagShow(params)
            .then((data) => {
                if (data.retCode == 0) {
                    toastr.success(tag.name + ' 更新成功！', "提示");
                    tag.show = show;
                } else {
                    toastr.error(tag.name + ' 更新失败！错误提示：' + data.msg, "提示");
                }
            })
            .catch((err) => {
                toastr.error(tag.name + ' 更新失败！错误提示：' + err, "提示");
            });
    }

    $scope.updateTag = function (tag) {
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

    $scope.delTag = function (tag) {
        console.log('delTag..........')
        $scope.waitDelTag = $.extend(true, {}, tag); // 利用jQuery执行深度拷贝
        dialog = ngDialog.open({
            template: './views/dialog-del-tag.html',
            className: 'ngdialog-theme-default',
            scope: $scope
        });
    }

    $scope.confirmDelTag = function (tagId, tagName) {
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
                            animation: dataService.animation(),
                            duration: 500,
                            onComplete: function () {
                                $("#tag" + tagId).remove();
                                $scope.tags.splice(index, 1);
                            }
                        });
                    } else {
                        getTags({});
                    }
                } else {
                    toastr.error('[ ' + tagName + ' ]分类删除失败！' + data.msg, "提示");
                    getTags({});
                }
            })
            .catch((err) => {
                toastr.error('分类删除失败！错误提示：' + JSON.stringify(err), "提示");
                getTags({});
            });
    }

    $scope.showAddTag = function () {
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

    $scope.addTag = function (tag) {
        console.log(tag);
        if ($scope.tags.length >= 30) {
            toastr.error('标签个数总数不能超过30个！不允许再添加新分类，如有需求，请联系管理员。', "提示");
            return;
        }
        tag = tag.replace(/(^\s*)|(\s*$)/g, '').replace(/\s+/g, ' '); // 去除前后空格，多个空格转为一个空格;

        var exist = $scope.tags.some((item) => {
            return item.name == tag;
        })
        if (exist) {
            toastr.error('该分类【' + tag + '】已存在！', "提示");
            return;
        }

        if (tag) {
            ngDialog.close(dialog);

            var tags = [];
            tags.push(tag);
            bookmarkService.addTags(tags)
                .then((data) => {
                    toastr.success('[ ' + tag + ' ]插入分类成功！将自动更新分类信息<br />注意：分类页面只有分类下面有书签才显示分类', "提示");
                    getTags({});
                })
                .catch((err) => {
                    toastr.warning('[ ' + tag + ' ]插入分类失败：' + JSON.stringify(err), "提示");
                });
        } else {
            toastr.warning('您可能没有输入分类或者输入的分类有误', "提示");
        }
    }

    $scope.backTag = function (tag) {
        tag.edit = false;
        tag.name = tag.oldName;
    }

    $scope.storeTagIndex = function () {
        $scope.tagsIndex = [];
        $scope.tags.forEach((tag, index) => {
            $scope.tagsIndex[index] = {
                id: tag.id,
                index: index,
            }
        })
        console.log('storeTagIndex');
    }

    $scope.updateTagIndex = function () {
        // 要开个timer，因为释放鼠标模型还没更新
        setTimeout(function () {
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

    $scope.setHoverBookmark = function (bookmark) {
        $scope.hoverBookmark = bookmark;
    }

    // 在输入文字的时候也会触发，所以不要用Ctrl,Shift之类的按键
    $document.bind("keydown", function (event) {
        $scope.$apply(function () {
            var key = event.key.toUpperCase();
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
                if (!find && $scope.currentTagId !== -1 && $scope.currentTagId !== -2) {
                    $scope.currentTagId = -1;
                    $scope.costomTag.bookmarkClicked = true;
                }
                
                if ($scope.currentTagId) {
                    if (!$scope.editMode) {
                        $scope.getBookmarks($scope.currentTagId, $scope.currentPage);
                    }
                } else {
                    toastr.info('您还没有书签分类，请点击菜单栏的添加按钮进行添加', "提示");
                }
                $scope.loadTags = false;
                pubSubService.publish('Common.menuActive', {
                    login: true,
                    index: dataService.LoginIndexTags
                });
            })
            .catch((err) => {
                dataService.netErrorHandle(err, $state);
                $scope.loadTags = false;
            });
    }

    pubSubService.subscribe('EditCtr.inserBookmarsSuccess', $scope, function (event, data) {
        console.log('subscribe EditCtr.inserBookmarsSuccess', data);
        var menusScope = $('div[ng-controller="menuCtr"]').scope();
        if (menusScope.login && menusScope.selectLoginIndex == 1) {
            var find = false;
            $scope.bookmarkData.bookmarks.forEach((bookmark) => {
                if (bookmark.id == data.id) {
                    bookmark.title = data.title;
                    bookmark.url = data.url;
                    bookmark.tags = data.tags;
                    bookmark.description = data.description;
                    find = true;
                    if ($scope.order[bookmark.type - 1]) {
                        dataService.transition('#' + bookmark.id, {
                            duration: 1000,
                        });
                    }
                }
            })
            if (!find) {
                if (data.tags.map((tag) => tag.id).indexOf($scope.currentTagId) >= 0) {
                    if (!$scope.editMode) {
                        forbidTransition = true;
                        $scope.getBookmarks($scope.currentTagId, $scope.currentPage);
                    }
                    addBookmarkId = data.id;
                }
            }
        }
    });

    pubSubService.subscribe('EditCtr.addTagsSuccess', $scope, function (event, data) {
        console.log('subscribe EditCtr.addTagsSuccess', data);

        var menusScope = $('div[ng-controller="menuCtr"]').scope();
        if (menusScope.login && menusScope.selectLoginIndex == 1) {
            getTags({});
        }
    });

    setTimeout(() => {
        $('.js-tag-label .icon').popup();
    }, 3000);

    function clickCmp(a, b) {
        var click1 = parseInt(a.click_count);
        var click2 = parseInt(b.click_count);
        if (click1 > click2) {
            return -1;
        } else if (click1 == click2) {
            return a.url > b.url ? -1 : 1;
        } else {
            return 1;
        }
    }
}]);