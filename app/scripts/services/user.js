// USER SERVICE
'use strict';

angular.module('angularSocketNodeApp')
  .service('User', function (theSocket, $location) {
  
  var userService = this;
  this.username = '';
  this.uid = '';
  this.authenticated = false;
  this.studentAuthenticated = false;
  
  this.teacherLoggedIn = function () {
    return userService.authenticated;
  };

  this.studentLoggedIn = function () {
    return (userService.studentAuthenticated || userService.authenticated);
  };

  this.logInTeacher = function(username, password) {
    theSocket.emit('login-teacher', {username:username, password:password});
  };

  this.logInStudent = function(name) {
    theSocket.emit('login-student', {sillyname: name});
  };

  theSocket.on('login-teacher-done', function(data){
    console.log(data);
    if (data.success) {
      userService.username = data.username;
      userService.uid = data.uid;
      userService.authenticated = true;
      console.log(userService.authenticated);
      $location.path('/teacher');
    }
  });

  theSocket.on('login-student-done', function(data){
    console.log(data);
    if (data.success) {
      userService.username = data.username;
      userService.uid = data.uid;
      userService.studentAuthenticated = true;
      console.log(userService.authenticated);
      $location.path('/search');
    }
  });

  this.logOutTeacher = function() {
    userService.username = '';
    userService.uid = '';
    userService.authenticated = false;
    $location.path('/login');
  }
});