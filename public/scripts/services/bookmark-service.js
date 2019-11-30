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
                    def.reject(data);
                });
            return def.promise;
        },
        getUpdateLog: function(params) {
            var def = $q.defer();
            $http.post('/api/getUpdateLog/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
                });
            return def.promise;
        },
        jumpQuickUrl: function(params) {
            var def = $q.defer();
            $http.post('/api/jumpQuickUrl/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
                });
            return def.promise;
        },
        updateTagShow: function(params) {
            var def = $q.defer();
            $http.post('/api/updateTagShow/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
                });
            return def.promise;
        },
        updateQuickUrl: function(params) {
            var def = $q.defer();
            $http.post('/api/updateQuickUrl/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
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
                    def.reject(data);
                });
            return def.promise;
        },
        delNote: function(params) {
            var def = $q.defer();
            $http.delete('/api/delNote/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    def.reject(data);
                });
            return def.promise;
        },
        updateNote: function(params) {
            var def = $q.defer();
            $http.post('/api/updateNote/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    def.reject(data);
                });
            return def.promise;
        },
        updateNotePublic: function(params) {
          var def = $q.defer();
          $http.post('/api/updateNotePublic/', {
                  params: params
              })
              .success(function(data) {
                  def.resolve(data);
              })
              .error(function(data) {
                  def.reject(data);
              });
          return def.promise;
      },
        download: function(params) {
            var def = $q.defer();
            $http.get('/api/download/', {
                    params: params
                })
                .success(function(data) {
                    def.resolve(data);
                })
                .error(function(data) {
                    def.reject(data);
                });
            return def.promise;
        },
    };

    return service;
}]);
