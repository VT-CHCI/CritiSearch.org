'use strict';

angular.module('angularSocketNodeApp')
  .controller('TeacherCtrl', function ($scope, User, theSocket, $routeParams, $location) {
    $scope.userService = User;
    $scope.className = '';
    $scope.number = 0;
    $scope.groups = [];

    console.log(User.teacherLoggedIn());
    if (User.teacherLoggedIn()) {
      $scope.groups = User.getGroups();
      //theSocket.emit('teacher');
    } else {
      console.log("Not logged in");
      $location.path('/login/teacher');
    }

    $scope.createClass = function() {
      console.log("CREATE A CLASS");
      theSocket.emit('create-class', $scope.className, $scope.number);
    }

    $scope.goToClass = function(name) {
      console.log('/class/' + name);
      User.setGroup(name);
      $location.path('/class/' + name);
    }


    theSocket.on('class-created', function(name, number, students) {
      $scope.groups = User.getGroups();
    });
});