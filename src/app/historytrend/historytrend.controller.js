'use strict';

var module = angular.module('supportAdminApp');

module.controller("HistoryTrendController", ['$scope', '$state', '$rootScope', '$timeout', '$mdpDatePicker', '$mdpTimePicker', 'Alert', 'HistoryTrendService', 'constants',
    function ($scope, $state, $rootScope, $timeout, $mdpDatePicker, $mdpTimePicker, $alert, historyTrendService, $const) {
        $scope.selectedItem = null;
        $scope.inputTrainId = "001002";
        $scope.querySearch = function (query) {
            return query ? $scope.trainIds.filter(createFilterFor(query)) : $scope.trainIds;
        };
        $scope.selectedTrainIdChange = function (trainId) {
            $scope.formSearch.trainId = trainId;
        };
        $scope.searchInputChange = function (trainId) {
            $scope.formSearch.trainId = trainId;
        };

        function createFilterFor(query) {
            return function filterFn(trainIds) {
                return (trainIds.indexOf(query) === 0);
            };
        }

        // fixed data 
        $scope.line = $const.LINE;
        $scope.station = $const.STATION;
        $scope.trainIds = $const.TRAIN_ID;

        $scope.archNums = [
            { name: '奇B', value: 1 },
            { name: '奇D', value: 2 },
            { name: '偶B', value: 3 },
        ];
        $scope.selectType = [
            { name: '磨耗', value: 1 },
            { name: '中心偏移', value: 2 },
            { name: '温度', value: 3 },
            { name: '羊角', value: 4 }
        ];

        $scope.selectRadioButton = function (value) {
            $scope.formSearch.selectType = value;
        };

        $scope.formSearch = {
            startTime: new Date(),
            endTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
            trainId: "001002",

            archNum: 1,
            selectType: null,

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

            if (!$scope.formSearch.trainId || !$scope.formSearch.archNum) {
                err.push("查询条件有误，请检查");
            }
            if (err.length > 0) {
                $alert.error(err.join('! '));
                return
            }
            if ($scope.trainIds.indexOf($scope.formSearch.trainId) == -1) {
                $alert.error("不存在该车号，请检查");
                return
            }

            if (searchCondition.startTime > searchCondition.endTime) {
                $alert.error("起始时间不能大于结束时间");
                return
            }
            searchCondition.trainId = $scope.formSearch.trainId;
            searchCondition.gnum = $scope.formSearch.archNum;
            searchCondition.page = 1;
            searchCondition.size = 1000000;

            $scope.searchMh();

            $scope.loadTick_temp = 0;
            $scope.formSearch.setLoaded(false);
            $scope.formSearch.setLoading(true);
            historyTrendService.retrieveRecord(searchCondition).then(
                function (data) {
                    if (typeof (data) == "string") {
                        $alert.error(data);
                        $scope.formSearch.setLoading(false);
                        return
                    }

                    $scope.chartData = {
                        trainDate: [],
                        // onemhValue:[],
                        // twomhValue:[],
                        zxValue: [],
                        tempValue: []
                    };
                    var historyRecord = data.historyVos;
                    var date;
                    for (var idx = 0, len = historyRecord.length; idx < len; idx++) {
                        date = historyRecord[len - idx - 1].trainDate.toString();

                        $scope.chartData.trainDate.push(date.slice(0, 4) + '-' + date.slice(4, 6) + '-' + date.slice(6, 8) + ' ' +
                            date.slice(8, 10) + ':' + date.slice(10, 12) + ':' + date.slice(12, 14));
                        //
                        // $scope.chartData.onemhValue.push(historyRecord[idx].onemhValue);
                        // $scope.chartData.twomhValue.push(historyRecord[idx].twomhValue);
                        $scope.chartData.zxValue.push(historyRecord[len - idx - 1].zxValue);
                        $scope.chartData.tempValue.push(historyRecord[len - idx - 1].tempValue);
                    }
                    $scope.$broadcast('ChartDataUpdated');
                },
                function (err) {
                    $scope.formSearch.setLoading(false);
                }
            )
        };
        $scope.searchMh = function () {
            var searchCondition = {};
            searchCondition.startDate = $scope.dateTransfer($scope.formSearch.startTime);
            searchCondition.endDate = $scope.dateTransfer($scope.formSearch.endTime);

            searchCondition.trainId = $scope.formSearch.trainId;
            searchCondition.gnum = $scope.formSearch.archNum;
            searchCondition.page = 1;
            searchCondition.size = 1000000;
            searchCondition.type = 1;


            $scope.loadTick_mh = 0;
            $scope.formSearch.setLoaded(false);
            $scope.formSearch.setLoading(true);
            historyTrendService.retrieveMhChartRecord(searchCondition).then(
                function (data) {
                    if (typeof (data) == "string") {
                        $alert.error(data);
                        $scope.formSearch.setLoading(false);
                        return
                    }

                    $scope.chartMhData = {
                        trainDate: [],
                        onemhValue: [],
                        twomhValue: []
                    };
                    var historyRecord = data;
                    var date;
                    for (var idx = 0, len = historyRecord.length; idx < len; idx++) {
                        date = historyRecord[idx].trainDate.toString();
                        $scope.chartMhData.trainDate.push(date.slice(0, 4) + '-' + date.slice(4, 6) + '-' + date.slice(6, 8));

                        if (historyRecord[idx].oneMHAvg != null && historyRecord[idx].twoMHAvg != null) {
                            $scope.chartMhData.onemhValue.push(parseFloat(historyRecord[idx].oneMHAvg.toFixed(2)));
                            $scope.chartMhData.twomhValue.push(parseFloat(historyRecord[idx].twoMHAvg.toFixed(2)));
                        }
                    }
                    $scope.$broadcast('ChartMhDataUpdated');
                },
                function (err) {
                    $scope.formSearch.setLoading(false);
                }
            )
        };
        $scope.loadTick_mh = 0;
        $scope.loadTick_temp = 0;
        $scope.$on('ChartDataUpdated', function (event) {
            $scope.loadTick_temp++;
            if ($scope.loadTick_temp == 1 && $scope.loadTick_mh == 1) {
                $scope.formSearch.setLoaded(true);
                $scope.formSearch.setLoading(false);
            }
            $timeout(function () {
                $rootScope.$broadcast('ResizePage');
            }, 100);
        });
        $scope.$on('ChartMhDataUpdated', function (event) {
            $scope.loadTick_mh++;
            if ($scope.loadTick_temp == 1 && $scope.loadTick_mh == 1) {
                $scope.formSearch.setLoaded(true);
                $scope.formSearch.setLoading(false);
            }
            $timeout(function () {
                $rootScope.$broadcast('ResizePage');
            }, 100);
        });
        $scope.$on('ChartMhDataUpdated', function (event) {
            var mh = new Highcharts.Chart({
                chart: {
                    renderTo: 'mh',
                    type: 'spline',
                    backgroundColor: '#fafafa',
                    zoomType: 'x',
                    marginRight: 100
                },
                title: {
                    text: '滑板磨耗趋势分析图'
                },
                xAxis: {
                    categories: $scope.chartMhData.trainDate,
                    tickInterval: $scope.tickInterval
                },
                yAxis: {
                    title: {
                        text: '磨耗值'
                    },
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: '#808080'
                    }]
                },
                series: [
                    {
                        name: '1#弓',
                        data: $scope.chartMhData.onemhValue
                    },
                    {
                        name: '2#弓',
                        data: $scope.chartMhData.twomhValue
                    }
                ]
            });
        });
        $scope.$on('ChartDataUpdated', function (event) {
            var zx = new Highcharts.Chart({
                chart: {
                    renderTo: 'zx',
                    type: 'spline',
                    backgroundColor: '#fafafa',
                    zoomType: 'x',
                    marginRight: 100
                },
                title: {
                    text: '中心偏移趋势分析图'
                },
                xAxis: {
                    categories: $scope.chartData.trainDate,
                    tickInterval: $scope.tickInterval
                },
                yAxis: {
                    title: {
                        text: '中心偏移'
                    },
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: '#808080'
                    }]
                },
                series: [
                    {
                        name: '中心偏移',
                        data: $scope.chartData.zxValue
                    }
                ]
            });
            var temp = new Highcharts.Chart({
                chart: {
                    renderTo: 'temp',
                    type: 'spline',
                    backgroundColor: '#fafafa',
                    zoomType: 'x',
                    marginRight: 100
                },
                title: {
                    text: '温度趋势分析图'
                },
                xAxis: {
                    categories: $scope.chartData.trainDate,
                    tickInterval: $scope.tickInterval
                },
                yAxis: {
                    title: {
                        text: '温度'
                    },
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: '#808080'
                    }]
                },
                series: [
                    {
                        name: '温度',
                        data: $scope.chartData.tempValue
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
