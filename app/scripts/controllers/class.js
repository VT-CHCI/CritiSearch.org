'use strict';

angular.module('angularSocketNodeApp')
  .controller('ClassCtrl', function ($scope, User, theSocket, $routeParams, $location) {
    console.log($routeParams); //expect username and classname
    $scope.userService = User;
    $scope.currentClass = User.getCurrentGroup();

    console.log(User.teacherLoggedIn());
    if (User.teacherLoggedIn()) {
      theSocket.emit('teacher', User.getCurrentGroup().id);
    } else {
      console.log("Not logged in");
      $location.path('/login/teacher');
    }

    $scope.addStudents = function() {
      theSocket.emit('add-students', $scope.currentClass.id, $scope.number);
    }

    $scope.deleteClass = function() {
      theSocket.emit('delete-class', $scope.currentClass.id);
    }

    $scope.logOut = function() {
      User.logOutTeacher();
    }

    $scope.logOutAll = function() {
      // How do you do this???
    }

    $scope.queries = [];
    var searchScope = $scope;

    theSocket.on('class-deleted', function() {
      $('.modal-backdrop').remove();
      $location.path('/teacher');
    })

    theSocket.on('query', function(data) {
      console.log(data);
      searchScope.queries.unshift({query:data});
    });

    theSocket.on('oldQueries', function(data) {
    	searchScope.queries = searchScope.queries.concat(data);
    });

});