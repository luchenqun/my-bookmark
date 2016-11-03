app.controller('homeCtr', ['$scope', '$stateParams', '$filter', '$state', '$window', 'bookmarkService', 'pubSubService', function($scope, $stateParams, $filter, $state, $window, bookmarkService, pubSubService) {
    console.log('Hello homeCtr......');
    var debug = true;
    if (debug) {
        bookmarkService.login({
            username: 'luchenqun',
            password: 'fendoubuxi',
            autoLogin: true,
        }).then(
            function(data) {
                console.log(data);
                if (data.logined) {
                    pubSubService.publish('loginCtr.login', {
                        'login': data.logined,
                    });
                    $state.go('bookmarks', {
                        showStyle: 'navigate',
                    })
                } else {
                    console.log('login failed......................')
                }
            },
            function(errorMsg) {
                console.log(errorMsg);
            }
        );
    } else {
        bookmarkService.autoLogin().then(
            function(data) {
                if (data.logined || debug) {
                    pubSubService.publish('loginCtr.login', {
                        'login': debug || data.logined,
                    });
                    $state.go('bookmarks', {
                        showStyle: 'navigate',
                    })
                } else {
                    console.log('login failed......................')
                }
            },
            function(errorMsg) {
                console.log(errorMsg);
            }
        );
    }
}]);
