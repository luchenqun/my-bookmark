const Base = require('./base.js');

module.exports = class extends Base {
  indexAction() {
    return this.display();
  }

  async registerAction() {
    try {
      let data = this.post();
      let res = await this.model("users").add(data);
      this.json({ code: 0, data: res, msg: "注册成功" });
    } catch (error) {
      this.json({ code: 1, data: '', msg: error.toString() });
    }
  }

  autoLoginAction() {
    this.json({ "succ": true });
  }
};
