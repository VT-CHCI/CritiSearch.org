'use strict';

angular.module('angularSocketNodeApp')
  .controller('ClassCtrl', function ($scope, User, theSocket, $routeParams, $location) {
    console.log($routeParams); //expect username and classname
    $scope.userService = User;

    console.log(User.teacherLoggedIn());
    if (User.teacherLoggedIn()) {
      theSocket.emit('teacher');
    } else {
      console.log("Not logged in");
      $location.path('/login/teacher');
    }

    $scope.logOut = function() {
      User.logOutTeacher();
    }

    $scope.queries = [];
    var searchScope = $scope;

    theSocket.on('query', function(data) {
      console.log(data);
      searchScope.queries.unshift({query:data});
    });

    theSocket.on('oldQueries', function(data) {
    	searchScope.queries = searchScope.queries.concat(data);
    });

});