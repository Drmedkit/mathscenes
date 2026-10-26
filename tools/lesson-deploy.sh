#!/usr/bin/env bash
# Build the lesson line and deploy it to Cloudflare Pages project "math-path" (https://math-path-3vc.pages.dev).
# The site root redirects to the path page /lessons/. Needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
printf '/ /lessons/ 302\n/index.html /lessons/ 302\n' > dist/_redirects
npx wrangler@4 pages deploy dist --project-name=math-path --branch=main --commit-dirty=true
