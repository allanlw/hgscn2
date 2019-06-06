Stage 1
=======

This directory contains a script generate_stage1.js that will generate
a stage1 data URI.

Currently, it requires advance knowledge of the sha256 hash of the stage 2
javsascript file. This can be generated with:

    openssl dgst -sha256 -binary FILENAME.js | openssl base64 -A

Possible future improvements:

  - Optimization/minimization of the template payload HTML/JS
  - Fetching the target URIs and computing the hash in the script
  - Support for sha384 or sha512 SRI if desired
  - Check in the script for supported CORS settings
  - Checks/warnings around the magnet URI (ex. no trackers or peers)
