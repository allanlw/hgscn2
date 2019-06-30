# HgSCN2

This repository contains the necessary javascript for securely 
bootstrapping a static website from just a data URI and webtorrent.

This is a prototype of one way of implementing a censorship resistantish 
static site loader with minimal dependencies and strong trust. It's not 
intended for production use.

# Example

There is a live example at:

> data:text/html;base64,PGJvZHk+PHNjcmlwdD5tPSJtYWduZXQ6P3h0PXVybjpidGloOjk0ODU3NmEyZDhhNjc2NTA0MWE4OWE1YjI3NzU0YWVkYWM4MTdiNDUmZG49c3RhZ2UzLnppcCZ0cj11ZHAlM0ElMkYlMkZleHBsb2RpZS5vcmclM0E2OTY5JnRyPXVkcCUzQSUyRiUyRnRyYWNrZXIuY29wcGVyc3VyZmVyLnRrJTNBNjk2OSZ0cj11ZHAlM0ElMkYlMkZ0cmFja2VyLmVtcGlyZS1qcy51cyUzQTEzMzcmdHI9dWRwJTNBJTJGJTJGdHJhY2tlci5sZWVjaGVycy1wYXJhZGlzZS5vcmclM0E2OTY5JnRyPXVkcCUzQSUyRiUyRnRyYWNrZXIub3BlbnRyYWNrci5vcmclM0ExMzM3JnRyPXdzcyUzQSUyRiUyRnRyYWNrZXIuYnRvcnJlbnQueHl6JnRyPXdzcyUzQSUyRiUyRnRyYWNrZXIuZmFzdGNhc3QubnomdHI9d3NzJTNBJTJGJTJGdHJhY2tlci5vcGVud2VidG9ycmVudC5jb20iO1siaHR0cHM6Ly9mcm9td2hlbmNlaXRjYS5tZS9oZ3NjbjIvdjAuMC4yL3N0YWdlMi5qcyJdLmZvckVhY2goZnVuY3Rpb24oeCl7ZT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCJzY3JpcHQiKTtlLnNldEF0dHJpYnV0ZSgic3JjIix4KTtlLnNldEF0dHJpYnV0ZSgiaW50ZWdyaXR5Iiwic2hhMjU2LU9YSXM2QUxTUEg5OXZGUElpYnJYcit5eG9XckVLWFNFem9IM0orMlU3cTQ9Iik7ZS5zZXRBdHRyaWJ1dGUoImNyb3Nzb3JpZ2luIiwiYW5vbnltb3VzIik7ZS5zZXRBdHRyaWJ1dGUoImFzeW5jIiwgIiIpO2RvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZSk7fSk8L3NjcmlwdD48L2JvZHk+

# Running

You'll need to install the deps. Use `npm install`.

Now you can use `./src/frontend.js` to run the frontend/builder tool.

```
$ ./src/frontend.js  -h
usage: frontend.js [-h] [-d] INDIR OUTDIR [STAGE2 [STAGE2 ...]]

Generate Hg(SCN)_2 sites

Positional arguments:
  INDIR       Input directory containing site to pack
  OUTDIR      Output directory for assets
  STAGE2      An HTTP(s) URI for where to expect stage 2 javascript

Optional arguments:
  -h, --help  Show this help message and exit.
  -d          Serve locally
```

The `INDIR` argument should be a directory that contains (at least) an
`index.html` file, which will be packaged as the site's stage 3.

The `OUTDIR` argument will be where the following files are generated:

* `stage1.txt` this contains the data URI for stage 1.
* `stage2.js` contains the packed javascript for stage 2.
* `stage3.zip` contains the blob of the stage 3 site.
* `stage3.zip.torrent` contains a valid torrent file for the stage 3 blob.

The `STAGE2` arguments are URIs that will be included as potential stage 2
URIs in the stage1 data uri. At least one must be specified, although if
you include `-d`, `http://localhost:8080/` will automatically be included.

If you specify `-d`, after generating all of the files, it will run a webserver
on `localhost:8080`, and run a dual stack webtorrent/bittorrent seed.

# Design

We use three stages for loading our sites. At a high level:

1. The first stage uses a data URI with mimetype text/html, it loads the 
second stage and passes it a magnet URI for the site.

2. The second stage is a static site-agnostic Javascript file, that is 
generated via browserify. It contains webtorrent.js and some code for UI 
and such.

3. The third stage is arbitrary HTML/JS/CSS/etc content. It is delivered 
via webtorrent in the form of a ZIP file.

## Stage 1

Stage 1 is a short text/html data URI that contains a minimal 
'bootloader' and metadata describing how to fetch and trust stage 2 and 
3.

1. A CSP hash of stage 2.

2. A list of possible http(s) URIs to load stage 2 from.

3. A magnet link for stage 3. Note that this contains the 
bittorrent INFOHASH of stage 3, as well as the possible webtorrent 
trackers and HTTP seeds (note: stage 2 can also contain additional trackers).

Because it's intended to be distributed as a data URI, it should be as 
short as possible. This unfortunately directly conflicts with the 
resiliency property of describing many sources to fetch stage 2 and 3, so 
a balance must be struck.

For example, the example data URI above decoded and prettified is:

``` html
<body>
    <script>
        m = "magnet:?xt=urn:btih:948576a2d8a6765041a89a5b27754aedac817b45&dn=stage3.zip&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com";
        ["https://fromwhenceitca.me/hgscn2/v0.0.2/stage2.js"].forEach(function(x) {
            e = document.createElement("script");
            e.setAttribute("src", x);
            e.setAttribute("integrity", "sha256-OXIs6ALSPH99vFPIibrXr+yxoWrEKXSEzoH3J+2U7q4=");
            e.setAttribute("crossorigin", "anonymous");
            e.setAttribute("async", "");
            document.body.appendChild(e);
        })
    </script>
</body>
```

Via the INFOHASH and the CSP hash, stage 1 fully specifies the content of stage 2 and 3 
to prevent tampering.

## Stage 2

Stage 2 is a javascript file, that uses the metadata from stage 1 to 
fetch and load the target website. Stage 1 has passed a bittorrent 
magnet link to Stage 2, which contains:

* The infohash of the stage 3 blob.
* Potential webtorrent trackers to use.

Once stage 2 successfully loads stage 3, it also will act as a seeder for other clients 
to downloads stage 3.

Stage 2 also parses the index HTML for stage 3 and "fixes" any content references 
(stylesheets, scripts, images) in the web page to be proper blob URIs from the 
downloaded zip.

## Stage 3

Stage 3 is a zip file, which must contain at least one file 'index.html' which will
be rendered as the final page.

# Takedown resistance

There are a few points of failure in this design, but all of them can be scaled horizontally:

1. Hosts for stage 2 javascript.
2. Webtorrent trackers.
3. STUN servers for WebRTC (only sort of required, technically?).
4. Peers/HTTP seeds for stage 3.

Note that the first three services are entirely content agnostic, and the fourth set includes
all people currently visiting the site.

# Bugs/Future improvements

* The frontend should be more flexible and allow passing trackers, http seed uris, http 
locations for torrent metadata and/or ability to create 'fat' data links with entire 
torrent metadata.
* Frontend should also allow listening on a different port.
* The fixup stage should support `<a href=` for browsing around on the static site.
* Stage 2 UI could be nicer, handle failure better, and give a copy for the magnet link.
* Port to newer node modules.

# Notes

Developed by Allan Wirth and Harlan Lieberman-Berg.

Named after Mercury(II) thiocyanate, more commonly known as "Pharaoh's Serpent".

See COPYING for license details. It's MIT, copyright Akamai Technologies Inc.
