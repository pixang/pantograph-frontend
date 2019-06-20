'use strict';

var module = angular.module('supportAdminApp');

module.filter("trustUrl", ['$sce', function ($sce) {
    return function (recordingUrl) {
        return $sce.trustAsResourceUrl(recordingUrl);
    };
}]);

module.controller("DrivingTableController", ['$scope', '$state', '$rootScope', '$timeout', '$mdpDatePicker', '$mdpTimePicker', '$uibModal', 'Alert', 'constants', 'DrivingTableService',
    function ($scope, $state, $rootScope, $timeout, $mdpDatePicker, $mdpTimePicker, $modal, $alert, $const, drivingTableService) {
        $scope.location = true;

        $scope.$on('ReportDataUpdated', function (event) {
            $timeout(function () {
                var tableElem = $('.footable-driving-table');
                tableElem.footable({ paginate: false });
                tableElem.trigger('footable_redraw');

                $rootScope.$broadcast('ResizePage');

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
            // 取消注释
            var currentTime = new Date();

            searchCondition.pre = $scope.dateTransfer(currentTime);
            searchCondition.page = parseInt($scope.pagination.current);
            searchCondition.pageSize = parseInt($scope.pagination.pageSize);


            $scope.formSearch.setLoaded(false);
            $scope.formSearch.setLoading(true);
            drivingTableService.retrieveRecord(searchCondition).then(
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

        $scope.openDetailDialog = function (trainOnlyId, trainId, trainState, trainDate) {
            // $scope.trainOnlyId = trainOnlyId;
            // $scope.trainId = trainId;
            // $scope.trainDate = trainDate;
            // $scope.trainState = trainState_str;
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

                csvString = csvString + $const.LINE + "," + $const.STATION + "," + "\'" + raw_table[idx].trainId + "\'" + ","
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
                download: '行车报表.csv'
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
            if (num == $scope.pagination.current || num == 0 || num == ($scope.pagination.totalPages + 1)) {
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
            $rootScope.$broadcast("HideDashboard", "wusuowei");
            $('.footable').footable({ paginate: false });

            $scope.search();

            $rootScope.$broadcast('ResizePage');

        });
    }]
);

module.controller('DetailDataController', [
    '$scope', '$state', '$rootScope', '$timeout', '$uibModalInstance', 'Alert', 'trainOnlyId', 'trainId', 'trainState', 'trainDate', 'constants', 'DrivingTableService',
    function ($scope, $state, $rootScope, $timeout, $modalInstance, $alert, trainOnlyId, trainId, trainState, trainDate, $const, drivingTableService) {


        // footable
        angular.element(document).ready(function () {
            $('.footable-for-dialog').footable({ paginate: false });
        });

        $scope.form = {
            isLoaded: false,
            isLoading: false,
            setLoaded: function (loaded) {
                this.isLoaded = loaded;
            },
            setLoading: function (loading) {
                this.isLoading = loading;
            }
        };

        $scope.$on('DetailRecordUpdate', function (event) {
            $timeout(function () {
                var dialog = $('.footable-for-dialog');
                dialog.footable({ paginate: false });
                dialog.trigger('footable_redraw');
            }, 100);
        });

        $scope.getDetailData = function () {
            $alert.clear();

            $scope.form.setLoading(true);
            $scope.form.setLoaded(false);

            drivingTableService.retrieveDetailRecord(trainOnlyId).then(
                function (data) {
                    if (typeof (data) === "string") {
                        $alert.error(data, $scope);
                        $scope.form.setLoading(false);
                        $scope.form.setLoaded(false);

                        return
                    }
                    $scope.detailRecords = data;


                    $scope.form.setLoading(false);
                    $scope.form.setLoaded(true);

                    $scope.$broadcast('DetailRecordUpdate');
                },
                function (err) {
                    $timeout(function () {
                        $alert.error(err.error, $scope);
                        $scope.exception = true;

                        $scope.form.setLoading(false);
                    }, 1000);
                }
            )
        };
        $scope.detailRecords = [];

        $scope.getDetailData();

        $scope.cancel = function () {
            $modalInstance.close();
        };

        $scope.exportToCsv = function () {
            var csvString = "线路,站点,车号,状态,受电弓,滑板1,滑板2,中心偏移,温度,左羊角,右羊角,时间" + "\n";

            var trainstateStr = "";
            for (var ix = 0, leng = trainState.length; ix < leng; ix++) {
                trainstateStr = trainstateStr + trainState[ix].trainStateStr + "\\";
            }
            trainstateStr = trainstateStr.substring(0, trainstateStr.length - 1);

            var raw_table = $scope.detailRecords;
            for (var idx = 0, len = raw_table.length; idx < len; idx++) {
                csvString = csvString + $const.LINE + "," + $const.STATION + ",\'" + trainId + "\'," + trainstateStr +
                    "," + raw_table[idx].gnum + "," + raw_table[idx].onemhValue + "," + raw_table[idx].twomhValue + "," + raw_table[idx].zxValue + "," +
                    raw_table[idx].tempValue + "," + raw_table[idx].lyjFlag + "," + raw_table[idx].ryjFlag + "," + trainDate;

                csvString = csvString.substring(0, csvString.length - 1);
                csvString = csvString + "\n";
            }
            csvString = "\uFEFF" + csvString.substring(0, csvString.length - 1);
            var name = trainId + "号车详细报表.csv";
            var a = $('<a/>', {
                style: 'display:none',
                href: 'data:application/octet-stream;base64,' + btoa(unescape(encodeURIComponent(csvString))),
                download: name
            }).appendTo('body');
            a[0].click();
            a.remove();
        };
    }
]);

module.controller('ArcImageController', [
    '$scope', '$state', '$rootScope', '$timeout', '$uibModalInstance', '$uibModal', 'Alert', 'trainOnlyId', 'archNum', 'DrivingTableService', 'constants',
    function ($scope, $state, $rootScope, $timeout, $modalInstance, $modal, $alert, trainOnlyId, archNum, drivingTableService, $const) {
        $scope.archNum = archNum;

        $scope.form = {
            isLoaded: false,
            isLoading: false,
            setLoaded: function (loaded) {
                this.isLoaded = loaded;
            },
            setLoading: function (loading) {
                this.isLoading = loading;
            }
        };

        $scope.getImgData = function (trainOnlyId, archNum) {
            $alert.clear();
            var searchCondition = {};
            searchCondition.trainOnlyId = trainOnlyId;
            searchCondition.archNum = archNum;

            $scope.form.setLoading(true);
            $scope.form.setLoaded(false);

            drivingTableService.retrieveImgRecord(searchCondition).then(
                function (data) {
                    if (typeof (data) === "string") {
                        $alert.error(data, $scope);
                        $scope.form.setLoading(false);
                        $scope.form.setLoaded(false);

                        return
                    }
                    switch (searchCondition.archNum) {
                        case 1:
                            $scope.imageAddrs_1 = data.imageAddrs.map(function (item, index, array) {
                                return $const.FILE_LOCATION + item;
                            });

                            break;
                        case 2:
                            $scope.imageAddrs_2 = data.imageAddrs.map(function (item, index, array) {
                                return $const.FILE_LOCATION + item;
                            });

                            break;
                        case 3:
                            $scope.imageAddrs_3 = data.imageAddrs.map(function (item, index, array) {
                                return $const.FILE_LOCATION + item;
                            });

                            break;
                        case 4:
                            $scope.imageAddrs_4 = data.imageAddrs.map(function (item, index, array) {
                                var xhr = new XMLHttpRequest();
                                xhr.responseType = 'arraybuffer';
                                xhr.open('GET', $const.FILE_LOCATION + item);
                                xhr.onload = function (e) {
                                    var tiff = new Tiff({ buffer: xhr.response });
                                    var canvas = tiff.toCanvas();
                                    var element = '#tiff_' + index;
                                    $(element).empty().append(canvas);
                                };
                                xhr.send();
                                return $const.FILE_LOCATION + item;
                            });

                            break;
                    }
                    $scope.form.setLoading(false);
                    $scope.form.setLoaded(true);
                    $scope.$broadcast('DetailRecordUpdate');
                },
                function (err) {
                    $timeout(function () {
                        $alert.error(err.error, $scope);
                        $scope.exception = true;
                        $scope.form.setLoading(false);
                    }, 1000);
                })
        };
        $scope.imageAddrs = [];

        if (archNum == 0) {
            $scope.getImgData(trainOnlyId, 1);
            $scope.getImgData(trainOnlyId, 2);
            $scope.getImgData(trainOnlyId, 3);
            $scope.getImgData(trainOnlyId, 4);
        } else {
            $scope.getImgData(trainOnlyId, archNum);
        }

        $scope.openImgViewer = function (galley) {
            var galley = document.getElementById('galley_' + galley);
            var viewer = new Viewer(galley, {
                zIndex: 3000,
                url: 'data-original',
                toolbar: {
                    zoomIn: 4,
                    zoomOut: 4,
                    rotateLeft: 4,
                    rotateRight: 4,
                    prev: function () {
                        viewer.prev(true);
                    },
                    play: true,
                    next: function () {
                        viewer.next(true);
                    },
                    oneToOne: true,
                    // download: function() {
                    //                         //     var a = $('<a/>', {
                    //         style: 'display:none',
                    //         href: viewer.image.src,
                    //         download: '电机报表.png'
                    //     }).appendTo('body');
                    //
                    //     a[0].click();
                    //     a.remove();
                    // },
                    flipHorizontal: 4,
                    flipVertical: 4
                }
            });
        };
        $scope.openTiffViewer = function (tiff_id) {
            var modalInstance = $modal.open({
                templateUrl: 'app/drivingtable/tiff-expand.html',
                controller: 'TiffViewerController',
                windowClass: 'tiff-expand-window',
                resolve: {
                    tiffAddr: function () {
                        return $scope.imageAddrs_4[tiff_id];
                    }
                }
            });
        };
        $scope.cancel = function () {
            $modalInstance.close();
        };
        angular.element(document).ready(function () {
        });
    }
]);

module.controller('TiffViewerController', [
    '$scope', '$rootScope', '$uibModalInstance', 'tiffAddr',
    function ($scope, $rootScope, $modalInstance, tiffAddr) {

        $scope.cancel = function () {
            $modalInstance.close();
        };
        angular.element(document).ready(function () {
            var xhr = new XMLHttpRequest();
            xhr.responseType = 'arraybuffer';
            xhr.open('GET', tiffAddr);
            xhr.onload = function (e) {
                var tiff = new Tiff({ buffer: xhr.response });
                var canvas = tiff.toCanvas();
                $('.tiff-expand').empty().append(canvas);
            };
            xhr.send();
        });
    }
]);

module.controller('PlayblackController', [
    '$scope', '$state', '$rootScope', '$timeout', '$uibModalInstance', '$uibModal', 'Alert', 'trainOnlyId', 'trainVideo', 'constants',
    function ($scope, $state, $rootScope, $timeout, $modalInstance, $modal, $alert, trainOnlyId, trainVideo, $const) {
        $scope.src = $const.FILE_LOCATION + trainVideo;
        $scope.cancel = function () {
            $modalInstance.close();
        };
        angular.element(document).ready(function () {
        });
    }
]);
