app.controller('searchCtr', ['$scope', '$state', '$stateParams', '$filter', '$window', '$timeout', 'bookmarkService', 'pubSubService', function($scope, $state, $stateParams, $filter, $window, $timeout, bookmarkService, pubSubService) {
    console.log("Hello searchCtr...", $stateParams);
    $scope.bookmarks = []; // 书签数据
    $scope.showSearch = false; //
    $scope.showTags = false; //
    $scope.searchWord = ($stateParams && $stateParams.searchWord) || ''
    $scope.dateCreateBegin = '';
    $scope.dateCreateEnd = '';
    $scope.dateClickBegin = '';
    $scope.dateClickEnd = '';
    $scope.clickCount = '';
    $scope.username = '';
    $scope.userRange = '';
    $scope.bookmarkCount = 0;

    var searchParams = {
        searchWord: $scope.searchWord,
    }

    searchBookmarks(searchParams);

    $scope.delBookmark = function(bookmarkId) {
        var params = {
            id: bookmarkId
        }
        bookmarkService.delBookmark(params)
            .then((data) => $("#" + bookmarkId).remove())
            .catch((err) => {
                console.log('delBookmark err ', err)
            });
    }
    $scope.editBookmark = function(bookmarkId) {
        pubSubService.publish('bookmarksCtr.editBookmark', {
            'bookmarkId': bookmarkId
        });
    }

    $scope.detailBookmark = function(bookmarkId) {

    }

    $scope.search = function() {
        var params = {
            searchWord: $scope.searchWord,
        }
        searchBookmarks(params)
        console.log('search..', $scope.searchWord, $scope.dateBegin, $scope.clickCount, $scope.username, $scope.userRange)
    }
    $scope.updateCreateDate = function() {
        console.log($scope.dateCreateBegin, $scope.dateCreateEnd);
        if ($scope.dateCreateBegin && $scope.dateCreateEnd) {
            $('.js-create-date').dropdown('hide');
            $('.js-create-date').dropdown('clear');
            $('.js-create-date .text').text($scope.dateCreateBegin + " 至 " + $scope.dateCreateEnd).removeClass('default');
        }
    }

    $scope.updateClickDate = function() {
        console.log($scope.dateClickBegin, $scope.dateClickEnd);
        if ($scope.dateClickBegin && $scope.dateClickEnd) {
            $('.js-click-date').dropdown('hide');
            $('.js-click-date').dropdown('clear');
            $('.js-click-date .text').text($scope.dateClickBegin + " 至 " + $scope.dateClickEnd).removeClass('default');
        }
    }

    function searchBookmarks(params) {
        bookmarkService.searchBookmarks(params)
            .then((data) => {
                $scope.bookmarks = data;
                $scope.bookmarkCount = data.length;
                pubSubService.publish('Common.menuActive', {
                    login: true,
                    index: 0
                });
            })
            .catch((err) => console.log('getBookmarks err', err));
    }
}]);
