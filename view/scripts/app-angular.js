var app = angular.module('bookmarkApp', ['ui.router', 'ngCookies', 'infinite-scroll', 'angular-sortable-view', 'ngDialog']);

axios.defaults.baseURL = '/api/';

function get(url, params) {
  params = params || {};
  return new Promise((resolve, reject) => {
    axios.get(url, { params }).then(res => resolve(res)).catch(err => reject(err))
  });
}

function post(url, params) {
  return new Promise((resolve, reject) => {
    axios.post(url, params || {}).then(res => resolve(res)).catch(err => reject(err))
  });
}

axios.interceptors.request.use(config => {
  config.headers.Authorization = localStorage.getItem("authorization");
  return config;
})

// 添加响应拦截器
axios.interceptors.response.use(function (response) {
  let reply = response.data;
  if (reply.code === 0) {
    if (reply.msg) {
      toastr.success(reply.msg, "提示");
    }
    return Promise.resolve(reply.data);
  } else {
    toastr.error(`错误信息：${reply.msg}(错误码：${reply.code})`, '请求错误');
    if (reply.code == 401) {
      let hash = document.location.hash;
      let origin = document.location.origin;
      if (!(hash == "#/login" || hash == "#/")) {
        window.location.href = `${origin}/#/login`;
      }
    }
    return Promise.reject(reply);
  }
}, function (error) {
  toastr.error(`错误信息：${error.toString()}`, '网络错误');
  return Promise.reject(error);
});

app.config(function ($stateProvider, $urlRouterProvider, $httpProvider) {
  $urlRouterProvider.otherwise("/");

  $stateProvider
    .state('bookmarks', {
      url: '/bookmarks',
      templateUrl: 'views/bookmarks.html',
      controller: 'bookmarksCtr'
    })
    .state('hot', {
      url: '/hot',
      templateUrl: 'views/hot.html',
      controller: 'hotCtr'
    })
    .state('note', {
      url: '/note',
      templateUrl: 'views/note.html',
      params: {
        keyword: null,
        key: null,
      },
      controller: 'noteCtr'
    })
    .state('search', {
      url: '/search',
      templateUrl: 'views/search.html',
      params: {
        keyword: null,
      },
      controller: 'searchCtr'
    })
    .state('tags', {
      url: '/tags',
      templateUrl: 'views/tags.html',
      params: {
        tagId: null,
        orderIndex: null,
      },
      controller: 'tagsCtr'
    })
    .state('advice', {
      url: '/advice',
      templateUrl: 'views/advice.html',
      controller: 'adviceCtr'
    })
    .state('settings', {
      url: '/settings',
      templateUrl: 'views/settings.html',
      params: {
        formIndex: null,
      },
      controller: 'settingsCtr'
    })
    .state('login', {
      url: '/login',
      templateUrl: 'views/login.html',
      controller: 'loginCtr'
    })
    .state('/', {
      url: '/',
      templateUrl: 'views/home.html',
      controller: 'homeCtr'
    });
});

console.log([
  "                   _ooOoo_",
  "                  o8888888o",
  "                  88\" . \"88",
  "                  (| -_- |)",
  "                  O\\  =  /O",
  "               ____/`---'\\____",
  "             .'  \\\\|     |//  `.",
  "            /  \\\\|||  :  |||//  \\",
  "           /  _||||| -:- |||||-  \\",
  "           |   | \\\\\\  -  /// |   |",
  "           | \\_|  ''\\---/''  |   |",
  "           \\  .-\\__  `-`  ___/-. /",
  "         ___`. .'  /--.--\\  `. . __",
  "      .\"\" '<  `.___\\_<|>_/___.'  >'\"\".",
  "     | | :  `- \\`.;`\\ _ /`;.`/ - ` : | |",
  "     \\  \\ `-.   \\_ __\\ /__ _/   .-` /  /",
  "======`-.____`-.___\\_____/___.-`____.-'======",
  "                   `=---='",
  "^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^",
  "              佛祖保佑     永无BUG",
  "          写字楼里写字间，写字间里程序员；",
  "          程序人员写程序，又拿程序换酒钱。",
  "          酒醒只在网上坐，酒醉还来网下眠；",
  "          酒醉酒醒日复日，网上网下年复年。",
  "          但愿老死电脑间，不愿鞠躬老板前；",
  "          奔驰宝马贵者趣，公交自行程序员。",
  "          别人笑我忒疯癫，我笑自己命太贱；",
  "          不见满街漂亮妹，哪个归得程序员？",
].join('\n'));

// console.log = function(){}
