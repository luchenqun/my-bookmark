app.controller('editCtr', ['$scope', '$state', '$timeout', 'bookmarkService', 'pubSubService', function($scope, $state, $timeout, bookmarkService, pubSubService) {
    var maxSelections = 3;
    console.log("Hello , editCtr...");
    init();
    semanticInit();

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
                bookmarkService.getTitle(params).then(
                    function(data) {
                        console.log(JSON.stringify(data));
                        $scope.title = data.title;
                    },
                    function(errorMsg) {}
                );
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

        bookmarkService.addTags(params).then(
            function(data) {
                $scope.tags = data;
                console.log(JSON.stringify(data));
                $timeout(function() {
                    var count = 0;
                    params.forEach(function(tagName) {
                        data.forEach(function(tag) {
                            if (tagName == tag.name) {
                                console.log(tag.id);
                                if (count < maxSelections) {
                                    $('.ui.fluid.search.dropdown').dropdown('set selected', tag.id);
                                }
                                count++;
                            }
                        });
                    });
                });
            },
            function(errorMsg) {}
        );
    }
    $scope.cancel = function() {
        console.log('Hello , you have click cancel btn......');
        $('.ui.modal.js-add-bookmark').modal('hide');
        $('.ui.modal.js-add-bookmark .ui.dropdown').dropdown('clear');

        init();
    }
    $scope.ok = function() {
        console.log('Hello , you have click ok btn......');
        var selectedTags = $('.ui.modal.js-add-bookmark .ui.dropdown').dropdown('get value');
        console.log($scope.url, $scope.title, $scope.description, $scope.public, selectedTags);
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
            bookmarkService.addBookmark(params).then(
                function(data) {
                    console.log(data);
                    $('.ui.modal.js-add-bookmark').modal('hide');
                    $state.go('bookmarks', {
                        foo: 'i love you',
                        bar: 'hello world'
                    });
                    pubSubService.publish('EditCtr.inserBookmarsSuccess', {
                        show: 'navigate'
                    });
                },
                function(errorMsg) {
                    console.log(errorMsg);
                }
            );
        } else {
            console.log('updateBookmark...........', params)
            bookmarkService.updateBookmark(params).then(
                function(data) {
                    console.log(data);
                    $('.ui.modal.js-add-bookmark').modal('hide');
                    $state.go('bookmarks', {
                        foo: 'i love you',
                        bar: 'hello world'
                    });
                    pubSubService.publish('EditCtr.inserBookmarsSuccess', {
                        show: 'navigate'
                    });
                },
                function(errorMsg) {
                    console.log(errorMsg);
                }
            );
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
        bookmarkService.getBookmark(params).then(
            function(data) {
                var bookmark = data.bookmark;
                $scope.add = false;

                $scope.id = (bookmark && bookmark.id) || '';
                $scope.url = (bookmark && bookmark.url) || '';
                $scope.title = (bookmark && bookmark.title) || '';
                $scope.description = (bookmark && bookmark.description) || '';
                // $scope.newTags = bookmark && bookmark.url && '';
                $scope.tags = data.tags;

                $timeout(function() {
                    data.bookmarkTags.forEach((tagId) => {
                        $('.ui.fluid.search.dropdown').dropdown('set selected', tagId);
                    });
                });

                $scope.public = '1';

                console.log(data);
                $('.ui.modal.js-add-bookmark .ui.dropdown').removeClass('loading');
            },
            function(errorMsg) {
                console.log(errorMsg);
            }
        );
    });

    function getTags(params) {
        bookmarkService.getTags(params).then(
            function(data) {
                $scope.tags = data;
                semanticInit();
                $('.ui.modal.js-add-bookmark .ui.dropdown').removeClass('loading');
            },
            function(errorMsg) {
                console.log(errorMsg);
            }
        );
    }

    function semanticInit() {
        setTimeout(() => {
            $('.ui.dropdown').dropdown({
                forceSelection: false,
                maxSelections: maxSelections,
                onChange: function(value, text, $choice) {
                    var selectedTags = $('.ui.modal.js-add-bookmark .ui.dropdown').dropdown('get value');
                    $timeout(function() {
                        $scope.tagsError = (selectedTags.length == 0 || selectedTags.length > maxSelections) && ($('.ui.modal.js-add-bookmark').modal('is active'));
                    });
                }
            });
        }, 1000);
    }

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
