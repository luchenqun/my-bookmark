app.factory('bookmarkService', ['$http', '$q', function($http, $q) {
    'use strict';

    // service interface
    var service = {
        getBookmarks: getBookmarks,
        // addBookmark: addBookmark,
        // delBookmark: delBookmark,
        // editBookmark: editBookmark,
        getTags:getTags,
        // register: register
    };

    // Return a promise object.
    function getBookmarks(params) {
        var def = $q.defer();

        $http.get('/api/bookmarks/', {params:params})
            .success(function(data) {
                def.resolve(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
                def.reject('Failed to get todos');
            });

        return def.promise;
    }

    // Return a promise object.
    function getTags(params) {
        var def = $q.defer();
        $http.get('/api/tags/', {params:params})
            .success(function(data) {
                def.resolve(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
                def.reject('Failed to get todos');
            });
        return def.promise;
    }

    return service;
}]);
