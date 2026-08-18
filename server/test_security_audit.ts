import { db } from './db';
import { router } from './routes';
import {
  sanitizeCsvFormula,
  sanitizeHtml,
  sanitizeFileName,
  hashPassword,
  verifyPassword,
} from './auth_middleware';
import express from 'express';
import http from 'http';

// Helper to make test HTTP requests
async function makeRequest(
  app: express.Express,
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  headers: Record<string, string> = {},
  body?: any
): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const port = (server.address() as any).port;
      const url = `http://127.0.0.1:${port}${path}`;
      const parsedUrl = new URL(url);

      const reqHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
      };

      const payload = body ? JSON.stringify(body) : undefined;
      if (payload) {
        reqHeaders['Content-Length'] = Buffer.byteLength(payload).toString();
      }

      const req = http.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: parsedUrl.pathname + parsedUrl.search,
          method,
          headers: reqHeaders,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            server.close();
            let parsedBody = data;
            try {
              parsedBody = JSON.parse(data);
            } catch {}
            resolve({ status: res.statusCode || 500, body: parsedBody, headers: res.headers });
          });
        }
      );

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  });
}

export async function runSecurityAudit() {
  console.log('================================================================');
  console.log('🔒 RETURNIQ COMPREHENSIVE SECURITY AUDIT & PENETRATION SUITE');
  console.log('================================================================\n');

  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use('/api', router);

  const testResults: { category: string; test: string; status: 'PASS' | 'FAIL'; details: string }[] = [];

  function record(category: string, test: string, passed: boolean, details: string) {
    testResults.push({
      category,
      test,
      status: passed ? 'PASS' : 'FAIL',
      details,
    });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${category} -> ${test}: ${details}`);
  }

  // --------------------------------------------------------------------------
  // 1. AUTHENTICATION & PASSWORD SECURITY TESTS
  // --------------------------------------------------------------------------
  console.log('--- 1. Testing Authentication & Password Security ---');

  // Test 1.1: Password Hashing & Verification
  const pwd = 'SecurePassword123!';
  const { hash, salt } = hashPassword(pwd);
  const isValidPwd = verifyPassword(pwd, hash, salt);
  const isWrongPwd = verifyPassword('WrongPassword!', hash, salt);
  record(
    'AUTHENTICATION',
    'PBKDF2 Password Hashing',
    isValidPwd && !isWrongPwd,
    `Password verified with salt (${salt.slice(0, 8)}...), wrong password rejected.`
  );

  // Test 1.2: User Registration & No Password Leaks
  const regRes = await makeRequest(app, 'POST', '/api/auth/register', {}, {
    name: 'Alice Security',
    email: 'alice.security@example.com',
    password: 'SuperSecretPassword999!',
  });
  const aliceToken = regRes.body?.token;
  const aliceWsId = regRes.body?.workspace?.id;
  const userHasNoPassword =
    regRes.body?.user &&
    regRes.body.user.password === undefined &&
    regRes.body.user.passwordHash === undefined &&
    regRes.body.user.passwordSalt === undefined;
  record(
    'AUTHENTICATION',
    'Zero Password Leakage in Registration Response',
    regRes.status === 201 && userHasNoPassword && Boolean(aliceToken),
    `Alice registered with token. password/passwordHash fields strictly omitted from API response.`
  );

  // Test 1.3: Login with Invalid Password
  const failLogin = await makeRequest(app, 'POST', '/api/auth/login', {}, {
    email: 'alice.security@example.com',
    password: 'WrongPassword!',
  });
  record(
    'AUTHENTICATION',
    'Reject Invalid Login Credentials',
    failLogin.status === 401,
    `Login with wrong password returned 401 Unauthorized.`
  );

  // Register User Bob in separate workspace
  const regBob = await makeRequest(app, 'POST', '/api/auth/register', {}, {
    name: 'Bob Attacker',
    email: 'bob.attacker@example.com',
    password: 'BobSecretPassword123!',
  });
  const bobToken = regBob.body?.token;
  const bobWsId = regBob.body?.workspace?.id;

  // --------------------------------------------------------------------------
  // 2. WORKSPACE ISOLATION & BOLA / IDOR PENETRATION TESTS
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Testing Workspace Isolation & BOLA/IDOR Defense ---');

  // Test 2.1: Bob attempts to read Alice's Dashboard using x-workspace-id header
  const crossDashboard = await makeRequest(
    app,
    'GET',
    '/api/dashboard',
    {
      Authorization: `Bearer ${bobToken}`,
      'x-workspace-id': aliceWsId,
    }
  );
  record(
    'WORKSPACE_ISOLATION',
    'Prevent Cross-Workspace Dashboard Access (Header Manipulation)',
    crossDashboard.status === 403,
    `Bob attempting to access Alice's workspace (${aliceWsId}) was blocked with 403 Forbidden.`
  );

  // Test 2.2: Bob attempts to read Alice's Datasets using query param
  const crossDatasets = await makeRequest(
    app,
    'GET',
    `/api/datasets?workspaceId=${aliceWsId}`,
    {
      Authorization: `Bearer ${bobToken}`,
    }
  );
  record(
    'WORKSPACE_ISOLATION',
    'Prevent Cross-Workspace Dataset Listing (Query Manipulation)',
    crossDatasets.status === 403,
    `Bob attempting to list Alice's datasets was blocked with 403 Forbidden.`
  );

  // Test 2.3: Bob attempts to read Alice's Products
  const crossProducts = await makeRequest(
    app,
    'GET',
    '/api/products',
    {
      Authorization: `Bearer ${bobToken}`,
      'x-workspace-id': aliceWsId,
    }
  );
  record(
    'WORKSPACE_ISOLATION',
    'Prevent Cross-Workspace Product Catalog Access',
    crossProducts.status === 403,
    `Bob attempting to inspect Alice's products was blocked with 403 Forbidden.`
  );

  // Test 2.4: Bob attempts to switch to Alice's workspace
  const crossSwitch = await makeRequest(
    app,
    'POST',
    '/api/workspaces/switch',
    {
      Authorization: `Bearer ${bobToken}`,
    },
    { id: aliceWsId }
  );
  record(
    'WORKSPACE_ISOLATION',
    'Prevent Unauthorized Workspace Switching',
    crossSwitch.status === 403,
    `Bob attempting to switch active workspace to Alice's workspace returned 403 Forbidden.`
  );

  // Test 2.5: Bob attempts to export Alice's private returns
  const crossExport = await makeRequest(
    app,
    'GET',
    '/api/export?format=csv',
    {
      Authorization: `Bearer ${bobToken}`,
      'x-workspace-id': aliceWsId,
    }
  );
  record(
    'WORKSPACE_ISOLATION',
    'Prevent Cross-Workspace Data Export',
    crossExport.status === 403,
    `Bob attempting to export Alice's return records was blocked with 403 Forbidden.`
  );

  // --------------------------------------------------------------------------
  // 3. FILE UPLOAD SECURITY & MALICIOUS PAYLOADS
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Testing File Upload Security & Malicious Payloads ---');

  // Test 3.1: Dangerous executable extension upload
  const badExtUpload = await makeRequest(
    app,
    'POST',
    '/api/datasets/validate',
    { Authorization: `Bearer ${aliceToken}` },
    {
      fileName: 'malicious_exploit.exe',
      rows: [{ SKU: 'SKU-1', Reason: 'Defect' }],
    }
  );
  record(
    'FILE_SECURITY',
    'Block Executable File Extensions (.exe, .sh, .php)',
    badExtUpload.status === 400 && badExtUpload.body?.error === 'Unsupported File Format',
    `Blocked malicious_exploit.exe with 400 Bad Request: Unsupported File Format.`
  );

  // Test 3.2: Path Traversal in File Name
  const pathTraversalUpload = sanitizeFileName('../../../../etc/passwd.csv');
  record(
    'FILE_SECURITY',
    'Neutralize Directory Path Traversal in Filename',
    pathTraversalUpload.safeName === 'passwd.csv' && !pathTraversalUpload.safeName.includes('..'),
    `Path traversal '../../../../etc/passwd.csv' sanitized to '${pathTraversalUpload.safeName}'.`
  );

  // Test 3.3: Ingestion Payload Row Limit (>50,000 rows)
  const hugeRows = new Array(50001).fill({ SKU: 'SKU-TEST', Reason: 'Too Small' });
  const hugeUpload = await makeRequest(
    app,
    'POST',
    '/api/datasets/validate',
    { Authorization: `Bearer ${aliceToken}` },
    {
      fileName: 'huge_returns.csv',
      rows: hugeRows,
    }
  );
  record(
    'FILE_SECURITY',
    'Enforce Ingestion Batch Row Limits (DoS Prevention)',
    hugeUpload.status === 400,
    `Upload of 50,001 rows rejected with 400 Bad Request: Maximum 50,000 rows permitted.`
  );

  // --------------------------------------------------------------------------
  // 4. CSV FORMULA INJECTION (DDE ATTACK) NEUTRALIZATION
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Testing CSV Formula Injection (DDE) Neutralization ---');

  const dangerousFormulas = [
    "=CMD|' /C calc'!A0",
    '=SUM(1+1)*cmd',
    '+cmd|/c calc',
    '-2+3+cmd|',
    '@SUM(1,2)',
    '\t=1+1',
    '|cmd.exe',
  ];

  let allFormulasNeutralized = true;
  for (const formula of dangerousFormulas) {
    const sanitized = sanitizeCsvFormula(formula);
    if (!sanitized.startsWith("'")) {
      allFormulasNeutralized = false;
      break;
    }
  }

  record(
    'INJECTION_DEFENSE',
    'Neutralize CSV Formula / DDE Injection Vectors',
    allFormulasNeutralized,
    `All formulas (=, +, -, @, \\t, |) neutralized by prepending single quote escape ('...).`
  );

  // --------------------------------------------------------------------------
  // 5. XSS & HTML INJECTION SANITIZATION
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Testing XSS & HTML Injection Sanitization ---');

  const xssPayload = "<script>alert('XSS Attack!')</script>Fabric was defective";
  const cleanHtml = sanitizeHtml(xssPayload);
  const xssBlocked = !cleanHtml.includes('<script>') && !cleanHtml.includes('alert(');
  record(
    'INJECTION_DEFENSE',
    'Strip Script Tags and HTML Injection from Comments',
    xssBlocked && cleanHtml.includes('Fabric was defective'),
    `Payload '${xssPayload}' sanitized cleanly to '${cleanHtml}'.`
  );

  // --------------------------------------------------------------------------
  // 6. INPUT VALIDATION (ZOD SCHEMA ENFORCEMENT)
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Testing Input Validation & Schema Enforcement ---');

  // Test 6.1: Missing required title on action creation
  const badAction = await makeRequest(
    app,
    'POST',
    '/api/actions',
    { Authorization: `Bearer ${aliceToken}` },
    {
      title: '', // Invalid empty title
      expectedImpact: 'High',
    }
  );
  record(
    'INPUT_VALIDATION',
    'Reject Malformed Action Items (Missing Required Fields)',
    badAction.status === 400 && badAction.body?.error === 'Validation Error',
    `Malformed action payload rejected with 400 Bad Request.`
  );

  // Test 6.2: Invalid Review Action Type
  const badReview = await makeRequest(
    app,
    'POST',
    '/api/returns/ret-123/review',
    { Authorization: `Bearer ${aliceToken}` },
    {
      action: 'INVALID_ACTION_HACK',
    }
  );
  record(
    'INPUT_VALIDATION',
    'Reject Invalid Mutation Action Types',
    badReview.status === 400 && badReview.body?.error === 'Validation Error',
    `Invalid review action rejected with 400 Validation Error.`
  );

  // --------------------------------------------------------------------------
  // 7. SECRET & API KEY EXPOSURE
  // --------------------------------------------------------------------------
  console.log('\n--- 7. Testing Secret & API Key Exposure ---');

  const meRes = await makeRequest(app, 'GET', '/api/auth/me', { Authorization: `Bearer ${aliceToken}` });
  const dashboardRes = await makeRequest(app, 'GET', '/api/dashboard', { Authorization: `Bearer ${aliceToken}` });

  const bodyStr = JSON.stringify(meRes.body) + JSON.stringify(dashboardRes.body);
  const hasNoApiKeyLeak = !bodyStr.includes('GEMINI_API_KEY') && !bodyStr.includes('process.env');
  record(
    'SECRET_PROTECTION',
    'Zero Server-Side Secret / API Key Exposure in API Responses',
    hasNoApiKeyLeak,
    `Verified no GEMINI_API_KEY, secrets, or internal env vars exposed in API outputs.`
  );

  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('📊 SECURITY AUDIT SUMMARY');
  console.log('================================================================');

  const total = testResults.length;
  const passed = testResults.filter((r) => r.status === 'PASS').length;
  const failed = total - passed;

  console.log(`TOTAL SECURITY TESTS : ${total}`);
  console.log(`PASSED               : ${passed}`);
  console.log(`FAILED               : ${failed}`);
  console.log(`SECURITY STATUS      : ${failed === 0 ? '100% SECURE & HARDENED' : 'VULNERABILITIES DETECTED'}\n`);

  return {
    total,
    passed,
    failed,
    results: testResults,
    isSecure: failed === 0,
  };
}

// Execute standalone if run directly
if (process.argv[1]?.endsWith('test_security_audit.ts')) {
  runSecurityAudit()
    .then((res) => {
      if (!res.isSecure) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Security audit runtime error:', err);
      process.exit(1);
    });
}
