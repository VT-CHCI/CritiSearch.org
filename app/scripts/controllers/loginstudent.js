'use strict';

angular.module('angularSocketNodeApp')
  .controller('LogInStudentCtrl', function ($scope, User, md5, theSocket, $routeParams, $location,$cookies) {
    console.log(($scope));

  var cookie = {
    uid: $cookies.uid,
    key: $cookies.key
  }

  if ($cookies.hasOwnProperty('key')) {
    console.log('cookie has key::' + $cookies.key);
    //cookie.key = md5.createHash($cookies.key.toString());
     cookie.key = $cookies.key;
    console.log('cookie hash created :: ' + cookie.key);
  } else {
    console.log('no hash created');
    cookie.key = -1;
  }

  theSocket.emit('check-cookies-student', cookie);




  $scope.logIn = function() {
    console.log('Hello ' + $scope.sillyname);
    User.logInStudent($scope.sillyname);
    console.log('username is :'  +  User.getUserName());
  };


  $scope.errorMessage = '';

  // <to confirm> in order to check if a login is successful or not the user.id in the results.id should be defined
  theSocket.on('login-student-done', function(results) {
    console.log(results);
    if (results.id === undefined) {
      console.log("login failed");
      $scope.errorMessage = results.message;
    
    } else {
        User.setAuthenticated(true);
        console.log("loginstudent.js login success" )


      //make current session have a teacher???
      //something like that

      $location.path('/search');
     
    }
  });
});