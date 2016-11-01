app.controller('loginCtr', ['$scope', '$filter', '$state', 'bookmarkService', 'pubSubService', function($scope, $filter, $state, bookmarkService, pubSubService) {
    console.log("Hello loginCtr...");

    $scope.userName = "";
    $scope.pwd = "";
    $scope.showErr = false;
    $scope.errInfo = '';

    $scope.login = function() {
        var atuoLogin = $('.ui.checkbox.js-auto-login').checkbox('is checked');
        if (!$scope.userName || !$scope.pwd) {
            $scope.showErr = true;
            $scope.errInfo = '用户明或者密码不能为空！';
        } else {
            $scope.showErr = false;
            $scope.errInfo = '';
            console.log($scope.userName, $scope.pwd, atuoLogin);
        }
    }

    // login({
    //     userName: 'luchenqun',
    //     pwd: '123456',
    // });
    //
    // function login(params) {
    //     bookmarkService.login(params).then(
    //         function(data) {
    //             console.log(data);
    //             if (data.logined) {
    //                 pubSubService.publish('loginCtr.login', {
    //                     'login': data.logined,
    //                 });
    //                 $state.go('bookmarks', {
    //                     showStyle: 'navigate',
    //                 })
    //             } else {
    //                 console.log('login failed......................')
    //             }
    //         },
    //         function(errorMsg) {
    //             console.log(errorMsg);
    //         }
    //     );
    // }

}]);
