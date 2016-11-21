app.controller('bookmarksCtr', ['$scope', '$state', '$stateParams', '$filter', '$window', '$timeout', 'bookmarkService', 'pubSubService', function($scope, $state, $stateParams, $filter, $window, $timeout, bookmarkService, pubSubService) {
    console.log("Hello bookmarksCtr...", $stateParams);
    $scope.bookmarks = []; // 书签数据
    $scope.showSearch = false; // 搜索对话框
    $scope.bookmarkNormalHover = false;
    $scope.bookmarkEditHover = false;
    $scope.showStyle = ($stateParams && $stateParams.showStyle) || 'navigate'; // 显示风格'navigate', 'card', 'table'
    $('.js-radio-' + $scope.showStyle).checkbox('set checked');
    $scope.edit = false;
    const perPageItems = 20;
    $scope.totalPages = 0;
    $scope.currentPage = 1;
    $scope.inputPage = '';
    $scope.changeCurrentPage = function(currentPage) {
        currentPage = parseInt(currentPage) || 0;
        console.log(currentPage);
        if (currentPage <= $scope.totalPages && currentPage >= 1) {
            $scope.currentPage = currentPage;
            $scope.inputPage = '';
            getBookmarks(params);
        }
    }

    var params = {
        showStyle: $scope.showStyle,
    }
    getBookmarks(params);

    $scope.jumpToUrl = function(url, id) {
        if (!$scope.edit) {
            $window.open(url, '_blank');
            bookmarkService.clickBookmark({
                id: id
            });
        }
    }
    $scope.toggleMode = function() {
        $scope.edit = !$scope.edit
    };

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

    pubSubService.subscribe('EditCtr.inserBookmarsSuccess', $scope, function(event, params) {
        params.showStyle = $scope.showStyle;
        console.log('subscribe EditCtr.inserBookmarsSuccess', params);
        getBookmarks(params);
    });

    function getBookmarks(params) {
        if (params.showStyle != 'navigate') {
            params.currentPage = $scope.currentPage;
            params.perPageItems = perPageItems;
        }
        bookmarkService.getBookmarks(params)
            .then((data) => {
                if (params.showStyle != 'navigate') {
                    $scope.bookmarks = data.bookmarks;
                    $scope.totalPages = Math.ceil(data.totalItems / perPageItems);
                } else {
                    $scope.bookmarks = data;
                }
                pubSubService.publish('Common.menuActive', {
                    login: true,
                    index: 0
                });
            })
            .catch((err) => console.log('getBookmarks err', err));
    }

    // TODO: 我要将编辑按钮固定在容器的右上角 
    $(window).resize(function() {
        var top = $('.js-segment-navigate').offset().top;
        var left = $('.js-segment-navigate').offset().left;
        var width = $('.js-segment-navigate').width();
        // console.log('js-edit position update', top+10, left+width-10)
        $('.js-edit').offset({
            top: top+10,
            left: left+width-10,
        })
    });
}]);
