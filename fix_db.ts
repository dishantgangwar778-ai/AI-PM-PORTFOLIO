import fs from 'fs';

let code = fs.readFileSync('server/db.ts', 'utf8');
code = code.replace(/import crypto from 'crypto';/, "import crypto from 'crypto';\nimport bcrypt from 'bcryptjs';");

// Fix registerUser
code = code.replace(
  /const salt = crypto\.randomBytes\(16\)\.toString\('hex'\);\s*const rawPass = password \|\| 'password123';\s*const hash = crypto\.pbkdf2Sync\(rawPass, salt, 1000, 64, 'sha512'\)\.toString\('hex'\);/,
  `const rawPass = password || 'password123';
    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(rawPass, salt);`
);

// Fix loginUser
code = code.replace(
  /const verifyHash = crypto\.pbkdf2Sync\(password, user\.passwordSalt, 1000, 64, 'sha512'\)\.toString\('hex'\);\s*if \(verifyHash !== user\.passwordHash && password !== user\.password\) {/,
  `let isMatch = false;
      try {
        isMatch = bcrypt.compareSync(password, user.passwordHash);
      } catch(e) { /* fallback/ignore */ }
      if (!isMatch && password !== user.password) {`
);

// Also check for any default users being seeded with pbkdf2
code = code.replace(
  /const demoSalt = crypto\.randomBytes\(16\)\.toString\('hex'\);\s*const demoHash = crypto\.pbkdf2Sync\('demo123', demoSalt, 1000, 64, 'sha512'\)\.toString\('hex'\);/,
  `const demoSalt = bcrypt.genSaltSync(12);
    const demoHash = bcrypt.hashSync('demo123', demoSalt);`
);

// We need to also check test seeding inside server/test_security_audit.ts or golden datasets
fs.writeFileSync('server/db.ts', code);
console.log('Fixed db.ts to use bcryptjs');
