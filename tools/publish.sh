#!/usr/bin/env bash
# =============================================================================
# publish.sh — push the current build to the public URL, and PROVE it landed.
# =============================================================================
#
#   ./tools/publish.sh              build, test, push, wait, verify
#   ./tools/publish.sh --no-tests   skip the suites (only when you just ran them)
#
#   -> https://dumb-tony.github.io/somethings-different/
#
# Adapted from C:\Dev\BedroomRacers\tools\publish.sh (Dev\INDEX.md -> Publishing).
# The polling logic and the blob-hash comparison are that script's, verbatim in
# spirit: both were learned the hard way over there and cost hours to find.
#
# ONE DIFFERENCE FROM THE ORIGINAL. BedroomRacers keeps its source PRIVATE and
# publishes into a separate repo, so its publish step copies one file across.
# Here the source repo is public and `dist/` IS the clone of the Pages repo, so
# tools\build-share.ps1 writes dist/index.html in place and this script only has
# to commit, push and confirm. dist/ still holds nothing but index.html and its
# README — the game is one self-contained file, so there is nothing else to send.
# =============================================================================
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLISH_DIR="${PUBLISH_DIR:-$ROOT/dist}"
URL="https://dumb-tony.github.io/somethings-different/"
REPO="Dumb-Tony/somethings-different"
RUN_TESTS=1
[ "${1:-}" = "--no-tests" ] && RUN_TESTS=0

[ -d "$PUBLISH_DIR/.git" ] || {
  echo "no publish repo at $PUBLISH_DIR" >&2
  echo "clone https://github.com/$REPO into dist/, or set PUBLISH_DIR" >&2
  exit 2
}

# ── BUILD ────────────────────────────────────────────────────────────────────
# build-share.ps1 writes share.html (unwrapped), dist/index.html (a complete
# document for any static host) and _share-test.html (the wrapped copy the
# suites run against).
echo "building…"
powershell -NoProfile -ExecutionPolicy Bypass -File "$ROOT/tools/build-share.ps1" \
  || { echo "build failed" >&2; exit 1; }

# ── TEST THE BYTES YOU ARE ABOUT TO SEND ─────────────────────────────────────
# Not the working file: the SHIPPED one. They have differed before — the build
# step wraps and inlines, and a wrapper bug is invisible in the source tree.
if [ "$RUN_TESTS" = "1" ]; then
  echo "testing the shippable build…"
  cd "$ROOT" || exit 2
  log="$(mktemp)"
  fails=""
  # One list, counted by the shell. The message under this loop used to say a
  # hardcoded "28 suites" while the loop ran thirty-one - a build report that
  # misstates what it checked is the same bug _balance.js had, and it is worse
  # than no report at all.
  SUITES="m1 m2 m3 m4 m5 m6 m7 m8 m9 m10 m11 m12 m13 m14 m15 m16 m17 m18 m19 m20 m21 m22 m23 m24 m25 m26 m27 m28 m29 m30 m31 m32 m33 m34 m35 m36 m37 m38 m39 m40 m41 m42 m43 m44 m45 m46 m47 m48 m49 m50 m51 m52 m53"
  for s in $SUITES; do
    # RETRY ONCE. The harness flakes about one run in twenty on Chrome startup and
    # reports NO OUTPUT for a suite that is perfectly green. Measured, and it blocked
    # this very release on m18 — which then passed twice in a row by hand. A real
    # failure fails twice; a flake does not.
    ok=0
    for attempt in 1 2; do
      if powershell -NoProfile -ExecutionPolicy Bypass -File tools/smoketest.ps1 \
           -Tests "tools/$s-tests.js" -Game "_share-test.html" >"$log" 2>&1; then
        ok=1; break
      fi
    done
    if [ "$ok" != "1" ]; then
      fails="$fails $s"
      echo "  --- $s (failed twice) ---"
      grep -E "SDTEST|^FAIL|not found|never came up" "$log" | head -4 | sed 's/^/  /'
    fi
  done
  rm -f "$log"
  [ -z "$fails" ] || { echo "SUITES FAILED:$fails — not publishing" >&2; exit 1; }
  echo "all $(echo $SUITES | wc -w) suites green on the shipped bytes"
fi

cd "$PUBLISH_DIR" || exit 2

# Refuse to publish from anything but main: the live site is served from it.
branch="$(git rev-parse --abbrev-ref HEAD)"
[ "$branch" = "main" ] || { echo "publish repo is on '$branch', not main" >&2; exit 2; }

nochange=0
if git diff --quiet -- index.html README.md; then
  # Nothing new to send — but still confirm the URL is serving it, because
  # "the file here is unchanged" and "the link your friend opens is current"
  # are different claims and only the second one matters.
  nochange=1
  echo
  echo "build unchanged — checking the live link is serving it"
else
  git add index.html README.md
  msg="${PUBLISH_MSG:-Update the playable build}"
  git commit -q -m "$msg

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
  git push -q origin main || { echo "push failed" >&2; exit 1; }
fi
want="$(git rev-parse HEAD)"
[ "$nochange" = "1" ] || { echo; echo "pushed ${want:0:7}. Waiting for GitHub Pages…"; }

# ── WAIT FOR THE URL TO SERVE THIS BUILD ─────────────────────────────────────
# Poll the CONTENT, not the build API. Two ways the API misleads, both observed:
#
#   1. `pages/builds/latest` describes the PREVIOUS build for a while after a
#      push, so "status == built" reports success against the build before
#      yours.
#   2. It also goes stale the other way — sitting on an older commit long after
#      the new content is live, so waiting for the sha times out on a deploy
#      that already worked.
#
# What the URL actually returns settles both. Compared by git's own content hash
# and never by byte count: the working copy is CRLF and Pages serves LF, so a
# byte comparison is off by one per line and can never match.
want_blob="$(git rev-parse "HEAD:index.html")"

command -v curl >/dev/null 2>&1 || { echo "$URL"; exit 0; }

live=""
for i in $(seq 1 24); do
  live="$(curl -sS "$URL?cb=$want-$i" 2>/dev/null | git hash-object --stdin)"
  if [ "$live" = "$want_blob" ]; then
    echo "live and serving this exact build  (blob ${want_blob:0:12})"
    echo
    echo "  SHAREABLE  $URL"
    echo "  LOCAL      http://localhost:8341/   (tools\serve.ps1)"
    exit 0
  fi
  # Surface a genuine build failure rather than waiting out the clock.
  if command -v gh >/dev/null 2>&1; then
    st="$(gh api "repos/$REPO/pages/builds/latest" --jq '.status' 2>/dev/null)"
    [ "$st" = "errored" ] && { echo "Pages build FAILED" >&2; exit 1; }
  fi
  sleep 10
done
echo "four minutes on and the URL is still serving the old build" >&2
echo "  expected ${want_blob:0:12}, serving ${live:0:12}" >&2
echo "  $URL" >&2
exit 1














