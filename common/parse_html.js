var cheerio = require("cheerio");
var fs = require("fs");

var parsehtml = function (file, callback) {
    // var html = fs.readFileSync(file).toString();
    fs.readFile(file, (err, data) => {
        if (err) throw err;
        var html = data.toString();
        var $, anchors, itemdoubleclick, results, allTags, bookmarks;
        $ = cheerio.load(html);
        itemdoubleclick = "";
        allTags = [];
        bookmarks = [];
        results = {};

        anchors = $("dl").find("a");
        anchors.each(function (i, e) {
            var add_date, name, bookmark, tags, url;
            url = $(e).attr("href");
            name = $(e).text() || "无标题";
            add_date = parseInt($(e).attr("add_date")) * 1000;

            // 只允许用一个标签
            // 只允许用一个标签
            tags = new Array();
            var tag = "未分类";
            $(e).parents("dl").each(function (ii, ee) {
                var folder = $(ee).prev();
                var temp = folder.text().replace(/(^\s*)|(\s*$)/g, '').replace(/\s+/g, ' ');
                if (temp != "Bookmarks" && temp != "书签栏" && temp != "" && temp != undefined) {
                    tag = temp;
                }
            });
            if (allTags.indexOf(tag) == -1) {
                allTags.push(tag);
            }
            tags.push(tag);

            if (name.length > 255) {
                name = name.substring(255);
            }
            name = name.replace(/\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]/gi, "");
            bookmark = {
                url: url,
                name: name,
                add_date: add_date,
                tags: tags
            };
            return bookmarks.push(bookmark);
        });
        if (typeof callback === "function") {
            results.tags = allTags;
            results.bookmarks = bookmarks;
            return callback(results);
        } else {
            return console.warn("Callback isn't a function.");
        }
    })
};

module.exports = parsehtml;
