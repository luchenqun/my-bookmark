app.controller('homeCtr', ['$scope', '$stateParams', '$filter', '$state', '$window', 'bookmarkService', 'pubSubService', 'dataService', function($scope, $stateParams, $filter, $state, $window, bookmarkService, pubSubService, dataService) {
    console.log('Hello homeCtr......');

    bookmarkService.autoLogin()
        .then((data) => {
            if (data.logined) {
                pubSubService.publish('loginCtr.login', {
                    'login': data.logined,
                });
                $state.go('bookmarks', {
                    showStyle: (data.user && data.user.show_style) || 'costomTag',
                })
                toastr.success('自动登陆成功，系统将自动跳转到主页', "提示");
            } else {
                console.log('autoLogin failed......................')
                pubSubService.publish('Common.menuActive', {
                    login: false,
                    index: dataService.NotLoginIndexHome
                });
                transition();
            }
        })
        .catch((err) => {
            console.log('autoLogin err', err)
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
