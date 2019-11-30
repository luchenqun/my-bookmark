var mysql = require('mysql');
var dbConfig = null;
try {
    dbConfig = require('../config.js').dbConfig;
} catch (error) {
    dbConfig = require('../config.default.js').dbConfig;
}

var client = mysql.createConnection(dbConfig);

Date.prototype.format = function(fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

// select 最多返回一行的话，返回对象，否则返回数组
// insert 返回关键字
// update delete 返回影响的行数
var db = {

}

// 每隔10秒查询一下，出现问题直接挂掉nodejs,让forever将其重启！
setInterval(function() {
    var sql = "SELECT * FROM `users` WHERE `id` = '1'";
    client.query(sql, (err, result) => {
        if (err) {
            var date = new Date().format('yyyy-MM-dd hh:mm:ss');
            console.log(date + " :数据查询出问题了，直接挂掉程序，让forever重启应用，错误信息：" + JSON.stringify(err));
            throw new Error("");
        }
    });
}, 60000);


db.getBookmarkbyUrl = function(user_id, url) {
    var sql = "SELECT * FROM `bookmarks` WHERE `user_id` = '" + user_id + "' AND `url` = '" + url + "'"
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                if (result.length >= 1) {
                    resolve(result[0].id);
                } else {
                    resolve(null);
                }
            }
        });
    });
};

db.addBookmark = function(user_id, bookmark) {
    var sql = "INSERT INTO `bookmarks` (`user_id`, `title`, `description`, `url`, `public`, `click_count`) VALUES ('" + user_id + "', " + client.escape(bookmark.title) + ", " + client.escape(bookmark.description) + ", " + client.escape(bookmark.url) + ", '" + bookmark.public + "', '1')";
    if (bookmark.created_at) {
        sql = "INSERT INTO `bookmarks` (`user_id`, `title`, `description`, `url`, `public`, `created_at`, `click_count`) VALUES ('" + user_id + "', " + client.escape(bookmark.title) + ", " + client.escape(bookmark.description) + ", " + client.escape(bookmark.url) + ", '" + bookmark.public+ "', '" + bookmark.created_at + "', '1')";
    }
    console.log(sql);
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.insertId);
            }
        });
    });
};

db.delBookmark = function(id) {
    var sql = "DELETE FROM `bookmarks` WHERE (`id`='" + id + "')";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
            }
        });
    });
}

db.updateBookmark = function(bookmark) {
    var sql = "UPDATE `bookmarks` SET `title`='" + bookmark.title + "', `description`=" + client.escape(bookmark.description) + ", `url`='" + bookmark.url + "', `public`='" + bookmark.public + "' WHERE (`id`='" + bookmark.id + "' AND `user_id`='" + bookmark.userId + "' )";
    console.log("sql updateBookmark = " + sql);
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                if(result.affectedRows === 1){
                    resolve(1);
                } else {
                    reject(new Error("bookmark not found"));
                }
            }
        });
    });
}

db.getBookmark = function(id) {
    var sql = "SELECT id, user_id, title, description, url, public, click_count, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,  DATE_FORMAT(last_click, '%Y-%m-%d %H:%i:%s') as last_click FROM `bookmarks` WHERE `id` = '" + id + "'";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result[0]);
            }
        });
    });
}

db.getBookmarkTags = function(bookmard_id) {
    var sql = "SELECT tag_id FROM `tags_bookmarks` WHERE `bookmark_id` = '" + bookmard_id + "'";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                var tags = result.map((item) => item.tag_id);
                resolve(tags);
            }
        });
    });
}

db.getBookmarkTagsNames = function(bookmard_id) {
    var sql = "SELECT tags_bookmarks.tag_id as id,  tags.name FROM tags_bookmarks LEFT JOIN tags ON  tags.id = tags_bookmarks.tag_id WHERE bookmark_id = '" + bookmard_id + "'";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

db.delBookmarkTags = function(bookmard_id) {
    var sql = "DELETE FROM `tags_bookmarks` WHERE (`bookmark_id`='" + bookmard_id + "')";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
            }
        });
    });
}

db.getBookmarkIdsByTagId = function(tagId) {
    var sql = "SELECT bookmark_id FROM `tags_bookmarks` WHERE `tag_id` = '" + tagId + "'";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

db.delTag = function(tagId) {
    var sql = "DELETE FROM `tags` WHERE (`id`='" + tagId + "')";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
            }
        });
    });
}

