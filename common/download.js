var request = require('request');
var fs = require('fs');

var download = function(url, dest, cb) {
    var file = fs.createWriteStream(dest);
    var sendReq = request.get(url);

    var error = null;
    sendReq.on('response', function(response) {
        if (response.statusCode !== 200) {
            error = 'Response status was ' + response.statusCode;
        }
    });

    sendReq.on('error', function(err) {
        fs.unlink(dest);
        error = err
    });

    sendReq.pipe(file);

    file.on('finish', function() {
        file.close(cb(error));
    });

    file.on('error', function(err) {
        fs.unlink(dest);
        error = err.message;
    });
};

module.exports = download;
