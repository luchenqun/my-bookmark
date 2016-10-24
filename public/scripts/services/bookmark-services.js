app.factory('bookmarkService', ['$http', '$q', function($http, $q) {
    'use strict';

    // service interface
    var service = {
        /**
         * @func
         * @desc 根据显示页数的索引，获取书签的数据
         * @param {number} pageNum - 页数
         */
        getBookmarks: function getBookmarks(pageNum) {
            var def = $q.defer();

            $http.get('/api/bookmarks/' + pageNum)
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                    def.reject('Failed to get todos');
                });

            return def.promise;
        },
        // addBookmark: addBookmark,
        // delBookmark: delBookmark,
        // editBookmark: editBookmark,
        // register: register
    };

    // Return a promise object.



    return service;
}]);
