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
  `description` varchar(255) DEFAULT NULL,  -- 描述
  `url` text,                               -- 链接
  `public` tinyint(4) DEFAULT '1',          -- 是否公开 1 公开，0 不公开
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

INSERT INTO `users` (`id`, `username`, `password`, `email`) VALUES ('1', 'luchenqun', '123456', 'luchenqun@qq.com');

INSERT INTO `tags` (`user_id`, `name`) VALUES ('1', '常用');   -- 每一个注册用户，默认有个常用分类
INSERT INTO `tags` (`user_id`, `name`) VALUES ('1', '搜索');
INSERT INTO `tags` (`user_id`, `name`) VALUES ('1', '购物');
INSERT INTO `tags` (`user_id`, `name`) VALUES ('1', '音乐');
INSERT INTO `tags` (`user_id`, `name`) VALUES ('1', '问答');
INSERT INTO `tags` (`user_id`, `name`) VALUES ('1', '博客');
INSERT INTO `tags` (`user_id`, `name`) VALUES ('1', '招聘');

INSERT INTO `bookmarks` (`user_id`, `title`, `description`, `url`, `click_count`, `created_at`, `last_click`) VALUES ('1', '博客', '个人描述测试', 'http://luchenqun.com/', '888', '2016-01-26 14:52:00', '2016-02-26 14:52:00');
INSERT INTO `bookmarks` (`user_id`, `title`, `description`, `url`, `click_count`, `created_at`, `last_click`) VALUES ('1', '谷歌', '谷歌描述测试', 'https://www.google.com.hk/', '111', '2016-02-26 14:52:00', '2016-03-26 14:52:00');
INSERT INTO `bookmarks` (`user_id`, `title`, `description`, `url`, `click_count`, `created_at`, `last_click`) VALUES ('1', '百度', '百度描述测试', 'https://www.baidu.com/', '22', '2016-03-26 14:52:00', '2016-04-26 14:52:00');
INSERT INTO `bookmarks` (`user_id`, `title`, `description`, `url`, `click_count`, `created_at`, `last_click`) VALUES ('1', '拉勾', '拉勾描述测试', 'http://www.lagou.com/', '33', '2016-05-26 14:52:00', '2016-05-26 14:52:00');
INSERT INTO `bookmarks` (`user_id`, `title`, `description`, `url`, `click_count`, `created_at`, `last_click`) VALUES ('1', '喜马拉雅', '喜马拉雅描述测试', 'http://www.ximalaya.com/', '4', '2016-06-26 14:52:00', '2016-06-26 14:52:00');
INSERT INTO `bookmarks` (`user_id`, `title`, `description`, `url`, `click_count`, `created_at`, `last_click`) VALUES ('1', 'CSDN', 'CSDN描述测试', 'http://www.csdn.net/', '52', '2016-07-26 14:52:00', '2016-08-26 14:52:00');
INSERT INTO `bookmarks` (`user_id`, `title`, `description`, `url`, `click_count`, `created_at`, `last_click`) VALUES ('1', '知乎', '知乎描述测试', 'http://www.zhihu.com/', '42', '2016-08-26 14:52:00', '2016-09-26 14:52:00');
INSERT INTO `bookmarks` (`user_id`, `title`, `description`, `url`, `click_count`, `created_at`, `last_click`) VALUES ('1', '京东', '京东描述测试', 'http://www.jd.com/', '2', '2016-09-26 14:52:00', '2016-10-26 14:52:00');
INSERT INTO `bookmarks` (`user_id`, `title`, `description`, `url`, `click_count`, `created_at`, `last_click`) VALUES ('1', '天猫', '天猫描述测试', 'http://www.tmall.com/', '534', '2016-10-26 14:52:00', '2016-11-26 14:52:00');

INSERT INTO `tags_bookmarks` (`tag_id`, `bookmark_id`) VALUES ('1', '1');
INSERT INTO `tags_bookmarks` (`tag_id`, `bookmark_id`) VALUES ('1', '2');
INSERT INTO `tags_bookmarks` (`tag_id`, `bookmark_id`) VALUES ('1', '3');
INSERT INTO `tags_bookmarks` (`tag_id`, `bookmark_id`) VALUES ('2', '2');
INSERT INTO `tags_bookmarks` (`tag_id`, `bookmark_id`) VALUES ('2', '3');
INSERT INTO `tags_bookmarks` (`tag_id`, `bookmark_id`) VALUES ('3', '8');
INSERT INTO `tags_bookmarks` (`tag_id`, `bookmark_id`) VALUES ('3', '9');
INSERT INTO `tags_bookmarks` (`tag_id`, `bookmark_id`) VALUES ('4', '5');
INSERT INTO `tags_bookmarks` (`tag_id`, `bookmark_id`) VALUES ('5', '7');
INSERT INTO `tags_bookmarks` (`tag_id`, `bookmark_id`) VALUES ('6', '1');
INSERT INTO `tags_bookmarks` (`tag_id`, `bookmark_id`) VALUES ('7', '4');
