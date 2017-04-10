# 在线书签管理工具
1 线上部署(demo)
-------------
[在线书签管理系统](http://mybookmark.cn/ "在线书签管理系统")，体验账号：test。密码：123456。

2 为什么要做个网络书签
------------------
每个浏览器上面都会有个书签可以供你收藏你以后可能还要用到的网址。但是这个书签有以下几个缺点我没法忍受（由于浏览器我只用Google Chrome，下面的观点我都是基于该浏览器）：   
1、各个浏览器之间无法同步。   
2、容易丢失。因为这个东西是不强制注册账号的，你只要一重装电脑忘记备份了，你的书签就没有了。还有一个，如果你使用Chrome浏览器，由于Google被ZF封杀，你要是不翻墙，书签是没法同步的。   
3、搜索不方便，只能搜索关键字，无法按照特定条件，比如搜索特定的加入时间，特定的类型搜索。   
4、查阅不方便。一旦一个分类目录你收藏的过多，尼玛你在那个目录下面找起来想死的心都有。   
5、无法查看别人收藏的书签。   
6、在别人的电脑上无法查看我收藏的书签。   
7、如果公用一台电脑，那么收藏夹里面会收藏其他人的网址。  

3 主要功能
-------
1、需要注册账号用户。(初步完成)   
2、网站展示有三种展示方式：导航，标签，列表，卡片。其中导航以分类展示，分类顺序可以在书签分类下面拖动编辑。按照点击的次数从高到低在每个分类里面提取16个书签，再按照最近添加的书签提取前面的16个书签，然后合并起来。标签是一个快捷方式。列表以表格展示，显示书签详细类容，按照点击次数优先显示，点击次数相同，则按添加顺序优先。卡片以卡片方式显示，按照最近添加优先显示。这几种展示方式，可以在设置里面默认一种你常用的方式。(完成)   
3、在书签分类里面，可以更新分类，删除分类，新增分类，对分类显示进行排序。分类的标签默认按照添加日期展示，但是可以点击表格的标题，按照点击次数，添加日期，最后点击从大到小进行排序。(完成)   
4、可以按照指定添加时间段，指定分类目录，指定网址关键字等进行查询。(完成)   
5、添加书签的时候，会自动获取title，供用户编辑。其中：Insert键打开添加页面，再次按Insert键保存书签，Esc取消添加。(完成)   
6、可以导入Chrome的书签导出文件，暂时做在设置里面。(完成)   
7、书签可以作为公有或者私有，公有可供所有人搜索。(完成)   
8、可以将搜索到其他用户的书签转存为自己的书签。(完成)   
9、可以将书签导出来，然后导入到浏览器。(未完成)   
10、在热门标签里面，有在网上找的热门书签。可以转存收藏到自己书签里面。(完成)   

4 主要用到的模块说明
------------------
**NodeJS**：用来做后台服务。  
**MySql**: 用来做数据存储。  
**AngularJS**：大家都懂的。   
**jQuery**: 大家都懂的。本来用了AngularJS是不需要再使用jQuery了的。但是有些功能AngularJS要大费周章才能完成，jQuery一句代码就能解决。所以还是忍不住将它导入了进来。   
**mongo**：保存登陆的session。    
**Semantic**：由于没有美工人员，自己开发的，不想界面太丑，用了这套UI。   

5 目录结构
---------
```   
my-bookmark/
├── bin/        #          
│   └── www                # 后台启动文件
├── common/                    # 自己写的一些模块
│   └── parse_html.js                # 用来解析从浏览器导出来的书签文件
├── database/                #
│   └── db.js                # 所有数据库的操作都在这里
├── node_modules/                    # nodejs模块安装文件夹
│   ├── express/              # 一个nodejs Web 应用程序框架
│   ├── .....                # 其他nodejs用到的包
│   └── mysql/                # mysql包
├── public/                    # 网站实现文件夹
│   ├── css/                 # 样式表文件夹
│   │   ├── externe/                 # 外部引入引来的css文件
│   │   └── style.css                # 自己写的css文件
│   ├── images/              # 图片文件夹
│   │   ├── favicon/                 # 下载书签的favicon文件夹
│   │   ├── snap/                 # 书签的截图文件夹
│   │   ├── .....                 # 其他图片文件
│   │   └── edit.png                # 编辑图片
│   ├── scripts/             # 前端逻辑实现的JS文件以及引入的JS文件
│   │   ├── controllers/                 # 所有的AngularJS控制器
│   │   │   ├── advice-controller.js                 #
│   │   │   ├── bookmark-info-controller.js                 #
│   │   │   ├── bookmarks-controller.js                 #
│   │   │   ├── edit-controller.js                 #
│   │   │   ├── home-controller.js                 #
│   │   │   ├── hot-controller.js                 #
│   │   │   ├── login-controller.js                 #
│   │   │   ├── menus-controller.js                 #
│   │   │   ├── search-controller.js                 #
│   │   │   ├── settings-controller.js                 #
│   │   │   └── tags-controller.js                 #
│   │   ├── directives/                 # 所有的AngularJS指令
│   │   │   ├── js-init-directive.js                 #
│   │   │   └── module-directive.js                #
│   │   ├── externe/                 # 外部引入的JS文件
|   |   |   ├── angular.min.js
|   |   |   ├── angular-cookies.min.js
|   |   |   ├── angular-medium-editor.min.js
|   |   |   ├── angular-sortable-view.min.js
|   |   |   ├── angular-ui-router.min.js
|   |   |   ├── calendar.min.js
|   |   |   ├── canvas-nest.min.js
|   |   |   ├── clipboard.min.js
|   |   |   ├── jquery.form.js
|   |   |   ├── jquery.uploadfile.min.js
|   |   |   ├── jquery-3.1.1.min.js
|   |   |   ├── medium-editor.min.js
|   |   |   ├── ngDialog.min.js
|   |   |   ├── ng-infinite-scroll.min.js
|   |   |   ├── semantic.min.js
|   |   |   ├── timeago.min.js
|   |   |   └── toastr.min.js
│   │   ├── services/                 # 所有的AngularJS服务文件
|   |   |   ├── bookmark-service.js
|   |   |   ├── data-service.js
|   |   |   └── pub-sub-service.js
│   │   └── app-angular.js                # AngularJS路由配置文件
│   ├── views        # 页面实现文件
|   |   ├── advice.html
|   |   ├── bookmark-info.html
|   |   ├── bookmarks.html
|   |   ├── dialog-add-tag.html
|   |   ├── dialog-del-bookmark.html
|   |   ├── dialog-del-tag.html
|   |   ├── edit.html
|   |   ├── home.html
|   |   ├── hot.html
|   |   ├── login.html
|   |   ├── menus.html
|   |   ├── pagination.html
|   |   ├── search.html
|   |   ├── settings.html
|   |   └── tags.html
│   ├── favicon.ico                # 网站favicon为念
│   └── index.html                # 单页面应用主页
├── routes/                    # ogs实现代码以及各个券商对接代码
│   ├── api.js                 # ai 实现文件
│   ├── index.js              # ddvip 券商实现文件
│   └── users.js                # ufx 券商实现文件
├── uploads/                    # ogs实现代码以及各个券商对接代码
├── views/                    # ogs实现代码以及各个券商对接代码
│   ├── ai/                 # ai 实现文件
│   ├── ddvip/              # ddvip 券商实现文件
│   ├── main.cc             # ogs实现代码
│   ├── OgsServer.cc        # ogs实现代码
│   ├── ....                # ogs其他实现代码
│   └── ufx/                # ufx 券商实现文件
├── app.js               # 更新日志
├── package.json          # 项目工程文件
├── README.md          # 项目工程文件
└── schema.sql               # 项目介绍文件
```   
