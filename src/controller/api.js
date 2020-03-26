const Base = require('./base.js');
const crypto = require('crypto');
const fs = require('fs-extra');

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
};

module.exports = class extends Base {
  async __before() {
    if (['register', 'login'].indexOf(this.ctx.action) >= 0) {
      return;
    }
    try {
      let user = await this.session('user');
      if (think.isEmpty(user.id)) {
        return this.fail(401, '请先登录');
      }
      this.ctx.state.user = user;
    } catch (error) {
      // 获取用户的 session 信息，如果为空，返回 false 阻止后续的行为继续执行
      return this.fail(401, '请先登录:' + error.toString());
    }
  }

  indexAction() {
    return this.display();
  }

  // 注册
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

  // 登陆
  async loginAction() {
    try {
      let post = this.post();
      post.password = md5(post.password); // 进行密码加密

      let data = await this.model('users').where({ username: post.username, password: post.password }).find();
      if (think.isEmpty(data)) {
        this.json({ code: 2, msg: "账号或者密码错误" });
      } else {
        delete data.password;
        const token = await this.session('user', {
          id: data.id,
          username: data.username
        });
        data.token = token;
        this.json({ code: 0, data, msg: "登陆成功" });
      }
    } catch (error) {
      this.json({ code: 1, data: '', msg: error.toString() });
    }
  }

  // 通过session获取自己信息
  async ownAction() {
    let full = this.get().full;
    if (full) {
      let data = await this.model('users').where({ id: this.ctx.state.user.id }).find();
      delete data.password;
      this.json({ code: 0, data, msg: '' });
    } else {
      this.json({ code: 0, data: this.ctx.state.user, msg: '' });
    }
  }

  // 获取分类信息
  async tagsAction() {
    let param = this.get();
    let tags = await this.model('tags').where({ userId: this.ctx.state.user.id }).order('sort ASC, lastUse DESC').select();
    // 这个分类包含的书签与备忘录的个数
    for (let tag of tags) {
      if (param.bookmarkCount) {
        tag.bookmarkCount = await this.model('bookmarks').where({ tagId: tag.id }).count();
      }
      if (param.notes) {
        tag.bookmarkCount = await this.model('notes').where({ tagId: tag.id }).count();
      }
    }
    this.json({ code: 0, data: tags, msg: '' });
  }

  async addTagAction() {
    let name = this.post().name;
    try {
      let res = await this.model("tags").add({
        userId: this.ctx.state.user.id,
        name
      });
      this.json({ code: 0, data: res, msg: `分类 ${name} 添加成功` });
    } catch (error) {
      this.json({ code: 1, data: '', msg: error.toString() });
    }
  }

  async addBookmarkAction() {
    let bookmark = this.post();
    bookmark.userId = this.ctx.state.user.id;
    try {
      let res = await this.model("bookmarks").add(bookmark);
      this.json({ code: 0, data: res, msg: `书签 ${bookmark.title} 添加成功` });
    } catch (error) {
      this.json({ code: 1, data: '', msg: error.toString() });
    }
  }

  // 根据书签id获取书签
  async getBookmarksByTagAction() {
    let tagId = this.get("tagId");
    let showType = this.get("showType") || "createdAt";
    // tagId = -1 个人定制 从自己里面取
    // tagId = -2 全局定制 从非个人里面取
    let where = {};
    let order = showType + ' DESC';

    if (tagId == -1) {
      where = { userId: this.ctx.state.user.id };
    } else if (tagId == -2) {
      where = { userId: ['!=', this.ctx.state.user.id] };
    } else {
      where = { tagId };
    }

    try {
      let data = await this.model('bookmarks').where(where).order(order).page(this.get('page'), this.get('pageSize')).countSelect();
      this.json({ code: 0, data });
    } catch (error) {
      this.json({ code: 1, msg: error.toString() });
    }
  }

};
