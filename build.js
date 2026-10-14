// Rebuilds index.html from src/. Works on Windows, Mac and Linux. Run: node build.js
const fs = require('fs'), path = require('path');
const read = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const out = read('head.html') + read('style.css') + read('theme.css') +
  '</style></head><body><div id="app"></div><script>\n' +
  ['data.js', 'engine.js', 'ui1.js', 'ui2.js'].map(read).join('') +
  '</script></body></html>\n';
fs.writeFileSync(path.join(__dirname, 'index.html'), out);
console.log('Built index.html (' + out.length + ' bytes)');
