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
            }
        })
        .catch((err) => console.log('autoLogin err', err));
}]);
