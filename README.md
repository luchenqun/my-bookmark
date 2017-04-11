# 在线书签管理工具
![image](https://github.com/luchenqun/my-bookmark/blob/master/public/images/screenshot.png)
1 例子(demo)
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
**mongo**：后台保存登陆的session。    
**Semantic**：由于没有美工人员，自己开发的，不想界面太丑，用了这套UI。   

5 目录结构
---------
```   
my-bookmark/
├── bin/                                      # 应用启动文件夹    
│   └── www                                   # 后台启动文件
├── common/                                   # 自己写的一些模块
│   └── parse_html.js                         # 用来解析从浏览器导出来的书签文件
├── database/                                 # 数据库相关操作文件夹
│   └── db.js                                 # 所有数据库的操作都在这里
├── node_modules/                             # nodejs模块安装文件夹
│   ├── express/                              # 一个nodejs Web 应用程序框架
│   ├── .....                                 # 其他nodejs用到的包
│   └── mysql/                                # mysql包
├── public/                                   # 网站实现文件夹
│   ├── css/                                  # 样式表文件夹
│   │   ├── externe/                          # 外部引入引来的css文件
│   │   └── style.css                         # 自己写的css文件
│   ├── images/                               # 图片文件夹
│   │   ├── favicon/                          # 下载书签的favicon文件夹
│   │   ├── snap/                             # 书签的截图文件夹
│   │   ├── .....                             # 其他图片文件
│   │   └── edit.png                          # 编辑图片
│   ├── scripts/                              # 前端逻辑实现的JS文件以及引入的JS文件
│   │   ├── controllers/                      # 所有的AngularJS控制器
│   │   │   ├── advice-controller.js          # 留言页面控制器
│   │   │   ├── bookmark-info-controller.js   # 书签详情页面控制器
│   │   │   ├── bookmarks-controller.js       # 书签页面控制器
│   │   │   ├── edit-controller.js            # 编辑书签页面控制器
│   │   │   ├── home-controller.js            # 未登录时首页页面控制器
│   │   │   ├── hot-controller.js             # 热门收藏页面控制器
│   │   │   ├── login-controller.js           # 登陆注册页面控制器
│   │   │   ├── menus-controller.js           # 菜单栏控制器
│   │   │   ├── search-controller.js          # 搜索书签页面控制器
│   │   │   ├── settings-controller.js        # 设置页面控制器
│   │   │   └── tags-controller.js            # 分类页面控制器
│   │   ├── directives/                       # 所有的AngularJS指令
│   │   │   ├── js-init-directive.js          # 一些初始化指令
│   │   │   └── module-directive.js           # 模块指令(如：分页模块等)
│   │   ├── externe/                          # 外部引入的JS文件
|   |   |   ├── angular.min.js                # angular文件
|   |   |   ├── angular-cookies.min.js        # angular前台cookies模块
|   |   |   ├── angular-medium-editor.min.js  # 编辑器，书签编辑页面使用
|   |   |   ├── angular-sortable-view.min.js  # 可以拖拽元素的控件，用于分类页面
|   |   |   ├── angular-ui-router.min.js      # angular web客户端的路由
|   |   |   ├── calendar.min.js               # 一个日历控件，用于搜索页面
|   |   |   ├── canvas-nest.min.js            # 一个很赞的网页背景效果(装逼)
|   |   |   ├── clipboard.min.js              # 用于复制粘贴库，不需要flash
|   |   |   ├── jquery.form.js                # 表单异步提交(想不起哪里用了)
|   |   |   ├── jquery.uploadfile.min.js      # 文件上传控件，用于上传浏览器导出书签
|   |   |   ├── jquery-3.1.1.min.js           # jquery文件
|   |   |   ├── medium-editor.min.js          # 编辑器，angular-medium-editor依赖
|   |   |   ├── ngDialog.min.js               # 一个angular对话框控件
|   |   |   ├── ng-infinite-scroll.min.js     # 一个angular无限滚动加载数据控件
|   |   |   ├── semantic.min.js               # semantic文件
|   |   |   ├── timeago.min.js                # 一个将时间戳转换成易读的时间轴
|   |   |   └── toastr.min.js                 # 一个消息提示插件
│   │   ├── services/                         # 所有的AngularJS服务文件
|   |   |   ├── bookmark-service.js           # 前端与后端交互服务
|   |   |   ├── data-service.js               # 数据服务(本来想将一些数据结构放这里)
|   |   |   └── pub-sub-service.js            # 控制器之间消息通讯服务组件
│   │   └── app-angular.js                    # AngularJS路由配置文件
│   ├── views                                 # 页面实现文件
|   |   ├── advice.html                       # 留言页面
|   |   ├── bookmark-info.html                # 书签详情页面
|   |   ├── bookmarks.html                    # 书签页面
|   |   ├── dialog-add-tag.html               # 分类添加页面
|   |   ├── dialog-del-bookmark.html          # 书签删除确认页面
|   |   ├── dialog-del-tag.html               # 分类删除确认页面
|   |   ├── edit.html                         # 书签添加修改页面
|   |   ├── home.html                         # 未登录时首页页面
|   |   ├── hot.html                          # 热门收藏页面
|   |   ├── login.html                        # 登陆注册页面
|   |   ├── menus.html                        # 菜单组件
|   |   ├── pagination.html                   # 分页组件
|   |   ├── search.html                       # 搜索书签页面
|   |   ├── settings.html                     # 设置页面
|   |   └── tags.html                         # 分类页面
│   ├── favicon.ico                           # 网站favicon
│   └── index.html                            # 前端单页面应用主页
├── routes/                                   # 路由文件夹
│   └── api.js                                # 整个应用路由实现
├── uploads/                                  # 文件上传文件夹
├── app.js                                    # app文件
├── package.json                              # nodejs package文件
├── README.md                                 # 项目工程说明文件
└── schema.sql                                # mysql数据库建表文件
```   
6 用到的nodejs模块说明
--------------------
```
"body-parser": bodyParser用于解析客户端请求的body中的内容,内部使用JSON编码处理
"connect-mongo": 用于将session存入mongo
"cookie-parser": 处理每一个请求的cookie
"crypto": 加密模块，主要用来加密用户的密码
"debug": 这个好像没用到，看名字好像调试的。
"download": 主要用来下载书签的favicon文件
"express": Web 应用程序框架
"express-session": session模块
"jsdom": 用来解析从浏览器导出来上传到服务器的书签html文件
"morgan": 一个node.js关于http请求的日志中间件
"multer": 文件上传模块
"mysql": sql数据库操作模块
"node-readability": 获取网页title(添加书签用到)跟内容(书签详情用到)模块。
"request": http请求模块。主要用来获取热门书签数据。
"supervisor": 文件改变监视文件，开发使用。
"webshot": 网页截图模块。
```

7 安装部署指南
-------------
1、安装MySql数据库。如果不会，请戳教程[mysql 数据库安装教程](http://t.cn/RXhwLyJ "mysql 数据库安装教程")。有点需要注意的是，MySql的版本至少要是5.6。否则执行schema.sql文件会出错。   
2、新建一个数据库名，使用mysql将根目录下面的schema.sql文件执行一遍，创建数据库表格。有个问题尤其要注意：**数据库一定要使用UTF-8的编码**，否则执行一些汉字的sql语句会出错！如果是Ubuntu，大概过程如下。
```
mysql -u root -p // 使用root账号进入mysql数据库。按回车之后输入安装时候root的密码。
CREATE DATABASE mybookmarks; // 创建mybookmarks数据库。
CREATE USER 'test'@'%' IDENTIFIED BY '123456';// 创建一个以用户名为test，密码为123456的用户
GRANT ALL ON *.* TO 'test'@'%';  // 给刚创建的test用户数据库所有的权限
use mybookmarks; //选择刚创建的数据库。
source /home/lcq/schema.sql; // 执行schema.sql文件创建数据库表格。注意，将路径换为你schema.sql所在路径。   
```
3、安装MongoDB 安装教程。如果不会，请戳教程[MongoDB 安装教程](http://t.cn/RXhAORF "MongoDB 安装教程")，安装完成之后如果MongoDB没有启动，请启动MongoDB。   
4、安装Nodejs。Nodejs版本至少要求6.0以上。不会的话，请按照上面步骤1、3提供的方法自行解决。   
5、克隆代码`git@github.com:luchenqun/my-bookmark.git`，切换到项目根目录下面，执行`npm install`安装package。   
6、更新/database/db.js文件的dbConfig配置，将你mysql的数据信息更新上去。   
7、如果上面的都做好了，在项目根目录下面执行`node ./bin/www`，如果是开发，可以使用`npm start`。  
8、在浏览器里面输入：127.0.0.1:2000。  
9、部署的话，推荐使用nginx作为HTTP和反向代理服务器，使用forever让nodejs应用后台执行。相关知识，请自行百度。
