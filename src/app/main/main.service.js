'use strict';

angular.module('supportAdminApp')
    .factory('MainService', ['$log', '$q', '$http', 'constants',
        function ($log, $q, $http, $const) {

            var API_URL = $const.API_URL;
            var MainService = {};
            MainService.retrieveTrainDetail = function (trainOnlyId) {

                var request = $http({
                    method: 'GET',
                    url: API_URL + '/index/trainInfo/' + trainOnlyId,
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


            MainService.retrieveTrainInfo = function () {
                var request = $http({
                    method: 'GET',
                    url: API_URL + "/index/trains/last",
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

            MainService.retrieveAllTrainInfo = function () {
                console.log("retrieveAllTrainInfo")
                var request = $http({
                    method: 'GET',
                    url: API_URL + "/index/trains",
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
                return request.then(
                    function (response) {
                      if (response.data.code == 0) {
                            return response.data.data;
                        }
                        else {
                            return response.data.msg;
                        }
                    },

                    function (error) {
                        console.log(error)
                        return $q.reject({ error: error });
                    }
                );
            };

            MainService.changePassword = function (user) {
                var payload = JSON.stringify(user);

                var request = $http({
                    method: 'POST',
                    url: API_URL + '/' + 'user' + '/' + 'password',
                    headers: {
                        "Content-Type": "application/json"
                    },
                    data: payload
                });
                return request.then(
                    function (response) {
                        return response.data.code;
                    },
                    function (error) {
                        return $q.reject({ error: error });
                    }
                );
            };


            MainService.retrieveAbnormalState = function (trainOnlyId) {

                var request = $http({
                    method: 'GET',
                    url: API_URL + '/index/warn' + '/' + trainOnlyId,
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
                return request.then(
                    function (response) {
                        if (response.data.code == 0) {
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
            MainService.triggerLight = function (status) {
                $http({
                    method: 'GET',
                    url: API_URL + '/deviceState' + '/' + status,
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
            };
            MainService.retrieveCurrentDayData = function () {
                var request = $http({
                    method: 'GET',
                    url: API_URL + "/index/trains/lastTen",
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
                return request.then(
                    function (response) {
                        if (response.data.code === 0) {
                            return MainService.createRecord(response.data.data);
                        }
                        else {
                            return response.data.msg;
                        }
                        return response.data;
                    },
                    function (error) {
                        return $q.reject({ error: error });
                    }
                );
            };

            MainService.createRecord = function (data) {
                var result = [];
                var content = {};
                angular.forEach(data, function (elem) {
                    result = result.concat(MainService.transferResult(elem));
                });
                content.result = result;
                return content;
            };

            MainService.transferResult = function (elem) {
                var Record = function () {
                };
                var records = [];
                var record = {};
                record.trainId = elem.trainId;
                record.trainOnlyId = elem.trainOnlyid;

                record.mhMin = elem.mhMin;
                record.zxmaxValue = elem.zxmaxValue;
                record.tempmaxValue = elem.tempmaxValue;

                record.yjNum = elem.yjNum == 0 ? "正常" : "缺失";
                record.yjColor = elem.yjNum == 0 ? 0 : 2;

                record.mhMinStatus = elem.mhMinStatus;
                record.zxmaxStatus = elem.zxmaxStatus;
                record.tempmaxStatus = elem.tempmaxStatus;

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

                record.trainVideo = elem.trainVideo;

                var date = elem.trainDate.toString();
                record.trainDate = date.slice(0, 4) + '-' + date.slice(4, 6) + '-' + date.slice(6, 8) + ' ' +
                    date.slice(8, 10) + ':' + date.slice(10, 12) + ':' + date.slice(12, 14);

                records.push(angular.extend(new Record(), record));
                return records;
            };

            function fix_number(x) {
                return Number.parseFloat(x).toFixed(2);
            }


            return MainService;
        }
    ]);
