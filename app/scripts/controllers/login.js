'use strict';

angular.module('angularSocketNodeApp')
  .controller('LogInCtrl', function ($scope, md5, theSocket, $routeParams, $location) {
    console.log($routeParams);

    $scope.logIn = function() {
       console.log($scope.username);
       var password = md5.createHash($scope.password);
       console.log(password);
       theSocket.emit('logIn', $scope.username, password);
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