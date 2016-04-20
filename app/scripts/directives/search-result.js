'use strict';
angular.module('angularSocketNodeApp').directive('searchResult', function (theSocket, User){
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/scripts/directives/search-result.html',
    scope: {
      result: '=model'
    },
    link: function(scope, element, attrs) {
      scope.userService = User;
      
      scope.showButtons = function() {
        element.find(".like_dislike").toggle();
      };
      scope.promote = function(result) {
        console.log("Promote:");
        console.log(result);
        theSocket.emit('promoted', {id: result.id, uid: scope.userService.uid});

        if (result.status !== 1) {
          console.log("status being set to 1");
          result.status = 1;
        } else {
          console.log("status being set to 0");
          result.status = 0;
        }
      };
      scope.demote = function(result) {
        console.log(result);
        theSocket.emit('demoted', {id: result.id, uid: scope.userService.uid});
        if (result.status !== -1) {
          result.status = -1;
        } else {
          result.status = 0;
        }
      };
      scope.follow = function(result) {
        console.log(result);
        theSocket.emit('follow', {id: result.id, uid: scope.userService.uid});
      };
    }
  };
});