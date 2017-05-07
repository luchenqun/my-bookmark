function date(date, settings) {
    if (!date) return '';
    var day = date.getDate();
    if (day <= 9) {
        day = '0' + day;
    }
    var month = date.getMonth() + 1;
    if (month <= 9) {
        month = '0' + month;
    }
    var year = date.getFullYear();
    return year + '-' + month + '-' + day;
};

Date.prototype.format = function(fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

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

            $('.js-create-date').dropdown('set value', -1);
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
            $('.js-click-date').dropdown('set value', -1);
        },
    };
});

app.directive('jsDropdownUserRangeInit', function($compile, $timeout) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            $('.ui.dropdown.js-user-range').dropdown({
                onChange: function(value, text, $choice) {
                    $timeout(function() {
                        $scope.showTags = (value == '1');
                        $scope.searchHotBookmarks = (value == '3');
                        $scope.bookmarks = [];
                        $scope.totalPages = 0
                    })
                },
            });
            $('.js-user-range').dropdown('set value', '1');
        },
    };
});

app.directive('jsDropdownTagsInit', function($compile) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            $('.ui.dropdown.js-search-tags').dropdown({
                useLabels: false
            });

            $('.ui.dropdown.js-search-tags .text').removeClass('default');
        },
    };
});

app.directive('jsEditTagsInit', function($compile) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            if ($scope.$last === true) {
                console.log('jsEditTagsInit.....................')
                $('.ui.modal.js-add-bookmark .ui.dropdown').removeClass('loading');
                $('.ui.dropdown.js-tags').dropdown({
                    forceSelection: false,
                    maxSelections: 3,
                    action: 'combo',
                    onChange: function(value, text, $choice) {
                        var selectedTags = $('.ui.modal.js-add-bookmark .ui.dropdown').dropdown('get value');
                        $timeout(function() {
                            $scope.tagsError = (selectedTags.length == 0 || selectedTags.length > 3) && ($('.ui.modal.js-add-bookmark').modal('is active'));
                        });
                    }
                });
            }
        },
    };
});

app.directive('jsMenuInit', function($compile) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            if ($scope.$last === true) {
                console.log('jsMenuInit......')
                $('.js-bookmark-dropdown').dropdown({
                    action: 'hide',
                    on: 'hover',
                });

                $('.js-bookmark-dropdown .ui.checkbox').checkbox();
                $('.ui.checkbox.js-radio-navigate').checkbox('check');
                $('.ui.menu a.item').on('click', function() {
                    $(this).addClass('selected').siblings().removeClass('selected');
                });

                $(".ui.menu a.item:first").hover(
                    function() {
                        $('.js-bookmark-dropdown').dropdown('show');
                    },
                    function() {
                        setTimeout(() => {
                            if ($('.js-menu-option:hover').length === 0) {
                                $('.js-bookmark-dropdown').dropdown('hide');
                            }
                        }, 100)
                    }
                );

                $('.ui.menu a.item').on('click', function() {
                    $(this).addClass('selected').siblings().removeClass('selected');
                });

                $('.search-item').popup({
                    on: 'focus',
                    inline: true
                });
            }
        },
    };
});

app.directive('jsSearchOptionInit', function($compile) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            console.log('jsSearchOptionInit......')
            $('.js-search-option').dropdown({
                // on: 'hover',
            });
        },
    };
});

app.directive('errSrc', function() {
    return {
        link: function(scope, element, attrs) {
            element.bind('error', function() {
                if (attrs.src != attrs.errSrc) {
                    attrs.$set('src', attrs.errSrc);
                }
            });
        }
    }
});

app.directive('faviconErr', function() {
    return {
        link: function(scope, element, attrs) {
            element.bind('error', function() {
                if (attrs.src != attrs.faviconErr) {
                    attrs.$set('src', attrs.faviconErr);
                }
            });
        }
    }
});

app.filter('characters', function() {
        return function(input, chars, breakOnWord) {
            if (isNaN(chars)) return input;
            if (chars <= 0) return '';
            if (input && input.length > chars) {
                input = input.substring(0, chars);

                if (!breakOnWord) {
                    var lastspace = input.lastIndexOf(' ');
                    //get last space
                    if (lastspace !== -1) {
                        input = input.substr(0, lastspace);
                    }
                } else {
                    while (input.charAt(input.length - 1) === ' ') {
                        input = input.substr(0, input.length - 1);
                    }
                }
                return input + '…';
            }
            return input;
        };
    })
    .filter('splitcharacters', function() {
        return function(input, chars) {
            if (isNaN(chars)) return input;
            if (chars <= 0) return '';
            if (input && input.length > chars) {
                var prefix = input.substring(0, chars / 2);
                var postfix = input.substring(input.length - chars / 2, input.length);
                return prefix + '...' + postfix;
            }
            return input;
        };
    })
    .filter('words', function() {
        return function(input, words) {
            if (isNaN(words)) return input;
            if (words <= 0) return '';
            if (input) {
                var inputWords = input.split(/\s+/);
                if (inputWords.length > words) {
                    input = inputWords.slice(0, words).join(' ') + '…';
                }
            }
            return input;
        };
    });
