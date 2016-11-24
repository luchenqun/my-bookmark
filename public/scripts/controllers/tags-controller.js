app.controller('tagsCtr', ['$scope', '$filter', 'bookmarkService', 'pubSubService', function($scope, $filter, bookmarkService, pubSubService) {
    console.log("Hello tagsCtr...");
    getTags({});

    $scope.tags = []; // 书签数据
    pubSubService.subscribe('MenuCtr.tags', $scope, function(event, data) {
        console.log('subscribe MenuCtr.tags', data);
        getTags({});

    });

    function getTags(params) {
        bookmarkService.getTags(params)
            .then((data) => $scope.tags = data)
            .catch((err) => console.log('getTags err', err));
    }
}]);
