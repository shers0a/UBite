#!/usr/bin/env node
/* Recompiles design-system component sources into .claude/skills/ubite-design/_ds_bundle.js,
   the same way Claude Design's bundler lays it out: one try-wrapped section per file, imports
   between files rewritten to lazy `__ds_scope.X` lookups, exports registered on the namespace.

   node scripts/ds-bundle.mjs components/brand/Logo.jsx components/core/Spotlight.jsx
   node scripts/ds-bundle.mjs --all      every components/**.jsx

   Only the named sections change; the rest of the bundle is left byte for byte. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as babel from '@babel/core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DS = path.join(ROOT, '.claude', 'skills', 'ubite-design');
const BUNDLE = path.join(DS, '_ds_bundle.js');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}

/* import { A } from './x.jsx'  →  A becomes __ds_scope.A at every use; React stays global;
   export function X  →  function X, and X is collected for the namespace. */
function dsPlugin(exported) {
  return ({ types: t }) => ({
    visitor: {
      ImportDeclaration(p) {
        const from = p.node.source.value;
        for (const spec of p.node.specifiers) {
          const local = spec.local.name;
          const binding = p.scope.getBinding(local);
          if (from === 'react') {
            if (t.isImportSpecifier(spec)) binding?.referencePaths.forEach((r) => r.replaceWith(t.memberExpression(t.identifier('React'), t.identifier(spec.imported.name))));
          } else {
            const name = t.isImportSpecifier(spec) ? spec.imported.name : local;
            binding?.referencePaths.forEach((r) => {
              const member = t.memberExpression(t.identifier('__ds_scope'), t.identifier(name));
              if (r.parentPath.isJSXOpeningElement() || r.parentPath.isJSXClosingElement() || r.isJSXIdentifier()) {
                r.replaceWith(t.jsxMemberExpression(t.jsxIdentifier('__ds_scope'), t.jsxIdentifier(name)));
              } else r.replaceWith(member);
            });
          }
        }
        p.remove();
      },
      ExportNamedDeclaration(p) {
        const decl = p.node.declaration;
        if (!decl) { p.remove(); return; }
        if (t.isFunctionDeclaration(decl)) exported.push(decl.id.name);
        if (t.isVariableDeclaration(decl)) decl.declarations.forEach((d) => exported.push(d.id.name));
        p.replaceWith(decl);
      },
    },
  });
}

function compile(rel) {
  const src = fs.readFileSync(path.join(DS, rel), 'utf8');
  const exported = [];
  const out = babel.transformSync(src, {
    filename: rel, babelrc: false, configFile: false, compact: false, retainLines: false,
    presets: [['@babel/preset-react', { runtime: 'classic' }]],
    plugins: [dsPlugin(exported)],
  }).code;
  const section = `// ${rel}\ntry { (() => {\n${out}\nObject.assign(__ds_scope, { ${exported.join(', ')} });\n` +
    `})(); } catch (e) { __ds_ns.__errors.push({ path: "${rel}", error: String((e && e.message) || e) }); }\n`;
  return { section, exported, hash: crypto.createHash('sha256').update(src).digest('hex').slice(0, 12) };
}

const args = process.argv.slice(2);
const files = args.includes('--all')
  ? walk(path.join(DS, 'components')).filter((f) => f.endsWith('.jsx')).map((f) => path.relative(DS, f).split(path.sep).join('/')).sort()
  : args;
if (!files.length) { console.error('usage: node scripts/ds-bundle.mjs <components/…/X.jsx…> | --all'); process.exit(1); }

let bundle = fs.readFileSync(BUNDLE, 'utf8');
const headerEnd = bundle.indexOf('*/');
const header = JSON.parse(bundle.slice('/* @ds-bundle: '.length, headerEnd).trim());
let body = bundle.slice(headerEnd + 2);

for (const rel of files) {
  const { section, exported, hash } = compile(rel);
  const start = body.indexOf(`// ${rel}\ntry { (() => {`);
  if (start >= 0) {
    const endMarker = `__ds_ns.__errors.push({ path: "${rel}", error: String((e && e.message) || e) }); }\n`;
    const end = body.indexOf(endMarker, start) + endMarker.length;
    body = body.slice(0, start) + section + body.slice(end);
  } else {
    // New files go after the last component section, before the kits and scripts.
    const anchor = body.search(/\n\/\/ (scripts|ui_kits)\//);
    body = body.slice(0, anchor + 1) + '\n' + section + body.slice(anchor + 1);
  }
  header.components = header.components.filter((c) => c.sourcePath !== rel || exported.includes(c.name));
  for (const name of exported) {
    if (!header.components.some((c) => c.name === name)) header.components.push({ name, sourcePath: rel });
    if (!body.includes(`\n__ds_ns.${name} = __ds_scope.${name};`)) {
      body = body.replace(/\n\}\)\(\);\s*$/, `\n__ds_ns.${name} = __ds_scope.${name};\n\n})();\n`);
    }
  }
  header.sourceHashes[rel] = hash;
  console.log(`✓ ${rel}  → ${exported.join(', ')}`);
}

fs.writeFileSync(BUNDLE, `/* @ds-bundle: ${JSON.stringify(header)} */${body}`);
console.log(`✓ ${path.relative(ROOT, BUNDLE)}`);
