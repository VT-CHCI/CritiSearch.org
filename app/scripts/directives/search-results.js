'use strict'
angular.module('angularSocketNodeApp').directive('searchResults', function ($window) {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/scripts/directives/search-results.html',
    scope: {
      results: '=',
      nextResults: '='
    },
    link: function (scope, element, attrs) {
      var HEIGHT_OFFSET = 10
      scope.restOfPageHeight = function () {
        // console.log('called restOfPageHeight')
        var ulHeight = $window.innerHeight - element[0].getBoundingClientRect().top - HEIGHT_OFFSET
        // console.log(ulHeight)
        return { height: ulHeight + 'px' }
      }
    }
  }
})
