import fs from 'fs';
let code = fs.readFileSync('src/components/OnboardingWidget.tsx', 'utf8');
code = code.replace(/\\`step\\\$\\{step\\}\\`/g, '`step${step}`');
code = code.replace(/\\`completed_step_\\\$\\{step\\}\\`/g, '`completed_step_${step}`');
code = code.replace(/\\`step\\\$\\{step\.num\\}\\`/g, '`step${step.num}`');
fs.writeFileSync('src/components/OnboardingWidget.tsx', code);
