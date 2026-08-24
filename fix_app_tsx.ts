import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('CookieConsent')) {
  code = code.replace(
    /import \{ Dashboard \} from '\.\/views\/Dashboard';/,
    "import { Dashboard } from './views/Dashboard';\nimport { CookieConsent } from './components/CookieConsent';"
  );
  
  code = code.replace(
    /<\/Router>/,
    "  <CookieConsent />\n    </Router>"
  );
  
  fs.writeFileSync('src/App.tsx', code);
  console.log('Added CookieConsent to App.tsx');
} else {
  console.log('CookieConsent already in App.tsx');
}