db.delTagBookmarks = function(tagId) {
    var sql = "DELETE FROM `tags_bookmarks` WHERE (`tag_id`='" + tagId + "')";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
            }
        });
    });
}

db.delBookmarks = function(bookmarkIds) {
    var sql = "DELETE FROM `bookmarks` WHERE id IN (" + (bookmarkIds.toString() || ("-1")) + ")";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
            }
        });
    });
}

db.delTagsBookmarks = function(bookmarkIds) {
    var sql = "DELETE FROM `tags_bookmarks` WHERE bookmark_id IN (" + (bookmarkIds.toString() || ("-1")) + ")";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
            }
        });
    });
}

db.addTagsBookmarks = function(tags, bookmard_id) {
    sql = "INSERT INTO `tags_bookmarks` (`tag_id`, `bookmark_id`) VALUES";
    for (var i = 0; i < tags.length; i++) {
        if (i >= 1) {
            sql += ','
        }
        sql += "('" + tags[i] + "', '" + bookmard_id + "')";
    }
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
            }
        });
    });
}

db.updateLastUseTags = function(user_id, tags) {
    sql = "UPDATE tags SET last_use = NOW() WHERE user_id = '" + user_id + "' AND id in (" + tags.toString() + ")";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
            }
        });
    });
}

db.clickBookmark = function(id, user_id) {
    var sql = "UPDATE `bookmarks` SET `click_count`=`click_count`+1, `last_click`=now() WHERE (`id`='" + id + "') AND (`user_id`='" + user_id + "')";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
            }
        });
    });
};

db.updateUserLastLogin = function(id) {
    console.log('updateUserLastLogin');
    var sql = "UPDATE `users` SET `last_login`=now() WHERE (`id`='" + id + "')";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
            }
        });
    });
};

db.resetPassword = function(userId, password) {
    console.log('updateUserLastLogin');
    var sql = "UPDATE `users` SET `password` = '" + password + "' WHERE(`id` = '" + userId + "')";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
            }
        });
    });
}

db.updateShowStyle = function(userId, show_style) {
    console.log('updateUserLastLogin');
    var sql = "UPDATE `users` SET `show_style` = '" + show_style + "' WHERE(`id` = '" + userId + "')";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
            }
        });
    });
}

db.updateSearchHistory = function(userId, search_history) {
    var sql = "UPDATE `users` SET `search_history`=" + client.escape(search_history) + " WHERE (`id`='" + userId + "')";
    console.log('updateSearchHistory', sql);
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
            }
        });
    });
};

db.updateQuickUrl = function(userId, quick_url) {
    var sql = "UPDATE `users` SET `quick_url`=" + client.escape(quick_url) + " WHERE (`id`='" + userId + "')";
    console.log('updateQuickUrl', sql);
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
            }
        });
    });
};

db.register = function(user) {
    console.log('register');
    var sql = "INSERT INTO `users` (`username`, `password`, `email`) VALUES ('" + user.username + "', '" + user.password + "', '" + user.email + "')";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
                db.insertDefaultBookmarks(result.insertId);
            }
        });
    });
};

db.insertDefaultBookmarks = function(userId) {
    var tags_name = ["常用", "未分类", "收藏"];

    db.addTags(userId, tags_name)
        .then((insertId) => {
            var bookmarks = [{
                title: "谷歌",
                description: "要翻墙的搜索网站",
                url: "https://www.google.com.hk/",
                public: "0"
            }, {
                title: "百度",
                description: "A:百度一下你会死啊？B:会！",
                url: "https://www.baidu.com/",
                public: "0"
            }, {
                title: "微博",
                description: "随时随地发现新鲜事",
                url: "http://weibo.com/",
                public: "0"
            }, {
                title: "天猫",
                description: "上天猫，就够了！",
                url: "https://www.tmall.com/",
                public: "0"
            }, {
                title: "优酷",
                description: "视频网站",
                url: "http://www.youku.com/",
                public: "0"
            }];

            var tags = [insertId];
            bookmarks.forEach((bookmark) => {
                db.addBookmark(userId, bookmark)
                    .then((insertId) => db.addTagsBookmarks(tags, insertId))
                    .catch((err) => console.log('insertDefaultBookmarks err2', err)); // oops!
            })
        })
        .catch((err) => console.log('insertDefaultBookmarks err1', err)); // oops!
}

db.getUser = function(username) {
    console.log('getUser');
    var sql = "SELECT * FROM `users` WHERE `username` = '" + username + "'";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result[0]);
            }
        });
    });
};

