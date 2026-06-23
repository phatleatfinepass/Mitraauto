import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const scanTargets = [
  'src/components/site',
  'src/components/catalog',
  'src/i18n/dictionaries/site.ts',
  'src/i18n/dictionaries/common.ts',
  'src/i18n/dictionaries/serviceSeo.ts',
  'src/i18n/dictionaries/legal.ts',
];

const forbiddenPatterns = [
  {
    id: 'internal-growth-ready-copy',
    pattern: /\b(growth-ready|Business\/service owner review required|owner approval required|Content review|Sisällön tarkistus)\b/i,
  },
  {
    id: 'placeholder-tbd',
    pattern: /\[TBD\]/,
  },
  {
    id: 'unverified-review-proof',
    pattern: /\b(500\+|4\.8 ★★★★★|4\.9 out of 5|4\.9 tähteä)\b/i,
  },
  {
    id: 'unverified-certification-proof',
    pattern: /\b(Certified Technicians|Sertifioidut asentajat)\b/i,
  },
  {
    id: 'unverified-insurance-proof',
    pattern: /\b(full insurance|comprehensive insurance|kattava vakuutus)\b/i,
  },
  {
    id: 'unverified-warranty-proof',
    pattern: /\b(warranty remains valid|takuusi pysyy voimassa)\b/i,
  },
  {
    id: 'unverified-waiting-room-proof',
    pattern: /\b(waiting area with free Wi-Fi|odotustila ilmaisella Wi-Fi|odotustila Wi-Fi)\b/i,
  },
  {
    id: 'unverified-premium-delivery-proof',
    pattern: /\b(Premium customers get free delivery|Premium-asiakkaat saavat ilmaisen toimituksen)\b/i,
  },
];

function toAbsolute(target) {
  return path.join(ROOT, target);
}

function collectFiles(target) {
  const absoluteTarget = toAbsolute(target);
  if (!fs.existsSync(absoluteTarget)) {
    return [];
  }

  const stat = fs.statSync(absoluteTarget);
  if (stat.isFile()) {
    return [absoluteTarget];
  }

  const files = [];
  for (const entry of fs.readdirSync(absoluteTarget, { withFileTypes: true })) {
    const absoluteEntry = path.join(absoluteTarget, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(path.relative(ROOT, absoluteEntry)));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(absoluteEntry);
    }
  }
  return files;
}

const findings = [];
const files = scanTargets.flatMap(collectFiles);

for (const file of files) {
  const relativeFile = path.relative(ROOT, file);
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const rule of forbiddenPatterns) {
      if (rule.pattern.test(line)) {
        findings.push({
          file: relativeFile,
          line: index + 1,
          rule: rule.id,
          text: line.trim(),
        });
      }
    }
  });
}

if (findings.length > 0) {
  console.error('Public content claim check failed:');
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} ${finding.rule}: ${finding.text}`);
  }
  process.exit(1);
}

console.log(`Public content claim check passed: scanned ${files.length} files.`);
