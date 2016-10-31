app.factory('bookmarkService', ['$http', '$q', function($http, $q) {
    // service interface
    var service = {
        login: function(params) {
            var def = $q.defer();
            $http.post('/api/login/', {
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
        logout: function(params) {
            var def = $q.defer();
            $http.post('/api/logout/', {
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
        autoLogin: function(params) {
            var def = $q.defer();
            $http.get('/api/autoLogin/', {
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
        /**
         * @func
         * @desc 根据显示页数的索引，获取书签的数据
         * @param {object} params - 参数
         */
        getBookmarks: function(params) {
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
        addBookmark: function(params) {
            var def = $q.defer();
            $http.post('/api/addBookmark/', {
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
        addTags: function(params) {
            var def = $q.defer();
            $http.post('/api/addTags/', {
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
    };

    return service;
}]);
