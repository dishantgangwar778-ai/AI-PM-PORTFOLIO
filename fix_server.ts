import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/const app = express\(\);/, "const app = express();\n  app.set('trust proxy', 1);");

fs.writeFileSync('server.ts', code);
console.log('Modified server.ts to set trust proxy');
