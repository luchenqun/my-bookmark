app.controller('bookmarksController', ['$scope', '$filter', 'bookmarkService', function($scope, $filter, bookmarkService) {
    'use strict';

    // var todoList = this;
    //
    // // Retrieve data from mongodb, by angular service.
    // var todos = todoList.todos = [];
    $scope.bookmarks = []
    bookmarkService.getBookmarks()
        .then(function(data) {
                console.log(data);
                $scope.bookmarks = data;
            },
            function(errorMsg) {
                console.log(errorMsg);
            });

}]);
