angular.module('supportAdminApp')
    .config(function($httpProvider){
    
    //  $httpProvider.defaults.withCredentials = true;
     $httpProvider.interceptors.push(['$q', '$location', '$cookies', 'Alert',function($q, $location,$cookies,$alert) {
        return {
            'request': function (config) {
                config.headers = config.headers || {};
                if ($cookies.get('token')) {
                    config.headers.Authorization = 'Bearer ' + $cookies.get('token');
                    config.headers.currentUser = $cookies.get('currentUser');
                }
                if(config.url.indexOf('http://') !== -1){
                    console.log('config: ' + JSON.stringify(config))
                }
                return config;
            },
            'responseError': function(response) {
                console.log("interceptor:  "  + JSON.stringify(response));

                if (response.status == -1){
                    $alert.clear();
                    $alert.warning("与服务器失去连接。");
                    return $q.reject({ error: "lose connection!" });
                }else if(response.status == 403){
                    authService.toPagelogin("token timeout");
                }else {
                    $alert.clear();
                    var msg = "status: " + response.status + ",error: " + response.data.error;
                    $alert.error(msg);
                    return $q.reject({ error: response.error });
                }
            }
        };
    }]);
});


