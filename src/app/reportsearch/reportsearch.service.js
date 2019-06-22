'use strict';

angular.module('supportAdminApp')
    .factory('ReportSearchService', ['$log', '$q', '$http', 'constants',
        function ($log, $q, $http, $const) {
            // local dev
            var API_URL = $const.API_URL;

            var ReportSearchService = {};

            ReportSearchService.retrieveRecord = function (searchCondition) {

                var payload = JSON.stringify(searchCondition);

                var request = $http({
                    method: 'POST',
                    url: API_URL + '/history/index',
                    headers: {
                        "Content-Type": "application/json"
                    },
                    data: payload
                });
                return request.then(
                    function (response) {
                        if (response.data.code == 0) {
                            return ReportSearchService.createRecord(response.data.data);
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

            ReportSearchService.createRecord = function (data) {
                var result = [];
                var content = {};
                angular.forEach(data.historyVos, function (elem) {
                    result = result.concat(ReportSearchService.transferResult(elem));
                });
                content.result = result;
                content.pages = data.pages;
                content.pageNum = data.pageNum;
                return content;
            };

            ReportSearchService.transferResult = function (elem) {
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

                var str = elem.trainDate.toString();
                record.trainDate = str.slice(0, 4) + '-' + str.slice(4, 6) + '-' + str.slice(6, 8) + ' ' +
                    str.slice(8, 10) + ':' + str.slice(10, 12) + ':' + str.slice(12, 14);

                records.push(angular.extend(new Record(), record));
                return records;
            };

            function fix_number(x) {
                return Number.parseFloat(x).toFixed(2);
            }

            return ReportSearchService;
        }]);
