const Base = require('./base.js');
const crypto = require('crypto');

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
};

module.exports = class extends Base {
  async __before() {
    const user = await this.session('user');
    console.log("session user", user);

    //获取用户的 session 信息，如果为空，返回 false 阻止后续的行为继续执行
    // if (think.isEmpty(user)) {
    //   return false;
    // }
  }

  indexAction() {
    return this.display();
  }

  async registerAction() {
    try {
      let post = this.post();
      post.password = md5(post.password); // 进行密码加密

      let res = await this.model("users").add(post);
      this.json({ code: 0, data: res, msg: "注册成功" });
    } catch (error) {
      this.json({ code: 1, data: '', msg: error.toString() });
    }
  }

  async loginAction() {
    try {
      let post = this.post();
      post.password = md5(post.password); // 进行密码加密

      let data = await this.model('users').where({ username: post.username, password: post.password }).find();
      if (think.isEmpty(data)) {
        this.json({ code: 2, msg: "账号或者密码错误" });
      } else {
        this.json({ code: 0, data, msg: "登陆成功" });
        data.password = "******";
        await this.session('user', data); // @todo 对session的maxAge进行操作(目前默认永久不过期)
      }
    } catch (error) {
      this.json({ code: 1, data: '', msg: error.toString() });
    }
  }

  async userInfoAction() {
    this.json({ code: 1, data: '', msg: '' });
  }

  autoLoginAction() {
    this.json({ "succ": true });
  }
};
