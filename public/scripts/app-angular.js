var app = angular.module('bookmarkApp', ['ui.router']);

app.config(function ($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise("/");

    $stateProvider
    .state('bookmarks', {
        url:'/bookmarks',
        templateUrl: '/views/bookmarks.html',
        // controllerAs: 'bookmarksCtrl',
        controller: 'bookmarksController'
    })
    .state('tags', {
        url:'/tags',
        templateUrl: '/views/tags.html',
    })
    .state('advice', {
        url:'/advice',
        templateUrl: '/views/advice.html',
    })
    .state('settings', {
        url:'/settings',
        templateUrl: '/views/settings.html',
    })
    .state('/', {
        url:'/',
        templateUrl: '/views/intro.html'
    });
});
