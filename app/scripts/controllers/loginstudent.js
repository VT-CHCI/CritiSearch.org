'use strict';

angular.module('angularSocketNodeApp')
  .controller('LogInStudentCtrl', function ($scope, User, md5, theSocket, $routeParams, $location) {
    console.log($routeParams);

  $scope.logIn = function() {
    console.log($scope.sillyname);
    User.logInStudent($scope.sillyname);
  }

  theSocket.on('login-student-done', function(results) {
    if (results.success) {

      console.log("loginstudent.js login success")

      //make current session have a teacher???
      //something like that

      $location.path('/search');
    } else {
      console.log("login failed");
    }
  });
});