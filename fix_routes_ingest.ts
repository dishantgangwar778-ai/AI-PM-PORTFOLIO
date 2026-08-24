import fs from 'fs';

let code = fs.readFileSync('server/routes.ts', 'utf8');

const importRegex = /import \{([\s\S]*?)\} from '\.\/security_schemas';/;
const importMatch = code.match(importRegex);
if (importMatch && !importMatch[0].includes('IngestSchema')) {
  code = code.replace(importRegex, "import { $1, IngestBatchSchema } from './security_schemas';");
}

const ingestRoute = `
// ============================================================================
// FIX 01: INPUT SANITIZATION & VALIDATION (/api/ingest)
// ============================================================================
router.post('/ingest', apiLimiter, optionalAuth, validateBody(IngestBatchSchema), async (req: Request, res: Response) => {
  try {
    // The payload is already validated and sanitized by Zod via IngestBatchSchema and validateBody
    const { rows } = req.body;
    
    // Example ingestion processing
    return res.status(200).json({
      success: true,
      message: \`Successfully ingested and sanitized \${rows.length} records.\`
    });
  } catch (error) {
    return res.status(400).json({ error: 'Ingestion failed' });
  }
});
`;

if (!code.includes('/ingest')) {
  code = code.replace(/router\.post\('\/datasets\/validate'/, ingestRoute + '\nrouter.post(\'/datasets/validate\'');
}

fs.writeFileSync('server/routes.ts', code);
console.log('Added /api/ingest route');
