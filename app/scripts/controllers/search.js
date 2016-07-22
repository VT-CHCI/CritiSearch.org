'use strict';

angular.module('angularSocketNodeApp')
  .controller('SearchCtrl', function ($scope, 
    User, theSocket, $routeParams, $location, 
    $anchorScroll, engine,$timeout) {
    console.log('engine',engine);
    $scope.scholarOptions = {
    };
    $scope.scholarOptions.searchScholar = (engine === 'scholar');
    $scope.queryInProgress = '';
    $scope.query = '';
    $scope.loggedIn = User.studentLoggedIn();
    $scope.results = [];
    $scope.userService = User;
    $scope.originalOrder = true;
    var NEXT_RESULTS_DELAY = 500; //or couldtry 1000 for a whole second
    var searchScope = $scope;

    $scope.searchDisabled = false;


    $scope.search = function() {
      var details = {};
      $scope.results = [];
      if (User.getUserId() != '') {

        details.userId = User.getUserId();
        
        details.group = User.getCurrentGroup();          
      } else {
        console.log('no user', User);
      }
      details.query = $scope.query;
      console.log ('details.searchScholar:' + $scope.scholarOptions.searchScholar);
      details.searchScholar = $scope.scholarOptions.searchScholar;
      theSocket.emit('q', details);
    };

    if ($routeParams.hasOwnProperty('query') 
        && $routeParams.query.length > 0) {
      $scope.queryInProgress = $routeParams.query;
      $scope.query = $scope.queryInProgress;
      $scope.search();
    }
    
    $scope.$watch('scholarOptions.searchScholar', function (a,b,c) {
      console.log('watch triggered')
      console.log(a,b,c)
    })


    $scope.searchSubmitted = function() {
      $scope.query = $scope.queryInProgress;
      if ($scope.scholarOptions.searchScholar) {
        $location.path('/scholar/' + $scope.query);      
      } else {
        $location.path('/search/' + $scope.query);      
      }
    };

    $scope.logIn = function() {
      $location.path('/login/student');
    };

   


    $scope.originalSort = function() {
      var newResults = [];
      for (var i in searchScope.results) {
        
        newResults[searchScope.results[i].result_order] = searchScope.results[i];
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

    $scope.nextLocked = false;

    $scope.nextResults = function () {
      if (!$scope.nextLocked && !$scope.searchDisabled) {
        $scope.searchDisabled = true;
        $timeout(function () {
          searchScope.searchDisabled = false;
        }, NEXT_RESULTS_DELAY);
        $scope.nextLocked = true;
        console.log('loading more results');
        theSocket.emit('load-more-results', {
          user: $scope.userService.uid,
          searchScholar: $scope.scholarOptions.searchScholar
        });      
      }
    }

    theSocket.on('search-results-scholar', function(data) {

      console.log('Scholar Results:' + JSON.stringify(data));
      $scope.nextLocked = false;
      for (var i in data) {     
        data[i].scholar = true;
        var newurl = data[i].url;        
        data[i].newurl = newurl;
        data[i].status = 0;  
      }
      searchScope.results = searchScope.results.concat(data); 
    });

   
    theSocket.on('search-results', function(data) {
      $scope.nextLocked = false;
      for (var i in data) {     
        console.log(data[i].link)   
        // var newurl = data[i].link.substring(7);      
        var newurl = data[i].link;      
        // console.log(newurl)  
        // newurl = newurl.substring(0, newurl.indexOf('/'));        
        // console.log(newurl)    
        data[i].newurl = newurl;
        data[i].status = 0;  
      }
      searchScope.results = searchScope.results.concat(data);     
    });

    theSocket.on('sort-results', function(data) {
      console.log(data);
      searchScope.results = data;
    });
  });
