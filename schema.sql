-- 用户信息表
drop table if exists users;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,     -- id
  `username` varchar(255) DEFAULT NULL,     -- 用户名
  `password` varchar(255) DEFAULT NULL,     -- 密码
  `email` varchar(255) DEFAULT NULL,        -- 邮箱
  `created_at` datetime DEFAULT now(),      -- 创建时间
  `last_login` datetime DEFAULT NULL,       -- 最后一次登录时间
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
);

-- 书签表
drop table if exists bookmarks;
CREATE TABLE `bookmarks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,     -- id
  `user_id` int(11) DEFAULT NULL,           -- 用户id
  `title` varchar(255) DEFAULT NULL,        -- 标题
  `description` varchar(4096) DEFAULT NULL, -- 描述
  `url` text,                               -- 链接
  `public` tinyint(4) DEFAULT '1',          -- 是否公开 1 公开，0 不公开
  `click_count` smallint DEFAULT 1,         -- 总共点击次数
  `created_at` datetime DEFAULT now(),      -- 创建时间
  `last_click` datetime DEFAULT now(),      -- 最后一次点击时间
  `snap_state` tinyint(8) DEFAULT '0',      -- -1：获取成功。0，1，2：获取快照次数。当前天+31：今天不再获取该网页快照
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
  PRIMARY KEY (`id`),
  KEY `userIdIdx` (`user_id`)
);

-- 书签与分类关联表
drop table if exists tags_bookmarks;
CREATE TABLE `tags_bookmarks` (
  `tag_id` int(11) NOT NULL,                -- 分类id
  `bookmark_id` int(11) NOT NULL,           -- 书签id
  PRIMARY KEY (`tag_id`, `bookmark_id`)
);

-- 建议留言
drop table if exists advices;
CREATE TABLE `advices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,     -- id
  `user_id` int(11) NOT NULL,               -- 用户id
  `comment` text NOT NULL,                  -- 评论
  `category` tinyint(4) DEFAULT '1',        -- 分类
  `created_at` datetime DEFAULT now(),      -- 创建时间
  `state` tinyint(4) DEFAULT '0',           -- 处理结果
  PRIMARY KEY (`id`),
  KEY `userIdIdx` (`user_id`)
);
