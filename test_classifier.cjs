const { ruleBasedClassify } = require('./dist/server.cjs'); // assuming the build output has it, or just use ts-node

async function run() {
  const tsNode = require('ts-node');
  tsNode.register({ transpileOnly: true });
  const gemini = require('./server/gemini.ts');
  
  const res1 = gemini.ruleBasedClassify('Wrong item received', 'I ordered the black size 9 boots, but you shipped me tan suede loafers size 11.');
  console.log("CLS-007 Result:", res1);
  
}
run();
