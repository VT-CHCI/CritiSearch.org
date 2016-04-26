'use strict';

angular.module('angularSocketNodeApp')
  .controller('LogInCtrl', function ($scope, theSocket, $routeParams, $location) {
    console.log($routeParams);

    $scope.logIn = function() {
    	console.log($scope.username);
    	console.log($scope.password);

    	theSocket.emit('logIn', $scope.username, $scope.password);
    }

    theSocket.on('logIn-done', function(results) {
    	if (results) {

    		//make current session have a teacher???
    		//something like that

      		$location.path('/teacher');
    	} else {
    		console.log("login failed");
    	}
  	});


});