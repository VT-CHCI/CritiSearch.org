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

  this.getUserId = function() {
    return userService.uid;
  }

  this.getCurrentGroup = function() {
    return userService.currentGroup;
  };

  this.setGroup = function(groupId, teacher) {
    if (teacher) {
      var result = $.grep(userService.groups, function(e){ return e.groupId == groupId; });
      userService.currentGroup.id = result[0].groupId;
      userService.currentGroup.name = result[0].className;
      userService.currentGroup.students = result[0].users;
    } else {
      userService.currentGroup.id = groupId;
    }
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

      $cookieStore.put('uid', data.uid);
      $cookieStore.put('key', data.key);
      theSocket.emit('update-cookies', {uid: data.uid, key: md5.createHash(data.key.toString())})
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
    if (data.success) {
      userService.username = data.name;
      userService.uid = data.id;
      userService.studentAuthenticated = true;
      userService.setGroup(data.groupId, false);
      $location.path('/search');
    }
  });

  theSocket.on('class-created', function(name, number, students) {
    console.log(name, number, students);
    var classStudents = [];
    for (var i = 0; i < students.length; i++) {
      classStudents.push(students[i].username);
    }
    userService.groups.push({
      className: name,
      groupId: number,
      users: classStudents
    })
  });

  theSocket.on('cookies-login', function(data) {
    console.log('cookies returned');
    console.log(data);

    $cookieStore.put('uid', data.uid);
    $cookieStore.put('key', data.newKey);

    var cookies = {
      uid: data.uid,
      key: md5.createHash($cookieStore.get('key').toString())
    }

    theSocket.emit('update-cookies', cookies);
    console.log("looking for details");
    console.log($cookieStore.get('uid'));
    theSocket.emit('teacher-details', $cookieStore.get('uid'));
  })

  theSocket.on('cookies-updated', function() {
    console.log('cookies updated');
    console.log($cookieStore.get('uid'));
    console.log($cookieStore.get('key'));
  })

  this.logOutTeacher = function() {
    userService.username = '';
    userService.uid = '';
    userService.authenticated = false;
    $cookieStore.put('uid', undefined);
    $cookieStore.put('key', 0);
    $location.path('/login/teacher');
  }
});