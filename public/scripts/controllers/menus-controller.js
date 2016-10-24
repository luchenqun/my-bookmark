app.controller('menuCtr', ['$scope', '$state', 'pubSubService', function($scope, $state, pubSubService) {
    $scope.login = true; /**< 是否登陆 */
    $scope.selectLoginIndex = 0; /**< 默认登陆之后的选择的菜单索引，下表从 0 开始 */
    $scope.selectNotLoginIndex = 0; /**< 默认未登陆之后的选择的菜单索引，下表从 0 开始 */
    $scope.keyword = ''; /**< 搜索关键字 */
    $scope.showSearchInput = true; /**< 是否显示输入搜索关键字的输入框 */
    if ($scope.login) {
        setTimeout(() => {
            $state.go('bookmarks')
        }, 0);
    }
    semanticInit();


    /**
     * @todo http://stackoverflow.com/questions/31449948/ui-router-state-go-not-working
     */
    if ($scope.login) {
        setTimeout(() => {
            $state.go('bookmarks')
        }, 0);
    }

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
    }, {
        uiSref: 'intro',
        title: '说明'
    }];

    // 未登陆显示的菜单数据
    $scope.notLoginMenus = [{
        uiSref: 'intro',
        title: '说明'
    }, {
        uiSref: 'register',
        title: '注册'
    }];

    /**
     * @func
     * @desc 根据点击的菜单，更新选择的索引
     * @param {number} index - 点击的索引
     * @param {bool} login - 登陆标志
     */
    $scope.selectMenu = function(index, login) {
        var msg = 'MenuCtr.';
        if (login) {
            $scope.selectLoginIndex = index;
            msg += $scope.loginMenus[index].uiSref;
        } else {
            $scope.selectNotLoginIndex = index;
            msg += $scope.notLoginMenus[index].uiSref;
        }
        console.log(msg);
        pubSubService.publish(msg);
    }

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
     */
    $scope.searchDetail = function() {
        $scope.showSearchInput = false;
        pubSubService.publish('MenuCtr.searchDetail', {
            'key': 'JavaScript'
        });
    }
    $scope.showAddBookmarkMoadl = function() {
        $('.ui.modal.js-add-bookmark').modal('show');
    }

    function semanticInit() {
        $('.ui.dropdown').dropdown();
    }
}]);
