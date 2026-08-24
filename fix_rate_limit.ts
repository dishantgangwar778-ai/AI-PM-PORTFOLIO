import fs from 'fs';

let code = fs.readFileSync('server/routes.ts', 'utf8');

code = code.replace(/const apiLimiter = rateLimit\(\{([\s\S]*?)\}\);/, `const apiLimiter = rateLimit({$1  keyGenerator: (req) => req.ip as string,\n  validate: { xForwardedForHeader: false, default: true }\n});`);

code = code.replace(/const authLimiter = rateLimit\(\{([\s\S]*?)\}\);/, `const authLimiter = rateLimit({$1  keyGenerator: (req) => req.ip as string,\n  validate: { xForwardedForHeader: false, default: true }\n});`);

fs.writeFileSync('server/routes.ts', code);
console.log('Modified routes.ts for rate limit keyGenerator');
