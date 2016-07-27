'use strict';

angular.module('angularSocketNodeApp')
  .controller('LogInStudentCtrl', function ($scope, User, md5, theSocket, $routeParams, $location,$cookies) {
    console.log($scope);

  // debugger
  if ($cookies.hasOwnProperty('key')) {
    var cookie = {
      uid: $cookies.uid,
      key: $cookies.key
    }
    console.log('cookie has key::' + $cookies.key);
    //cookie.key = md5.createHash($cookies.key.toString());
     cookie.key = $cookies.key;
    console.log('cookie hash created :: ' + cookie.key);
    theSocket.emit('check-cookies-student', cookie);
  } else {
    console.log('no hash created');
    // cookie.key = -1;
  }

  $scope.logIn = function() {
  
    User.logInStudent($scope.sillyname);
  };

  $scope.errorMessage = '';

  // <to confirm> in order to check if a login is successful or not the user.id in the results.id should be defined
  theSocket.on('login-student-done', function(results) {
    console.log(results);
    if (results.id === undefined) {
      console.log("login failed");
      $scope.errorMessage = results.message;
    
    } else {
      // successful case is noticed and handled by user service
      
      //   User.setStudentAuthenticated(true);
      //   console.log("loginstudent.js login success" )


      // //make current session have a teacher???
      // //something like that

      // $location.path('/search');
     
    }
  });
});