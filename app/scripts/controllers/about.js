'use strict';

/**
 * @ngdoc function
 * @name angularSocketNodeApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the angularSocketNodeApp
 */
angular.module('angularSocketNodeApp')
  .controller('AboutCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
