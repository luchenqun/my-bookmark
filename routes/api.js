
var api = require('express').Router();

api.get('/bookmarks', function (req, res) {
	var data = [
		{title:'谷歌', description:'一个网站', url:'https://www.google.com.hk/', tags:['搜索','常用']},
		{title:'百度', description:'二个网站', url:'https://www.baidu.com/', tags:['搜索','常用']},
		{title:'博客', description:'三个网站', url:'http://luchenqun.com/', tags:['博文','常用']},
		{title:'腾讯', description:'四个网站', url:'http://www.qq.com/', tags:['新闻','常用']},
		{title:'知乎', description:'五个网站', url:'http://www.zhihu.com/', tags:['问题','常用']}
	]
	res.json(data);
});

module.exports = api;
