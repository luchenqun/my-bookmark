var jsdom = require("jsdom");
var fs = require("fs");

var parsehtml = function(file, callback) {
    // var html = fs.readFileSync(file).toString();

    fs.readFile(file, (err, data) => {
        if (err) throw err;
        var html = data.toString();
        jsdom.env({
            html: html,
            scripts: ["./public/scripts/externe/jquery-3.1.1.min.js"],
            done: function(errors, window) {
                var $, anchors, itemdoubleclick, results, allTags, bookmarks;
                $ = window.$;
                itemdoubleclick = "";
                allTags = [];
                bookmarks = [];
                results = {};

                anchors = $("dl").find("a");
                anchors.each(function(i, e) {
                    var add_date, name, bookmark, tags, url;
                    url = $(e).attr("href");
                    name = $(e).text();
                    add_date = $(e).attr("add_date");
                    tags = new Array();
                    $(e).parents("dl").each(function(ii, ee) {
                        var folder, tag;
                        folder = $(ee).prev();
                        tag = folder.text().replace(/(^\s*)|(\s*$)/g, '').replace(/\s+/g, ' ');
                        if (tag != "Bookmarks" && tag != "书签栏" && tag != "") {
                            if (allTags.indexOf(tag) == -1) {
                                allTags.push(tag);
                            }
                            return tags.push(tag);
                        }
                    });
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
            }
        });
    });
};

module.exports = parsehtml;
