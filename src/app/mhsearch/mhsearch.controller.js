'use strict';

var module = angular.module('supportAdminApp');

module.controller("MhSearchController", ['$scope', '$state', '$rootScope', '$timeout', '$mdpDatePicker', '$mdpTimePicker', 'Alert', 'HistoryTrendService', 'constants',
    function ($scope, $state, $rootScope, $timeout, $mdpDatePicker, $mdpTimePicker, $alert, historyTrendService, $const) {
        $scope.$on('ReportDataUpdated', function (event) {
            $timeout(function () {
                $('.footable-report-search').footable({ paginate: false });
                $('.footable-report-search').trigger('footable_redraw');
            }, 100);
            $timeout(function () {
                $rootScope.$broadcast('ResizePage');
            }, 400);
        });

        $scope.selectedItem = null;
        $scope.inputTrainId = "全部";
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
        $scope.trainIds = [].concat($const.TRAIN_ID);
        $scope.trainIds.unshift("全部");
        $scope.archNums = [
            { name: '奇B', value: 1 },
            { name: '奇D', value: 2 },
            { name: '偶B', value: 3 },
        ];
        $scope.pageSizes = [
            { name: '10', value: '10' },
            { name: '20', value: '20' },
            { name: '30', value: '30' },
            { name: '40', value: '40' },
            { name: '60', value: '60' },
            { name: '80', value: '80' },
            { name: '200', value: '200' }
        ];

        $scope.formSearch = {
            startTime: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
            endTime: new Date(),

            trainId: "全部",
            archNum: 1,

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
                h = '00',
                m = '00',
                s = '00';
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
            if (!$scope.formSearch.trainId || (!$scope.formSearch.archNum && $scope.formSearch.archNum !== 0)) {
                err.push("查询条件有误，请检查");
            }
            if ($scope.trainIds.indexOf($scope.formSearch.trainId) == -1) {
                $alert.error("不存在该车号，请检查");
                return
            }
            if (searchCondition.startTime > searchCondition.endTime) {
                $alert.error("起始时间不能大于结束时间");
                return
            }
            if (err.length > 0) {
                $alert.error(err.join('! '));
                return
            }
            searchCondition.trainId = $scope.formSearch.trainId;
            if ($scope.formSearch.trainId == "全部") {
                searchCondition.trainId = 0;
            }

            searchCondition.gnum = $scope.formSearch.archNum;
            searchCondition.size = parseInt($scope.pagination.pageSize);
            searchCondition.page = parseInt($scope.pagination.current);

            $scope.formSearch.setLoaded(false);
            $scope.formSearch.setLoading(true);
            historyTrendService.retrieveMhRecord(searchCondition).then(
                function (data) {
                    if (typeof (data) == "string") {
                        $alert.error(data);
                        $scope.formSearch.setLoading(false);
                        return
                    }

                    $scope.reportRecords = data.mhAverageVosList;
                    for (var i = 0; i < $scope.reportRecords.length; i++) {
                        $scope.reportRecords[i].gnum == 1 && ($scope.reportRecords[i].gnum = "奇B");
                        $scope.reportRecords[i].gnum == 2 && ($scope.reportRecords[i].gnum = "奇D");
                        $scope.reportRecords[i].gnum == 3 && ($scope.reportRecords[i].gnum = "偶B");

                        var str = $scope.reportRecords[i].trainDate;
                        $scope.reportRecords[i].trainDate = str.slice(0, 4) + '-' + str.slice(4, 6) + '-' + str.slice(6, 8) + ' ' +
                            str.slice(8, 10) + ':' + str.slice(10, 12) + ':' + str.slice(12, 14);
                    }
                    $scope.pagination.current = data.pageNum;
                    $scope.pagination.totalPages = data.pages;
                    $scope.pages = generatePagesArray($scope.pagination.current, $scope.pagination.totalPages, 9)

                    $scope.formSearch.setLoaded(true);
                    $scope.formSearch.setLoading(false);
                    $scope.$broadcast('ReportDataUpdated');
                },
                function (err) {
                    $alert.error("服务器出错", $scope);
                    $scope.formSearch.setLoading(false);
                }
            )
        };
        //报表下载   $scope.reportRecords
        $scope.exportData = function () {
            var csvString = "线路,站点,车号,弓号,滑板1,滑板2" + "\n";
            var raw_table = $scope.reportRecords;
            for (var idx = 0, len = raw_table.length; idx < len; idx++) {

                csvString = csvString + $const.LINE + "," + $const.STATION + ",\'" + raw_table[idx].trainId + "\'," + raw_table[idx].gnum +
                    "," + raw_table[idx].oneMHAvg + "," + raw_table[idx].twoMHAvg + ",";

                csvString = csvString.substring(0, csvString.length - 1);
                csvString = csvString + "\n";
            }
            csvString = "\uFEFF" + csvString.substring(0, csvString.length - 1);
            var name = $scope.formSearch.trainId + "号车滑板磨耗报表.csv";
            var a = $('<a/>', {
                style: 'display:none',
                href: 'data:application/octet-stream;base64,' + btoa(unescape(encodeURIComponent(csvString))),
                download: name
            }).appendTo('body');
            a[0].click();
            a.remove();
        };

        $scope.pagination = {
            current: 1,
            totalPages: 1,
            pageSize: $scope.pageSizes[1].value,
        };
        $scope.setCurrent = function (num) {
            if (num == '...' || num == $scope.pagination.current || num == 0 || num == ($scope.pagination.totalPages + 1)) {
                return
            }
            $scope.pagination.current = num;
            $scope.search();
        };

        $scope.onChange = function () {
            $scope.search();
        };

        // calculate the array of the page
        function generatePagesArray(currentPage, totalPages, paginationRange) {
            var pages = [];
            var halfWay = Math.ceil(paginationRange / 2);
            var position;

            if (currentPage <= halfWay) {
                position = 'start';
            } else if (totalPages - halfWay < currentPage) {
                position = 'end';
            } else {
                position = 'middle';
            }

            var ellipsesNeeded = paginationRange < totalPages;
            var i = 1;
            while (i <= totalPages && i <= paginationRange) {
                var pageNumber = calculatePageNumber(i, currentPage, paginationRange, totalPages);

                var openingEllipsesNeeded = (i === 2 && (position === 'middle' || position === 'end'));
                var closingEllipsesNeeded = (i === paginationRange - 1 && (position === 'middle' || position === 'start'));
                if (ellipsesNeeded && (openingEllipsesNeeded || closingEllipsesNeeded)) {
                    pages.push('...');
                } else {
                    pages.push(pageNumber);
                }
                i++;
            }
            return pages;
        }

        function calculatePageNumber(i, currentPage, paginationRange, totalPages) {
            var halfWay = Math.ceil(paginationRange / 2);
            if (i === paginationRange) {
                return totalPages;
            } else if (i === 1) {
                return i;
            } else if (paginationRange < totalPages) {
                if (totalPages - halfWay < currentPage) {
                    return totalPages - paginationRange + i;
                } else if (halfWay < currentPage) {
                    return currentPage - halfWay + i;
                } else {
                    return i;
                }
            } else {
                return i;
            }
        }
        angular.element(document).ready(function () {
            $rootScope.$broadcast("HideDashboard");
            $('.footable').footable({ paginate: false });
            $rootScope.$broadcast('ResizePage');
        });
    }]);
