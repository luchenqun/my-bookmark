app.controller('homeCtr', ['$scope', '$stateParams', '$filter', '$window', 'bookmarkService', 'pubSubService', function($scope, $stateParams, $filter, $window, bookmarkService, pubSubService) {
    console.log('Hello homeCtr......');
    var params = {
        a: 1111
    };
    bookmarkService.autoLogin(params).then(
        function(data) {
            console.log(data);
        },
        function(errorMsg) {
            console.log(errorMsg);
        }
    );
}]);
