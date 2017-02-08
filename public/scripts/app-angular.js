var app = angular.module('bookmarkApp', ['ui.router', 'ngCookies']);

app.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
    $httpProvider.interceptors.push('httpInterceptor');

    $urlRouterProvider.otherwise("/");

    $stateProvider
        .state('bookmarks', {
            url: '/bookmarks',
            templateUrl: '/views/bookmarks.html',
            params: {
                showStyle: 'navigate',
            },
            controller: 'bookmarksCtr'
        })
        .state('search', {
            url: '/search',
            templateUrl: '/views/search.html',
            params: {
                searchWord: null,
            },
            controller: 'searchCtr'
        })
        .state('tags', {
            url: '/tags',
            templateUrl: '/views/tags.html',
            params: {
                tagId: null,
            },
            controller: 'tagsCtr'
        })
        .state('advice', {
            url: '/advice',
            templateUrl: '/views/advice.html',
            controller: 'adviceCtr'
        })
        .state('settings', {
            url: '/settings',
            templateUrl: '/views/settings.html',
            controller: 'settingsCtr'
        })
        .state('login', {
            url: '/login',
            templateUrl: '/views/login.html',
            params: {
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
