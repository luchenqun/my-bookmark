var mysql = require('mysql');
var dbConfig = {
    host: '127.0.0.1',
    user: 'test', // mysql的账号
    password: '123456', // mysql 的密码
    database: 'mybookmarks',
    multipleStatements: true,
    port: 3306
};
var client = {}

function handleDisconnect() {
    client = mysql.createConnection(dbConfig);

    client.connect(function(err) {
        if (err) {
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000);
        }
    });

    client.on('error', function(err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

handleDisconnect();

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
// var sql = "SELECT * FROM `users` WHERE `username` = 'luchenqun1'";
// client.query(sql, (err, result) => {
//     if (err) {
//         console.log(err);
//     } else {
//         console.log(result);
//     }
// });

db.addBookmark = function(user_id, bookmark) {
    var insertSql = "INSERT INTO `bookmarks` (`user_id`, `title`, `description`, `url`, `public`, `click_count`) VALUES ('" + user_id + "', '" + bookmark.title + "', " + client.escape(bookmark.description) + ", '" + bookmark.url + "', '" + bookmark.public + "', '1')";
    var selectSql = "SELECT * FROM `bookmarks` WHERE `user_id` = '" + user_id + "' AND `url` = '" + bookmark.url + "'"
    return new Promise(function(resolve, reject) {
        client.query(selectSql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                if (result.length >= 1) {
                    resolve(result[0].id);
                } else {
                    client.query(insertSql, (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result.insertId);
                        }
                    });
                }
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
    var sql = "UPDATE `bookmarks` SET `title`='" + bookmark.title + "', `description`=" + client.escape(bookmark.description) + ", `url`='" + bookmark.url + "', `public`='" + bookmark.public + "' WHERE (`id`='" + bookmark.id + "')";
    console.log("sql updateBookmark = " + sql);
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

db.getBookmark = function(id) {
    var sql = "SELECT * FROM `bookmarks` WHERE `id` = '" + id + "'";
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
    var tags_name = ["常用", "未分类"];

    db.addTags(userId, tags_name)
        .then((insertId) => {
            var bookmarks = [{
                title: "谷歌",
                description: "要翻墙的搜索网站",
                url: "https://www.google.com.hk/",
                public: "1"
            }, {
                title: "百度",
                description: "A:百度一下你会死啊？B:会！",
                url: "https://www.baidu.com/",
                public: "1"
            }, {
                title: "微博",
                description: "随时随地发现新鲜事",
                url: "http://weibo.com/",
                public: "1"
            }, {
                title: "天猫",
                description: "上天猫，就够了！",
                url: "https://www.tmall.com/",
                public: "1"
            }, {
                title: "优酷",
                description: "视频网站",
                url: "http://www.youku.com/",
                public: "1"
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
    console.log('getTags');
    var sql = "SELECT t.id, t.user_id, t.name, DATE_FORMAT(t.last_use, '%Y-%m-%d %H:%i:%s') as last_use, t.sort, tb.cnt FROM `tags` as t LEFT OUTER JOIN ( SELECT `tag_id`, COUNT(tag_id) as cnt FROM tags_bookmarks GROUP BY tag_id ) tb ON t.id = tb.tag_id WHERE t.user_id = '" + user_id + "' ORDER BY t.sort, t.last_use DESC";

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

db.updateTag = function(tag) {
    console.log('updateTag');
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
    var sql = "SELECT mod(CEIL(RAND()*100), 5) as head_id, a.id, a.user_id, u.username, a.comment, a.category, DATE_FORMAT(a.created_at, '%Y-%m-%d %H:%i:%s') as created_at, a.state  FROM `advices` as a LEFT OUTER JOIN users as u ON a.user_id = u.id ORDER BY a.created_at DESC LIMIT 0, 100";
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
    var sql = "INSERT INTO `tags` (`user_id`, `name`) VALUES";
    tags_name.forEach((name, i) => {
        if (i >= 1) {
            sql += ','
        }
        sql += "('" + user_id + "', '" + name + "')";
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
        sql += "(SELECT * FROM ((SELECT t.id AS tag_id, t.`name` as tag_name, b.* FROM `tags` as t, `bookmarks`as b, `tags_bookmarks` as tb WHERE t.id = tb.tag_id AND b.id = tb.bookmark_id AND t.id = " + tag.id + " ORDER BY b.click_count DESC LIMIT 0, 16) UNION (SELECT t.id AS tag_id, t.`name` as tag_name, b.* FROM `tags` as t, `bookmarks`as b, `tags_bookmarks` as tb WHERE t.id = tb.tag_id AND b.id = tb.bookmark_id AND t.id = " + tag.id + " ORDER BY b.created_at DESC LIMIT 0, 16)) as " + t + " ORDER BY " + t + ".click_count DESC, " + t + ".created_at DESC)";
    })
    console.log(sql);

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

db.getBookmarksTable = function(params) {
    var user_id = params.userId;
    params.currentPage = params.currentPage || 1;
    params.perPageItems = params.perPageItems || 20;

    var sql = "SELECT id, user_id, title, description, url, public, click_count, DATE_FORMAT(created_at, ";
    if (params.showStyle == 'card') {
        sql += "'%Y-%m-%d %H:%i:%s'";
    } else {
        sql += "'%Y-%m-%d'";
    }
    sql += ") as created_at,  DATE_FORMAT(last_click, '%Y-%m-%d') as last_click FROM `bookmarks` WHERE 1=1";
    if (user_id) {
        sql += " AND `user_id` = '" + user_id + "'";
        if (params.showStyle == 'card') {
            sql += " ORDER BY bookmarks.created_at DESC";
        } else {
            sql += " ORDER BY click_count DESC";
        }
    }
    console.log(sql);
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                sql += " LIMIT " + (params.currentPage - 1) * params.perPageItems + ", " + params.perPageItems;
                var totalItems = result.length;
                console.log(totalItems, sql);
                client.query(sql, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        var bookmarksData = {
                            totalItems: totalItems,
                            bookmarks: result,
                        }
                        resolve(bookmarksData);
                    }
                });
            }
        });
    })
}

db.getBookmarksByTag = function(params) {
    var tag_id = params.tagId;
    params.currentPage = params.currentPage || 1;
    params.perPageItems = params.perPageItems || 20;

    var sql = "SELECT bookmarks.id, bookmarks.user_id, bookmarks.title, bookmarks.description, bookmarks.url, bookmarks.public, bookmarks.click_count, DATE_FORMAT(bookmarks.created_at, '%Y-%m-%d') as created_at,  DATE_FORMAT(bookmarks.last_click, '%Y-%m-%d') as last_click FROM `tags_bookmarks`, `bookmarks` WHERE tags_bookmarks.tag_id = '" + tag_id + "' AND tags_bookmarks.bookmark_id = bookmarks.id ORDER BY bookmarks.click_count DESC";

    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                sql += " LIMIT " + (params.currentPage - 1) * params.perPageItems + ", " + params.perPageItems;
                var totalItems = result.length;
                console.log(totalItems, sql);
                client.query(sql, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        var bookmarksData = {
                            totalItems: totalItems,
                            bookmarks: result,
                        }
                        resolve(bookmarksData);
                    }
                });
            }
        });
    })
}

