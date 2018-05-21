app.controller('praiseCtr', ['$scope', '$state', '$stateParams', '$filter', '$window', '$timeout', 'ngDialog', 'bookmarkService', 'pubSubService', 'dataService', function($scope, $state, $stateParams, $filter, $window, $timeout, ngDialog, bookmarkService, pubSubService, dataService) {
    console.log("Hello praiseCtr...", $stateParams);
    if(dataService.smallDevice()){
        $window.location = "http://m.mybookmark.cn/#/tags";
        return;
    }
    bookmarkService.autoLogin()
        .then((data) => {
            var login = data.logined;
            var index = login ? dataService.LoginIndexPraise : dataService.NotLoginIndexPraise;
            pubSubService.publish('Common.menuActive', {
                login: login,
                index: index
            });
            transition();
        })
        .catch((err) => {
            console.log('autoLogin err', err)
        });

    $('.js-segment-praise').transition('hide');

    var data = ['scale', 'fade', 'fade up', 'fade down', 'fade left', 'fade right', 'horizontal flip',
        'vertical flip', 'drop', 'fly left', 'fly right', 'fly up', 'fly down',
        'browse', 'browse right', 'slide down', 'slide up', 'slide left', 'slide right'
    ];

    var t = data[parseInt(Math.random() * 1000) % data.length];

    function transition() {
        var className = 'js-segment-praise';
        $('.' + className).transition('hide');
        $('.' + className).transition({
            animation: dataService.animation(),
            duration: 500,
        });
    }

}]);
