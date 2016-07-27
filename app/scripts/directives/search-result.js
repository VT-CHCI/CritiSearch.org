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

      console.log('Hey ' + User.name);
      
      scope.showButtons = function() {
        element.find(".like_dislike").toggle();
      };
      scope.promote = function(result) {
        console.log("Promote:");
       
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
        console.log('logging user id' + scope.userService.uid);
        console.log(JSON.stringify(result));
        result.link_visited = true;
        console.log(JSON.stringify(result));
        theSocket.emit('follow', {id: result.id, uid: scope.userService.uid});
      };
    }
  };
});