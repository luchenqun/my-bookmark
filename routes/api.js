var api = require('express').Router();
var crypto = require('crypto');
var read = require('node-readability');
var db = require('../database/db.js');
var parseHtml = require('../common/parse_html.js');
var download = require('download');
var multer = require('multer');
// var webshot = require('webshot');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var beautify_html = require('js-beautify').html;
var xss = require('xss');

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function(req, file, cb) {
        var now = new Date().format('yyyyMMddhhmmss')
        if (req.session.user) {
            cb(null, 'importbookmark-' + req.session.username + '-' + now + '.html')
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
    console.log("clickBookmark username = ", req.session.username);
    db.getUser(req.session.username)
        .then((user) => { return user.id == req.session.userId ? db.clickBookmark(req.body.params.id, req.session.userId) : Promise.resolve(0); })
        .then((affectedRows) => res.json({}))
        .catch((err) => console.log('clickBookmark error', err));
});

api.post('/jumpQuickUrl', function(req, res) {
    console.log("jumpQuickUrl username = ", req.session.username);
    if (!req.session.user) {
        res.send(401);
        return;
    }
    db.getBookmarkbyUrl(req.session.user.id, req.body.params.url)
        .then((bookmarkId) => {
            res.json({id: bookmarkId});
            if (bookmarkId) {
                return db.clickBookmark(bookmarkId, req.session.user.id);
            } else {
                return Promise.reject(0);
            }
        })
        .then((affectedRows) => {})
        .catch((err) => console.log('jumpQuickUrl err', err)); // oops!
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
            ret.user.password = "*";
            res.json(ret);
            return ret.logined ? db.updateUserLastLogin(ret.user.id) : Promise.resolve(0);
        })
        .then((affectedRows) => {
            console.log('updateUserLastLogin affectedRows ', affectedRows)
        })
        .catch((err) => console.log('login error', err));
});

