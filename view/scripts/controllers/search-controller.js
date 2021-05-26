app.controller('searchCtr', ['$scope', '$state', '$stateParams', '$filter', '$window', '$timeout', '$document', 'ngDialog', 'pubSubService', 'dataService', function ($scope, $state, $stateParams, $filter, $window, $timeout, $document, ngDialog, pubSubService, dataService) {
  console.log("Hello searchCtr...", $stateParams);
  if (dataService.smallDevice()) {
    if ($window.location.hostname.indexOf("b.lucq.fun") >= 0) {
      $window.location = "http://mb.lucq.fun/#/tags";
      return;
    }
  }
  pubSubService.publish('Menus.active');

  $scope.hoverBookmark = null;
  $scope.bookmarks = []; // 书签数据
  $scope.showSearch = false; //
  $scope.showTags = false; //
  $scope.keyword = ($stateParams && $stateParams.keyword) || ''
  $scope.dateCreateBegin = '';
  $scope.dateCreateEnd = '';
  $scope.dateClickBegin = '';
  $scope.dateClickEnd = '';
  $scope.range = 'self';
  $scope.bookmarkCount = 0;
  $scope.tags = [];
  $scope.user = [];
  $scope.totalPages = 0;
  $scope.currentPage = 1;
  $scope.inputPage = '';
  $scope.loading = false;
  $scope.waitDelBookmark = {};
  $scope.searchHotBookmarks = false;

  var timeagoInstance = timeago();
  var dialog = null;

  $scope.changeCurrentPage = async function (page) {
    page = parseInt(page) || 0;
    if (page <= $scope.totalPages && page >= 1) {
      $scope.currentPage = page;
      $scope.inputPage = '';
      $scope.search();
    }
  }
  pubSubService.subscribe('Common.user', $scope, function (event, user) {
    $scope.user = user;
  });

  get('tags').then((tags) => $scope.tags = tags)
  get('user').then((user) => $scope.user = user)

  $scope.jumpToUrl = async function (url, id) {
    if (!$scope.edit) {
      $window.open(url);
      await post("bookmarkClick", { id });

      $scope.bookmarks.forEach(function (bookmark) {
        if (bookmark.id == id) {
          bookmark.clickCount += 1;
          bookmark.lastClick = $filter("date")(new Date(), "yyyy-MM-dd HH:mm:ss");
        }
      })
      $timeout(function () {
        timeagoInstance.cancel();
        timeagoInstance.render(document.querySelectorAll('.need_to_be_rendered'), 'zh_CN');
      }, 100)
    }
  }

  $scope.delBookmark = async function (bookmark) {
    $scope.waitDelBookmark = $.extend(true, {}, bookmark); // 利用jQuery执行深度拷贝
    dialog = ngDialog.open({
      template: './views/dialog-del-bookmark.html',
      className: 'ngdialog-theme-default',
      scope: $scope
    });
  }

  $scope.confirmDelBookmark = async function (id) {
    await post("bookmarkDel", { id })
    $("#" + id).transition({
      animation: dataService.animation(),
      duration: 500,
      onComplete: function () {
        $("#" + id).remove();
      }
    });
  }

  $scope.editBookmark = async function (id) {
    pubSubService.publish('bookmarksCtr.editBookmark', { id });
  }

  $scope.detailBookmark = async function (bookmark) {
    pubSubService.publish('TagCtr.showBookmarkInfo', bookmark);
  }

  $scope.storeBookmark = async function (bookmark) {
    var b = $.extend(true, {}, bookmark); // 利用jQuery执行深度拷贝
    pubSubService.publish('TagCtr.storeBookmark', b);
  }

  $scope.favoriteBookmark = async function (bookmark) {
    let id = await post("bookmarkAdd", bookmark);
    bookmark = await get("bookmark", { id });
    pubSubService.publish('EditCtr.inserBookmarsSuccess', bookmark);
  }

  $scope.copy = async function (url) {
    dataService.clipboard(url);
  }

  $scope.search = async function () {
    let params = {};

    params.range = $('.js-user-range').dropdown('get value');

    if (params.range == 'self') {
      let tagIds = $('.js-search-tags').dropdown('get value');
      if (tagIds) {
        params.tagIds = tagIds;
      }
    }

    if ($scope.keyword) {
      params.keyword = $scope.keyword;
    }

    let createdAt = parseInt($('.js-create-date').dropdown('get value') || 0);
    console.log('dateCreate = ', createdAt)
    if (createdAt > 0) {
      params.createdAt = dayjs(Date.now() - createdAt * 24 * 60 * 60 * 1000).format('YYYY-MM-DD HH:mm:ss') + "," + dayjs(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    } else if ($scope.dateCreateBegin && $scope.dateCreateEnd) {
      params.createdAt = dayjs($scope.dateCreateBegin).format('YYYY-MM-DD HH:mm:ss') + "," + dayjs($scope.dateCreateEnd).format('YYYY-MM-DD HH:mm:ss');
    }

    let lastClick = parseInt($('.js-click-date').dropdown('get value') || 0);
    console.log('lastClick = ', lastClick)
    if (lastClick > 0) {
      params.lastClick = dayjs(Date.now() - lastClick * 24 * 60 * 60 * 1000).format('YYYY-MM-DD HH:mm:ss') + "," + dayjs(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    } else if ($scope.dateClickBegin && $scope.dateClickEnd) {
      params.lastClick = dayjs($scope.dateClickBegin).format('YYYY-MM-DD HH:mm:ss') + "," + dayjs($scope.dateClickEnd).format('YYYY-MM-DD HH:mm:ss');
    }

    params.page = $scope.currentPage || 1;
    params.pageSize = 20;
    console.log('params = ', params)

    let reply = await get('bookmarksSearch', params);

    $timeout(() => {
      $scope.bookmarks = reply.data;
      $scope.totalPages = reply.totalPages;
      $scope.bookmarkCount = reply.count;
      $scope.loading = false;
    })
    transition();
  }

  $scope.updateCreateDate = async function () {
    console.log($scope.dateCreateBegin, $scope.dateCreateEnd);
    if ($scope.dateCreateBegin && $scope.dateCreateEnd) {
      $('.js-create-date').dropdown('hide');
      $('.js-create-date').dropdown('clear');
      $('.js-create-date .text').text($scope.dateCreateBegin + " 至 " + $scope.dateCreateEnd).removeClass('default');
    }
  }

  $scope.updateClickDate = async function () {
    console.log($scope.dateClickBegin, $scope.dateClickEnd);
    if ($scope.dateClickBegin && $scope.dateClickEnd) {
      $('.js-click-date').dropdown('hide');
      $('.js-click-date').dropdown('clear');
      $('.js-click-date .text').text($scope.dateClickBegin + " 至 " + $scope.dateClickEnd).removeClass('default');
    }
  }

  $scope.updateTagsSelect = async function () {
    $('.ui.dropdown.js-search-tags .text').removeClass('default');
    var text = $('.ui.dropdown.js-search-tags .text').text().replace('selected', '个已选');
    $('.ui.dropdown.js-search-tags .text').text(text);
  }

  $scope.setHoverBookmark = async function (bookmark) {
    $scope.hoverBookmark = bookmark;
  }

  // 在输入文字的时候也会触发，所以不要用Ctrl,Shift之类的按键
  $document.bind("keydown", function (event) {
    $scope.$apply(function () {
      var key = event.key.toUpperCase();
      console.log($scope.hoverBookmark);
      if ($scope.hoverBookmark && dataService.keyShortcuts()) {
        if (key == 'E' && $scope.hoverBookmark.own) {
          $scope.editBookmark($scope.hoverBookmark.id)
        } else if (key == 'I') {
          $scope.detailBookmark($scope.hoverBookmark)
        } else if (key == 'D' && $scope.hoverBookmark.own) {
          $scope.delBookmark($scope.hoverBookmark)
        } else if (key == 'C') {
          $scope.copy($scope.hoverBookmark.url)
        }
      }
    })
  });

  pubSubService.subscribe('EditCtr.inserBookmarsSuccess', $scope, function (event, data) {
    console.log('subscribe EditCtr.inserBookmarsSuccess', JSON.stringify(data));
    $scope.bookmarks.forEach((bookmark) => {
      if (bookmark.id == data.id) {
        bookmark.title = data.title;
        bookmark.url = data.url;
        bookmark.description = data.description;
        // bookmark.tags = data.tags; @todo
      }
    })
  });

  function transition() {
    $timeout(function () {
      timeagoInstance.cancel();
      timeagoInstance.render(document.querySelectorAll('.need_to_be_rendered'), 'zh_CN');
    }, 100)
    var className = 'js-table-search';
    $('.' + className).transition('hide');
    $('.' + className).transition({
      animation: dataService.animation(),
      duration: 500,
    });
  }

  $scope.search();

}]);
