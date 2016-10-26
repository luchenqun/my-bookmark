app.controller('menuCtr', ['$scope', '$state', 'pubSubService', function($scope, $state, pubSubService) {
    $scope.login = true; /**< 是否登陆 */
    $scope.selectLoginIndex = 0; /**< 默认登陆之后的选择的菜单索引，下表从 0 开始 */
    $scope.selectNotLoginIndex = 0; /**< 默认未登陆之后的选择的菜单索引，下表从 0 开始 */
    $scope.keyword = ''; /**< 搜索关键字 */
    semanticInit();

    /**
     * @todo http://stackoverflow.com/questions/31449948/ui-router-state-go-not-working
     */
    if ($scope.login) {
        setTimeout(() => {
            $state.go('bookmarks', {
                foo: 'i love you',
                bar: 'hello world'
            })
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
        pubSubService.publish('MenuCtr.searchDetail', {
            'key': 'JavaScript'
        });
    }
    $scope.showAddBookmarkMoadl = function() {
        $('.ui.modal.js-add-bookmark').modal('show');
    }

    function semanticInit() {
        setTimeout(() => {
            $('.ui.dropdown').dropdown({
                action: 'nothing',
            });
            $('.ui.checkbox').checkbox();
            $('.ui.checkbox.js-radio-navigate').checkbox('check');
            $('.ui.menu a.item').on('click', function() {
                $(this)
                    .addClass('active')
                    .siblings()
                    .removeClass('active');
            });
        }, 100);
    }
}]);