db.getBookmarksSearch = function(params) {
    params.currentPage = params.currentPage || 1;
    params.perPageItems = params.perPageItems || 20;
    var sql = "SELECT id, user_id, title, description, url, public, click_count, DATE_FORMAT(created_at, '%Y-%m-%d') as created_at,  DATE_FORMAT(last_click, '%Y-%m-%d') as last_click FROM `bookmarks` WHERE 1=1";

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
    } else {
        if (params.username) {
            sql += " AND `user_id` IN (SELECT `id` FROM `users` WHERE `username` LIKE '%" + params.username + "%' )"
        }
    }

    params.currentPage = params.currentPage || 1;
    params.perPageItems = params.perPageItems || 20;
    sql += " GROUP BY url ORDER BY click_count DESC, created_at DESC";
    console.log(sql);
    return new Promise(function(resolve, reject) {
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {

                sql += " LIMIT " + (params.currentPage - 1) * params.perPageItems + ", " + params.perPageItems;
                var totalItems = result.length;
                client.query(sql, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        var searchData = {
                            totalItems: totalItems,
                            bookmarks: result,
                        }
                        resolve(searchData);
                    }
                });
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
    var sql = "SELECT id, url, snap_state FROM `bookmarks` WHERE `snap_state`>=0 AND `snap_state` <= 64  AND snap_state != " + todayNotSnap + " ORDER BY created_at DESC LIMIT 0, 1";
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

module.exports = db;
