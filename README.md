# 在线书签管理工具
![image](https://github.com/luchenqun/my-bookmark/blob/master/public/images/screenshot.gif)   

1 在线体验(demo)
-------------
[在线书签管理系统](http://mybookmark.cn/ "在线书签管理系统")，体验账号：test。密码：123456。

2 为什么要做个网络书签
------------------
每个浏览器上面都会有个书签可以供你收藏你以后可能还要用到的网址。但是你可能还是会遇到下列问题：  
1、如果你重装系统，或者换浏览器怎么办？   
2、如果你有多个浏览器书签该如何整合？   
3、如何快速搜索保存的书签？比如我只想搜索某个时间段保存的书签？   
4、如果一个分类下面书签过多，如何方便快速查看？   
5、我能不能查看别人收藏的书签？   
6、在其他地方上网的时候能不能查看我自己的书签？   
7、如果公用一台电脑，如何区分我收藏的跟别人收藏的书签？  
在线书签管理工具，帮助你快速记录你喜欢的网站，并可以随时随地查看这些站点，而不必拘泥于使用的浏览器。无论在什么地方，只要能接入网络，就能打开属于你自己的网络书签，看到自己收藏的页面网址。

3 主要功能(开发计划)
-------
- [x] 需要注册账号用户。
- [x] 网站展示有三种展示方式：导航，标签，列表。其中导航以分类展示，分类顺序可以在书签分类下面拖动编辑。按照点击的次数从高到低在每个分类里面提取16个书签，再按照最近添加的书签提取前面的16个书签，然后合并起来。标签是一个快捷方式。列表以表格展示，显示书签详细类容，按照点击次数优先显示，点击次数相同，则按添加顺序优先。这几种展示方式，可以在设置里面默认一种你常用的方式。
- [x] 在书签分类里面，可以更新分类，删除分类，新增分类，对分类显示进行排序。分类的标签默认按照添加日期展示，但是可以点击表格的标题，按照点击次数，添加日期，最后点击从大到小进行排序。
- [x] 可以按照指定添加时间段，指定分类目录，指定网址关键字等进行查询。
- [x] 添加书签的时候，会自动获取title，供用户编辑。其中：Insert键打开添加页面，再次按Insert键保存书签，Esc取消添加。   
- [x] 可以导入Chrome的书签导出文件，暂时做在设置里面。
- [x] 书签可以作为公有或者私有，公有可供所有人搜索。  
- [x] 可以将搜索到其他用户的书签转存为自己的书签。  
- [x] 可以将书签导出来，然后导入到浏览器。
- [x] 在热门标签里面，有在网上找的热门书签。可以转存收藏到自己书签里面，快捷键R随机查看热门书签。
- [x] 新增备忘录功能，有时候随手要做点纪录，就方便了。任意界面按快捷键A增加备忘录。双击备忘录可查看详情！亦可分享备忘。
- [x] 在设置的全局链接，可设置快捷键，用来在任何页面，快速打开设置的链接。
- [x] 增加[Chrome插件](https://chrome.google.com/webstore/detail/%E4%B9%A6%E7%AD%BE%E5%BF%AB%E9%80%9F%E6%B7%BB%E5%8A%A0/lmmobgephofdffmaednjooplcpbgbjle)，可在任意界面快速添加书签至系统。   
- [x] 适配手机平板，手机端请访问[m.mybookmark.cn](http://m.mybookmark.cn/)。   


4 主要用到的软件与模块说明
------------------
**Node.js**：`v8.12.0` 用来做后台服务。  
**MySQL**: `v5.7.23`用来做数据存储。  
**AngularJS**：`v1.5.8`前端JavaScript框架。   
**jQuery**: `v3.1.1`本来用了AngularJS是不需要再使用jQuery了的。但是有些功能AngularJS要大费周章才能完成，jQuery一句代码就能解决。所以还是忍不住将它导入了进来。   
**Redis**：`v3.0.6`后台保存登陆的session。    
**Semantic**：`v2.4.0`由于没有美工人员，自己开发的，不想界面太丑，用了这套UI。   

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
│   │   ├── screenshot.png                    # 应用截图，Github展示
│   │   └── edit.png                          # 编辑图片
│   ├── scripts/                              # 前端逻辑实现的JS文件以及引入的JS文件
│   │   ├── controllers/                      # 所有的AngularJS控制器
│   │   │   ├── advice-controller.js          # 留言页面控制器
│   │   │   ├── bookmark-info-controller.js   # 书签详情页面控制器
│   │   │   ├── bookmarks-controller.js       # 书签页面控制器
│   │   │   ├── edit-controller.js            # 编辑书签页面控制器
│   │   │   ├── home-controller.js            # 未登录时首页页面控制器
│   │   │   ├── weixin-article-controller.js  # 热门收藏页面控制器
│   │   │   ├── login-controller.js           # 登陆注册页面控制器
│   │   │   ├── menus-controller.js           # 菜单栏控制器
│   │   │   ├── note-controller.js            # 备忘录控制器
│   │   │   ├── praise-controller.js          # 赞赏控制器
│   │   │   ├── search-controller.js          # 搜索书签页面控制器
│   │   │   ├── settings-controller.js        # 设置页面控制器
│   │   │   └── tags-controller.js            # 分类页面控制器
│   │   ├── directives/                       # 所有的AngularJS指令
│   │   │   ├── js-init-directive.js          # 一些初始化指令
│   │   │   └── module-directive.js           # 模块指令(如：分页模块等)
│   │   ├── externe/                          # 外部引入的JS文件
|   |   |   ├── angular.min.js                # angular文件
|   |   |   ├── angular-cookies.min.js        # angular前台cookies模块
|   |   |   ├── angular-sortable-view.min.js  # 可以拖拽元素的控件，用于分类页面
|   |   |   ├── angular-ui-router.min.js      # angular web客户端的路由
|   |   |   ├── calendar.min.js               # 一个日历控件，用于搜索页面
|   |   |   ├── clipboard.min.js              # 用于复制粘贴库，不需要flash
|   |   |   ├── jquery.form.js                # 表单异步提交(想不起哪里用了)
|   |   |   ├── jquery.uploadfile.min.js      # 文件上传控件，用于上传浏览器导出书签
|   |   |   ├── jquery-3.1.1.min.js           # jquery文件
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
|   |   ├── dialog-del-note.html              # 备忘录删除确认页面
|   |   ├── dialog-del-tag.html               # 分类删除确认页面
|   |   ├── edit.html                         # 书签添加修改页面
|   |   ├── home.html                         # 未登录时首页页面
|   |   ├── weixin-article.html               # 热门收藏页面
|   |   ├── login.html                        # 登陆注册页面
|   |   ├── menus.html                        # 菜单组件
|   |   ├── note.html                         # 备忘录页面
|   |   ├── pagination.html                   # 分页组件
|   |   ├── praise.html                       # 赞赏页面
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
6 用到的Node.js模块说明
--------------------
```
"body-parser": bodyParser用于解析客户端请求的body中的内容,内部使用JSON编码处理
"connect-redis": 用于将session存入Redis
"cheerio": 用于后端的jQuery，解析从浏览器导出来上传到服务器的书签html文件
"cookie-parser": 处理每一个请求的cookie
"crypto": 加密模块，主要用来加密用户的密码
"debug": Node.js后台日志模块，bin/www用到。
"download": 主要用来下载书签的favicon文件
"express": Web 应用程序框架
"express-session": session模块
"js-beautify": 用来格式化导出的书签的html文件
"morgan": 一个Node.js关于http请求的日志中间件
"multer": 文件上传模块
"mysql": sql数据库操作模块
"node-readability": 获取网页title(添加书签用到)跟内容(书签详情用到)模块。
"path": 路径处理模块。
"request": http请求模块。主要用来获取热门书签数据。
"supervisor": 文件改变监视文件，开发使用。
```

7 安装部署指南
-------------
1、安装MySQL数据库。如果不会，请戳教程[MySQL 数据库安装教程](http://baidu.luchenqun.com/?mysql%20%E6%95%B0%E6%8D%AE%E5%BA%93%E5%AE%89%E8%A3%85%E6%95%99%E7%A8%8B "mysql 数据库安装教程")。有点需要注意的是，MySQL的版本至少要是5.6。否则执行schema.sql文件会出错。   
2、新建一个数据库名，使用MySQL将根目录下面的schema.sql文件执行一遍，创建数据库表格。有个问题尤其要注意：**数据库一定要使用UTF-8的编码**，否则执行一些汉字的sql语句会出错！如果是Ubuntu，大概过程如下。
```
mysql -u root -p // 使用root账号进入mysql数据库。按回车之后输入安装时候root的密码。
CREATE DATABASE mybookmarks DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci; // 创建mybookmarks数据库。
CREATE USER 'test'@'%' IDENTIFIED BY '123456';// 创建一个以用户名为test，密码为123456的用户
GRANT ALL ON *.* TO 'test'@'%';  // 给刚创建的test用户数据库所有的权限
use mybookmarks; //选择刚创建的数据库。
source /home/lcq/schema.sql; // 执行schema.sql文件创建数据库表格。注意，将路径换为你schema.sql所在路径。   
```
3、安装Redis 安装教程。如果不会，请戳教程[Redis 安装教程](http://baidu.luchenqun.com/?redis%20%E5%AE%89%E8%A3%85 "Redis 安装教程")，安装完成之后如果Redis没有启动，请启动Redis。   
4、安装Node.js。Node.js版本至少要求8.0以上。不会的话，请按照上面步骤1、3提供的方法自行解决。   
5、克隆代码`git@github.com:luchenqun/my-bookmark.git`，切换到项目根目录下面，执行`npm install`安装package。   
6、在根目录，根据`config.default.js`文件内容创建一个新的文件`config.js`，更新你的MySQL的账号密码信息。注意，该账号必须要有写数据库的权限！
7、如果上面的都做好了，在项目根目录下面执行`node ./bin/www`，如果是开发，可以使用`npm start`。  
8、在浏览器里面输入：127.0.0.1:2000。  
9、部署的话，推荐使用nginx作为HTTP和反向代理服务器，使用forever让nodejs应用后台执行。相关知识，请自行百度。

8 其他说明
---------
1、对于favicon的下载，如果你部署在国内的服务器上，优先从国内提供的服务获取。代码在api.js文件下面的`api.getFaviconByTimer`函数处调整。   
2、我没有做浏览器兼容测试，只在Google Chrome下面进行了测试开发。

9 开源许可证
-----------
[MIT License](http://www.opensource.org/licenses/MIT)    
你可以随意使用此项目，无需通知我，因为我可能很忙没时间。   
