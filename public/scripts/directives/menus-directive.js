// 不要使用已有的html作为指令，如menu，否则angular会陷入死循环
app.directive('menus', function() {
    return {
        restrict: 'EAC',
        templateUrl: '/views/menus.html',
        replace: true
    }
});
