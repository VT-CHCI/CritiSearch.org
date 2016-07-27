'use strict';

angular.module('angularSocketNodeApp')
  .controller('TeacherCtrl', function ($scope, User, theSocket, $routeParams, $location) {
    $scope.userService = User;
    $scope.className = '';
    $scope.number;


    if (User.isAuthenticated()) {
      console.log("teacher logged in");
    } else {
      console.log("Not logged in");
      $location.path('/search');
    }

    $scope.createClass = function() {
      console.log("Create a class for user::" + $scope.userService);
      theSocket.emit('create-class', $scope.className, $scope.number,User.getUserId());
    }

    $scope.goToClass = function(name) {
      console.log('/class/' + name);
      User.setGroup(name, true);
      $location.path('/class/' + name);
    }
});