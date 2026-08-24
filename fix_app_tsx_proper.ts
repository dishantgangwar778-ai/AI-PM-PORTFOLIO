import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Insert imports if they don't exist
if (!code.includes('CookieConsent')) {
  code = code.replace(
    /import \{ ExportModal \} from '\.\/components\/ExportModal';/,
    "import { ExportModal } from './components/ExportModal';\nimport { CookieConsent } from './components/CookieConsent';\nimport { OnboardingWidget } from './components/OnboardingWidget';"
  );
} else if (!code.includes('OnboardingWidget')) {
  code = code.replace(
    /import \{ CookieConsent \} from '\.\/components\/CookieConsent';/,
    "import { CookieConsent } from './components/CookieConsent';\nimport { OnboardingWidget } from './components/OnboardingWidget';"
  );
}

// Insert before the last </div>
if (code.includes('<ExportModal')) {
  code = code.replace(
    /(\s*)<\/div>\s*\);\s*\}\s*$/,
    "$1  <CookieConsent />\n$1  <OnboardingWidget setCurrentView={setCurrentView} setIsUploadStepperOpen={setIsUploadStepperOpen} />\n$1</div>\n  );\n}"
  );
}

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed App.tsx imports and rendering');
