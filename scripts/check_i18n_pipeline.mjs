#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targetRoots = [
  'src/components',
  'src/SiteApp.tsx',
  'src/CmsPwaApp.tsx',
  'src/i18n',
];

const allowedFinnishFiles = new Set([
  'src/components/cms/invoices/InvoicesCMSPage.tsx',
  'src/components/cms/invoices/helpers.ts',
]);

const ignoredPathParts = [
  '/src/i18n/dictionaries/',
  '/src/components/legal/legalContent.ts',
];

const forbiddenPatterns = [
  {
    name: 'direct language equality branch',
    pattern: /\b(?:language|currentLanguage)\s*[!=]==?\s*['"](fi|en)['"]/,
  },
  {
    name: 'legacy CMS-PWA copy object',
    pattern: /\bCMS_PWA_COPY\b/,
  },
  {
    name: 'hardcoded catalog title fallback',
    pattern: /Catalog\s+-\s+\{/,
  },
  {
    name: 'hardcoded catalog readiness copy',
    pattern: /Finalize tire and rim catalog readiness from one CMS workspace\./,
  },
  {
    name: 'hardcoded restricted customer tab label',
    pattern: /\?\s*['"]Customer['"]\s*:/,
  },
];

const textExtensions = new Set(['.ts', '.tsx']);

function walk(entry) {
  const absolute = path.join(root, entry);
  if (!fs.existsSync(absolute)) return [];
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return [absolute];

  const files = [];
  for (const child of fs.readdirSync(absolute)) {
    if (child === 'node_modules' || child === '.git' || child === 'dist') continue;
    files.push(...walk(path.join(entry, child)));
  }
  return files;
}

function toRelative(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function isIgnored(file) {
  const normalized = `/${toRelative(file)}`;
  return ignoredPathParts.some((part) => normalized.includes(part));
}

const files = targetRoots
  .flatMap(walk)
  .filter((file) => textExtensions.has(path.extname(file)))
  .filter((file) => !isIgnored(file));

const findings = [];

for (const file of files) {
  const relative = toRelative(file);
  const source = fs.readFileSync(file, 'utf8');
  const lines = source.split(/\r?\n/);

  for (const [index, line] of lines.entries()) {
    for (const check of forbiddenPatterns) {
      if (check.pattern.test(line)) {
        findings.push({
          file: relative,
          line: index + 1,
          issue: check.name,
          text: line.trim(),
        });
      }
    }

    if (!allowedFinnishFiles.has(relative) && /[ÄÖÅäöå]/.test(line)) {
      findings.push({
        file: relative,
        line: index + 1,
        issue: 'Finnish UI text outside dictionary/content allowlist',
        text: line.trim(),
      });
    }
  }
}

if (findings.length > 0) {
  console.error(`i18n audit failed with ${findings.length} finding(s):`);
  for (const finding of findings.slice(0, 80)) {
    console.error(`${finding.file}:${finding.line} ${finding.issue}: ${finding.text}`);
  }
  if (findings.length > 80) {
    console.error(`...and ${findings.length - 80} more finding(s).`);
  }
  process.exit(1);
}

console.log('i18n audit passed.');
