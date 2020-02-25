app.controller('homeCtr', ['$scope', '$stateParams', '$filter', '$state', '$window', 'bookmarkService', 'pubSubService', 'dataService', function ($scope, $stateParams, $filter, $state, $window, bookmarkService, pubSubService, dataService) {
    console.log('Hello homeCtr......');
    if (dataService.smallDevice()) {
        $window.location = "http://m.mybookmark.cn/#/tags";
        return;
    }
    $state.go('bookmarks');
}]);
