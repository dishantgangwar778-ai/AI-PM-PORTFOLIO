import fs from 'fs';

let code = fs.readFileSync('server/routes.ts', 'utf8');

// Update apiLimiter to 10 max
code = code.replace(
  /windowMs: 60 \* 1000, \/\/ 1 minute\s*max: 20,/,
  "windowMs: 60 * 1000, // 1 minute\n  max: 10,"
);

// Update authLimiter to 10 max per minute
code = code.replace(
  /windowMs: 15 \* 60 \* 1000, \/\/ 15 minutes\s*max: 5,/,
  "windowMs: 60 * 1000, // 1 minute\n  max: 10,"
);

fs.writeFileSync('server/routes.ts', code);
console.log('Modified routes.ts to 10 req/min');
