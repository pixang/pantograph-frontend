'use strict';

angular.module('supportAdminApp')
    .factory('UserManageService', ['$log', '$q', '$http', 'constants',
        function ($log, $q, $http, $const) {
            // local dev
            var API_URL = $const.API_URL;
            var UserManageService = {};

            UserManageService.retrieveUser = function () {

                var request = $http({
                    method: 'GET',
                    url: API_URL + '/user/allusers',
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
                return request.then(
                    function (response) {
                        if (response.data.code == 0) {
                            return response.data.data;
                        }
                        else {
                            return response.data.msg;
                        }
                    },
                    function (error) {
                        return $q.reject({ error: error });
                    }
                );
            };


            UserManageService.saveUser = function (user) {
                var payload = JSON.stringify(user);

                var request = $http({
                    method: 'PUT',
                    url: API_URL + '/user/update',
                    headers: {
                        "Content-Type": "application/json"
                    },
                    data: payload
                });

                return request.then(
                    function (response) {
                        if (response.data.code == 0) {
                            return response.data.data;
                        }
                        else {
                            return response.data.msg;
                        }
                    },
                    function (error) {
                        return $q.reject({ error: error });
                    }
                );
            }


            // UserManageService.createRecord = function(data){
            //     var result = [];
            //     angular.forEach(data, function(user){
            //         result = result.concat(UserManageService.transferResult(user));
            //     });
            //     return result;
            // }
            // UserManageService.transferResult = function(elem){
            //     var User = function() {};
            //     var users = [];
            //     var user = {};

            //     user.name = elem.name;
            //     user.username = elem.username;
            //     user.userRole = elem.userrole == 0 ? '普通用户':'管理员';;
            //     user.userstate = elem.userstate == 0 ? '禁止用户':'允许用户';;

            //     users.push(angular.extend(new User(), user));
            //     return users;
            // }

            return UserManageService;
        }]);
