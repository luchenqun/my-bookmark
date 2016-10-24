app.directive('edit',function(){
    return {
        restrict:'EAC',
        templateUrl: '/views/bookmarks.html',
        controller: 'bookmarksCtr',
        replace:true
    }
});
