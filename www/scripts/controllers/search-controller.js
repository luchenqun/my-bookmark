app.controller('searchCtr', ['$scope', '$state', '$stateParams', '$filter', '$window', '$timeout', '$document', 'ngDialog', 'bookmarkService', 'pubSubService', 'dataService', function ($scope, $state, $stateParams, $filter, $window, $timeout, $document, ngDialog, bookmarkService, pubSubService, dataService) {
  console.log("Hello searchCtr...", $stateParams);
  if (dataService.smallDevice()) {
    $window.location = "http://m.mybookmark.cn/#/tags";
    return;
  }

  const perPageItems = 20;
  var dialog = null;
  $scope.hoverBookmark = null;
  $scope.searchBookmarks = []; // 书签数据
  $scope.showSearch = false; //
  $scope.showTags = false; //
  $scope.keyword = ($stateParams && $stateParams.keyword) || ''
  $scope.dateCreateBegin = '';
  $scope.dateCreateEnd = '';
  $scope.dateClickBegin = '';
  $scope.dateClickEnd = '';
  $scope.clickCount = '';
  $scope.username = '';
  $scope.userRange = '';
  $scope.bookmarkCount = 0;
  $scope.tags = []
  $scope.totalPages = 0;
  $scope.page = 1;
  $scope.inputPage = '';
  $scope.loading = false;
  $scope.waitDelBookmark = {};
  $scope.searchHotBookmarks = false;
  var timeagoInstance = timeago();

  $scope.changeCurrentPage = async function (page) {
    page = parseInt(page) || 0;
    console.log(page);
    if (page <= $scope.totalPages && page >= 1) {
      $scope.page = page;
      $scope.inputPage = '';
      $scope.search();
    }
  }

  get('tags').then((tags) => {
    $scope.tags = tags;
  })

  // 默认登陆
  pubSubService.publish('Common.menuActive', {
    login: true,
    index: dataService.LoginIndexBookmarks
  });

  var searchParams = {
    keyword: $scope.keyword,
    page: 1,
    perPageItems: perPageItems,
    userRange: '1', // 默认搜索自己的书签
  }
  if ($scope.keyword) {
    searchBookmarks(searchParams);
  } else {
    toastr.warning("请输入搜索关键字再进行查询！", "提示");
  }

  $scope.jumpToUrl = async function (url, id) {
    if (!$scope.edit) {
      $window.open(url);
      await post("clickBookmark", { id });

      $scope.searchBookmarks.forEach(function (bookmark) {
        if (bookmark.id == id && bookmark.own) {
          bookmark.click_count += 1;
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
    await post("delBookmark", { id })
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
    let id = await post("addBookmark", bookmark);
    bookmark = await get("bookmark", { id });
    pubSubService.publish('EditCtr.inserBookmarsSuccess', bookmark);
  }

  $scope.copy = async function (url) {
    dataService.clipboard(url);
  }

  $scope.search = async function (page) {
    var params = {}
    params.userRange = $('.js-user-range').dropdown('get value');
    if (params.userRange == '1') {
      var tags = $('.js-search-tags').dropdown('get value')
      if (tags) {
        params.tags = tags;
      }
    } else if ($scope.username) {
      params.username = $scope.username
    }
    if ($scope.keyword) {
      params.keyword = $scope.keyword;
    }

    var dateCreate = $('.js-create-date').dropdown('get value') || undefined;
    console.log('dateCreate = ', dateCreate)
    if (dateCreate) {
      if (dateCreate != -1) {
        params.dateCreate = dateCreate;
      }
    } else {
      params.dateCreateBegin = $scope.dateCreateBegin;
      params.dateCreateEnd = $scope.dateCreateEnd;
    }

    var dateClick = $('.js-click-date').dropdown('get value') || undefined;
    console.log('dateClick = ', dateClick)
    if (dateClick) {
      if (dateClick != -1) {
        params.dateClick = dateClick
      }
    } else {
      params.dateClickBegin = $scope.dateClickBegin;
      params.dateClickEnd = $scope.dateClickEnd;
    }
    params.page = page ? page : $scope.page;
    params.perPageItems = perPageItems;

    $scope.page = params.page;
    searchBookmarks(params)
    console.log('search..', page, 'params = ', params)
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
    $scope.searchBookmarks.forEach((bookmark) => {
      if (bookmark.id == data.id) {
        bookmark.title = data.title;
        bookmark.url = data.url;
        bookmark.description = data.description;
        bookmark.tags = data.tags;
      }
    })
  });

  async function searchBookmarks(params) {
    $scope.loading = true;
    $('.js-table-search').transition('hide');
    if ($scope.searchHotBookmarks) {
      console.log(params);
      bookmarkService.searchHotBookmarks(params)
        .then((data) => {
          $scope.searchBookmarks = [];
          data.bookmarks.forEach((bookmark) => {
            bookmark.tags = [{
              id: -1,
              name: bookmark.created_by, // 给转存用
            }]
            bookmark.createdAt = $filter('date')(new Date(bookmark.createdAt), "yyyy-MM-dd HH:mm:ss");
            bookmark.lastClick = $filter('date')(new Date(bookmark.lastClick), "yyyy-MM-dd HH:mm:ss");
            $scope.searchBookmarks.push(bookmark);
          })
          $scope.bookmarkCount = data.totalItems;
          $scope.totalPages = Math.ceil($scope.bookmarkCount / perPageItems);
          $scope.loading = false;
          transition();
        })
        .catch((err) => {
          console.log('searchHotBookmarks err', err);
          $scope.loading = false;
        });
    } else {
      console.log(params);
      let reply = await get('bookmarksSearch', params);
      $scope.searchBookmarks = reply.data;
      $scope.totalPages = reply.totalPages;
      $scope.bookmarkCount = reply.count;
      $scope.loading = false;
      transition();
    }
  }

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

}]);
