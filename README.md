# HgSCN2

This repository contains the necessary javascript for securely 
bootstrapping a static website from just a data URI and webtorrent.

This is a prototype of one way of implementing a censorship resistantish 
static site loader with minimal dependencies and strong trust. It's not 
intended for production use.

# Building

You'll need to install the deps. Use `npm install`.

Now you can use `node src/frontend.js` to run the frontend/builder tool.

# Design

We use three stages for loading our sites. At a high level:

1. The first stage uses a data URI with mimetype text/html, it loads the 
second stage and passes it a magent URI for the site.

2. The second stage is a static site-agnostic Javascript file, that is 
generated via webpack. It contains webtorrent.js and some code for UI 
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
resliency property of describing many sources to fetch stage 2 and 3, so 
a balance must be struck.

## Stage 2

Stage 2 is a javascript file, that uses the metadata from stage 1 to 
fetch and load the target website. Stage 1 has passed a bittorrent 
magnet link to Stage 2, which contains:

* The infohash of the stage 3 blob.
* Potential webtorrent trackers to use.
* Potential direct seeds (HTTP) to use.

Once stage 2 succesfully loads stage 3, it also will act as a seeder for other clients to downloads stage 3.

## Stage 3

Stage 3 is generally speaking an arbitrary HTML/CSS/JS static site. Some care needs
to be taken to transform the content into a form that can work without actually being loaded
from an origin (it is loaded, technically, from a blob uri).

# Takedown resistence

There are a few points of failure in this design, but all of them can be scaled horizontally:

1. Hosts for stage 2 javascript.
2. Webtorrent trackers.
3. STUN servers for WebRTC (only sort of required, technically?).
4. Peers/HTTP seeds for stage 3.

Note that the first three services are entirely content agnostic.

# Notes

Developed by Allan Wirth and Harlan Lieberman-Berg.

Named after Mercury(II) thiocyanate, more commonly known as "Pharaoh's Serpent".

See COPYING for license details. It's MIT, copyright Akamai Technologies Inc.
