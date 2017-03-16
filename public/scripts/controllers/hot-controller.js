app.controller('hotCtr', ['$scope', '$state', '$stateParams', '$filter', '$window', '$timeout', 'ngDialog', 'bookmarkService', 'pubSubService', function($scope, $state, $stateParams, $filter, $window, $timeout, ngDialog, bookmarkService, pubSubService) {
    console.log("Hello hotCtr...");
    $scope.bookmarks = []; // 书签数据
    $scope.bookmarkNormalHover = false;
    $scope.bookmarkEditHover = false;
    const perPageItems = 20;
    $scope.totalPages = 0;
    $scope.currentPage = 1;
    $scope.inputPage = '';
    $scope.loadBusy = false;
    $scope.curDay = 0;
    $scope.toastrId = 0;

    bookmarkService.autoLogin()
        .then((data) => {
            var login = data.logined;
            var index = login ? 4 : 2;
            pubSubService.publish('Common.menuActive', {
                login: login,
                index: index
            });
        })
        .catch((err) => {
            console.log('autoLogin err', err)
        });

    getBookmarks();

    $scope.jumpToUrl = function(url) {
        $window.open(url, '_blank');
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

    $scope.storeBookmark = function(bookmark) {
        var b = $.extend(true, {}, bookmark); // 利用jQuery执行深度拷贝
        pubSubService.publish('TagCtr.storeBookmark', b);
    }

    $scope.copy = function(id, url) {
        var clipboard = new Clipboard('#hoturl' + id, {
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

    $scope.detailBookmark = function(b) {
        var bookmark = $.extend(true, {}, b); // 利用jQuery执行深度拷贝
        bookmark.own = false;
        bookmark.tags = [{
            id: -1,
            name: '热门收藏'
        }];
        console.log(JSON.stringify(bookmark));
        pubSubService.publish('TagCtr.showBookmarkInfo', bookmark);
    }

    $scope.loadCardData = function() {
        console.log('loadCardData.........')
        if (!$scope.loadBusy) {
            var menusScope = $('div[ng-controller="menuCtr"]').scope();
            var login = (menusScope && menusScope.login) || false;
            if (login) {
                getBookmarks();
            } else {
                toastr.remove();
                $scope.toastrId = toastr.info('想要查看更多热门标签，请先登录！', "提示");
            }
        }
    }

    function getBookmarks() {
        $scope.loadBusy = true;
        var requireData = {
            userId: null,
            lastupdataTime: new Date().getTime(),
            pageNo: 1,
            pageSize: 1000,
            sort: 'desc',
            renderType: 0,
            date: CurentDate($scope.curDay),
            idfa: "d4995f8a0c9b2ad9182369016e376278",
            os: "ios",
            osv: "9.3.5"
        }
        var api = "https://api.shouqu.me/api_service/api/v1/daily/dailyMark";
        $.ajax({
            url: api,
            type: 'post',
            data: requireData,
            success: function(json) {
                // console.log('success............', json, JSON.stringify(json.data.list[0]) );
                var alterRex = "/mmbiz.qpic.cn|images.jianshu.io|zhimg.com/g";
                var alterImg = "./images/snap/default.png"
                $timeout(function() {
                    $scope.loadBusy = false;
                    if (json.code == 200) {
                        var bookmarkList = json.data.list;
                        bookmarkList.forEach((bookmark) => {
                            var b = {};
                            b.title = bookmark.title;
                            b.url = bookmark.url;
                            b.favicon = bookmark.sourceLogo;
                            b.from = bookmark.sourceName;
                            b.image = alterImg;
                            if (bookmark.imageList.length >= 1) {
                                b.image = (json.data.pageNo == 1 ? (bookmark.imageList[0].url.match(alterRex) != null ? alterImg : bookmark.imageList[0].url) : alterImg);
                            }
                            b.click_count = bookmark.favCount;
                            b.created_at = $filter('date')(new Date(bookmark.updatetime), "yyyy-MM-dd HH:mm:ss");
                            b.last_click = $filter('date')(new Date(bookmark.createtime), "yyyy-MM-dd HH:mm:ss");
                            b.id = bookmark.id;

                            b.edit = false;
                            $scope.bookmarks.push(b);
                        })
                        $scope.curDay--;
                    } else {
                        toastr.error('获取热门书签失败！失败原因：' + json.message, "提示");
                    }
                }, 100);
            },
            error: function(json) {
                toastr.error('获取热门书签失败！失败原因：' + json.message, "提示");
                $scope.loadBusy = false;
            }
        });

        var menusScope = $('div[ng-controller="menuCtr"]').scope();
        var login = (menusScope && menusScope.login) || false;
        var index = login ? 4 : 2;
        pubSubService.publish('Common.menuActive', {
            login: login,
            index: index
        });
    }

    function CurentDate(i) {
        if (i == undefined) {
            i = 0;
        }
        var now = new Date();
        now.setTime(now.getTime() + i * 24 * 60 * 60 * 1000);
        var year = now.getFullYear(); //年
        var month = now.getMonth() + 1; //月
        var day = now.getDate(); //日
        var clock = year + "年" + month + "月" + day + "日";
        return (clock);
    }

    function transition() {}

    function animation() {
        var data = ['scale', 'fade', 'fade up', 'fade down', 'fade left', 'fade right', 'horizontal flip',
            'vertical flip', 'drop', 'fly left', 'fly right', 'fly up', 'fly down', 'swing left', 'swing right', 'swing up',
            'swing down', 'browse', 'browse right', 'slide down', 'slide up', 'slide left', 'slide right'
        ];
        var t = data[parseInt(Math.random() * 1000) % data.length];

        return t;
    }
}]);
