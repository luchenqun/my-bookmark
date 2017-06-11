app.controller('bookmarkInfoCtr', ['$scope', '$state', '$timeout', '$sce', '$window', '$filter', '$document', '$timeout', 'bookmarkService', 'pubSubService', 'dataService', function($scope, $state, $timeout, $sce, $window, $filter, $document, $timeout, bookmarkService, pubSubService, dataService) {
    console.log("Hello bookmarkInfoCtr");
    $scope.bookmark = {}
    $scope.content = '';
    $scope.loading = false;

    pubSubService.subscribe('TagCtr.showBookmarkInfo', $scope, function(event, bookmark) {
        console.log('subscribe TagCtr.showBookmarkInfo', bookmark);
        $('.ui.modal.js-bookmark-info').modal({
            closable: false,
        }).modal('setting', 'transition', dataService.animation()).modal('show');
        bookmark.favicon_url = bookmark.favicon_url || ('http://g.soz.im/' + bookmark.url + '/cdn.ico');
        bookmark.snap_url = bookmark.snap_url || ('./images/snap/' + bookmark.id + '.png');
        $scope.bookmark = bookmark;
        $scope.bookmark.description = $sce.trustAsHtml(bookmark.description);
        $scope.content = '';
        var params = {
            url: bookmark.url,
            requestId: 1
        }
        $scope.loading = true;
        $timeout(function() {
            $('.ui.modal.js-bookmark-info').modal("refresh");
            $("p").css("word-wrap", "break-word");
        }, 500);
        bookmarkService.getArticle(params)
            .then((data) => {
                $scope.content = data.content ? $sce.trustAsHtml(data.content) : $sce.trustAsHtml('<p>数据获取失败，可能是服务器不允许获取，或者是https网站！</p>');
                setTimeout(function() {
                    $('.ui.modal.js-bookmark-info').modal("refresh");
                }, 100);
                $scope.loading = false;
            })
            .catch((err) => {
                $scope.content = $sce.trustAsHtml('<p>数据获取失败:' + JSON.stringify(err) + '</p>');
                $scope.loading = false;
            })
    });

    $scope.jumpToUrl = function(url, id) {
        $window.open(url, '_blank');
        if ($scope.bookmark.own) {
            bookmarkService.clickBookmark({
                id: id
            });
            $scope.bookmark.click_count += 1;
            $scope.bookmark.last_click = $filter("date")(new Date(), "yyyy-MM-dd HH:mm:ss");
        }
    }

    $scope.copy = function(url) {
        clipboard.copy(url).then(
            function() {
                toastr.success(url + '<br/>已复制到您的剪切板', "提示");
            },
            function(err) {
                toastr.error(url + '<br/>复制失败', "提示");
            }
        );
    }

    $document.bind("keydown", function(event) {
        $scope.$apply(function() {
            // Esc按键，退出
            if (event.keyCode == 27) {
                $('.ui.modal.js-bookmark-info').modal("hide");
            }
        })
    });
}]);
