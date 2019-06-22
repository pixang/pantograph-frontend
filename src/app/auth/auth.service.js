'use strict';

angular.module('supportAdminApp')
  .factory('AuthService', ['$q', '$injector', '$cookies', '$timeout', '$rootScope', 'constants', function ($q, $injector, $cookies, $timeout, $rootScope, $const) {

    var API_URL = $const.API_URL;

    var authService = {};
    authService.toPagelogin = function (msg) {
      if ($cookies.get('currentUser')) {
        $cookies.remove('currentUser');
      }
      if ($cookies.get('token')) {
        $cookies.remove('token');
      }
      if ($cookies.get('currentUserRole')) {
        $cookies.remove('currentUserRole');
      }

      window.location = "#/auth";
      $timeout(function () {
        $rootScope.$broadcast("ResizeAuthPage", msg);
      }, 100);
    };

    authService.isLoggin = function (msg) {
      var loggedIn = $cookies.get('currentUser');
      if (loggedIn) {
        return true;
      }
      return false;
    }

    authService.signin = function (userInfo) {
      var payload = JSON.stringify(userInfo);
      var $http = $injector.get('$http');

      var request = $http({
        method: 'POST',
        url: API_URL + '/user/login',
        headers: {
          "Content-Type": "application/json"
        },
        data: payload
      });
      return request.then(
        function (response) {
          var data = JSON.stringify(response);
          if (response == null) {
            return
          }
          if (response.data && response.data.code == 200) {
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
    authService.signup = function (userInfo) {
      var payload = JSON.stringify(userInfo);
      var $http = $injector.get('$http');

      var request = $http({
        method: 'POST',
        url: API_URL + '/user/register',
        headers: {
          "Content-Type": "application/json"
        },
        data: payload
      });
      return request.then(
        function (response) {
          if (response.data.code == 0) {
            return true;
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
    authService.logout = function (token) {
      var $http = $injector.get('$http');

      var request = $http({
        method: 'GET',
        url: API_URL + '/user/logout',
        headers: {
          "Content-Type": "application/json"
        }
      });
      return request.then(
        function (response) {
            $cookies.remove('token');
            $cookies.remove('currentUser');
            $cookies.remove('currentUserRole');
            $cookies.remove('currentUserState');
          if (response.data.code == 0) {
            $rootScope.$broadcast('UserChange', "logout");
            return true;
          }
          else {
            return response.data.msg;
          }
        },
        function (error) {
        }
      );
    };

    function urlBase64Decode(str) {
      var output = str.replace('-', '+').replace('_', '/');
      switch (output.length % 4) {
        case 0:
          break;
        case 2:
          output += '==';
          break;
        case 3:
          output += '=';
          break;
        default:
          throw 'Illegal base64url string!';
      }
      return window.atob(output);
    }


    return authService;
  }
  ]);