'use strict';

angular.module('supportAdminApp')
    .factory('DrivingTableService', ['$log', '$q', '$http', 'constants',
        function ($log, $q, $http, $const) {

            var API_URL = $const.API_URL;

            var DrivingTableService = {};

            DrivingTableService.retrieveRecord = function (searchCondition) {
                var request = $http({
                    method: 'GET',
                    url: API_URL + '/report/table/' + searchCondition.pre + '/' + searchCondition.page + '/' + searchCondition.pageSize,
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
                return request.then(
                    function (response) {
                        var data = JSON.stringify(response);
                        if (response.data.code == 0) {
                            return DrivingTableService.createRecord(response.data.data);
                        }
                        else {
                            return response.data.msg;
                        }
                    },
                    function (error) {
                        return $q.reject({ error: error });
                    }
                );
            };
            DrivingTableService.retrieveLastRecord = function (searchCondition) {
                var payload = JSON.stringify(searchCondition);

                var request = $http({
                    method: 'GET',
                    url: API_URL + '/history/lastTrain' + '/' + searchCondition.page + '/' + searchCondition.pageSize,
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
                return request.then(
                    function (response) {
                        var data = JSON.stringify(response);
                        if (response.data.code === 0) {
                            return DrivingTableService.createRecord(response.data.data);
                        }
                        else {
                            return response.data.msg;
                        }
                    },
                    function (error) {
                        return $q.reject({ error: error });
                    }
                );
            };
            DrivingTableService.createRecord = function (data) {
                var result = [];
                var content = {};
                angular.forEach(data.trainTableVos, function (elem) {
                    result = result.concat(DrivingTableService.transferResult(elem));
                });
                content.result = result;
                content.pages = data.pages;
                content.pageNum = data.pageNum;
                return content;
            };

            DrivingTableService.transferResult = function (elem) {
                var Record = function () { };
                var records = [];
                var record = {};

                record.trainId = elem.trainId;
                record.trainOnlyId = elem.trainOnlyid;

                record.mhMin = elem.mhMin;
                record.mhMinStatus = elem.mhMinStatus;
                record.zxmaxValue = elem.zxmaxValue;
                record.zxmaxStatus = elem.zxmaxStatus;
                record.tempmaxValue = elem.tempmaxValue;
                record.tempmaxStatus = elem.tempmaxStatus;

                record.yjColor = elem.yjNum == 0 ? 0 : 2;
                record.yjNum = elem.yjNum == 0 ? "正常" : "缺失";

                record.trainVideo = elem.trainVideo;
                // record.trainState = $const.TRAIN_STATE_V[ elem.trainStatus];
                // record.trainState_color = elem.trainStatus;
                record.trainState = [];
                if (elem.trainFaults !== null && elem.trainFaults.length > 0) {
                    for (var idx = 0, len = elem.trainFaults.length; idx < len; idx++) {
                        var trainStateStr = {
                            'trainStateStr': '',
                            'trainStateColor': ''
                        };
                        trainStateStr.trainStateStr = elem.trainFaults[idx].faultType + elem.trainFaults[idx].faultRank;

                        if (elem.trainFaults[idx].faultRank == "预警") {
                            trainStateStr.trainStateColor = 1;
                        } else if (elem.trainFaults[idx].faultRank == "报警") {
                            trainStateStr.trainStateColor = 2;
                        }
                        record.trainState.push(trainStateStr);
                    }
                } else {
                    var trainStateStr = {
                        'trainStateStr': '',
                        'trainStateColor': ''
                    };
                    trainStateStr.trainStateStr = "正常";
                    trainStateStr.trainStateColor = 0;
                    record.trainState.push(trainStateStr);
                }
                var date = elem.trainDate.toString();
                record.trainDate = date.slice(0, 4) + '-' + date.slice(4, 6) + '-' + date.slice(6, 8) + ' ' +
                    date.slice(8, 10) + ':' + date.slice(10, 12) + ':' + date.slice(12, 14);

                records.push(angular.extend(new Record(), record));
                return records;
            };

            DrivingTableService.retrieveDetailRecord = function (trainOnlyId) {
                var request = $http({
                    method: 'GET',
                    url: API_URL + '/report/detail/' + trainOnlyId,
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
                return request.then(
                    function (response) {
                        var data = JSON.stringify(response);
                        if (response.data.code === 0) {
                            return DrivingTableService.createDetailRecord(response.data.data);
                        }
                        else {
                            return response.data.msg;
                        }
                    },
                    function (error) {
                        return $q.reject({ error: error });
                    }
                );
            };
            DrivingTableService.createDetailRecord = function (data) {
                var result = [];
                angular.forEach(data, function (elem) {
                    result = result.concat(DrivingTableService.transferDetailResult(elem));
                });

                return result;
            };

            DrivingTableService.transferDetailResult = function (elem) {
                var Record = function () {
                };
                var records = [];
                var record = {};

                elem.gnum == 1 && (record.gnum = "奇B");
                elem.gnum == 2 && (record.gnum = "奇D");
                elem.gnum == 3 && (record.gnum = "偶B");

                record.onemhValue = elem.onemhValue;
                record.twomhValue = elem.twomhValue;
                record.zxValue = elem.zxValue;
                record.tempValue = elem.tempValue;

                record.onemhStatus = elem.onemhStatus;
                record.twomhStatus = elem.twomhStatus;
                record.zxStatus = elem.zxStatus;
                record.tempStatus = elem.tempValue;

                record.ryjFlag = elem.ryjFlag === 0 ? "缺失" : "正常";
                record.lyjFlag = elem.lyjFlag === 0 ? "缺失" : "正常";

                records.push(angular.extend(new Record(), record));
                return records;
            };


            DrivingTableService.retrieveImgRecord = function (searchCondition) {
                var payload = JSON.stringify(searchCondition);
                var request = $http({
                    method: 'GET',
                    url: API_URL + '/report/image/' + searchCondition.trainOnlyId + '/' + searchCondition.archNum,
                    headers: {
                        "Content-Type": "application/json"
                    }
                });

                return request.then(
                    function (response) {
                        if (response.data.code === 0) {
                            return response.data.data;
                        }
                        else {
                            return response.data.msg;
                        }
                    },
                    function (error) {
                        return $q.reject({ error: error });
                    }
                );
            };
            function fix_number(x) {
                return Number.parseFloat(x).toFixed(2);
            }
            return DrivingTableService;
        }]);
