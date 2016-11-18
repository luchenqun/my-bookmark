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
    $scope.tags = []

    bookmarkService.getTags({
            user_id: '1',
        })
        .then((data) => {
            $scope.tags = data;
        })
        .catch((err) => console.log('getTags err', err));

    var searchParams = {
        searchWord: $scope.searchWord,
    }
    if ($scope.searchWord) {
        searchBookmarks(searchParams);
    } else {

    }

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
        var params = {}
        params.userRange = $('.js-user-range').dropdown('get value');
        if (params.userRange == '1') {
            var tags = $('.js-search-tags').dropdown('get value')
            if (tags) {
                params.tags = tags;
            }
        } else if ($scope.username) {
            params.username = $scope.username
        }
        if ($scope.searchWord) {
            params.searchWord = $scope.searchWord;
        }


        var dateCreate = $('.js-create-date').dropdown('get value') || undefined;
        if (dateCreate) {
            if (dateCreate != 0) {
                params.dateCreate = dateCreate;
            }
        } else {
            params.dateCreateBegin = $scope.dateCreateBegin;
            params.dateCreateEnd = $scope.dateCreateEnd;
        }

        var dateClick = $('.js-click-date').dropdown('get value') || undefined;
        if (dateClick) {
            if (dateClick != 0) {
                params.dateClick = dateClick
            }
        } else {
            params.dateClickBegin = $scope.dateClickBegin;
            params.dateClickEnd = $scope.dateClickEnd;
        }

        searchBookmarks(params)
        console.log('search..', params)
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

    $scope.updateTagsSelect = function() {
        $('.ui.dropdown.js-search-tags .text').removeClass('default');
        var text = $('.ui.dropdown.js-search-tags .text').text().replace('selected', '个已选');
        $('.ui.dropdown.js-search-tags .text').text(text);
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
