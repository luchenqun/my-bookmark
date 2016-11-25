var mysql = require('mysql');
var client = mysql.createConnection({
    host: '127.0.0.1'|| '172.24.13.5',
    user: 'lcq'|| 'root',
    password: 'fendoubuxi596320'|| 'root123',
    database: 'mybookmarks',
    multipleStatements: true,
    port: 3306
});

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

client.connect();

// select 最多返回一行的话，返回对象，否则返回数组
// insert 返回关键字
// update delete 返回影响的行数
var db = {

    }
    // var sql = "SELECT * FROM `users` WHERE `username` = 'luchenqun'";
    // client.query(sql, (err, result) => {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         console.log(result);
    //     }
    // });

db.addBookmark = function(user_id, bookmark) {
    var sql = "INSERT INTO `bookmarks` (`user_id`, `title`, `description`, `url`, `public`, `click_count`) VALUES ('" + user_id + "', '" + bookmark.title + "', '" + bookmark.description + "', '" + bookmark.url + "', '" + bookmark.public + "', '1')";
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
    var sql = "UPDATE `bookmarks` SET `title`='" + bookmark.title + "', `description`='" + bookmark.description + "', `url`='" + bookmark.url + "', `public`='" + bookmark.public + "' WHERE (`id`='" + bookmark.id + "')";
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

db.clickBookmark = function(id) {
    var sql = "UPDATE `bookmarks` SET `click_count`=`click_count`+1, `last_click`=now() WHERE (`id`='" + id + "')";
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
    var sql = "SELECT * FROM `tags` WHERE `user_id` = '" + user_id + "' ORDER BY last_use DESC";
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
        client.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.affectedRows);
            }
        });
    });
};

db.getBookmarksNavigate = function(user_id) {
    console.log('getBookmarksNavigate');
    var sql = "SELECT t.id as tag_id, t.name as tag_name, b.* FROM `tags` as t LEFT OUTER JOIN tags_bookmarks as tb ON t.id = tb.tag_id LEFT OUTER JOIN bookmarks as b ON tb.bookmark_id = b.id WHERE t.user_id='" + user_id + "' ORDER BY t.id ASC, b.click_count DESC";
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

    var sql = "SELECT id, user_id, title, description, url, public, click_count, DATE_FORMAT(created_at, '%Y-%m-%d') as created_at,  DATE_FORMAT(last_click, '%Y-%m-%d') as last_click FROM `bookmarks` WHERE 1=1";
    if (user_id) {
        sql += " AND `user_id` = '" + user_id + "'"
    }

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
        sql += " AND `created_at` >= '" + params.dateCreateBegin + " 00:00:00" + "' AND `created_at` <= '" + params.dateCreateEnd + " 23:59:59" +"' "
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
    sql += " ORDER BY click_count DESC, created_at DESC";
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
    console.log('getTagsBookmarks');
    var sql = "SELECT * FROM `tags_bookmarks` WHERE bookmark_id in(" + bookmark_ids.toString() + ")"
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

module.exports = db;
