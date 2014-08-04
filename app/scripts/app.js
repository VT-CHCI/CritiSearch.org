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
    'btford.socket-io'
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
      .when('/', {
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
      .otherwise({
        redirectTo: '/search'
      });
  });
