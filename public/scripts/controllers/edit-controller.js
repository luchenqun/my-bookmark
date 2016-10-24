app.controller('editCtr', ['$scope', '$state', function($scope, $state) {
    semanticInit();

    $scope.addTag = function() {
        console.log('Hello , you have click add tag btn......')
    }

    function semanticInit() {
        $('.ui.dropdown').dropdown({
            forceSelection: false,
        });
    }
}]);
