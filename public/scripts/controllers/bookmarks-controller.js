app.controller('bookmarksCtr', ['$scope', '$filter', 'bookmarkService', function($scope, $filter, bookmarkService) {
    $scope.bookmarks = [];  // 书签数据

    // 获取书签数据
    bookmarkService.getBookmarks().then(
        function(data) {
            console.log(data);
            $scope.bookmarks = data;
        },
        function(errorMsg) {
            console.log(errorMsg);
        }
    );
}]);
