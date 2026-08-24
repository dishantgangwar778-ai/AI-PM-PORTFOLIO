import fs from 'fs';
let code = fs.readFileSync('server/routes.ts', 'utf8');

if(!code.includes('express-rate-limit')) {
  code = "import rateLimit from 'express-rate-limit';\n" + code;
}

const rateLimitCode = `
// ============================================================================
// FIX 02: RATE LIMITING & BRUTE-FORCE PROTECTION
// ============================================================================
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts locks for 15 mins
  message: { error: 'Incorrect email or password' }, // Generic response (FIX 04)
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts for lock
});
`;

code = code.replace(/const router = Router\(\);/, rateLimitCode + '\nconst router = Router();\n\n// Apply general rate limit to all /api routes\nrouter.use(apiLimiter);\n');

// Apply authLimiter to /auth/login
code = code.replace(/router\.post\('\/auth\/login',\s*validateBody\(LoginSchema\),\s*\(req: Request, res: Response\)/, "router.post('/auth/login', authLimiter, validateBody(LoginSchema), (req: Request, res: Response)");

// Fix 04: Uniform error messages for login
// Look for res.status(401).json({ error: 'Unauthorized', ... }) in /auth/login
code = code.replace(
  /if \(\!user\) \{\s*return res\.status\(401\)\.json\(\{[\s\S]*?\}\);\s*\}/,
  `if (!user) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }`
);
code = code.replace(
  /if \(\!isValid\) \{\s*return res\.status\(401\)\.json\(\{[\s\S]*?\}\);\s*\}/,
  `if (!isValid) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }`
);

fs.writeFileSync('server/routes.ts', code);
console.log('Modified routes.ts for rate limiting and generic error responses');
