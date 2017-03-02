app.controller('settingsCtr', ['$scope', '$stateParams', '$filter', '$state', '$window', 'bookmarkService', 'pubSubService', function($scope, $stateParams, $filter, $state, $window, bookmarkService, pubSubService) {
    console.log('Hello settingsCtr......', $stateParams);
    $scope.form = [false, false, false, false];
    $scope.passwordOrgin = "";
    $scope.passwordNew1 = "";
    $scope.passwordNew2 = "";
    $scope.user = {};
    $scope.tagCnt = 0;
    $scope.bookmarkCnt = 0;
    $scope.form[($stateParams && $stateParams.formIndex) || 0] = true;

    $scope.changeForm = function(index) {
        $scope.form = $scope.form.map(() => false);
        $scope.form[index] = true;

        if (index == 1) {
            bookmarkService.userInfo({})
                .then((data) => {
                    $scope.user = data;
                })
                .catch((err) => {
                    toastr.error('获取信息失败。错误信息：' + JSON.stringify(err), "错误");
                });

            bookmarkService.getTags({})
                .then((data) => {
                    $scope.tagCnt = data.length;
                    $scope.bookmarkCnt = 0;
                    data.forEach((tag) => {
                        $scope.bookmarkCnt += tag.cnt;
                    })
                })
                .catch((err) => {
                    console.log('getTags err', err);
                });
        }
    }

    $scope.resetPassword = function() {
        if (!$scope.passwordOrgin || !$scope.passwordNew1 || !$scope.passwordNew2) {
            toastr.error('原密码跟新密码不能为空', "错误");
            return;
        }

        if ($scope.passwordNew1 == $scope.passwordNew2) {
            var parmes = {
                passwordNew: $scope.passwordNew1,
                passwordOrgin: $scope.passwordOrgin,
            };

            bookmarkService.resetPassword(parmes)
                .then((data) => {
                    if (data.retCode == 0) {
                        toastr.success('密码更新成功', "提示");
                        pubSubService.publish('Common.menuActive', {
                            login: false,
                            index: 0
                        });
                        $state.go('/', {});
                    } else {
                        toastr.error('密码更新失败。错误信息：' + data.msg, "错误");
                    }
                })
                .catch((err) => {
                    toastr.error('密码更新失败。错误信息：' + JSON.stringify(err), "错误");
                });
        } else {
            toastr.error('新密码两次输入不一致', "错误");
        }
    }

    setTimeout(function() {
        $("#fileuploader").uploadFile({
            url: "/api/uploadBookmarkFile",
            multiple: false,
            dragDrop: true,
            fileName: "bookmark",
            acceptFiles: "text/html",
            maxFileSize: 10 * 1024 * 1024, // 最大10M
            dragdropWidth: "100%",
            onSuccess: function(files, response, xhr, pd) {
                toastr.success('文件上传成功，3秒钟自动跳转到书签页面', "提示");
                setTimeout(function() {
                    pubSubService.publish('Common.menuActive', {
                        login: true,
                        index: 0
                    });
                    $state.go('bookmarks', {
                        showStyle: 'navigate',
                    })
                }, 3000);

            },
        });
        $(".ui.pointing.menu .item").removeClass("selected");
    }, 500);


    pubSubService.publish('Common.menuActive', {
        login: true,
        index: 3
    });
    transition();

    function transition() {
        var data = ['scale', 'fade', 'fade up', 'fade down', 'fade left', 'fade right', 'horizontal flip',
            'vertical flip', 'drop', 'fly left', 'fly right', 'fly up', 'fly down', 'swing left', 'swing right', 'swing up',
            'swing down', 'browse', 'browse right', 'slide down', 'slide up', 'slide left', 'slide right'
        ];
        var t = data[parseInt(Math.random() * 1000) % data.length];

        var className = 'js-segment-settings';
        $('.' + className).transition('hide');
        $('.' + className).transition({
            animation: t,
            duration: 500,
        });
    }

}]);
