app.controller('homeCtr', ['$scope', '$stateParams', '$filter', '$state', '$window', 'bookmarkService', 'pubSubService', 'dataService', function($scope, $stateParams, $filter, $state, $window, bookmarkService, pubSubService, dataService) {
    console.log('Hello homeCtr......');
    if(dataService.smallDevice()){
        $window.location = "http://m.xusony.com/#/tags";
        return;
    }
    bookmarkService.autoLogin()
        .then((data) => {
            pubSubService.publish('loginCtr.login', {
                'login': data.logined,
            });
            $state.go('tags');
        })
        .catch((err) => {
            pubSubService.publish('loginCtr.login', {
                'login': data.logined,
            });
            $state.go('tags');
        });
    $('.js-segment-home').transition('hide');

    function transition() {
        var className = 'js-segment-home';
        $('.' + className).transition('hide');
        $('.' + className).transition({
            animation: dataService.animation(),
            duration: 500,
        });
    }
}]);
