app.controller('searchCtr', ['$scope', '$state', '$stateParams', '$filter', '$window', '$timeout', '$document', 'ngDialog', 'bookmarkService', 'pubSubService', 'dataService', function($scope, $state, $stateParams, $filter, $window, $timeout, $document, ngDialog, bookmarkService, pubSubService, dataService) {
    console.log("Hello searchCtr...", $stateParams);
    if(dataService.smallDevice()){
        $window.location = "http://m.mybookmark.cn/#/tags";
        return;
    }

    const perPageItems = 20;
    var dialog = null;
    $scope.hoverBookmark = null;
    $scope.searchBookmarks = []; // 书签数据
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
    $scope.searchHotBookmarks = false;
    var timeagoInstance = timeago();

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
        index: dataService.LoginIndexBookmarks
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
            $scope.searchBookmarks.forEach(function(bookmark) {
                if (bookmark.id == id && bookmark.own) {
                    bookmark.click_count += 1;
                    bookmark.last_click = $filter("date")(new Date(), "yyyy-MM-dd HH:mm:ss");
                }
            })
            $timeout(function() {
                timeagoInstance.cancel();
                timeagoInstance.render(document.querySelectorAll('.need_to_be_rendered'), 'zh_CN');
            }, 100)
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
                    animation: dataService.animation(),
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

    $scope.copy = function(url) {
        dataService.clipboard(url);
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
        console.log('dateCreate = ', dateCreate)
        if (dateCreate) {
            if (dateCreate != -1) {
                params.dateCreate = dateCreate;
            }
        } else {
            params.dateCreateBegin = $scope.dateCreateBegin;
            params.dateCreateEnd = $scope.dateCreateEnd;
        }

        var dateClick = $('.js-click-date').dropdown('get value') || undefined;
        console.log('dateClick = ', dateClick)
        if (dateClick) {
            if (dateClick != -1) {
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

    $scope.setHoverBookmark = function(bookmark) {
        $scope.hoverBookmark = bookmark;
    }

    // 在输入文字的时候也会触发，所以不要用Ctrl,Shift之类的按键
    $document.bind("keydown", function(event) {
        $scope.$apply(function() {
            var key = event.key.toUpperCase();
            console.log($scope.hoverBookmark);
            if ($scope.hoverBookmark && dataService.keyShortcuts()) {
                if (key == 'E' && $scope.hoverBookmark.own) {
                    $scope.editBookmark($scope.hoverBookmark.id)
                } else if (key == 'I') {
                    $scope.detailBookmark($scope.hoverBookmark)
                } else if (key == 'D' && $scope.hoverBookmark.own) {
                    $scope.delBookmark($scope.hoverBookmark)
                } else if (key == 'C') {
                    $scope.copy($scope.hoverBookmark.url)
                }
            }
        })
    });

    pubSubService.subscribe('EditCtr.inserBookmarsSuccess', $scope, function(event, data) {
        console.log('subscribe EditCtr.inserBookmarsSuccess', JSON.stringify(data));
        $scope.searchBookmarks.forEach((bookmark) => {
            if (bookmark.id == data.id) {
                bookmark.title = data.title;
                bookmark.url = data.url;
                bookmark.description = data.description;
                bookmark.tags = data.tags;
            }
        })
    });

    function searchBookmarks(params) {
        $scope.loading = true;
        $('.js-table-search').transition('hide');
        if ($scope.searchHotBookmarks) {
            console.log(params);
            bookmarkService.searchHotBookmarks(params)
                .then((data) => {
                    $scope.searchBookmarks = [];
                    data.bookmarks.forEach((bookmark) => {
                        bookmark.tags = [{
                            id: -1,
                            name: bookmark.created_by, // 给转存用
                        }]
                        bookmark.created_at = $filter('date')(new Date(bookmark.created_at), "yyyy-MM-dd HH:mm:ss");
                        bookmark.last_click = $filter('date')(new Date(bookmark.last_click), "yyyy-MM-dd HH:mm:ss");
                        $scope.searchBookmarks.push(bookmark);
                    })
                    $scope.bookmarkCount = data.totalItems;
                    $scope.totalPages = Math.ceil($scope.bookmarkCount / perPageItems);
                    $scope.loading = false;
                    transition();
                })
                .catch((err) => {
                    console.log('searchHotBookmarks err', err);
                    $scope.loading = false;
                });
        } else {
            bookmarkService.searchBookmarks(params)
                .then((data) => {
                    $scope.searchBookmarks = data.bookmarks;
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
    }

    function transition() {
        $timeout(function() {
            timeagoInstance.cancel();
            timeagoInstance.render(document.querySelectorAll('.need_to_be_rendered'), 'zh_CN');
        }, 100)
        var className = 'js-table-search';
        $('.' + className).transition('hide');
        $('.' + className).transition({
            animation: dataService.animation(),
            duration: 500,
        });
    }

}]);
