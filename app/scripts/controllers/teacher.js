'use strict';

angular.module('angularSocketNodeApp')
  .controller('TeacherCtrl', function ($scope, User, theSocket, $routeParams, $location, $cookies) {
    $scope.userService = User;
    $scope.className = '';
    $scope.number;

    console.log("Cookies, isLoggedIn:");
    console.log($cookies.isLoggedIn);
    if ($cookies.isLoggedIn == true) {
      User.getTeacherDetails();
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
      User.setGroup(name, true);
      $location.path('/class/' + name);
    }

    $scope.logoutTeacher = function() {
      User.logOutTeacher();
    }
});