db.getTags = function(user_id) {
    var sql = "SELECT t.id, t.user_id, t.name, DATE_FORMAT(t.last_use, '%Y-%m-%d %H:%i:%s') as last_use, t.sort, t.show, tb.cnt, tg.ncnt FROM `tags` as t LEFT OUTER JOIN ( SELECT `tag_id`, COUNT(tag_id) as cnt FROM tags_bookmarks GROUP BY tag_id ) tb ON t.id = tb.tag_id  LEFT OUTER JOIN ( SELECT `tag_id`, COUNT(tag_id) as ncnt FROM notes GROUP BY tag_id ) tg ON t.id = tg.tag_id ";
    if (user_id) {
        sql += "WHERE t.user_id = '" + user_id + "' ";
    }
    sql += "ORDER BY t.sort, t.last_use DESC";
    console.log('getTags sql = ', sql);
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

db.updateTagName = function(tag) {
    console.log('updateTagName');
    var sql = "UPDATE `tags` SET `name`='" + tag.name + "' WHERE (`id`='" + tag.id + "')";
    console.log(sql);
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
            }
        });
    });
};

db.updateTagShow = function(tag) {
    console.log('updateTagShow');
    var sql = "UPDATE `tags` SET `show`='" + tag.show + "' WHERE (`id`='" + tag.id + "')";
    console.log(sql);
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
            }
        });
    });
};

db.updateTagsIndex = function(tagsIndex) {
    console.log('updateTagsIndex');
    var sql = "UPDATE tags SET sort =  CASE id ";
    tagsIndex.forEach((tagIndex) => {
        sql += "WHEN " + tagIndex.id + " THEN " + tagIndex.index + " ";
    })
    var tagsId = tagsIndex.map((item) => item.id);
    sql += "END WHERE id IN (" + tagsId.toString() + ")";

    console.log(sql);
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
            }
        });
    });
};

db.getTagsByIds = function(tagIds) {
    var sql = "SELECT * FROM `tags` WHERE id in(" + (tagIds.toString() || ("-1")) + ") GROUP BY id"; // 如果是空的，那查一个不存在的就行了。
    console.log('db getTagsByIds = ', sql);

    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

db.getAdvices = function(params) {
    console.log('getAdvices');
    var sql = "SELECT a.id, a.user_id, u.username, a.comment, a.category, DATE_FORMAT(a.created_at, '%Y-%m-%d %H:%i:%s') as created_at, a.state  FROM `advices` as a LEFT OUTER JOIN users as u ON a.user_id = u.id ORDER BY a.created_at DESC LIMIT 0, 100";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

db.addAdvice = function(params) {
    console.log('addAdvice');
    var sql = "INSERT INTO `advices` (`user_id`, `comment`, `category`) VALUES ('" + params.user_id + "', '" + params.comment + "', '" + params.category + "')";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
            }
        });
    });
};

db.getTagsByNames = function(user_id, tags_name) {
    console.log('getTagsByNames');
    var sql = "SELECT * FROM `tags` WHERE `user_id` = '" + user_id + "' AND `name` in (" + tags_name.toString() + ")";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

db.addTags = function(user_id, tags_name) {
    console.log('addTags', tags_name);
    var sql = "INSERT INTO `tags` (`user_id`, `name`, `sort`) VALUES";
    tags_name.forEach((name, i) => {
        if (i >= 1) {
            sql += ','
        }
        sql += "('" + user_id + "', '" + name + "', '88')"; // sort默认一个比较大的值，默认在后面
    });
    return new Promise(function(resolve, reject) {
        if (tags_name.length == 0) {
            reject("tags_name is empty");
        } else {
            client.query(sql, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.insertId);
                }
            });
        }
    });
};

