app.controller('editCtr', ['$scope', '$state', '$timeout', 'bookmarkService', 'pubSubService', function($scope, $state, $timeout, bookmarkService, pubSubService) {
    var maxSelections = 3;
    console.log("Hello , editCtr...");
    init();
    semanticInit();

    $scope.$watch('url', function(newValue, oldValue, scope) {
        $timeout(function() {
            $scope.urlError = $scope.url == '' && $('.ui.modal.js-add-bookmark').modal('is active');
        });
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
            params.push(tag);
        });

        console.log(params);
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
            url: $scope.url,
            title: $scope.title,
            public: '1',
            tags: selectedTags,
            description: $scope.description
        }

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
    }

    pubSubService.subscribe('MenuCtr.showAddBookmarkMoadl', $scope, function(event, params) {
        console.log('subscribe MenuCtr.MenuCtr.showAddBookmarkMoadl', params);
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
