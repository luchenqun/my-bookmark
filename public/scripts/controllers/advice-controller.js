app.controller('adviceCtr', ['$scope', '$state', '$timeout', 'bookmarkService', 'pubSubService', function($scope, $state, $timeout, bookmarkService, pubSubService) {
    console.log("Hello adviceCtr");
    var maxSelections = 3;

    $scope.comment = '';
    $scope.advices = [];
    $scope.category = ["功能", "BUG", "其他"]

    $scope.ok = function() {
        if($scope.comment == ''){
            toastr.error('留言失败内容不能为空', "错误");
            return;
        }
        var advice = {
            category: $('.ui.dropdown.js-categorys').dropdown('get value'),
            comment: $scope.comment,
        };
        console.log(advice);

        bookmarkService.addAdvice(advice)
            .then((data) => {
                if (data.retCode == 0) {
                    toastr.success('留言成功', "提示");
                    $scope.comment = "";
                    getAdvices({});
                } else {
                    toastr.error('留言失败。错误信息：' + data.msg, "错误");
                }
            })
            .catch((err) => {
                toastr.error('留言失败：' + JSON.stringify(err), "错误");
            });
    }

    function getAdvices(params) {
        bookmarkService.getAdvices(params)
            .then((data) => {
                if ($scope.advices.length == 0) {
                    transition();
                }
                $scope.advices = data;
                pubSubService.publish('Common.menuActive', {
                    login: true,
                    index: 2
                });
            })
            .catch((err) => console.log('getAdvices err', err));
    }

    setTimeout(function() {
        $('.ui.dropdown.js-categorys').dropdown({
            onChange: function(value, text, $choice) {
            }
        });
        getAdvices({});
    }, 100)

    $('.js-segment-advice').transition('hide');

    function transition() {
        var data = ['scale', 'fade', 'fade up', 'fade down', 'fade left', 'fade right', 'horizontal flip',
            'vertical flip', 'drop', 'fly left', 'fly right', 'fly up', 'fly down', 
             'browse', 'browse right', 'slide down', 'slide up', 'slide left', 'slide right'
        ];
        var t = data[parseInt(Math.random() * 1000) % data.length];

        var className = 'js-segment-advice';
        $('.' + className).transition('hide');
        $('.' + className).transition({
            animation: t,
            duration: 500,
        });
    }

}]);
