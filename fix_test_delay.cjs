const fs = require('fs');
const runnerFile = 'server/golden_runner.ts';

let code = fs.readFileSync(runnerFile, 'utf8');
// Increase delay between requests to 4.5 seconds to avoid 429 rate limit
code = code.replace(/await new Promise\(\(resolve\) => setTimeout\(resolve, 10\)\);/, `await new Promise((resolve) => setTimeout(resolve, 4500));`);

fs.writeFileSync(runnerFile, code);
console.log('Done replacing timeout in golden_runner.ts');
