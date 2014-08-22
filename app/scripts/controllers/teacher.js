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


    theSocket.on('class-created', function(name, number, students) {
      
    });
});