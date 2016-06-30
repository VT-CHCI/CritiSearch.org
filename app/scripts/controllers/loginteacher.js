'use strict';

angular.module('angularSocketNodeApp')
  .controller('LogInTeacherCtrl', function ($scope, User, md5, theSocket, $routeParams, $location, $cookieStore, $cookies) {

  console.log("Login");

  /*
  Check cookies to see if this person is already logged in.

  Cookies contain the uid and a randomly generated key.
  The key is hashed and stored in the datbase.
  Everytime the user connects the current cookie key is compared to the one in the database.
  If the cookies match the database the user is logged in and a brand new key is created,
  replacing the one currently in the database.

  This structure idea came from this article:
  http://fishbowl.pastiche.org/2004/01/19/persistent_login_cookie_best_practice/
  */
  var cookie = {
    uid: $cookies.uid
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

  theSocket.emit('check-cookies', cookie);

  $scope.logIn = function() {
    console.log($scope.username);
    var password = md5.createHash($scope.password);
    console.log('logging hashed password' + password);
    User.logInTeacher($scope.username, password);
  }

  theSocket.on('login-failed', function() {
  	console.log("login failed");
  });  
});