db.getBookmarksNavigate = function(tags) {
    // console.log('getBookmarksNavigate');
    // var sql = "SELECT t.id as tag_id, t.name as tag_name, b.* FROM `tags` as t LEFT OUTER JOIN tags_bookmarks as tb ON t.id = tb.tag_id LEFT OUTER JOIN bookmarks as b ON tb.bookmark_id = b.id WHERE t.user_id='" + user_id + "' ORDER BY t.id ASC, b.click_count DESC";
    var sql = "";
    tags.forEach((tag, index) => {
        var t = 't' + tag.id;
        if (index >= 1) {
            sql += " UNION "
        }
        sql += "(SELECT * FROM ((SELECT t.id AS tag_id, t.`name` as tag_name, t.sort, b.* FROM `tags` as t, `bookmarks`as b, `tags_bookmarks` as tb WHERE t.id = tb.tag_id AND b.id = tb.bookmark_id AND t.id = " + tag.id + " ORDER BY b.click_count DESC LIMIT 0, 16) UNION (SELECT t.id AS tag_id, t.`name` as tag_name, t.sort, b.* FROM `tags` as t, `bookmarks`as b, `tags_bookmarks` as tb WHERE t.id = tb.tag_id AND b.id = tb.bookmark_id AND t.id = " + tag.id + " ORDER BY b.created_at DESC LIMIT 0, 16)) as " + t + " ORDER BY " + t + ".click_count DESC, " + t + ".created_at DESC)";
    })
    // console.log('getBookmarksNavigate ', sql);

    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

db.getBookmarksCostomTag = function(user_id, perPageItems) {
    console.log('getBookmarksCostomTag', user_id, perPageItems);
    perPageItems = perPageItems || 50;
    var sql1 = "(SELECT id, user_id, title, description, url, public, click_count, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,  DATE_FORMAT(last_click, '%Y-%m-%d %H:%i:%s') as last_click FROM `bookmarks` WHERE `user_id` = '" + user_id + "' ORDER BY `click_count` DESC LIMIT 0, " + perPageItems + ")";
    var sql2 = "(SELECT id, user_id, title, description, url, public, click_count, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,  DATE_FORMAT(last_click, '%Y-%m-%d %H:%i:%s') as last_click FROM `bookmarks` WHERE `user_id` = '" + user_id + "' ORDER BY `created_at` DESC LIMIT 0, " + perPageItems + ")";
    var sql3 = "(SELECT id, user_id, title, description, url, public, click_count, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,  DATE_FORMAT(last_click, '%Y-%m-%d %H:%i:%s') as last_click FROM `bookmarks` WHERE `user_id` = '" + user_id + "' ORDER BY `last_click` DESC LIMIT 0, " + perPageItems + ")";

    var sql = sql1 + " UNION " + sql2 + " UNION " + sql3;
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                var bookmarks = [];
                var begin = 0;
                var end = perPageItems;

                result.sort((a, b) => {
                        var click1 = parseInt(a.click_count);
                        var click2 = parseInt(b.click_count);
                        if (click1 > click2) {
                            return -1;
                        } else if (click1 == click2) {
                            return a.created_at >= b.created_at ? -1 : 1;
                        } else {
                            return 1;
                        }
                    })
                    .slice(begin, end)
                    .forEach((b) => {
                        var bookmark = JSON.parse(JSON.stringify(b)); // 执行深度复制
                        bookmark.type = 1;
                        bookmarks.push(bookmark);
                    })

                result.sort((a, b) => a.created_at >= b.created_at ? -1 : 1)
                    .slice(begin, end)
                    .forEach((b) => {
                        var bookmark = JSON.parse(JSON.stringify(b)); // 执行深度复制
                        bookmark.type = 2;
                        bookmarks.push(bookmark);
                    })

                result.sort((a, b) => a.last_click >= b.last_click ? -1 : 1)
                    .slice(begin, end)
                    .forEach((b) => {
                        var bookmark = JSON.parse(JSON.stringify(b)); // 执行深度复制
                        bookmark.type = 3;
                        bookmarks.push(bookmark);
                    })


                var bookmarksData = {
                    totalItems: result.length,
                    bookmarks: bookmarks,
                }
                resolve(bookmarksData);
            }
        });
    });
};

