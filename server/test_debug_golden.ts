import { goldenTestEngine } from './golden_runner';

async function main() {
  const res = await goldenTestEngine.runTests('all');
  console.log(`\n=== GOLDEN TEST EXECUTION SUMMARY ===`);
  console.log(`Total: ${res.totalTests}, Passed: ${res.passed}, Failed: ${res.failed}, Score: ${res.overallScore}%`);
  console.log(`Release Readiness: ${res.releaseReadiness}\n`);

  const failed = res.results.filter((r) => r.status !== 'PASS');
  if (failed.length > 0) {
    console.log(`FAILED TESTS (${failed.length}):`);
    failed.forEach((f) => {
      console.log(`- [${f.testCaseId}] ${f.title}`);
      console.log(`  Expected:`, JSON.stringify(f.expected));
      console.log(`  Actual:`, JSON.stringify(f.actual));
      console.log(`  Diff: ${f.difference}`);
      console.log(`  Reason: ${f.reason}\n`);
    });
  } else {
    console.log('ALL GOLDEN TESTS PASSED (100%)!');
  }
}

main().catch(console.error);
