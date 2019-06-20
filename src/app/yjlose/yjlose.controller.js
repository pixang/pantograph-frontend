'use strict';

var module = angular.module('supportAdminApp');

module.controller("YjLoseController", ['$scope', '$state', '$rootScope', '$timeout', '$mdpDatePicker', '$mdpTimePicker', 'Alert', 'HistoryTrendService', 'constants',
    function ($scope, $state, $rootScope, $timeout, $mdpDatePicker, $mdpTimePicker, $alert, historyTrendService, $const) {

        // fixed data
        $scope.line = $const.LINE;
        $scope.station = $const.STATION;
        $scope.trainIds = $const.TRAIN_ID;

        $scope.formSearch = {
            startTime: new Date(),
            endTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
            isLoaded: false,
            isLoading: false,
            setLoaded: function (loaded) {
                this.isLoaded = loaded;
            },
            setLoading: function (loading) {
                this.isLoading = loading;
            }
        };
        $scope.dateTransfer = function (date) {
            var Y = date.getFullYear(),
                M = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : '' + (date.getMonth() + 1),
                D = date.getDate() < 10 ? '0' + (date.getDate()) : '' + (date.getDate()),
                h = date.getHours() < 10 ? '0' + (date.getHours()) : '' + (date.getHours()),
                m = date.getMinutes() < 10 ? '0' + (date.getMinutes()) : '' + (date.getMinutes()),
                s = date.getSeconds() < 10 ? '0' + (date.getSeconds()) : '' + (date.getSeconds());
            return Y + M + D + h + m + s;
        };

        $scope.search = function () {
            $alert.clear();
            var err = [];
            var searchCondition = {};
            if ($scope.formSearch.startTime) {
                searchCondition.startDate = $scope.dateTransfer($scope.formSearch.startTime);
            } else {
                err.push("起始时间不能为空");
            }
            if ($scope.formSearch.endTime) {
                searchCondition.endDate = $scope.dateTransfer($scope.formSearch.endTime);
            } else {
                err.push("结束时间不能为空");
            }

            if (searchCondition.startTime > searchCondition.endTime) {
                $alert.error("起始时间不能大于结束时间");
                return
            }
            $scope.formSearch.setLoaded(false);
            $scope.formSearch.setLoading(true);
            historyTrendService.retrieveYjLoseRecord(searchCondition).then(
                function (data) {
                    if (typeof (data) == "string") {
                        $alert.error(data);
                        $scope.formSearch.setLoading(false);
                        return
                    }

                    $scope.chartData = {
                        trainDate: [],
                        loseYJ: []
                    };
                    for (var idx = 0, len = data.length; idx < len; idx++) {
                        $scope.chartData.trainDate.push("第" + (idx + 1) + "周");
                        $scope.chartData.loseYJ.push(data[idx].loseYJ);
                    }
                    $scope.$broadcast('ChartDataUpdated');
                    $scope.formSearch.setLoaded(true);
                    $scope.formSearch.setLoading(false);
                },
                function (err) {
                    $alert.error("服务器出错", $scope);
                    $scope.formSearch.setLoading(false);
                }
            )
        };

        $scope.$on('ChartDataUpdated', function (event) {
            $timeout(function () {
                $rootScope.$broadcast('ResizePage');
            }, 400);
        });

        $scope.$on('ChartDataUpdated', function (event) {
            var yj = new Highcharts.Chart({
                chart: {
                    renderTo: 'yj',
                    type: 'spline',
                    backgroundColor: '#fafafa',
                    zoomType: 'x',
                    marginRight: 100
                },
                title: {
                    text: '羊角缺失趋势分析图'
                },
                xAxis: {
                    categories: $scope.chartData.trainDate,
                    tickInterval: $scope.tickInterval
                },
                yAxis: {
                    title: {
                        text: '羊角缺失'
                    },
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: '#808080'
                    }]
                },
                series: [
                    {
                        name: '羊角缺失',
                        data: $scope.chartData.loseYJ
                    }
                ]
            });
        });

        angular.element(document).ready(function () {
            $rootScope.$broadcast("HideDashboard");
            $('.footable').footable({ paginate: false });
            $rootScope.$broadcast('ResizePage');
        });
    }]);
