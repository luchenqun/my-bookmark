app.controller('menuCtr', ['$scope', '$stateParams', '$state', 'pubSubService', 'bookmarkService', function($scope, $stateParams, $state, pubSubService, bookmarkService) {
    console.log("Hello menuCtr")
    $scope.login = false; /**< 是否登陆 */
    $scope.selectLoginIndex = 0; /**< 默认登陆之后的选择的菜单索引，下表从 0 开始 */
    $scope.selectNotLoginIndex = 0; /**< 默认未登陆之后的选择的菜单索引，下表从 0 开始 */
    $scope.keyword = ''; /**< 搜索关键字 */
    $scope.showSearch = false;
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
        title: '建议'
    }, {
        uiSref: 'settings',
        title: '设置'
    }];

    // 未登陆显示的菜单数据
    $scope.notLoginMenus = [{
        uiSref: '/',
        title: '首页'
    }, {
        uiSref: 'login',
        title: '登陆'
    }];

    /**
     * @func
     * @desc 点击搜索按钮搜索书签
     */
    $scope.searchBookmarks = function() {
        console.log('searchBookmarks clicked...');
        pubSubService.publish('MenuCtr.searchBookmarks', {
            'keyword': $scope.keyword
        });
        $scope.selectLoginIndex = 0;
    }

    /**
     * @func
     * @desc 点击下拉列表详情搜索
     * @warn 不要使用$('js-checkbox-search').checkbox('is checked')去取，因为dom元素还没更新的。。。
     */
    $scope.searchDetail = function() {
        $scope.showSearch = !$scope.showSearch;
        console.log('searchDetail ', $scope.showSearch)
        pubSubService.publish('MenuCtr.searchDetail', {
            'showSearch': $scope.showSearch,
        });
    }

    $scope.updateShowStyle = function(showStyle) {
        console.log('updateShowStyle', showStyle)
        $('.js-radio-' + showStyle).checkbox('set checked');
        pubSubService.publish('MenuCtr.updateShowStyle', {
            'showStyle': showStyle,
        });
    }

    $scope.showAddBookmarkMoadl = function() {
        pubSubService.publish('MenuCtr.showAddBookmarkMoadl', {
            'action': 'add'
        });
    }
    $scope.logout = function() {
        var params = {
            userName: 'luchenqun'
        };
        bookmarkService.logout(params)
            .then((data) => {
                console.log('logout..........', data)
                $scope.login = false;
                $state.go('login', {
                    foo: 'i love you',
                    bar: 'hello world'
                })
            })
            .catch((err) => console.log('logout err', err));
    }

    // 元素构造完成之后，开始使用jquery初始化
    $scope.$on('elementRenderFinished', function(elementRenderFinishedEvent) {
        console.log('menus elementRenderFinished')
        $scope.showSearch = $('.js-checkbox-search').checkbox('is checked');
        $('.js-bookmark-dropdown').dropdown({
            action: 'hide',
        });
        $('.ui.dropdown').dropdown({
            on: 'hover',
        });

        $('.ui.checkbox').checkbox();
        $('.ui.checkbox.js-radio-navigate').checkbox('check');
        $('.ui.menu a.item').on('click', function() {
            $(this).addClass('selected').siblings().removeClass('selected');
        });

        $(".ui.menu a.item:first").hover(
            function() {
                $('.js-bookmark-dropdown').dropdown('show');
            },
            function() {
                setTimeout(() => {
                    if ($('.js-menu-option:hover').length === 0) {
                        $('.js-bookmark-dropdown').dropdown('hide');
                    }
                }, 100)
            }
        );

        $('.ui.menu a.item').on('click', function() {
            $(this).addClass('selected').siblings().removeClass('selected');
        });
    });

    function updateMenuActive(index) {
        $('.ui.menu a.item').removeClass('selected');
        $('.ui.menu a.item:eq(' + index + ')').addClass('selected');
    }
}]);
