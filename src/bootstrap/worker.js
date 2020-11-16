// invoked in worker
think.beforeStartServer(async () => {
  const username = 'test';
  let user = await this.model("users").where({ username }).find();
  if (think.isEmpty(user)) {
    await this.model("users").add({ username, password: 'e10adc3949ba59abbe56e057f20f883e', email: 'ilovejiajia@qq.com' });
  }
})