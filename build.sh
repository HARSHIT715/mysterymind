#!/bin/sh
# Rebuilds index.html from the files in src/. Run: sh build.sh
cd "$(dirname "$0")/src"
{ cat head.html style.css theme.css; echo '</style></head><body><div id="app"></div><script>'; cat data.js engine.js ui1.js ui2.js; echo '</script></body></html>'; } > ../index.html
echo "Built index.html"
