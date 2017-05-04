app.controller('noteCtr', ['$scope', '$state', '$stateParams', '$filter', '$window', '$timeout', 'ngDialog', 'bookmarkService', 'pubSubService', function($scope, $state, $stateParams, $filter, $window, $timeout, ngDialog, bookmarkService, pubSubService) {
    console.log("Hello noteCtr...", $stateParams);

    $scope.loadBusy = false;
    $scope.edit = false;
    $scope.content = '';
    $scope.notes = [];

    bookmarkService.autoLogin()
        .then((data) => {
            var login = data.logined;
            var index = login ? 6 : 1;
            pubSubService.publish('Common.menuActive', {
                login: login,
                index: index
            });
            getNotes();
        })
        .catch((err) => {
            console.log('autoLogin err', err)
        });

    $scope.showAddNote = function(){
        $scope.edit = (!$scope.edit);
        updateEditPos();
    }

    $scope.addNote = function(close){
        $scope.edit = close;
        var note = {
            tag_id: -1,
            content: $scope.content,
        }

        bookmarkService.addNote(note)
            .then((data) => {
                console.log(JSON.stringify(data));
                $scope.content = '';
                getNotes();
            })
            .catch((err) => {
                console.log('addNote err', err)
            });
    }

    $scope.copy = function(id, content){
        console.log("copy note.....");
        var showContent = content.length >= 180 ? content.substr(0, 180)+'...' : content;
        var clipboard = new Clipboard("#noteid"+id, {
            text: function() {
                return content;
            }
        });

        clipboard.on('success', function(e) {
            toastr.success(showContent + '<br/>已复制到您的剪切板', "提示");
            clipboard.destroy();
        });

        clipboard.on('error', function(e) {
            toastr.error(showContent + '<br/>复制失败', "提示");
            clipboard.destroy();
        });
    }

    $scope.delNote = function(id){
        toastr.warning('暂未实现', "提示");
    }

    $scope.editNote = function(id){
        toastr.warning('暂未实现', "提示");
    }

    $scope.detailNote = function(id){
        toastr.warning('暂未实现', "提示");
    }
    // $('.js-segment-praise').transition('hide');
    function getNotes(){
        var params = {};
        bookmarkService.getNotes(params)
            .then((data) => {
                $scope.notes = data;
            })
            .catch((err) => {
                $scope.notes = [];
            });
    }

    function animation() {
        var data = ['scale', 'fade', 'fade up', 'fade down', 'fade left', 'fade right', 'horizontal flip',
            'vertical flip', 'drop', 'fly left', 'fly right', 'fly up', 'fly down',
            'browse', 'browse right', 'slide down', 'slide up', 'slide left', 'slide right'
        ];
        var t = data[parseInt(Math.random() * 1000) % data.length];

        return t;
    }

    function transition() {
        var className = 'js-note-card';
        $('.' + className).transition('hide');
        $('.' + className).transition({
            animation: animation(),
            duration: 500,
        });
    }
    // TODO: 我要将编辑按钮固定在容器的右上角
    $(window).resize(updateEditPos);
    updateEditPos();

    function updateEditPos() {
        for (var i = 1; i <= 100; i += 10) {
            setTimeout(function() {
                var offset = $('.js-note-card').offset();
                if (offset) {
                    var t = offset.top;
                    var l = offset.left;
                    var w = $('.js-note-card').width();
                    $('.js-note-add').offset({
                        top: t + 10,
                        left: l + w - 10,
                    })
                }
            }, 100 * i)
        }
    }
}]);
