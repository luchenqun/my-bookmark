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

    $scope.emailRegister = "";
    $scope.usernameRegister = "";
    $scope.passwordRegister1 = "";
    $scope.passwordRegister2 = "";

    $scope.login = function() {
        var autoLogin = $('.ui.checkbox.js-auto-login').checkbox('is checked');
        if (!$scope.username || !$scope.password) {
            $scope.showErr = true;
            $scope.errInfo = '用户名或者密码不能为空！';
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

    $scope.showRegister = function() {
        $('.ui.modal.js-register').modal({
            closable: false,
        }).modal('setting', 'transition', transition()).modal('show');

        $scope.emailRegister = "";
        $scope.usernameRegister = "";
        $scope.passwordRegister1 = "";
        $scope.passwordRegister2 = "";

    }

    $scope.register = function() {
        if (!$scope.emailRegister || !$scope.usernameRegister || !$scope.passwordRegister1 || !$scope.passwordRegister2) {
            toastr.error('有必填项为空', "错误");
            return;
        }
        if ($scope.passwordRegister1 !== $scope.passwordRegister2) {
            toastr.error('两次输入账号密码不一致', "错误");
            $scope.passwordRegister1 = "";
            $scope.passwordRegister2 = "";
            return;
        }
        if (!/^[A-Za-z0-9]{3,12}$/.test($scope.usernameRegister)) {
            toastr.error('账号只能是数字字母，且长度必须为3到12位', "错误");
            return;
        }
        if (!/^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/.test($scope.emailRegister)) {
            toastr.error('邮箱格式输入有误', "错误");
            return;
        }

        var user = {
            username: $scope.usernameRegister,
            email: $scope.emailRegister,
            password: $scope.passwordRegister1,
        };

        bookmarkService.register(user)
            .then((data) => {
                if (data.retCode == 0) {
                    toastr.success('注册成功', "提示");
                    $('.ui.modal.js-register').modal('hide');
                    $scope.username = $scope.usernameRegister;
                    $scope.password = "";
                } else {
                    toastr.error('注册失败，您的账号或者邮箱可能已经存在了。错误信息：' + data.msg, "错误");
                }
            })
            .catch((err) => {
                console.log('register err', err);
                toastr.error('注册失败：' + JSON.stringify(err), "错误");
            });
    }

    var className = 'js-form-login';
    $('.' + className).transition('hide');
    $('.' + className).transition({
        animation: transition(),
        duration: 500,
    });

    function transition() {
        var data = ['scale', 'fade', 'fade up', 'fade down', 'fade left', 'fade right', 'horizontal flip',
            'vertical flip', 'drop', 'fly left', 'fly right', 'fly up', 'fly down', 'swing left', 'swing right', 'swing up',
            'swing down', 'browse', 'browse right', 'slide down', 'slide up', 'slide left', 'slide right'
        ];
        return data[parseInt(Math.random() * 1000) % data.length];
    }
}]);
