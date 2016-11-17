app.factory('dataService', [function() {
    const service = {
        Enum: {
            UserSelf: 1,
        },
        loginParams: function() {
            return {
                username: '',
                password: '',
                autoLogin: true,
            };
        },

    };

    return service;
}]);
