'use strict';

var module = angular.module('supportAdminApp');

module.controller("LastTrainsController", ['$scope', '$state', '$rootScope', '$timeout', '$mdpDatePicker', '$mdpTimePicker', '$uibModal', 'Alert', 'constants', 'DrivingTableService',
    function ($scope, $state, $rootScope, $timeout, $mdpDatePicker, $mdpTimePicker, $modal, $alert, $const, drivingTableService) {
        $scope.location = false;

        $scope.$on('ReportDataUpdated', function (event) {
            $timeout(function () {
                var tableElem = $('.footable-driving-table');
                tableElem.footable({ paginate: false });
                tableElem.trigger('footable_redraw');
            }, 100);
        });

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
                D = date.getDate() < 10 ? '0' + (date.getDate()) : '' + (date.getDate());
            return Y + M + D + '000000';
        };

        $scope.search = function () {
            $alert.clear();
            var searchCondition = {};

            searchCondition.page = parseInt($scope.pagination.current);
            searchCondition.pageSize = parseInt($scope.pagination.pageSize);


            $scope.formSearch.setLoaded(false);
            $scope.formSearch.setLoading(true);
            drivingTableService.retrieveLastRecord(searchCondition).then(
                function (data) {
                    if (typeof (data) == "string") {
                        $alert.error(data);

                        $scope.formSearch.setLoading(false);
                        return
                    }
                    $scope.reportRecords = data.result;


                    $scope.formSearch.setLoaded(true);
                    $scope.formSearch.setLoading(false);

                    $scope.pagination.current = data.pageNum;
                    $scope.pagination.totalPages = data.pages;

                    $scope.pages = generatePagesArray($scope.pagination.current, $scope.pagination.totalPages, 9)
                    $scope.$broadcast('ReportDataUpdated');
                },
                function (err) {
                    $scope.formSearch.setLoading(false);
                }
            )
        };
        $scope.reportRecords = [];

        $scope.openDetailDialog = function (trainOnlyId, trainId, trainState, trainDate) {
            var modalInstance = $modal.open({
                templateUrl: 'app/drivingtable/detail-table.html',
                controller: 'DetailDataController',
                windowClass: 'app-table-dialog',
                resolve: {
                    trainOnlyId: function () {
                        return trainOnlyId;
                    },
                    trainId: function () {
                        return trainId;
                    },
                    trainState: function () {
                        return trainState;
                    },
                    trainDate: function () {
                        return trainDate;
                    }
                }
            });
        };
        $scope.openImageDialog = function (trainOnlyId) {

            var modalInstance = $modal.open({
                templateUrl: 'app/drivingtable/image-detail.html',
                controller: 'ArcImageController',
                windowClass: 'app-image-dialog',
                resolve: {
                    trainOnlyId: function () {
                        return trainOnlyId;
                    },
                    archNum: function () {
                        return 0;
                    }
                }
            });
        };
        $scope.openVideoDialog = function (trainOnlyId, trainVideo) {
            var modalInstance = $modal.open({
                templateUrl: 'app/drivingtable/video-playback.html',
                controller: 'PlayblackController',
                windowClass: 'app-video-dialog',
                resolve: {
                    trainOnlyId: function () {
                        return trainOnlyId;
                    },
                    trainVideo: function () {
                        return trainVideo;
                    }
                }
            });
        };
        $scope.exportData = function () {
            var csvString = "线路,站点,车号,磨损,中心偏移,温度,羊角,状态,行车时间" + "\n";

            var raw_table = $scope.reportRecords;
            for (var idx = 0, len = raw_table.length; idx < len; idx++) {
                var trainstateStr = "";
                for (var ix = 0, leng = raw_table[idx].trainState.length; ix < leng; ix++) {
                    trainstateStr = trainstateStr + raw_table[idx].trainState[ix].trainStateStr + "\\";
                }
                trainstateStr = trainstateStr.substring(0, trainstateStr.length - 1);
                csvString = csvString + $const.LINE + "," + $const.STATION + ",\'" + raw_table[idx].trainId + "\',"
                    + raw_table[idx].mhMin + "," + raw_table[idx].zxmaxValue + ","
                    + raw_table[idx].tempmaxValue + "," + raw_table[idx].yjNum + ","
                    + trainstateStr + "," + raw_table[idx].trainDate + ",";

                csvString = csvString.substring(0, csvString.length - 1);
                csvString = csvString + "\n";
            }
            csvString = "\uFEFF" + csvString.substring(0, csvString.length - 1);
            var a = $('<a/>', {
                style: 'display:none',
                href: 'data:application/octet-stream;base64,' + btoa(unescape(encodeURIComponent(csvString))),
                download: '最后一次过车记录.csv'
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
            $scope.search();
        });
    }]
);