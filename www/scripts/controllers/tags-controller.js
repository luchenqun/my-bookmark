app.controller('tagsCtr', ['$scope', '$filter', '$state', '$window', '$stateParams', '$timeout', '$document', 'ngDialog', 'bookmarkService', 'pubSubService', 'dataService', function ($scope, $filter, $state, $window, $stateParams, $timeout, $document, ngDialog, bookmarkService, pubSubService, dataService) {
  console.log("Hello tagsCtr...", $stateParams);
  if (dataService.smallDevice()) {
    $window.location = "http://m.mybookmark.cn/#/tags";
    return;
  }

  (async () => {
    await getTags();
  })()

  var dialog = null;
  var addBookmarkId = -1;
  $scope.hoverBookmark = null;
  $scope.showType = "createdAt";
  $scope.loading = false;
  $scope.loadTags = false;
  $scope.tags = []; // 书签数据
  $scope.tagsIndex = []; // 书签索引
  $scope.bookmarks = [];
  $scope.totalPages = 0;
  $scope.currentPage = 1;
  $scope.inputPage = '';
  $scope.currentTagId = ($stateParams && $stateParams.tagId) || (-1);
  $scope.editMode = false;
  $scope.showMode = 'item';
  $scope.newTag = '';
  $scope.waitDelTag = {};
  $scope.waitDelBookmark = {};
  $scope.bookmarkNormalHover = false;
  var timeagoInstance = timeago();

  pubSubService.subscribe('MenuCtr.tags', $scope, function (event, data) {
    console.log('subscribe MenuCtr.tags', data);
    getTags();
  });

  $scope.getBookmarks = async function (tagId, page, showType) {
    console.log(tagId, page, showType);

    $scope.bookmarks = [];
    tagId && ($scope.currentTagId = tagId);
    page && ($scope.currentPage = page);
    showType && ($scope.showType = showType);
    $scope.loading = true;

    let pageSize = ($scope.showMode == 'item') ? 50 : 20;

    for (let tag of $scope.tags) {
      tag.bookmarkClicked = (tag.id == $scope.currentTagId);
    }

    var params = {
      tagId: $scope.currentTagId,
      page: $scope.currentPage,
      pageSize,
      showType: $scope.showType
    };

    let reply = await get('getBookmarksByTag', params);
    $scope.bookmarks = reply.data;
    $scope.totalPages = reply.totalPages;
    $scope.inputPage = '';
    $scope.loading = false;

    for (let tag of $scope.tags) {
      if (tag.id == $scope.currentTagId) {
        tag.bookmarkCount = reply.count;
      }
    }

    pubSubService.publish('Common.menuActive', {
      login: true,
      index: dataService.LoginIndexTags
    });

    $timeout(function () {
      dataService.transition('#' + addBookmarkId, {
        duration: 1000,
      });
      addBookmarkId = -1;
    }, 1000);
  };

  $scope.changeCurrentPage = function (currentPage) {
    currentPage = parseInt(currentPage) || 0;
    console.log(currentPage);
    if (currentPage <= $scope.totalPages && currentPage >= 1) {
      $scope.getBookmarks(null, currentPage, null);
      $scope.currentPage = currentPage;
    }
  }

  $scope.jumpToUrl = function (url, id) {
    if (!$scope.editMode) {
      $window.open(url, '_blank');
      bookmarkService.clickBookmark({
        id: id
      });
      $scope.bookmarks.forEach(function (bookmark, index) {
        if (bookmark.id == id) {
          bookmark.click_count += 1;
          bookmark.last_click = $filter("date")(new Date(), "yyyy-MM-dd HH:mm:ss");
        }
      })
      $timeout(function () {
        timeagoInstance.cancel();
        timeagoInstance.render(document.querySelectorAll('.need_to_be_rendered'), 'zh_CN');
      }, 100)
    }
  }

  $scope.delBookmark = function (bookmark) {
    $scope.waitDelBookmark = $.extend(true, {}, bookmark); // 利用jQuery执行深度拷贝
    console.log(JSON.stringify(bookmark));
    dialog = ngDialog.open({
      template: './views/dialog-del-bookmark.html',
      className: 'ngdialog-theme-default',
      scope: $scope
    });
  }

  $scope.confirmDelBookmark = function (bookmarkId) {
    var params = {
      id: bookmarkId
    }
    ngDialog.close(dialog);
    bookmarkService.delBookmark(params)
      .then((data) => {
        $("#" + bookmarkId).transition({
          animation: dataService.animation(),
          duration: 500,
          onComplete: function () {
            $("#" + bookmarkId).remove();
          }
        });
        // 更新分类里面含有书签的数量
        $scope.tags.forEach((t1) => {
          $scope.waitDelBookmark.tags.forEach((t2) => {
            if (t1.id == t2.id) {
              t1.bookmarkCount--;
            }
          })
        })
        toastr.success($scope.waitDelBookmark.title + ' 书签删除成功！', "提示");
      })
      .catch((err) => {
        toastr.error($scope.waitDelBookmark.title + ' 书签删除失败！错误提示：' + JSON.stringify(err), "提示");
      });
  }

  $scope.editBookmark = function (bookmarkId) {
    pubSubService.publish('bookmarksCtr.editBookmark', {
      'bookmarkId': bookmarkId
    });
  }

  $scope.detailBookmark = function (bookmark) {
    bookmark.own = true;
    pubSubService.publish('TagCtr.showBookmarkInfo', bookmark);
    bookmarkService.clickBookmark({
      id: bookmark.id
    });
  }

  $scope.copy = function (url) {
    dataService.clipboard(url);
  }

  $scope.toggleMode = function (mode) {
    $scope.editMode = mode;
    if (!$scope.editMode) {
      getTags();
    } else {
      $('.js-tags-table').transition('hide');
      $('.js-tag-costomTag').transition('hide');
      $('.stackable.cards .card').transition('hide');
      $('.stackable.cards .card').transition({
        animation: dataService.animation(),
        reverse: 'auto', // default setting
        interval: 50
      });
    }
  }

  $scope.toggleShowMode = function (showMode) {
    $scope.showMode = showMode;
    $scope.getBookmarks(null, 1, null);
  }

  $scope.editTag = function (tag) {
    if (tag.name == "未分类" || tag.name == "收藏") {
      toastr.warning('这个是系统默认分类，暂时不允许更新名字！', "警告");
      return;
    }
    tag.oldName = tag.name;
    tag.edit = true;
  }

  $scope.updateTagShow = function (tag, show) {
    var params = {
      id: tag.id,
      show: show,
    }
    bookmarkService.updateTagShow(params)
      .then((data) => {
        if (data.retCode == 0) {
          toastr.success(tag.name + ' 更新成功！', "提示");
          tag.show = show;
        } else {
          toastr.error(tag.name + ' 更新失败！错误提示：' + data.msg, "提示");
        }
      })
      .catch((err) => {
        toastr.error(tag.name + ' 更新失败！错误提示：' + err, "提示");
      });
  }

  $scope.updateTag = function (tag) {
    if (tag.name == tag.oldName) {
      toastr.warning('您没有编辑分类', "警告");
      return;
    }
    tag.edit = false;
    var params = {
      id: tag.id,
      name: tag.name,
    }

    bookmarkService.updateTagName(params)
      .then((data) => {
        if (data.retCode == 0) {
          toastr.success(tag.name + ' 更新成功！', "提示");
        } else {
          toastr.error(tag.name + ' 更新失败！错误提示：' + data.msg, "提示");
          $scope.backTag(tag);
        }
      })
      .catch((err) => {
        toastr.error(tag.name + ' 更新失败！错误提示：' + err, "提示");
        $scope.backTag(tag);
      });
  }

  $scope.delTag = function (tag) {
    console.log('delTag..........')
    $scope.waitDelTag = $.extend(true, {}, tag); // 利用jQuery执行深度拷贝
    dialog = ngDialog.open({
      template: './views/dialog-del-tag.html',
      className: 'ngdialog-theme-default',
      scope: $scope
    });
  }

  $scope.confirmDelTag = function (tagId, tagName) {
    ngDialog.close(dialog);
    var params = {
      del: (tagName == '未分类' || tagName == "收藏") ? false : true,
      id: tagId,
    }
    bookmarkService.delTag(params)
      .then((data) => {
        if (data.retCode == 0) {
          toastr.success('[ ' + tagName + ' ]分类删除成功！', "提示");
          var index = -1;
          $scope.tags.forEach((tag, i) => {
            if (tag.id == tagId) {
              index = i;
            }
          })
          if (index !== -1 && tagName != '未分类' && tagName != "收藏") {
            $("#tag" + tagId).transition({
              animation: dataService.animation(),
              duration: 500,
              onComplete: function () {
                $("#tag" + tagId).remove();
                $scope.tags.splice(index, 1);
              }
            });
          } else {
            getTags();
          }
        } else {
          toastr.error('[ ' + tagName + ' ]分类删除失败！' + data.msg, "提示");
          getTags();
        }
      })
      .catch((err) => {
        toastr.error('分类删除失败！错误提示：' + JSON.stringify(err), "提示");
        getTags();
      });
  }

  $scope.showAddTag = function () {
    if ($scope.tags.length < 30) {
      console.log('showAddTag..........')
      $scope.newTag = "";
      dialog = ngDialog.open({
        template: './views/dialog-add-tag.html',
        className: 'ngdialog-theme-default',
        scope: $scope
      });
    } else {
      toastr.error('标签个数总数不能超过30个！不允许再添加新分类，如有需求，请联系管理员。', "提示");
    }
  }

  $scope.addTag = function (tag) {
    console.log(tag);
    if ($scope.tags.length >= 30) {
      toastr.error('标签个数总数不能超过30个！不允许再添加新分类，如有需求，请联系管理员。', "提示");
      return;
    }
    tag = tag.replace(/(^\s*)|(\s*$)/g, '').replace(/\s+/g, ' '); // 去除前后空格，多个空格转为一个空格;

    var exist = $scope.tags.some((item) => {
      return item.name == tag;
    })
    if (exist) {
      toastr.error('该分类【' + tag + '】已存在！', "提示");
      return;
    }

    if (tag) {
      ngDialog.close(dialog);

      var tags = [];
      tags.push(tag);
      bookmarkService.addTags(tags)
        .then((data) => {
          toastr.success('[ ' + tag + ' ]插入分类成功！将自动更新分类信息<br />注意：分类页面只有分类下面有书签才显示分类', "提示");
          getTags();
        })
        .catch((err) => {
          toastr.warning('[ ' + tag + ' ]插入分类失败：' + JSON.stringify(err), "提示");
        });
    } else {
      toastr.warning('您可能没有输入分类或者输入的分类有误', "提示");
    }
  }

  $scope.backTag = function (tag) {
    tag.edit = false;
    tag.name = tag.oldName;
  }

  $scope.storeTagIndex = function () {
    $scope.tagsIndex = [];
    $scope.tags.forEach((tag, index) => {
      $scope.tagsIndex[index] = {
        id: tag.id,
        index: index,
      }
    })
    console.log('storeTagIndex');
  }

  $scope.updateTagIndex = function () {
    // 要开个timer，因为释放鼠标模型还没更新
    setTimeout(function () {
      var needUpdate = false;
      for (var i = 0; i < $scope.tags.length; i++) {
        if ($scope.tags[i].id != $scope.tagsIndex[i].id) {
          needUpdate = true;
        }
        $scope.tagsIndex[i] = {
          id: $scope.tags[i].id,
          index: i,
        }
      }
      if (needUpdate) {
        bookmarkService.updateTagsIndex($scope.tagsIndex)
          .then((data) => {
            if (data.retCode == 0) {
              toastr.success('分类排序更新成功！', "提示");
            } else {
              toastr.error('分类排序更新失败！', "提示");
              getTags();
            }
          })
          .catch((err) => {
            toastr.error('分类排序更新失败！错误提示：' + JSON.stringify(err), "提示");
            getTags();
          });
      }
      console.log('updateTagIndex needUpdate = ' + needUpdate)
    }, 300)
  }

  $scope.setHoverBookmark = function (bookmark) {
    $scope.hoverBookmark = bookmark;
  }

  // 在输入文字的时候也会触发，所以不要用Ctrl,Shift之类的按键
  $document.bind("keydown", function (event) {
    $scope.$apply(function () {
      var key = event.key.toUpperCase();
      if ($scope.hoverBookmark && dataService.keyShortcuts()) {
        if (key == 'E') {
          $scope.editBookmark($scope.hoverBookmark.id)
        } else if (key == 'I') {
          $scope.detailBookmark($scope.hoverBookmark)
        } else if (key == 'D') {
          $scope.delBookmark($scope.hoverBookmark)
        } else if (key == 'C') {
          $scope.copy($scope.hoverBookmark.url)
        }
      }
    })
  });

  async function getTags() {
    $scope.loadTags = true;
    $scope.tags = [];

    let tags = await get('tags', { bookmarkCount: true });
    tags.unshift({
      id: -1,
      bookmarkCount: 1,
      bookmarkClicked: false,
      name: '个人定制',
      show: 1
    })

    let find = false;
    for (let tag of tags) {
      tag.edit = false;
      tag.oldName = tag.name;
      if (tag.id == $scope.currentTagId) {
        tag.bookmarkClicked = true;
        find = true; // 如果是删了分类返回来，那么要重新默认选中第一个分类
      }
      $scope.tags.push(tag);
    }

    if (!find) {
      $scope.currentTagId = -1;
      $scope.tags[0].bookmarkClicked = true;
    }

    if (!$scope.editMode) {
      await $scope.getBookmarks(null, null, null);
    }

    $scope.loadTags = false;
    pubSubService.publish('Common.menuActive', {
      login: true,
      index: dataService.LoginIndexTags
    });
  }

  pubSubService.subscribe('EditCtr.inserBookmarsSuccess', $scope, function (event, data) {
    console.log('subscribe EditCtr.inserBookmarsSuccess', data);
    var menusScope = $('div[ng-controller="menuCtr"]').scope();
    if (menusScope.login && menusScope.selectLoginIndex == 1) {
      var find = false;
      $scope.bookmarks.forEach((bookmark) => {
        if (bookmark.id == data.id) {
          bookmark.title = data.title;
          bookmark.url = data.url;
          bookmark.tags = data.tags;
          bookmark.description = data.description;
          find = true;
          // if ($scope.order[bookmark.type - 1]) {
          //   dataService.transition('#' + bookmark.id, {
          //     duration: 1000,
          //   });
          // }
        }
      })
      if (!find) {
        if (data.tags.map((tag) => tag.id).indexOf($scope.currentTagId) >= 0) {
          if (!$scope.editMode) {
            $scope.getBookmarks(null, null, null);
          }
          addBookmarkId = data.id;
        }
      }
    }
  });

  pubSubService.subscribe('EditCtr.addTagsSuccess', $scope, function (event, data) {
    console.log('subscribe EditCtr.addTagsSuccess', data);

    var menusScope = $('div[ng-controller="menuCtr"]').scope();
    if (menusScope.login && menusScope.selectLoginIndex == 1) {
      getTags();
    }
  });

  setTimeout(() => {
    $('.js-tag-label .icon').popup();
  }, 3000);
}]);