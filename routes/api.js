var api = require('express').Router();

api.get('/bookmarks', function(req, res) {
    console.log('hello bookmarks', JSON.stringify(req.query));

    var data = [{
        title: '谷歌',
        description: '一个网站',
        create_date: '20161025',
        click_count: parseInt(Math.random() * 100),
        click_latest_date: '20161025',
        url: 'https://www.google.com.hk/',
        tags: ['搜索', '常用']
    }, {
        title: '百度',
        description: '二个网站',
        create_date: '20161025',
        click_count: parseInt(Math.random() * 100),
        click_latest_date: '20161025',
        click_count: parseInt(Math.random() * 100),
        url: 'https://www.baidu.com/',
        tags: ['搜索', '常用']
    }, {
        title: '博客',
        description: '三个网站',
        create_date: '20161025',
        click_count: parseInt(Math.random() * 100),
        click_latest_date: '20161025',
        click_count: parseInt(Math.random() * 100),
        url: 'http://luchenqun.com/',
        tags: ['博文', '常用']
    }, {
        title: '腾讯',
        description: '四个网站',
        create_date: '20161025',
        click_count: parseInt(Math.random() * 100),
        click_latest_date: '20161025',
        click_count: parseInt(Math.random() * 100),
        url: 'http://www.qq.com/',
        tags: ['新闻', '常用']
    }, {
        title: '知乎',
        description: '五个网站',
        create_date: '20161025',
        click_count: parseInt(Math.random() * 100),
        click_latest_date: '20161025',
        click_count: parseInt(Math.random() * 100),
        url: 'http://www.zhihu.com/',
        tags: ['问题', '常用']
    }]
    res.json(data);
});

api.get('/tags', function(req, res) {
    console.log('hello tags', JSON.stringify(req.query));
    var data = ['搜索', '常用', '新闻', '博文', 'JavaScript']
    res.json(data);
});

module.exports = api;