api.get('/userInfo', function(req, res) {
    console.log("userInfo username = ", req.session.username);
    if (!req.session.user) {
        res.send(401);
        return;
    }
    var user = {};
    db.getUser(req.session.username)
        .then((_user) => {
            user = _user
            user.password = "*";
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
    console.log("resetPassword username = ", req.session.username);
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

api.post('/updateShowStyle', function(req, res) {
    console.log("updateShowStyle username = ", req.session.username);
    if (!req.session.user) {
        res.send(401);
        return;
    }

    var params = req.body.params;
    db.getUser(req.session.user.username)
        .then((user) => {
            if (user) {
                return db.updateShowStyle(req.session.userId, params.showStyle)
            } else {
                return Promise.resolve(0)
            }
        })
        .then((affectedRows) => {
            res.json({
                retCode: (affectedRows == 1 ? 0 : 1),
                msg: req.session.username + " 更新书签默认显示风格配置成功！",
            })

            if (affectedRows) {
                req.session.user.show_style = params.showStyle;
            }
        })
        .catch((err) => {
            console.log('resetPassword error', err);
            res.json({
                retCode: 2,
                msg: req.session.username + " 更新书签默认显示风格配置失败！: " + JSON.stringify(err),
            })
        });
});

api.post('/updateSearchHistory', function(req, res) {
    console.log("updateSearchHistory username = ", req.session.username);
    if (!req.session.user) {
        res.send(401);
        return;
    }

    var params = req.body.params;
    db.getUser(req.session.user.username)
        .then((user) => {
            if (user) {
                return db.updateSearchHistory(req.session.userId, params.searchHistory)
            } else {
                return Promise.resolve(0)
            }
        })
        .then((affectedRows) => {
            res.json({
                retCode: (affectedRows == 1 ? 0 : 1),
                msg: req.session.username + " 更新历史搜索成功！",
            })
        })
        .catch((err) => {
            console.log('resetPassword error', err);
            res.json({
                retCode: 2,
                msg: req.session.username + " 更新历史搜索失败！: " + JSON.stringify(err),
            })
        });
});

api.post('/updateQuickUrl', function(req, res) {
    console.log("updateQuickUrl username = ", req.session.username);
    if (!req.session.user) {
        res.send(401);
        return;
    }

    var params = req.body.params;
    db.getUser(req.session.user.username)
        .then((user) => {
            if (user) {
                return db.updateQuickUrl(req.session.userId, params.quickUrl)
            } else {
                return Promise.resolve(0)
            }
        })
        .then((affectedRows) => {
            res.json({
                retCode: (affectedRows == 1 ? 0 : 1),
                msg: req.session.username + " 更新全局快捷键成功！",
            })
        })
        .catch((err) => {
            console.log('resetPassword error', err);
            res.json({
                retCode: 2,
                msg: req.session.username + " 更新全局快捷键失败！: " + JSON.stringify(err),
            })
        });
});

api.get('/autoLogin', function(req, res) {
    console.log("autoLogin username = ", req.session.username);
    var ret = {
        logined: false,
        user: {},
    }
    if (req.session.user) {
        db.getUser(req.session.user.username)
            .then((user) => {
                if (user) {
                    user.password = "*";
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
    console.log("delBookmark username = ", req.session.username);
    if (!req.session.user) {
        res.send(401);
        return;
    }
    var bookmarkId = req.query.id;
    var userId = req.session.user.id;
    db.getBookmark(bookmarkId)
        .then((bookmark) => {
            if(bookmark.user_id === userId) {
                return db.delBookmarkTags(bookmarkId);
            } else {
                res.json({
                    result: 0
                });
                return Promise.reject("can not del others bookmark");
            }
        })
        .then(() => db.delBookmark(bookmarkId))
        .then((affectedRows) => res.json({
            result: affectedRows
        }))
        .catch((err) => console.log('delBookmark err', err));
})

api.post('/updateBookmark', function(req, res) {
    console.log("updateBookmark username = ", req.session.username);
    if (!req.session.user) {
        res.send(401);
        return;
    }

    var bookmark = req.body.params;
    var userId = req.session.user.id;
    var tags = bookmark.tags;
    var ret = {};
    bookmark.userId = userId;
    console.log('hello updateBookmark', JSON.stringify(bookmark));
    db.updateBookmark(bookmark) // 更新标签信息
        .then((affectedRows) => db.delBookmarkTags(bookmark.id)) // 将之前所有的书签分类信息删掉
        .then((insertId) => db.addTagsBookmarks(tags, bookmark.id)) // 将新的分类关联起来
        .then(() => db.updateLastUseTags(userId, tags)) // 更新最近使用的分类(这个有待考虑)
        .then(() => db.getBookmark(bookmark.id)) // 将新的信息返回去
        .then((bookmark) => {
            ret = bookmark;
            return db.getBookmarkTagsNames(bookmark.id);
        })
        .then((tags) => {
            ret.tags = tags;
            res.json(ret);
        }) // 运气不错
        .catch((err) => console.log('updateBookmark err', err)); // oops!
})

api.get('/bookmark', function(req, res) {
    console.log("bookmark username = ", req.session.username);
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
    console.log("bookmarks username = ", req.session.username);
    if (!req.session.user) {
        res.send(401);
        return;
    }
    var userId = req.session.user.id;
    var params = req.query;
    params.showStyle = params.showStyle || req.session.user.show_style; // 如果没有指定风格，那么用系统风格
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
                    bookmark.created_at = new Date(bookmark.created_at).format("yyyy-MM-dd hh:mm:ss");
                    bookmark.last_click = new Date(bookmark.last_click).format("yyyy-MM-dd hh:mm:ss");
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
    } else if (params.showStyle === 'costomTag') {
        var bookmarks = []
        db.getBookmarksCostomTag(userId)
            .then((bookmarksData) => {
                bookmarks = bookmarksData.bookmarks;
                var bookmarkIds = bookmarks.map((bookmark) => bookmark.id)
                return db.getTagsBookmarks(bookmarkIds);
            })
            .then((tbs) => {
                tagsBookmarks = tbs;
                return db.getTags(userId);
            })
            .then((tags) => {
                bookmarks.forEach(function(bookmark, index) {
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
                    bookmarks[index].tags = bookmarkTags;
                })
                res.json(bookmarks);
            })
            .catch((err) => console.log('bookmarks costomTag err', err))
    } else {
        var tagsBookmarks = [];
        var sendData = {
            totalItems: 0,
            bookmarks: [],
        }

        params.userId = userId;
        db.getBookmarksTable(params)
            .then((bookmarksData) => {
                sendData = bookmarksData;
                var bookmarkIds = sendData.bookmarks.map((bookmark) => bookmark.id)
                return db.getTagsBookmarks(bookmarkIds);
            })
            .then((tbs) => {
                tagsBookmarks = tbs;
                return db.getTags(userId);
            })
            .then((tags) => {
                sendData.bookmarks.forEach(function(bookmark, index) {
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
                    sendData.bookmarks[index].tags = bookmarkTags;
                })

                res.json(sendData);
            })
            .catch((err) => console.log('bookmarks table or card err', err))
    }
});

api.get('/hotBookmarks', function(req, res) {
    console.log("hotBookmarks username = ", req.session.username);
    var userId = req.session.user.id;
    var params = req.query;
    var date = params.date || new Date().format('yyyyMMdd');;
    db.hotBookmarks(date)
        .then((bookmarks) => {
            res.json(bookmarks);
        })
        .catch((err) => console.log('hotBookmarks err', err))
});

api.get('/bookmarksByTag', function(req, res) {
    console.log("bookmarksByTag username = ", req.session.username);
    if (!req.session.user) {
        res.send(401);
        return;
    }
    var userId = req.session.user.id;
    var params = req.query;

    var tagsBookmarks = [];
    var sendData = {
        totalItems: 0,
        bookmarks: [],
    }

    // -1 获取自己定制的
    // -2 获取全站定制的
    var fun = (params.tagId <= -1) ? (params.tagId == -1 ? db.getBookmarksCostomTag : db.getBookmarksCostomAllUsersTag) : (db.getBookmarksByTag);

    fun((params.tagId <= -1) ? (userId) : (params), params.perPageItems)
        .then((bookmarksData) => {
            sendData = bookmarksData;
            var bookmarkIds = sendData.bookmarks.map((bookmark) => bookmark.id)
            return db.getTagsBookmarks(bookmarkIds);
        })
        .then((tbs) => {
            tagsBookmarks = tbs;
            return db.getTags(params.tagId >= -1 ? userId : null);
        })
        .then((tags) => {
            // 获取每个书签的所有分类标签
            sendData.bookmarks.forEach(function(bookmark, index) {
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
                sendData.bookmarks[index].tags = bookmarkTags;
            })
            res.json(sendData);
        })
        .catch((err) => console.log('getBookmarksByTag err', err))

});

api.get('/searchBookmarks', function(req, res) {
    console.log("searchBookmarks username = ", req.session.username);
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

api.get('/searchHotBookmarks', function(req, res) {
    console.log("searchHotBookmarks username = ", req.session.username);
    if (!req.session.user) {
        res.send(401);
        return;
    }
    var params = req.query;
    db.getHotBookmarksSearch(params)
        .then((searchData) => {
            res.json(searchData);
        })
        .catch((err) => console.log('getHotBookmarksSearch err', err))
});

api.get('/tags', function(req, res) {
    console.log("tags username = ", req.session.username);
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
    console.log("advices username = ", req.session.username);
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
    console.log("addAdvice username = ", req.session.username);
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
    console.log("uploadBookmarkFile username = ", req.session.username);
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
                        bookmark.created_at = new Date(item.add_date).format('yyyy-MM-dd hh:mm:ss')
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
                        db.getBookmarkbyUrl(userId, bookmark.url)
                            .then((bookmarkId) => {
                                // 如果这个url的书签存在了，那么直接返回书签，否则返回插入的书签
                                return bookmarkId ? Promise.resolve(bookmarkId) : db.addBookmark(userId, bookmark);
                            })
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
    console.log("addBookmark username = ", req.session.username);
    if (!req.session.user) {
        res.send(401);
        return;
    }
    var bookmark = req.body.params;
    var userId = req.session.user.id;
    var tags = [bookmark.tags[bookmark.tags.length - 1]]; // 只允许添加一个分类
    var bookmarkId = -1;
    var ret = {};
    var update = false;
    db.getBookmarkbyUrl(userId, bookmark.url)
        .then((bookmarkId) => {
            // 如果这个url的书签存在了，那么直接返回书签，否则返回插入的书签
            if (bookmarkId) {
                bookmark.id = bookmarkId;
                db.updateBookmark(bookmark); // 如果存在，更新一下。
                update = true;
                return Promise.resolve(bookmarkId);
            } else {
                return db.addBookmark(userId, bookmark);
            }
        })
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
            return db.getBookmarkTagsNames(bookmark.id);
        })
        .then((bookmarkTags) => {
            ret.tags = bookmarkTags;
            ret.update = update;
            res.json(ret)
        })
        .catch((err) => console.log('addBookmark err', err)); // oops!
});

api.post('/favoriteBookmark', function(req, res) {
    console.log("favoriteBookmark username = ", req.session.username);
    if (!req.session.user) {
        res.send(401);
        return;
    }
    var bookmark = req.body.params;
    var userId = req.session.user.id;
    var bookmarkId = -1;
    var ret = {};
    var update = false;
    db.getBookmarkbyUrl(userId, bookmark.url)
        .then((bookmarkId) => {
            // 如果这个url的书签存在了，那么直接返回书签，否则返回插入的书签
            if (bookmarkId) {
                bookmark.id = bookmarkId;
                db.updateBookmark(bookmark); // 如果存在，更新一下。
                update = true;
                return Promise.resolve(bookmarkId);
            } else {
                return db.addBookmark(userId, bookmark);
            }
        })
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
            ret.update = update;
            res.json(ret)
        })
        .catch((err) => console.log('addBookmark err', err)); // oops!
});

api.post('/addTags', function(req, res) {
    console.log("addTags username = ", req.session.username);
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
    console.log("updateTagName username = ", req.session.username);
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

api.post('/updateTagShow', function(req, res) {
    console.log("updateTagShow username = ", req.session.username);
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
            return db.updateTagShow(tag);
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
            console.log('updateTagShow err', err);
            res.json({
                retCode: 1,
                msg: tag.name + " 更新失败: " + JSON.stringify(err),
            })
        });
});

api.post('/updateTagsIndex', function(req, res) {
    console.log("updateTagsIndex username = ", req.session.username);
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
    console.log("delTag username = ", req.session.username);
    if(req.session.username === "test") {
        res.json({
            retCode: 100,
            msg: "test用户不允许删除分类！",
        })
        return;
    }
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
    console.log("getArticle username = ", req.session.username);
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

api.post('/getUpdateLog', function(req, res) {
    console.log("getArticle username = ", req.session.username);
    var params = req.body.params;
    var defaultUrl = 'https://github.com/luchenqun/my-bookmark/commits/master'
    var url = params.url || defaultUrl;

    request(url, function(error, response, body) {
        console.log("HotBookmarks request ", error, response && response.statusCode);
        if (response && response.statusCode == 200) {
            const $ = cheerio.load(body);
            var data = [];
            $('.commit-group-title').each(function() {
                var updateLogs = {};

                var dateMap = {
                    'Jan': 1,
                    'Feb': 2,
                    'Mar': 3,
                    'Apr': 4,
                    'May': 5,
                    'Jun': 6,
                    'Jul': 7,
                    'Aug': 8,
                    'Sep': 9,
                    'Oct': 10,
                    'Nov': 11,
                    'Dec': 12,
                }
                var date = $(this).text().replace(/(^\s*)|(\s*$)/g, '').replace(/\s+/g, ' '); // 去除前后空格得到字符串 Commits on Jun 16, 2017;
                var dateArray = date.replace(',', '').replace('Commits on ', '').split(' ');

                updateLogs.date = dateArray[2] + '-' + (dateMap[dateArray[0]] || dateArray[0]) + '-' + dateArray[1];
                updateLogs.logs = [];

                $(this).next().children('li').each(function() {
                    var $log = $(this).children('.table-list-cell').eq(0).children('p').children('a');
                    var commit = $log.text()
                    var href = 'https://github.com' + $log.attr('href');

                    updateLogs.logs.push({
                        commit: commit,
                        href: href,
                    })
                })
                data.push(updateLogs)
            })

            var oldUrl = $('.paginate-container .pagination a').attr('href');
            if (oldUrl) {
                oldUrl = 'https://github.com' + oldUrl;
            }

            res.json({
                updateLogs: data,
                oldUrl: oldUrl || defaultUrl
            });
        } else {
            console.log("HotBookmarks request is error", error, response && response.statusCode);
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

api.getSnapByTimer = function() {
    console.log('getSnapByTimer...........');
    var timeout = 30000
    setInterval(function() {
        var date = new Date();
        var today = date.getDate();
        var hours = date.getHours();
        if (hours >=2 && hours <= 5) {
            db.getBookmarkWaitSnap(today)
            .then((bookmarks) => {
                if (bookmarks.length == 1) {
                    var id = bookmarks[0].id;
                    var snapState = bookmarks[0].snap_state;
                    var url = bookmarks[0].url;
                    var filePath = './public/images/snap/' + id + '.png';
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
                                    console.log("boomarkid = " + id + ", url = " + url + ", webshot over")
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
                }
            })
            .catch((err) => console.log('getBookmarkWaitSnap err', err));
        }

    }, timeout + 1000);
}

api.getFaviconByTimer = function() {
    console.log('getFaviconByTimer...........');
    let timeout = 1000 * 60 * 30; // 半小时更新一次
    let busy = false;

    let downloadFavicon = async () => {
        if(busy) return;
        var today = new Date().getDate();
        try {
            busy = true;
            let bookmarks = await db.getBookmarkWaitFavicon(today);
            for (let bookmark of bookmarks) {
                let id = bookmark.id;
                let faviconState = bookmark.favicon_state;
                let url = encodeURI(bookmark.url);
                let faviconPath = './public/images/favicon/' + id + '.ico';
                let defaultFile = './public/images/default.ico';

                if (/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/.test(url)) {
                    // http://www.cnblogs.com/zhangwei595806165/p/4984912.html 各种方法都试一遍
                    var faviconUrl = "http://favicon.luchenqun.com/?url=" + url; // 默认地址
                    if (faviconState == 1) {
                        faviconUrl = "http://www.google.com/s2/favicons?domain=" + url;
                    }

                    try {
                        let data = await download(faviconUrl);
                        fs.writeFileSync(faviconPath, data);
                        faviconState = -1;
                    } catch (error) {
                        console.log("boomarkid = " + id + ", url = " + url + ", download error")
                        if (faviconState == 0) {
                            faviconState = faviconState + 1;
                        } else if (faviconState == 1) {
                            faviconState = -1;
                            copyFile(defaultFile, faviconPath);
                        }
                    }
                } else {
                    console.log("error http url" + url);
                    faviconState = -1;
                    copyFile(defaultFile, faviconPath);
                }
                await db.updateBookmarkFaviconState(id, faviconState);
            }
        } catch (error) {
            console.log('getFaviconByTimer err', error);
        }
        busy = false;
    }

    downloadFavicon(); // 一进来先调用一次
    setInterval(downloadFavicon, timeout);
}

api.getHotBookmarksByTimer = function() {
    var timeout = 1000 * 60 * 10; // 10分钟更新一遍
    var busy = false;
    var dayIndex = 0;
    var date = new Date();

    console.log('getHotBookmarks...........', date.format("yyyy-MM-dd hh:mm:ss"));

    setInterval(function() {
        if (busy) {
            console.log('getHotBookmarks is busy')
            return;
        }
        if (timeout < 1000 * 5) {
            busy = true; // 实践证明很容易出错导致busy一直是true，所以干脆去掉此选项了。
        }
        console.log('begin getHotBookmarks...');
        date.setTime(date.getTime() + dayIndex * 24 * 60 * 60 * 1000);
        var requireData = {
            idfa: "d4995f8a0c9b2ad9182369016e376278",
            os: "ios",
            osv: "9.3.5",
            userId: null,
            lastupdataTime: new Date().getTime(),
            pageNo: 1,
            pageSize: 1000,
            sort: 'desc',
            renderType: 0,
            date: curentDate(dayIndex, "yyyy年M月d日"),
        }
        var url = "https://api.shouqu.me/api_service/api/v1/daily/dailyMark";
        var alterRex = "/mmbiz.qpic.cn|images.jianshu.io|zhimg.com/g";
        var defaultSnap = "./images/default.jpg";
        var defaultFavicon = "./images/favicon/default.ico";
        request.post({
            url: url,
            form: requireData
        }, function(error, response, body) {
            console.log("HotBookmarks request ", error, response && response.statusCode);
            if (response && response.statusCode == 200) {
                var inserCnt = 0;
                var data = JSON.parse(body).data;
                var dataDate = new Date(data.date)

                console.log("getHotBookmarks success, date = ", dataDate.format("yyyy-MM-dd hh:mm:ss"), ', bookmarks length = ', data.list.length);

                if (data.list.length == 0) {
                    busy = false;
                    return;
                }
                var dateSql = parseInt(dataDate.format('yyyyMMdd'));
                data.list.forEach((b) => {
                    var bookmark = {};
                    bookmark.id = b.articleId;
                    bookmark.date = dateSql; // 因为有第二天很早的时候获取的是前一天的,所以用数据返回日期
                    bookmark.title = b.title;
                    bookmark.url = b.url;
                    bookmark.fav_count = b.favCount || 0;
                    bookmark.created_by = b.sourceName || '泥巴';
                    bookmark.created_at = b.updatetime > b.createtime ? b.createtime : b.updatetime;
                    bookmark.last_click = b.updatetime < b.createtime ? b.createtime : b.updatetime;
                    if (b.imageList.length >= 1) {
                        if (b.imageList[0].url) {
                            bookmark.snap_url = (data.pageNo == 1 ? (b.imageList[0].url.match(alterRex) != null ? defaultSnap : b.imageList[0].url) : defaultSnap);
                        } else {
                            bookmark.snap_url = defaultSnap;
                            for (var i = 0; i < b.images.length; i++) {
                                if (b.images[i]) {
                                    bookmark.snap_url = b.images[i];
                                    break;
                                }
                            }
                        }
                    } else {
                        bookmark.snap_url = defaultSnap;
                    }
                    bookmark.favicon_url = b.sourceLogo || defaultFavicon;

                    db.addHotBookmark(bookmark)
                        .then((id) => {
                            inserCnt++;
                            if (inserCnt == data.list.length) {
                                busy = false;
                            }
                        })
                        .catch((err) => {
                            inserCnt++;
                            console.log('insertHotBookmarks err ', id, err);
                            if (inserCnt == data.list.length) {
                                busy = false;
                            }
                        });
                });
            } else {
                console.log("HotBookmarks request is error", error, response && response.statusCode);
                busy = false;
            }
        });
    }, timeout);
}



api.post('/addNote', function(req, res) {
    console.log("addNote username = ", req.session.username);
    if (!req.session.user) {
        res.send(401);
        return;
    }

    var params = req.body.params;
    params.user_id = req.session.user.id;

    db.addNote(params)
        .then((insertId) => {
            res.json({
                retCode: 0,
                insertId: insertId,
                msg: "添加备忘成功 ",
            })
            console.log('addNote insertId ', insertId)
        })
        .catch((err) => {
            console.log('addNote error', err);
            res.json({
                retCode: 1,
                msg: "添加备忘失败: " + JSON.stringify(err),
            })
        });
});

api.get('/notes', function(req, res) {
    console.log("getNotes username = ", req.session.username);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', '*');

    var params = req.query;
    if (!params.shareNote && !req.session.user) {
        res.send(401);
        return;
    }
    if (params.shareNote) {
      if(params.json) {
        db.getNote(params.shareNote)
        .then((data) => res.json(data))
        .catch((err) => console.log('notes', err));
      } else {
          db.getNote(params.shareNote)
          .then((data) => {
              data = xss(data);
              res.send(`
          <body style="margin:0px;height:100%;">
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, minimal-ui">
              <script>
                if(screen && screen.availWidth <= 1024) {
                  setTimeout(() => {
                    document.getElementById("note-div").style.width = "100%";
                    document.getElementById("note-div").style["background-color"] = "#F3F4F5";
                    document.getElementById("note").style.width = "95%";
                  }, 100);
                }
              </script>
            </head>
            <div id="note-div" style="text-align:center;">
              <pre id="note" style="background-color:RGB(243,244,245); padding:0px 10px 0px 10px; margin:0px; width:60%; min-height:100%;display: inline-block;text-align: left; font-size: 15px; font-family:italic arial,sans-serif;word-wrap: break-word;white-space: pre-wrap;">\n\n${data}\n\n</pre>
            </div>
          </body>`)
            })
          .catch((err) => console.log('notes', err));
      }
    } else {
        params.user_id = req.session.user.id;
        db.getNotes(params)
            .then((data) => res.json(data))
            .catch((err) => console.log('notes', err));
    }
});

api.delete('/delNote', function(req, res) {
    console.log("delBookmark username = ", req.session.username);
    if (!req.session.user) {
        res.send(401);
        return;
    }
    var noteId = req.query.id;
    db.delNote(noteId)
        .then((affectedRows) => res.json({
            result: affectedRows
        }))
        .catch((err) => {
            console.log('delBookmark err', err);
            res.json({
                result: -1
            })
        });
})

api.post('/updateNote', function(req, res) {
    console.log("updateNote username = ", req.session.username);
    if (!req.session.user) {
        res.send(401);
        return;
    }

    var note = req.body.params;
    console.log('hello updateNote', JSON.stringify(note));
    db.updateNote(note.id, note.content, note.tag_id)
        .then((affectedRows) => res.json({
            result: affectedRows
        }))
        .catch((err) => {
            console.log('updateNote err', err);
            res.json({
                result: -1
            })
        }); // oops!
})

api.post('/updateNotePublic', function(req, res) {
  console.log("updateNotePublic username = ", req.session.username);
  if (!req.session.user) {
      res.send(401);
      return;
  }

  var note = req.body.params;
  console.log('hello updateNotePublic', JSON.stringify(note));
  db.updateNotePublic(note.id, note.public)
      .then((affectedRows) => res.json({
          result: affectedRows
      }))
      .catch((err) => {
          console.log('updateNote err', err);
          res.json({
              result: -1
          })
      }); // oops!
})


// 实现文件下载
api.get('/download', function(req, res) {
    console.log("download username = ", req.session.username);

    var userId = req.query.userId;
    var type = req.query.type;
    if (!req.session.user || req.session.user.id != userId) {
        res.send(401);
        return;
    }
    if (type == 'exportbookmark' && userId) {
        db.getTags(userId)
            .then((tags) => {
                var meta = '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">';
                var init = '<TITLE>Bookmarks</TITLE><H1>Bookmarks</H1><DL id="0"></DL>';
                var $ = cheerio.load(init, {
                    decodeEntities: false,
                    xmlMode: true,
                });

                tags.forEach((tag, tagIndex) => {
                    $('#0').append('<DT><H3>' + tag.name + '</H3></DT><DL id="' + tag.id + '"></DL>'); // 增加文件夹
                    db.getExportBookmarksByTag(tag.id)
                        .then((bookmarks) => {
                            bookmarks.forEach((bookmark) => {
                                $('#' + bookmark.tag_id).append('<DT><A HREF="' + bookmark.url + '" ADD_DATE="' + parseInt(new Date(bookmark.created_at).getTime() / 1000) + '">' + bookmark.title + '</A></DT>');
                            });
                            if (tagIndex == tags.length - 1) {
                                console.log('export bookmarks document construct end...');
                                var now = new Date().format('yyyyMMddhhmmss')
                                var fileName = 'exportbookmark-' + req.session.username + '-' + now + '.html';
                                var filePath = path.join(path.resolve(__dirname, '..'), 'uploads', fileName);
                                fs.writeFile(filePath, beautify_html($.xml(), {
                                    indent_size: 4,
                                }), function(err) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        res.download(filePath, function(err) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                console.log('download filePath[ ' + filePath + ' ]success!');
                                            }
                                        });
                                    }
                                })
                            }
                        })
                        .catch((err) => {
                            console.log('getExportBookmarksByTag err', err);
                        })
                })
            })
            .catch((err) => {
                console.log('exportbookmark err', err);
            });
    } else {
        res.send(401);
    }
});

function md5(str) {
    return crypto.createHash('md5').update(str).digest('hex');
};

function copyFile(sourceFile, destFile) {
    fs.exists(sourceFile, function(exists) {
        if (exists) {
            var readStream = fs.createReadStream(sourceFile);
            var writeStream = fs.createWriteStream(destFile);
            readStream.pipe(writeStream);
        }
    });
}

function curentDate(i, f) {
    if (i == undefined) {
        i = 0;
    }
    if (f == undefined) {
        f = 'yyyyMMddhhmmss'
    }
    var now = new Date();
    now.setTime(now.getTime() + i * 24 * 60 * 60 * 1000);
    var clock = now.format(f);
    return (clock);
}

module.exports = api;
