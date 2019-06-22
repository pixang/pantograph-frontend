'use strict';

var module = angular.module('supportAdminApp');

module.controller("UserMangae", ['$scope', '$state', '$rootScope', '$timeout', '$uibModal', 'Alert', 'UserManageService',
    function ($scope, $state, $rootScope, $timeout, $modal, $alert, userManageService) {

        // footable
        angular.element(document).ready(function () {
            $('.footable').footable({ paginate: false });
        });

        $scope.$on('UserTableUpdated', function (event) {
            $timeout(function () {
                $('.footable').trigger('footable_redraw');
                $rootScope.$broadcast('ResizePage');
            }, 100);
        });

        // fixed data
        $scope.userRole = ['管理员', '普通用户'];
        $scope.userState = ['允许用户', '禁止用户'];

        $scope.formSearch = {
            userRole: '',
            userState: '',

            setLoaded: function (loaded) {
                this.isLoaded = loaded;
            },
            setLoading: function (loading) {
                this.isLoading = loading;
            }
        }

        $scope.search = function () {
            $alert.clear();
            var err = [];

            $scope.formSearch.setLoading(true);
            userManageService.retrieveUser().then(
                function (data) {
                    if (typeof (data) == "string") {
                        $alert.error(data);
                        $scope.formSearch.setLoading(false);
                        return
                    }
                    $scope.users = data;
                    $scope.$broadcast('UserTableUpdated');
                    $scope.formSearch.setLoading(false);
                },
                function (err) {
                    $alert.error(err);
                    $scope.formSearch.setLoading(false);
                }
            )
        }
        $scope.users = [];

        $scope.openEditDialog = function (index) {
            var modalInstance = $modal.open({
                size: 'sm',
                templateUrl: 'app/user_manage/user-edit-dialog.html',
                controller: 'UserEditDialogController',
                resolve: {
                    user: function () { return $scope.users[index]; }
                }
            });
        };

        angular.element(document).ready(function () {
            $rootScope.$broadcast("HideDashboard", "wusuowei");
            $scope.search();
            $rootScope.$broadcast('RecoverNavbar');
            $rootScope.$broadcast('ResizePage');

        });
    }]);


module.controller('UserEditDialogController', [
    '$scope', '$rootScope', '$uibModalInstance', 'UserManageService', 'Alert','$cookies', 'user',
    function ($scope, $rootScope, $modalInstance, userManageService, $alert,$cookies, user) {
        $scope.currentUserRole = $cookies.get('currentUserRole')

        $scope.user = user;
        user.userrole = user.userrole.toString();
        user.userstate = user.userstate.toString();

        $scope.form = {
            name: user.name,
            username: user.username,
            userrole: user.userrole,
            userstate: user.userstate,
            isLoading: false,
            setLoading: function (loading) {
                this.isLoading = loading;
            }
        };

        $scope.cancel = function () {
            $modalInstance.close();
        };

        $scope.saveUser = function () {
            $alert.clear();
            var userForSave = {};

            if (user.userrole == $scope.form.userrole && user.userstate == $scope.form.userstate) {
                $alert.error('用户信息未被更改！', $scope);
                return;
            }
            userForSave.name = $scope.form.name;
            userForSave.username = $scope.form.username;
            userForSave.userrole = parseInt($scope.form.userrole);
            userForSave.userstate = parseInt($scope.form.userstate);

            if (window.confirm('确定要保存所更改的用户信息?')) {
                $scope.form.setLoading(true);
                userManageService.saveUser(userForSave).then(
                    function (data) {
                        if (data == "更新成功") {
                            user.userrole = parseInt($scope.form.userrole);
                            user.userstate = parseInt($scope.form.userstate);
                            $scope.form.setLoading(false);
                            $alert("更新成功，即将关闭窗口", $scope);
                            $timeout(function () {
                                $modalInstance.close();
                            }, 3000);
                        } else {
                            $alert.error("更新失败", $scope);
                            $scope.form.setLoading(false);
                        }
                    },
                    function (err) {
                        $scope.form.setLoading(false);
                    }
                );
            }
        };
    }
]);