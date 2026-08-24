import fs from 'fs';
let code = fs.readFileSync('server/security_schemas.ts', 'utf8');

const advancedSanitize = `export const sanitizeSqlAndPrompt = (val: string) => {
  if (!val) return val;
  return val
    // Strip HTML/scripts
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    // Escape SQL control chars
    .replace(/'/g, "''")
    .replace(/;/g, "")
    .replace(/--/g, "")
    // Neutralize prompt injection keywords
    .replace(/ignore previous instructions/gi, "[REDACTED]")
    .replace(/system prompt/gi, "[REDACTED]");
};
const secureField = z.string().trim().max(5000).transform(sanitizeSqlAndPrompt);
`;

const ingestSchema = `
export const IngestSchema = z.object({
  customer_comment: secureField.optional(),
  reason: secureField.optional(),
  sku: secureField.optional(),
  product_category: secureField.optional(),
}).passthrough();

export const IngestBatchSchema = z.object({
  rows: z.array(IngestSchema).min(1).max(50000),
});
`;

if (!code.includes('IngestSchema')) {
  code = code.replace(/export const UploadDatasetSchema/, advancedSanitize + '\n' + ingestSchema + '\nexport const UploadDatasetSchema');
  fs.writeFileSync('server/security_schemas.ts', code);
  console.log('Added IngestSchema');
}
