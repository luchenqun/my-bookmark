app.controller('adviceCtr', ['$scope', '$state', '$timeout', '$window', 'pubSubService', 'dataService', function ($scope, $state, $timeout, $window, pubSubService, dataService) {
  console.log("Hello adviceCtr");
  console.log($window.location.hostname);
  if (dataService.smallDevice()) {
    if ($window.location.hostname.indexOf("b.lucq.fun") >= 0) {
      $window.location = "http://mb.lucq.fun/#/tags";
      return;
    }
  }
  pubSubService.publish('Menus.active');

  $scope.comment = '';
  $scope.advices = [];
  $scope.user = {};
  $scope.loading = false;

  pubSubService.subscribe('Common.user', $scope, function (event, user) {
    $scope.user = user;
  });

  getAdvices();

  $scope.ok = async function () {
    if ($scope.comment == '') {
      toastr.error('留言失败内容不能为空', "错误");
    } else if ($scope.user.username == 'test') {
      toastr.error('test用户不允许留言!', "错误");
    } else {
      await post('adviceAdd', { comment: $scope.comment });
      await getAdvices();
    }
  }

  async function getAdvices() {
    $scope.loading = true;
    $scope.comment = "";
    let advices = await get("advices");
    advices.forEach(element => {
      element.imgData = new Identicon(md5(element.userId)).toString();
    });
    $timeout(function () {
      $scope.advices = advices;
    });
    $scope.loading = false;
  }
}]);