db.getBookmarksCostomAllUsersTag = function(user_id, perPageItems) {
    console.log('getBookmarksCostomAllUsersTag', user_id, perPageItems);
    perPageItems = perPageItems || 50;
    var sql1 = "(SELECT id, user_id, title, description, url, public, click_count, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,  DATE_FORMAT(last_click, '%Y-%m-%d %H:%i:%s') as last_click FROM `bookmarks` WHERE `user_id` != '" + user_id + "' AND public != 0 AND user_id != 120 ORDER BY `click_count` DESC LIMIT 0, " + perPageItems + ")";
    var sql2 = "(SELECT id, user_id, title, description, url, public, click_count, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,  DATE_FORMAT(last_click, '%Y-%m-%d %H:%i:%s') as last_click FROM `bookmarks` WHERE `user_id` != '" + user_id + "' AND public != 0 AND user_id != 120 ORDER BY `created_at` DESC LIMIT 0, " + perPageItems + ")";
    var sql3 = "(SELECT id, user_id, title, description, url, public, click_count, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,  DATE_FORMAT(last_click, '%Y-%m-%d %H:%i:%s') as last_click FROM `bookmarks` WHERE `user_id` != '" + user_id + "' AND public != 0 AND user_id != 120 ORDER BY `last_click` DESC LIMIT 0, " + perPageItems + ")";

    var sql = sql1 + " UNION " + sql2 + " UNION " + sql3;
    // console.log(sql);
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                var bookmarks = [];
                var begin = 0;
                var end = perPageItems;

                result.sort((a, b) => {
                        var click1 = parseInt(a.click_count);
                        var click2 = parseInt(b.click_count);
                        if (click1 > click2) {
                            return -1;
                        } else if (click1 == click2) {
                            return a.created_at >= b.created_at ? -1 : 1;
                        } else {
                            return 1;
                        }
                    })
                    .slice(begin, end)
                    .forEach((b) => {
                        var bookmark = JSON.parse(JSON.stringify(b)); // 执行深度复制
                        bookmark.type = 1;
                        bookmarks.push(bookmark);
                    })

                result.sort((a, b) => a.created_at >= b.created_at ? -1 : 1)
                    .slice(begin, end)
                    .forEach((b) => {
                        var bookmark = JSON.parse(JSON.stringify(b)); // 执行深度复制
                        bookmark.type = 2;
                        bookmarks.push(bookmark);
                    })

                result.sort((a, b) => a.last_click >= b.last_click ? -1 : 1)
                    .slice(begin, end)
                    .forEach((b) => {
                        var bookmark = JSON.parse(JSON.stringify(b)); // 执行深度复制
                        bookmark.type = 3;
                        bookmarks.push(bookmark);
                    })


                var bookmarksData = {
                    totalItems: result.length,
                    bookmarks: bookmarks,
                }
                resolve(bookmarksData);
            }
        });
    });
};


db.getBookmarksTable = function(params) {
    var user_id = params.userId;
    params.currentPage = params.currentPage || 1;
    params.perPageItems = params.perPageItems || 20;

    var sql = "SELECT id, user_id, title, description, url, public, click_count, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,  DATE_FORMAT(last_click, '%Y-%m-%d %H:%i:%s') as last_click FROM `bookmarks` WHERE 1=1";
    if (user_id) {
        sql += " AND `user_id` = '" + user_id + "'";
    }
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                var bookmarks = [];
                var begin = (params.currentPage - 1) * params.perPageItems;
                var end = params.currentPage * params.perPageItems;

                result.sort((a, b) => {
                        var click1 = parseInt(a.click_count);
                        var click2 = parseInt(b.click_count);
                        if (click1 > click2) {
                            return -1;
                        } else if (click1 == click2) {
                            return a.created_at >= b.created_at ? -1 : 1;
                        } else {
                            return 1;
                        }
                    })
                    .slice(begin, end)
                    .forEach((b) => {
                        var bookmark = JSON.parse(JSON.stringify(b)); // 执行深度复制
                        bookmark.type = 1;
                        bookmarks.push(bookmark);
                    })

                result.sort((a, b) => a.created_at >= b.created_at ? -1 : 1)
                    .slice(begin, end)
                    .forEach((b) => {
                        var bookmark = JSON.parse(JSON.stringify(b)); // 执行深度复制
                        bookmark.type = 2;
                        bookmarks.push(bookmark);
                    })

                result.sort((a, b) => a.last_click >= b.last_click ? -1 : 1)
                    .slice(begin, end)
                    .forEach((b) => {
                        var bookmark = JSON.parse(JSON.stringify(b)); // 执行深度复制
                        bookmark.type = 3;
                        bookmarks.push(bookmark);
                    })

                var bookmarksData = {
                    totalItems: result.length,
                    bookmarks: bookmarks,
                }

                resolve(bookmarksData);
            }
        });
    })
}

