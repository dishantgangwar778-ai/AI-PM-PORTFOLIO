import fs from 'fs';
let code = fs.readFileSync('server/routes.ts', 'utf8');

const importRegex = /import \{([\s\S]*?)\} from '\.\/security_schemas';/;
const importMatch = code.match(importRegex);
if (importMatch && !importMatch[0].includes('sanitizeSqlAndPrompt')) {
  code = code.replace(importRegex, "import { $1, sanitizeSqlAndPrompt } from './security_schemas';");
}

code = code.replace(
  /const sku = sanitizeHtml\(String\(rawSku\)\)\.substring\(0, 100\);/,
  "const sku = sanitizeSqlAndPrompt(String(rawSku)).substring(0, 100);"
);
code = code.replace(
  /const cleanReason = sanitizeHtml\(String\(rawReason\)\)\.substring\(0, 500\);/,
  "const cleanReason = sanitizeSqlAndPrompt(String(rawReason)).substring(0, 500);"
);
code = code.replace(
  /const cleanComment = sanitizeHtml\(String\(rawComment\)\)\.substring\(0, 2000\);/,
  "const cleanComment = sanitizeSqlAndPrompt(String(rawComment)).substring(0, 2000);"
);
code = code.replace(
  /const cleanCategory = sanitizeHtml\(String\(rawCategory\)\)\.substring\(0, 100\);/,
  "const cleanCategory = sanitizeSqlAndPrompt(String(rawCategory)).substring(0, 100);"
);

fs.writeFileSync('server/routes.ts', code);
console.log('Modified /datasets/upload sanitization');
