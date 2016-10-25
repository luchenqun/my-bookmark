app.controller('bookmarksCtr', ['$scope', '$stateParams', '$filter', 'bookmarkService', 'pubSubService', function($scope, $stateParams, $filter, bookmarkService, pubSubService) {
    console.log("Hello bookmarksCtr...", $stateParams);
    $scope.bookmarks = []; // 书签数据
    $scope.showSearch = false; // 书签数据
    semanticInit();

    var params = {
        s: 111,
        b: 222,
        i: 'lcq'
    }
    getBookmarks(params);

    pubSubService.subscribe('MenuCtr.bookmarks', $scope, function(event, data) {
        console.log('subscribe MenuCtr.bookmarks', data);
        // $scope.showSearch = (Math.random() >= 0.5);
        // if ($scope.showSearch) {
        //     setTimeout(() => {
        //         semanticInit();
        //     }, 100);
        //
        // }
        getBookmarks(data);
    });

    pubSubService.subscribe('MenuCtr.searchBookmarks', $scope, function(event, data) {
        console.log('subscribe MenuCtr.searchBookmarks', data);
        getBookmarks(data);
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
    }
}]);
