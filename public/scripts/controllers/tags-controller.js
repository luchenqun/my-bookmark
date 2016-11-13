app.controller('tagsCtr', ['$scope', '$filter', 'bookmarkService', 'pubSubService', function($scope, $filter, bookmarkService, pubSubService) {
    console.log("Hello tagsCtr...");
    getTags({
        user_id: '1'
    });

    $scope.tags = []; // 书签数据
    pubSubService.subscribe('MenuCtr.tags', $scope, function(event, data) {
        console.log('subscribe MenuCtr.tags', data);
        var params = {
            a: 1,
            b: 2,
            c: 3
        };
        getTags(params);

    });

    function getTags(params) {
        bookmarkService.getTags(params)
            .then((data) => $scope.tags = data)
            .catch((err) => console.log('getTags err', err));
    }
}]);
