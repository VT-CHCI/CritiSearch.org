'use strict';

/**
 * @ngdoc function
 * @name angularSocketNodeApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the angularSocketNodeApp
 */
angular.module('angularSocketNodeApp')
  .controller('MainCtrl', function ($scope, theSocket) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    $scope.talkToServer = function(info) {
      console.log('about to emit', info);
      theSocket.emit('info-for-server', {data: info});
    };
  });
