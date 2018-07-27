app.controller('settingsCtr', ['$scope', '$stateParams', '$filter', '$state', '$window', '$timeout', 'bookmarkService', 'pubSubService', 'dataService', function($scope, $stateParams, $filter, $state, $window, $timeout, bookmarkService, pubSubService, dataService) {
    console.log('Hello settingsCtr......', $stateParams);
    if(dataService.smallDevice()){
        $window.location = "http://m.mybookmark.cn/#/tags";
        return;
    }

    $scope.forbidQuickKey = dataService.forbidQuickKey
    $scope.form = [false, false, false, false, false, false, false];
    $scope.passwordOrgin = "";
    $scope.passwordNew1 = "";
    $scope.passwordNew2 = "";
    $scope.user = {};
    $scope.tagCnt = 0;
    $scope.bookmarkCnt = 0;
    $scope.loadShowStyle = false;
    $scope.form[($stateParams && $stateParams.formIndex) || 0] = true;
    $scope.key = '';
    $scope.url = '';
    $scope.quickUrl = {};
    $scope.updateLogs = [];
    $scope.logsUrl = 'https://github.com/luchenqun/my-bookmark/commits/master';
    $scope.loadingLogs = false;

    $scope.getUpdateLog = function(url) {
        if ($scope.updateLogs.length > 0 && url == 'https://github.com/luchenqun/my-bookmark/commits/master') {
            toastr.warning('没有更早的日志可供您查看了！', "错误");
            return;
        }

        $scope.loadingLogs = true;
        bookmarkService.getUpdateLog({
                url: url
            })
            .then((data) => {
                Array.prototype.push.apply($scope.updateLogs, data.updateLogs);
                $scope.logsUrl = data.oldUrl;
                $scope.loadingLogs = false;
            })
            .catch((err) => {
                toastr.error('获取更新日志失败。错误信息：' + JSON.stringify(err), "错误");
                $scope.loadingLogs = false;
            });
    }

    $scope.changeForm = function(index) {
        console.log("changeForm = ", index);
        $scope.form = $scope.form.map(() => false);
        $scope.form[index] = true;
        $scope.updateLogs = [];

        if (index == 0 || index == 1 || index == 4) {
            $scope.loadShowStyle = true;
            bookmarkService.userInfo({})
                .then((data) => {
                    $scope.user = data;
                    if (index == 0) {
                        updateShowStyle(($scope.user && $scope.user.show_style) || 'navigate');
                        $scope.loadShowStyle = false;
                    }
                    if (index == 4) {
                        function objKeySort(obj) {
                            var newkey = Object.keys(obj).sort();
                            var newObj = {};
                            for (var i = 0; i < newkey.length; i++) {
                                newObj[newkey[i]] = obj[newkey[i]];
                            }
                            return newObj;//返回排好序的新对象
                        }

                        $scope.quickUrl = objKeySort(JSON.parse($scope.user.quick_url || '{}'));

                    }
                })
                .catch((err) => {
                    dataService.netErrorHandle(err, $state)
                    $scope.loadShowStyle = false;
                });
        }

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
                    dataService.netErrorHandle(err, $state)
                });
        }

        if (index == 5) {
            $scope.logsUrl = 'https://github.com/luchenqun/my-bookmark/commits/master'
            $scope.getUpdateLog($scope.logsUrl);
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
                                    index: dataService.NotLoginIndexLogin
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


    $scope.quickKey = function(key) {
        key = key.toUpperCase();
        console.log('key = ', key);
        if (!(key >= 'A' && key <= 'Z')) {
            key = '';
            toastr.warning('快捷键只能是字母a ~ z，字母不区分大小写。', "警告");
        }
        $timeout(function() {
            $scope.key = key;
        });
    }

    $scope.addQuickUrl = function() {
        if ($scope.url == '' || $scope.key == '') {
            toastr.warning('快捷键或者网站地址为空！', "警告");
        }

        if (!/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/.test($scope.url)) {
            toastr.warning($scope.url + '<br/>检撤到您的书签链接非法，是否忘记加http或者https了？建议直接从打开浏览器地址栏复制出来直接粘贴到输入框。', "警告");
            $scope.url = '';
            return;
        }
        if (!(($scope.key >= 'A' && $scope.key <= 'Z') || ($scope.key >= 'a' && $scope.key <= 'z') || ($scope.key >= '1' && $scope.key <= '9'))) {
            toastr.warning('快捷键只能是字母a ~ z，字母不区分大小写。', "警告");
            $scope.key = '';
            return;
        }

        if (dataService.forbidQuickKey[$scope.key]) {
            toastr.warning('快捷键' + $scope.key + '，已经设置为系统：' + dataService.forbidQuickKey[$scope.key] + '。无法使用该快捷键', "警告");
            $scope.key = '';
            return;
        }

        if ($scope.quickUrl[$scope.key]) {
            toastr.warning('快捷键：' + $scope.key + '，已经设置为链接为：' + $scope.quickUrl[$scope.key] + '。您可以先删除再添加。', "警告");
            $scope.key = '';
            return;
        }

        $scope.key = $scope.key.toUpperCase();
        $scope.quickUrl[$scope.key] = $scope.url;

        console.log(JSON.stringify($scope.quickUrl));

        saveQuickUrl();
        $scope.url = '';
        $scope.key = '';
    }

    $scope.delUrl = function(key) {
        delete $scope.quickUrl[key];
        saveQuickUrl();
    }

    $scope.jumpCommit = function(url) {
        $window.open(url, '_blank');
    }

    $scope.exportBookmark = function() {
        var userId = $scope.user && $scope.user.id;
        if (userId) {
            // toastr.warning('功能正在开发中，敬请期待......', '提示');
            // return;
            $window.open("api/download?userId=" + userId + "&type=exportbookmark");
        } else {
            toastr.warning('用户信息无法获取到，请尝试按刷新网页再尝试！', '提示');
        }
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
                        index: dataService.LoginIndexBookmarks
                    });
                    $state.go('bookmarks', {})
                }, 3000);
            },
        });
        $(".ui.pointing.menu .item").removeClass("selected");
    }, 500);

    pubSubService.publish('Common.menuActive', {
        login: true,
        index: dataService.LoginIndexSettings
    });

    function saveQuickUrl() {
        var parmes = {
            quickUrl: JSON.stringify($scope.quickUrl),
        };
        bookmarkService.updateQuickUrl(parmes)
            .then((data) => {
                if (data.retCode == 0) {
                    toastr.success('全局快捷键更新成功', "提示");
                    pubSubService.publish('Settings.quickUrl', {
                        quickUrl: $scope.quickUrl
                    });
                } else {
                    toastr.error('全局快捷键更新失败。错误信息：' + data.msg, "错误");
                }
            })
            .catch((err) => {
                toastr.error('全局快捷键更新失败。错误信息：' + JSON.stringify(err), "错误");
            });
    }

    dataService.transition('.js-segment-settings');
}]);
