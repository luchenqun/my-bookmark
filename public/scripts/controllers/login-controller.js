app.controller('loginCtr', ['$scope', '$filter', '$state', 'bookmarkService', 'pubSubService', function($scope, $filter, $state, bookmarkService, pubSubService) {
    console.log("Hello loginCtr...");
    login({
        userName: 'luchenqun',
        pwd: '123456',
    });

    function login(params) {
        bookmarkService.login(params).then(
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
    }

}]);
