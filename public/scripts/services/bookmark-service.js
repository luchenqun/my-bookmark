app.factory('bookmarkService', ['$http', '$q', function($http, $q) {
    // service interface
    var service = {
        getTitle: function(params) {
            var def = $q.defer();
            $http.post('/api/getTitle/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                    def.reject('Failed to get getTitle');
                });
            return def.promise;
        },
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
        clickBookmark: function(params) {
            var def = $q.defer();
            $http.post('/api/clickBookmark/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    console.log('Error: ' + data);
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
        autoLogin: function() {
            var def = $q.defer();
            $http.get('/api/autoLogin/')
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
                .error(function(data, status) {
                    console.log('Error: ' + data, status);
                    def.reject('Failed to get todos');
                });
            return def.promise;
        },
        getBookmark: function(params) {
            var def = $q.defer();

            $http.get('/api/bookmark/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data, status) {
                    console.log('Error: ' + data, status);
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
        updateBookmark: function(params) {
            console.log('service updateBookmark')
            var def = $q.defer();
            $http.post('/api/updateBookmark/', {
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
        delBookmark: function(params) {
            var def = $q.defer();
            $http.delete('/api/delBookmark/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                    def.reject('delBookmark fail');
                });
            return def.promise;
        },
        editBookmark: function(params) {

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

app.factory('AuthenticationService', function() {
    var auth = {
        isAuthenticated: false,
        isAdmin: false
    }

    return auth;
});

app.factory('TokenInterceptor', function($q, $window, $location, AuthenticationService) {
    return {
        request: function(config) {
            config.headers = config.headers || {};
            if ($window.sessionStorage.token) {
                config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
            }
            return config;
        },

        requestError: function(rejection) {
            return $q.reject(rejection);
        },

        /* Set Authentication.isAuthenticated to true if 200 received */
        response: function(response) {
            if (response != null && response.status == 200 && $window.sessionStorage.token && !AuthenticationService.isAuthenticated) {
                AuthenticationService.isAuthenticated = true;
            }
            return response || $q.when(response);
        },

        /* Revoke client authentication if 401 is received */
        responseError: function(rejection) {
            if (rejection != null && rejection.status === 401 && ($window.sessionStorage.token || AuthenticationService.isAuthenticated)) {
                delete $window.sessionStorage.token;
                AuthenticationService.isAuthenticated = false;
                // $location.path("/admin/login");
                console.log('responseError')
            }

            return $q.reject(rejection);
        }
    };
});
