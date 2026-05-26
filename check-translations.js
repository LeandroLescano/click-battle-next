const fs = require('fs');
const path = require('path');

// Configuration
const LOCALES_PATHS = [
  'i18n/locales/pr/translation.json',
  'i18n/locales/es/translation.json'
];
const IGNORE_DIRS = ['node_modules', 'tests', '.next', '.git'];
const EXTENSIONS = ['.ts', '.tsx'];

// Colors for console output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

// Load translation files
const locales = {};
let hasError = false;

try {
  LOCALES_PATHS.forEach(filePath => {
    const fullPath = path.resolve(filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      locales[filePath] = JSON.parse(content);
    } else {
      console.error(`${RED}Error: Translation file not found: ${filePath}${RESET}`);
      process.exit(1);
    }
  });
} catch (error) {
  console.error(`${RED}Error loading translation files: ${error.message}${RESET}`);
  process.exit(1);
}

// Helper to check if key exists in object (nested support if needed, but script implies flat or simple keys)
// The bash script used `jq 'has($text)'` which checks top-level keys.
function keyExists(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

// Recursive file search
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(file)) {
        findFiles(filePath, fileList);
      }
    } else {
      if (EXTENSIONS.includes(path.extname(file))) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

const files = findFiles('.');
let checkedFiles = 0;
let untranslatedCount = 0;
const totalFiles = files.length;

console.log(`Found ${totalFiles} files to check.`);

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');

  // Regex to match t("KEY") or t('KEY')
  // Matches t( followed by quote, capturing the key, then closing quote
  // We also check for preceding characters that might indicate it's the t function
  const regex = /(?:[\s{(\[])t\(\s*(["'])(.*?)\1\s*\)/g;

  let match;
  while ((match = regex.exec(content)) !== null) {
    const key = match[2];

    // Check against all locales
    LOCALES_PATHS.forEach(localePath => {
      if (!keyExists(locales[localePath], key)) {
        // Clear line and print error
        process.stdout.write(`\r\x1b[K`);
        console.log(`${RED}Text '${key}' in '${file}' is missing translations in ${localePath}${RESET}`);
        untranslatedCount++;
        hasError = true;
      }
    });
  }

  checkedFiles++;

  // Simple progress
  const progress = Math.floor((checkedFiles / totalFiles) * 100);
  process.stdout.write(`\r${GREEN}Progress: ${progress}%${RESET}`);
});

process.stdout.write('\n');

if (untranslatedCount > 0) {
  console.log(`\n${RED}Done! Checked ${totalFiles} files. Found ${untranslatedCount} missing translations.${RESET}`);
  process.exit(1);
} else {
  console.log(`\n${GREEN}Done! Checked ${totalFiles} files. All translations present.${RESET}`);
  process.exit(0);
}
