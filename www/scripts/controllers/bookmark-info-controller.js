app.controller('bookmarkInfoCtr', ['$scope', '$state', '$timeout', '$sce', '$window', '$filter', '$document', '$timeout', 'pubSubService', 'dataService', function ($scope, $state, $timeout, $sce, $window, $filter, $document, $timeout, pubSubService, dataService) {
  console.log("Hello bookmarkInfoCtr");
  $scope.bookmark = {}
  $scope.content = '';
  $scope.loading = false;

  pubSubService.subscribe('TagCtr.showBookmarkInfo', $scope, async function (event, bookmark) {
    console.log('subscribe TagCtr.showBookmarkInfo', bookmark);
    $('.ui.modal.js-bookmark-info').modal({
      closable: false,
    }).modal('setting', 'transition', dataService.animation()).modal('show');
    bookmark.favicon_url = 'https://favicon.luchenqun.com/?url=' + bookmark.url;
    $scope.bookmark = bookmark;
    $scope.bookmark.description = $sce.trustAsHtml(bookmark.description);
    $scope.content = $sce.trustAsHtml(bookmark.content) || '';
    if (!$scope.content) {
      $timeout(function () {
        $('.ui.modal.js-bookmark-info').modal("refresh");
        $("p").css("word-wrap", "break-word");
      }, 500);
      $scope.loading = true;
      try {
        let data = get("article", { url: bookmark.url });
        $scope.content = data.content ? $sce.trustAsHtml(data.content) : $sce.trustAsHtml('<p>数据获取失败，可能是服务器不允许获取，或者是https网站！</p>');
        setTimeout(function () {
          $('.ui.modal.js-bookmark-info').modal && $('.ui.modal.js-bookmark-info').modal("refresh");
        }, 100);
      } catch (error) {

      }
      $scope.loading = false;
    } else {
      setTimeout(function () {
        $('.ui.modal.js-bookmark-info').modal && $('.ui.modal.js-bookmark-info').modal("refresh");
      }, 10);
      setTimeout(function () {
        $('.modals').animate({ scrollTop: 0 }, 100);
      }, 500);
    }
  });

  $scope.jumpToUrl = async function (url, id) {
    $window.open(url, '_blank');
    if ($scope.bookmark.own) {
      await post('bookmarkClick', { id });
      $scope.bookmark.clickCount += 1;
      $scope.bookmark.lastClick = $filter("date")(new Date(), "yyyy-MM-dd HH:mm:ss");
    }
  }

  $scope.copy = function (url) {
    dataService.clipboard(url);
  }

  $document.bind("keydown", function (event) {
    $scope.$apply(function () {
      // Esc按键，退出
      if (event.keyCode == 27) {
        $('.ui.modal.js-bookmark-info').modal("hide");
      }
    })
  });
}]);
