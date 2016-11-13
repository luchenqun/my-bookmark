app.controller('homeCtr', ['$scope', '$stateParams', '$filter', '$state', '$window', 'bookmarkService', 'pubSubService', function($scope, $stateParams, $filter, $state, $window, bookmarkService, pubSubService) {
    console.log('Hello homeCtr......');
    var debug = false;
    if (debug) {
        var params = {
            username: 'luchenqun',
            password: 'fendoubuxi1',
            autoLogin: true,
        };

        bookmarkService.login(params)
            .then((data) => {
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
            })
            .catch((err) => console.log('login err', err));
    } else {
        bookmarkService.autoLogin()
            .then((data) => {
                if (data.logined || debug) {
                    pubSubService.publish('loginCtr.login', {
                        'login': debug || data.logined,
                    });
                    $state.go('bookmarks', {
                        showStyle: 'navigate',
                    })
                } else {
                    console.log('autoLogin failed......................')
                }
            })
            .catch((err) => console.log('autoLogin err', err));
    }
}]);
