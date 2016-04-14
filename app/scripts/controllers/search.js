'use strict';

angular.module('angularSocketNodeApp')
  .controller('SearchCtrl', function ($scope, User, theSocket, $routeParams, $location, $anchorScroll) {
    $scope.queryInProgress = '';
    $scope.query = '';
    $scope.loggedIn = User.studentLoggedIn();
    $scope.results = [];
    $scope.userService = User;
    $scope.originalOrder = true;
    var searchScope = $scope;

    $scope.searchSubmitted = function() {
      $scope.query = $scope.queryInProgress;
      $location.path('/search/' + $scope.query);      
    };

    $scope.logIn = function() {
      $location.path('/login/student');
    };

    $scope.search = function() {
      var details = {};
      if (User.getUserId() != '') {
        details.userId = User.getUserId();
         details.group = User.getCurrentGroup();
         console.log("currentGroup: " + User.getCurrentGroup());
      }
     
      
      details.query = $scope.query;
      console.log(details);
      theSocket.emit('q', details);
    };

    if ($routeParams.hasOwnProperty('query') 
        && $routeParams.query.length > 0) {
      $scope.queryInProgress = $routeParams.query;
      $scope.query = $scope.queryInProgress;
      $scope.search();
    }

    $scope.originalSort = function() {
      var newResults = [];
      for (var i in searchScope.results) {
        newResults[searchScope.results[i].order] = searchScope.results[i];
      }
      searchScope.results = newResults;
      $scope.originalOrder = true;
    }

    $scope.critiSort = function() {
      //$location.hash('search');
      // $anchorScroll();
      theSocket.emit('critisort', $scope.userService.uid);
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
                    $scope.originalOrder = false;
                };
            };
        }
        console.log("Comparisons: " + comparisons);
        console.log("Swaps: " + swaps);
      }

      console.log($scope.results);
    }

    theSocket.on('search-results', function(data) {
      for (var i in data) {
        var newurl = data[i].link.substring(7);
        newurl = newurl.substring(0, newurl.indexOf('/'));
        data[i].newurl = newurl;
      }

      searchScope.results = data;
    });

    theSocket.on('sort-results', function(data) {
      console.log(data);
      searchScope.results = data;
    });
  });
