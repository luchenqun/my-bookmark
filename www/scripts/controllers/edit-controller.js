app.controller('editCtr', ['$scope', '$state', '$timeout', '$document', 'ngDialog', 'pubSubService', 'dataService', function ($scope, $state, $timeout, $document, ngDialog, pubSubService, dataService) {
  console.log("Hello editCtr");
  var maxSelections = 3;
  var dialog = null;
  var cancelDefault = false;
  init();

  $scope.$watch('url', async function (newUrl, oldUrl, scope) {
    $timeout(function () {
      $scope.urlError = $scope.url == '' && $('.ui.modal.js-add-bookmark').modal('is active');
    });
    if ($scope.autoGettitle) {
      $scope.title = "";
      if (/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/.test(newUrl)) {
        var params = {
          url: newUrl,
          requestId: 0,
        }
        $scope.loadTitle = true;
        try {
          let data = await get('article', { url: newUrl });
          $scope.loadTitle = false;
          $scope.originTitle = data.title;
          $scope.title = data.title;

          if (!$scope.title) {
            toastr.error('获取书签标题失败，请手动填入', "提示");
          } else {
            $scope.title = data.title.split('-')[0].trim();
          }
        } catch (error) {
          toastr.error('获取书签标题失败：' + JSON.stringify(err) + '，请手动填入', "提示");
          $scope.loadTitle = false;
        }
      }
    }
  });

  $scope.$watch('description', function (newDescription, oldDescription, scope) {
    setTimeout(function () {
      $('.ui.modal.js-add-bookmark').modal("refresh");
    }, 500);
  });

  $scope.$watch('title', function (newValue, oldValue, scope) {
    $timeout(function () {
      $scope.titleError = $scope.title == '' && $('.ui.modal.js-add-bookmark').modal('is active');
    });
  });

  $scope.restoreTitle = function () {
    $scope.title = $scope.originTitle;
  }

  $scope.cancel = function () {
    $('.ui.modal.js-add-bookmark').modal('hide');

    init();
  }
  $scope.ok = async function () {
    var tagId = -1;
    $scope.tags.forEach((tag) => {
      if (tag.clicked) {
        tagId = tag.id;
      }
    });
    // console.log('Hello ok clicked', $scope.url, $scope.title, $scope.description, $scope.public, selectedTags, $scope.tags);
    $scope.urlError = $scope.url == '';
    $scope.titleError = $scope.title == '';
    $scope.tagsError = tagId == -1;

    var params = {
      id: $scope.id,
      url: $scope.url,
      tagId,
      title: $scope.title,
      description: $scope.description,
      public: $('.ui.checkbox.js-public').checkbox('is checked') ? '1' : '0',
    }
    if (!/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/.test($scope.url)) {
      toastr.error('检撤到您的书签链接非法，是否忘记加http或者https了？建议直接从打开浏览器地址栏复制出来直接粘贴到输入框。', "错误");
      return;
    }
    if ($scope.tagsError) {
      toastr.error('您至少要选择一个分类！如果暂时没想到放到哪个分类，可以先选择未分类', "错误");
      return;
    }
    if ($scope.titleError) {
      toastr.error('书签标题不能为空！', "错误");
      return;
    }
    console.log("add bookmark", params);

    if ($scope.add) {
      let id = await post('bookmarkAdd', params);
      $('.ui.modal.js-add-bookmark').modal('hide');
      params.id = id;
      pubSubService.publish('EditCtr.inserBookmarsSuccess', params);
    } else {
      await post('bookmarkUpdate', params);
      $('.ui.modal.js-add-bookmark').modal('hide');
      pubSubService.publish('EditCtr.inserBookmarsSuccess', params);
      toastr.success('[ ' + params.title + ' ] 更新成功，将自动重新更新书签！', "提示");
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
      toastr.error('标签个数总数不能超过50个！不允许再添加新分类，如有需求，请联系管理员。', "提示");
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
      await post('tagAdd', { name: tag });
      await getTags();
    } else {
      toastr.warning('您可能没有输入分类或者输入的分类有误', "提示");
    }
  }

  $scope.clickTag = function (id, clicked) {
    $scope.tags.forEach((tag) => {
      tag.clicked = tag.id == id
    })
  }

  pubSubService.subscribe('MenuCtr.showAddBookmarkMoadl', $scope, function (event, params) {
    console.log('subscribe MenuCtr.showAddBookmarkMoadl', params);
    $('.ui.modal.js-add-bookmark').modal({
      closable: false,
    }).modal('setting', 'transition', dataService.animation()).modal('show');
    $('.ui.checkbox.js-public').checkbox('set checked');
    cancelDefault = true;
    init();
    getTags();
  });

  pubSubService.subscribe('bookmarksCtr.editBookmark', $scope, async function (event, params) {
    console.log('subscribe bookmarksCtr.editBookmark', params);
    $('.ui.modal.js-add-bookmark').modal({
      closable: false,
    }).modal('setting', 'transition', dataService.animation()).modal('show');
    setTimeout(function () {
      $('.ui.modal.js-add-bookmark').modal("refresh");
    }, 500);
    $scope.add = false;
    $scope.loadTags = true;
    $scope.autoGettitle = false;

    cancelDefault = false;

    let bookmark = await get("bookmark", params);
    let tags = await get("tags");

    $scope.id = (bookmark && bookmark.id) || '';
    $scope.url = (bookmark && bookmark.url) || '';
    $scope.title = (bookmark && bookmark.title) || '';
    $scope.description = (bookmark && bookmark.description) || '';
    $scope.tags = tags.map((tag) => {
      tag.clicked = bookmark.tagId == tag.id;
      return tag;
    });
    $scope.public = (bookmark && bookmark.id) || '1';
    $('.ui.checkbox.js-public').checkbox((bookmark && bookmark.public && bookmark.public == '1') ? 'set checked' : 'set unchecked')
    $timeout(function () {
      $scope.loadTags = false;
    }, 10);
  });

  pubSubService.subscribe('TagCtr.storeBookmark', $scope, function (event, bookmark) {
    console.log('TagCtr.storeBookmark', bookmark);
    $('.ui.modal.js-add-bookmark').modal({
      closable: false,
    }).modal('setting', 'transition', dataService.animation()).modal('show');
    $('.ui.checkbox.js-public').checkbox('set checked');
    cancelDefault = true;
    init();
    getTags();
    $scope.autoGettitle = false;
    $scope.url = bookmark.url;
    $scope.title = bookmark.title;
  });

  // 在输入文字的时候也会触发，所以不要用Ctrl,Shift之类的按键
  $document.bind("keydown", function (event) {
    $scope.$apply(function () {
      var menusScope = $('div[ng-controller="menuCtr"]').scope();
      var key = event.key.toUpperCase();
      // console.log(key);
      if (key == 'INSERT' && menusScope.login) {
        if ($('.ui.modal.js-add-bookmark').modal('is active')) {
          $scope.ok();
        } else {
          $('.ui.modal.js-add-bookmark').modal({
            closable: false,
          }).modal('setting', 'transition', dataService.animation()).modal('show');
          $('.ui.checkbox.js-public').checkbox('set checked');
          cancelDefault = true;
          init();
          getTags();
        }
      }

      // Esc按键，退出
      if (key == 'ESCAPE' && menusScope.login) {
        $scope.cancel();
      }
    })
  });

  async function getTags() {
    let tags = await get('tags');
    tags.sort((a, b) => {
      if (a.lastUse > b.lastUse) return -1;
      return 1;
    })
    tags.forEach((tag) => {
      tag.clicked = false;
    })
    // 只有在新增的时候，才默认最近使用书签分类(编辑，转存不默认)
    if ($scope.add && tags.length >= 1 && $scope.url == '' && $scope.title == '') {
      tags[0].clicked = true;
    }

    $timeout(function () {
      $scope.tags = tags;
      $scope.loadTags = false;
    });
  }

  function init() {
    $scope.add = true;
    $scope.loadTags = true;
    $scope.autoGettitle = true;
    $scope.loadTitle = false;
    $scope.id = '';
    $scope.url = '';
    $scope.title = '';
    $scope.description = '';
    $scope.tags = []; // tag = {id:xxx, name:'yyy'}

    $scope.urlError = false;
    $scope.titleError = false;
    $scope.tagsError = false;

    $scope.public = '1';
  }
}]);
