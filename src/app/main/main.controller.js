'use strict';

var module = angular.module('supportAdminApp');

module.controller('MainController', [
    '$log', '$scope', '$rootScope', '$timeout', '$interval', '$location', 'MainService', 'AuthService', '$state', '$uibModal', '$cookies', '$sce', 'Alert', 'constants',
    function ($log, $scope, $rootScope, $timeout, $interval, $location, mainService, $authService, $state, $modal, $cookies, $sce, $alert, $const) {
        // dashboard show control
        $scope.showDashboard = true;
        $scope.trainsInfo = [];
        $scope.currentUser = {};

        $scope.line = $const.LINE;
        $scope.lightStatus = [];

        function initTrainsInfo() {
            $scope.trainsInfo = [];
            var trainInfo = {};

            for (var idx = 0, len = $const.TRAIN_ID.length; idx < len; idx++) {
                trainInfo.trainId = $const.TRAIN_ID[idx];
                trainInfo.trainDetail = [];
                for (var i = 0; i < 23; i++) {
                    trainInfo.trainDetail.push({})
                }
                $scope.trainsInfo.push(trainInfo);
                trainInfo = {};
            }
        }
        initTrainsInfo();

        $scope.getTrainInfo = function () {
            var trainsInfoObject = {};
            trainsInfoObject.trainsInfo = $scope.trainsInfo;

            $alert.clear();
            if (sessionStorage.getItem("isRunning")) {

                mainService.retrieveTrainInfo().then(
                    function (record) {
                        if (typeof (record) == "string") {
                            return
                        }
                        var index;
                        var objectForTrainsInfo = {};
                        var Record = function () {
                        };


                        //防止全局请求数据为空，localStorage 无值的请况
                        if (!localStorage.getItem('trainsInfoPantograph')) {
                            index = $const.TRAIN_ID.indexOf(record.trainId);

                            for (var idx = 0, len = record.trainInfoVOS.length; idx < len; idx++) {
                                $scope.trainsInfo[index].trainDetail[idx] = angular.extend(new Record(), trainInfo[len - idx - 1])
                            }
                        } else {
                            var localTrainsInfo = JSON.parse(localStorage.getItem('trainsInfoPantograph')).trainsInfo;

                            //get the right index
                            for (var ix = 0; ix < localTrainsInfo.length; ix++) {
                                if (record.trainId === localTrainsInfo[ix].trainId) {
                                    index = ix;
                                    break;
                                }
                            }
                            if ($const.TRAIN_ID.indexOf(record.trainId) != -1) {
                                if (localTrainsInfo[index].trainDetail[record.trainInfoVOS.length - 1].trainOnlyid) {
                                    $scope.trainsInfo = localTrainsInfo;
                                    return
                                }
                                for (var idx = 0, len = record.trainInfoVOS.length; idx < len; idx++) {
                                    localTrainsInfo[index].trainDetail[idx] = angular.extend(new Record(), record.trainInfoVOS[len - idx - 1])
                                }
                            }

                            $scope.trainsInfo = localTrainsInfo;


                        }
                        $scope.trainsInfo.sort(compare);

                        objectForTrainsInfo.trainsInfo = $scope.trainsInfo;
                        localStorage.setItem("trainsInfoPantograph", JSON.stringify(objectForTrainsInfo));

            
                        var currentState = record.trainInfoVOS[0].trainStatus;
                        var trainOnlyId = record.trainInfoVOS[0].trainOnlyid;
                        var trainId = record.trainId;

                        if ($cookies.get('currentUser')) {
                            $scope.warningLight(currentState, trainId, trainOnlyId);
                        }
                    },
                    function(err){
                        $alert.error('请求最新过车数据失败，将清空缓存，加载全局数据');
                        initTrainsInfo();
                        sessionStorage.removeItem('isRunning');
                        localStorage.removeItem("trainsInfo");
                        $timeout(function(){
                            $scope.getTrainInfo();
                        },200)
                    }
                )
            } else {
                mainService.retrieveAllTrainInfo().then(
                    function (record) {
                        if (typeof (record) == "string") {
                            return
                        }
                        var index;
                        var trainInfo;
                        var objectForTrainsInfo = {};
                        var Record = function () { };

                        // the return format is different from vibrate
                        for (var idx = 0, len = record.length; idx < len; idx++) {
                            index = $const.TRAIN_ID.indexOf(record[idx].trainId);
                            trainInfo = record[idx].trainInfoVOS;

                            if (trainInfo.length == 0) {
                                continue;
                            }

                            for (var sub_idx = 0, sub_len = trainInfo.length; sub_idx < sub_len; sub_idx++) {
                                $scope.trainsInfo[index].trainDetail[sub_idx] = angular.extend(new Record(), trainInfo[sub_len - sub_idx - 1])
                            }

                            if ($cookies.get('currentUser')) {

                                var currentState = trainInfo[0].trainStatus;
                                var trainOnlyId = trainInfo[0].trainOnlyid;
                                var trainId = record[idx].trainId;

                                $scope.warningLight(currentState, trainId, trainOnlyId);
                            }
                        }
                        $scope.trainsInfo.sort(compare);

                        objectForTrainsInfo.trainsInfo = $scope.trainsInfo;
                        localStorage.setItem("trainsInfoPantograph", JSON.stringify(objectForTrainsInfo));
                        sessionStorage.setItem('isRunning', "Y");
                    }
                )
            }
        };

        var compare = function (trainInfo_1, trainInfo_2) {
            if (trainInfo_1.trainDetail[0].trainOnlyid && trainInfo_2.trainDetail[0].trainOnlyid) {
                if (trainInfo_1.trainId < trainInfo_2.trainId) {
                    return -1;
                } else if (trainInfo_1.trainId > trainInfo_2.trainId) {
                    return 1
                } else {
                    return 0
                }
            } else if (trainInfo_1.trainDetail[0].trainOnlyid) {
                return -1;
            } else if (trainInfo_2.trainDetail[0].trainOnlyid) {
                return 1;
            } else {
                if (trainInfo_1.trainId < trainInfo_2.trainId) {
                    return -1;
                } else if (trainInfo_1.trainId > trainInfo_2.trainId) {
                    return 1
                } else {
                    return 0
                }
            }

        };
        // TRAIN_STATE:['异常报警','气隙报警','槽深报警','槽楔报警','温度报警','异常预警','气隙预警','槽深预警','槽楔预警','温度预警','正常']
        $scope.warningLight = function (currentState, trainId, trainOnlyId) {
            if (currentState !== 0) {
                if (currentState === 1 || currentState === 3 || currentState === 5 || currentState === 7) {
                    $scope.playAlarmAudio();
                } else {
                    $scope.playDeviceAudio();
                }
                if (currentState === 1 || currentState === 3 || currentState === 5 || currentState === 7) {
                    if ($scope.lightStatus.indexOf(1) === -1) {
                        //报警，红灯信号
                        mainService.triggerLight(1);
                    }
                    $scope.lightStatus.push(1);
                } else {
                    if ($scope.lightStatus.indexOf(1) === -1 && $scope.lightStatus.indexOf(2) === -1) {
                        //报警，cheng灯信号
                        mainService.triggerLight(2);
                    }
                    $scope.lightStatus.push(2);
                }

                var warningInfo = {};
                warningInfo.trainId = trainId;
                warningInfo.trainOnlyId = trainOnlyId;
                $scope.openWarningDialog(warningInfo);
            }
            // }else{
            //     $scope.lightStatus.push(0);
            // }
        };
        $scope.$on("UserChange",
            function (event, msg) {
                if (msg == "logout") {
                    $scope.currentUser.username = null;
                    $scope.currentUser.userrole = null;
                    return
                }
                $timeout(function () {
                    $scope.currentUser.username = $cookies.get('currentUser');
                    $scope.currentUser.userrole = $cookies.get('currentUserRole');
                }, 300);

            });

        $scope.$on("HideDashboard",
            function (event, msg) {
                $scope.showDashboard = false;
            });

        $scope.$on("ShowDashboard",
            function (event, msg) {
                $scope.showDashboard = true;
                if (msg == "loginsuccess") {
                    $scope.getTrainInfo();
                    $scope.currentUser.username = $cookies.get('currentUser');
                    $scope.currentUser.userrole = parseInt($cookies.get('currentUserRole'));
                }
            });

        $scope.$on("ResizeAuthPage", function (event, msg) {
            if (msg == "fromlocation") {
                $alert.clear();
                $alert.error('请先登录', $rootScope);
            }
            else if (msg == "logout success") {
                $alert.clear();
                $alert.info('登出成功', $rootScope);
            }
            else if (msg == "lose connect") {
                $alert.clear();
                $alert.info('与服务器失去连接', $rootScope);
            }
            else if (msg == "token timeout") {
                $alert.clear();
                $alert.info('登陆状态失效，请重新登陆', $rootScope);
            }
        });


        // call from side-nav
        $scope.toMainPage = function () {
            $rootScope.$broadcast("ShowDashboard");
            $state.go('index.main');
        };

        $scope.openMainDialog = function (index, trainDirection) {
            if (!index) {
                return
            }
            var modalInstance = $modal.open({
                size: 'md',
                templateUrl: 'app/main/main-dialog.html',
                controller: 'MainDialogController',
                windowClass: 'app-main-dialog',
                resolve: {
                    trainOnlyId: function () {
                        return index;
                    },
                    trainDirection: function () {
                        return trainDirection
                    }
                }
            });
        };
        $scope.openCurrentdayDialog = function () {
            var modalInstance = $modal.open({
                templateUrl: 'app/main/currentday-dialog.html',
                controller: 'CurrentdayDialog',
                windowClass: 'app-modal-window'
            });
        };
        $scope.openWarningDialog = function (warningInfo) {
            var modalInstance = $modal.open({
                templateUrl: 'app/main/warning-dialog.html',
                controller: 'WarningDialogController',
                size: 'md',
                resolve: {
                    warningInfo: function () {
                        return warningInfo;
                    },
                    lightStatus: function () {
                        return $scope.lightStatus;
                    }
                }
            });
        };
        $scope.testWarningDialog = function () {
            var warningInfo = {
                trainId: '017018',
                trainOnlyId: '25951'
            };
            var modalInstance = $modal.open({
                templateUrl: 'app/main/warning-dialog.html',
                controller: 'WarningDialogController',
                size: 'md',
                resolve: {
                    warningInfo: function () {
                        return warningInfo;
                    }
                }
            });
        };
        $scope.timeShow = function (trainDate) {
            if (!trainDate) {
                return
            }
            var date = trainDate.slice(0, 4) + '-' + trainDate.slice(4, 6) + '-' + trainDate.slice(6, 8) + ' ' +
                trainDate.slice(8, 10) + ':' + trainDate.slice(10, 12) + ':' + trainDate.slice(12, 14);
            $(".dashboard-icon").attr("title", date);
        };
        $scope.playDeviceAudio = function () {

            var a = $('<audio/>', {
                style: 'display:none',
                autoplay: 'autoplay',
                src: '../assets/images/device.wav',
            }).appendTo('body')
        };
        $scope.playAlarmAudio = function () {
            var a = $('<audio/>', {
                style: 'display:none',
                autoplay: 'autoplay',
                src: '../assets/images/alarm.wav'
            }).appendTo('body')
        };

        $scope.logout = function () {
            if (window.confirm('确定要退出登录?')) {
                $authService.logout();
                $timeout(function () {
                    $rootScope.$broadcast("ResizeAuthPage", "logout success");
                }, 100);
                $state.go('auth')
            }
        };

        $scope.changePassword = function () {
            var modalInstance = $modal.open({
                size: 'md',
                templateUrl: 'app/main/change-password.html',
                controller: 'PasswordChangeController',
                resolve: {
                    username: function () {
                        return $cookies.get('currentUser');
                    }
                }
            });
        };

        angular.element(document).ready(function () {
            if ($location.url() === '/index/main') {
                $rootScope.$broadcast("ShowDashboard");
            }
            $('[data-toggle="tooltip"]').tooltip();

            if ($cookies.get('currentUser')) {
                $scope.getTrainInfo();

                $scope.currentUser.username = $cookies.get('currentUser');
                $scope.currentUser.userrole = parseInt($cookies.get('currentUserRole'));
            }

            $interval(function () {
                var date = new Date();
                var h = date.getHours() < 10 ? '0' + (date.getHours()) : '' + (date.getHours());
                var m = date.getMinutes() < 10 ? '0' + (date.getMinutes()) : '' + (date.getMinutes());
                if (h + m == "2300") {
                    $scope.openCurrentdayDialog();
                }
                if (h + m == "0010") {
                    initTrainsInfo();
                    sessionStorage.removeItem('isRunning');
                    localStorage.removeItem("trainsInfoPantograph");
                }
                $scope.getTrainInfo();
            }, 60 * 1000);
        });
    }
]);


