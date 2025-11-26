#!/usr/bin/env node
// Simple generator: scans repo root for .html files (excluding index.html),
// extracts title/first paragraph, sorts by mtime, and writes index.generated.html
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'index.generated.html');

function listHtmlFiles() {
  return fs.readdirSync(ROOT).filter(f => f.toLowerCase().endsWith('.html') && f.toLowerCase() !== 'index.html' && f !== 'index.generated.html');
}

function extractPreview(content) {
  const mTitle = content.match(/<title>([^<]+)<\/title>/i);
  if(mTitle) return mTitle[1].trim();
  const mH1 = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if(mH1) return mH1[1].replace(/<[^>]+>/g,'').trim();
  const mP = content.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if(mP) return mP[1].replace(/<[^>]+>/g,'').trim();
  const text = content.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  return text.slice(0,200);
}

function prettifyFilename(name){
  const base = name.replace(/\.html$/i,'');
  const match = base.match(/(\d{4}[\-_.]\d{2}[\-_.]\d{2}|\d{1,2}[A-Za-z]{3,}|[A-Za-z]{3,}[\-_.]?\d{1,2})/i);
  if(match) return match[0].replace(/[-_.]/g,' ');
  return base.replace(/[-_.]+/g,' ').split(' ').map(w=> w? w.charAt(0).toUpperCase()+w.slice(1):'').join(' ');
}

const files = listHtmlFiles().map(name => {
  const p = path.join(ROOT, name);
  const stat = fs.statSync(p);
  const content = fs.readFileSync(p, 'utf8');
  return {name, mtime: stat.mtime, preview: extractPreview(content)};
});

files.sort((a,b)=> b.mtime - a.mtime);

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>GenAI — Reports (generated)</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>body{font-family:'JetBrains Mono',monospace;padding:24px;max-width:920px;margin:0 auto}</style>
</head>
<body>
  <h1>GenAI — Reports (generated)</h1>
  <ul>
    ${files.map(f=> `<li><a href="${f.name}">${prettifyFilename(f.name)} — ${f.name}</a><div>${f.preview}</div></li>`).join('\n')}
  </ul>
</body>
</html>`;

fs.writeFileSync(OUT, html, 'utf8');
console.log('Wrote', OUT);