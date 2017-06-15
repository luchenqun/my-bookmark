app.controller('editCtr', ['$scope', '$state', '$timeout', '$document', 'ngDialog', 'bookmarkService', 'pubSubService', 'dataService', function($scope, $state, $timeout, $document, ngDialog, bookmarkService, pubSubService, dataService) {
    console.log("Hello editCtr");
    var maxSelections = 3;
    var dialog = null;
    var cancelDefault = false;
    init();

    $scope.$watch('url', function(newUrl, oldUrl, scope) {
        $timeout(function() {
            $scope.urlError = $scope.url == '' && $('.ui.modal.js-add-bookmark').modal('is active');
        });
        if ($scope.autoGettitle) {
            $scope.title = "";
            if (/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/.test(newUrl)) {
                var params = {
                    url: newUrl,
                    requestId: 0,
                }
                bookmarkService.getArticle(params)
                    .then((data) => $scope.title = data.title)
                    .catch((err) => console.log('getTitle err', err))
            }
        }
    });

    $scope.$watch('description', function(newDescription, oldDescription, scope) {
        setTimeout(function() {
            $('.ui.modal.js-add-bookmark').modal("refresh");
        }, 500);
    });

    $scope.$watch('title', function(newValue, oldValue, scope) {
        $timeout(function() {
            $scope.titleError = $scope.title == '' && $('.ui.modal.js-add-bookmark').modal('is active');
        });
    });

    $scope.addTags = function() {
        console.log('Hello , you have click add tag btn......');

        // 先将中文逗号替换成英文逗号，然后将多个英文逗号换成一个英文逗号
        $scope.newTags = $scope.newTags.replace(/，/g, ",").replace(/,+/g, ",");
        var tags = $scope.newTags.split(",");
        var params = [];
        tags.forEach(function(tag) {
            tag = tag.replace(/(^\s*)|(\s*$)/g, '').replace(/\s+/g, ' '); // 去除前后空格，多个空格转为一个空格;
            // 过滤是""的情况
            if (tag) {
                params.push(tag);
            }
        });

        if (tags.length + $scope.tags.length >= 30) {
            toastr.error('标签个数总数不能超过30个！不允许再添加新分类，如有需求，请联系管理员。', "提示");
            return;
        }

        bookmarkService.addTags(params)
            .then((data) => {
                $scope.tags = data;
                pubSubService.publish('EditCtr.addTagsSuccess', data);
                $scope.newTags = '';
                toastr.success('[ ' + params.toString() + ' ]分类添加成功！', "提示");
                $timeout(() => {
                    // 将新增加的分类自动添加到下啦列表中
                    var count = 0;
                    params.forEach((tagName) => {
                        data.forEach((tag) => {
                            if (tagName == tag.name) {
                                if (count < maxSelections) {
                                    $('.ui.fluid.search.dropdown').dropdown('set selected', tag.id);
                                }
                                count++;
                            }
                        });
                    });
                });
            })
            .catch((err) => console.log('addTags err', err));
    }
    $scope.cancel = function() {
        $('.ui.modal.js-add-bookmark').modal('hide');
        $('.ui.modal.js-add-bookmark .ui.dropdown').dropdown('clear');

        init();
    }
    $scope.ok = function() {
        var selectedTags = [];
        $scope.tags.forEach((tag) => {
            if (tag.clicked) {
                selectedTags.push(tag.id);
            }
        });
        // console.log('Hello ok clicked', $scope.url, $scope.title, $scope.description, $scope.public, selectedTags, $scope.tags);
        $scope.urlError = $scope.url == '';
        $scope.titleError = $scope.title == '';
        $scope.tagsError = (selectedTags.length == 0 || selectedTags.length > maxSelections);
        var params = {
            id: $scope.id,
            url: $scope.url,
            title: $scope.title,
            public: $('.ui.checkbox.js-public').checkbox('is checked') ? '1' : '0',
            tags: selectedTags,
            description: $scope.description
        }
        if (!/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/.test($scope.url)) {
            toastr.error('检撤到您的书签链接非法，是否忘记加http或者https了？建议直接从打开浏览器地址栏复制出来直接粘贴到输入框。', "错误");
            return;
        }
        if (selectedTags.length < 1 || $scope.tagsError) {
            toastr.error('您至少要选择一个分类！最多选择三个分类！如果暂时没想到放到哪个分类，可以先选择未分类', "错误");
            return;
        }
        if ($scope.titleError) {
            toastr.error('书签标题不能为空！', "错误");
            return;
        }
        console.log("add bookmark", params);
        if ($scope.add) {
            bookmarkService.addBookmark(params)
                .then((data) => {
                    $('.ui.modal.js-add-bookmark').modal('hide');
                    pubSubService.publish('EditCtr.inserBookmarsSuccess', data);
                    console.log(JSON.stringify(data));
                    if (data.title) {
                        toastr.success('[ ' + data.title + ' ] 添加成功，将自动重新更新书签！</br>' + (data.update ? '系统检测到该书签之前添加过，只更新链接，描述，标题，分类。创建日期与最后点击日期不更新！' : ''), "提示");
                    } else {
                        toastr.error('[ ' + params.title + ' ] 添加失败', "提示");
                    }
                })
                .catch((err) => {
                    console.log('addBookmark err', err);
                    toastr.error('[ ' + params.title + ' ] 添加失败' + JSON.stringify(err), "提示");
                });
        } else {
            bookmarkService.updateBookmark(params)
                .then((data) => {
                    $('.ui.modal.js-add-bookmark').modal('hide');
                    pubSubService.publish('EditCtr.inserBookmarsSuccess', data);
                    toastr.success('[ ' + params.title + ' ] 更新成功，将自动重新更新书签！', "提示");
                })
                .catch((err) => {
                    console.log('updateBookmark err', err);
                    toastr.error('[ ' + params.title + ' ] 更新失败' + JSON.stringify(err), "提示");
                });
        }
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
        if ($scope.tags.length >= 30) {
            toastr.error('标签个数总数不能超过30个！不允许再添加新分类，如有需求，请联系管理员。', "提示");
            return;
        }
        tag = tag.replace(/(^\s*)|(\s*$)/g, '').replace(/\s+/g, ' '); // 去除前后空格，多个空格转为一个空格;
        if (tag) {
            ngDialog.close(dialog);

            var tags = [];
            tags.push(tag);
            bookmarkService.addTags(tags)
                .then((data) => {
                    console.log(JSON.stringify(data));
                    toastr.success('[ ' + tag + ' ]插入分类成功！将自动更新分类信息', "提示");
                    // getTags({});
                })
                .catch((err) => {
                    toastr.warning('[ ' + tag + ' ]插入分类失败：' + JSON.stringify(err), "提示");
                });
        } else {
            toastr.warning('您可能没有输入分类或者输入的分类有误', "提示");
        }
    }

    $scope.clickTag = function(id, clicked) {
        var clickTag = null;
        var currCntTag = 0;
        $scope.tags.forEach((tag) => {
                if (tag.id == id) {
                    clickTag = tag;
                }
                currCntTag += Number(tag.clicked);
            })
            // 如果是新增书签，而且是第一次点其他选项，那么取消默认选中的分类
        if (cancelDefault && $scope.add && clicked && currCntTag == 1) {
            $scope.tags[0].clicked = false;
            currCntTag -= 1;
            cancelDefault = false; // 后面在点就不取消默认的了
        }

        currCntTag += Number(clicked);
        if (currCntTag <= 3) {
            if (clickTag) {
                clickTag.clicked = clicked;
            }
        } else {
            toastr.error('您至少要选择一个分类！最多选择三个分类！' + currCntTag, "错误");
        }

    }

    pubSubService.subscribe('MenuCtr.showAddBookmarkMoadl', $scope, function(event, params) {
        console.log('subscribe MenuCtr.showAddBookmarkMoadl', params);
        $('.ui.modal.js-add-bookmark').modal({
            closable: false,
        }).modal('setting', 'transition', dataService.animation()).modal('show');
        $('.ui.modal.js-add-bookmark .ui.dropdown').dropdown('clear');
        $('.ui.modal.js-add-bookmark .ui.dropdown').addClass('loading');
        $('.ui.checkbox.js-public').checkbox('set checked');
        cancelDefault = true;
        init();
        getTags({});
    });

    pubSubService.subscribe('bookmarksCtr.editBookmark', $scope, function(event, params) {
        console.log('subscribe bookmarksCtr.editBookmark', params);
        $('.ui.modal.js-add-bookmark').modal({
            closable: false,
        }).modal('setting', 'transition', dataService.animation()).modal('show');
        setTimeout(function() {
            $('.ui.modal.js-add-bookmark').modal("refresh");
        }, 500);
        $('.ui.modal.js-add-bookmark .ui.dropdown').dropdown('clear');
        $('.ui.modal.js-add-bookmark .ui.dropdown').addClass('loading');
        $scope.add = false;
        bookmarkService.getBookmark(params)
            .then((data) => {
                console.log('getBookmark ', data);

                var bookmark = data.bookmark;
                $scope.autoGettitle = false;
                $scope.id = (bookmark && bookmark.id) || '';
                $scope.url = (bookmark && bookmark.url) || '';
                $scope.title = (bookmark && bookmark.title) || '';
                $scope.description = (bookmark && bookmark.description) || '';
                $scope.tags = data.tags.map((tag) => {
                    tag.clicked = false;
                    return tag;
                });
                $scope.public = (bookmark && bookmark.id) || '1';
                $('.ui.checkbox.js-public').checkbox((bookmark && bookmark.public && bookmark.public == '1') ? 'set checked' : 'set unchecked')

                $timeout(function() {
                    data.bookmarkTags.forEach((tagId) => {
                        $scope.tags.forEach((tag) => {
                            if (tag.id == tagId) {
                                tag.clicked = true;
                            }
                        })
                    });
                });

                $('.ui.modal.js-add-bookmark .ui.dropdown').removeClass('loading');
            })
            .catch((err) => console.log('updateBookmark err', err));
    });

    pubSubService.subscribe('TagCtr.storeBookmark', $scope, function(event, bookmark) {
        console.log('TagCtr.storeBookmark', bookmark);
        $('.ui.modal.js-add-bookmark').modal({
            closable: false,
        }).modal('setting', 'transition', dataService.animation()).modal('show');
        $('.ui.modal.js-add-bookmark .ui.dropdown').dropdown('clear');
        $('.ui.modal.js-add-bookmark .ui.dropdown').addClass('loading');
        $('.ui.checkbox.js-public').checkbox('set checked');
        init();
        getTags({});
        $scope.autoGettitle = false;
        $scope.url = bookmark.url;
        $scope.title = bookmark.title;
        if (bookmark.tags && bookmark.tags.length >= 1) {
            $scope.newTags = bookmark.tags.map((item) => item.name).toString();
        }
    });

    // 在输入文字的时候也会触发，所以不要用Ctrl,Shift之类的按键
    $document.bind("keydown", function(event) {
        $scope.$apply(function() {
            var menusScope = $('div[ng-controller="menuCtr"]').scope();
            var key = event.key.toUpperCase();
            // console.log(key);
            if (key == 'INSERT' && menusScope.login) {
                if ($('.ui.modal.js-add-bookmark').modal('is active')) {
                    $scope.ok();
                } else {
                    $('.ui.modal.js-add-bookmark').modal({
                        closable: false,
                    }).modal('setting', 'transition', dataService.animation()).modal('show');
                    $('.ui.modal.js-add-bookmark .ui.dropdown').dropdown('clear');
                    $('.ui.modal.js-add-bookmark .ui.dropdown').addClass('loading');
                    $('.ui.checkbox.js-public').checkbox('set checked');
                    cancelDefault = true;
                    init();
                    getTags({});
                }
            }

            // Esc按键，退出
            if (key == 'ESCAPE' && menusScope.login) {
                $scope.cancel();
            }
        })
    });

    function getTags(params) {
        bookmarkService.getTags(params)
            .then((data) => {
                data.sort((a, b) => {
                    if (a.last_use > b.last_use) return -1;
                    return 1;
                })
                data.forEach((tag) => {
                    tag.clicked = false;
                })
                if ($scope.add && data.length >= 1) {
                    data[0].clicked = true;
                }
                $scope.tags = data;
                initJsTags();
                $('.ui.modal.js-add-bookmark .ui.dropdown').removeClass('loading');
            })
            .catch((err) => console.log('getTags err', err));
    }

    function initJsTags() {
        setTimeout(function() {
            $('.ui.modal.js-add-bookmark .ui.dropdown').removeClass('loading');
            $('.ui.dropdown.js-tags').dropdown({
                forceSelection: false,
                maxSelections: maxSelections,
                action: 'combo',
                onChange: function(value, text, $choice) {
                    var selectedTags = $('.ui.modal.js-add-bookmark .ui.dropdown').dropdown('get value');
                    $timeout(function() {
                        $scope.tagsError = (selectedTags.length == 0 || selectedTags.length > maxSelections) && ($('.ui.modal.js-add-bookmark').modal('is active'));
                    });
                }
            });
        }, 1000)
    }

    function init() {
        $scope.add = true;
        $scope.autoGettitle = true;
        $scope.id = '';
        $scope.url = '';
        $scope.title = '';
        $scope.description = '';
        $scope.newTags = '';
        $scope.tags = []; // tag = {id:xxx, name:'yyy'}

        $scope.urlError = false;
        $scope.titleError = false;
        $scope.tagsError = false;

        $scope.public = '1';
    }
}]);
