import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('OnboardingWidget')) {
  code = code.replace(
    /import \{ CookieConsent \} from '\.\/components\/CookieConsent';/,
    "import { CookieConsent } from './components/CookieConsent';\nimport { OnboardingWidget } from './components/OnboardingWidget';"
  );
  
  code = code.replace(
    /<\/Router>/,
    "  <OnboardingWidget />\n    </Router>"
  );
  
  fs.writeFileSync('src/App.tsx', code);
  console.log('Added OnboardingWidget to App.tsx');
} else {
  console.log('OnboardingWidget already in App.tsx');
}
