app.factory('bookmarkService', ['$http', '$q', function($http, $q) {
    // service interface
    var service = {
        getArticle: function(params) {
            var def = $q.defer();
            $http.post('/api/getArticle/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    def.reject('getArticle error');
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
                    def.reject('login error');
                });
            return def.promise;
        },
        register: function(params) {
            var def = $q.defer();
            $http.post('/api/register/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    def.reject('register error');
                });
            return def.promise;
        },
        resetPassword: function(params) {
            var def = $q.defer();
            $http.post('/api/resetPassword/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    def.reject('register error');
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
                    def.reject('clickBookmark error');
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
                    def.reject('logout error');
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
                    def.reject('autoLogin error');
                });
            return def.promise;
        },
        userInfo: function(params) {
            var def = $q.defer();
            $http.get('/api/userInfo/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    def.reject('userInfo error');
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
                    def.reject('getBookmarks error');
                });
            return def.promise;
        },
        getBookmarksByTag: function(params) {
            var def = $q.defer();

            $http.get('/api/bookmarksByTag/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data, status) {
                    def.reject('bookmarksByTag error');
                });
            return def.promise;
        },
        searchBookmarks: function(params) {
            var def = $q.defer();

            $http.get('/api/searchBookmarks/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data, status) {
                    def.reject('searchBookmarks error');
                });
            return def.promise;
        },
        searchHotBookmarks: function(params) {
            var def = $q.defer();

            $http.get('/api/searchHotBookmarks/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data, status) {
                    def.reject('searchHotBookmarks error');
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
                    def.reject('getBookmark error');
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
                    def.reject('addBookmark error');
                });
            return def.promise;
        },
        favoriteBookmark: function(params) {
            var def = $q.defer();
            $http.post('/api/favoriteBookmark/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    def.reject('favorite error');
                });
            return def.promise;
        },
        updateBookmark: function(params) {
            var def = $q.defer();
            $http.post('/api/updateBookmark/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    def.reject('updateBookmark error');
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
                    def.reject('delBookmark error');
                });
            return def.promise;
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
                    def.reject('getTags error');
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
                    def.reject('addTags error');
                });
            return def.promise;
        },
        updateTagName: function(params) {
            var def = $q.defer();
            $http.post('/api/updateTagName/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    def.reject('updateTagName error');
                });
            return def.promise;
        },
        updateTagsIndex: function(params) {
            var def = $q.defer();
            $http.post('/api/updateTagsIndex/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    def.reject('updateTagsIndex error');
                });
            return def.promise;
        },
        delTag: function(params) {
            var def = $q.defer();
            $http.post('/api/delTag/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    def.reject('delTag error');
                });
            return def.promise;
        },
        updateShowStyle: function(params) {
            var def = $q.defer();
            $http.post('/api/updateShowStyle/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    def.reject('updateShowStyle error');
                });
            return def.promise;
        },
        updateSearchHistory: function(params) {
            var def = $q.defer();
            $http.post('/api/updateSearchHistory/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    def.reject('updateSearchHistory error');
                });
            return def.promise;
        },
        getAdvices: function(params) {
            var def = $q.defer();
            $http.get('/api/advices/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    def.reject('getAdvices error');
                });
            return def.promise;
        },
        addAdvice: function(params) {
            var def = $q.defer();
            $http.post('/api/addAdvice/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    def.reject('addAdvice error');
                });
            return def.promise;
        },
        getHotBookmarks: function(params) {
            var def = $q.defer();

            $http.get('/api/hotBookmarks/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data, status) {
                    def.reject('getHotBookmarks error');
                });
            return def.promise;
        },
        addNote: function(params) {
            var def = $q.defer();
            $http.post('/api/addNote/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data, status) {
                    def.reject('addNote error');
                });
            return def.promise;
        },
        getNotes: function(params) {
            var def = $q.defer();
            $http.get('/api/notes/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    def.reject('getNotes error');
                });
            return def.promise;
        },
    };

    return service;
}]);

app.factory('httpInterceptor', ['$q', '$injector', function($q, $injector) {
    var defered = $q.defer();
    var httpInterceptor = {
        request: function(config) {
            return config;
        },
        requestError: function(err) {
            return $q.reject(err);
        },
        response: function(res) {
            return $q.resolve(res);
        },
        responseError: function(err) {
            if (401 === err.status) {
                // toastr.warning("您需要先登录才能使用该功能", "警告");
                $injector.get('$state').go('login', {})
            } else {
                toastr.error(JSON.stringify(err), "错误");
            }
            return $q.reject(err);
        }
    }
    return httpInterceptor;
}]);
