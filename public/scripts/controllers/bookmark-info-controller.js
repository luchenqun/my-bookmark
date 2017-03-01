app.controller('bookmarkInfoCtr', ['$scope', '$state', '$timeout', '$sce', '$window', '$filter', 'bookmarkService', 'pubSubService', function($scope, $state, $timeout, $sce, $window, $filter, bookmarkService, pubSubService) {
    console.log("Hello bookmarkInfoCtr");
    $scope.bookmark = {}
    $scope.content = '';
    $scope.loading = false;

    pubSubService.subscribe('TagCtr.showBookmarkInfo', $scope, function(event, bookmark) {
        console.log('subscribe TagCtr.showBookmarkInfo', bookmark);
        $('.ui.modal.js-bookmark-info').modal({
            closable: false,
        }).modal('setting', 'transition', transition()).modal('show');
        $scope.bookmark = bookmark;
        $scope.content = '';
        var params = {
            url: bookmark.url,
            requestId: 1
        }
        $scope.loading = true;
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
            $scope.bookmark.last_click = $filter("date")(new Date(), "yyyy-MM-dd");
        }
    }

    function transition() {
        var data = ['scale', 'fade', 'fade up', 'fade down', 'fade left', 'fade right', 'horizontal flip',
            'vertical flip', 'drop', 'fly left', 'fly right', 'fly up', 'fly down', 'swing left', 'swing right', 'swing up',
            'swing down', 'browse', 'browse right', 'slide down', 'slide up', 'slide left', 'slide right'
        ];
        return data[parseInt(Math.random() * 1000) % data.length];
    }
}]);
