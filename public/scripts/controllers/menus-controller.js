app.controller('menuCtr', ['$scope', '$stateParams', '$state', '$window', '$timeout', 'pubSubService', 'bookmarkService', function($scope, $stateParams, $state, $window, $timeout, pubSubService, bookmarkService) {
    console.log("Hello menuCtr")
    $scope.login = false; /**< 是否登陆 */
    $scope.selectLoginIndex = 0; /**< 默认登陆之后的选择的菜单索引，下表从 0 开始 */
    $scope.selectNotLoginIndex = 0; /**< 默认未登陆之后的选择的菜单索引，下表从 0 开始 */
    $scope.searchWord = ''; /**< 搜索关键字 */
    $scope.showStyle = null;
    $scope.searchHistory = [];

    // 防止在登陆的情况下，在浏览器里面直接输入url，这时候要更新菜单选项
    pubSubService.subscribe('Common.menuActive', $scope, function(event, params) {
        console.log("subscribe Common.menuActive", params)
        $scope.login = (params && params.login) || false;
        var index = $scope.login ? ($scope.selectLoginIndex = (params && params.index) || 0) : ($scope.selectNotLoginIndex = (params && params.index) || 0);
        updateMenuActive(index);
    });

    // 登陆之后显示的菜单数据。uiSerf：内部跳转链接。
    $scope.loginMenus = [{
        uiSref: 'bookmarks',
        title: '书签'
    }, {
        uiSref: 'tags',
        title: '书签分类'
    }, {
        uiSref: 'advice',
        title: '留言'
    }, {
        uiSref: 'settings',
        title: '设置'
    }, {
        uiSref: 'hot',
        title: '热门收藏'
    }];

    // 未登陆显示的菜单数据
    $scope.notLoginMenus = [{
        uiSref: '/',
        title: '首页'
    }, {
        uiSref: 'login',
        title: '登录|注册'
    }, {
        uiSref: 'hot',
        title: '热门收藏'
    }];

    /**
     * @func
     * @desc 点击搜索按钮搜索书签
     */
    $scope.search = function(searchWord) {
        $scope.login = true;
        var searchOption = $('.js-search-option').dropdown('get value') || 0;
        if (searchOption == 0) {
            $state.go('search', {
                searchWord: searchWord,
            }, {
                reload: true,
            })
            updateMenuActive($scope.selectLoginIndex = 0);
        } else if (searchOption == 1) {
            $window.open('https://www.google.com.hk/#newwindow=1&safe=strict&q=' + encodeURIComponent(searchWord), '_blank');
        } else if (searchOption == 2) {
            $window.open('https://github.com/search?utf8=%E2%9C%93&q=' + encodeURIComponent(searchWord) + '&type=', '_blank');
        } else if (searchOption == 3) {
            $window.open('https://stackoverflow.com/search?q=' + encodeURIComponent(searchWord), '_blank');
        } else {
            $window.open('http://www.baidu.com/s?tn=mybookmark.cn&ch=3&ie=utf-8&wd=' + encodeURIComponent(searchWord), '_blank');
        }

        if(!searchWord){ return; }

        var newItem = {
            t: searchOption,
            d: searchWord,
        }
        var delIndex = -1;
        $scope.searchHistory.unshift(newItem);
        $scope.searchHistory.forEach((item, index) => {
            if (index >= 1 && item.t == searchOption && item.d == searchWord) {
                delIndex = index;
            }
        })
        if (delIndex >= 0) {
            $scope.searchHistory.splice(delIndex, 1);
        }

        // 大于30的不保存到数据库
        if (searchWord.length <= 30) {
            saveHistory();
        }
    }

    $scope.searchByHistory = function(type, data) {
        $scope.searchWord = data;
        $('.search-item').val($scope.searchWord);

        $('.js-search-option').dropdown('set value', type);
        var types = {};
        types[0] = '书签';
        types[1] = '谷歌';
        types[2] = 'Github';
        types[3] = '栈溢出';
        types[4] = '百度';
        $('.js-search-option').dropdown('set text', types[type]);
        $('.js-search-option').dropdown('save defaults', types[type]);
        $('.js-search-option .menu .item').removeClass('active');
        $('.js-search-option .menu .item:eq(' + type + ')').addClass('active');
        $('.js-history-popup').removeClass('visible').addClass('hidden');
        $scope.search(data);
    }

    $scope.delHistory = function(type, data) {
        var delIndex = -1;
        $scope.searchHistory.forEach((item, index) => {
            if (index >= 1 && item.t == type && item.d == data) {
                delIndex = index;
            }
        })
        if (delIndex >= 0) {
            $scope.searchHistory.splice(delIndex, 1);
        }
        saveHistory();
        $timeout(function() {
            $('.js-history-popup').removeClass('hidden').addClass('visible');
        }, 500)
    }

    $scope.updateShowStyle = function(showStyle) {
        console.log('updateShowStyle', showStyle);
        $scope.showStyle = showStyle;
        $('.js-radio-' + showStyle).checkbox('set checked');
        $state.go('bookmarks', {
            showStyle: showStyle,
        }, {
            reload: true,
        })
    }

    $scope.showAddBookmarkMoadl = function() {
        pubSubService.publish('MenuCtr.showAddBookmarkMoadl', {
            'action': 'add'
        });
    }
    $scope.logout = function() {
        bookmarkService.logout({})
            .then((data) => {
                console.log('logout..........', data)
                $scope.login = false;
                $state.go('login', {})
            })
            .catch((err) => console.log('logout err', err));
    }

    function updateMenuActive(index) {
        $('.ui.menu a.item').removeClass('selected');
        $('.ui.menu a.item:eq(' + index + ')').addClass('selected');
    }

    function saveHistory() {
        var datas = [];
        $scope.searchHistory = $scope.searchHistory.slice(0, 15); // 最多保留15个历史记录
        $scope.searchHistory.forEach((item, index) => {
            datas.push({
                t: item.t,
                d: item.d,
            })
        })

        var parmes = {
            searchHistory: JSON.stringify(datas),
        };
        bookmarkService.updateSearchHistory(parmes)
            .then((data) => {
                if (data.retCode == 0) {
                    // toastr.success('历史搜索更新成功', "提示");
                } else {
                    toastr.error('历史搜索更新失败。错误信息：' + data.msg, "错误");
                }
            })
            .catch((err) => {
                toastr.error('历史搜索更新失败。错误信息：' + JSON.stringify(err), "错误");
            });
    }

    bookmarkService.userInfo({})
        .then((data) => {
            $scope.searchHistory = JSON.parse(data.search_history || '[]');
            var count = 1;
            var id = setInterval(function () {
                var items = $('.search-item').popup({
                    on: 'focus',
                    inline: true
                });
                console.log("searchHistory = ", items.length);
                if (items.length >= 1 || count >= 20) {
                    clearInterval(id);
                }
            }, 200);
        })
        .catch((err) => {
            toastr.error('获取信息失败。错误信息：' + JSON.stringify(err), "错误");
        });
}]);
