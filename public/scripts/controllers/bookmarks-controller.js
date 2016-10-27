app.controller('bookmarksCtr', ['$scope', '$stateParams', '$filter', '$window', 'bookmarkService', 'pubSubService', function($scope, $stateParams, $filter, $window, bookmarkService, pubSubService) {
    console.log("Hello bookmarksCtr...", $stateParams);
    $scope.bookmarks = []; // 书签数据
    $scope.showSearch = false; // 书签数据
    $scope.showStyle = 'navigate'; // 显示风格'navigate', 'card', 'table'
    semanticInit();

    var params = {
        show: $scope.showStyle,
    }
    getBookmarks(params);
    $scope.jumpToUrl = function(url) {
        console.log(url);
        $window.open(url, '_blank');
    }

    pubSubService.subscribe('MenuCtr.bookmarks', $scope, function(event, params) {
        console.log('subscribe MenuCtr.bookmarks', params);
        getBookmarks(params);
    });

    pubSubService.subscribe('MenuCtr.searchBookmarks', $scope, function(event, params) {
        console.log('subscribe MenuCtr.searchBookmarks', params);
        getBookmarks(params);
    });

    function getBookmarks(params) {
        bookmarkService.getBookmarks(params).then(
            function(data) {
                console.log(data);
                $scope.bookmarks = data;
            },
            function(errorMsg) {
                console.log(errorMsg);
            }
        );
    }

    function semanticInit() {
        setTimeout(() => {
            $('.ui.dropdown').dropdown();
            $('.ui.calendar.js-date-begin').calendar({
                type: 'date',
                formatter: {
                    date: function(date, settings) {
                        if (!date) return '';
                        var day = date.getDate();
                        var month = date.getMonth() + 1;
                        var year = date.getFullYear();
                        return year + '/' + month + '/' + day;
                    }
                },
                endCalendar: $('.ui.calendar.js-date-end')
            });
            $('.ui.calendar.js-date-end').calendar({
                type: 'date',
                formatter: {
                    date: function(date, settings) {
                        if (!date) return '';
                        var day = date.getDate();
                        var month = date.getMonth() + 1;
                        var year = date.getFullYear();
                        return year + '/' + month + '/' + day;
                    }
                },
                startCalendar: $('.ui.calendar.js-date-begin')
            });

            $('.js-navigate-bookmark').hover(function() {
                $(this).addClass('div-hover');
            }, function() {
                //鼠标离开时移除divOver样式
                $(this).removeClass('div-hover');
            });
        }, 100);
    }
}]);
