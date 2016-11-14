app.controller('searchCtr', ['$scope', '$state', '$stateParams', '$filter', '$window', '$timeout', 'bookmarkService', 'pubSubService', function($scope, $state, $stateParams, $filter, $window, $timeout, bookmarkService, pubSubService) {
    console.log("Hello searchCtr...", $stateParams);
    $scope.bookmarks = []; // 书签数据
    $scope.showSearch = true; // 搜索对话框
    $scope.searchWord = ($stateParams && $stateParams.searchWord) || ''
    $scope.dateBegin = '';
    $scope.dateEnd = '';
    $scope.clickCount = '';
    $scope.username = '';
    $scope.userRange = '';

    searchBookmarks($stateParams);

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
        console.log('search..', $scope.searchWord, $scope.dateBegin, $scope.clickCount, $scope.username, $scope.userRange)
    }

    function searchBookmarks(params) {
        bookmarkService.searchBookmarks(params)
            .then((data) => {
                $scope.bookmarks = data;
                pubSubService.publish('Common.menuActive', {
                    login: true,
                    index: 0
                });
            })
            .catch((err) => console.log('getBookmarks err', err));
    }

    $scope.$on('elementRenderFinished', function(elementRenderFinishedEvent) {
        $('.ui.dropdown').dropdown();
        $('.ui.calendar.js-date-begin').calendar({
            type: 'date',
            formatter: {
                date: function(date, settings) {
                    if (!date) return '';
                    var day = date.getDate();
                    var month = date.getMonth() + 1;
                    var year = date.getFullYear();
                    return year + '/' + month + '/' + day;
                }
            },
            endCalendar: $('.ui.calendar.js-date-end')
        });
        $('.ui.calendar.js-date-end').calendar({
            type: 'date',
            formatter: {
                date: function(date, settings) {
                    if (!date) return '';
                    var day = date.getDate();
                    var month = date.getMonth() + 1;
                    var year = date.getFullYear();
                    return year + '/' + month + '/' + day;
                }
            },
            startCalendar: $('.ui.calendar.js-date-begin')
        });
    });
}]);
