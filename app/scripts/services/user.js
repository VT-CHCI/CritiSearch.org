// USER SERVICE
'use strict';

angular.module('angularSocketNodeApp')

  .service('User', function (theSocket, $location) {
  
  this.loggedIn = function () {
    return this.authenticated;
  };
  
  var userService = this;
  this.username = '';
  this.uid = '';
  this.authenticated = false;

  this.loginTeacher = function(username, password) {
    thoughtSocket.emit('login-teacher', {username:username, password:password});
  };

  thoughtSocket.on('login-teacher-attempt', function(data){
    console.log(data);
    if (data.success) {
      userService.username = data.username;
      userService.uid = data.uid;
      userService.authenticated = true;
      $location.path('/teacher');
    }
  });

  this.loginStudent = function(sillyname) {
    thoughtSocket.emit('login-student', {username:sillyname});
  };
});