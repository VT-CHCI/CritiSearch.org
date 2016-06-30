'use strict';

angular.module('angularSocketNodeApp')
  .controller('SignUpCtrl', function ($scope, User, md5, theSocket, $routeParams, $location, $cookies) {
    console.log(JSON.stringify($routeParams));
    
    // <Sarang> taking the cookie information at signup to send to the browser and store in the backend
    var cookie = {
    uid: $cookies.uid
  }

  if ($cookies.hasOwnProperty('key')) {
    console.log('cookie has key::' + $cookies.key);
   // cookie.key = md5.createHash($cookies.key.toString());
   cookie.key = $cookies.key;
    console.log('cookie hash created :: ' + cookie.key);
  } else {
    console.log('no hash created');
    cookie.key = -1;
  }

    //nothing yet
    $scope.registrationErrors = [];

    $scope.signUp = function() {
        $scope.registrationErrors = [];
    	console.log($scope.email);
    	console.log($scope.username);
    	console.log($scope.password);


        var md5Password = md5.createHash($scope.password);

    	theSocket.emit('signup', $scope.username, md5Password, $scope.email, cookie);
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
