app.controller('homeCtr', ['$scope', '$stateParams', '$filter', '$state', '$window', 'pubSubService', 'dataService', function ($scope, $stateParams, $filter, $state, $window, pubSubService, dataService) {
  console.log('Hello homeCtr......');
  if (dataService.smallDevice()) {
    $window.location = "http://m.mybookmark.cn/#/tags";
    return;
  }
  pubSubService.publish('Menus.active');

  pubSubService.subscribe('Common.user', $scope, function (event, user) {
    user.id && $state.go('tags');
  });
}]);
