app.controller('noteCtr', ['$scope', '$state', '$stateParams', '$filter', '$window', '$timeout', '$document', 'ngDialog', 'bookmarkService', 'pubSubService', 'dataService', function($scope, $state, $stateParams, $filter, $window, $timeout, $document, ngDialog, bookmarkService, pubSubService, dataService) {
    console.log("Hello noteCtr...", $stateParams);

    const perPageItems = 35;
    var dialog = null;
    $scope.loadBusy = false;
    $scope.add = false;
    $scope.edit = false;
    $scope.preContent = '';
    $scope.content = '';
    $scope.currentNoteId = null;
    $scope.notes = [];
    $scope.totalPages = 0;
    $scope.currentPage = 1;
    $scope.inputPage = '';
    $scope.searchWord = $stateParams.searchWord
    $scope.key = $stateParams.key
    $scope.totalItems = 0;

    var timeagoInstance = timeago();

    bookmarkService.autoLogin()
        .then((data) => {
            var login = data.logined;
            var index = login ? dataService.LoginIndexNote : dataService.NotLoginIndexLogin;
            pubSubService.publish('Common.menuActive', {
                login: login,
                index: index
            });
            getNotes();
        })
        .catch((err) => {
            console.log('autoLogin err', err)
        });

    $scope.changeCurrentPage = function(currentPage) {
        currentPage = parseInt(currentPage) || 0;
        console.log('currentPage = ', currentPage);
        if (currentPage <= $scope.totalPages && currentPage >= 1) {
            $scope.currentPage = currentPage;
            $scope.inputPage = '';
            getNotes();
        } else {
            $scope.currentPage = $scope.totalPages
        }
    }

    // 快捷键a增加书签
    $document.bind("keydown", function(event) {
        $scope.$apply(function() {
            // a按键，显示
            var key = event.key.toUpperCase();
            if (key == 'A' && dataService.keyShortcuts() && (!$scope.add)) {
                $scope.showAddNote();
            }
        })
    });

    $scope.showAddNote = function() {
        $scope.add = (!$scope.add);
        $scope.edit = false;
        $scope.content = '';
        if ($scope.add) {
            $timeout(function() {
                $("#noteedit")[0].focus();
            });
        }
        updateEditPos();
    }

    $scope.addNote = function(close) {
        if ($scope.content == '') {
            toastr.error('不允许备忘录内容为空！', "提示");
            return;
        }
        if ($scope.preContent == $scope.content) {
            toastr.error('您刚刚添加了这条内容！', "提示");
            return;
        }
        $scope.add = close;
        var note = {
            tag_id: -1,
            content: $scope.content,
        }

        bookmarkService.addNote(note)
            .then((data) => {
                console.log(JSON.stringify(data));
                if(data.retCode == 0){
                    note.id = data.insertId;
                    note.created_at = $filter('date')(new Date(), "yyyy-MM-dd HH:mm:ss");
                    note.name = '';
                    $scope.notes.unshift(note);
                    $timeout(function() {
                        timeagoInstance.cancel();
                        timeagoInstance.render(document.querySelectorAll('.need_to_be_rendered'), 'zh_CN');
                    }, 100)
                }
                $scope.preContent = $scope.content;
                $scope.content = '';
                updateEditPos();
            })
            .catch((err) => {
                console.log('addNote err', err)
            });
    }

    $scope.copy = function(id, content) {
        console.log("copy note.....");
        var showContent = content.length >= 180 ? content.substr(0, 180) + '...' : content;
        var clipboard = new Clipboard("#noteid" + id, {
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

    $scope.delNote = function(id, content) {
        $scope.currentNoteId = id;
        $scope.content = content;
        var width = content.length >= 500 ? "50%" : "30%";
        dialog = ngDialog.open({
            template: './views/dialog-del-note.html',
            className: 'ngdialog-theme-default',
            width: width,
            scope: $scope
        });
    }

    $scope.confirmDelNote = function() {
        if ($scope.currentNoteId) {
            var params = {
                id: $scope.currentNoteId
            }
            ngDialog.close(dialog);
            bookmarkService.delNote(params)
                .then((data) => {
                    if (data.result == 1) {
                        $("#" + $scope.currentNoteId).transition({
                            animation: dataService.animation(),
                            duration: 500,
                            onComplete: function() {
                                $("#" + $scope.currentNoteId).remove();
                            }
                        });
                        toastr.success('备忘删除成功！', "提示");
                        $scope.totalItems -= 1;
                    } else {
                        toastr.error('没有找到对应的备忘录，删除失败！请刷新页面再尝试', "提示");
                    }
                })
                .catch((err) => {
                    toastr.error('备忘删除失败！错误提示：' + JSON.stringify(err), "提示");
                });
        } else {
            toastr.error('删除失败！请刷新页面再尝试', "提示");
        }
    }

    $scope.editNote = function(id, content) {
        $scope.add = true;
        $scope.edit = true;
        $scope.content = content;
        $scope.currentNoteId = id;
    }

    $scope.updateNote = function() {
        var params = {
            id: $scope.currentNoteId,
            content: $scope.content,
        }

        bookmarkService.updateNote(params)
            .then((data) => {
                if (data.result == 1) {
                    toastr.success('备忘更新成功！', "提示");
                    $scope.notes.forEach((note) => {
                        if (note.id == $scope.currentNoteId) {
                            note.content = $scope.content;
                        }
                    })
                    $scope.add = false;
                    $scope.edit = false;
                    updateEditPos();
                } else {
                    toastr.error('备忘更新失败！请刷新页面再尝试', "提示");
                }
            })
            .catch((err) => {
                toastr.error('备忘更新失败！错误提示：' + JSON.stringify(err), "提示");
            });
    }

    $scope.detailNote = function(content) {
        $scope.content = content;
        var width = content.length >= 500 ? "50%" : "30%";
        dialog = ngDialog.open({
            template: './views/dialog-detail-note.html',
            className: 'ngdialog-theme-default',
            width: width,
            scope: $scope
        });
    }

    $scope.closeNote = function() {
        $('.js-note').transition({
            animation: dataService.animation(),
            duration: '500ms',
            onComplete: function() {
                $(".js-note").remove();
            }
        });
    }

    function getNotes() {
        $scope.loadBusy = true;
        var params = {
            currentPage: $scope.currentPage,
            perPageItems: perPageItems,
            searchWord: $scope.searchWord,
        };
        bookmarkService.getNotes(params)
            .then((data) => {
                $scope.notes = data.notes;
                $scope.totalPages = Math.ceil(data.totalItems / perPageItems);
                $scope.totalItems = data.totalItems;
                $timeout(function() {
                    timeagoInstance.cancel();
                    timeagoInstance.render(document.querySelectorAll('.need_to_be_rendered'), 'zh_CN');
                    // 如果需要增加书签
                    if ($scope.key == 'A') {
                        $scope.key = null;
                        $scope.showAddNote();
                    }
                }, 100)
                $scope.loadBusy = false;
                if ($scope.totalItems == 0) {
                    $(".js-note").removeClass("hidden");
                }
                transition();
            })
            .catch((err) => {
                $scope.notes = [];
                $scope.loadBusy = false;
            });
    }

    $('.js-note-card').transition('hide');

    function transition() {
        var className = 'js-note-card';
        $('.' + className).transition('hide');
        $('.' + className).transition({
            animation: dataService.animation(),
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
