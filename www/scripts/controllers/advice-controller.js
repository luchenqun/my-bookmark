app.controller('adviceCtr', ['$scope', '$state', '$timeout', 'bookmarkService', 'pubSubService', 'dataService', function ($scope, $state, $timeout, bookmarkService, pubSubService, dataService) {
  console.log("Hello adviceCtr");
  if (dataService.smallDevice()) {
    $window.location = "http://m.mybookmark.cn/#/tags";
    return;
  }

  $scope.comment = '';
  $scope.advices = [];
  $scope.user = {};

  get('own').then(user => {
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

    await post('addAdvice', {
      comment: $scope.comment,
    });
    await getAdvices();
  }

  async function getAdvices() {
    let data = await post("getAdvices");
    data.forEach(element => {
      element.imgData = new Identicon(md5(element.username)).toString();
    });
    $scope.comment = "";
    $timeout(function () {
      $scope.advices = data;
    });
  }
}]);
