const fs = require('fs');
const geminiFile = 'server/gemini.ts';

let code = fs.readFileSync(geminiFile, 'utf8');
// Increase timeout of generateContent call
code = code.replace(/setTimeout\(\(\) => reject\(new Error\('Gemini classification timeout'\)\), 3500\)/g, `setTimeout(() => reject(new Error('Gemini classification timeout')), 10000)`);
code = code.replace(/setTimeout\(\(\) => reject\(new Error\('Gemini root cause timeout'\)\), 5000\)/g, `setTimeout(() => reject(new Error('Gemini root cause timeout')), 10000)`);
fs.writeFileSync(geminiFile, code);
console.log('Done replacing timeout in gemini.ts');
