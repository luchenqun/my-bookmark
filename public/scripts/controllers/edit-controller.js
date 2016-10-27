app.controller('editCtr', ['$scope', '$state', 'bookmarkService', 'pubSubService', function($scope, $state, bookmarkService, pubSubService) {
    console.log("Hello , I enter editCtr...");
    init();
    semanticInit();

    $scope.addTags = function() {
        console.log('Hello , you have click add tag btn......');
        $scope.newTags = $scope.newTags.replace("，", ",");
        var tags = $scope.newTags.split(",");
        var params = [];
        tags.forEach(function(tag) {
            tag = tag.replace(/(^\s*)|(\s*$)/g, '').replace(/\s+/g, ' '); // 去除前后空格，多个空格转为一个空格;

            var find = false;
            for (var i = 0; i < $scope.tags.length; i++) {
                if ($scope.tags[i].name === tag) {
                    find = true;
                    $('.ui.fluid.search.dropdown').dropdown('set selected', $scope.tags[i].id);
                }
            };
            if (!find) {
                params.push(tag);
            }
        });

        console.log(params);

    }
    $scope.cancel = function() {
        console.log('Hello , you have click cancel btn......');
    }
    $scope.ok = function() {
        console.log('Hello , you have click ok btn......');
        var selectedTags = $('.ui.modal.js-add-bookmark .ui.dropdown').dropdown('get value');
        console.log($scope.url, $scope.title, $scope.description, $scope.public, selectedTags);

        bookmarkService.addBookmark({
            a: 'Hello i love this world'
        }).then(
            function(data) {
                console.log(data);
            },
            function(errorMsg) {
                console.log(errorMsg);
            }
        );
    }

    pubSubService.subscribe('MenuCtr.showAddBookmarkMoadl', $scope, function(event, params) {
        console.log('subscribe MenuCtr.MenuCtr.showAddBookmarkMoadl', params);
        $('.ui.modal.js-add-bookmark').modal('show');
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
                maxSelections: 3,
            });
        }, 1000);
    }

    function init() {
        $scope.url = '';
        $scope.title = '';
        $scope.description = '';
        $scope.newTags = '';
        $scope.tags = []; // tag = {id:xxx, name:'yyy'}
        $scope.public = '1';
    }
}]);
