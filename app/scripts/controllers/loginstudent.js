'use strict';

angular.module('angularSocketNodeApp')
  .controller('LogInStudentCtrl', function ($scope, User, md5, theSocket, $routeParams, $location) {
    console.log($routeParams);

  $scope.logIn = function() {
    console.log($scope.sillyname);
    User.logInStudent($scope.sillyname);
  };

  $scope.errorMessage = '';

  // <to confirm> in order to check if a login is successful or not the user.id in the results.id should be defined
  theSocket.on('login-student-done', function(results) {
    console.log(results.id)
    if (results.id === undefined) {
      console.log("login failed");
      $scope.errorMessage = results.message;
    
    } else {
        console.log("loginstudent.js login success" )

      //make current session have a teacher???
      //something like that

      $location.path('/search');
     
    }
  });
});