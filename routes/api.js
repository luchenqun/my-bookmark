var api = require('express').Router();
var mysql = require('mysql');
var crypto = require('crypto');
var http = require('http');
var https = require('https');
var cheerio = require('cheerio');
var request = require('request');
var iconv = require('iconv-lite');
var db = require('../database/db.js');

api.post('/getTitle', function(req, response) {
    var params = req.body.params;
    var url = params.url;

    var options = {
        url: url,
        encoding: null,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36'
        }
    }
    request(options, function(err, res, body) {
        var title = '';
        if (!err && response.statusCode == 200) {
            var charset = "utf-8";
            var arr = body.toString().match(/<meta([^>]*?)>/g);
            if (arr) {
                arr.forEach(function(val) {
                    var match = val.match(/charset\s*=\s*(.+)\"/);
                    if (match && match[1]) {
                        if (match[1].substr(0, 1) == '"') match[1] = match[1].substr(1);
                        charset = match[1].trim();
                        return false;
                    }
                })
            }
            var html = iconv.decode(body, charset);
            var $ = cheerio.load(html, {
                decodeEntities: false
            });
            title = $("title").text();
        }

        console.log(title);
        response.json({
            title: title || '',
        });
    })
})

api.post('/logout', function(req, res) {
    var params = req.body.params;
    console.log('logout......', params);
    req.session.destroy();
    res.json({
        data: "logout success",
    });
});

api.post('/clickBookmark', function(req, res) {
    db.clickBookmark(req.body.params.id)
        .then((affectedRows) => res.json({}))
        .catch((err) => console.log('clickBookmark error', err));
});

api.post('/login', function(req, res) {
    var params = req.body.params;
    var username = params.username;
    var password = md5(params.password);
    db.getUser(username)
        .then((user) => {
            var ret = {
                logined: false,
                user: {},
            }
            if (user && user.password === password) {
                ret.logined = true;
                ret.user = user;
                req.session.username = ret.user.username;
                req.session.userId = ret.user.id;
            }
            res.json(ret);
            return ret.logined ? db.updateUserLastLogin(ret.user.id) : Promise.resolve(0);
        })
        .then((affectedRows) => {
            console.log('updateUserLastLogin affectedRows ', affectedRows)
        })
        .catch((err) => console.log('login error', err));
});

api.get('/autoLogin', function(req, res) {
    var ret = {
        logined: false,
        user: {},
    }
    if (req.session.username) {
        db.getUser(req.session.username)
            .then((user) => {
                if (user) {
                    ret.logined = true;
                    ret.user = user;
                }
                res.json(ret);
            })
            .catch((err) => {
                res.json(ret);
            })
    } else {
        res.json(ret);
    }
});

api.get('/bookmarks', function(req, res) {
    console.log('hello bookmarks', JSON.stringify(req.query), req.session.username);
    if (!req.session.username) {
        res.send(401);
    }
    var userId = '1';
    if (req.query.show === 'navigate') {
        db.getBookmarksNavigate(userId)
            .then((result) => {
                var data = [];
                var tag = {
                    id: result && result[0] && result[0].tag_id,
                    name: result && result[0] && result[0].tag_name,
                    click: 0,
                    bookmarks: []
                };
                result.forEach(function(bookmark) {
                    if (tag.id !== bookmark.tag_id) {
                        data.push({
                            id: tag.id,
                            name: tag.name,
                            click: tag.click,
                            bookmarks: tag.bookmarks
                        });
                        tag.id = bookmark.tag_id;
                        tag.name = bookmark.tag_name;
                        tag.click = 0;
                        tag.bookmarks = [];
                    }
                    tag.click += bookmark.click_count;
                    tag.bookmarks.push(bookmark);
                });
                if (result && result.length > 0) {
                    data.push(tag);
                }
                data.sort(function(a, b) {
                    return a.click < b.click;
                })
                res.json(data);
            })
            .catch((err) => console.log('bookmarks navigate err', err));
    } else {
        var bookmarks = [];
        var tagsBookmarks = [];

        db.getBookmarksTable(userId)
            .then((bms) => {
                bookmarks = bms;
                var bookmarkIds = []
                bookmarks.forEach((bookmark) => {
                    bookmarkIds.push(bookmark.id);
                })
                return db.getTagsBookmarks(bookmarkIds);
            })
            .then((tbs) => {
                tagsBookmarks = tbs;
                return db.getTags(userId);
            })
            .then((tags) => {
                var data = [];
                // 获取每个书签的所有分类标签
                bookmarks.forEach(function(bookmark) {
                    var tags = [];
                    tagsBookmarks.forEach(function(tb) {
                        if (tb.bookmark_id == bookmark.id) {
                            tags.forEach(function(tag) {
                                if (tb.tag_id == tag.id) {
                                    tags.push(tag)
                                }
                            })
                        }
                    });
                    bookmark.tags = tags;
                    data.push(bookmark);
                })
                res.json(data);
            })
            .catch((err) => console.log('bookmarks table or card err', err))
    }
});

api.get('/tags', function(req, res) {
    db.getTags(req.query.user_id)
        .then((tags) => res.json(tags))
        .catch((err) => console.log('tags', err));
});

api.post('/addBookmark', function(req, res) {
    console.log('hello addBookmark', JSON.stringify(req.query), JSON.stringify(req.body));
    var bookmark = req.body.params;
    var user_id = '1';
    var tags = bookmark.tags;
    db.addBookmark(user_id, params) // 插入书签
        .then((bookmark_id) => db.addTagsBookmarks(tags, bookmark_id)) // 插入分类
        .then(() => db.updateLastUseTags(user_id, tags)) // 更新最新使用的分类
        .then(() => res.json({})) // 运气不错
        .catch((err) => console.log('addBookmark err', err)); // oops!
});

api.post('/addTags', function(req, res) {
    console.log('hello addTags', JSON.stringify(req.query), JSON.stringify(req.body));
    var tagsName = req.body.params;
    var user_id = '1';
    var addTagNames = [];

    db.getTags(user_id)
        .then((tags) => {
            // 需要插入的书签是该用户在数据库不存在的书签
            addTagNames = tagsName.filter((name) => {
                for (var i = 0; i < tags.length; i++) {
                    if (tags[i].name.toLowerCase() === name.toLowerCase()) {
                        return false;
                    }
                }
                return true;
            });
            return Promise.resolve(addTagNames);
        })
        .then((newTagNames) => db.addTags(user_id, newTagNames))
        .then(() => db.getTags(user_id))
        .then((tags) => res.json(tags))
        .catch((err) => console.log('addTags err', err));
});

function md5(str) {
    return crypto
        .createHash('md5')
        .update(str)
        .digest('hex');
};

module.exports = api;
