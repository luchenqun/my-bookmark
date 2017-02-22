app.controller('menuCtr', ['$scope', '$stateParams', '$state', 'pubSubService', 'bookmarkService', function($scope, $stateParams, $state, pubSubService, bookmarkService) {
    console.log("Hello menuCtr")
    $scope.login = false; /**< 是否登陆 */
    $scope.selectLoginIndex = 0; /**< 默认登陆之后的选择的菜单索引，下表从 0 开始 */
    $scope.selectNotLoginIndex = 0; /**< 默认未登陆之后的选择的菜单索引，下表从 0 开始 */
    $scope.searchWord = ''; /**< 搜索关键字 */
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
    }];

    // 未登陆显示的菜单数据
    $scope.notLoginMenus = [{
        uiSref: '/',
        title: '首页'
    }, {
        uiSref: 'login',
        title: '登录|注册'
    }];

    $scope.myKeyup = function(e) {
        var keycode = window.event ? e.keyCode : e.which;
        if (keycode == 13) {
            $scope.searchBookmarks($scope.searchWord);
        }
    };

    /**
     * @func
     * @desc 点击搜索按钮搜索书签
     */
    $scope.searchBookmarks = function(searchWord) {
        $state.go('search', {
            searchWord: searchWord,
        })
        updateMenuActive($scope.selectLoginIndex = 0);
    }

    $scope.updateShowStyle = function(showStyle) {
        console.log('updateShowStyle', showStyle)
        $('.js-radio-' + showStyle).checkbox('set checked');
        $state.go('bookmarks', {
            showStyle: showStyle,
        })
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
                $state.go('login', {})
            })
            .catch((err) => console.log('logout err', err));
    }

    function updateMenuActive(index) {
        $('.ui.menu a.item').removeClass('selected');
        $('.ui.menu a.item:eq(' + index + ')').addClass('selected');
    }
}]);
