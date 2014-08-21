'use strict';

angular.module('angularSocketNodeApp')
  .controller('TeacherCtrl', function ($scope, User, theSocket, $routeParams, $location) {
    console.log($routeParams);
    $scope.userService = User;
    $scope.className = '';
    $scope.number = 0;

    console.log(User.teacherLoggedIn());
    if (User.teacherLoggedIn()) {
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
      //the students have been added.
    });
});