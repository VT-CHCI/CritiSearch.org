'use strict';
angular.module('angularSocketNodeApp').directive('searchResults', function ($window){
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/scripts/directives/search-results.html',
    scope: {
      results: '=',
      nextResults: '='
    },
    link: function(scope, element, attrs) {
      const HEIGHT_OFFSET = 10;
      scope.restOfPageHeight = function () {
        console.log('called restOfPageHeight')
        let ulHeight = $window.innerHeight - element[0].getBoundingClientRect().top - HEIGHT_OFFSET;
        console.log(ulHeight)
        return { height: ulHeight + 'px' }
      }
    }
  };
});