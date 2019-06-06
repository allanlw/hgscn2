function init() {
    document.style = "width: 100%; height: 100%; margin: 0px; padding: 0px;";
    document.body.style = "width: 100% height: 100%; margin: 0px; padding: 0px;";

    var wrap = document.createElement("div");
    wrap.id = "hgscn2-wrap";
    wrap.style = "width: 100%; display: flex; flex-flow: column; height: 100%; padding: 0px; margin: 0px;";
    document.body.appendChild(wrap);

    var headerc = document.createElement("div");
    headerc.id = "hgscn2-header-container";
    headerc.style = "flex: 0 1 auto; width: 100%; border-bottom: 1px solid #DDDDDD; position: relative; background-color: #CCCCCC;";
    wrap.appendChild(headerc);

    var header = document.createElement("div");
    header.id = "hgscn2-header";
    header.style = "padding: 0.5em; position:relative; z-index: 2;";
    headerc.appendChild(header);

    var header_bar = document.createElement("div");
    header_bar.id = "hgscn2-header-bar";
    header_bar.style = "top: 0px; left: 0px; background-color: #EEF; position: absolute; bottom: 0px; z-index: 1;";
    headerc.appendChild(header_bar);

    var ifrm = document.createElement("iframe");
    ifrm.id = "hgscn2-ifrm";
    ifrm.style = "flex: 1 1 auto; height: 100%; width: 100%; overflow: hidden; border: none;";
    wrap.appendChild(ifrm);

    renderStatus(null);
}

function parsePage(content) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(content, "text/html");
    console.log("Walking the tree...");

    var coll = doc.documentElement.getElementsByTagName("*");
    var elems = [].slice.call(coll);

    Promise.all(elems.map(checkNode)).then(function() {
        renderPage(doc.lastChild);
    }, function(reason) {
        console.log(reason);
    });
}

function renderStatus(status) {
    var hdr = document.getElementById("hgscn2-header");
    var h = "Hg(SCN)<sub>2</sub>";
    if (status) {
        h += " Percent done: " + (status.percentDone * 1).toFixed(2) +
            " Upload Speed: " + status.upSpeed + " Kb/s" +
            " Download Speed: " + status.downSpeed + " KB/s" +
            " Peer Count: " + status.numPeers;
        var progress = document.getElementById("hgscn2-header-bar");
        progress.style.width = status.percentDone + "%";
    } else {
        h += " Loading...";
    }

    hdr.innerHTML = h;
}

//
// Internal Functions
//

function checkNode(node) {
    var proms = [];
    switch (node.nodeName) {
        case "A":
            // Need to redirect these
            break;
        case "LINK":
            if (node.getAttribute("rel") == "stylesheet") {
                proms.push(fixNode(node, "href"));
            }
            break;
        case "OBJECT":
            proms.push(fixNode(node, "data"));
            break;
        default:
            proms.push(fixNode(node, "href"));
            proms.push(fixNode(node, "src"));
    };
    return Promise.all(proms);
}


function fixNode(node, attr) {
    return new Promise(function(resolve, reject) {
        var src = node.getAttribute(attr);
        if (!src || /^((https?:)?\/\/|data:)/.test(src)) {
            resolve();
            return;
        }

        var filename = stripSlash(src);
        var f = window.zipFile.file(filename);
        if (!f) {
            console.log(src);
            console.log("The URL " + filename + " has no match!");
            node.setAttribute(attr, "about:blank");
            reject();
            return;
        }

        f.async("arraybuffer").then(function(data) {
            console.log("Got zip!");

            var aBlob = new Blob([data]);
            node.setAttribute(attr, URL.createObjectURL(aBlob));
            resolve();
        }, reject);
    });
}

function renderPage(page) {
    var iframe = document.getElementById("hgscn2-ifrm");
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.appendChild(page);
    iframe.contentWindow.document.close();
}

function stripSlash(filename) {
    if (filename.startsWith("/")) {
        return filename.slice(1);
    } else {
        return filename;
    }
}

// Exports
module.exports = {
    init: init,
    parsePage: parsePage,
    renderStatus: renderStatus
}
