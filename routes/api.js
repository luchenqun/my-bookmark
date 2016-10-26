var api = require('express').Router();
var mysql = require('mysql');
// var client = mysql.createConnection({
//     host: '172.24.13.5',
//     user: 'root',
//     password: 'root123',
//     database: 'mybookmarks',
//     multipleStatements: true,
//     port: 3306
// });
var client = mysql.createConnection({
    host: '127.0.0.1',
    user: 'lcq',
    password: '123456',
    database: 'mybookmarks',
    multipleStatements: true,
    port: 3306
});
client.connect();

api.get('/bookmarks', function(req, res) {
    console.log('hello bookmarks', JSON.stringify(req.query));
    var sqlBookmarks = "SELECT id, user_id, title, description, url, public, click_count, DATE_FORMAT(created_at, '%Y-%m-%d') as created_at,  DATE_FORMAT(last_click, '%Y-%m-%d') as last_click FROM `bookmarks` WHERE user_id='1' ORDER BY click_count DESC, created_at DESC LIMIT 0, 50";
    var sqlTags = "SELECT id, name FROM `tags` WHERE user_id='1'";

    client.query(sqlBookmarks, function(error, data1, fields) {
        if (error) {
            res.json({
                error: "数据查询出错"
            });
        } else {
            var bookmark_ids = ''
            data1.forEach(function(bookmark) {
                bookmark_ids += "'" + bookmark.id + "',";
            })
            bookmark_ids = bookmark_ids.slice(0, bookmark_ids.length - 1);

            var sqlTagIdBookmarkId = "SELECT * FROM `tags_bookmarks` WHERE bookmark_id in(" + bookmark_ids + ")";
            client.query(sqlTagIdBookmarkId, function(error, data2, fields) {
                // console.log(data2);
                if (error) {
                    res.json({
                        error: "数据查询出错"
                    });
                } else {
                    client.query(sqlTags, function(error, data3, fields) {
                        // console.log(data3);
                        if (error) {
                            res.json({
                                error: "数据查询出错"
                            });
                        } else {
                            var data = [];
                            data1.forEach(function(bookmark) {
                                var tags = [];
                                data2.forEach(function(bookmark_tag) {
                                    if (bookmark_tag.bookmark_id == bookmark.id) {
                                        data3.forEach(function(tag) {
                                            if (bookmark_tag.tag_id == tag.id) {
                                                tags.push(tag)
                                            }
                                        })
                                    }
                                });
                                bookmark.tags = tags;
                                data.push(bookmark);
                            })
                            res.json(data);
                        }
                    });
                }
            });
        }
    });
});

api.get('/tags', function(req, res) {
    console.log('hello tags', JSON.stringify(req.query));
    var data = ['搜索', '常用', '新闻', '博文', 'JavaScript']
    res.json(data);
});
// client.end();

module.exports = api;
