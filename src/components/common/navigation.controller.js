'use strict';

angular.module('supportAdminApp')
  .controller('NavController', ['$scope', '$rootScope','$state', '$cookies',
  function ($scope, $rootScope, $state,$cookies) {
    $scope.$state = $state;
    $scope.forceStateProjects = function () {
      $state.go('index.projects');
    };
    angular.element(document).ready(function() {
      console.log("resizepage from nav");
      $rootScope.$broadcast('ResizePage');

    });
}]);
