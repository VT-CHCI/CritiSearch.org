'use strict';

angular.module('angularSocketNodeApp')
  .controller('LogInTeacherCtrl', function ($scope, User, md5, theSocket, $routeParams, $location) {
    console.log($routeParams);

  $scope.logIn = function() {
    console.log($scope.username);
    var password = md5.createHash($scope.password);
    console.log(password);
    User.logInTeacher($scope.username, password);
  }

  theSocket.on('login-failed', function() {
  	console.log("login failed");
  });

  
});