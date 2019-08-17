app.controller('weixinArticleCtr', ['$scope', '$state', '$sce', '$stateParams', '$filter', '$window', '$timeout', '$document', 'ngDialog', 'bookmarkService', 'pubSubService', 'dataService', function($scope, $state, $sce, $stateParams, $filter, $window, $timeout, $document, ngDialog, bookmarkService, pubSubService, dataService) {
    console.log("Hello weixinArticleCtr...");
    if(dataService.smallDevice()){
        $window.location = "http://m.mybookmark.cn/#/tags";
        return;
    }
    var key = curentDate(undefined, "yyyyMMdd");

    $scope.hoverBookmark = null;
    $scope.bookmarks = []; // 书签数据
    $scope.bookmark = {};
    $scope.bookmarkNormalHover = false;
    $scope.bookmarkEditHover = false;

    const perPageItems = 40;
    $scope.totalPages = 0;
    $scope.currentPage = 1;
    $scope.channelId = 1;

    $scope.inputPage = '';
    $scope.loadBusy = false;
    $scope.curDay = 0;
    $scope.toastrId = 0;
    $scope.random = 0;
    $scope.channels = JSON.parse(`[{"id":1,"name":"热门", "clicked": true},{"id":2,"name":"搞笑"},{"id":3,"name":"养生堂"},{"id":4,"name":"私房话"},{"id":5,"name":"八卦精"},{"id":6,"name":"科技咖"},{"id":7,"name":"财经迷"},{"id":8,"name":"汽车控"},{"id":9,"name":"生活家"},{"id":10,"name":"时尚圈"},{"id":11,"name":"育儿"},{"id":12,"name":"旅游"},{"id":13,"name":"职场"},{"id":14,"name":"美食"},{"id":15,"name":"历史"},{"id":16,"name":"教育"},{"id":17,"name":"星座"},{"id":18,"name":"体育"},{"id":19,"name":"军事"},{"id":20,"name":"游戏"},{"id":21,"name":"萌宠"}]`);
    $scope.callCount = parseInt((localStorage && localStorage.getItem('weixin' + key)) || 1);
    $scope.maxCallCount = 100;
    $scope.user = {};
    var timeagoInstance = timeago();
    
    bookmarkService.autoLogin()
        .then((data) => {
            var login = data.logined;
            var index = login ? dataService.LoginIndexHot : dataService.NotLoginIndexHot;
            $scope.user = data.user || {};
            pubSubService.publish('Common.menuActive', {
                login: login,
                index: index
            });
        })
        .catch((err) => {
            console.log('autoLogin err', err)
        });

    $scope.jumpToUrl = function(url) {
        $window.open(url, '_blank');
    }

    $scope.favoriteBookmark = function(b) {
        var menusScope = $('div[ng-controller="menuCtr"]').scope();
        var login = (menusScope && menusScope.login) || false;
        if (!login) {
            $scope.toastrId = toastr.info('请先登录再收藏书签！', "提示");
            return;
        }

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
        var menusScope = $('div[ng-controller="menuCtr"]').scope();
        var login = (menusScope && menusScope.login) || false;
        if (!login) {
            $scope.toastrId = toastr.info('请先登录再转存书签！', "提示");
        } else {
            var b = $.extend(true, {}, bookmark); // 利用jQuery执行深度拷贝
            b.tags = [{
                name: b.created_by
            }]
            pubSubService.publish('TagCtr.storeBookmark', b);
        }
    }

    $scope.copy = function(url) {
        dataService.clipboard(url);
    }

    $scope.detailBookmark = function(b) {
        if(!b.content) {
            $scope.jumpToUrl(b.url);
            return;
        }
        $scope.bookmark = b;
        $('.js-weixin-content').modal({ blurring: true }).modal('setting', 'transition', dataService.animation()).modal('show')
        $timeout(function() {
            $('.js-main-content').animate({scrollTop:0},100);
            $('.js-weixin-content').modal("refresh");
        }, 10)
    }

    $scope.close = function() {
        $('.js-weixin-content').modal('setting', 'transition', dataService.animation()).modal('hide');
    }

    // 快捷键r随机推荐
    $document.bind("keydown", function(event) {
        $scope.$apply(function() {
            // console.log(event.keyCode);
            var menusScope = $('div[ng-controller="menuCtr"]').scope();
            var login = (menusScope && menusScope.login) || false;
            var blur = (menusScope && menusScope.blur) || false;
            // r按键，显示
            if (event.keyCode == 82 && login && (!blur)) {
                $scope.bookmarks = [];
                $scope.randomHotBookmarks();
            }

            var key = event.key.toUpperCase();
            if ($scope.hoverBookmark && dataService.keyShortcuts()) {
                if (key == 'I') {
                    $scope.detailBookmark($scope.hoverBookmark)
                } else if (key == 'C') {
                    $scope.copy($scope.hoverBookmark.url)
                }
            }
        })
    });

    $scope.randomHotBookmarks = function() {
        var menusScope = $('div[ng-controller="menuCtr"]').scope();
        var login = (menusScope && menusScope.login) || false;
        if (login) {
            $scope.random = true;
            var beginDay = new Date(2016, 7, 15); // 注意日期是从0 ~ 11
            var now = new Date();
            var dayGap = parseInt(Math.abs(now - beginDay) / (1000 * 60 * 60 * 24)) + 1;
            $scope.curDay = -(parseInt(Math.random() * 1000000) % dayGap);
            getHotBookmarksbyCache();
        } else {
            $scope.toastrId = toastr.info('您只有先登录，才能使用查看随机热门标签', "提示");
        }
    }

    $scope.setHoverBookmark = function(bookmark) {
        $scope.hoverBookmark = bookmark;
    }

    $scope.changeCurrentPage = function (currentPage) {
        currentPage = parseInt(currentPage) || 0;
        console.log(currentPage);
        if (currentPage <= $scope.totalPages && currentPage >= 1) {
            $scope.getWeixinArticles($scope.channelId, currentPage);
            $scope.currentPage = currentPage;
        }
    }

    $scope.getWeixinArticles = function(channelId, page) {
        var menusScope = $('div[ng-controller="menuCtr"]').scope();
        var login = (menusScope && menusScope.login) || false;
        var index = login ? dataService.LoginIndexHot : dataService.NotLoginIndexHot;
        pubSubService.publish('Common.menuActive', {
            login: login,
            index: index
        });
        $scope.bookmarks = []
        $scope.bookmark = {}
        $scope.loadBusy = true;
        $scope.channelId = channelId;
        $scope.currentPage = page;
        $scope.totalPages = 0;
        var start = (page - 1) * perPageItems;
        var api = `https://api.jisuapi.com/weixinarticle/get?channelid=${channelId}&start=${start}&num=${perPageItems}&appkey=e95887468ab87d69`;
        if(localStorage) {
            var count = parseInt(localStorage.getItem('weixin' + key) || 1);
            if (count <= $scope.maxCallCount || $scope.user.username === 'lcq') {
                $.ajax({
                    url: api,
                    type: 'get',
                    dataType : "jsonp",
                    jsonp : "callback",
                    success: function(body) {
                        dealBody(body);
                        if(channelId == 1 && page == 1) {
                            getHotBookmarksbyAPI();
                        } else {
                            $scope.randomHotBookmarks();
                        }
                    },
                    error: function(json) {
                        $scope.loadBusy = false;
                        toastr.error('获取热门失败！失败原因：' + json.msg, "提示");
                        getHotBookmarksbyCache();
                    }
                });
                localStorage.setItem('weixin' + key, count+1)
                $scope.callCount = count+1;
            } else {
                getHotBookmarksbyCache();
                toastr.warning('每天只允许实时调用 100 次剩下的只从缓存中获取', "提示");
            }
        } else {
            getHotBookmarksbyCache();
        }
    }

    function getHotBookmarksbyAPI() {
        // $scope.loadBusy = true;
        var requireData = {
            userId: null,
            lastupdataTime: new Date().getTime(),
            pageNo: 1,
            pageSize: 1000,
            sort: 'desc',
            renderType: 0,
            date: curentDate($scope.curDay, "yyyy年M月d日"),
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
                $timeout(function() {
                    $scope.loadBusy = false;
                    var alterRex = "/mmbiz.qpic.cn|images.jianshu.io|zhimg.com/g";
                    var defaultSnap = "./images/default.jpg"
                    var defaultFavicon = "./images/default.ico"
                    if (json.code == 200) {
                        var bookmarkList = json.data.list;
                        bookmarkList.forEach((bookmark) => {
                            var b = {};
                            b.title = bookmark.title;
                            b.url = bookmark.url;
                            b.favicon_url = bookmark.sourceLogo || defaultFavicon;
                            b.created_by = bookmark.sourceName;
                            b.snap_url = defaultSnap;
                            if (bookmark.imageList.length >= 1) {
                                if (bookmark.imageList[0].url) {
                                    b.snap_url = (json.data.pageNo == 1 ? (bookmark.imageList[0].url.match(alterRex) != null ? defaultSnap : bookmark.imageList[0].url) : defaultSnap);
                                } else {
                                    for (var i = 0; i < bookmark.images.length; i++) {
                                        if (bookmark.images[i]) {
                                            b.snap_url = bookmark.images[i];
                                            break;
                                        }
                                    }
                                }
                            }
                            b.fav_count = bookmark.favCount;
                            b.created_at = $filter('date')(new Date(bookmark.createtime < bookmark.updatetime ? bookmark.createtime : bookmark.updatetime), "yyyy-MM-dd HH:mm:ss");
                            b.last_click = $filter('date')(new Date(bookmark.createtime > bookmark.updatetime ? bookmark.createtime : bookmark.updatetime), "yyyy-MM-dd HH:mm:ss");
                            b.id = bookmark.articleId;
                            b.index = $scope.bookmarks.length - 1;
                            $scope.bookmarks.push(b);
                        })
                    }
                }, 10)
            },
            error: function(json) {
                $scope.loadBusy = false;
                toastr.error('获取热门书签失败！失败原因：' + json.message + "。将尝试从缓存中获取！", "提示");
            }
        });
    }

    function getHotBookmarksbyCache() {
        $scope.loadBusy = true;
        var date = curentDate($scope.curDay, "yyyyMMdd");
        if (date < "20160715") {
            toastr.info('您已将将所有的热门标签都加载完了！', "提示");
            $scope.loadBusy = false;
            return; // 这是最早的了。
        }
        var params = {
            date: date,
        }
        bookmarkService.getHotBookmarks(params)
            .then((data) => {
                data.forEach((bookmark) => {
                    bookmark.created_at = $filter('date')(new Date(bookmark.updatetime), "yyyy-MM-dd HH:mm:ss");
                    bookmark.index = $scope.bookmarks.length - 1;
                    $scope.bookmarks.push(bookmark);
                })
                $scope.curDay--;
                $scope.loadBusy = false;
                if (data && data.length == 0) {
                    getHotBookmarksbyCache(); // 没有继续请求
                }
            })
            .catch((err) => {
                toastr.error("getHotBookmarksbyCache: " + JSON.stringify(err), "提示");
                $scope.curDay--;
                $scope.loadBusy = false;
                getHotBookmarksbyCache(); // 没有继续请求
            });
    }

    // TODO: 我要将编辑按钮固定在容器的右上角

    function curentDate(i, format) {
        if (i == undefined) {
            i = 0;
        }
        if (format == undefined) {
            format = 'yyyyMMddhhmmss'
        }
        var now = new Date();
        now.setTime(now.getTime() + i * 24 * 60 * 60 * 1000);
        clock = $filter('date')(now, format);
        return clock;
    }

    function dealBody(body) {
        console.log('success............', body);
        $scope.loadBusy = false;
        $timeout(function() {
            var defaultSnap = "./images/default.jpg"
            var defaultFavicon = "./images/weixin.ico"
            if (body.status == 0) {
                var weixinArticles = body.result.list;
                var id = body.result.channelid;
                var total = body.result.total;
                $scope.totalPages = parseInt(total / perPageItems) + 1;
                $scope.channels.forEach((channel) => {
                    if (channel.id === id) {
                        channel.total = total;
                    }
                })

                weixinArticles.forEach((articl, index) => {
                    let cdate = new Date(articl.time).getTime() + (parseInt(Math.random() * 10000000000) % 36000)
                    var b = {};
                    b.index = index;
                    b.title = articl.title;
                    b.url = articl.url;
                    b.favicon_url = defaultFavicon;
                    b.created_by = articl.weixinname;
                    b.account = articl.weixinaccount;
                    b.snap_url = articl.pic || defaultSnap;
                    b.fav_count = articl.likenum;
                    b.created_at = timeagoInstance.format(cdate,'zh_CN');
                    b.content = articl.content
                    b.content = b.content.replace(/https:\/\/mmbiz.qpic.cn/gi, "http://img01.store.sogou.com/net/a/04/link?appid=100520029&url=https://mmbiz.qpic.cn")
                    b.content = b.content.replace(/http:\/\/mmbiz.qpic.cn/gi, "http://img01.store.sogou.com/net/a/04/link?appid=100520029&url=https://mmbiz.qpic.cn")
                    b.content = $sce.trustAsHtml(b.content);
                    b.tags = [{
                        id: -1,
                        name: body.result.channel
                    }];
                    $scope.bookmarks.push(b);
                })
            } else {
                toastr.error('获取热门失败！失败原因：' + body.msg, "提示");
            }
        }, 10);
    }

    $scope.getWeixinArticles($scope.channelId, $scope.currentPage);
}]);
