app.controller('noteCtr', ['$scope', '$state', '$stateParams', '$filter', '$window', '$timeout', '$document', 'ngDialog', 'bookmarkService', 'pubSubService', 'dataService', function ($scope, $state, $stateParams, $filter, $window, $timeout, $document, ngDialog, bookmarkService, pubSubService, dataService) {
    console.log("Hello noteCtr...", $stateParams);

    const perPageItems = 35;
    var dialog = null;
    $scope.hoverNote = null;
    $scope.loadBusy = false;
    $scope.add = false;
    $scope.edit = false;
    $scope.preContent = '';
    $scope.content = '';
    $scope.currentTagId = null;
    $scope.currentNoteId = null;
    $scope.tags = []; // 书签数据
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
            getTags();
            getNotes();
        })
        .catch((err) => {
            console.log('autoLogin err', err)
        });

    $scope.changeCurrentPage = function (currentPage) {
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
    $document.bind("keydown", function (event) {
        $scope.$apply(function () {
            // a按键，显示
            var key = event.key.toUpperCase();
            if (key == 'A' && dataService.keyShortcuts() && (!$scope.add)) {
                $scope.showAddNote();
            }
        })
    });

    $scope.showAddNote = function () {
        $scope.add = (!$scope.add);
        $scope.edit = false;
        $scope.content = '';
        if ($scope.add) {
            $timeout(function () {
                $("#noteedit")[0].focus();
            });
        }
        console.log('$scope.showAddNote');
        // 没有选中分类，默认一个分类
        if (!$scope.currentTagId) {
            $scope.tags.forEach((tag) => {
                tag.clicked = false;
                if (tag.name == '未分类') {
                    $scope.currentTagId = tag.id;
                    tag.clicked = true;
                }
            })
        }
    }

    $scope.addNote = function (close) {
        if ($scope.content == '') {
            toastr.error('不允许备忘录内容为空！', "提示");
            return;
        }
        if ($scope.preContent == $scope.content) {
            toastr.error('您刚刚添加了这条内容！', "提示");
            return;
        }
        $scope.add = close;
        var tagName = '';

        $scope.tags.forEach((tag) => {
            if ($scope.currentTagId === tag.id) {
                tagName = tag.name;
            }
            if (!$scope.currentTagId) {
                if (tag.name == '未分类') {
                    $scope.currentTagId = tag.id;
                    tagName = tag.name
                }
            }
        })

        var note = {
            tag_id: $scope.currentTagId,
            content: $scope.content,
        }

        bookmarkService.addNote(note)
            .then((data) => {
                // 增加成功，重新获取一次备忘录
                $scope.tags.forEach((tag) => {
                    tag.clicked = false;
                })
                $scope.preContent = $scope.content;
                $scope.content = '';
                $scope.currentTagId = null;
                $scope.currentPage = 1;
                $scope.searchWord = '';
                getNotes();
            })
            .catch((err) => {
                console.log('addNote err', err);
                $scope.currentTagId = null;
            });
    }

    $scope.copy = function (content, $event) {
        dataService.clipboard(content);
        $event && $event.stopPropagation();
    }

    $scope.delNote = function (id, content) {
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

    $scope.confirmDelNote = function () {
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
                            onComplete: function () {
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

    $scope.editNote = function (id, content, tagId) {
        $scope.add = true;
        $scope.edit = true;
        $scope.content = content;
        $scope.currentNoteId = id;
        $scope.currentTagId = tagId;
        updateSelectTag(tagId);
    }

    $scope.updateNote = function () {
        var tagName = '';
        $scope.tags.forEach((tag) => {
            if ($scope.currentTagId === tag.id) {
                tagName = tag.name;
            }
            if (!$scope.currentTagId) {
                if (tag.name == '未分类') {
                    $scope.currentTagId = tag.id;
                    tagName = tag.name
                }
            }
        })

        var params = {
            id: $scope.currentNoteId,
            content: $scope.content,
            tag_id: $scope.currentTagId,
        }

        bookmarkService.updateNote(params)
            .then((data) => {
                if (data.result == 1) {
                    toastr.success('备忘更新成功！', "提示");
                    $scope.notes.forEach((note) => {
                        if (note.id == $scope.currentNoteId) {
                            note.content = $scope.content;
                            note.tagName = tagName;
                            note.tag_id = $scope.currentTagId;
                        }
                    })
                    $scope.add = false;
                    $scope.edit = false;
                } else {
                    toastr.error('备忘更新失败！请刷新页面再尝试', "提示");
                }
            })
            .catch((err) => {
                toastr.error('备忘更新失败！错误提示：' + JSON.stringify(err), "提示");
            });
    }

    $scope.detailNote = function (content) {
        $scope.content = content;
        var width = content.length >= 500 ? "50%" : "30%";
        dialog = ngDialog.open({
            template: './views/dialog-detail-note.html',
            className: 'ngdialog-theme-default',
            width: width,
            scope: $scope
        });
    }

    $scope.closeNote = function () {
        $('.js-note').transition({
            animation: dataService.animation(),
            duration: '500ms',
            onComplete: function () {
                $(".js-note").remove();
            }
        });
    }

    $scope.setHoverNote = function (note) {
        $scope.hoverNote = note;
    }

    $scope.clickTag = function (id) {
        $scope.currentTagId = id;
        $scope.totalItems = 0;
        updateSelectTag(id);

        if ($scope.add || $scope.edit) {

        } else {
            getNotes($scope.currentTagId);
        }
    }

    $scope.noteClick = function (note, flag, $event) {
        if (!note.detail || flag) {
            var detail = note.detail;
            $scope.notes.forEach((note) => {
                note.detail = false;
                $("#" + note.id).css("background", "none");
            })
            note.detail = !detail;
            $("#" + note.id).css("background", note.detail ? "#f8f8f8" : "none");
        }
        if (flag) {
            $event && $event.stopPropagation();
        }
    }

    function updateSelectTag(tagId) {
        $scope.tags.forEach((tag) => {
            tag.clicked = false;
            if (tag.id == tagId) {
                tag.clicked = true;
                t = tag;
            }
        })
    }

    // 在输入文字的时候也会触发，所以不要用Ctrl,Shift之类的按键
    $document.bind("keydown", function (event) {
        $scope.$apply(function () {
            var key = event.key.toUpperCase();
            if ($scope.hoverNote && dataService.keyShortcuts()) {
                if (key == 'E') {
                    $scope.editNote($scope.hoverNote.id, $scope.hoverNote.content, $scope.hoverNote.tag_id)
                } else if (key == 'I') {
                    $scope.detailNote($scope.hoverNote.content)
                } else if (key == 'D') {
                    $scope.delNote($scope.hoverNote.id, $scope.hoverNote.content)
                } else if (key == 'C') {
                    $scope.copy($scope.hoverNote.content)
                }
            }
        })
    });

    function getNotes(tagId) {
        $scope.notes = [];
        $scope.loadBusy = true;
        var params = {
            currentPage: $scope.currentPage,
            perPageItems: perPageItems,
            searchWord: $scope.searchWord,
        };
        if (tagId) {
            params.tagId = tagId;
        }
        bookmarkService.getNotes(params)
            .then((data) => {
                $scope.notes = data.notes;
                $scope.notes.forEach((note) => {
                    note.brief = note.content;
                    while (note.brief.indexOf("\n") > 0) {
                        note.brief = note.brief.replace(/\n/g, "");
                    }
                    note.brief = "       " + note.brief.substring(0, 200) + (note.content.length > 200 ? " ......" : "");
                })
                $scope.totalPages = Math.ceil(data.totalItems / perPageItems);
                $scope.totalItems = data.totalItems;
                $timeout(function () {
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

    function getTags(params) {
        $scope.loadBusy = true;
        bookmarkService.getTags(params)
            .then((data) => {
                $scope.tags = []
                var find = false;
                data.forEach((tag) => {
                    $scope.tags.push(tag);
                    if (tag.id == $scope.currentTagId) {
                        find = true; // 如果是删了分类返回来，那么要重新默认选中第一个分类
                    }
                })
                if (!find) $scope.currentTagId = null;

                if ($scope.currentTagId) {
                    getTags($scope.currentTagId);
                }
                $scope.loadBusy = false;
            })
            .catch((err) => {
                console.log('getTags err', err);
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
}]);
