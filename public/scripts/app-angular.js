var app = angular.module('bookmarkApp', ['ui.router']);

app.config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise("/");

    $stateProvider
        .state('bookmarks', {
            url: '/bookmarks',
            templateUrl: '/views/bookmarks.html',
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
        .state('register', {
            url: '/register',
            templateUrl: '/views/register.html'
        })
        .state('intro', {
            url: '/intro',
            templateUrl: '/views/intro.html'
        })
        .state('search', {
            url: '/search',
            templateUrl: '/views/search.html'
        })
        .state('/', {
            url: '/',
            templateUrl: '/views/intro.html'
        });
});
