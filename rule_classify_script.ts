export function ruleBasedClassify(reason: string, comment: string = ''): any {
  const text = `${reason} ${comment}`.toLowerCase().trim();
  const reasonText = reason.toLowerCase().trim();

  if (!text || text === 'none') {
    return { category: 'Other', subcategory: 'Unspecified', sentiment: 'Neutral', confidence: 0.5, explanation: 'Insufficient evidence', isInsufficientEvidence: true, needsHumanReview: true };
  }

  // LEVEL 1: EXPLICIT FULFILLMENT & WRONG ITEM
  const level1Keywords = ["wrong item received", "wrong size sent", "incorrect item", "sent wrong color", "missing item", "late delivery", "package damaged in transit"];
  const isLevel1 = level1Keywords.some(kw => text.includes(kw) || reasonText.includes(kw)) ||
                   text.includes('wrong item') || text.includes('received wrong') || text.includes('ordered');
  if (isLevel1) {
    return { category: 'Wrong Item', subcategory: 'Fulfillment Error', sentiment: 'Negative', confidence: 0.97, explanation: 'Warehouse fulfillment picking or packing SKU error.' };
  }

  // LEVEL 2: PRODUCT DEFECT & QUALITY
  const level2ReasonKeywords = ["sole peeling", "broken zipper", "fabric tearing", "stitching unraveling", "defective"];
  const level2CommentKeywords = ["broke", "tore", "ripped", "separated", "damaged", "snapped", "tear", "broken", "stitch", "defect", "rip", "button", "zipper", "fell apart", "detached"];
  const isLevel2 = level2ReasonKeywords.some(kw => reasonText.includes(kw)) ||
                   level2CommentKeywords.some(kw => text.includes(kw));
  if (isLevel2) {
    return { category: 'Quality', subcategory: 'Manufacturing Defect', sentiment: 'Negative', confidence: 0.95, explanation: 'Physical quality flaw or component separation reported.' };
  }

  // LEVEL 3: SIZE & FIT
  const level3ReasonKeywords = ["too small", "too large", "tight waist", "shoulders too tight", "runs small", "inseam too short", "runs large", "size down", "size up", "fit", "sizing", "tight"];
  const level3CommentKeywords = ["could not button", "cannot raise arms", "need size up", "too tight", "cant even zip up", "cannot button", "loose", "baggy", "wide", "huge"];
  const isLevel3 = level3ReasonKeywords.some(kw => reasonText.includes(kw) || text.includes(kw)) ||
                   level3CommentKeywords.some(kw => text.includes(kw));
  if (isLevel3) {
    return { category: 'Size/Fit', subcategory: 'Sizing Issue', sentiment: 'Negative', confidence: 0.96, explanation: 'Garment or footwear dimensions run tighter or larger than expectation.' };
  }

  // LEVEL 4: COLOR & CUSTOMER PREFERENCE
  const level4Keywords = ["changed mind", "buyer remorse", "color looks different", "style doesn't suit", "color", "colour", "shade", "not for me", "did not work", "picture", "photo", "different"];
  const isLevel4 = level4Keywords.some(kw => text.includes(kw));
  if (isLevel4) {
    return { category: 'Color', subcategory: 'Customer Preference', sentiment: 'Neutral', confidence: 0.85, explanation: 'General subjective customer preference or color mismatch.' };
  }

  return { category: 'Other', subcategory: 'Unclassified', sentiment: 'Neutral', confidence: 0.6, explanation: 'No matching rule.' };
}
