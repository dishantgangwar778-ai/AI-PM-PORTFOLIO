import fs from 'fs';
let code = fs.readFileSync('src/components/OnboardingWidget.tsx', 'utf8');
code = code.replace(/\\\`/g, '`');
code = code.replace(/\\\$/g, '$');
fs.writeFileSync('src/components/OnboardingWidget.tsx', code);