db.getBookmarksByTag = function(params) {
    var tag_id = params.tagId;
    params.currentPage = params.currentPage || 1;
    params.perPageItems = params.perPageItems || 20;

    var sql = "SELECT bookmarks.id, bookmarks.user_id, bookmarks.title, bookmarks.description, bookmarks.url, bookmarks.public, bookmarks.click_count, DATE_FORMAT(bookmarks.created_at, '%Y-%m-%d %H:%i:%s') as created_at,  DATE_FORMAT(bookmarks.last_click, '%Y-%m-%d %H:%i:%s') as last_click FROM `tags_bookmarks`, `bookmarks` WHERE tags_bookmarks.tag_id = '" + tag_id + "' AND tags_bookmarks.bookmark_id = bookmarks.id";

    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                var bookmarks = [];
                var begin = (params.currentPage - 1) * params.perPageItems;
                var end = params.currentPage * params.perPageItems;

                result.sort((a, b) => {
                        var click1 = parseInt(a.click_count);
                        var click2 = parseInt(b.click_count);
                        if (click1 > click2) {
                            return -1;
                        } else if (click1 == click2) {
                            return a.created_at >= b.created_at ? -1 : 1;
                        } else {
                            return 1;
                        }
                    })
                    .slice(begin, end)
                    .forEach((b) => {
                        var bookmark = JSON.parse(JSON.stringify(b)); // 执行深度复制
                        bookmark.type = 1;
                        bookmarks.push(bookmark);
                    })

                result.sort((a, b) => a.created_at >= b.created_at ? -1 : 1)
                    .slice(begin, end)
                    .forEach((b) => {
                        var bookmark = JSON.parse(JSON.stringify(b)); // 执行深度复制
                        bookmark.type = 2;
                        bookmarks.push(bookmark);
                    })

                result.sort((a, b) => a.last_click >= b.last_click ? -1 : 1)
                    .slice(begin, end)
                    .forEach((b) => {
                        var bookmark = JSON.parse(JSON.stringify(b)); // 执行深度复制
                        bookmark.type = 3;
                        bookmarks.push(bookmark);
                    })

                var bookmarksData = {
                    totalItems: result.length,
                    bookmarks: bookmarks,
                }

                resolve(bookmarksData);
            }
        });
    })
}

db.getExportBookmarksByTag = function(tag_id) {
    var sql = "SELECT tags_bookmarks.tag_id, bookmarks.title, bookmarks.url, DATE_FORMAT(bookmarks.created_at, '%Y-%m-%d %H:%i:%s') as created_at,  DATE_FORMAT(bookmarks.last_click, '%Y-%m-%d %H:%i:%s') as last_click FROM `tags_bookmarks`, `bookmarks` WHERE tags_bookmarks.tag_id = '" + tag_id + "' AND tags_bookmarks.bookmark_id = bookmarks.id ORDER BY bookmarks.click_count DESC";

    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    })
}

db.getBookmarksSearch = function(params) {
    var sql = "SELECT id, user_id, title, description, url, public, click_count, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,  DATE_FORMAT(last_click, '%Y-%m-%d %H:%i:%s') as last_click FROM `bookmarks` WHERE 1=1";

    if (params.dateCreate) {
        var d = new Date();
        d.setDate(d.getDate() - parseInt(params.dateCreate));
        sql += " AND `created_at` >= '" + d.format('yyyy-MM-dd') + "'"
    } else if (params.dateCreateBegin && params.dateCreateEnd) {
        sql += " AND `created_at` >= '" + params.dateCreateBegin + " 00:00:00" + "' AND `created_at` <= '" + params.dateCreateEnd + " 23:59:59" + "' "
    }
    if (params.dateClick) {
        var d = new Date();
        d.setDate(d.getDate() - parseInt(params.dateClick));
        sql += " AND `last_click` >= '" + d.format('yyyy-MM-dd') + "'"
    } else if (params.dateClickBegin && params.dateClickEnd) {
        sql += " AND `last_click` >= '" + params.dateClickBegin + " 00:00:00" + "' AND `last_click` <= '" + params.dateClickEnd + " 23:59:59" + "' "
    }

    if (params.searchWord) {
        sql += " AND (`title` LIKE '%" + params.searchWord + "%' OR `url` LIKE '%" + params.searchWord + "%')"
    }

    if (params.userRange == '1') {
        if (params.userId) {
            sql += " AND `user_id` = '" + params.userId + "'"
        }

        if (params.tags) {
            sql += " AND `id` IN (SELECT `bookmark_id` FROM `tags_bookmarks` WHERE tag_id IN (" + params.tags + "))"
        }
    } else if (params.userRange == '2') {
        sql += " AND `user_id` != '" + params.userId + "'"
        if (params.username) {
            sql += " AND `user_id` IN (SELECT `id` FROM `users` WHERE `username` LIKE '%" + params.username + "%' ) AND public=1 "
        }
    }

    params.currentPage = params.currentPage || 1;
    params.perPageItems = params.perPageItems || 20;
    sql += " ORDER BY click_count DESC, created_at DESC";
    console.log(sql);
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                // 如果是全站搜索，默认优先显示其他用户的
                if (params.userRange == '2') {
                    result.sort((a, b) => {
                        return params.userId == a.user_id ? 1 : -1;
                    })
                }
                // 去掉重复的
                var bookmarks = [];
                result.forEach((b1) => {
                    var find = false;
                    bookmarks.forEach((b2) => {
                        if (b1.url == b2.url) {
                            find = true;
                        }
                    })
                    if (!find) {
                        bookmarks.push(b1);
                    }
                })
                var searchData = {
                    totalItems: bookmarks.length,
                    bookmarks: bookmarks.slice((params.currentPage - 1) * params.perPageItems, params.currentPage * params.perPageItems),
                }
                resolve(searchData);
            }
        });
    })
}

