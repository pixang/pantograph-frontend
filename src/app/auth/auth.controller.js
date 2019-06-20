'use strict';

angular.module('supportAdminApp')
    .controller('LoginController', [
        '$q', '$scope', '$state', '$location', '$timeout', '$rootScope', '$cookies', 'Alert', 'AuthService',
        function ($q, $scope, $state, $location, $timeout, $rootScope, $cookies, $alert, authService) {
            $scope.showLogin = true;

            $scope.form = {
                username: '',
                password: '',

                isLoading: false,
                setLoading: function (loading) {
                    this.isLoading = loading;
                }
            };
            $scope.formForRegister = {
                name: '',
                username: '',
                password1: '',
                password2: '',

                isLoading: false,
                setLoading: function (loading) {
                    this.isLoading = loading;
                }
            };
            $scope.login = function () {
                $alert.clear()

                var userInfo = {};
                userInfo.username = $scope.form.username;
                userInfo.password = $scope.form.password;

                if (!(userInfo.username && userInfo.password)) {
                    $alert.error("登陆信息不能为空，请检查", $scope);
                    return
                }

                $scope.form.setLoading(true);
                authService.signin(userInfo).then(
                    function (res) {
                        if (res == null) {
                            $scope.form.setLoading(false);
                            return
                        }
                        if (typeof (res) == "string") {
                            $alert.error(res);
                        }
                        else if (res.user.userstate == 1) {
                            $alert.error("用户已被禁止请联系管理员");
                        }
                        else {
                            $cookies.put('token', res.token);
                            $cookies.put('currentUser', res.user.username);
                            $cookies.put('currentUserRole', res.user.userrole);
                            $cookies.put('currentUserState', res.user.userstate);

                            $rootScope.$broadcast('UserChange', "login");

                            $timeout(function () {
                                $rootScope.$broadcast('ShowDashboard', "loginsuccess");
                            }, 300);
                            window.location = "#/index/main"
                        }
                        $scope.form.setLoading(false);
                    },
                    function (err) {
                        $scope.form.setLoading(false);
                        // $alert.error("用户名或密码错误，请检查");
                    }
                )
            };

            $scope.goToRegisterPage = function () {
                $scope.showLogin = false;
            };
            $scope.goToLoginPage = function () {
                $scope.showLogin = true;
            };

            $scope.signup = function () {
                $alert.clear();
                var userInfo = {};

                if ($scope.formForRegister.name && $scope.formForRegister.username && $scope.formForRegister.password1 && $scope.formForRegister.password2) {
                    if ($scope.formForRegister.password1 != $scope.formForRegister.password2) {
                        $alert.error("密码不一致，请检查");
                        return
                    }
                } else {
                    $alert.error("注册信息不能为空，请检查");
                    return
                }

                userInfo.name = $scope.formForRegister.name;
                userInfo.username = $scope.formForRegister.username;
                userInfo.password = $scope.formForRegister.password1;


                $scope.formForRegister.setLoading(true);
                authService.signup(userInfo).then(
                    function (res) {
                        if (!res) {
                            $scope.formForRegister.setLoading(false);
                            return
                        }
                        if (typeof (res) == "string") {
                            $alert.error("注册失败");
                        } else {
                            $alert.info("注册成功，请登录");
                            $scope.showLogin = true;
                        }
                        $scope.formForRegister.setLoading(false);
                    },
                    function (err) {
                        $scope.formForRegister.setLoading(false);
                        $alert.error("注册失败");
                    }
                )
            };
        }]);
