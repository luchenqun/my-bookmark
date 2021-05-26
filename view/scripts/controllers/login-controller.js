app.controller('loginCtr', ['$scope', '$filter', '$state', '$http', '$cookieStore', '$window', 'pubSubService', 'dataService', function ($scope, $filter, $state, $http, $cookieStore, $window, pubSubService, dataService) {
  console.log("Hello loginCtr...");
  if (dataService.smallDevice()) {
    if ($window.location.hostname.indexOf("b.lucq.fun") >= 0) {
      $window.location = "http://mb.lucq.fun/#/tags";
      return;
    }
  }
  pubSubService.publish('Menus.active');

  pubSubService.subscribe('Common.user', $scope, function (event, user) {
    user.id && $state.go('tags');
  });

  $scope.username = $cookieStore.get("username") || "";
  $scope.password = "";
  $scope.showErr = false;
  $scope.errInfo = '';

  $scope.emailRegister = "";
  $scope.usernameRegister = "";
  $scope.passwordRegister1 = "";
  $scope.passwordRegister2 = "";

  $scope.login = async function () {
    var autoLogin = $('.ui.checkbox.js-auto-login').checkbox('is checked');
    if (!$scope.username || !$scope.password) {
      $scope.showErr = true;
      $scope.errInfo = '用户名或者密码不能为空！';
      return;
    }

    $scope.showErr = false;
    $scope.errInfo = '';
    console.log($scope.username, $scope.password, autoLogin);
    var params = {
      username: $scope.username,
      password: $scope.password,
      maxAge: 7 * 24 * 3600,
    };
    $cookieStore.put("username", $scope.username);

    let data = await post('userLogin', params);
    pubSubService.publish('Login', true);

    // 更新token信息
    localStorage.setItem("authorization", data.token);

    $state.go('tags');
  }

  $scope.showRegister = async function () {
    $('.ui.modal.js-register').modal({ closable: false }).modal('setting', 'transition', dataService.animation()).modal('show');
    $scope.emailRegister = "";
    $scope.usernameRegister = "";
    $scope.passwordRegister1 = "";
    $scope.passwordRegister2 = "";
  }

  $scope.register = async function () {
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
    if (!/^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/.test($scope.emailRegister)) {
      toastr.error('邮箱格式输入有误', "错误");
      return;
    }

    var user = {
      username: $scope.usernameRegister,
      email: $scope.emailRegister,
      password: $scope.passwordRegister1,
    };
    await post('userRegister', user);

    $('.ui.modal.js-register').modal('hide');
    $scope.username = $scope.usernameRegister;
    $scope.password = "";
  }

  var className = 'js-form-login';
  $('.' + className).transition('hide');
  $('.' + className).transition({
    animation: dataService.animation(),
    duration: 500,
  });

}]);