db.getHotBookmarksSearch = function(params) {
    var sql = "SELECT id, title, description, url, fav_count, created_by, created_at, last_click, snap_url, favicon_url FROM `hot_bookmarks` WHERE status=0";

    if (params.dateCreate) {
        var d = new Date();
        d.setDate(d.getDate() - parseInt(params.dateCreate));
        sql += " AND `date` >= '" + d.format("yyyyMMdd") + "'"
    } else if (params.dateCreateBegin && params.dateCreateEnd) {
        var dateCreateBegin = new Date(params.dateCreateBegin).format("yyyyMMdd");
        var dateCreateEnd = new Date(params.dateCreateEnd).format("yyyyMMdd");
        sql += " AND `date` >= '" + dateCreateBegin + "' AND `date` <= '" + dateCreateEnd + "' "
    }
    if (params.dateClick) {
        var d = new Date();
        d.setDate(d.getDate() - parseInt(params.dateClick));
        sql += " AND `last_click` >= '" + d.getTime() + "'"
    } else if (params.dateClickBegin && params.dateClickEnd) {
        var dateClickBegin = new Date(params.dateClickBegin + "T00:00:00");
        var dateClickEnd = new Date(params.dateClickEnd + "T23:59:59");
        sql += " AND `last_click` >= '" + dateClickBegin.getTime() + "' AND `last_click` <= '" + dateClickEnd.getTime() + "' "
    }

    if (params.searchWord) {
        sql += " AND (`title` LIKE '%" + params.searchWord + "%')"
    }
    sql += " ORDER BY fav_count DESC";
    console.log(sql);
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                params.currentPage = params.currentPage || 1;
                params.perPageItems = params.perPageItems || 20;
                var searchData = {
                    totalItems: result.length,
                    bookmarks: result.slice((params.currentPage - 1) * params.perPageItems, params.currentPage * params.perPageItems),
                }
                resolve(searchData);
            }
        });
    })
}

db.getBookmarksCard = function(user_id) {
    return db.getBookmarksTable(user_id);
}

db.getTagsBookmarks = function(bookmark_ids) {
    var sql = "SELECT * FROM `tags_bookmarks` WHERE bookmark_id in(" + (bookmark_ids.toString() || ("-1")) + ")"; // 如果是空的，那查一个不存在的就行了。
    console.log('getTagsBookmarks', sql);

    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

db.getActiveUsers = function() {
    var sql = " (SELECT username, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at, DATE_FORMAT(last_login, '%Y-%m-%d %H:%i:%s') as last_login, email FROM users ORDER BY last_login DESC LIMIT 0, 5) UNION (SELECT username, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at, DATE_FORMAT(last_login, '%Y-%m-%d %H:%i:%s') as last_login, email FROM users ORDER BY created_at DESC LIMIT 0, 5)";
    console.log('getActiveUsers', sql);

    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}
db.getBookmarks = function() {
    var sql = "SELECT id, snap_state FROM `bookmarks`"; // 如果是空的，那查一个不存在的就行了。
    console.log('getBookmarks', sql);

    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

db.getBookmarkWaitSnap = function(today) {
    var todayNotSnap = today + 31;
    var sql = "SELECT id, url, snap_state FROM `bookmarks` WHERE `snap_state`>=0 AND `snap_state` <= 64 AND snap_state != " + todayNotSnap + " ORDER BY created_at DESC LIMIT 0, 1";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

db.getBookmarkWaitFavicon = function(today) {
    var todayNotSnap = today + 31;
    var sql = "SELECT id, url, favicon_state FROM `bookmarks` WHERE `favicon_state`>=0 AND `favicon_state` <= 64 AND favicon_state != " + todayNotSnap + " ORDER BY created_at DESC";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

db.updateBookmarkSnapState = function(id, snapState) {
    console.log("updateBookmarkSnapState id = " + id + ", snapState = " + snapState);
    var sql = "UPDATE `bookmarks` SET `snap_state`='" + snapState + "' WHERE (`id`='" + id + "')";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
            }
        });
    });
}

