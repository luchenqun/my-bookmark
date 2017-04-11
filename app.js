var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);

var api = require('./routes/api');
var app = express();
var fs = require('fs');
// 创建下载的目录
var folders = ['./uploads', './public/images/favicon', './public/images/snap'];
folders.forEach((folder) => {
    fs.exists(folder, function(exists) {
        if(!exists){
            fs.mkdir(folder,function(err){ if(err) console.error(err); });
        } else {
            console.log(folder + "is exists!");
        }
    });
})

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());

app.use(session({
    rolling: true,
    resave: false, //
    saveUninitialized: true, //
    secret: 'ILoveYiJia', // 建议使用 128 个字符的随机字符串
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 一个月
    },
    store: new mongoStore({
        url: 'mongodb://localhost/mybookmarks'
    })
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', api);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
api.checkSnapFaviconState();
api.getSnapByTimer();
api.getFaviconByTimer();
api.getHotBookmarksByTimer();

module.exports = app;
