#!/usr/bin/env node
var argparse = require("argparse");
var browserify = require("browserify");
var fs = require('fs');
var path = require("path");
var archiver = require('archiver');
var createTorrent = require('create-torrent');
var parseTorrent = require('parse-torrent');
var crypto = require('crypto');
var http = require('http');
var WebTorrent = require('webtorrent-hybrid');

var parser = new argparse.ArgumentParser({
    description: "Generate Hg(SCN)_2 sites"
});
parser.addArgument("-d", {
    action: "storeTrue",
    help: "Serve locally on 8080"
});
parser.addArgument("indir", {
    metavar: "INDIR",
    type: String,
    help: "Input directory containing site to pack"
});
parser.addArgument("outdir", {
    metavar: "OUTDIR",
    type: String,
    help: "Output directory for assets"
});
parser.addArgument("stage2_uris", {
    metavar: "STAGE2",
    type: String,
    nargs: "*",
    help: "An HTTP(s) URI for where to expect stage 2 javascript"
});

var args = parser.parseArgs()

//   1. Zip up the indir, and store it in OUTDIR/stage3.zip
//   Returns a promise for having done the work
function buildStage3(indir, outf) {
    return new Promise(function(accept, reject) {
        var output3 = fs.createWriteStream(outf);
        output3.on('close', function() {
            accept();
        });

        var archive = archiver('zip');
        archive.on('error', function(err) {
            reject(err);
        });
        archive.pipe(output3);
        archive.directory(indir, "");
        archive.finalize();
    });
}

//   2. Generate a .torrent file for OUTDIR/stage3.zip -> OUTDIR/stage3.zip.torrent
//   Returns a promise for the magnet link
function buildStage3Torrent(inf, outf) {
    return new Promise(function(accept, reject) {
        createTorrent(inf, function(err, torrent) {
            if (err) {
                reject(err);
                return;
            }

            fs.writeFile(outf, torrent, function(err) {
                if (err) {
                    reject(err);
                    return;
                }

                accept(parseTorrent.toMagnetURI(parseTorrent(torrent)));
            });

        });
    });
}

//   3. Generate a stage2, and save it in OUTDIR/stage2.js
//   Returns a promise for the hash of the stage2 js
function buildStage2(outf) {
    return new Promise(function(accept, reject) {
        var output2 = fs.createWriteStream(outf);
        output2.on('close', function() {
            accept(hash.digest('base64'));
        });

        var hash = crypto.createHash("sha256");

        var b = browserify();
        b.add("./src/stage2/main.js");
        var bundle = b.bundle();
        bundle.pipe(hash, {
            end: false
        });
        bundle.pipe(output2);
    });
}

//   4. Generate a stage1, and save it in OUTDIR/stage1.txt
//   Returns a promise for the final data uri
function buildStage1(stage2_hash, stage2_uris, magnet, outf) {
    var gen = require("./stage1/generate_stage1.js");

    return new Promise(function(accept, reject) {
        var uri = gen.generateStage1(stage2_uris, stage2_hash, magnet, 'base64');
        var output1 = fs.createWriteStream(outf);

        output1.on('close', function() {
            accept(uri);
        });
        output1.write(uri);
        output1.end();
    });
}

// build step1..step4
function allSteps(indir, stage3_zip, stage3_torrent, stage2_js, stage1_txt, stage2_uris) {
    return Promise.all([
        buildStage3(indir, stage3_zip).then(function() {
            return buildStage3Torrent(stage3_zip, stage3_torrent);
        }),
        buildStage2(stage2_js),
    ]).then(function(res) {
        console.log("magnet: " + res[0]);
        return buildStage1(res[1], stage2_uris, res[0], stage1_txt);
    });
}

// Serve locally
function serveDaemon(stage3_torrent, stage2_js, outdir) {
    console.log("starting web server...");
    var server = http.createServer(function(request, response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        fs.createReadStream(stage2_js).pipe(response);
    });
    server.listen(8080, function() {
        console.log("web server started");
    });

    var client = new WebTorrent();
    var torrent = client.add(stage3_torrent, {
        path: outdir
    });

    function report() {
        console.log("peers: " + torrent.numPeers + " uploaded: " + torrent.uploaded + " speed: " + (torrent.uploadSpeed / 1024).toFixed(2) + " kb/s");
    }

    torrent.on('upload', report);
    setInterval(report, 5000);
}

var stage3_zip = path.join(args.outdir, "stage3.zip");
var stage3_torrent = stage3_zip + ".torrent";
var stage2_js = path.join(args.outdir, "stage2.js");
var stage1_txt = path.join(args.outdir, "stage1.txt");
var stage2_uris = args.stage2_uris.slice();
var indir = args.indir;

if (args.d) {
    stage2_uris.unshift("http://localhost:8080/stage2.js");
}

if (stage2_uris.length === 0) {
    console.log("At least one stage2 URI must be provided!!");
    process.exit(1);
}

try {
  fs.mkdirSync(args.outdir);
} catch(e) {}

allSteps(indir, stage3_zip, stage3_torrent, stage2_js, stage1_txt, stage2_uris).then(function(datauri) {
    console.log("done building");
    if (args.d) {
        serveDaemon(stage3_torrent, stage2_js, args.outdir);
    }
    console.log(datauri);
}, function(e) {
    console.log(e);
});
