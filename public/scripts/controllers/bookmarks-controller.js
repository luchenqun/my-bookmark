app.controller('bookmarksCtr', ['$scope', '$filter', 'bookmarkService', 'pubSubService', function($scope, $filter, bookmarkService, pubSubService) {
    console.log("Hello bookmarksCtr...");
    $scope.bookmarks = []; // 书签数据
    var params = {
        s: 111,
        b: 222,
        i: 'lcq'
    }
    getBookmarks(params);

    pubSubService.subscribe('MenuCtr.bookmarks', $scope, function(event, data) {
        console.log('subscribe MenuCtr.bookmarks', data);
        getBookmarks(data);
    });

    pubSubService.subscribe('MenuCtr.searchBookmarks', $scope, function(event, data) {
        console.log('subscribe MenuCtr.searchBookmarks', data);
        getBookmarks(data);
    });

    function getBookmarks(params) {
        bookmarkService.getBookmarks(params).then(
            function(data) {
                console.log(data);
                $scope.bookmarks = data;
            },
            function(errorMsg) {
                console.log(errorMsg);
            }
        );
    }
}]);
