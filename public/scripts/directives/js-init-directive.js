app.directive('jsDataBeginInit', function($compile) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            $('.ui.calendar.js-date-begin').calendar({
                type: 'date',
                formatter: {
                    date: function(date, settings) {
                        if (!date) return '';
                        var day = date.getDate();
                        var month = date.getMonth() + 1;
                        var year = date.getFullYear();
                        return year + '/' + month + '/' + day;
                    }
                },
                endCalendar: $('.ui.calendar.js-date-end')
            });
        },
    };
});


app.directive('jsDataEndInit', function($compile) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            $('.ui.calendar.js-date-end').calendar({
                type: 'date',
                formatter: {
                    date: function(date, settings) {
                        if (!date) return '';
                        var day = date.getDate();
                        var month = date.getMonth() + 1;
                        var year = date.getFullYear();
                        return year + '/' + month + '/' + day;
                    }
                },
                startCalendar: $('.ui.calendar.js-date-begin')
            });
        },
    };
});

app.directive('jsDropdownInit', function($compile) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            $('.ui.dropdown').dropdown();
        },
    };
});
