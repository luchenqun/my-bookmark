var api = require('express').Router();
var mysql = require('mysql');
var crypto = require('crypto');
var read = require('node-readability');
var db = require('../database/db.js');

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
                req.session.user = user;
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
    if (req.session.user) {
        db.getUser(req.session.user.username)
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

api.delete('/delBookmark', function(req, res) {
    if (!req.session.user) {
        res.send(401);
        return;
    }
    var bookmarkId = req.query.id;
    db.delBookmarkTags(bookmarkId)
        .then(() => db.delBookmark(bookmarkId))
        .then((affectedRows) => res.json({
            result: affectedRows
        }))
        .catch((err) => console.log('delBookmark err', err));
})

api.post('/updateBookmark', function(req, res) {
    if (!req.session.user) {
        res.send(401);
        return;
    }
    var bookmark = req.body.params;
    console.log('hello updateBookmark', JSON.stringify(bookmark));
    var bookmark = req.body.params;
    var userId = req.session.user.id;
    var tags = bookmark.tags;
    db.updateBookmark(bookmark) // 更新标签信息
        .then((affectedRows) => db.delBookmarkTags(bookmark.id)) // 将之前所有的书签分类信息删掉
        .then((affectedRows) => db.addTagsBookmarks(tags, bookmark.id)) // 将新的分类关联起来
        .then(() => db.updateLastUseTags(userId, tags)) // 更新最近使用的分类(这个有待考虑)
        .then(() => res.json({})) // 运气不错
        .catch((err) => console.log('updateBookmark err', err)); // oops!
})

api.get('/bookmark', function(req, res) {
    if (!req.session.user) {
        res.send(401);
        return;
    }
    var bookmarkId = req.query.bookmarkId;
    var userId = req.session.user.id;
    var ret = {
        bookmark: {},
        bookmarkTags: [],
        tags: [],
    };

    db.getBookmark(bookmarkId)
        .then((bookmark) => {
            ret.bookmark = bookmark;
            return db.getBookmarkTags(bookmarkId);
        })
        .then((bookmarkTags) => {
            ret.bookmarkTags = bookmarkTags;
            return db.getTags(userId);
        })
        .then((tags) => {
            ret.tags = tags;
            res.json(ret);
        })
        .catch((err) => console.log('bookmark err', err));
})

api.get('/bookmarks', function(req, res) {
    console.log('hello bookmarks', JSON.stringify(req.query), req.session.username);
    if (!req.session.user) {
        res.send(401);
        return;
    }
    var userId = req.session.user.id;
    var params = req.query;
    if (params.showStyle === 'navigate') {
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
                data.sort((a, b) => a.click < b.click)
                    // console.log(JSON.stringify(data));
                res.json(data);
            })
            .catch((err) => console.log('bookmarks navigate err', err));
    } else {
        var bookmarks = [];
        var tagsBookmarks = [];
        var totalItems = 0;
        var totalItems = 0;
        var sendData = {
            totalItems: totalItems,
            bookmarks: []
        }
        params.userId = userId;
        db.getBookmarksTable(params)
            .then((bookmarksData) => {
                bookmarks = bookmarksData.bookmarks;
                totalItems = bookmarksData.totalItems;
                var bookmarkIds = bookmarks.map((bookmark) => bookmark.id);
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
                    var bookmarkTags = [];
                    tagsBookmarks.forEach(function(tb) {
                        if (tb.bookmark_id == bookmark.id) {
                            tags.forEach(function(tag) {
                                if (tb.tag_id == tag.id) {
                                    bookmarkTags.push(tag)
                                }
                            })
                        }
                    });
                    bookmark.tags = bookmarkTags;
                    data.push(bookmark);
                })
                sendData.totalItems = totalItems;
                sendData.bookmarks = data;
                res.json(sendData);
            })
            .catch((err) => console.log('bookmarks table or card err', err))
    }
});

api.get('/searchBookmarks', function(req, res) {
    console.log('hello searchBookmarks', JSON.stringify(req.query), req.session.username);
    if (!req.session.user) {
        res.send(401);
        return;
    }
    var params = req.query;
    params.userId = req.session.user.id;
    var bookmarks = [];
    var tagsBookmarks = [];
    var userId = '1';
    var totalItems = 0;
    var sendData = {
        totalItems: totalItems,
        bookmarks: []
    }
    db.getBookmarksSearch(params)
        .then((searchData) => {
            totalItems = searchData.totalItems;
            bookmarks = searchData.bookmarks;
            if (bookmarks.length > 0) {
                var bookmarkIds = bookmarks.map((bookmark) => bookmark.id);
                return db.getTagsBookmarks(bookmarkIds);
            } else {
                res.json(sendData);
                return Promise.reject('没有搜到到任何书签');
            }
        })
        .then((tbs) => {
            tagsBookmarks = tbs;
            return db.getTags(userId);
        })
        .then((tags) => {
            var data = [];
            // 获取每个书签的所有分类标签
            bookmarks.forEach(function(bookmark) {
                var bookmarkTags = [];
                tagsBookmarks.forEach(function(tb) {
                    if (tb.bookmark_id == bookmark.id) {
                        tags.forEach(function(tag) {
                            if (tb.tag_id == tag.id) {
                                bookmarkTags.push(tag)
                            }
                        })
                    }
                });
                bookmark.tags = bookmarkTags;
                data.push(bookmark);
            })
            sendData.totalItems = totalItems;
            sendData.bookmarks = data;
            res.json(sendData);
        })
        .catch((err) => console.log('bookmarks table or card err', err))
});

api.get('/tags', function(req, res) {
    if (!req.session.user) {
        res.send(401);
        return;
    }
    db.getTags(req.session.user.id)
        .then((tags) => res.json(tags))
        .catch((err) => console.log('tags', err));
});

api.post('/addBookmark', function(req, res) {
    console.log('hello addBookmark', JSON.stringify(req.body));
    if (!req.session.user) {
        res.send(401);
        return;
    }
    var bookmark = req.body.params;
    var userId = req.session.user.id;
    var tags = bookmark.tags;
    db.addBookmark(userId, bookmark) // 插入书签
        .then((bookmark_id) => db.addTagsBookmarks(tags, bookmark_id)) // 插入分类
        .then(() => db.updateLastUseTags(userId, tags)) // 更新最新使用的分类
        .then(() => res.json({})) // 运气不错
        .catch((err) => console.log('addBookmark err', err)); // oops!
});

api.post('/addTags', function(req, res) {
    console.log('hello addTags', JSON.stringify(req.query), JSON.stringify(req.body));
    if (!req.session.user) {
        res.send(401);
        return;
    }
    var tagsName = req.body.params;
    var userId = req.session.user.id;
    var addTagNames = [];

    db.getTags(userId)
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
        .then((newTagNames) => db.addTags(userId, newTagNames))
        .then(() => db.getTags(userId))
        .then((tags) => res.json(tags))
        .catch((err) => console.log('addTags err', err));
});

api.post('/getTitle', function(req, response) {
    var params = req.body.params;
    var url = params.url;
    read(url, function(err, article, meta) {
        console.log(article.title);
        response.json({
            title: article.title || '',
        });
        article.close();
    });
})

function md5(str) {
    return crypto
        .createHash('md5')
        .update(str)
        .digest('hex');
};

module.exports = api;
