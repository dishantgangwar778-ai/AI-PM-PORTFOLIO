import fs from 'fs';

let code = fs.readFileSync('server/security_schemas.ts', 'utf8');

if(!code.includes('sanitizeHtml')) {
  code = code.replace(/import { z } from 'zod';/, "import { z } from 'zod';\nimport { sanitizeHtml } from './auth_middleware';");
}

// Strip script/HTML tags from free-text fields
// e.g. z.string().max(...).optional() -> z.string().max(...).optional().transform(val => val ? sanitizeHtml(val) : val)
// Actually it's easier to use a custom reusable string schema
const reusableStr = `
const sanitizedString = (max: number) => z.string().trim().max(max).transform(val => sanitizeHtml(val));
const sanitizedOptionalString = (max: number) => z.string().trim().max(max).optional().transform(val => val ? sanitizeHtml(val) : val);
`;
code = code.replace(/import { z } from 'zod';\nimport { sanitizeHtml } from '.\/auth_middleware';/, "import { z } from 'zod';\nimport { sanitizeHtml } from './auth_middleware';\n" + reusableStr);

// Let's replace some obvious fields: description, problem, evidence, recommendation, hypothesis
code = code.replace(/description: z\.string\(\)\.max\((\d+)\)\.optional\(\),/g, "description: sanitizedOptionalString($1),");
code = code.replace(/problem: z\.string\(\)\.max\((\d+)\)\.optional\(\),/g, "problem: sanitizedOptionalString($1),");
code = code.replace(/evidence: z\.string\(\)\.max\((\d+)\)\.optional\(\),/g, "evidence: sanitizedOptionalString($1),");
code = code.replace(/recommendation: z\.string\(\)\.max\((\d+)\)\.optional\(\),/g, "recommendation: sanitizedOptionalString($1),");
code = code.replace(/hypothesis: z\.string\(\)\.max\((\d+)\)\.optional\(\),/g, "hypothesis: sanitizedOptionalString($1),");

// Let's also apply to texts in AI classify
code = code.replace(/text: z\.string\(\)\.trim\(\)\.min\(1, 'Text input required'\)\.max\(5000\),/g, "text: z.string().trim().min(1, 'Text input required').max(5000).transform(val => sanitizeHtml(val)),");
code = code.replace(/texts: z\.array\(z\.string\(\)\.trim\(\)\.min\(1\)\.max\(5000\)\)\.min\(1\)\.max\(500, 'Batch size limit is 500 items'\),/g, "texts: z.array(z.string().trim().min(1).max(5000).transform(val => sanitizeHtml(val))).min(1).max(500, 'Batch size limit is 500 items'),");

// Also sampleComments:
code = code.replace(/sampleComments: z\.array\(z\.string\(\)\.max\(2000\)\)\.max\(100\)\.optional\(\),/g, "sampleComments: z.array(z.string().max(2000).transform(val => sanitizeHtml(val))).max(100).optional(),");

fs.writeFileSync('server/security_schemas.ts', code);
console.log('Modified security_schemas.ts to sanitize HTML tags');
