import fs from 'node:fs';
import path from 'node:path';

const rootArg = process.argv[2] ?? 'src/app';
const root = path.resolve(process.cwd(), rootArg);

if (!fs.existsSync(root)) {
  console.error(`Target root does not exist: ${root}`);
  process.exit(1);
}

const languageTarget = path.join(root, 'i18n/LanguageContext');
const themeTarget = path.join(root, 'theme/ThemeContext');
const siteImports = new Map([
  ['./components/Navbar', './components/site/layout/Navbar'],
  ['./components/Footer', './components/site/layout/Footer'],
  ['./components/ContactSection', './components/site/sections/ContactSection'],
  ['./components/AuthModal', './components/site/modals/AuthModal'],
  ['./components/EmergencyTowModal', './components/site/modals/EmergencyTowModal'],
  ['./components/BookingModal', './components/site/booking/BookingModal'],
  ['./components/CartContext', './components/site/cart/CartContext'],
  ['./components/CartDrawer', './components/site/cart/CartDrawer'],
  ['./components/CheckoutPage', './components/site/checkout/CheckoutPage'],
  ['./components/CheckoutSuccessPage', './components/site/checkout/CheckoutSuccessPage'],
  ['./components/CheckoutCancelPage', './components/site/checkout/CheckoutCancelPage'],
  ['./components/Toaster', './components/shared/Toaster'],
]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'build' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function toImportPath(fromFile, targetNoExt) {
  const rel = path.relative(path.dirname(fromFile), targetNoExt).replaceAll(path.sep, '/');
  return rel.startsWith('.') ? rel : `./${rel}`;
}

function replaceImportSpecifiers(source, replacer) {
  return source.replace(/from\s+(['"])([^'"]+)\1/g, (match, quote, specifier) => {
    const next = replacer(specifier);
    return next === specifier ? match : `from ${quote}${next}${quote}`;
  });
}

let changedCount = 0;

for (const file of walk(root)) {
  let source = fs.readFileSync(file, 'utf8');
  const original = source;

  source = replaceImportSpecifiers(source, (specifier) => {
    if (specifier.endsWith('LanguageContext')) {
      return toImportPath(file, languageTarget);
    }
    if (specifier.endsWith('ThemeContext')) {
      return toImportPath(file, themeTarget);
    }
    return siteImports.get(specifier) ?? specifier;
  });

  if (source !== original) {
    fs.writeFileSync(file, source);
    changedCount += 1;
    console.log(path.relative(process.cwd(), file));
  }
}

console.log(`Updated ${changedCount} file(s).`);
