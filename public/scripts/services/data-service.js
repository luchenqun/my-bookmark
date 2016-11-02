app.factory('dataService', [function() {
    var service = {
        loginParams: function() {
            return {
                username:'',
                password:'',
                autoLogin:true,
            };
        },
    };

    return service;
}]);
