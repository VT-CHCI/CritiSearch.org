// USER SERVICE
'use strict';

angular.module('angularSocketNodeApp')
  .service('User', function (theSocket, $location) {
  
  var userService = this;
  this.username = '';
  this.uid = '';
  this.authenticated = false;
  this.studentAuthenticated = false;
  this.groups = [];
  this.currentGroup = 0;
  
  this.teacherLoggedIn = function () {
    return userService.authenticated;
  };

  this.getUserId = function() {
    return userService.uid;
  }

  this.getCurrentGroup = function() {
    return userService.currentGroup;
  };

  this.setGroup = function(groupId) {
    userService.currentGroup = groupId;
  };

  this.studentLoggedIn = function () {
    return (userService.studentAuthenticated || userService.authenticated);
  };

  this.getUserName = function() {
    return userService.username;
  };

  this.logInTeacher = function(username, password) {
    theSocket.emit('login-teacher', {username:username, password:password});
  };

  this.logInStudent = function(name) {
    theSocket.emit('login-student', {sillyname: name});
  };

  this.getGroups = function() {
    return userService.groups;
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

  theSocket.on('classes-loaded', function(results) {
    var classes = [];
    for (var i = 0; i < results.length; i++) {
      var users = [];
      for (var j = 0; j < results.length; j++) {
        if (results[i].name == results[j].name) {
          users.push(results[j].username);
          i = j;
        }
      }
      classes.push({className: results[i].name, users: users, groupId: results[i].gid});
    }
    userService.groups = classes;
    console.log(userService.groups);
  });

  theSocket.on('login-student-done', function(data){
    console.log(data);
    if (data.success) {
      userService.username = data.name;
      userService.uid = data.id;
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