//11点弹窗
module.controller('CurrentdayDialog', [
    '$scope', '$state', '$rootScope', '$timeout', '$uibModalInstance', '$uibModal', 'Alert', 'constants', 'MainService',
    function ($scope, $state, $rootScope, $timeout, $modalInstance, $modal, $alert, $const, mainService) {
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

        $scope.$on('CurrentDayRecordUpdate', function (event) {
            $timeout(function () {
                var dialog = $('.footable-for-dialog');
                dialog.footable({ paginate: false });
                dialog.trigger('footable_redraw');
            }, 100);
        });

        $scope.getCurrentDayData = function () {
            $alert.clear();
            $scope.form.setLoading(true);
            $scope.form.setLoaded(false);
            mainService.retrieveCurrentDayData().then(
                function (data) {
                    if (typeof (data) === "string") {
                        $alert.error(data, $scope);
                        $scope.form.setLoading(false);
                        $scope.form.setLoaded(false);
                        return
                    }
                    $scope.currentDayRecords = data.result;

                    $scope.form.setLoading(false);
                    $scope.form.setLoaded(true);
                    $scope.$broadcast('CurrentDayRecordUpdate');
                },
                function (err) {
                    $scope.exception = true;
                    $scope.form.setLoading(false);
                }
            )
        };
        $scope.currentDayRecords = [];

        $scope.getCurrentDayData();

        $scope.exportData = function () {
            var csvString = "线路,站点,车号,磨损,中心偏移,温度,羊角,状态,行车时间" + "\n";

            var raw_table = $scope.currentDayRecords;
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

            var date = raw_table[0].trainDate.substring(0, 10);

            var a = $('<a/>', {
                style: 'display:none',
                href: 'data:application/octet-stream;base64,' + btoa(unescape(encodeURIComponent(csvString))),
                download: date + '_今日过车.csv'
            }).appendTo('body');
            a[0].click();
            a.remove();
        };

        $scope.cancel = function () {
            $modalInstance.close();
        };
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
    }
]);


