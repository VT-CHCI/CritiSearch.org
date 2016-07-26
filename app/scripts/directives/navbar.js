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
	    		User.logOutTeacher();
	    	}

	    	// // remove all active classes
	    	// $('nav li').removeClass('active');
	    	// // add the active class if the location matches the page
	    	// if ($('nav li').class == $(location.path)) {
	    	// 	.addClass('active')
	    	// }


	    	// scope.linkFollowed = function($event) {
	    	// 	console.log($event.target);
	    	// 	//find all navbar li and remove active
	    	// 	$('nav li').removeClass('active');

	    	// 	//get target from event
	    	// 	//find the target's first parent that is a li
	    	// 	console.log($($event.target).closest('li'));
	    	// 	//add active to this li
	    	// 	$($event.target).closest('li').addClass('active');
	    	// }
	    }
    };
  });