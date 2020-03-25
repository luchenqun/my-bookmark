app.controller('homeCtr', ['$scope', '$stateParams', '$filter', '$state', '$window', 'bookmarkService', 'pubSubService', 'dataService', function ($scope, $stateParams, $filter, $state, $window, bookmarkService, pubSubService, dataService) {
  console.log('Hello homeCtr......');
  if (dataService.smallDevice()) {
    $window.location = "http://m.mybookmark.cn/#/tags";
    return;
  }

  (async () => {
    try {
      await axios.get('own', {});
      pubSubService.publish('loginCtr.login', { 'login': true });
      $state.go('tags');
    } catch (error) {
      pubSubService.publish('Common.menuActive', {
        login: false,
        index: dataService.NotLoginIndexHome
      });
    }
  })();
  
}]);
