function date(date, settings) {
    if (!date) return '';
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    return year + '/' + month + '/' + day;
};

app.directive('jsDataCreateInit', function($compile) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            $('.ui.calendar.js-date-create-begin').calendar({
                type: 'date',
                formatter: {
                    date: date
                },
                onChange: function(date, text) {
                    console.log($scope.username);
                    $('.ui.calendar.js-date-create-begin :input').val(text).trigger("change");
                },
                endCalendar: $('.ui.calendar.js-date-create-end')
            });

            $('.ui.calendar.js-date-create-end').calendar({
                type: 'date',
                formatter: {
                    date: date
                },
                onChange: function(date, text) {
                    $('.ui.calendar.js-date-create-end :input').val(text).trigger("change");
                },
                startCalendar: $('.ui.calendar.js-date-create-begin')
            });

            $('.js-create-date').dropdown('set value', 0);
        },
    };
});

app.directive('jsDataClickInit', function($compile) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            $('.ui.calendar.js-date-click-begin').calendar({
                type: 'date',
                formatter: {
                    date: date
                },
                onChange: function(date, text) {
                    $('.ui.calendar.js-date-click-begin :input').val(text).trigger("change");
                },
                endCalendar: $('.ui.calendar.js-date-click-end')
            });
            $('.ui.calendar.js-date-click-end').calendar({
                type: 'date',
                formatter: {
                    date: date
                },
                onChange: function(date, text) {
                    $('.ui.calendar.js-date-click-end :input').val(text).trigger("change");
                },
                startCalendar: $('.ui.calendar.js-date-click-begin')
            });
            $('.js-click-date').dropdown('set value', 0);
        },
    };
});

app.directive('jsDropdownUserRangeInit', function($compile) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            $('.ui.dropdown.js-user-range').dropdown({
                onChange: function(value, text, $choice) {
                    $scope.showTags = (value === '1');
                    console.log(value, text, $choice, $scope.showTags, $scope.username);
                    $scope.$apply();
                },
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
