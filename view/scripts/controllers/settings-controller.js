app.controller('settingsCtr', ['$scope', '$stateParams', '$filter', '$state', '$window', '$timeout', 'pubSubService', 'dataService', function ($scope, $stateParams, $filter, $state, $window, $timeout, pubSubService, dataService) {
  console.log('Hello settingsCtr......', $stateParams);
  if (dataService.smallDevice()) {
    if ($window.location.hostname.indexOf("b.lucq.fun") >= 0) {
      $window.location = "http://mb.lucq.fun/#/tags";
      return;
    }
  }
  pubSubService.publish('Menus.active');

  $scope.forbidQuickKey = dataService.forbidQuickKey
  $scope.form = [false, false, false, false, false, false, false];
  $scope.passwordOrgin = "";
  $scope.passwordNew1 = "";
  $scope.passwordNew2 = "";
  $scope.user = {};
  $scope.tagCnt = 0;
  $scope.bookmarkCount = 0;
  $scope.form[($stateParams && $stateParams.formIndex) || 0] = true;
  $scope.key = '';
  $scope.url = '';
  $scope.quickUrl = {};
  $scope.loading = false;
  $scope.href = "";

  $scope.changeForm = async function (index) {
    console.log("changeForm = ", index);
    $scope.href = "";
    $scope.form = $scope.form.map(() => false);
    $scope.form[index] = true;
    if (index == 0 || index == 1 || index == 4) {
      let user = await get('user', { full: true });
      let tags = await get('tags');
      $timeout(() => {
        $scope.user = user
        $scope.quickUrl = objKeySort(JSON.parse($scope.user.quickUrl || '{}'));
        $scope.bookmarkCount = 0;
        $scope.tagCnt = tags.length;
        for (const tag of tags) {
          $scope.bookmarkCount += tag.bookmarkCount;
        }
      })
    }
  }

  $scope.changeForm($scope.form.indexOf(true)); // 马上调用一次

  $scope.resetPassword = async function () {
    if($scope.user.username == 'test') {
      toastr.error('此用户不允许修改密码', "错误");
      return;
    }

    if (!$scope.passwordOrgin || !$scope.passwordNew1 || !$scope.passwordNew2) {
      toastr.error('原密码跟新密码不能为空', "错误");
      return;
    }

    if ($scope.passwordNew1 == $scope.passwordNew2) {
      await post('userResetPwd', { old: $scope.passwordOrgin, password: $scope.passwordNew1 });
      await post('userLogout');

      localStorage.setItem("authorization", "");
      $state.go('login', {})
    } else {
      toastr.error('新密码两次输入不一致', "错误");
    }
  }

  $scope.quickKey = async function (key) {
    key = key.toUpperCase();
    console.log('key = ', key);
    if (!(key >= 'A' && key <= 'Z')) {
      key = '';
      toastr.warning('快捷键只能是字母a ~ z，字母不区分大小写。', "警告");
    }
    $timeout(function () {
      $scope.key = key;
    });
  }

  $scope.addQuickUrl = async function () {
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

  $scope.delUrl = async function (key) {
    delete $scope.quickUrl[key];
    saveQuickUrl();
  }

  $scope.exportBookmark = async function () {
    $scope.loading = true;
    let fileName = await get('bookmarkBackup');
    $timeout(() => {
      $scope.href = `${document.location.origin}/api/bookmarkDownload?fileName=${fileName}`;
      $scope.loading = false;
      $window.open($scope.href, '_blank');
    })
  }

  setTimeout(function () {
    $("#fileuploader").uploadFile({
      url: "/api/bookmarkUpload",
      multiple: false,
      dragDrop: true,
      acceptFiles: "text/html",
      maxFileSize: 10 * 1024 * 1024, // 最大10M
      dragdropWidth: "100%",
      headers: {
        Authorization: localStorage.getItem("authorization"),
      },
      onSuccess: function (files, response) {
        console.log(files, response);
        if (response.code == 0) {
          setTimeout(function () {
            $state.go('tags', {})
          }, 3000);
          toastr.success(response.msg, "提示");
        } else {
          toastr.success('文件上传失败：' + response.msg, "提示");
        }
      },
    });
    $(".ui.pointing.menu .item").removeClass("selected");
  }, 500);

  async function saveQuickUrl() {
    await post("userUpdate", { quickUrl: JSON.stringify($scope.quickUrl) });
    toastr.success('全局快捷键更新成功', "提示");
  }

  function objKeySort(obj) {
    var newkey = Object.keys(obj).sort();
    var newObj = {};
    for (var i = 0; i < newkey.length; i++) {
      newObj[newkey[i]] = obj[newkey[i]];
    }
    return newObj;//返回排好序的新对象
  }

  dataService.transition('.js-segment-settings');
}]);
