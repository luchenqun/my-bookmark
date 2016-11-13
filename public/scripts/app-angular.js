var app = angular.module('bookmarkApp', ['ui.router']);

app.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
    $httpProvider.interceptors.push('httpInterceptor');

    $urlRouterProvider.otherwise("/");

    $stateProvider
        .state('bookmarks', {
            url: '/bookmarks',
            templateUrl: '/views/bookmarks.html',
            params: {
                foo: null,
                bar: null,
                showStyle: 'navigate',
            },
            controller: 'bookmarksCtr'
        })
        .state('addBookmark', {
            url: '/addBookmark',
            templateUrl: '/views/addBookmark.html',
        })
        .state('tags', {
            url: '/tags',
            templateUrl: '/views/tags.html',
            controller: 'tagsCtr'
        })
        .state('advice', {
            url: '/advice',
            templateUrl: '/views/advice.html',
        })
        .state('settings', {
            url: '/settings',
            templateUrl: '/views/settings.html',
        })
        .state('login', {
            url: '/login',
            templateUrl: '/views/login.html',
            params: {
                foo: null,
                bar: null,
                showStyle: 'table',
            },
            controller: 'loginCtr'
        })
        .state('/', {
            url: '/',
            templateUrl: '/views/home.html',
            controller: 'homeCtr'
        });
});
