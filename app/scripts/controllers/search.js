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
      theSocket.emit('q', {q:$scope.query});
    };

    theSocket.on('search-results', function(data) {
      console.log(data);
      searchScope.results = data;
    });

  });
