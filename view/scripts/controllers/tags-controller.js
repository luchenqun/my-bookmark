app.controller('tagsCtr', ['$scope', '$filter', '$state', '$window', '$stateParams', '$timeout', '$document', 'ngDialog', 'pubSubService', 'dataService', function ($scope, $filter, $state, $window, $stateParams, $timeout, $document, ngDialog, pubSubService, dataService) {
  console.log("Hello tagsCtr...", $stateParams);
  if (dataService.smallDevice()) {
    if ($window.location.hostname.indexOf("b.lucq.fun") >= 0) {
      $window.location = "http://mb.lucq.fun/#/tags";
      return;
    }
  }
  pubSubService.publish('Menus.active');

  (async () => {
    await getTags();
    $scope.user = await get('user');
    if ($scope.user.username != 'lcq') {
      $(".globalTag").show(); // 自己知道这个功能，不显示
    }
  })()

  let dialog = null;
  let addBookmarkId = -1; // 新增一个书签会重新刷新页面
  let timeagoInstance = timeago();

  $scope.hoverBookmark = null;
  $scope.showType = "createdAt";
  $scope.loading = true;
  $scope.tags = []; // 书签数据
  $scope.user = { username: "test" };
  $scope.tagsIndex = []; // 书签索引
  $scope.bookmarks = [];
  $scope.totalPages = 0;
  $scope.currentPage = 0;
  $scope.pageSize = 80;
  $scope.inputPage = '';
  $scope.currentTagId = ($stateParams && $stateParams.tagId) || (-1);
  $scope.editMode = false;
  $scope.showMode = 'item';
  $scope.newTag = '';
  $scope.waitDelTag = {};
  $scope.waitDelBookmark = {};
  $scope.bookmarkNormalHover = false;

  $scope.getBookmarks = async function (tagId, page, showType) {
    console.log(tagId, page, showType);

    $scope.bookmarks = [];
    tagId && ($scope.currentTagId = tagId);
    Number.isInteger(page) && ($scope.currentPage = page);
    showType && ($scope.showType = showType);
    $scope.loading = true;

    let pageSize = ($scope.showMode == 'item') ? $scope.pageSize : 20;

    for (let tag of $scope.tags) {
      tag.bookmarkClicked = (tag.id == $scope.currentTagId);
    }

    var params = {
      tagId: $scope.currentTagId,
      page: $scope.currentPage,
      pageSize,
      showType: $scope.showType
    };

    let reply = await get('bookmarksByTag', params);
    let bookmarks = reply.data;
    for (bookmark of bookmarks) {
      let tag = $scope.tags.find(tag => tag.id == bookmark.tagId);
      tag && (bookmark.tagName = tag.name);
    }

    $scope.bookmarks = bookmarks;
    $scope.totalPages = reply.totalPages;
    $scope.inputPage = '';
    $scope.loading = false;

    for (let tag of $scope.tags) {
      if (tag.id == $scope.currentTagId) {
        tag.bookmarkCount = reply.count;
        break;
      }
    }

    if ($scope.showMode == 'table' && bookmarks.length > 0) {
      let id = setInterval(() => {
        if (document.querySelectorAll('.need_to_be_rendered').length > 0) {
          timeagoInstance.cancel();
          timeagoInstance.render(document.querySelectorAll('.need_to_be_rendered'), 'zh_CN');
          clearInterval(id);
        }
      }, 10);
    } else if ($scope.showMode == 'item' && bookmarks.length > $scope.pageSize / 2 && $scope.currentTagId == -1) {
      $timeout(() => {
        $("#" + bookmarks[bookmarks.length / 2 - 1].id).after(`<div class="ui divider" style="width:100%;margin:0px 15px -1px 15px"></div>`);
      }, 100);
    }

    $timeout(function () {
      dataService.transition('#' + addBookmarkId, {
        duration: 1000,
      });
      addBookmarkId = -1;
    }, 10);
  };

  $scope.changeCurrentPage = function (currentPage) {
    currentPage = parseInt(currentPage) || 0;
    console.log(currentPage);
    if (currentPage <= $scope.totalPages && currentPage >= 1) {
      $scope.getBookmarks(null, currentPage, null);
      $scope.currentPage = currentPage;
    }
  }

  $scope.jumpToUrl = async function (url, id) {
    if (!$scope.editMode) {
      $window.open(url, '_blank');
      await post("bookmarkClick", { id });

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

  $scope.confirmDelBookmark = async function (id) {
    ngDialog.close(dialog);
    await post("bookmarkDel", { id })
    $("#" + id).transition({
      animation: dataService.animation(),
      duration: 500,
      onComplete: function () {
        $("#" + id).remove();
      }
    });

    // 更新分类里面含有书签的数量
    $scope.tags.forEach((tag) => {
      if (tag.id == $scope.waitDelBookmark.tagId) {
        tag.bookmarkCount--;
      }
    })
  }

  $scope.editBookmark = function (id) {
    pubSubService.publish('bookmarksCtr.editBookmark', { id });
  }

  $scope.detailBookmark = async function (bookmark) {
    pubSubService.publish('TagCtr.showBookmarkInfo', bookmark);
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

  $scope.updateTagShow = async function (tag, show) {
    await post("tagUpdate", { id: tag.id, show });
    toastr.success(tag.name + ' 更新成功！', "提示");
    $timeout(() => {
      tag.show = show;
    });
  }

  $scope.updateTag = async function (tag) {
    if (tag.name == tag.oldName) {
      toastr.warning('您没有编辑分类', "警告");
    } else {
      tag.edit = false;
      var params = {
        id: tag.id,
        name: tag.name,
      }

      try {
        await post('tagUpdate', params);
        toastr.success(tag.name + ' 更新成功！', "提示");
      } catch (error) {
        $scope.backTag(tag);
      }
    }
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

  $scope.confirmDelTag = async function (id, tagName) {
    ngDialog.close(dialog);
    if (tagName == '未分类' || tagName == "收藏") {
      toastr.error('默认分类不允许删除', "提示");
    } else {
      await post("tagDel", { id });

      let index = 0;
      for (const tag of $scope.tags) {
        if (tag.id == id) {
          $("#tag" + id).transition({
            animation: dataService.animation(),
            duration: 500,
            onComplete: function () {
              $("#tag" + id).remove();
              $scope.tags.splice(index, 1);
            }
          });
          break;
        }
        index++;
      }

      getTags();
    }
  }

  $scope.showAddTag = function () {
    if ($scope.tags.length < 50) {
      console.log('showAddTag..........')
      $scope.newTag = "";
      dialog = ngDialog.open({
        template: './views/dialog-add-tag.html',
        className: 'ngdialog-theme-default',
        scope: $scope
      });
    } else {
      toastr.error('标签个数总数不能超过50个！不允许再添加新分类，如有需求，请联系管理员。', "提示");
    }
  }

  $scope.addTag = async function (tag) {
    console.log(tag);
    if ($scope.tags.length >= 50) {
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
      await post("tagAdd", { name: tag })
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
        sort: index,
      }
    })
  }

  $scope.updateTagIndex = async function () {
    // 要开个timer，因为释放鼠标模型还没更新
    setTimeout(async () => {
      let needUpdate = false;
      for (let index = 0; index < $scope.tags.length; index++) {
        if ($scope.tags[index].id != $scope.tagsIndex[index].id) {
          needUpdate = true;
        }
        $scope.tagsIndex[index] = {
          id: $scope.tags[index].id,
          sort: index,
        }
      }
      if (needUpdate) {
        await post('tagSort', { tags: $scope.tagsIndex });
      }
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

  $scope.globalTag = function () {
    $state.go('settings', { formIndex: 4 });
  }

  async function updateTags(_tags) {
    let tags = JSON.parse(JSON.stringify(_tags));

    $scope.loading = true;
    $scope.tags = [];

    tags.unshift({
      id: -1,
      bookmarkCount: '...',
      bookmarkClicked: false,
      name: '全部',
      show: 1,
      sort: -1
    })

    let find = false;
    for (let tag of tags) {
      tag.edit = false;
      tag.oldName = tag.name;
      if (tag.id == $scope.currentTagId) {
        tag.bookmarkClicked = true;
        find = true; // 如果是删了分类返回来，那么要重新默认选中第一个分类
      }
    }

    if (!find) {
      $scope.currentTagId = -1;
      tags[0].bookmarkClicked = true;
    }

    tags.sort((a, b) => a.sort - b.sort);

    $timeout(() => {
      $scope.loading = false;
      $scope.tags = tags;
      if (!$scope.editMode) {
        $scope.getBookmarks(null, null, null);
      }
    })
  }

  async function getTags() {
    // 通过缓存tags，如果回来的tags跟缓存的一致，那么这个时间差就省下来了
    let tags = JSON.parse(localStorage.getItem("tags") || "[]");
    if (tags.length > 0) {
      get('tags').then((_tags) => {
        if (JSON.stringify(tags) != JSON.stringify(_tags)) {
          localStorage.setItem("tags", JSON.stringify(_tags));
          updateTags(_tags);
        }
      });
    } else {
      tags = await get('tags');
      localStorage.setItem("tags", JSON.stringify(tags));
    }
    updateTags(tags);
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
          bookmark.description = data.description;
          find = true;
        }
      })
      if (!find) {
        if ($scope.tags.map((tag) => tag.id).indexOf($scope.currentTagId) >= 0) {
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