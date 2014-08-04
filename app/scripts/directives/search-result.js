'use strict';
angular.module('angularSocketNodeApp').directive('searchResult', function (){
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/scripts/directives/search-result.html',
    scope: {
      result: '=model'
    },
    link: function(scope, element, attrs) {
      element.click(function(){
        console.log('hey!');
      });
      scope.promote = function(result) {
        console.log(result);
        element.removeClass('demoted');
        element.toggleClass('promoted');
      };
      scope.demote = function(result) {
        console.log(result);
        element.removeClass('promoted');
        element.toggleClass('demoted');
      };
    }
  };
});