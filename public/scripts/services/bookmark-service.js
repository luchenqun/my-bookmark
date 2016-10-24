app.factory('bookmarkService', ['$http', '$q', function($http, $q) {
    // service interface
    var service = {
        /**
         * @func
         * @desc 根据显示页数的索引，获取书签的数据
         * @param {object} params - 参数
         */
        getBookmarks: function getBookmarks(params) {
            var def = $q.defer();

            $http.get('/api/bookmarks/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                    def.reject('Failed to get todos');
                });
            return def.promise;
        },
        addBookmark: function() {

        },
        delBookmark: function() {

        },
        editBookmark: function() {

        },
        /**
         * @func
         * @desc 根据显示页数的索引，获取书签的数据
         * @param {object} params - 参数
         */
        getTags: function getTags(params) {
            var def = $q.defer();
            $http.get('/api/tags/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                    def.reject('Failed to get todos');
                });
            return def.promise;
        },
        // register: register
    };

    return service;
}]);
