// USER SERVICE
'use strict';

angular.module('angularSocketNodeApp')
  .service('User', function (theSocket, md5, $location, $cookies, $cookieStore) {
  
  var userService = this;
  this.username = '';
  this.uid = '';
  this.authenticated = false;
  this.studentAuthenticated = false;
  this.groups = [];
  this.currentGroup = {
    id: 0,
    name: '',
    students: []
  }

  this.addClass = function(className, number, classStudents) {
    userService.groups.push({
      id: number,
      name: className,
      students: classStudents
    })
  }

  this.isAuthenticated = function() {
    return userService.authenticated;
  }

  this.deleteClass = function(id) {
    //Did not use filter becuase it is not suppored on IE 8 or earlier

    var size = userService.groups.length;
    for (var i = 0; i < size; i++) {
      if (userService.groups[i].groupId == id) {
        userService.groups.splice(i, 1);
      }
    }
  }

  this.setUserId = function(id) {
    userService.uid = id;
  }

   this.setAuthenticated = function(value) {
    userService.authenticated = value;
  }

  this.getUserId = function() {
    return userService.uid;
  }

  this.getCurrentGroup = function() {
    return userService.currentGroup;
  };

  this.setGroup = function(groupId, teacher) {
    if (teacher) {
      var result = $.grep(userService.groups, function(e){
        // debugger;
       return e.id == groupId; 
     });
      userService.currentGroup.id = result[0].id;
      userService.currentGroup.name = result[0].name;
      userService.currentGroup.students = result[0].users;
    } else {
      userService.currentGroup.id = groupId;
    }
  };

  this.studentLoggedIn = function () {

    return (userService.studentAuthenticated || userService.authenticated);
  };

  this.getUserName = function() {
    console.log('inside get username');
    return userService.username;
  };

  this.logInTeacher = function(username, password) {
    theSocket.emit('login-teacher', {username: username, password: password});
  };

  this.logInStudent = function(name) {
    console.log('inside login student');
    theSocket.emit('login-student', {sillyname: name});
  };

  this.getGroups = function() {
    return userService.groups;
  };

  theSocket.on('login-teacher-done', function(data){
    console.log('login-teacher-done' + JSON.stringify(data));
    if (data.success) {

      userService.username = data.user.name;
      userService.uid = data.uid;
      userService.authenticated = true;
      userService.groups = data.user.groups;

      $cookies.uid = data.uid;
      $cookies.key = data.key;
      console.log('cookie info::' + $cookies.key);
      theSocket.emit('update-cookies', {uid: data.uid, key: data.key})
      $location.path('/teacher');
    }
  });

  theSocket.on('teacher-details-done', function(data) {
    userService.username = data.username;
    userService.uid = data.uid;
    userService.authenticated = true;
    $location.path('/teacher');
  })

  theSocket.on('classes-loaded', function(results) {
    console.log("loading classes");
    console.log(results);
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
  });

  theSocket.on('login-student-done', function(data){
    console.log('success::', data);
    if (data.id) {
      console.log('inside login-student-done:: setting student data')
      userService.username = data.name;
      userService.uid = data.id;
      userService.studentAuthenticated = true;
      // userService.setGroup(data.groupId, false);
      userService.currentGroup.id=data.groupId;
      $location.path('/search');
    }
  });

  // logout all of the students
  theSocket.on('logout', function() {
    userService.username = '';
    userService.uid = '';
    userService.studentAuthenticated = false;
    userService.currentGroup.id = 0;
    $location.path('/search');
  });

  theSocket.on('class-created', function(name, groupId, students) {
    console.log(name, groupId, students);
    // var classStudents = [];
    // for (var i = 0; i < students.length; i++) {
    //   classStudents.push(students[i].username);
    // }
    userService.groups.push({
      className: name,
      groupId: groupId,
      users: students
    })
  });

  theSocket.on('cookies-login', function(data) {
    console.log('cookies returned::' + JSON.stringify(data));
   

    $cookies.uid = data.uid;
    $cookies.key = data.key;

    var cookie = {
      uid: $cookies.uid,
      key: $cookies.key
    }
    console.log("updating cookies... sending to server" + JSON.stringify(cookie));
    theSocket.emit('update-cookies', cookie);
    
    console.log($cookies.uid);
    theSocket.emit('teacher-details', $cookies.uid);
  })

  theSocket.on('cookies-updated', function() {
    console.log('cookies updated');
    console.log('uid: ' + $cookies.uid);
    console.log('key: ' + $cookies.key);
  })

  this.logOutTeacher = function() {
    userService.username = '';
    userService.uid = '';
    userService.authenticated = false;
    $cookies.uid = undefined;
    $cookies.key = 0;
    $location.path('/login/teacher');
  }
});