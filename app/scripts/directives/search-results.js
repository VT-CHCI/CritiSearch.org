'use strict';
angular.module('angularSocketNodeApp').directive('searchResults', function (){
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/scripts/directives/search-results.html',
    scope: {
      results: '=',
      nextResults: '='
    },
    link: function(scope, element, attrs) {
    }
  };
});