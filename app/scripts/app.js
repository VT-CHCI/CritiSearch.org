'use strict';

/**
 * @ngdoc overview
 * @name angularSocketNodeApp
 * @description
 * # angularSocketNodeApp
 *
 * Main module of the application.
 */
angular
  .module('angularSocketNodeApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ui.bootstrap',
    'btford.socket-io',
    'angular-md5'
  ])

  .factory('theSocket', function (socketFactory) {
    var myIoSocket = io.connect('/');

    var theSocket = socketFactory({
      ioSocket: myIoSocket
    });

    return theSocket;
  })


  .config(function ($routeProvider) {
    $routeProvider
      .when('/main', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .when('/search', {
        templateUrl: 'views/search.html',
        controller: 'SearchCtrl'
      })
      .when('/search/:query', {
        templateUrl: 'views/search.html',
        controller: 'SearchCtrl'
      })
      .when('/teacher', {
        templateUrl: 'views/teacher.html',
        controller: 'TeacherCtrl'
      })
      .when('/signup', {
        templateUrl: 'views/signup.html',
        controller: 'SignUpCtrl'
      })
      .when('/login', {
        templateUrl: 'views/login.html',
        controller: 'LogInCtrl'
      })
      .otherwise({
        redirectTo: '/search'
      });
  });
