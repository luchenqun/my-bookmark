const request = require("request");

module.exports = [{
  interval: 1000 * 60 * 10, // 10分钟抓取一次
  immediate: true,
  handle: async () => {
    let form = {
      userId: null,
      lastupdataTime: new Date().getTime(),
      pageNo: 1,
      pageSize: 1000,
      sort: "desc",
      renderType: 0,
      date: think.datetime(new Date(), "YYYY年MM月DD日"),
      idfa: "d4995f8a0c9b2ad9182369016e376278",
      os: "ios",
      osv: "9.3.5"
    };
    const url = "https://api.shouqu.me/api_service/api/v1/daily/dailyMark";
    request.post({ url, form }, async function (error, response, body) {
      if (!error && response && response.statusCode == 200) {
        let data = JSON.parse(body).data;
        let list = data.list;
        let dataList = [];
        for (const item of list) {
          dataList.push({
            id: item.articleId,
            title: item.title,
            url: item.url,
            clickCount: item.favCount,
            tagName: item.sourceName,
            createdAt: think.datetime(item.updatetime > item.createtime ? item.createtime : item.updatetime),
            lastClick: think.datetime(item.updatetime <= item.createtime ? item.createtime : item.updatetime),
            snap: item.images_upd,
            icon: item.sourceLogo.replace("http://shouqu", "https://shouqu")
          })
        }
        await think.model('hot_bookmarks').addMany(dataList, { replace: true });
      }
    })
  }
}]