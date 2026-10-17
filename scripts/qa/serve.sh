#!/bin/bash
# Start the Jekyll dev server on :4000 (run in the background, e.g. `nohup scripts/qa/serve.sh &`).
# Stop it with: fuser -k 4000/tcp   (do NOT use `pkill -f`, it can kill the calling shell).
cd "$(dirname "$0")/../.."
export PATH="$HOME/.rbenv/shims:$PATH"
exec bundle exec jekyll serve -q -P 4000 -d "${TMPDIR:-/tmp}/ryanward-site-serve"
