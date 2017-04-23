app.controller('praiseCtr', ['$scope', '$state', '$stateParams', '$filter', '$window', '$timeout', 'ngDialog', 'bookmarkService', 'pubSubService', function($scope, $state, $stateParams, $filter, $window, $timeout, ngDialog, bookmarkService, pubSubService) {
    console.log("Hello praiseCtr...", $stateParams);

    bookmarkService.autoLogin()
        .then((data) => {
            var login = data.logined;
            var index = login ? 5 : 3;
            pubSubService.publish('Common.menuActive', {
                login: login,
                index: index
            });
        })
        .catch((err) => {
            console.log('autoLogin err', err)
        });

    function animation() {
        var data = ['scale', 'fade', 'fade up', 'fade down', 'fade left', 'fade right', 'horizontal flip',
            'vertical flip', 'drop', 'fly left', 'fly right', 'fly up', 'fly down',
            'browse', 'browse right', 'slide down', 'slide up', 'slide left', 'slide right'
        ];
        var t = data[parseInt(Math.random() * 1000) % data.length];

        return t;
    }

    function transition() {
        $timeout(function() {
            timeagoInstance.cancel();
            timeagoInstance.render(document.querySelectorAll('.need_to_be_rendered'), 'zh_CN');
        }, 100)
        var className = 'js-table-search';
        $('.' + className).transition('hide');
        $('.' + className).transition({
            animation: animation(),
            duration: 500,
        });
    }

}]);
