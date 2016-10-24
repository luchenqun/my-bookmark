app.controller('menuCtr', ['$scope', '$state', function($scope, $state) {
    $scope.login = true;               /**< 是否登陆 */
    $scope.selectLoginIndex = 0;        /**< 默认登陆之后的选择的菜单索引，下表从 0 开始 */
    $scope.selectNotLoginIndex = 0;     /**< 默认未登陆之后的选择的菜单索引，下表从 0 开始 */

    /**
    * @todo http://stackoverflow.com/questions/31449948/ui-router-state-go-not-working
    */
    if($scope.login){
        setTimeout(()=>{ $state.go('bookmarks') }, 0);
    }

    // 登陆之后显示的菜单数据。uiSerf：内部跳转链接。
    $scope.loginMenus = [
        {uiSref:'bookmarks', title:'我的书签'},
        // {uiSref:'addBookmark', title:'添加书签'},
        {uiSref:'tags', title:'书签分类'},
        {uiSref:'advice', title:'建议'},
        {uiSref:'settings', title:'设置'},
        {uiSref:'intro', title:'说明'}
    ];

    // 未登陆显示的菜单数据
    $scope.notLoginMenus = [
        {uiSref:'intro', title:'说明'},
        {uiSref:'register', title:'注册'}
    ];

    /**
     * @func
     * @desc 根据点击的菜单，更新选择的索引
     * @param {number} index - 点击的索引
     * @param {bool} login - 登陆标志
     */
    $scope.selectMenu = function(index, login){
        if (login) {
            $scope.selectLoginIndex = index;
        } else {
            $scope.selectNotLoginIndex = index;
        }
    }

    $scope.showAddBookmarkMoadl = function(){
        $('.ui.modal.js-add-bookmark').modal('show');
    }
}]);
