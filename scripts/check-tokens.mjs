#!/usr/bin/env node
/* The design system's hard rule, enforced for the app: colour and type come from styles.css
   tokens — never a hex, rgb() or font-family in a component (CLAUDE.md, ubite-design/CLAUDE.md). */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'apps/web/src');
const RULES = [
  [/#[0-9a-fA-F]{3,8}\b(?![\w-])/, 'raw hex colour'],
  [/\brgba?\(/, 'raw rgb() colour'],
  [/font-family\s*:/, 'font-family outside the design system'],
];
const ALLOW = /href=["']#|['"`]#(main|feedback|signin|notifications|exports)\b|location\.hash|#notifications/;
let bad = 0;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!/\.(tsx?|css)$/.test(e.name)) continue;
    fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
      if (ALLOW.test(line) || /^\s*(\/\/|\/\*|\*)/.test(line)) return;
      for (const [re, what] of RULES) {
        if (re.test(line)) { bad++; console.error(`${path.relative(process.cwd(), p)}:${i + 1}  ${what}: ${line.trim().slice(0, 100)}`); }
      }
    });
  }
}
walk(ROOT);
if (bad) { console.error(`\n${bad} token violation(s). Use var(--token) from the design system.`); process.exit(1); }
console.log('tokens: ok — no raw colours or fonts in apps/web/src');
