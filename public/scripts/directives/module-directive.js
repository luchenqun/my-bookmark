app.directive('bookmarkinfo', function() {
    return {
        restrict: 'EAC',
        templateUrl: '/views/bookmark-info.html',
        replace: true
    }
});

app.directive('edit', function() {
    return {
        restrict: 'EAC',
        templateUrl: '/views/edit.html',
        replace: true
    }
});

// 不要使用已有的html作为指令，如menu，否则angular会陷入死循环
app.directive('menus', function() {
    return {
        restrict: 'EAC',
        templateUrl: '/views/menus.html',
        replace: true
    }
});

app.directive('pagination', function() {
    return {
        restrict: 'EA',
        templateUrl: '/views/pagination.html',
        replace: true,
        link: function(scope, element, attrs) {}
    }
});
