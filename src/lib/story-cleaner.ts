/**
 * Strict UK English and clean typography post-processor:
 * 1. Converts American 'z' spellings to British 's' (e.g. prioritize -> prioritise, customized -> customised).
 * 2. Corrects 'fulfillment' -> 'fulfilment' and 'center' -> 'centre'.
 * 3. Strips all markdown asterisks (**bold** and *italic*) to keep the output completely clean of asterisks.
 * 4. Replaces asterisk bullet points (* ) with clean typography bullets (• ).
 * 5. Strips markdown hashtag headers (###) into clean, elegant section titles.
 */
export function cleanStoryToUkEnglish(text: string): string {
  if (!text) return '';
  let cleaned = text;

  // UK English spelling transformations
  cleaned = cleaned
    .replace(/\bprioritiz(e|ed|es|ing)\b/gi, (m, end) => 'prioritis' + end)
    .replace(/\bcustomiz(e|ed|es|ing|ation|ations)\b/gi, (m, end) => end.startsWith('ation') ? 'customis' + end : 'customis' + end)
    .replace(/\boptimiz(e|ed|es|ing|ation|ations)\b/gi, (m, end) => end.startsWith('ation') ? 'optimis' + end : 'optimis' + end)
    .replace(/\borganiz(e|ed|es|ing|ation|ations)\b/gi, (m, end) => end.startsWith('ation') ? 'organis' + end : 'organis' + end)
    .replace(/\brealiz(e|ed|es|ing)\b/gi, (m, end) => 'realis' + end)
    .replace(/\banalyz(e|ed|es|ing)\b/gi, (m, end) => 'analys' + end)
    .replace(/\bcentraliz(e|ed|es|ing)\b/gi, (m, end) => 'centralis' + end)
    .replace(/\butiliz(e|ed|es|ing)\b/gi, (m, end) => 'utilis' + end)
    .replace(/\bcommercializ(e|ed|es|ing)\b/gi, (m, end) => 'commercialis' + end)
    .replace(/\bstandardiz(e|ed|es|ing)\b/gi, (m, end) => 'standardis' + end)
    .replace(/\bharmoniz(e|ed|es|ing)\b/gi, (m, end) => 'harmonis' + end)
    .replace(/\bmonetiz(e|ed|es|ing)\b/gi, (m, end) => 'monetis' + end)
    .replace(/\brecogniz(e|ed|es|ing)\b/gi, (m, end) => 'recognis' + end)
    .replace(/\bfulfillment\b/gi, 'fulfilment')
    .replace(/\bfulfill\b/gi, 'fulfil')
    .replace(/\bcenter\b/gi, 'centre')
    .replace(/\bcenters\b/gi, 'centres')
    .replace(/\bcost center\b/gi, 'cost centre')
    .replace(/\bcost centers\b/gi, 'cost centres')
    .replace(/\bdistribution center\b/gi, 'distribution centre')
    .replace(/\bdistribution centers\b/gi, 'distribution centres')
    .replace(/\bfulfilment center\b/gi, 'fulfilment centre')
    .replace(/\bfulfilment centers\b/gi, 'fulfilment centres');

  // Strip all double asterisks (bold markers)
  cleaned = cleaned.replace(/\*\*/g, '');

  // Convert markdown single asterisk bullet points to clean bullets
  cleaned = cleaned.replace(/^[ \t]*\*([ \t]+)/gm, '• $1');

  // Strip markdown hashes from headers (e.g., "### The Story So Far:" -> "The Story So Far:")
  cleaned = cleaned.replace(/^#{1,4}[ \t]+/gm, '');

  // Normalize duplicate blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}
