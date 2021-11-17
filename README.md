# 在线书签管理工具
![image](https://b.lucq.fun/images/screenshot.gif)   

1 在线体验(demo)
-------------
[在线书签管理系统](http://b.lucq.fun/ "在线书签管理系统")，体验账号：test。密码：123456。

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
- [x] 在书签分类里面，可以更新分类，删除分类，新增分类，对分类显示进行排序。分类的标签默认按照添加日期展示，但是可以点击表格的标题，按照点击次数，添加日期，最后点击从大到小进行排序。
- [x] 可以按照指定添加时间段，指定分类目录，指定网址关键字等进行查询。
- [x] 添加书签的时候，会自动获取title，供用户编辑。其中：Insert键打开添加页面，再次按Insert键保存书签，Esc取消添加。   
- [x] 可以导入Chrome的书签导出文件，暂时做在设置里面。
- [x] 书签可以作为公有或者私有，公有可供所有人搜索。  
- [x] 可以将搜索到其他用户的书签转存为自己的书签。  
- [x] 可以将书签导出来，然后导入到浏览器。
- [x] 在热门标签里面，有在网上找的热门书签。
- [x] 新增备忘录功能，有时候随手要做点纪录，就方便了。任意界面按快捷键A增加备忘录。双击备忘录可查看详情！亦可分享备忘。
- [x] 在设置的全局链接，可设置快捷键，用来在任何页面，快速打开设置的链接。
- [x] 增加[Chrome插件](https://chrome.google.com/webstore/detail/%E4%B9%A6%E7%AD%BE%E5%BF%AB%E9%80%9F%E6%B7%BB%E5%8A%A0/lmmobgephofdffmaednjooplcpbgbjle)，可在任意界面快速添加书签至系统。如果你无法访问该插件，可以按照[Chrome如何安装插件（开发版本/自制）](https://jingyan.baidu.com/article/f3ad7d0f58d6b609c3345b80.html)方法安装插件，插件请到[bookmark-plugin](https://github.com/luchenqun/bookmark-plugin)下载。   
- [x] 适配手机平板，手机端请访问[mb.lucq.fun](http://mb.lucq.fun/)。   


4 主要用到的软件与模块说明
------------------
**Node.js**：`v12.13.0` 用来做后台服务。  
**MySQL**: `v5.7.23`用来做数据存储。  
**AngularJS**：`v1.5.8`前端JavaScript框架。   
**jQuery**: `v3.1.1`本来用了AngularJS是不需要再使用jQuery了的。但是有些功能AngularJS要大费周章才能完成，jQuery一句代码就能解决。所以还是忍不住将它导入了进来。    
**Semantic**：`v2.4.0`由于没有美工人员，自己开发的，不想界面太丑，用了这套UI。   

5 目录结构
---------
```   
my-bookmark/
├── development.js                # 开发环境下的入口文件
├── logs/                         # 日志目录
├── Dockerfile                    # Dockerfile 构建文件
├── nginx.conf                    # nginx 配置文件
├── package.json                  # 项目依赖包
├── pm2.json                      # pm2 配置文件
├── production.js                 # 生产环境下的入口文件
├── runtime/                      # 后台运行文件夹
├── schema.sql                    # mysql数据库建表文件
├── src/                          # 后台实现文件夹
│   ├── bootstrap/                # 启动自动执行目录 
│   │   ├── master.js             # Master 进程下自动执行
│   │   └── worker.js             # Worker 进程下自动执行
│   ├── config/                   # 后台配置文件夹
│   │   ├── adapter.js            # 后台适配器文件
│   │   ├── config.js             # 后台配置文件
│   │   ├── config.production.js  # 后台生产环境配置文件
│   │   ├── extend.js             # 后台extend配置文件
│   │   ├── middleware.js         # 后台middleware配置文件
│   │   └── router.js             # 自定义路由配置文件
│   ├── controller/               # 后台控制器文件夹
│   │   ├── api.js                # 后台api控制器实现
│   │   ├── base.js               # 后台base控制器实现
│   │   └── index.js              # 后台index控制器实现
│   ├── logic/                    # 后台逻辑文件夹
│   │   ├── api.js                # 后台逻辑api文件
│   │   └── index.js              # 后台逻辑index文件
│   └── model/                    # 后台模型文件夹
│       └── index.js              # 后台模型文件
├── test/                         # 后台测试文件夹
│   └── index.js                  # 后台测试文件
├── update.sql                    # MySQL更新文件
├── view/                         # 网站主页显示文件夹
│   ├── 404.html                  # 默认404页面
│   ├── css/                      # 样式表文件夹
│   │   ├── externe/              # 外部引入引来的css文件
│   │   └── style.css             # 自己写的css文件
│   ├── favicon.ico               # 网站favicon
│   ├── images/                   # 图片文件夹
│   ├── scripts/                  # 前端逻辑实现的JS文件以及引入的JS文件
│   │   ├── app-angular.js        # AngularJS路由配置文件
│   │   ├── controllers/          # 所有的AngularJS控制器
│   │   ├── directives/           # 所有的AngularJS指令
│   │   ├── externe/              # 外部引入的JS文件
│   │   └── services/             # 所有的AngularJS服务文件
│   ├── views/                    # 页面实现文件
│   └── index.html                # 网站主页
└── README.md                     # 项目工程说明文件
```   

6 Docker安装部署
-------------
此部署方式适合新手。

如果你的Linux环境中没有安装Docker环境。那么请先执行如下命令安装Docker环境。
```
curl -fsSL get.docker.com -o get-docker.sh
sudo sh get-docker.sh --mirror Aliyun
```

安装好docker环境之后，执行命令 `docker run -d -p 2000:2000 -p 3306:3306 luchenqun/mybookmark` 安装并启动应用即可。然后在浏览器输入： `http://你的IP:2000/` 即可访问书签应用。安装好的环境默认了一个账号`test`，密码为`123456`。

如果MySQL需要远程访问，那么你需要进入容器之后更新 `/etc/mysql/mysql.conf.d/mysqld.cnf`，将绑定地址 `127.0.0.1` 改为 `0.0.0.0`。然后执行命令`service mysql restart`重启数据库服务。安装后的 MySQL默认有两个账户，一个是root账户，无密码。一个是在文件`/etc/mysql/debian.cnf`有个账号密码。当然这些账号都是只能在本地访问的，你需要手动创建一个可供远程访问的账号。

另外，有人做了arm架构的docker，如果有需要的请按如下命令执行安装
```
docker run -itd --name mybookmark -p 2000:2000 -p 3306:3306 740162752/bookmark
```

7 安装部署指南
-------------
这种适合动手能力比较强的人员。

1、安装MySQL数据库。如果不会，请戳教程[MySQL 数据库安装教程](http://baidu.lucq.fun/?q=TXlTUUwg5pWw5o2u5bqT5a6J6KOF5pWZ56iL "mysql 数据库安装教程")。有点需要注意的是，MySQL的版本至少要是5.6。否则执行schema.sql文件会出错。   
2、新建一个数据库名，使用MySQL将根目录下面的schema.sql文件执行一遍，创建数据库表格。有个问题尤其要注意：**数据库一定要使用UTF-8的编码**，否则执行一些汉字的sql语句会出错！如果是Ubuntu，大概过程如下。
```
mysql -u root -p // 使用root账号进入mysql数据库。按回车之后输入安装时候root的密码。
CREATE DATABASE mybookmarks DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci; // 创建mybookmarks数据库。
CREATE USER 'test'@'%' IDENTIFIED BY '123456';// 创建一个以用户名为test，密码为123456的用户
GRANT ALL ON *.* TO 'test'@'%';  // 给刚创建的test用户数据库所有的权限
use mybookmarks; //选择刚创建的数据库。
source /home/lcq/schema.sql; // 执行schema.sql文件创建数据库表格。注意，将路径换为你schema.sql所在路径。   
```
3、如果你是全新部署，你可忽略此步骤。如果之前部署过此应用，那么需要执行update.sql文件需要升级。注意：升级之前，请务必备份数据库！确认是否需要运行此升级sql文件也很简单，看一下你之前的数据库mybookmarks下面有没有`tags_bookmarks`这个数据表。如果有，那么需要执行。执行方法还是如上类似`source /home/lcq/update.sql;`。  
4、安装Node.js。Node.js版本至少要求12.0以上。不会的话，请按照上面步骤1提供的方法自行解决。   
5、克隆代码`git clone git@github.com:luchenqun/my-bookmark.git`，切换到项目根目录下面，执行`npm install`安装package。   
6、在根目录，更新`pm2.json`文件，只需要更新`cwd`项即可。该项为你项目所在的路径。更新`src/config/adapter.js`下面`exports.model`关于你的MySQL的账号密码信息。注意，该账号必须要有写数据库的权限！  
7、如果上面的都做好了，执行命令`npm install pm2 -g`安装pm2模块。再执行命令`pm2 startOrReload pm2.json`。以后如果项目代码有升级，更新代码之后，执行此命令即可重启该应用。   
8、在浏览器里面输入：`http://你的IP:2000/`。  
9、如果需要域名部署的话，推荐使用nginx作为HTTP和反向代理服务器，根目录有一份`nginx.conf`文件，你只需要更新`root`项即可使用。相关知识，请自行百度。


8 其他说明
---------
1、我没有做浏览器兼容测试，只在Google Chrome下面进行了测试开发。   

9 开源许可证
-----------
[MIT License](http://www.opensource.org/licenses/MIT)    
你可以随意使用此项目，无需通知我，因为我可能很忙没时间。注意，手机版当前没开源   

