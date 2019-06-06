// Imports
var webtorrent = require("webtorrent");

var Start = function(magnet) {
    var client = new webtorrent();

    client.add(magnet)
    return client;
};

var Status = function(t) {
    return {
        timeRem: Math.ceil(t.timeRemaining / 1000),
        percentDone: t.progress * 100,
        ratio: t.ratio,
        numPeers: t.numPeers,
        upSpeed: Math.floor(t.uploadSpeed / 1024),
        downSpeed: Math.floor(t.downloadSpeed / 1024),
    };
};

// Exports
module.exports = {
    start: Start,
    status: Status,
}
