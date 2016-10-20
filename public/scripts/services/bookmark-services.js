app.factory('bookmarkService', ['$http', '$q', function($http, $q) {
    'use strict';

    // service interface
    var service = {
        getBookmarks: getBookmarks,
        // addBookmark: addBookmark,
        // delBookmark: delBookmark,
        // editBookmark: editBookmark,
        // register: register
    };

    // Return a promise object.
    function getBookmarks(pageId) {
        var def = $q.defer();

        $http.get('/api/bookmarks/'+pageId)
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
