app.controller('bookmarkInfoCtr', ['$scope', '$state', '$timeout', '$sce', 'bookmarkService', 'pubSubService', function($scope, $state, $timeout, $sce, bookmarkService, pubSubService) {
    console.log("Hello bookmarkInfoCtr");
    $scope.bookmark = {}
    $scope.content = '';
    $scope.loading = false;

    pubSubService.subscribe('TagCtr.showBookmarkInfo', $scope, function(event, bookmark) {
        console.log('subscribe TagCtr.showBookmarkInfo', bookmark);
        $('.ui.modal.js-bookmark-info').modal('show');
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
                setTimeout(function(){
                    $('.ui.modal.js-bookmark-info').modal("refresh");
                }, 100);
                $scope.loading = false;
            })
            .catch((err) => {
                $scope.content = $sce.trustAsHtml('<p>数据获取失败:' + JSON.stringify(err) + '</p>');
                $scope.loading = false;
            })
    });
}]);
