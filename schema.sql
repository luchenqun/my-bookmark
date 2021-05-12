CREATE DATABASE IF NOT EXISTS mybookmarks DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci; -- 创建mybookmarks数据库
USE mybookmarks;

-- 用户信息表
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,       -- id
  `username` varchar(255) NOT NULL,           -- 用户名
  `password` varchar(255) NOT NULL,           -- 密码
  `email` varchar(255) NOT NULL,              -- 邮箱
  `createdAt` datetime DEFAULT now(),         -- 创建时间
  `lastLogin` datetime DEFAULT now(),         -- 最后一次登录时间
  `searchHistory` varchar(512) DEFAULT NULL,  -- 历史搜索记录
  `avatar` varchar(512) DEFAULT NULL,         -- 头像地址
  `quickUrl` varchar(2048) DEFAULT '{\"B\":\"https://www.baidu.com/\",\"G\":\"https://www.google.com.hk/\",\"H\":\"https://github.com/\"}',   -- 全局快捷地址
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
);

-- 书签表
CREATE TABLE IF NOT EXISTS `bookmarks` (
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
CREATE TABLE IF NOT EXISTS `tags` (
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
CREATE TABLE IF NOT EXISTS `advices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,    -- id
  `userId` int(11) NOT NULL,               -- 用户id
  `comment` text NOT NULL,                 -- 评论
  `createdAt` datetime DEFAULT now(),      -- 创建时间
  `state` tinyint(4) DEFAULT '0',          -- 处理结果
  PRIMARY KEY (`id`),
  KEY `userIdIdx` (`userId`)
);

-- 热门表
CREATE TABLE IF NOT EXISTS `hot_bookmarks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,     -- id(articleId)
  `title` varchar(255) DEFAULT NULL,        -- 标题(title)
  `url` varchar(1024) DEFAULT NULL,         -- 链接(url)
  `clickCount` smallint DEFAULT 1,          -- 总共点击次数(总共收藏人数)
  `tagName` varchar(32) DEFAULT NULL,       -- 标签(创建者)
  `createdAt` datetime DEFAULT now(),       -- 创建时间(updatetime)
  `lastClick` datetime DEFAULT now(),       -- 最后一次点击时间(createtime)
  `snap` varchar(1024) DEFAULT NULL,        -- 截图链接(imageList[0])
  `icon` varchar(1024) DEFAULT NULL,        -- icon链接(sourceLogo)
  PRIMARY KEY (`id`)
);

-- 备忘录
CREATE TABLE IF NOT EXISTS `notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,     -- id
  `userId` int(11) NOT NULL,                -- 用户id
  `content` text NOT NULL,                  -- 备忘内容
  `tagId` int(11) NOT NULL,                 -- 分类id
  `createdAt` datetime DEFAULT now(),       -- 创建时间
  `public` tinyint(4) DEFAULT '0',          -- 是否公开 1 公开，0 不公开
  PRIMARY KEY (`id`)
);
