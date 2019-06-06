var template = require("string-template");

// Yes, this is gross
// Technically there could be a separate template for when only one
// host is used for stage 2 hosting.
// Furthermore, it's possible that for some uris just generating the raw html
// might be smaller.
JS_TEMPLATE = (
    // Note the body is required here to force the script to not be in <head>
    // Possible optimization: use something like <br/> (or just <b> and don't close if lazy)
    // or some other content tag to force </head>
    "<body><script>" +
    'm={magnet};' + // Stage 2 reads this variable later
    "{uris}.forEach(function(x){" +
    'e=document.createElement("script");' +
    'e.setAttribute("src",x);' +
    'e.setAttribute("integrity",{sri});' +
    'e.setAttribute("crossorigin","anonymous");' + // Is this actually required?
    'e.setAttribute("async", "");' + // defer might be better here?
    "document.body.appendChild(e);" +
    "})" +
    "</script></body>"
);

function generateStage1(stage2_uris, stage2_hash, magnet, encoding) {
    var body = template(JS_TEMPLATE, {
        "uris": JSON.stringify(stage2_uris),
        "sri": JSON.stringify("sha256-" + stage2_hash),
        "magnet": JSON.stringify(magnet),
    })

    var res = "data:text/html";

    if (encoding == "base64") {
        res += ";base64," + (new Buffer(body).toString("base64"));
    } else if (encoding == "urlencode") {
        res += "," + encodeURIComponent(body);
    } else {
        res += "," + body;
    }

    return res;
}

if (require.main === module) {
    var argparse = require("argparse");

    parser = new argparse.ArgumentParser({
        description: "Generate stage 1 data URI"
    });
    parser.addArgument("magnet", {
        metavar: "MAGNET",
        type: String,
        help: "Magnet URI for the torrent (should include infohash, trackers, and peers"
    });
    parser.addArgument("stage2_hash", {
        metavar: "HASH",
        type: String,
        help: "Base64 SHA-256 sum hash of stage 2 javascript file"
    });
    parser.addArgument("stage2_uris", {
        metavar: "STAGE2",
        type: String,
        nargs: "+",
        help: "An HTTP(s) URI for the stage 2 javascript"
    });
    parser.addArgument("--base64", {
        action: "storeTrue",
        help: "Base64 encode the data uri"
    });
    parser.addArgument("--urlencode", {
        action: "storeTrue",
        help: "URL encode the data uri"
    });

    args = parser.parseArgs()

    var encoding;
    if (args.base64) {
        encoding = "base64";
    } else if (args.urlencode) {
        encoding = "urlencode";
    } else {
        encoding = "none";
    }

    console.log(generateStage1(args.stage2_uris, args.stage2_hash, args.magnet, encoding));
}

module.exports = {
    "generateStage1": generateStage1,
}