//点击图标弹窗
module.controller('MainDialogController', [
    '$scope', '$state', '$rootScope', '$timeout', '$uibModalInstance', 'Alert', '$uibModal', 'MainService', 'trainOnlyId', 'trainDirection', 'constants',
    function ($scope, $state, $rootScope, $timeout, $modalInstance, $alert, $modal, mainService, trainOnlyId, trainDirection, $const) {

        $scope.exception = false;
        $scope.line = $const.LINE;
        $scope.station = $const.STATION;
        $scope.formSearch = {
            isLoading: false,
            isLoaded: false,
            setLoading: function (loading) {
                this.isLoading = loading;
            },
            setLoaded: function (loaded) {
                this.isLoaded = loaded;
            }
        };

        $scope.form = {};

        $scope.getTrainDetail = function (trainOnlyId) {
            $alert.clear();

            $scope.formSearch.setLoading(true);
            $scope.formSearch.setLoaded(false);

            mainService.retrieveTrainDetail(trainOnlyId).then(
                function (trainDetail) {
                    if (typeof (trainDetail) == "string") {
                        $alert.error(trainDetail, $scope);
                        $scope.formSearch.setLoading(false);
                        $scope.formSearch.setLoaded(false);
                        $timeout(function () {
                            $modalInstance.close();
                        }, 1600);
                        return
                    }

                    $scope.form = trainDetail;

                    $scope.form.trainDirection_num = trainDirection;
                    $scope.form.trainState_str = $const.TRAIN_STATE_V[$scope.form.trainStatus];
                    $scope.form.trainState = [];

                    if ($scope.form.trainFaults !== null) {
                        for (var idx = 0, len = $scope.form.trainFaults.length; idx < len; idx++) {
                            var trainStateStr = {
                                'trainStateStr': '',
                                'trainStateColor': ''
                            };
                            trainStateStr.trainStateStr = $scope.form.trainFaults[idx].faultType + $scope.form.trainFaults[idx].faultRank;

                            if ($scope.form.trainFaults[idx].faultRank == "预警") {
                                trainStateStr.trainStateColor = 1;
                            } else if ($scope.form.trainFaults[idx].faultRank == "报警") {
                                trainStateStr.trainStateColor = 2;
                            }
                            $scope.form.trainState.push(trainStateStr);
                        }
                    } else {
                        var trainStateStr = {
                            'trainStateStr': '',
                            'trainStateColor': ''
                        };
                        trainStateStr.trainStateStr = "正常";
                        trainStateStr.trainStateColor = 0;
                        $scope.form.trainState.push(trainStateStr);
                    }
                    $scope.form.yjColor = $scope.form.yjNum == 0 ? 0 : 2;
                    $scope.form.yjNum = $scope.form.yjNum == 0 ? "正常" : "缺失";

                    var str = $scope.form.trainDate.toString();
                    $scope.form.trainDate = str.slice(0, 4) + '-' + str.slice(4, 6) + '-' + str.slice(6, 8) + ' ' +
                        str.slice(8, 10) + ':' + str.slice(10, 12) + ':' + str.slice(12, 14);

                    $scope.formSearch.setLoading(false);
                    $scope.formSearch.setLoaded(true);

                },
                function (err) {
                    $scope.formSearch.setLoading(false);
                }
            )
        };

        $scope.getTrainDetail(trainOnlyId);

        $scope.cancel = function () {
            $modalInstance.close();
        };

        $scope.openDetailDialog = function (trainOnlyId, trainId, trainState_str, trainDate) {
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
                        return trainState_str;
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
            // $scope.trainOnlyId = trainOnlyId;
            // $scope.trainId = trainId;
            // $scope.trainDate = trainDate;
            // $scope.trainState = trainState_str;
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
        //删除部分代码,其它要修改
        $scope.confirm = function () {
            $state.go('index.detailmotordata', {
                trainOnlyId: trainOnlyId,
                trainId: $scope.form.trainId,

                trainDirection: $scope.form.trainDirection_num,
                trainDate: $scope.form.trainDate,
                trainState: $scope.form.trainState_str
            });
            $rootScope.$broadcast("HideDashboard");
            $modalInstance.close();
        };
    }
]);

//报警弹窗
module.controller('WarningDialogController', [
    '$scope', '$state', '$rootScope', '$timeout', '$uibModalInstance', 'Alert', 'MainService', 'constants', 'warningInfo', 'lightStatus',
    function ($scope, $state, $rootScope, $timeout, $modalInstance, $alert, mainService, $const, warningInfo, lightStatus) {
        angular.element(document).ready(function () {
            $('.footable-for-warning').footable({ paginate: false });
        });

        $scope.$on('WarningRecordUpdate', function (event) {
            $timeout(function () {
                $('.footable-for-warning').trigger('footable_redraw');
            }, 100);
        });

        $scope.exception = false;
        $scope.form = {
            isLoading: false,
            setLoading: function (loading) {
                this.isLoading = loading;
            }
        };

        $scope.getAbnormalState = function (trainOnlyId) {
            $alert.clear();

            $scope.form.setLoading(true);
            mainService.retrieveAbnormalState(trainOnlyId).then(
                function (abnormalInfo) {
                    if (typeof (abnormalInfo) == "string") {
                        $alert.error(abnormalInfo, $scope);
                        $scope.form.setLoading(false);

                        return
                    }
                    $scope.warningRecords.trainId = warningInfo.trainId;
                    for (var idx = 0, len = abnormalInfo.trainFaults.length; idx < len; idx++) {
                        if (idx == 0) {
                            $scope.warningRecords.faultType = abnormalInfo.trainFaults[idx].faultType + abnormalInfo.trainFaults[idx].faultRank;
                            continue;
                        }
                        $scope.warningRecords.faultType += "，" + abnormalInfo.trainFaults[idx].faultType + abnormalInfo.trainFaults[idx].faultRank;
                    }

                    var str = abnormalInfo.trainDate.toString();
                    $scope.warningRecords.trainDate = str.slice(0, 4) + '-' + str.slice(4, 6) + '-' + str.slice(6, 8) + ' ' +
                        str.slice(8, 10) + ':' + str.slice(10, 12) + ':' + str.slice(12, 14);

                    $scope.$broadcast('WarningRecordUpdate');
                    $scope.form.setLoading(false);
                },
                function (err) {
                    $scope.form.setLoading(false);
                })
        };
        $scope.warningRecords = {};

        $scope.getAbnormalState(warningInfo.trainOnlyId);

        $scope.$on('modal.closing', function () {
            var status = lightStatus.pop();

            if (lightStatus.length === 0) {
                mainService.triggerLight(0);
            }
        });
        $scope.cancel = function () {
            $modalInstance.close();
        };
    }
]);

module.controller('PasswordChangeController', [
    '$scope', '$state', '$rootScope', '$timeout', '$uibModalInstance', 'Alert', 'MainService', 'username',
    function ($scope, $state, $rootScope, $timeout, $modalInstance, $alert, mainService, username) {

        $scope.exception = false;
        $scope.form = {
            username: username,
            oldPassword: '',
            newPassword1: '',
            newPassword2: '',
            isLoading: false,
            setLoading: function (loading) {
                this.isLoading = loading;
            }
        };

        $scope.changePassword = function () {
            $alert.clear();
            if ($scope.form.username && $scope.form.newPassword1 && $scope.form.newPassword2 && $scope.form.oldPassword) {
                if ($scope.form.newPassword1 !== $scope.form.newPassword2) {
                    $alert.error("输入的密码不一致");
                    return
                }
            } else {
                $alert.error("输入项不能为空");
                return
            }

            var user = {};
            user.username = $scope.form.username;
            user.oldPassword = $scope.form.oldPassword;
            user.newPassword = $scope.form.newPassword1;

            $scope.form.setLoading(true);
            mainService.changePassword(user).then(
                function (code) {
                    if (code == -1) {
                        $alert.error("密码更改失败", $scope);
                        $scope.form.setLoading(false);
                        return
                    } else {
                        $alert.error("密码更改成功，即将关闭弹窗", $scope);
                        $scope.form.setLoading(false);
                        $timeout(function () {
                            $modalInstance.close();
                            $scope.form.setLoading(false);
                        }, 1000);
                    }
                },
                function (err) {
                     $scope.exception = true;
                     $scope.form.setLoading(false);
                }
            )
        };

        $scope.cancel = function () {
            $modalInstance.close();
        };
    }
]);






