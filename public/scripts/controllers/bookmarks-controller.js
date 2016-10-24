app.controller('bookmarksCtr', ['$scope', '$filter', 'bookmarkService', function($scope, $filter, bookmarkService) {
    $scope.bookmarks = [];  // 书签数据
    // 获取书签数据
    var pageId = 1;
    bookmarkService.getBookmarks(pageId).then(
        function(data) {
            console.log(data);
            $scope.bookmarks = data;
            $('.ui.dropdown').dropdown({
                forceSelection:false
            });
            $('.ui.checkbox').checkbox();
        },
        function(errorMsg) {
            console.log(errorMsg);
        }
    );

    $scope.addTag = function(){
        console.log('Hello , you click addtag btn...')
    }

}]);
