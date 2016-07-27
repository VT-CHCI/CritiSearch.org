angular.module('angularSocketNodeApp')
  .directive('navbar', function($location, User) {
    return {
    	restrict: 'E',
    	scope: {

    	},
	    templateUrl: 'scripts/directives/navbar.html', 
	    link: function(scope, iElement, iAttrs, controller) {
	    	// console.log($location.path());

	    	scope.userService = User;

	    	scope.isActive = function(path) {
	    		return path === $location.path();
	    	}

	    	scope.logOut = function() {
	    		User.logOut();
	    	}
	    }
    };
  });