app.directive('jsDataCreateBeginInit', function($compile) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            $('.ui.calendar.js-date-create-begin').calendar({
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
                endCalendar: $('.ui.calendar.js-date-create-end')
            });
        },
    };
});


app.directive('jsDataCreateEndInit', function($compile) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            $('.ui.calendar.js-date-create-end').calendar({
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
                startCalendar: $('.ui.calendar.js-date-create-begin')
            });
        },
    };
});

app.directive('jsDataClickBeginInit', function($compile) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            $('.ui.calendar.js-date-click-begin').calendar({
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
                endCalendar: $('.ui.calendar.js-date-click-end')
            });
        },
    };
});


app.directive('jsDataClickEndInit', function($compile) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            $('.ui.calendar.js-date-click-end').calendar({
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
                startCalendar: $('.ui.calendar.js-date-click-begin')
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
