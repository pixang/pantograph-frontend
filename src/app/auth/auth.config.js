angular.module('supportAdminApp')
    .config(function($httpProvider){
    
    //  $httpProvider.defaults.withCredentials = true;
     $httpProvider.interceptors.push(['$q', '$location', '$cookies', 'AuthService',function($q, $location,$cookies,authService) {
        return {
            'request': function (config) {
                config.headers = config.headers || {};
                if ($cookies.get('token')) {
                    config.headers.Authorization = 'Bearer ' + $cookies.get('token');
                    config.headers.currentUser = $cookies.get('currentUser');

                }
                return config;
            },
            'responseError': function(response) {
                console.log("interceptor:  "  + JSON.stringify(response));
                if (response.status == -1){
                    authService.toPagelogin("lose connect");
                    return
                }else if(response.status == 403){
                    authService.toPagelogin("token timeout");
                }
                // return $q.reject(response);
            }
        };
    }]);
});


