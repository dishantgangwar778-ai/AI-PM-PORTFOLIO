import fs from 'fs';
let code = fs.readFileSync('server/security_schemas.ts', 'utf8');

const oldBlock = "export const sanitizeSqlAndPrompt = (val: string) => {\\n" +
"  if (!val) return val;\\n" +
"  return val\\n" +
"    // Strip HTML/scripts\\n" +
"    .replace(/<script [^<]*(?:(?!</script>)<[^<]*)*</script>/gi, '')\\n" +
"    .replace(/<[^>]+>/g, '')\\n" +
"    // Escape SQL control chars\\n" +
"    .replace(/'/g, \"''\")\\n" +
"    .replace(/;/g, \"\")\\n" +
"    .replace(/--/g, \"\")\\n" +
"    // Neutralize prompt injection keywords\\n" +
"    .replace(/ignore previous instructions/gi, \"[REDACTED]\")\\n" +
"    .replace(/system prompt/gi, \"[REDACTED]\");\\n" +
"};";

const newBlock = "export const sanitizeSqlAndPrompt = (val: string) => {\\n" +
"  if (!val) return val;\\n" +
"  return val\\n" +
"    .replace(/<script\\\\b[^<]*(?:(?!<\\\\/script>)<[^<]*)*<\\\\/script>/gi, '')\\n" +
"    .replace(/<[^>]+>/g, '')\\n" +
"    .replace(/'/g, \"''\")\\n" +
"    .replace(/;/g, \"\")\\n" +
"    .replace(/--/g, \"\")\\n" +
"    .replace(/ignore previous instructions/gi, \"[REDACTED]\")\\n" +
"    .replace(/system prompt/gi, \"[REDACTED]\");\\n" +
"};";

const finalCode = code.replace(/export const sanitizeSqlAndPrompt[\s\S]*?\};\n/, newBlock.replace(/\\n/g, '\n').replace(/\\\\/g, '\\') + '\n');
fs.writeFileSync('server/security_schemas.ts', finalCode);
