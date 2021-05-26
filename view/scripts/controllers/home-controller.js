app.controller('homeCtr', ['$scope', '$stateParams', '$filter', '$state', '$window', 'pubSubService', 'dataService', function ($scope, $stateParams, $filter, $state, $window, pubSubService, dataService) {
  console.log('Hello homeCtr......');
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
}]);
