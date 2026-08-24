import fs from 'fs';
let code = fs.readFileSync('server/routes.ts', 'utf8');
code = code.replace(',, IngestBatchSchema', ', IngestBatchSchema');
fs.writeFileSync('server/routes.ts', code);
