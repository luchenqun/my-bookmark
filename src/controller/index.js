const Base = require('./base.js');

module.exports = class extends Base {
  async indexAction() {
    await this.display("index.html");
  }
};
