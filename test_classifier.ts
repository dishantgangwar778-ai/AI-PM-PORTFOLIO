import { classifyReturnReasonWithGemini } from './server/gemini.ts';
import { db } from './server/db.ts';

async function mockRun() {
  db.resetToDemo();
  try {
    const res1 = await classifyReturnReasonWithGemini('Wrong item received', 'I ordered the black size 9 boots, but you shipped me tan suede loafers size 11.', { name: 'Chelsea Ankle Boot', category: 'Footwear' });
    console.log("CLS-007 Result:", res1);
  } catch (err) {
    console.error("Runner error:", err);
  }
}
mockRun();
