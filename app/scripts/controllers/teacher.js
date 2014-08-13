'use strict';

angular.module('angularSocketNodeApp')
  .controller('TeacherCtrl', function ($scope, theSocket, $routeParams, $location) {
    console.log($routeParams);

    theSocket.emit('teacher');

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