app.controller('loginCtr', ['$scope', '$filter', '$state', '$cookieStore', 'bookmarkService', 'pubSubService', function($scope, $filter, $state, $cookieStore, bookmarkService, pubSubService) {
    console.log("Hello loginCtr...", $cookieStore.get("username"), $cookieStore.get("password"));

    pubSubService.publish('Common.menuActive', {
        login: false,
        index: 1
    });

    $scope.username = $cookieStore.get("username") || "";
    $scope.password = $cookieStore.get("password") || "";
    $scope.showErr = false;
    $scope.errInfo = '';

    $scope.login = function() {
        var autoLogin = $('.ui.checkbox.js-auto-login').checkbox('is checked');
        if (!$scope.username || !$scope.password) {
            $scope.showErr = true;
            $scope.errInfo = '用户明或者密码不能为空！';
        } else {
            $scope.showErr = false;
            $scope.errInfo = '';
            console.log($scope.username, $scope.password, autoLogin);
            var params = {
                username: $scope.username,
                password: $scope.password,
                autoLogin: autoLogin,
            };
            $cookieStore.put("username", $scope.username);
            $cookieStore.put("password", $scope.password);
            bookmarkService.login(params)
                .then((data) => {
                    console.log(data);
                    if (data.logined) {
                        pubSubService.publish('loginCtr.login', {
                            'login': data.logined,
                        });
                        $state.go('bookmarks', {
                            showStyle: 'navigate',
                        })
                    } else {
                        console.log('login failed......................')
                        toastr.error('账号或者密码错误', "错误");
                    }
                })
                .catch((err) => console.log('login err', err));
        }
    }
}]);
