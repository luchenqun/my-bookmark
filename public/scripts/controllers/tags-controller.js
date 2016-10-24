app.controller('tagsCtr', ['$scope', '$filter', 'bookmarkService', 'pubSubService', function($scope, $filter, bookmarkService, pubSubService) {
    console.log("Hello tagsCtr...");
    getTags({a:1, b:2, c:3});

    $scope.tags = []; // 书签数据
    pubSubService.subscribe('MenuCtr.tags', $scope, function(event, data) {
        console.log('subscribe MenuCtr.tags', data);
        var params = {a:1, b:2, c:3};
        getTags(params);

    });

    function getTags(params){
        bookmarkService.getTags(params).then(
            function(data) {
                console.log(data);
                $scope.tags = data;
            },
            function(errorMsg) {
                console.log(errorMsg);
            }
        );
    }

}]);