db.updateBookmarkFaviconState = function(id, faviconState) {
    console.log("updateBookmarkFaviconState id = " + id + ", faviconState = " + faviconState);
    var sql = "UPDATE `bookmarks` SET `favicon_state`='" + faviconState + "' WHERE (`id`='" + id + "')";
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
            }
        });
    });
}

db.addHotBookmark = function(bookmark) {
    var sql = "REPLACE INTO `hot_bookmarks` (`id`, `date`, `title`, `url`, `fav_count`, `created_by`, `created_at`, `last_click`, `snap_url`, `favicon_url`) VALUES ('" + bookmark.id + "', '" + bookmark.date + "', " + client.escape(bookmark.title) + ", " + client.escape(bookmark.url) + ", '" + bookmark.fav_count + "', " + client.escape(bookmark.created_by) + ", '" + bookmark.created_at + "', '" + bookmark.last_click + "', " + client.escape(bookmark.snap_url) + ", " + client.escape(bookmark.favicon_url) + ")";

    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.insertId);
            }
        });
    });
};

db.hotBookmarks = function(date) {
    var sql = "SELECT * FROM `hot_bookmarks` WHERE `date` = " + date + " AND `status` = 0"
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

db.addNote = function(note) {
    var sql = "INSERT INTO `notes` (`user_id`, `content`, `tag_id`) VALUES ('" + note.user_id + "', " + client.escape(note.content) + ", '" + note.tag_id + "')";
    console.log(sql);

    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.insertId);
            }
        });
    });
};

db.getNotes = function(params) {
    var sql = "SELECT notes.id, notes.content, notes.public, notes.tag_id, DATE_FORMAT(notes.created_at, '%Y-%m-%d %H:%i:%s') as created_at, tags.name as tagName FROM `notes` LEFT JOIN tags ON  tags.id = notes.tag_id  WHERE notes.user_id = '" + params.user_id + "'";

    if (params.dateCreate) {
        var d = new Date();
        d.setDate(d.getDate() - parseInt(params.dateCreate));
        sql += " AND notes.created_at >= '" + d.format("yyyyMMdd") + "'"
    }

    if (params.searchWord) {
        sql += " AND notes.content LIKE '%" + params.searchWord + "%'";
    }

    if (params.tagId) {
        sql += " AND notes.tag_id  = '" + params.tagId + "'";
    }

    if (params.tagIds) {
        sql += "AND notes.tag_id IN (" + params.tagIds.toString() + ")"
    }

    sql += " ORDER BY `created_at` DESC"
    console.log(sql);
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                params.currentPage = params.currentPage || 1;
                params.perPageItems = params.perPageItems || 20;
                var searchData = {
                    totalItems: result.length,
                    notes: result.slice((params.currentPage - 1) * params.perPageItems, params.currentPage * params.perPageItems),
                }
                resolve(searchData);
            }
        });
    })
};

db.delNote = function(id) {
    var sql = "DELETE FROM `notes` WHERE (`id`='" + id + "')";
    console.log(sql);
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
            }
        });
    });
}

db.updateNote = function(id, content, tag_id) {
    var sql = "UPDATE `notes` SET `content`=" + client.escape(content) + ", `tag_id`='" + tag_id + "' WHERE (`id`='" + id + "')";
    console.log(sql);
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
            }
        });
    });
}

db.updateNotePublic = function(id, public) {
  var sql = "UPDATE `notes` SET `public`='"+ public +"' WHERE (`id`='"+ id +"')";
  console.log(sql);
  return new Promise(function(resolve, reject) {
      client.query(sql, (err, result) => {
          if (err) {
              reject(err);
          } else {
              resolve(result.affectedRows);
          }
      });
  });
}

db.getNote = function(id) {
  var sql = "SELECT * FROM `notes` WHERE `id` = '"+ id +"' LIMIT 0, 1";
  console.log(sql);
  return new Promise(function(resolve, reject) {
      client.query(sql, (err, result) => {
          if (err) {
              reject(err);
          } else {
              if(result.length > 0) {
                  result[0].public == 1 ? resolve(result[0].content) : resolve("提示：备忘处于私密状态！");
              } else {
                  resolve("提示：备忘已删除或不存在！");
              }
          }
      });
  });
}

module.exports = db;
