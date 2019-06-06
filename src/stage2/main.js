// Imports
var torrent = require("./torrent");
var ui = require("./ui");
var JSZip = require("jszip");

function main(magnet) {
    ui.init();

    var client = torrent.start(magnet);
    console.log("Loading metadata...");
    client.on('torrent', function(t) {
        console.log("Metadata loaded!");
        window.setInterval(function() {
            logStatus(t)
        }, 5000);
        t.on('download', function() {
            logStatus(t);
        });
        t.on('done', extractStage3(t));
    });

}

function logStatus(t) {
    ui.renderStatus(torrent.status(t));
}

function extractStage3(t) {
    var file = t.files[0];
    file.getBlob(function(error, blob) {
        if (error) throw error;
        var zip = new JSZip();
        zip.loadAsync(blob).then(parseStage3);
    });
}

function parseStage3(zipFile) {
    console.log("Stage 3 downloaded! Unzipping...");
    window.zipFile = zipFile;
    zipFile.file("index.html").async("string").then(ui.parsePage);
}

// Grab a lock
if (window.hasOwnProperty("hgscn2")) {
    console.log("hgscn2 already running.  Giving up.");
} else {
    window.hgscn2 = "1";

    if (typeof(m) !== "undefined") {
        main(m);
    } else {
        main(prompt("Magnet?"));
    }
}
