'use strict';

var module = angular.module('supportAdminApp');

module.controller("SystemConfiguration", ['$scope', '$state', '$rootScope', '$timeout', '$mdpDatePicker', '$mdpTimePicker', 'Alert', 'SystemConfigurationService',
    function ($scope, $state, $rootScope, $timeout, $mdpDatePicker, $mdpTimePicker, $alert, systemConfigurationService) {
        $scope.formSearch = {
            isLoaded: false,
            isLoading: false,
            setLoaded: function (loaded) {
                this.isLoaded = loaded;
            },
            setLoading: function (loading) {
                this.isLoading = loading;
            }
        };
        $scope.formForThreshold = {
            mhAlarm: null,
            mhWarn: null,
            tempAlarm: null,
            tempWarn: null,
            zxAlarm: null,
            zxWarn: null,
        };
        $scope.searchThresholdData = function () {
            $scope.formSearch.setLoading(true);
            $scope.formSearch.setLoaded(false);
            systemConfigurationService.retrieveThresholdData().then(
                function (data) {
                    $scope.formForThreshold = data;

                    $scope.formSearch.setLoaded(true);
                    $scope.formSearch.setLoading(false);
                },
                function (err) {
                    $scope.formSearch.setLoading(false);
                }
            )
        };
        $scope.saveThresholdData = function () {
            $alert.clear();

            for (var prop in $scope.formForThreshold) {
                if ($scope.formForThreshold[prop] || $scope.formForThreshold[prop] == 0) {
                    if (isNaN($scope.formForThreshold[prop])) {
                        $alert.error("数据不合法，请检查");
                        return
                    } else {
                        $scope.formForThreshold[prop] = fix_number($scope.formForThreshold[prop])
                    }
                }
                else {
                    $alert.error("数据不能为空，请检查");
                    return
                }
            }
            var searchCondition = $scope.formForThreshold;

            $scope.formSearch.setLoading(true);
            $scope.formSearch.setLoaded(false);
            systemConfigurationService.saveThresholdData(searchCondition).then(
                function (data) {
                    if (data == "更新成功") {
                        $alert.info("保存成功");
                    }

                    $scope.formSearch.setLoaded(true);
                    $scope.formSearch.setLoading(false);
                },
                function (err) {
                    $alert.clear();
                    $alert.error("服务器出错，未能保存成功");
                    $scope.formSearch.setLoading(false);
                }
            )
        };

        $scope.searchThresholdData();

        $scope.backFromConfigurationPage = function () {
            $rootScope.$broadcast("ShowDashboard");
            $state.go('index.main');
        };

        function fix_number(x) {
            return Number.parseFloat(x).toFixed(3);
        }

        angular.element(document).ready(function () {
            $rootScope.$broadcast("HideDashboard");
        });
    }]);
