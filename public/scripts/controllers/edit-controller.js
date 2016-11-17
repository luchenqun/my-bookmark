app.controller('editCtr', ['$scope', '$state', '$timeout', 'bookmarkService', 'pubSubService', function($scope, $state, $timeout, bookmarkService, pubSubService) {
    console.log("Hello editCtr");
    var maxSelections = 3;
    init();

    $scope.$watch('url', function(newUrl, oldUrl, scope) {
        $timeout(function() {
            $scope.urlError = $scope.url == '' && $('.ui.modal.js-add-bookmark').modal('is active');
        });
        if ($scope.add) {
            $scope.title = "";
            if (/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/.test(newUrl)) {
                var params = {
                    url: newUrl,
                }
                bookmarkService.getTitle(params)
                    .then((data) => $scope.title = data.title)
                    .catch((err) => console.log('getTitle err', err))
            }
        }
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

        bookmarkService.addTags(params)
            .then((data) => {
                $scope.tags = data;
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
        console.log('Hello , you have click cancel btn......');
        $('.ui.modal.js-add-bookmark').modal('hide');
        $('.ui.modal.js-add-bookmark .ui.dropdown').dropdown('clear');

        init();
    }
    $scope.ok = function() {
        var selectedTags = $('.ui.modal.js-add-bookmark .ui.dropdown').dropdown('get value');
        console.log('Hello ok clicked', $scope.url, $scope.title, $scope.description, $scope.public, selectedTags);
        $scope.urlError = $scope.url == '';
        $scope.titleError = $scope.title == '';
        $scope.tagsError = (selectedTags.length == 0 || selectedTags.length > maxSelections);
        var params = {
            id: $scope.id,
            url: $scope.url,
            title: $scope.title,
            public: '1',
            tags: selectedTags,
            description: $scope.description
        }
        if ($scope.add) {
            bookmarkService.addBookmark(params)
                .then((data) => {
                    $('.ui.modal.js-add-bookmark').modal('hide');
                    pubSubService.publish('EditCtr.inserBookmarsSuccess', data);
                })
                .catch((err) => console.log('addBookmark err', err));
        } else {
            bookmarkService.updateBookmark(params)
                .then((data) => {
                    $('.ui.modal.js-add-bookmark').modal('hide');
                    pubSubService.publish('EditCtr.inserBookmarsSuccess', data);
                })
                .catch((err) => console.log('updateBookmark err', err));
        }
    }

    pubSubService.subscribe('MenuCtr.showAddBookmarkMoadl', $scope, function(event, params) {
        console.log('subscribe MenuCtr.showAddBookmarkMoadl', params);
        $('.ui.modal.js-add-bookmark').modal({
            closable: false,
        }).modal('show');
        $('.ui.modal.js-add-bookmark .ui.dropdown').dropdown('clear');
        $('.ui.modal.js-add-bookmark .ui.dropdown').addClass('loading');
        init();
        var params = {
            user_id: 1
        };
        getTags(params);
    });

    pubSubService.subscribe('bookmarksCtr.editBookmark', $scope, function(event, params) {
        console.log('subscribe bookmarksCtr.editBookmark', params);
        $('.ui.modal.js-add-bookmark').modal({
            closable: false,
        }).modal('show');
        $('.ui.modal.js-add-bookmark .ui.dropdown').dropdown('clear');
        $('.ui.modal.js-add-bookmark .ui.dropdown').addClass('loading');
        $scope.add = false;
        bookmarkService.getBookmark(params)
            .then((data) => {
                console.log('getBookmark ', data);

                var bookmark = data.bookmark;
                $scope.id = (bookmark && bookmark.id) || '';
                $scope.url = (bookmark && bookmark.url) || '';
                $scope.title = (bookmark && bookmark.title) || '';
                $scope.description = (bookmark && bookmark.description) || '';
                $scope.tags = data.tags;
                $scope.public = (bookmark && bookmark.id) || '1';

                $timeout(function() {
                    data.bookmarkTags.forEach((tagId) => {
                        $('.ui.fluid.search.dropdown').dropdown('set selected', tagId);
                    });
                });

                $('.ui.modal.js-add-bookmark .ui.dropdown').removeClass('loading');
            })
            .catch((err) => console.log('updateBookmark err', err));
    });

    function getTags(params) {
        bookmarkService.getTags(params)
            .then((data) => {
                $scope.tags = data;
                $('.ui.modal.js-add-bookmark .ui.dropdown').removeClass('loading');
            })
            .catch((err) => console.log('getTags err', err));
    }

    // 元素构造完成之后，开始使用jquery初始化
    $scope.$on('viewContentLoaded', function(elementRenderFinishedEvent) {
        console.log('edit ui dropdown viewContentLoaded')
        $('.ui.modal.js-add-bookmark .ui.dropdown').removeClass('loading');
        $('.ui.dropdown').dropdown({
            forceSelection: false,
            maxSelections: maxSelections,
            action: 'hide',
            onChange: function(value, text, $choice) {
                var selectedTags = $('.ui.modal.js-add-bookmark .ui.dropdown').dropdown('get value');
                $timeout(function() {
                    $scope.tagsError = (selectedTags.length == 0 || selectedTags.length > maxSelections) && ($('.ui.modal.js-add-bookmark').modal('is active'));
                });
            }
        });
    });

    function init() {
        $scope.add = true;
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
