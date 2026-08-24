const fs = require('fs');
const geminiFile = 'server/gemini.ts';

let code = fs.readFileSync(geminiFile, 'utf8');

// 1. Update classifyReturnReasonWithGemini prompt
const newPrompt = `You are an expert e-commerce return classification engine. Analyze the incoming return payload: {reason, comment, product, category}.

CLASSIFICATION RULES:
1. RULE OF PRIORITY: Check for Fulfillment Errors FIRST. If the 'reason' field contains explicit fulfillment failure intent (e.g., "Wrong item received", "Incorrect item"), you MUST classify the return as "Wrong Item" / "Fulfillment/Shipping".
2. CONTEXT DISAMBIGUATION: Color words (e.g., "black", "blue") or size numbers inside 'comment' describe the fulfillment error context when paired with a "Wrong item" reason. DO NOT classify these records under "Color" or "Size/Fit".
3. Assign a confidence score between 0.00 and 1.00 based on keyword alignment.

OUTPUT FORMAT (JSON):
{
  "category": "<Size/Fit Customer Fulfillment/Shipping Preference Quality/Defect |>",
  "subcategory": "<Extracted issue primary>",
  "confidence": <float>,
  "sentiment": "<Negative|Neutral|Positive>",
  "explanation": "<Brief explanation>"
}

Payload:
\${combinedText}`;

// Use regex to replace everything between `contents: \`` and `, config:`
code = code.replace(/contents: \`[\s\S]*?\`,\s*config:/, `contents: \`${newPrompt}\`,\n        config:`);

// 2. Replace ruleBasedClassify entirely
const newRuleBased = `
export function ruleBasedClassify(reason: string, comment: string = ''): ClassificationResult {
  const text = \`\${reason} \${comment}\`.toLowerCase().trim();
  const reasonText = reason.toLowerCase().trim();

  if (!text || text === 'none') {
    return {
      category: 'Other',
      subcategory: 'Unspecified',
      sentiment: 'Neutral',
      confidence: 0.5,
      explanation: 'Insufficient evidence',
      isInsufficientEvidence: true,
      needsHumanReview: true,
    };
  }

  // LEVEL 1: EXPLICIT FULFILLMENT & WRONG ITEM
  const level1Keywords = [
    "wrong item received", "wrong size sent", "incorrect item", 
    "sent wrong color", "missing item", "late delivery", "package damaged in transit",
    "wrong item", "received wrong", "ordered", "shipped me", "different item"
  ];
  if (level1Keywords.some(kw => reasonText.includes(kw) || text.includes(kw))) {
    return { category: 'Wrong Item', subcategory: 'Fulfillment Error', sentiment: 'Negative', confidence: 0.97, explanation: 'Warehouse fulfillment picking or packing SKU error.' };
  }

  // LEVEL 2: PRODUCT DEFECT & QUALITY
  const level2ReasonKeywords = ["sole peeling", "broken zipper", "fabric tearing", "stitching unraveling", "defective"];
  const level2CommentKeywords = ["broke", "tore", "ripped", "separated", "damaged", "snapped", "tear", "broken", "stitch", "defect", "rip", "button", "zipper", "fell apart", "detached"];
  if (level2ReasonKeywords.some(kw => reasonText.includes(kw)) || level2CommentKeywords.some(kw => text.includes(kw))) {
    return { category: 'Quality', subcategory: 'Manufacturing Defect', sentiment: 'Negative', confidence: 0.95, explanation: 'Physical quality flaw or component separation reported.' };
  }

  // LEVEL 3: SIZE & FIT
  const level3ReasonKeywords = ["too small", "too large", "tight waist", "shoulders too tight", "runs small", "inseam too short", "runs large", "size down", "size up", "fit", "sizing", "tight"];
  const level3CommentKeywords = ["could not button", "cannot raise arms", "need size up", "too tight", "cant even zip up", "cannot button", "loose", "baggy", "wide", "huge", "small"];
  if (level3ReasonKeywords.some(kw => reasonText.includes(kw)) || level3CommentKeywords.some(kw => text.includes(kw))) {
    return { category: 'Size/Fit', subcategory: 'Sizing Issue', sentiment: 'Negative', confidence: 0.96, explanation: 'Garment or footwear dimensions run tighter or larger than expectation.' };
  }

  // LEVEL 4: COLOR & CUSTOMER PREFERENCE
  const level4Keywords = ["changed mind", "buyer remorse", "color looks different", "style doesn't suit", "color", "colour", "shade", "not for me", "did not work", "picture", "photo", "different"];
  if (level4Keywords.some(kw => text.includes(kw))) {
    return { category: 'Color', subcategory: 'Customer Preference', sentiment: 'Neutral', confidence: 0.85, explanation: 'General subjective customer preference or color mismatch.' };
  }

  // Fallback transit damage
  if (text.includes('crushed') || text.includes('smashed') || text.includes('box')) {
    return { category: 'Damage', subcategory: 'In-Transit Damage', sentiment: 'Negative', confidence: 0.94, explanation: 'Packaging or item damage occurring during logistics transit.' };
  }

  return { category: 'Other', subcategory: 'Unclassified', sentiment: 'Neutral', confidence: 0.6, explanation: 'No matching rule.' };
}
`;

// Replace from export function ruleBasedClassify to the end of the file or up to the next export
code = code.replace(/export function ruleBasedClassify[\s\S]*?(?=\nexport|\Z)/, newRuleBased.trim() + "\n\n");

fs.writeFileSync(geminiFile, code);
console.log('Done replacing logic in gemini.ts');
