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
        console.log("changeForm = ", index);
        $scope.form = $scope.form.map(() => false);
        $scope.form[index] = true;

        if (index <= 1) {
            bookmarkService.userInfo({})
                .then((data) => {
                    $scope.user = data;
                    if (index == 0) {
                        updateShowStyle($scope.user && $scope.user.show_style);
                    }
                })
                .catch((err) => {
                    toastr.error('获取信息失败。错误信息：' + JSON.stringify(err), "错误");
                });
            if (index == 1) {
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
    }

    $scope.changeForm($scope.form.indexOf(true)); // 马上调用一次

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
                        toastr.success('密码更新成功，请重新登陆！', "提示");
                        // 注销登陆
                        bookmarkService.logout({})
                            .then((data) => {
                                console.log('logout..........', data)
                                pubSubService.publish('Common.menuActive', {
                                    login: false,
                                    index: 1
                                });
                                $state.go('login', {})
                            })
                            .catch((err) => console.log('logout err', err));
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

    $scope.updateDefaultShowStyle = function(showStyle) {
        console.log(showStyle)
        var parmes = {
            showStyle: showStyle,
        };
        bookmarkService.updateShowStyle(parmes)
            .then((data) => {
                if (data.retCode == 0) {
                    toastr.success('书签默认显示风格配置更新成功', "提示");
                } else {
                    toastr.error('书签默认显示风格配置。错误信息：' + data.msg, "错误");
                }
            })
            .catch((err) => {
                toastr.error('书签默认显示风格配置。错误信息：' + JSON.stringify(err), "错误");
            });
    }

    function updateShowStyle(showStyle) {
        setTimeout(function() {
            if (showStyle) {
                $('.js-default-show-style' + ' .radio.checkbox').checkbox('set unchecked');
                $('.js-radio-default-' + showStyle).checkbox('set checked');
            }
        }, 100)
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
                    $state.go('bookmarks', {})
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
