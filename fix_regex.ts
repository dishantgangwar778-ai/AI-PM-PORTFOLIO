import fs from 'fs';
let code = fs.readFileSync('server/security_schemas.ts', 'utf8');
code = code.replace(
  /\.replace\(\/<script \[\^<\]\*\(\?:\(\?\!<\/script>\)<\[\^<\]\*\)\*<\/script>\/gi, ''\)/g,
  ".replace(/<script\\\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>/gi, '')"
);
fs.writeFileSync('server/security_schemas.ts', code);
