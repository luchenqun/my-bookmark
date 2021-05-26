app.controller('hotCtr', ['$scope', '$state', '$sce', '$filter', '$window', '$timeout', '$document', 'pubSubService', 'dataService', function ($scope, $state, $sce, $filter, $window, $timeout, $document, pubSubService, dataService) {
  console.log("Hello hotCtr...");
  if (dataService.smallDevice()) {
    if ($window.location.hostname.indexOf("b.lucq.fun") >= 0) {
      $window.location = "http://mb.lucq.fun/#/tags";
      return;
    }
  }
  pubSubService.publish('Menus.active');
  const pageSize = 40;
  var timeagoInstance = timeago();

  $scope.hoverBookmark = null;
  $scope.bookmarks = []; // 书签数据
  $scope.bookmark = {};
  $scope.bookmarkNormalHover = false;
  $scope.bookmarkEditHover = false;

  $scope.count = 0;
  $scope.totalPages = 0;
  $scope.currentPage = 1;
  $scope.channelId = 0; // 0 默认是后台抓取的收趣

  $scope.inputPage = '';
  $scope.loading = false;
  $scope.toastrId = 0;
  $scope.random = 0;
  $scope.channels = JSON.parse(`[{"id":0,"name":"收趣"},{"id":-1,"name":"随机一批"},{"id":1,"name":"热门"},{"id":2,"name":"搞笑"},{"id":3,"name":"养生堂"},{"id":4,"name":"私房话"},{"id":5,"name":"八卦精"},{"id":6,"name":"科技咖"},{"id":7,"name":"财经迷"},{"id":8,"name":"汽车控"},{"id":9,"name":"生活家"},{"id":10,"name":"时尚圈"},{"id":11,"name":"育儿"},{"id":12,"name":"旅游"},{"id":13,"name":"职场"},{"id":14,"name":"美食"},{"id":15,"name":"历史"},{"id":16,"name":"教育"},{"id":17,"name":"星座"},{"id":18,"name":"体育"},{"id":19,"name":"军事"},{"id":20,"name":"游戏"},{"id":21,"name":"萌宠"}]`);

  $scope.jumpToUrl = async function (url) {
    $window.open(url, '_blank');
  }

  $scope.favoriteBookmark = async function (b) {
    var menusScope = $('div[ng-controller="menuCtr"]').scope();
    var login = (menusScope && menusScope.login) || false;
    if (!login) {
      $scope.toastrId = toastr.info('请先登录再收藏书签！', "提示");
    } else {
      let bookmark = {}
      bookmark.title = b.title;
      bookmark.url = b.url;
      let id = await post("bookmarkAdd", bookmark);
      bookmark = await get("bookmark", { id })
      pubSubService.publish('EditCtr.inserBookmarsSuccess', bookmark);
    }
  }

  $scope.storeBookmark = async function (bookmark) {
    var menusScope = $('div[ng-controller="menuCtr"]').scope();
    var login = (menusScope && menusScope.login) || false;
    if (!login) {
      $scope.toastrId = toastr.info('请先登录再转存书签！', "提示");
    } else {
      pubSubService.publish('TagCtr.storeBookmark', $.extend(true, {}, bookmark));
    }
  }

  $scope.copy = async function (url) {
    dataService.clipboard(url);
  }

  $scope.detailBookmark = async function (bookmark) {
    if (!bookmark.content) {
      $scope.jumpToUrl(bookmark.url);
      return;
    }
    $scope.bookmark = bookmark;
    $('.js-weixin-content').modal({ blurring: true }).modal('setting', 'transition', dataService.animation()).modal('show')
    $timeout(function () {
      $('.js-main-content').animate({ scrollTop: 0 }, 100);
      $('.js-weixin-content').modal("refresh");
    }, 10)
  }

  $scope.close = async function () {
    $('.js-weixin-content').modal('setting', 'transition', dataService.animation()).modal('hide');
  }

  // 快捷键r随机推荐
  $document.bind("keydown", function (event) {
    $scope.$apply(async () => {
      let key = event.key.toUpperCase();
      let menusScope = $('div[ng-controller="menuCtr"]').scope();
      let blur = (menusScope && menusScope.blur) || false;
      if (key == 'R' && (!blur)) {
        $scope.getWeixinArticles(-1, 1);
      }

      if ($scope.hoverBookmark && dataService.keyShortcuts()) {
        if (key == 'I') {
          $scope.detailBookmark($scope.hoverBookmark)
        } else if (key == 'C') {
          $scope.copy($scope.hoverBookmark.url)
        }
      }
    })
  });

  $scope.setHoverBookmark = async function (bookmark) {
    $scope.hoverBookmark = bookmark;
  }

  $scope.changeCurrentPage = async function (currentPage) {
    currentPage = parseInt(currentPage) || 0;
    if (currentPage <= $scope.totalPages && currentPage >= 1) {
      $scope.getWeixinArticles($scope.channelId, currentPage);
      $scope.currentPage = currentPage;
    }
  }

  $scope.getWeixinArticles = async function (channelId, page) {
    $scope.bookmarks = [];
    $scope.bookmark = {};
    $scope.loading = true;
    $scope.channelId = channelId;
    $scope.currentPage = page;
    $scope.totalPages = 0;
    $scope.count = 0;
    if (channelId == -1) {
      let data = await get("hotBookmarksRandom");
      $timeout(() => {
        $scope.bookmarks = data;
        $scope.totalPages = 1;
        $scope.count = data.length;
        $scope.loading = false;
      })
    } else if (channelId == 0) {
      let reply = await get("hotBookmarks", { page, pageSize });
      $timeout(() => {
        $scope.bookmarks = reply.data;
        $scope.totalPages = reply.totalPages;
        $scope.count = reply.count;
        $scope.loading = false;
      })
    } else {
      $.ajax({
        url: `https://api.jisuapi.com/weixinarticle/get?channelid=${channelId}&start=${(page - 1) * pageSize}&num=${pageSize}&appkey=e95887468ab87d69`,
        type: 'get',
        dataType: "jsonp",
        jsonp: "callback",
        complete: function () { $scope.loading = false },
        success: function (body) { dealBody(body) },
        error: function (json) { toastr.error('获取热门失败！失败原因：' + json.msg, "提示") }
      });
    }
  }

  function dealBody(body) {
    console.log('success............', body);
    $timeout(function () {
      var defaultSnap = "./images/default.jpg"
      var defaultFavicon = "./images/weixin.ico"
      if (body.status == 0) {
        var weixinArticles = body.result.list;
        var total = body.result.total;
        $scope.count = total;
        $scope.totalPages = parseInt(total / pageSize) + 1;
        weixinArticles.forEach((articl, index) => {
          let bookmark = {};
          bookmark.index = index;
          bookmark.title = articl.title;
          bookmark.url = articl.url;
          bookmark.icon = defaultFavicon;
          bookmark.tagName = articl.weixinname;
          bookmark.account = articl.weixinaccount;
          bookmark.snap = articl.pic || defaultSnap;
          bookmark.clickCount = articl.likenum;
          bookmark.createdAt = timeagoInstance.format(articl.addtime * 1000, 'zh_CN');
          bookmark.content = articl.content.replace(/https:\/\/mmbiz.qpic.cn/gi, "https://favicon.lucq.fun/qpic?url=https://mmbiz.qpic.cn").replace(/http:\/\/mmbiz.qpic.cn/gi, "https://favicon.lucq.fun/qpic?url=https://mmbiz.qpic.cn");
          bookmark.content = $sce.trustAsHtml(bookmark.content);
          $scope.bookmarks.push(bookmark);
        })
      } else {
        toastr.error('获取热门失败！失败原因：' + body.msg, "提示");
      }
    }, 10);
  }

  $scope.getWeixinArticles($scope.channelId, $scope.currentPage);
}]);
