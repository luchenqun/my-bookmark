app.factory('dataService', [function() {
    const service = {
        // 登陆索引
        LoginIndexBookmarks: 0,
        LoginIndexTags: 1,
        LoginIndexNote: 2,
        LoginIndexHot: 3,
        LoginIndexSettings: 4,
        LoginIndexPraise: 5,
        LoginIndexAdvice: 6,

        // 非登陆索引
        NotLoginIndexHome: 0,
        NotLoginIndexLogin: 1,
        NotLoginIndexHot: 2,
        NotLoginIndexPraise: 3,

        loginMenus: [{
            uiSref: 'bookmarks',
            title: '书签'
        }, {
            uiSref: 'tags',
            title: '书签分类'
        }, {
            uiSref: 'note',
            title: '备忘录'
        }, {
            uiSref: 'hot',
            title: '热门收藏'
        }, {
            uiSref: 'settings',
            title: '设置'
        }, {
            uiSref: 'praise',
            title: '赞赏'
        }, {
            uiSref: 'advice',
            title: '留言'
        }],
        notLoginMenus: [{
            uiSref: '/',
            title: '首页'
        }, {
            uiSref: 'login',
            title: '登录|注册'
        }, {
            uiSref: 'hot',
            title: '热门收藏'
        }, {
            uiSref: 'praise',
            title: '赞赏'
        }],
        animationIndex: 0,
        animation: function() {
            var data = ['scale', 'fade', 'fade up', 'fade down', 'fade left', 'fade right', 'horizontal flip',
                'vertical flip', 'drop', 'fly left', 'fly right', 'fly up', 'fly down',
                'browse', 'browse right', 'slide down', 'slide up', 'slide left', 'slide right'
            ];

            var t = data[parseInt(Math.random() * 1000) % data.length];
            return t;
        },
        historyTypes: ['书签', '谷歌', 'Github', '栈溢出', '百度', '备忘录'],
    };

    return service;
}]);
