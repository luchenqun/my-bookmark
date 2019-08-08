app.factory('dataService', [function() {
    const service = {
        // 登陆索引
        LoginIndexBookmarks: 0,
        LoginIndexTags: 1,
        LoginIndexNote: 2,
        LoginIndexHot: 3,
        LoginIndexSettings: 4,
        LoginIndexAdvice: 5,
        LoginIndexPraise: 6,

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
            title: '分类'
        }, {
            uiSref: 'note',
            title: '备忘'
        }, {
            uiSref: 'weixin-article',
            title: '热门'
        }, {
            uiSref: 'settings',
            title: '设置'
        }, {
            uiSref: 'advice',
            title: '留言'
        }],
        notLoginMenus: [{
            uiSref: '/',
            title: '首页'
        }, {
            uiSref: 'login',
            title: '登录'
        }, {
            uiSref: 'weixin-article',
            title: '热门'
        }],
        animationIndex: 0,
        animation: function() {
            var data = ['scale', 'fade', 'fade up', 'fade down', 'fade left', 'fade right', 'horizontal flip',
                'vertical flip', 'drop', 'fly left', 'fly right', 'fly up', 'fly down', 'swing left', 'swing right', 'swing up', 'swing down',
                'browse', 'browse right', 'slide down', 'slide up', 'slide left', 'slide right', 'jiggle', 'shake', 'pulse', 'tada', 'bounce'
            ];

            var t = data[parseInt(Math.random() * 1000) % data.length];
            return 'fade' || t; // 去掉一些有攻击性的动画
        },
        transition: function(selector, params) {
            var data = {};
            data.animation = (params && params.animation) ? params.animation : service.animation();
            data.duration = (params && params.duration) ? params.duration : 500;
            data.onComplete = function() {
                if (params) {
                    if (params.state == 'hide') {
                        $(selector).hide();
                    } else if (params.state == 'show') {
                        $(selector).show();
                    } else if (params.state == 'remove') {
                        $(selector).remove();
                    } else {
                        $(selector).show();
                    }
                    params.cb && params.cb(); // 完成之后回调！
                } else {
                    $(selector).show();
                }

            }
            $(selector).transition('hide'); // 不管怎样，先隐藏
            $(selector).transition(data); //这个执行完之后一定是show

            return $(selector).length >= 1;
        },
        historyTypes: ['书签', '谷歌', 'Github', '栈溢出', '百度', '备忘录'],
        showStyles: ['navigate', 'costomTag', 'card', 'table'],
        forbidQuickKey: {
            'A': '在任意界面，已用做新增备忘录',
            'C': '在有关书签页面，用作复制书签链接',
            'E': '在有关书签页面，用作编辑书签',
            'D': '在有关书签页面，用作删除书签',
            'I': '在有关书签页面，用作查看书签详情',
            'R': '在热门收藏界面，已用作随机查看热门收藏',
            'S': '在任意界面，已用做快速进入搜索页面',
            'INSERT': '全局页面，已用做添加书签',
            'ESC': '全局页面，已用做退出弹窗',
            ',': '跳转到分类定制点击次数',
            '.': '跳转到分类定制添加日期',
            '/': '跳转到分类定制最后点击',
        },
        keyShortcuts: function() { // 判断快捷方式是否生效
            var ret = true;
            var menusScope = $('div[ng-controller="menuCtr"]').scope();
            var login = (menusScope && menusScope.login);
            var longPress = (menusScope && menusScope.longPress);

            if (login && (!longPress)) {
                do {
                    // 如果有对话框(删除，备忘录详情等)
                    ret = $(".ngdialog").length == 0;
                    if (!ret) break;

                    // 如果有对话框(新增书签，更新书签，书签详情)
                    ret = $(".ui.modals.visible").length == 0;
                    if (!ret) break;

                    // 输入框是否聚焦
                    ret = !($('input').is(':focus'));
                    if (!ret) break;

                    // textarea 是否聚焦
                    ret = !($('textarea').is(':focus'));
                    if (!ret) break;

                } while (false);
            } else {
                ret = false;
            }

            return ret;
        },
        clipboard: function(text) {
            $("#clipboard").attr("data-clipboard-text", text);
            document.getElementById("clipboard").click();
        },
        smallDevice: function() {
            var u = navigator.userAgent;
            var app = navigator.appVersion;
            var device = { //移动终端浏览器版本信息
                trident: u.indexOf('Trident') > -1, //IE内核
                presto: u.indexOf('Presto') > -1, //opera内核
                webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
                gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //火狐内核
                mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端
                ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
                android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //android终端或uc浏览器
                iPhone: u.indexOf('iPhone') > -1, //是否为iPhone或者QQHD浏览器
                iPad: u.indexOf('iPad') > -1, //是否iPad
                webApp: u.indexOf('Safari') == -1 //是否web应该程序，没有头部与底部
            };

            if((device.mobile && !device.iPad) || (screen && screen.availWidth < 768)){
                return true;
            }

            return false;
        },
        netErrorHandle(err, $state) {
            if(err == "Unauthorized") {
                $state.go("login");
                toastr.error('您好像没有登陆，或者登陆session过期了，请重新登陆！', "提示");
            }
        }
    };

    return service;
}]);
