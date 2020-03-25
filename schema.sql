-- 用户信息表
drop table if exists users;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,       -- id
  `username` varchar(255) NOT NULL,           -- 用户名
  `password` varchar(255) NOT NULL,           -- 密码
  `email` varchar(255) NOT NULL,              -- 邮箱
  `created_at` datetime DEFAULT now(),        -- 创建时间
  `last_login` datetime DEFAULT NULL,         -- 最后一次登录时间
  `search_history` varchar(512) DEFAULT NULL, -- 历史搜索记录
  `avatar` varchar(512) DEFAULT NULL,         -- 头像地址
  `quick_url` varchar(2048) DEFAULT '{\"B\":\"https://www.baidu.com/\",\"G\":\"https://www.google.com.hk/\",\"V\":\"https://www.v2ex.com/\",\"L\":\"http://luchenqun.com/\",\"H\":\"https://github.com/\",\"Q\":\"http://www.iqiyi.com/\",\"J\":\"https://www.jd.com/\"}',   -- 全局快捷地址
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
);

-- 书签表
drop table if exists bookmarks;
CREATE TABLE `bookmarks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,     -- id
  `user_id` int(11) NOT NULL,               -- 用户id
  `tag_id` int(11) NOT NULL,                -- 分类id (只允许一个书签对应一个分类)
  `title` varchar(255) NOT NULL,            -- 标题
  `description` varchar(4096) DEFAULT NULL, -- 描述
  `url` varchar(1024) NOT NULL,             -- 链接
  `public` tinyint(4) DEFAULT '0',          -- 是否公开 1 公开，0 不公开
  `click_count` smallint DEFAULT 1,         -- 总共点击次数
  `created_at` datetime DEFAULT now(),      -- 创建时间
  `last_click` datetime DEFAULT now(),      -- 最后一次点击时间
  PRIMARY KEY (`id`),
  KEY `userIdIdx` (`user_id`)
);

-- 书签分类表
drop table if exists tags;
CREATE TABLE `tags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,     -- id
  `user_id` int(11) NOT NULL,               -- 用户id
  `name` varchar(32) NOT NULL,              -- 标签
  `last_use` datetime DEFAULT now(),        -- 最后使用标签的时间
  `sort` tinyint(8) DEFAULT 0,             -- 书签排序
  `show` tinyint(8) DEFAULT 1,             -- 书签是否显示
  PRIMARY KEY (`id`),
  KEY `userIdIdx` (`user_id`),
  UNIQUE KEY `tag` (`user_id`,`name`)
);

-- 建议留言
drop table if exists advices;
CREATE TABLE `advices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,     -- id
  `user_id` int(11) NOT NULL,               -- 用户id
  `comment` text NOT NULL,                  -- 评论
  `created_at` datetime DEFAULT now(),      -- 创建时间
  `state` tinyint(4) DEFAULT '0',           -- 处理结果
  PRIMARY KEY (`id`),
  KEY `userIdIdx` (`user_id`)
);

-- 热门表
drop table if exists hot_bookmarks;
CREATE TABLE `hot_bookmarks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,     -- id(articleId)
  `date` int(11) NOT NULL DEFAULT 0,        -- 日期(自己添加)
  `title` varchar(255) DEFAULT NULL,        -- 标题(title)
  `description` varchar(4096) DEFAULT NULL, -- 描述(自己添加)
  `url` varchar(1024) DEFAULT NULL,         -- 链接(url)
  `fav_count` smallint DEFAULT 1,           -- 总共收藏人数(favCount)
  `created_by` varchar(64) DEFAULT NULL,    -- 创建者(sourceName)
  `created_at` bigint DEFAULT 0,            -- 创建时间(updatetime)
  `last_click` bigint DEFAULT 0,            -- 最后一次点击时间(createtime)
  `snap_url` varchar(1024) DEFAULT NULL,    -- 截图链接(imageList[0])
  `favicon_url` varchar(1024) DEFAULT NULL, -- icon链接(sourceLogo)
  `status` tinyint(4) DEFAULT '0',          -- 状态
  PRIMARY KEY (`id`)
);

-- 备忘录
drop table if exists notes;
CREATE TABLE `notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,     -- id
  `user_id` int(11) NOT NULL,               -- 用户id
  `content` text NOT NULL,                  -- 备忘内容
  `tag_id` int(11) NOT NULL,                -- 分类id
  `created_at` datetime DEFAULT now(),      -- 创建时间
  `public` tinyint(4) DEFAULT '0',          -- 是否公开 1 公开，0 不公开
  PRIMARY KEY (`id`)
);
