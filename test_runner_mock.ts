import { goldenTestEngine } from './server/golden_runner.ts';
import { db } from './server/db.ts';

async function mockRun() {
  db.resetToDemo();
  try {
    const runResult = await goldenTestEngine.runTests();
    console.log("Run completed:", runResult.overallScore, "Pass:", runResult.passed, "Fail:", runResult.failed);
  } catch (err) {
    console.error("Runner error:", err);
  }
}
mockRun();
