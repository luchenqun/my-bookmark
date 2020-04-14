ALTER TABLE `users`
DROP COLUMN `show_style`,
MODIFY COLUMN `username`  varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL AFTER `id`,
MODIFY COLUMN `password`  varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL AFTER `username`,
MODIFY COLUMN `email`  varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL AFTER `password`,
CHANGE COLUMN `created_at` `createdAt`  datetime NULL DEFAULT CURRENT_TIMESTAMP AFTER `email`,
CHANGE COLUMN `last_login` `lastLogin`  datetime NULL DEFAULT CURRENT_TIMESTAMP AFTER `createdAt`,
CHANGE COLUMN `search_history` `searchHistory`  varchar(512) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL AFTER `lastLogin`,
CHANGE COLUMN `quick_url` `quickUrl`  varchar(2048) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '{\"B\":\"https://www.baidu.com/\",\"G\":\"https://www.google.com.hk/\",\"V\":\"https://www.v2ex.com/\",\"L\":\"http://luchenqun.com/\",\"H\":\"https://github.com/\",\"Q\":\"http://www.iqiyi.com/\",\"J\":\"https://www.jd.com/\"}' AFTER `searchHistory`,
ADD COLUMN `avatar`  varchar(512) NULL DEFAULT NULL AFTER `searchHistory`;

ALTER TABLE `advices`
DROP COLUMN `category`,
CHANGE COLUMN `user_id` `userId`  int(11) NOT NULL AFTER `id`,
CHANGE COLUMN `created_at` `createdAt`  datetime NULL DEFAULT CURRENT_TIMESTAMP AFTER `comment`;

ALTER TABLE `bookmarks`
DROP COLUMN `snap_state`,
DROP COLUMN `favicon_state`,
CHANGE COLUMN `user_id` `userId`  int(11) NOT NULL AFTER `id`,
MODIFY COLUMN `title`  varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL AFTER `userId`,
MODIFY COLUMN `url`  varchar(1024) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL AFTER `description`,
MODIFY COLUMN `public`  tinyint(4) NULL DEFAULT 0 AFTER `url`,
CHANGE COLUMN `click_count` `clickCount`  smallint(6) NULL DEFAULT 1 AFTER `public`,
CHANGE COLUMN `created_at` `createdAt`  datetime NULL DEFAULT CURRENT_TIMESTAMP AFTER `clickCount`,
CHANGE COLUMN `last_click` `lastClick`  datetime NULL DEFAULT CURRENT_TIMESTAMP AFTER `createdAt`,
ADD COLUMN `tagId`  int(11) NOT NULL AFTER `userId`;
UPDATE bookmarks AS b INNER JOIN tags_bookmarks AS tb ON b.id = tb.bookmark_id SET b.tagId = tb.tag_id;

ALTER TABLE `notes`
CHANGE COLUMN `user_id` `userId`  int(11) NOT NULL AFTER `id`,
CHANGE COLUMN `tag_id` `tagId`  int(11) NULL DEFAULT NULL AFTER `content`,
CHANGE COLUMN `created_at` `createdAt`  datetime NULL DEFAULT CURRENT_TIMESTAMP AFTER `tagId`;

ALTER TABLE `tags`
CHANGE COLUMN `user_id` `userId`  int(11) NOT NULL AFTER `id`,
CHANGE COLUMN `last_use` `lastUse`  datetime NULL DEFAULT CURRENT_TIMESTAMP AFTER `name`;

ALTER TABLE `hot_bookmarks`
DROP COLUMN `date`,
DROP COLUMN `description`,
DROP COLUMN `status`,
CHANGE COLUMN `fav_count` `clickCount`  smallint(6) NULL DEFAULT 1 AFTER `url`,
CHANGE COLUMN `created_by` `tagName`  varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL AFTER `clickCount`,
CHANGE COLUMN `snap_url` `snap`  varchar(1024) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL AFTER `last_click`,
CHANGE COLUMN `favicon_url` `icon`  varchar(1024) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL AFTER `snap`,
ADD COLUMN `createdAt`  datetime NULL AFTER `tagName`,
ADD COLUMN `lastClick`  datetime NULL AFTER `createdAt`,
MODIFY COLUMN `id`  int(11) NOT NULL AUTO_INCREMENT FIRST;
UPDATE hot_bookmarks SET createdAt = FROM_UNIXTIME(created_at/1000), lastClick = FROM_UNIXTIME(last_click/1000);
ALTER TABLE `hot_bookmarks`
DROP COLUMN `created_at`,
DROP COLUMN `last_click`;

drop table if exists tags_bookmarks;