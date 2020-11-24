// invoked in worker
const { execSync } = require('child_process');
const os = require("os");
think.beforeStartServer(async () => {
  if (os.platform().startsWith("linux")) {
    try {
      execSync('service mysql start', { stdio: ['inherit', 'inherit', 'inherit'] });
    } catch (error) {
      console.log("beforeStartServer", error);
    }
  }

  const username = 'test';
  let user = await think.model("users").where({ username }).find();
  if (think.isEmpty(user)) {
    await think.model("users").add({ username, password: 'e10adc3949ba59abbe56e057f20f883e', email: 'ilovejiajia@qq.com' });
  }
})