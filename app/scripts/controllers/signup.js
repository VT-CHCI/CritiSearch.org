'use strict';

angular.module('angularSocketNodeApp')
  .controller('SignUpCtrl', function ($scope, theSocket, $routeParams, $location) {
    console.log($routeParams);

    //nothing yet

    $scope.signUp = function() {
    	console.log($scope.email);
    	console.log($scope.username);
    	console.log($scope.password);

    	theSocket.emit('signup', $scope.username, $scope.password, $scope.email);
    }

    theSocket.on('userAdded', function(results) {
    	if (results) {

    		//make current session have a teacher???
    		//something like that

      		$location.path('/teacher');
    	} else {
    		console.log("database add failed");
    	}
  	});
});
