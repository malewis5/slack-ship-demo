import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import ts from 'typescript';

const require = createRequire(import.meta.url);

function renderServices() {
  const source = readFileSync(new URL('../components/services.tsx', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputText)(require, module, module.exports);
  return renderToStaticMarkup(createElement(module.exports.Services));
}

test('Services presents the full offering and existing display photo', () => {
  const html = renderServices();
  assert.match(html, /id="services"/);
  assert.match(html, /aria-labelledby="services-heading"/);
  for (const name of ['Custom framing', 'Display design', 'Custom fabrication', 'Installation']) {
    assert.ok(html.includes(`>${name}</h3>`), name);
  }
  assert.match(html, /display-case/);
  assert.match(html, /alt="[^"]+"/);
});

test('Services sits between Studio and Commission and is linked in navigation', () => {
  const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /<About \/>\s*<Services \/>\s*<Pricing \/>/);
  for (const file of ['site-header', 'site-footer']) {
    const source = readFileSync(new URL(`../components/${file}.tsx`, import.meta.url), 'utf8');
    assert.match(source, /label: 'Services', href: '#services'/);
  }
});
