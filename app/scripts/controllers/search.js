'use strict';

angular.module('angularSocketNodeApp')
  .controller('SearchCtrl', function ($scope, theSocket) {
    
    $scope.queryInProgress = '';
    $scope.query = '';

    $scope.results = [];
    var searchScope = $scope;
    
    $scope.search = function() {
      console.log($scope.queryInProgress, $scope.query);
      $scope.query = $scope.queryInProgress;
      theSocket.emit('q', $scope.query);
    };

    $scope.critiSort = function() {
      console.log("sorting");
      if ($scope.results.length > 0) {
        theSocket.emit('sort', searchScope.results);
      }
    }

    theSocket.on('search-results', function(data) {
      console.log(data);
      searchScope.results = data;
    });

    theSocket.on('sort-results', function(data) {
      console.log(data);
      searchScope.results = data;
    });
  });
