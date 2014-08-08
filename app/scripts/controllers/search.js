'use strict';

angular.module('angularSocketNodeApp')
  .controller('SearchCtrl', function ($scope, theSocket, $routeParams, $location) {
    console.log($routeParams);
    $scope.queryInProgress = '';
    $scope.query = '';

    $scope.results = [];
    var searchScope = $scope;

    $scope.search = function() {
      console.log($scope.queryInProgress, $scope.query);
      $scope.query = $scope.queryInProgress;
      theSocket.emit('q', $scope.query);
      $location.path('/search/' + $scope.query);
    };
    
    console.log($routeParams.query);
    if ($routeParams.hasOwnProperty('query') && $routeParams.query.length > 0) {
      $scope.queryInProgress = $routeParams.query;
      $scope.search();
    }
    

    $scope.critiSort = function() {
      console.log("sorting");
      if ($scope.results.length > 0) {
        var comparisons = 0,
        swaps = 0,
        endIndex = 0,
        len = $scope.results.length - 1;
     
        for (var i = 0; i < len; i++) {
     
            for (var j = 0, swapping, endIndex = len - i; j < endIndex; j++) {
                comparisons++;
     
                if ($scope.results[j].status < $scope.results[j + 1].status) {
             
                    swapping = $scope.results[j];
     
                    $scope.results[j] = $scope.results[j + 1];
                    $scope.results[j + 1] = swapping;
     
                    swaps++;
                };
            };
        }
     
        console.log("Comparisons: " + comparisons);
        console.log("Swaps: " + swaps);
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
