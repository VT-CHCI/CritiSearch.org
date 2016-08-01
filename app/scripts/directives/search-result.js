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

      // console.log('Hey ' + User.username);
      
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

      // scope.followCited = function(result) {
      //   console.log('logging user id' + scope.userService.uid);
      //   result.link_visited = true;
      //   theSocket.emit('follow', {id: result.id, uid: scope.userService.uid, query: queryToSend});
      // };

      // scope.followRelated = function(result) {
      //   console.log('logging user id' + scope.userService.uid);
      //   result.link_visited = true;
      //   console.log(result.cited_url);        
      //   theSocket.emit('follow', {id: result.id, uid: scope.userService.uid, query: queryToSend });
      // };

      scope.returnLink = function(result, cited){
        
        // console.log('cited::'+cited);
        if (cited){
          var end = result.cited_url.indexOf("&");
        // find the part of the cited url after the https://scholar.google.com/ {41 characters}
          var queryToSend = result.cited_url.substring(41,end);
          return '/#/scholar/&cites='+ queryToSend;
        }
        else{
          var start = result.related_url.indexOf("?");
          var end = result.related_url.indexOf("&");
          var queryToSend = result.related_url.substring(start+1,end);
          // console.log(queryToSend)
          return '/#/scholar/&'+ queryToSend;
        }
      }



    }
  };
});