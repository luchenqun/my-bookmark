app.controller('menuCtr', ['$scope', '$stateParams', '$state', '$window', '$timeout', '$document', 'pubSubService', 'dataService', function ($scope, $stateParams, $state, $window, $timeout, $document, pubSubService, dataService) {
  console.log("Hello menuCtr")
  $scope.login = true;
  $scope.selectLoginIndex = 0; // 默认登陆之后的选择的菜单索引，下表从 0 开始 
  $scope.selectNotLoginIndex = 0; // 默认未登陆之后的选择的菜单索引，下表从 0 开始
  $scope.keyword = '';
  $scope.searchHistory = [];
  $scope.historyTypes = dataService.historyTypes;
  $scope.quickUrl = {};
  $scope.longPress = false;
  $scope.user = {};
  $scope.loaded = false; // 是否加载完毕

  pubSubService.subscribe('Login', $scope, function (event, login) {
    $scope.login = login;
  });

  function sleep(time) { return new Promise((resolve) => setTimeout(resolve, time)); }

  pubSubService.subscribe('Menus.active', $scope, async function () {
    while (!$scope.loaded) { await sleep(10); }
    updateMenuActive();
  });

  $scope.loginMenus = dataService.loginMenus; // 登陆之后显示的菜单数据。uiSerf：内部跳转链接。
  $scope.notLoginMenus = dataService.notLoginMenus; // 未登陆显示的菜单数据

  (async () => {
    $timeout(async () => {
      try {
        let user = await get('user', { full: true });
        $scope.login = true;
        $scope.user = user;
        $scope.searchHistory = JSON.parse(user.searchHistory || '[]');
        $scope.quickUrl = JSON.parse(user.quickUrl || '{}');
        if (user.username === 'lcq') {
          $scope.loginMenus[dataService.LoginIndexHot].show = false;
        }
        for (const item of $scope.searchHistory) {
          $scope.searchIcon(item);
        }
      } catch (error) {
        $scope.login = false;
      }
      pubSubService.publish('Common.user', $scope.user);
      $scope.loaded = true;
    })
  })()

  $scope.toggleReady = function (ready) {
    if (ready) {
      $(".searchIcon").show();
    } else {
      $timeout(function () {
        !$("#sInput").val() && $(".searchIcon").hide();
      }, 500)
    }
  }

  $scope.searchIcon = function (item) {
    if (item.t === 0) {
      item.icon = "book link icon";
    } else if (item.t === 1) {
      item.icon = "google link icon";
    } else if (item.t === 2) {
      item.icon = "github link icon";
    } else if (item.t === 3) {
      item.icon = "stack overflow link icon";
    } else if (item.t === 4) {
      item.icon = "bimobject link icon";
    } else if (item.t === 5) {
      item.icon = "file alternate link icon";
    }
  }

  /**
   * @func
   * @desc 点击搜索按钮搜索书签
   */
  $scope.search = function (keyword, searchOption) {
    console.log('search......', keyword);
    if (!keyword) {
      toastr.error('请输入搜索关键字', "错误");
      return;
    }

    $scope.login = true;
    // var searchOption = $('.js-search-option').dropdown('get value') || 0;
    if (searchOption == 0) {
      $state.go('search', {
        keyword: keyword,
      }, {
        reload: true,
      })
    } else if (searchOption == 1) {
      $window.open('https://www.google.com.hk/#newwindow=1&safe=strict&q=' + encodeURIComponent(keyword), '_blank');
    } else if (searchOption == 2) {
      $window.open('https://github.com/search?utf8=%E2%9C%93&q=' + encodeURIComponent(keyword) + '&type=', '_blank');
    } else if (searchOption == 3) {
      $window.open('https://stackoverflow.com/search?q=' + encodeURIComponent(keyword), '_blank');
    } else if (searchOption == 4) {
      $window.open('http://www.baidu.com/s?tn=b.lucq.fun&ch=3&ie=utf-8&wd=' + encodeURIComponent(keyword), '_blank');
    } else if (searchOption == 5) {
      console.log('search note, word = ', keyword);
      $state.go('note', { keyword }, { reload: true })
    }

    if (!keyword) {
      return;
    }

    var newItem = {
      t: searchOption,
      d: keyword,
    }
    $scope.searchIcon(newItem)
    var delIndex = -1;
    $scope.searchHistory.unshift(newItem);
    $scope.searchHistory.forEach((item, index) => {
      if (index >= 1 && item.t == searchOption && item.d == keyword) {
        delIndex = index;
      }
    })
    if (delIndex >= 0) {
      $scope.searchHistory.splice(delIndex, 1);
    }

    // 大于30的不保存到数据库
    if (keyword.length <= 30) {
      saveHistory();
    }
  }

  $scope.searchByHistory = function (type, data, $event) {
    console.log("searchByHistory", type, data);
    $event && $event.stopPropagation();
    $scope.keyword = data;
    $('.search-item').val($scope.keyword);

    $('.js-search-option').dropdown('set value', type);
    var types = $scope.historyTypes;
    $('.js-search-option').dropdown('set text', types[type]);
    $('.js-search-option').dropdown('save defaults', types[type]);
    $('.js-search-option .menu .item').removeClass('active');
    $('.js-search-option .menu .item:eq(' + type + ')').addClass('active');
    $('.js-history-popup').removeClass('visible').addClass('hidden');
    $scope.search(data, type);
  }

  $scope.delHistory = function (type, data, $event) {
    console.log("delHistory", type, data);
    $event && $event.stopPropagation();
    var delIndex = -1;
    $scope.searchHistory.forEach((item, index) => {
      if (index >= 1 && item.t == type && item.d == data) {
        delIndex = index;
      }
    })
    if (delIndex >= 0) {
      $scope.searchHistory.splice(delIndex, 1);
    }
    if (!type && !data) {
      $scope.searchHistory = [];
    }
    saveHistory();
    toastr.info("历史搜索已全部清空", "提示");
    $timeout(function () {
      type && data && $('.js-history-popup').removeClass('hidden').addClass('visible');
    }, 500)
  }

  $scope.showAddBookmarkMoadl = function () {
    pubSubService.publish('MenuCtr.showAddBookmarkMoadl', {
      'action': 'add'
    });
  }

  $scope.logout = async function () {
    await post('userLogout');
    axios.defaults.headers.common['Authorization'] = "";
    localStorage.setItem("authorization", "");
    $scope.login = false;
    $state.go('login', {});
  }

  $scope.star = function () {
    var url = "https://github.com/luchenqun/my-bookmark";
    $window.open(url, '_blank');
  }

  $scope.coffee = function () {
    $state.go('settings', {
      formIndex: 6,
    });
  }

  async function updateMenuActive() {
    await sleep(10); // 阻塞 10ms 是因为 document.location.hash 还没切换过来等待切换
    let mapIndex = {
      "#/bookmarks": dataService.LoginIndexBookmarks,
      "#/tags": dataService.LoginIndexTags,
      "#/note": dataService.LoginIndexNote,
      "#/hot": $scope.login ? dataService.LoginIndexHot : dataService.NotLoginIndexHot,
      "#/settings": dataService.LoginIndexSettings,
      "#/advice": dataService.LoginIndexAdvice,
      "#/": $scope.login ? dataService.LoginIndexBookmarks : dataService.NotLoginIndexHome,
      "#/login": dataService.NotLoginIndexLogin,
    }

    console.log('updateMenuActive', $scope.login, document.location.hash, mapIndex[document.location.hash]);

    $scope.selectLoginIndex = mapIndex[document.location.hash];
    $scope.selectNotLoginIndex = mapIndex[document.location.hash];
    $('.ui.menu a.item').removeClass('selected');
    $('.ui.menu a.item:eq(' + mapIndex[document.location.hash] + ')').addClass('selected');
  }

  async function saveHistory() {
    let datas = [];
    $scope.searchHistory = $scope.searchHistory.slice(0, 15); // 最多保留15个历史记录
    $scope.searchHistory.forEach((item, index) => {
      datas.push({
        t: item.t,
        d: item.d,
      })
    })
    await post("userUpdate", { searchHistory: JSON.stringify(datas) });
  }

  $timeout(function () {
    $('.suggest')
      .popup({
        title: '操作提示',
        position: 'bottom center',
        variation: "very wide",
        html: "<span><span class='fontred'>特别提示：对照更新日志，如果有更新，请按 Ctrl+F5 强制更新或者清理浏览器缓存！<br/>点击该按钮即可查看更新日志！</span><br/>1、在任意页面，按A键添加备忘录。<br/>2、在热门收藏页面，按R键随机查看热门收藏。<br/>3、在任意页面，按数字键切换菜单栏。<br/>4、在书签页面鼠标放在书签上，按C复制书签链接<br/>5、在书签页面鼠标放在书签上，按E编辑书签<br/>6、在书签页面鼠标放在书签上，按D删除书签<br/>7、在书签页面鼠标放在书签上，按I查看书签详情<br/>8、在任意页面，按INSERT做添加书签<br/>9、在任意页面，按ESC退出弹窗<br/></span>"
      });
  }, 1000)

  // 在输入文字的时候也会触发，所以不要用Ctrl,Shift之类的按键
  $document.bind("keydown", async function (event) {
    $scope.$apply(async function () {
      var key = event.key.toUpperCase();
      if (key == 'CONTROL' || key == 'SHIFT' || key == 'ALT') {
        // 有时候没有检测到keyup，会一直按无效，干脆过个3秒就认为你抬起来了。反正你按下我还是会给你标记为true的。
        $scope.longPress = true;
        $timeout(function () {
          $scope.longPress = false;
        }, 3000)
      }

      if (dataService.keyShortcuts()) {
        // 全局处理添加备忘录
        if (key == 'A') {
          if ($scope.selectLoginIndex !== dataService.LoginIndexNote) {
            $state.go('note', { key: key }, { reload: true })
          }
          return;
        }

        if (key == 'S') {
          $(".search-item").focus();
          var count = 1;
          var sId = setInterval(function () {
            $(".search-item").val("");
            count++;
            if (count >= 5) {
              clearInterval(sId);
            }
          }, 3)
          return;
        }

        if (key == ',' || key == '.' || key == '/') {
          var stateParams = {
            tagId: -1,
            orderIndex: (key == ',' ? 0 : (key == '.' ? 1 : 2)),
          }
          $state.go(dataService.loginMenus[dataService.LoginIndexTags].uiSref, stateParams, { reload: true, })
        }

        // 数字键用来切换菜单
        if (!isNaN(key)) {
          var num = parseInt(key);
          if (num < 0 || num > 6 || (!$scope.login)) return;
          $state.go(dataService.loginMenus[num - 1].uiSref, {}, {
            reload: true,
          })
        } else {
          var url = $scope.quickUrl[key];
          if (url) {
            $window.open(url, '_blank');
            let data = await post('bookmarShortcut', { url });
            if (!data) {
              toastr.info('网址：' + url + "还没添加到你的书签系统，请添加！", "警告");
              pubSubService.publish('TagCtr.storeBookmark', { url });
            }
          }
        }
      }
    })
  });

  // 在输入文字的时候也会触发，所以不要用Ctrl,Shift之类的按键
  $document.bind("keyup", function (event) {
    $scope.$apply(function () {
      var key = event.key.toUpperCase();
      // console.log('keyup key = ', key);
      if (key == 'CONTROL' || key == 'SHIFT' || key == 'ALT') {
        $scope.longPress = false;
      }
    })
  });
}]);
