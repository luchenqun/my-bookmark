app.controller('homeCtr', ['$scope', '$stateParams', '$filter', '$window', 'bookmarkService', 'pubSubService', function($scope, $stateParams, $filter, $window, bookmarkService, pubSubService) {
    console.log('Hello homeCtr......');
    var params = {
        userName: 'luchenqun',
        pwd: '123456',
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
