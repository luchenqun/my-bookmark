app.controller('homeCtr', ['$scope', '$stateParams', '$filter', '$state', '$window', 'bookmarkService', 'pubSubService', function($scope, $stateParams, $filter, $state, $window, bookmarkService, pubSubService) {
    console.log('Hello homeCtr......');

    bookmarkService.autoLogin()
        .then((data) => {
            if (data.logined) {
                pubSubService.publish('loginCtr.login', {
                    'login': data.logined,
                });
                $state.go('bookmarks', {
                    showStyle: 'navigate',
                })
            } else {
                console.log('autoLogin failed......................')
                pubSubService.publish('Common.menuActive', {
                    login: false,
                    index: 0
                });
                transition();
            }
        })
        .catch((err) => {
            console.log('autoLogin err', err)
        });
        $('.js-segment-home').transition('hide');
        function transition() {
            var data = ['scale', 'fade', 'fade up', 'fade down', 'fade left', 'fade right', 'horizontal flip',
                'vertical flip', 'drop', 'fly left', 'fly right', 'fly up', 'fly down', 'swing left', 'swing right', 'swing up',
                'swing down', 'browse', 'browse right', 'slide down', 'slide up', 'slide left', 'slide right'
            ];
            var t = data[parseInt(Math.random() * 1000) % data.length];

            var className = 'js-segment-home';
            $('.' + className).transition('hide');
            $('.' + className).transition({
                animation: t,
                duration: 500,
            });
        }
}]);
