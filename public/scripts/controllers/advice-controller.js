app.controller('adviceCtr', ['$scope', '$state', '$timeout', 'bookmarkService', 'pubSubService', 'dataService', function($scope, $state, $timeout, bookmarkService, pubSubService, dataService) {
    console.log("Hello adviceCtr");
    if(dataService.smallDevice()){
        $window.location = "http://m.mybookmark.cn/#/tags";
        return;
    }
    var maxSelections = 3;

    $scope.comment = '';
    $scope.advices = [];
    $scope.category = ["功能", "BUG", "其他"];
    $scope.user = {};

    bookmarkService.userInfo({})
    .then((data) => {
        $scope.user = data;
    })
    .catch((err) => {

    });
    
    $scope.ok = function() {
        if ($scope.comment == '') {
            toastr.error('留言失败内容不能为空', "错误");
            return;
        }
        if ($scope.user.username == 'test') {
            toastr.error('test用户不允许留言!', "错误");
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
                data.forEach(element => {
                    element.imgData = new Identicon(md5(element.username)).toString();
                });
                $scope.advices = data;
                pubSubService.publish('Common.menuActive', {
                    login: true,
                    index: dataService.LoginIndexAdvice
                });
            })
            .catch((err) => dataService.netErrorHandle(err, $state));
    }

    setTimeout(function() {
        $('.ui.dropdown.js-categorys').dropdown({
            onChange: function(value, text, $choice) {}
        });
        getAdvices({});
    }, 100)

    $('.js-segment-advice').transition('hide');

    function transition() {
        var className = 'js-segment-advice';
        $('.' + className).transition('hide');
        $('.' + className).transition({
            animation: dataService.animation(),
            duration: 500,
        });
    }

}]);
