'use strict';

angular.module('supportAdminApp')
    .factory('WarningSearchService', ['$log', '$q', '$http', 'constants',
        function ($log, $q, $http, $const) {
            // local dev
            var API_URL = $const.API_URL;

            var WarningSearchService = {};

            WarningSearchService.retrieveRecord = function (searchCondition) {

                var payload = JSON.stringify(searchCondition);

                var request = $http({
                    method: 'POST',
                    url: API_URL + '/history/warn',
                    headers: {
                        "Content-Type": "application/json"
                    },
                    data: payload
                });
                return request.then(
                    function (response) {
                        if (response.data.code == 0) {
                            return WarningSearchService.createRecord(response.data.data);
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

            WarningSearchService.createRecord = function (data) {
                var result = [];
                var content = {};
                angular.forEach(data.historyVos, function (elem) {
                    result = result.concat(WarningSearchService.transferResult(elem));
                });
                content.result = result;
                content.pages = data.pages;
                content.pageNum = data.pageNum;
                return content;
            };

            WarningSearchService.transferResult = function (elem) {
                var Record = function () {
                };
                var records = [];
                var record = {};

                record.trainOnlyId = elem.trainOnlyid;
                record.trainId = elem.trainId;

                elem.gnum == 1 && (record.gnum = "奇B");
                elem.gnum == 2 && (record.gnum = "奇D");
                elem.gnum == 3 && (record.gnum = "偶B");

                record.onemhValue = elem.onemhValue;
                record.twomhValue = elem.twomhValue;
                record.zxValue = elem.zxValue;
                record.tempValue = elem.tempValue;
                record.ryjFlag = elem.ryjFlag === 0 ? "缺失" : "正常";
                record.lyjFlag = elem.lyjFlag === 0 ? "缺失" : "正常";
                record.ryjFlagColor = elem.ryjFlag === 0 ? 2 : 0;
                record.lyjFlagColor = elem.lyjFlag === 0 ? 2 : 0;
                record.onemhStatus = elem.onemhStatus;
                record.twomhStatus = elem.twomhStatus;
                record.zxStatus = elem.zxStatus;
                record.tempStatus = elem.tempStatus;

                record.trainState = [];
                if (elem.trainFaultDTOS !== null) {
                    for (var idx = 0, len = elem.trainFaultDTOS.length; idx < len; idx++) {
                        var trainStateStr = {
                            'trainStateStr': '',
                            'trainStateColor': ''
                        };
                        trainStateStr.trainStateStr = elem.trainFaultDTOS[idx].faultType + elem.trainFaultDTOS[idx].faultRank;

                        if (elem.trainFaultDTOS[idx].faultRank == "预警") {
                            trainStateStr.trainStateColor = 1;
                        } else if (elem.trainFaultDTOS[idx].faultRank == "报警") {
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

                var str = elem.trainDate.toString();
                record.trainDate = str.slice(0, 4) + '-' + str.slice(4, 6) + '-' + str.slice(6, 8) + ' ' +
                    str.slice(8, 10) + ':' + str.slice(10, 12) + ':' + str.slice(12, 14);

                records.push(angular.extend(new Record(), record));
                return records;
            };

            function fix_number(x) {
                return Number.parseFloat(x).toFixed(2);
            }

            return WarningSearchService;
        }]);
