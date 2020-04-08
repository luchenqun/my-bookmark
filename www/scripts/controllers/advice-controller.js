app.controller('adviceCtr', ['$scope', '$state', '$timeout', 'pubSubService', 'dataService', function ($scope, $state, $timeout, pubSubService, dataService) {
  console.log("Hello adviceCtr");
  if (dataService.smallDevice()) {
    $window.location = "http://m.mybookmark.cn/#/tags";
    return;
  }

  $scope.comment = '';
  $scope.advices = [];
  $scope.user = {};

  get('user').then(user => {
    $scope.user = user;
    pubSubService.publish('Common.menuActive', {
      login: true,
      index: dataService.LoginIndexAdvice
    });
  });
  getAdvices();

  $scope.ok = async function () {
    if ($scope.comment == '') {
      toastr.error('留言失败内容不能为空', "错误");
      return;
    }
    if ($scope.user.username == 'test') {
      toastr.error('test用户不允许留言!', "错误");
      return;
    }

    await post('adviceAdd', {
      comment: $scope.comment,
    });
    await getAdvices();
  }

  async function getAdvices() {
    let data = await get("advices");
    data.forEach(element => {
      element.imgData = new Identicon(md5(element.userId)).toString();
    });
    $scope.comment = "";
    $timeout(function () {
      $scope.advices = data;
    });
  }
}]);
