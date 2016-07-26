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
        'angular-md5',
        'toggle-switch'
    ])

.factory('theSocket', function(socketFactory) {
    var myIoSocket = io.connect('/');

    var theSocket = socketFactory({
        ioSocket: myIoSocket
    });

    return theSocket;
})


.config(function($routeProvider) {
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
            controller: 'SearchCtrl',
            resolve: {
                engine: function () {
                    // console.log('resolving engine for/search')
                    return 'google';
                }
            }
        })
        .when('/search/:query', {
            templateUrl: 'views/search.html',
            controller: 'SearchCtrl',
            resolve: {
                engine: function () {
                    // console.log('resolving engine for/search:query')
                    return 'google';
                }
            }
        })
        .when('/scholar', {
            templateUrl: 'views/search.html',
            controller: 'SearchCtrl',
            resolve: {
                engine: function () {
                    // console.log('resolving engine for/scholar')
                    return 'scholar';
                }
            }
        })
        .when('/scholar/:query', {
            templateUrl: 'views/search.html',
            controller: 'SearchCtrl',
            resolve: {
                engine: function () {
                    // console.log('resolving engine for/scholar:query')
                    return 'scholar';
                }
            }
        })
        .when('/teacher', {
            templateUrl: 'views/teacher.html',
            controller: 'TeacherCtrl'
        })
        .when('/class/:id', {
            templateUrl: 'views/class.html',
            controller: 'ClassCtrl'
        })
        .when('/signup', {
            templateUrl: 'views/signup.html',
            controller: 'SignUpCtrl'
        })
        .when('/login/teacher', {
            templateUrl: 'views/loginteacher.html',
            controller: 'LogInTeacherCtrl'
        })
        .when('/login/student', {
            templateUrl: 'views/loginstudent.html',
            controller: 'LogInStudentCtrl'
        })
        .when('/u/:username/:classname', {
            templateUrl: 'views/class.html',
            controller: 'ClassCtrl'
        })
        .otherwise({
            redirectTo: '/search'
        });
});