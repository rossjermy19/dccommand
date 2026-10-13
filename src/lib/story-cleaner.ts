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
    .replace(/\bcategoriz(e|ed|es|ing|ation|ations)\b/gi, (m, end) => 'categoris' + end)
    .replace(/\bspecializ(e|ed|es|ing|ation|ations)\b/gi, (m, end) => 'specialis' + end)
    .replace(/\bsynchroniz(e|ed|es|ing|ation|ations)\b/gi, (m, end) => 'synchronis' + end)
    .replace(/\bsummariz(e|ed|es|ing|ation|ations)\b/gi, (m, end) => 'summaris' + end)
    .replace(/\bpersonaliz(e|ed|es|ing|ation|ations)\b/gi, (m, end) => 'personalis' + end)
    .replace(/\bmaximiz(e|ed|es|ing)\b/gi, (m, end) => 'maximis' + end)
    .replace(/\bminimiz(e|ed|es|ing)\b/gi, (m, end) => 'minimis' + end)
    .replace(/\bpenaliz(e|ed|es|ing)\b/gi, (m, end) => 'penalis' + end)
    .replace(/\bvisualiz(e|ed|es|ing|ation|ations)\b/gi, (m, end) => 'visualis' + end)
    .replace(/\bemphasiz(e|ed|es|ing)\b/gi, (m, end) => 'emphasis' + end)
    .replace(/\bapologiz(e|ed|es|ing)\b/gi, (m, end) => 'apologis' + end)
    .replace(/\bfulfillment\b/gi, 'fulfilment')
    .replace(/\bfulfill\b/gi, 'fulfil')
    .replace(/\bcenter\b/gi, 'centre')
    .replace(/\bcenters\b/gi, 'centres')
    .replace(/\bcost center\b/gi, 'cost centre')
    .replace(/\bcost centers\b/gi, 'cost centres')
    .replace(/\bdistribution center\b/gi, 'distribution centre')
    .replace(/\bdistribution centers\b/gi, 'distribution centres')
    .replace(/\bfulfilment center\b/gi, 'fulfilment centre')
    .replace(/\bfulfilment centers\b/gi, 'fulfilment centres')
    .replace(/\bcolor\b/gi, 'colour')
    .replace(/\bcolors\b/gi, 'colours')
    .replace(/\bflavor\b/gi, 'flavour')
    .replace(/\bflavors\b/gi, 'flavours')
    .replace(/\bbehavior\b/gi, 'behaviour')
    .replace(/\bbehaviors\b/gi, 'behaviours')
    .replace(/\bfavor\b/gi, 'favour')
    .replace(/\bfavors\b/gi, 'favours')
    .replace(/\bcatalog\b/gi, 'catalogue')
    .replace(/\bcatalogs\b/gi, 'catalogues')
    .replace(/\bdialog\b/gi, 'dialogue')
    .replace(/\bdialogs\b/gi, 'dialogues');

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
