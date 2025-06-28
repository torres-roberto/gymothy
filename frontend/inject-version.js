const fs = require('fs');
const path = require('path');

const pkg = require('./package.json');
const htmlPath = path.join(__dirname, 'index.html');

let html = fs.readFileSync(htmlPath, 'utf8');
const versionString = `v${pkg.version}`;

html = html.replace('<!--VERSION-->', versionString);

fs.writeFileSync(htmlPath, html);
console.log(`Injected version ${versionString} into index.html`); 