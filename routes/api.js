var api = require('express').Router();
var mysql = require('mysql');
var crypto = require('crypto');
var read = require('node-readability');
var db = require('../database/db.js');
var parseHtml = require('../common/parse_html.js');
var download = require('../common/download.js');
var multer = require('multer');
var webshot = require('webshot');
var fs = require('fs');
var favicon = require('favicon');

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function(req, file, cb) {
        var now = new Date().format('yyyyMMddhhmmss')
        if (req.session.user) {
            cb(null, req.session.username + '-' + now + '.html')
        } else {
            cb(null, "UnknowUser" + '-' + now + '.html')
        }
    }
})

var upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 2014, // 最大值接受10M
    },
    fileFilter: function(req, file, cb) {
        cb(null, file.mimetype == "text/html");
    },
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
    db.clickBookmark(req.body.params.id, req.session.userId)
        .then((affectedRows) => res.json({}))
        .catch((err) => console.log('clickBookmark error', err));
});

api.post('/login', function(req, res) {
    var params = req.body.params;
    var username = params.username;
    var password = md5(params.password);
    console.log(password);
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

api.get('/userInfo', function(req, res) {
    console.log("userInfo");
    if (!req.session.user) {
        res.send(401);
        return;
    }
    var user = {};
    db.getUser(req.session.username)
        .then((_user) => {
            user = _user
            if (req.session.username == 'lcq' && req.session.userId == 1) {
                return db.getActiveUsers();
            } else {
                return Promise.resolve([]);
            }
        })
        .then((_activeUsers) => {
            user.activeUsers = _activeUsers;
            res.json(user);
        })
        .catch((err) => console.log('userInfo error', err));
});

api.post('/register', function(req, res) {
    var params = req.body.params;
    params.password = md5(params.password); // 进行密码加密

    db.register(params)
        .then((affectedRows) => {
            res.json({
                retCode: 0,
                msg: params.username + " 注册成功 ",
            })
            console.log('register affectedRows ', affectedRows)
        })
        .catch((err) => {
            console.log('login error', err);
            res.json({
                retCode: 1,
                msg: params.username + " 注册失败: " + JSON.stringify(err),
            })
        });
});

api.post('/resetPassword', function(req, res) {
    console.log("resetPassword");
    if (!req.session.user) {
        res.send(401);
        return;
    }

    var params = req.body.params;
    var passwordOrigin = md5(params.passwordOrgin); // 进行密码加密
    var passwordNew = md5(params.passwordNew); // 进行密码加密

    db.getUser(req.session.user.username)
        .then((user) => {
            if (user && user.password === passwordOrigin) {
                return db.resetPassword(req.session.userId, passwordNew)
            } else {
                return Promise.resolve(0)
            }
        })
        .then((affectedRows) => {
            res.json({
                retCode: (affectedRows == 1 ? 0 : 1),
                msg: req.session.username + " 更新密码失败，可能原密码不正确！",
            })

            if (affectedRows) {
                req.session.destroy();
            }
        })
        .catch((err) => {
            console.log('resetPassword error', err);
            res.json({
                retCode: 2,
                msg: req.session.username + " 更新密码失败: " + JSON.stringify(err),
            })
        });
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
                return ret.logined ? db.updateUserLastLogin(ret.user.id) : Promise.resolve(0);
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
        .then((insertId) => db.addTagsBookmarks(tags, bookmark.id)) // 将新的分类关联起来
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
        db.getTags(userId)
            .then((tags) => db.getBookmarksNavigate(tags))
            .then((result) => {
                var data = [];
                var tag = {
                    id: result && result[0] && result[0].tag_id,
                    name: result && result[0] && result[0].tag_name,
                    sort: result && result[0] && result[0].sort,
                    click: 0,
                    bookmarks: []
                };
                result.forEach(function(bookmark) {
                    if (tag.id !== bookmark.tag_id) {
                        data.push({
                            id: tag.id,
                            name: tag.name,
                            sort: tag.sort,
                            click: tag.click,
                            bookmarks: tag.bookmarks
                        });
                        tag.id = bookmark.tag_id;
                        tag.name = bookmark.tag_name;
                        tag.sort = bookmark.sort;
                        tag.click = 0;
                        tag.bookmarks = [];
                    }
                    tag.click += bookmark.click_count;
                    tag.bookmarks.push(bookmark);
                });
                if (result && result.length > 0) {
                    data.push(tag);
                }
                data.sort((a, b) => {
                    if (a.sort == b.sort) return b.click - a.click;
                    return a.sort - b.sort;
                });
                var temp = data.map(item => {
                    return {
                        name: item.name,
                        sort: item.sort,
                        click: item.click,
                    }
                })
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


api.get('/bookmarksByTag', function(req, res) {
    console.log('hello bookmarksByTag', JSON.stringify(req.query), req.session.username);
    if (!req.session.user) {
        res.send(401);
        return;
    }
    var userId = req.session.user.id;
    var params = req.query;

    var bookmarks = [];
    var tagsBookmarks = [];
    var totalItems = 0;
    var totalItems = 0;
    var sendData = {
        totalItems: 0,
        bookmarksClickCount: [],
        bookmarksCreatedAt: [],
        bookmarksLatestClick: [],
    }
    db.getBookmarksByTag(params)
        .then((bookmarksData) => {
            sendData = bookmarksData;
            var bookmarkIds = []
                .concat(sendData.bookmarksClickCount.map((bookmark) => bookmark.id))
                .concat(sendData.bookmarksCreatedAt.map((bookmark) => bookmark.id))
                .concat(sendData.bookmarksLatestClick.map((bookmark) => bookmark.id))
            return db.getTagsBookmarks(bookmarkIds);
        })
        .then((tbs) => {
            tagsBookmarks = tbs;
            return db.getTags(userId);
        })
        .then((tags) => {
            // 获取每个书签的所有分类标签
            var objectName = ['bookmarksClickCount', 'bookmarksCreatedAt', 'bookmarksLatestClick'];
            objectName.forEach((name) => {
                sendData[name].forEach(function(bookmark, index) {
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
                    sendData[name][index].tags = bookmarkTags;
                })
            })
            res.json(sendData);
        })
        .catch((err) => console.log('bookmarks table or card err', err))

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
    var userId = req.session.user.id;
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
                var bookmarkIds = bookmarks.map((bookmark) => {
                    bookmark.own = bookmark.user_id == userId ? true : false;
                    if (!bookmark.own) {
                        bookmark.description = "其他用户的描述信息不允许查看";
                    }
                    return bookmark.id;
                });
                return db.getTagsBookmarks(bookmarkIds);
            } else {
                res.json(sendData);
                return Promise.reject('没有搜到到任何书签');
            }
        })
        .then((tbs) => {
            if (tbs.length > 0) {
                var tagIds = tbs.map((tb) => tb.tag_id);
                tagsBookmarks = tbs;
                return db.getTagsByIds(tagIds);
            } else {
                res.json(sendData);
                return Promise.reject('没有搜到到任何书签');
            }
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
        .then((tags) => {
            // 每获取一次标签，就检查一下系统默认的两个分类是不是存在
            var defaultTags = [];
            var find1 = false;
            var find2 = false;
            tags.forEach((tag) => {
                if (tag.name == "未分类") {
                    find1 = true;
                }
                if (tag.name == "收藏") {
                    find2 = true;
                }
            })
            if (!find1) {
                defaultTags.push("未分类")
            }
            if (!find2) {
                defaultTags.push("收藏")
            }
            if (defaultTags.length > 0) {
                db.addTags(req.session.user.id, defaultTags)
            }
            res.json(tags);
        })
        .catch((err) => console.log('tags', err));
});

api.get('/advices', function(req, res) {
    if (!req.session.user) {
        res.send(401);
        return;
    }
    var params = req.query;
    db.getAdvices(params)
        .then((advices) => res.json(advices))
        .catch((err) => console.log('tags', err));
});

api.post('/addAdvice', function(req, res) {
    console.log('hello addAdvice', JSON.stringify(req.body));
    if (!req.session.user) {
        res.send(401);
        return;
    }

    var params = req.body.params;
    params.user_id = req.session.user.id;

    db.addAdvice(params)
        .then((affectedRows) => {
            res.json({
                retCode: 0,
                msg: "留言成功 ",
            })
            console.log('addAdvice affectedRows ', affectedRows)
        })
        .catch((err) => {
            console.log('addAdvice error', err);
            res.json({
                retCode: 1,
                msg: "留言失败: " + JSON.stringify(err),
            })
        });
});

// 发现使用node启动没问题，forever启动有问题。
api.post('/uploadBookmarkFile', upload.single('bookmark'), function(req, res) {
    console.log('hello uploadBookmarkFile');
    if (!req.session.user) {
        res.send(401);
        return;
    }

    var file = req.file;
    res.json(file);
    parseHtml(file.path, function(data) {
        var bookmarks = data.bookmarks;
        var tagsName = data.tags;

        var userId = req.session.user.id;
        var addTagNames = [];

        db.getTags(userId)
            // 先插入分类
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
            .then((newTagNames) => {
                if (newTagNames.length > 0) {
                    return db.addTags(userId, newTagNames)
                } else {
                    return Promise.resolve();
                }
            })
            .then(() => db.getTags(userId))
            .then((allTags) => {
                bookmarks.forEach((item, index) => {
                    var count = 0;
                    if (/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/.test(item.url)) {
                        var bookmark = {};
                        bookmark.title = item.name;
                        bookmark.description = "";
                        bookmark.url = item.url;
                        bookmark.public = '1';
                        if (item.tags.length == 0) {
                            item.tags.push("未分类")
                        }

                        var tags = [];
                        item.tags.forEach((tag) => {
                            allTags.forEach((at) => {
                                if (at.name == tag) {
                                    tags.push(at.id);
                                }
                            })
                        })
                        // 插入书签
                        db.addBookmark(userId, bookmark) // 插入书签
                            .then((bookmark_id) => {
                                db.delBookmarkTags(bookmark_id); // 不管3721，先删掉旧的分类
                                return bookmark_id;
                            }) // 将之前所有的书签分类信息删掉
                            .then((bookmark_id) => db.addTagsBookmarks(tags, bookmark_id)) // 插入分类
                            .then(() => db.updateLastUseTags(userId, tags)) // 更新最新使用的分类
                            .then(() => {
                                count++
                            }) // 运气不错
                            .catch((err) => console.log('uploadBookmarkFile addBookmark err', err)); // oops!
                    }

                    if ((index + 1) == bookmarks.length) {
                        // 通知前台
                    }
                })
            })
            .catch((err) => console.log('uploadBookmarkFile err', err));
    })
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
    var bookmarkId = -1;
    var ret = {};
    db.addBookmark(userId, bookmark) // 插入书签
        .then((bookmark_id) => {
            db.delBookmarkTags(bookmark_id); // 不管3721，先删掉旧的分类
            bookmarkId = bookmark_id;
            return bookmark_id;
        }) // 将之前所有的书签分类信息删掉
        .then((bookmark_id) => db.addTagsBookmarks(tags, bookmark_id)) // 插入分类
        .then(() => db.updateLastUseTags(userId, tags)) // 更新最新使用的分类
        .then(() => db.getBookmark(bookmarkId)) // 获取书签信息，返回去
        .then((bookmark) => {
            ret = bookmark;
            return db.getBookmarkTags(bookmarkId);
        })
        .then((bookmarkTags) => {
            ret.tags = bookmarkTags;
            res.json(ret)
        })
        .catch((err) => console.log('addBookmark err', err)); // oops!
});

api.post('/favoriteBookmark', function(req, res) {
    console.log('hello favoriteBookmark', JSON.stringify(req.body));
    if (!req.session.user) {
        res.send(401);
        return;
    }
    var bookmark = req.body.params;
    var userId = req.session.user.id;
    var bookmarkId = -1;
    var ret = {};

    db.addBookmark(userId, bookmark) // 插入书签
        .then((bookmark_id) => {
            db.delBookmarkTags(bookmark_id); // 不管3721，先删掉旧的分类
            bookmarkId = bookmark_id;
            return bookmark_id;
        }) // 将之前所有的书签分类信息删掉
        .then((bookmark_id) => db.getTags(userId)) // 插入分类
        .then((tags) => {
            var tagFavorite = [];
            tags.forEach((tag) => {
                if (tag.name == '收藏') {
                    tagFavorite.push(tag.id);
                }
            })
            if (tagFavorite.length >= 1) {
                return db.addTagsBookmarks(tagFavorite, bookmarkId)
            } else {
                db.addTags(req.session.user.id, ['收藏'])
                return Promise.reject("没有收藏的分类");
            }
        })
        .then(() => db.getBookmark(bookmarkId)) // 获取书签信息，返回去
        .then((bookmark) => {
            ret = bookmark;
            return db.getBookmarkTags(bookmarkId);
        })
        .then((bookmarkTags) => {
            ret.tags = bookmarkTags;
            res.json(ret)
        })
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

api.post('/updateTagName', function(req, res) {
    console.log('hello updateTagName', JSON.stringify(req.query), JSON.stringify(req.body));
    if (!req.session.user) {
        res.send(401);
        return;
    }
    var tag = req.body.params;
    var userId = req.session.user.id;

    db.getTags(userId)
        .then((tags) => {
            for (var i = 0; i < tags.length; i++) {
                if (tags[i].id != tag.id && tags[i].name == tag.name) {
                    return Promise.resolve(-1);
                }
            }
            return db.updateTagName(tag);
        })
        .then((affectedRows) => {
            var msg = "";
            if (affectedRows == -1) {
                msg += " 您已经有这个分类了，不允许更新";
            } else if (affectedRows == 0) {
                msg += " 更新失败";
            } else if (affectedRows == 1) {
                msg = " 更新成功";
            } else {
                msg += " 更新失败";
            }
            res.json({
                retCode: (affectedRows == 1) ? 0 : 1,
                msg: msg,
            })
        })
        .catch((err) => {
            console.log('addTags err', err);
            res.json({
                retCode: 1,
                msg: tag.name + " 更新失败: " + JSON.stringify(err),
            })
        });
});

api.post('/updateTagsIndex', function(req, res) {
    console.log('hello updateTagsIndex', JSON.stringify(req.query), JSON.stringify(req.body));
    if (!req.session.user) {
        res.send(401);
        return;
    }
    var tagsIndex = req.body.params;

    db.updateTagsIndex(tagsIndex)
        .then((affectedRows) => {
            var msg = "";
            if (affectedRows == tagsIndex.length) {
                msg = " 排序更新成功";
            } else {
                msg += " 排序更新失败";
            }
            res.json({
                retCode: (affectedRows == tagsIndex.length) ? 0 : 1,
                msg: msg,
            })
        })
        .catch((err) => {
            console.log('updateTagsIndex err', err);
            res.json({
                retCode: 1,
                msg: "排序更新失败: " + JSON.stringify(err),
            })
        });
});

api.post('/delTag', function(req, res) {
    console.log('hello delTag', JSON.stringify(req.query), JSON.stringify(req.body));
    if (!req.session.user) {
        res.send(401);
        return;
    }
    var tag = req.body.params;
    var needDelTag = tag.del || false;
    var bookmarksId = []
    db.getBookmarkIdsByTagId(tag.id)
        .then((_bookmarksId) => {
            bookmarksId = _bookmarksId.map((item) => item.bookmark_id);
            return db.delTagBookmarks(tag.id); // 先删掉分类跟书签的映射
        })
        .then((affectedRows) => db.delBookmarks(bookmarksId)) // 再删掉该分类下面的书签
        .then((affectedRows) => db.delTagsBookmarks(bookmarksId)) // 再删掉该书签关联的其他分类
        .then((affectedRows) => {
            if (needDelTag) {
                return db.delTag(tag.id);
            }
            return Promise.resolve(1);
        }) // 再删掉分类
        .then((affectedRows) => {
            res.json({
                retCode: affectedRows == 1 ? 0 : 1,
            })
        }) // 再删掉该分类下面的书签
        .catch((err) => {
            console.log('delTag err', err);
            res.json({
                retCode: 1,
                msg: "删除分类失败: " + JSON.stringify(err),
            })
        });
});

api.post('/getArticle', function(req, res) {
    var params = req.body.params;
    var url = params.url;
    var requestId = params.requestId || 0;
    read(url, function(err, article, meta) {
        if (err) {
            res.json({
                title: '',
                content: false,
            });
        } else {
            if (requestId == 0) {
                res.json({
                    title: article.title || '',
                });
            } else if (requestId == 1) {
                res.json({
                    content: article.content,
                });
            }
            article.close();
        }
    });
})

api.checkSnapFaviconState = function() {
    db.getBookmarks()
        .then((bookmarks) => {
            bookmarks.forEach(bookmark => {
                var id = bookmark.id;
                var snap_state = bookmark.snap_state;
                var finePath = './public/images/snap/' + id + '.png'
                fs.exists(finePath, function(exists) {
                    if (!exists && snap_state == -1) {
                        db.updateBookmarkSnapState(id, 0);
                    }
                });
            })
        })
        .catch((err) => console.log('getBookmarks err', err));
}

api.getSnapFaviconByTimer = function() {
    console.log('getSnapFaviconByTimer...........');
    var timeout = 5000
    setInterval(function() {
        var today = new Date().getDate();
        db.getBookmarkWaitSnap(today)
            .then((bookmarks) => {
                if (bookmarks.length == 1) {
                    var id = bookmarks[0].id;
                    var snapState = bookmarks[0].snap_state;
                    var faviconState = bookmarks[0].favicon_state;
                    var url = bookmarks[0].url;
                    var filePath = './public/images/snap/' + id + '.png';
                    var faviconPath = './public/images/favicon/' + id + '.ico';

                    // 获取截图
                    fs.exists(filePath, function(exists) {
                        if (exists) {
                            if (snapState != -1) {
                                db.updateBookmarkSnapState(id, -1);
                            }
                        } else {
                            if (!/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/.test(url)) {
                                db.updateBookmarkSnapState(id, today + 31);
                                return;
                            }
                            var webshotOptions = {
                                shotSize: {
                                    width: 320,
                                    height: 160
                                },
                                timeout: timeout,
                            };
                            webshot(url, filePath, webshotOptions, function(err) {
                                var newSnapState = -1;
                                if (err) {
                                    console.log("boomarkid = " + id + ", webshot over", err)
                                    if (snapState == 0 || snapState == 1) {
                                        newSnapState = snapState + 1;
                                    } else if (snapState == 2) {
                                        newSnapState = today + 31;
                                    }
                                }
                                db.updateBookmarkSnapState(id, newSnapState);
                            });
                        }
                    });

                    if (!/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/.test(url)) {
                        fs.exists(faviconPath, function(exists) {
                            if (!exists) {
                                var sourceFile =  './public/images/favicon/default.ico';
                                var readStream = fs.createReadStream(sourceFile);
                                var writeStream = fs.createWriteStream(faviconPath);
                                readStream.pipe(writeStream);
                            }
                        });
                        db.updateBookmarkFaviconState(id, today + 31);
                        return;
                    }
                    var faviconUrl = "http://g.soz.im/"+ url +"/cdn.ico"
                    if (faviconUrl) {
                        download(faviconUrl, faviconPath, function(err) {
                            var newFaviconState = -1;
                            if (err) {
                                console.log("boomarkid = " + id + ", download over", err)
                                if (faviconState == 0 || faviconState == 1) {
                                    newFaviconState = faviconState + 1;
                                } else if (faviconState == 2) {
                                    newFaviconState = today + 31;
                                }
                            }
                            db.updateBookmarkFaviconState(id, newFaviconState);
                        });
                    } else {
                        db.updateBookmarkFaviconState(id, today + 31);
                    }

                    // 获取favicon(由于获取不到有些图标，暂时放弃)
                    // fs.exists(faviconPath, function(exists) {
                    //     if (exists) {
                    //         if (faviconState != -1) {
                    //             db.updateBookmarkFaviconState(id, -1);
                    //         }
                    //     } else {
                    //         if (!/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/.test(url)) {
                    //             db.updateBookmarkFaviconState(id, today + 31);
                    //             return;
                    //         }
                    //         favicon(url, function(err, faviconUrl) {
                    //             if (faviconUrl) {
                    //                 download(faviconUrl, faviconPath, function(err) {
                    //                     var newFaviconState = -1;
                    //                     if (err) {
                    //                         console.log("boomarkid = " + id + ", download over", err)
                    //                         if (faviconState == 0 || faviconState == 1) {
                    //                             newFaviconState = faviconState + 1;
                    //                         } else if (faviconState == 2) {
                    //                             newFaviconState = today + 31;
                    //                         }
                    //                     }
                    //                     db.updateBookmarkFaviconState(id, newFaviconState);
                    //                 });
                    //             } else {
                    //                 db.updateBookmarkFaviconState(id, today + 31);
                    //             }
                    //         });
                    //     }
                    // });
                }
            })
            .catch((err) => console.log('getBookmarkWaitSnap err', err));
    }, timeout + 1000);
}

function md5(str) {
    return crypto.createHash('md5').update(str).digest('hex');
};

module.exports = api;
