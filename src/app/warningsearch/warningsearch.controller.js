'use strict';

var module = angular.module('supportAdminApp');

module.controller("WarningSearchController", ['$scope', '$state', '$rootScope', '$timeout', '$mdpDatePicker', '$mdpTimePicker', 'Alert', '$uibModal', 'WarningSearchService', 'constants',
    function ($scope, $state, $rootScope, $timeout, $mdpDatePicker, $mdpTimePicker, $alert, $modal, warningSearchService, $const) {

        $scope.$on('ReportDataUpdated', function (event) {
            $timeout(function () {
                $('.footable-report-search').footable({ paginate: false });
                $('.footable-report-search').trigger('footable_redraw');
            }, 100);
            $timeout(function () {
                $rootScope.$broadcast('ResizePage');
            }, 400);
        });

        //radio box
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

        // checkbox
        $scope.items = ['预警', '报警', '异常'];
        $scope.itemsTransfer = [1, 2, 3];
        $scope.selected = [2];
        $scope.toggle = function (item) {
            var idx = $scope.selected.indexOf($scope.itemsTransfer[$scope.items.indexOf(item)]);
            if (idx > -1) {
                $scope.selected.splice(idx, 1);
            }
            else {
                $scope.selected.push($scope.itemsTransfer[$scope.items.indexOf(item)]);
            }
        };
        $scope.exists = function (item) {
            return $scope.selected.indexOf($scope.itemsTransfer[$scope.items.indexOf(item)]) > -1;
        };
        // checkbox
        $scope.items_1 = ['磨耗', '中心偏移', '温度', '羊角'];
        $scope.itemsTransfer_1 = [1, 2, 3, 4];
        $scope.selected_1 = [1, 2, 3, 4];
        $scope.toggle_1 = function (item) {
            var idx = $scope.selected_1.indexOf($scope.itemsTransfer_1[$scope.items_1.indexOf(item)]);
            if (idx > -1) {
                $scope.selected_1.splice(idx, 1);
            }
            else {
                $scope.selected_1.push($scope.itemsTransfer_1[$scope.items_1.indexOf(item)]);
            }
        };
        $scope.exists_1 = function (item) {
            return $scope.selected_1.indexOf($scope.itemsTransfer_1[$scope.items_1.indexOf(item)]) > -1;
        };


        // fixed data 
        $scope.line = $const.LINE;
        $scope.station = $const.STATION;
        $scope.trainIds = [].concat($const.TRAIN_ID);
        $scope.trainIds.unshift("全部");

        $scope.archNums = [
            { name: '奇B', value: 1 },
            { name: '奇D', value: 2 },
            { name: '偶B', value: 3 },
            { name: '全部', value: 0 }
        ];
        $scope.selectType = [
            { name: '磨耗', value: 1 },
            { name: '中心偏移', value: 2 },
            { name: '温度', value: 3 },
            { name: '羊角', value: 4 }
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

        $scope.selectRadioButton = function (value) {
            $scope.formSearch.selectType = value;
        };

        $scope.formSearch = {
            startTime: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
            endTime: new Date(),
            trainId: "全部",

            archNum: 0,
            selectType: [],

            isLoaded: false,
            isLoading: false,
            setLoaded: function (loaded) {
                this.isLoaded = loaded;
            },
            setLoading: function (loading) {
                this.isLoading = loading;
            }
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
            if ($scope.formSearch.trainId == "全部") {
                searchCondition.trainId = 0;
            }
            searchCondition.gnum = $scope.formSearch.archNum;
            // searchCondition.flag = $scope.formSearch.selectType;
            searchCondition.warnFlag = $scope.selected.length !== 0 ? $scope.selected : [];
            searchCondition.flag = $scope.selected_1.length !== 0 ? $scope.selected_1 : [];
            $scope.formSearch.selectType = searchCondition.flag;
            searchCondition.page = parseInt($scope.pagination.current);
            searchCondition.size = parseInt($scope.pagination.pageSize);


            $scope.formSearch.setLoaded(false);
            $scope.formSearch.setLoading(true);
            warningSearchService.retrieveRecord(searchCondition).then(
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
                    $alert.error("服务器出错", $scope);
                    $scope.formSearch.setLoading(false);
                }
            )
        };
        $scope.reportRecords = [];

        $scope.openImageDialog = function (trainOnlyId, archNum) {
            switch (archNum) {
                case "奇B":
                    archNum = 1;
                    break;
                case "偶B":
                    archNum = 3;
                    break;
                case "奇D":
                    archNum = 2;
                    break;
            }
            if ($scope.formSearch.selectType === 3) {
                archNum = 4;
            }
            var modalInstance = $modal.open({
                templateUrl: 'app/drivingtable/image-detail.html',
                controller: 'ArcImageController',
                windowClass: 'app-image-dialog',
                resolve: {
                    trainOnlyId: function () {
                        return trainOnlyId;
                    },
                    archNum: function () {
                        return archNum;
                    }
                }
            });
        };

        //报表下载   $scope.reportRecords
        $scope.exportData = function () {
            var csvString = "线路,站点,车号,弓号,滑板1,滑板2,中心偏移,温度,左羊角,右羊角,时间" + "\n";

            var raw_table = $scope.reportRecords;
            for (var idx = 0, len = raw_table.length; idx < len; idx++) {

                csvString = csvString + $const.LINE + "," + $const.STATION + ",\'" + raw_table[idx].trainId + "\'," + raw_table[idx].gnum +
                    "," + raw_table[idx].onemhValue + "," + raw_table[idx].twomhValue + "," + raw_table[idx].zxValue + "," +
                    raw_table[idx].tempValue + "," + raw_table[idx].lyjFlag + "," + raw_table[idx].ryjFlag + "," + raw_table[idx].trainDate;

                csvString = csvString.substring(0, csvString.length - 1);
                csvString = csvString + "\n";
            }
            csvString = "\uFEFF" + csvString.substring(0, csvString.length - 1);
            var name = $scope.formSearch.trainId + "号车详细报表.csv";
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

        $scope.dateTransfer = function (date) {
            var Y = date.getFullYear(),
                M = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : '' + (date.getMonth() + 1),
                D = date.getDate() < 10 ? '0' + (date.getDate()) : '' + (date.getDate()),
                h = date.getHours() < 10 ? '0' + (date.getHours()) : '' + (date.getHours()),
                m = date.getMinutes() < 10 ? '0' + (date.getMinutes()) : '' + (date.getMinutes()),
                s = date.getSeconds() < 10 ? '0' + (date.getSeconds()) : '' + (date.getSeconds());
            return Y + M + D + h + m + s;
        };

        angular.element(document).ready(function () {
            $rootScope.$broadcast("HideDashboard");
            $('.footable').footable({ paginate: false });
            $scope.search();
            $rootScope.$broadcast('ResizePage');
        });
    }]);




// checkbox
// $scope.items = ['报警'];
// $scope.itemsTransfer = [2,6,5,3,7];
// $scope.selected = [];
// $scope.toggle = function (item) {
//     var idx = $scope.selected.indexOf($scope.itemsTransfer[$scope.items.indexOf(item)]);
//     if (idx > -1) {
//         $scope.selected.splice(idx, 1);
//     }
//     else {
//         $scope.selected.push($scope.itemsTransfer[$scope.items.indexOf(item)]);
//     }
// };
// $scope.exists = function (item) {
//     return $scope.selected.indexOf($scope.itemsTransfer[$scope.items.indexOf(item)]) > -1;
// };