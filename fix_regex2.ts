import fs from 'fs';
let code = fs.readFileSync('server/security_schemas.ts', 'utf8');
const searchStr = ".replace(/<script [^<]*(?:(?!</script>)<[^<]*)*</script>/gi, '')";
const replaceStr = ".replace(/<script\\\\b[^<]*(?:(?!<\\\\/script>)<[^<]*)*<\\\\/script>/gi, '')";
code = code.replace(searchStr, replaceStr);
fs.writeFileSync('server/security_schemas.ts', code);
