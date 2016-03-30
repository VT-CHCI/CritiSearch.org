'use strict';

angular.module('angularSocketNodeApp')
  .controller('SignUpCtrl', function ($scope, User, md5, theSocket, $routeParams, $location) {
    console.log($routeParams);

    //nothing yet

    $scope.registrationErrors = [];

    $scope.signUp = function() {
        $scope.registrationErrors = [];
    	console.log($scope.email);
    	console.log($scope.username);
    	console.log($scope.password);

        var md5Password = md5.createHash($scope.password);

    	theSocket.emit('signup', $scope.username, md5Password, $scope.email);
    }

    // var signupScope = $scope;

    theSocket.on('userNotAdded', function (results) {
        // $scope.$apply(function () {
            console.log(results.reason);
            // console.log($scope);
            // console.log(signupScope);
            $scope.registrationErrors.push(results.reason);
        // });
    });

    // this will no longer happen because we decided to go ahead and transition 
    // to the logged in teacher when they are created successfully
   //  theSocket.on('userAdded', function(results) {
   //  	if (results) {

   //    		$location.path('/teacher');
   //  	} else {
   //  		console.log("database add failed");
   //  	}
  	// });
});
