// 不要使用已有的html作为指令，如menu，否则angular会陷入死循环
app.directive('pagination', function() {
    return {
        restrict: 'EA',
        templateUrl: '/views/pagination.html',
        replace: true,
        // scope: {
        //     conf: '='
        // },
        link: function(scope, element, attrs) {}
    }
});
