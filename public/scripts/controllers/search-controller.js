app.controller('searchCtr', ['$scope', '$state', '$stateParams', '$filter', '$window', '$timeout', 'ngDialog', 'bookmarkService', 'pubSubService', function($scope, $state, $stateParams, $filter, $window, $timeout, ngDialog, bookmarkService, pubSubService) {
    console.log("Hello searchCtr...", $stateParams);
    const perPageItems = 20;
    var dialog = null;
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
    $scope.loading = false;
    $scope.waitDelBookmark = {};

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
    // 默认登陆
    pubSubService.publish('Common.menuActive', {
        login: true,
        index: 0
    });

    var searchParams = {
        searchWord: $scope.searchWord,
        currentPage: 1,
        perPageItems: perPageItems,
        userRange: '1', // 默认搜索自己的书签
    }
    if ($scope.searchWord) {
        searchBookmarks(searchParams);
    } else {
        toastr.warning("请输入搜索关键字再进行查询！", "提示");
    }

    $scope.jumpToUrl = function(url, id) {
        if (!$scope.edit) {
            $window.open(url);
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

    $scope.delBookmark = function(bookmark) {
        $scope.waitDelBookmark = $.extend(true, {}, bookmark); // 利用jQuery执行深度拷贝
        dialog = ngDialog.open({
            template: './views/dialog-del-bookmark.html',
            className: 'ngdialog-theme-default',
            scope: $scope
        });
    }

    $scope.confirmDelBookmark = function(bookmarkId) {
        var params = {
            id: bookmarkId
        }
        ngDialog.close(dialog);
        bookmarkService.delBookmark(params)
            .then((data) => {
                $("#" + bookmarkId).transition({
                    animation: animation(),
                    duration: 500,
                    onComplete: function() {
                        $("#" + bookmarkId).remove();
                    }
                });
                toastr.success($scope.waitDelBookmark.title + ' 书签删除成功！', "提示");
            })
            .catch((err) => {
                toastr.error($scope.waitDelBookmark.title + ' 书签删除失败！错误提示：' + JSON.stringify(err), "提示");
            });
    }

    $scope.editBookmark = function(bookmarkId) {
        pubSubService.publish('bookmarksCtr.editBookmark', {
            'bookmarkId': bookmarkId
        });
    }

    $scope.detailBookmark = function(bookmark) {
        pubSubService.publish('TagCtr.showBookmarkInfo', bookmark);
    }

    $scope.storeBookmark = function(bookmark) {
        var b = $.extend(true, {}, bookmark); // 利用jQuery执行深度拷贝
        pubSubService.publish('TagCtr.storeBookmark', b);
    }

    $scope.favoriteBookmark = function(b) {
        var bookmark = {}
        bookmark.description = '';
        bookmark.title = b.title;
        bookmark.url = b.url;
        bookmark.public = 1;
        bookmark.click_count = 1;

        bookmarkService.favoriteBookmark(bookmark)
            .then((data) => {
                pubSubService.publish('EditCtr.inserBookmarsSuccess', data);
                if (data.title) {
                    toastr.success('[ ' + data.title + ' ] 收藏成功！', "提示");
                } else {
                    toastr.error('[ ' + bookmark.title + ' ] 收藏失败！', "提示");
                }
            })
            .catch((err) => {
                toastr.error('[ ' + bookmark.title + ' ] 收藏失败，' + JSON.stringify(err), "提示");
            });
    }

    $scope.copy = function(id, url) {
        var clipboard = new Clipboard('#searchurl' + id, {
            text: function() {
                return url;
            }
        });

        clipboard.on('success', function(e) {
            toastr.success(url + '<br/>已复制到您的剪切板', "提示");
            clipboard.destroy();
        });

        clipboard.on('error', function(e) {
            toastr.error(url + '<br/>复制失败', "提示");
            clipboard.destroy();
        });
    }

    $scope.search = function(page) {
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
        params.currentPage = page ? page : $scope.currentPage;
        params.perPageItems = perPageItems;

        $scope.currentPage = params.currentPage;
        searchBookmarks(params)
        console.log('search..', page, 'params = ', params)
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
        $scope.loading = true;
        $('.js-table-search').transition('hide');
        bookmarkService.searchBookmarks(params)
            .then((data) => {
                $scope.bookmarks = data.bookmarks;
                $scope.bookmarkCount = data.totalItems;
                $scope.totalPages = Math.ceil($scope.bookmarkCount / perPageItems);
                $scope.loading = false;
                transition();
            })
            .catch((err) => {
                console.log('getBookmarks err', err);
                $scope.loading = false;
            });
    }

    function animation() {
        var data = ['scale', 'fade', 'fade up', 'fade down', 'fade left', 'fade right', 'horizontal flip',
            'vertical flip', 'drop', 'fly left', 'fly right', 'fly up', 'fly down', 'swing left', 'swing right', 'swing up',
            'swing down', 'browse', 'browse right', 'slide down', 'slide up', 'slide left', 'slide right'
        ];
        var t = data[parseInt(Math.random() * 1000) % data.length];

        return t;
    }

    function transition() {
        var className = 'js-table-search';
        $('.' + className).transition('hide');
        $('.' + className).transition({
            animation: animation(),
            duration: 500,
        });
    }

}]);
