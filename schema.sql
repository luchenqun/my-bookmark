-- 用户信息表
drop table if exists users;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,       -- id
  `username` varchar(255) NOT NULL,           -- 用户名
  `password` varchar(255) NOT NULL,           -- 密码
  `email` varchar(255) NOT NULL,              -- 邮箱
  `created_at` datetime DEFAULT now(),        -- 创建时间
  `lastLogin` datetime DEFAULT NULL,         -- 最后一次登录时间
  `searchHistory` varchar(512) DEFAULT NULL, -- 历史搜索记录
  `avatar` varchar(512) DEFAULT NULL,         -- 头像地址
  `quickUrl` varchar(2048) DEFAULT '{\"B\":\"https://www.baidu.com/\",\"G\":\"https://www.google.com.hk/\",\"V\":\"https://www.v2ex.com/\",\"L\":\"http://luchenqun.com/\",\"H\":\"https://github.com/\",\"Q\":\"http://www.iqiyi.com/\",\"J\":\"https://www.jd.com/\"}',   -- 全局快捷地址
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
);
INSERT INTO `mybookmarks`.`users` (`id`, `username`, `password`, `email`, `created_at`, `lastLogin`, `searchHistory`, `avatar`, `quickUrl`) VALUES ('1', 'lcq', 'e10adc3949ba59abbe56e057f20f883e', 'lcq@qq.com', '2020-03-25 21:19:16', NULL, NULL, NULL, '{\"B\":\"https://www.baidu.com/\",\"G\":\"https://www.google.com.hk/\",\"V\":\"https://www.v2ex.com/\",\"L\":\"http://luchenqun.com/\",\"H\":\"https://github.com/\",\"Q\":\"http://www.iqiyi.com/\",\"J\":\"https://www.jd.com/\"}');

-- 书签表
drop table if exists bookmarks;
CREATE TABLE `bookmarks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,    -- id
  `userId` int(11) NOT NULL,               -- 用户id
  `tagId` int(11) NOT NULL,                -- 分类id (只允许一个书签对应一个分类)
  `title` varchar(255) NOT NULL,           -- 标题
  `description` varchar(4096) DEFAULT NULL,-- 描述
  `url` varchar(1024) NOT NULL,            -- 链接
  `public` tinyint(4) DEFAULT '0',         -- 是否公开 1 公开，0 不公开
  `clickCount` smallint DEFAULT 1,         -- 总共点击次数
  `createdAt` datetime DEFAULT now(),      -- 创建时间
  `lastClick` datetime DEFAULT now(),      -- 最后一次点击时间
  PRIMARY KEY (`id`),
  KEY `userIdIdx` (`userId`)
);

-- 书签分类表
drop table if exists tags;
CREATE TABLE `tags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,    -- id
  `userId` int(11) NOT NULL,               -- 用户id
  `name` varchar(32) NOT NULL,             -- 标签
  `lastUse` datetime DEFAULT now(),        -- 最后使用标签的时间
  `sort` tinyint(8) DEFAULT 0,             -- 书签排序
  `show` tinyint(8) DEFAULT 1,             -- 书签是否显示
  PRIMARY KEY (`id`),
  KEY `userIdIdx` (`userId`),
  UNIQUE KEY `tag` (`userId`,`name`)
);

-- 建议留言
drop table if exists advices;
CREATE TABLE `advices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,    -- id
  `userId` int(11) NOT NULL,               -- 用户id
  `comment` text NOT NULL,                 -- 评论
  `createdAt` datetime DEFAULT now(),      -- 创建时间
  `state` tinyint(4) DEFAULT '0',          -- 处理结果
  PRIMARY KEY (`id`),
  KEY `userIdIdx` (`userId`)
);

-- 热门表
drop table if exists hot_bookmarks;
CREATE TABLE `hot_bookmarks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,     -- id(articleId)
  `date` int(11) NOT NULL DEFAULT 0,        -- 日期(自己添加)
  `title` varchar(255) DEFAULT NULL,        -- 标题(title)
  `description` varchar(4096) DEFAULT NULL, -- 描述(自己添加)
  `url` varchar(1024) DEFAULT NULL,         -- 链接(url)
  `favCount` smallint DEFAULT 1,            -- 总共收藏人数(favCount)
  `createdBy` varchar(64) DEFAULT NULL,    -- 创建者(sourceName)
  `createdAt` bigint DEFAULT 0,            -- 创建时间(updatetime)
  `lastClick` bigint DEFAULT 0,             -- 最后一次点击时间(createtime)
  `snapUrl` varchar(1024) DEFAULT NULL,     -- 截图链接(imageList[0])
  `faviconUrl` varchar(1024) DEFAULT NULL,  -- icon链接(sourceLogo)
  `status` tinyint(4) DEFAULT '0',          -- 状态
  PRIMARY KEY (`id`)
);

-- 备忘录
drop table if exists notes;
CREATE TABLE `notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,     -- id
  `userId` int(11) NOT NULL,               -- 用户id
  `content` text NOT NULL,                  -- 备忘内容
  `tagId` int(11) NOT NULL,                -- 分类id
  `createdAt` datetime DEFAULT now(),      -- 创建时间
  `public` tinyint(4) DEFAULT '0',          -- 是否公开 1 公开，0 不公开
  PRIMARY KEY (`id`)
);
