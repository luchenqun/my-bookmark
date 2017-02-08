app.controller('searchCtr', ['$scope', '$state', '$stateParams', '$filter', '$window', '$timeout', 'bookmarkService', 'pubSubService', function($scope, $state, $stateParams, $filter, $window, $timeout, bookmarkService, pubSubService) {
    console.log("Hello searchCtr...", $stateParams);
    const perPageItems = 20;
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
    $scope.totalPages = 0;
    $scope.currentPage = 1;
    $scope.inputPage = '';
    $scope.changeCurrentPage = function(currentPage) {
        currentPage = parseInt(currentPage) || 0;
        console.log(currentPage);
        if (currentPage <= $scope.totalPages && currentPage >= 1) {
            $scope.currentPage = currentPage;
            $scope.inputPage = '';
            $scope.search();
        }
    }

    bookmarkService.getTags({})
        .then((data) => {
            $scope.tags = data;
        })
        .catch((err) => console.log('getTags err', err));

    var searchParams = {
        searchWord: $scope.searchWord,
        currentPage: 1,
        perPageItems: perPageItems,
    }
    if ($scope.searchWord) {
        searchBookmarks(searchParams);
    } else {
        $state.go('/', {})
    }

    $scope.jumpToUrl = function(url, id) {
        if (!$scope.edit) {
            $window.open(url, '_blank');
            bookmarkService.clickBookmark({
                id: id
            });
            $scope.bookmarks.forEach(function(bookmark) {
                if (bookmark.id == id) {
                    bookmark.click_count += 1;
                    bookmark.last_click = $filter("date")(new Date(), "yyyy-MM-dd");
                }
            })
        }
    }

    $scope.delBookmark = function(bookmarkId) {
        toastr.warning('暂时不允许搜索的书签进行删除操作', "警告");
        return;
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
        toastr.warning('暂时不允许搜索的书签进行编辑操作', "警告");
        return;
        pubSubService.publish('bookmarksCtr.editBookmark', {
            'bookmarkId': bookmarkId
        });
    }

    $scope.detailBookmark = function(bookmarkId) {
        toastr.warning('功能暂未实现。。。', "警告");
    }

    $scope.copyBookmark = function(bookmarkUrl) {
        toastr.warning('功能暂未实现。。。', "警告");
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
        params.currentPage = $scope.currentPage;
        params.perPageItems = perPageItems;
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
                $scope.bookmarks = data.bookmarks;
                $scope.bookmarkCount = data.totalItems;
                $scope.totalPages = Math.ceil($scope.bookmarkCount / perPageItems);
                toastr.success('搜索书签成功，共为您找到相关书签约 ' + $scope.bookmarkCount + ' 个', "提示");
                // 有点问题，暂时留在这里
                // pubSubService.publish('Common.menuActive', {
                //     login: true,
                //     index: 0
                // });
            })
            .catch((err) => console.log('getBookmarks err', err));
    }
}]);
