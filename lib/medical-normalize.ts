// lib/medical-normalize.ts
// Medical ASR post-processing: de-duplication, terminology normalization, hallucination filtering.
// Runs server-side after audio transcription, and client/server-side before SOAP generation.

// ─── 0. Medical Vocabulary Prompt for Transcription Biasing ─────────
// Passed via the `prompt` parameter to the /v1/audio/transcriptions endpoint
// to bias acoustic decoding toward correct clinical spelling.
export const MEDICAL_TRANSCRIPTION_PROMPT = 
  "Clinical encounter dictation. Vocabulary and medications: Lasix (furosemide), lisinopril, " +
  "empagliflozin (Jardiance), amlodipine, bibasal crackles, bibasilar, unstable angina, cardiac catheterization, " +
  "metoprolol succinate, metoprolol tartrate, carvedilol, spironolactone, sacubitril/valsartan (Entresto), " +
  "apixaban (Eliquis), rivaroxaban (Xarelto), clopidogrel (Plavix), atorvastatin, rosuvastatin, dapagliflozin (Farxiga), " +
  "semaglutide (Ozempic), tirzepatide (Mounjaro), metformin, glipizide, levothyroxine, gabapentin, hydrochlorothiazide, " +
  "losartan, valsartan, omeprazole, pantoprazole, prednisone, dexamethasone, albuterol, budesonide, formoterol, tiotropium, " +
  "ceftriaxone, vancomycin, piperacillin/tazobactam (Zosyn), azithromycin, amoxicillin/clavulanate, doxycycline, ciprofloxacin. " +
  "Conditions & acronyms: AFib with RVR, AFlutter, NSVT, VT, VF, HFrEF, HFpEF, CHF, CAD, STEMI, NSTEMI, TTE, TEE, EKG, " +
  "ECG, MRSA, VRE, UTI, AKI, ATN, CKD stage 3b, COPD, DVT, PE, CBC, BMP, CMP, BNP, troponin, HbA1c, GFR, INR, PTT, " +
  "BP 120/80, HR 72 bpm, SpO2 98%, BMI, JVD, S1/S2, regular rate and rhythm. Preserve exact clinician phrasing.";

// ─── 1. Hallucination Filter ─────────────────────────────────────────
// Whisper models have known hallucination patterns when encountering silence,
// low SNR audio, or audio segment boundaries.

const HALLUCINATION_PATTERNS: RegExp[] = [
  // Web / URL outro spam (e.g. "For more information, visit www.FEMA.gov")
  /(?:for\s+more\s+(?:information|details|info),?\s+(?:please\s+)?visit|visit)\s+(?:https?:\/\/)?(?:www\.)?[a-z0-9\-_]+(?:\.[a-z0-9\-_]+)+(?:\/[^\s.,]*)?/gi,
  /\b(?:https?:\/\/)?(?:www\.)?fema\.gov\b/gi,
  /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9\-_]+\.(?:gov|org|com|net|io|edu)(?:\/[^\s.,]*)?/gi,
  
  // YouTube / Social media outro hallucinations
  /(?:thank\s+you\s+for\s+watching|thanks\s+for\s+watching)[.!]?/gi,
  /(?:please\s+)?(?:like,?\s+)?(?:and\s+)?subscribe(?:\s+to\s+(?:the|my|our)\s+channel)?[.!]?/gi,
  /(?:don'?t\s+forget\s+to\s+)?like\s+and\s+subscribe[.!]?/gi,
  /(?:see\s+you\s+in\s+the\s+next\s+(?:video|episode)|see\s+you\s+next\s+time)[.!]?/gi,
  
  // Subtitle credit hallucinations
  /(?:subtitles|transcription|captions?)\s+(?:by|created\s+by|provided\s+by)\s+[^\n.,]+/gi,
  /\b(?:amara\.org|opensubtitles\.org|subflicks\.com)\b/gi,
  
  // Repetitive trailing noise loops
  /(?:\s*\.{3,}\s*){3,}/g,
];

/**
 * Remove known Whisper hallucination loops and outro spam from transcripts.
 */
export function stripWhisperHallucinations(text: string): string {
  if (!text) return text;
  let cleaned = text;
  for (const pattern of HALLUCINATION_PATTERNS) {
    cleaned = cleaned.replace(pattern, " ");
  }
  // Clean up any double spaces or dangling punctuation left behind
  return cleaned
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/([.,!?;:])\1+/g, "$1")
    .trim();
}

// ─── 2. Deterministic De-duplication & N-Gram Loop Collapsing ────────
// Fixes transcripts where a phrase or sentence repeated 2-10+ times.

/**
 * Collapse repeated contiguous n-grams (phrases of 2-8 words repeated back-to-back).
 * e.g. "lodopine nematode lodopine nematode" -> "lodopine nematode"
 * e.g. "he was admitted he was admitted he was admitted" -> "he was admitted"
 */
export function collapseRepeatedNgrams(text: string, maxN: number = 8, minN: number = 2): string {
  if (!text || text.length < 15) return text;
  
  const words = text.trim().split(/\s+/);
  if (words.length < minN * 2) return text;

  const resultWords: string[] = [];
  let i = 0;

  while (i < words.length) {
    let matched = false;

    // Try larger n-grams first down to minN
    for (let n = Math.min(maxN, Math.floor((words.length - i) / 2)); n >= minN; n--) {
      const phrase = words.slice(i, i + n).join(" ").toLowerCase();
      // Check if subsequent window matches
      let repeatCount = 1;
      while (i + repeatCount * n + n <= words.length) {
        const nextPhrase = words.slice(i + repeatCount * n, i + (repeatCount + 1) * n).join(" ").toLowerCase();
        if (phrase === nextPhrase) {
          repeatCount++;
        } else {
          break;
        }
      }

      if (repeatCount > 1) {
        // Keep the original casing of the first instance
        for (let k = 0; k < n; k++) {
          resultWords.push(words[i + k]);
        }
        i += repeatCount * n;
        matched = true;
        break;
      }
    }

    if (!matched) {
      resultWords.push(words[i]);
      i++;
    }
  }

  return resultWords.join(" ");
}

/**
 * Remove repeated sentence-level phrases from a transcript.
 * Detects identical or near-identical sentences repeating (even non-consecutively within a sliding window).
 */
export function deduplicateTranscript(text: string): string {
  if (!text || text.length < 20) return text;

  // First collapse word-level n-gram stutter loops
  const ngramCleaned = collapseRepeatedNgrams(text);

  // Split into sentences (period, question mark, exclamation, or newline).
  const sentences = ngramCleaned
    .split(/(?<=[.?!\n])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length < 2) return ngramCleaned;

  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const sentence of sentences) {
    // Normalize for comparison: lowercase, collapse whitespace, strip trailing punctuation
    const key = sentence
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[.?!]+$/, "")
      .trim();

    if (key.length < 12) {
      // Very short fragments — keep them (e.g. "Yes." / "OK." / "No pain.")
      deduped.push(sentence);
      continue;
    }

    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(sentence);
    }
  }

  return deduped.join(" ");
}

/**
 * Remove overlapping text between the tail of the previous chunk and
 * the head of the current chunk using longest matching word n-gram.
 * Prevents overlapping audio chunks from producing repeated sentences.
 */
export function removeChunkOverlap(
  prevSegment: string,
  currentSegment: string,
  overlapWindowWords: number = 40
): string {
  if (!prevSegment || !currentSegment) return currentSegment;

  const prevWords = prevSegment.trim().split(/\s+/);
  const currWords = currentSegment.trim().split(/\s+/);

  // Take last N words of previous segment
  const tailWords = prevWords.slice(-overlapWindowWords);
  // Take first N words of current segment
  const headWords = currWords.slice(0, overlapWindowWords);

  // Find longest suffix of tailWords that matches a prefix of headWords (down to 2 words)
  let bestOverlap = 0;
  for (let len = Math.min(tailWords.length, headWords.length); len >= 2; len--) {
    const tailSlice = tailWords.slice(-len).join(" ").toLowerCase().replace(/[.,!?;:]/g, "");
    const headSlice = headWords.slice(0, len).join(" ").toLowerCase().replace(/[.,!?;:]/g, "");
    if (tailSlice === headSlice) {
      bestOverlap = len;
      break;
    }
  }

  if (bestOverlap > 0) {
    // Remove the overlapping prefix from the current segment
    return currWords.slice(bestOverlap).join(" ");
  }

  return currentSegment;
}

/**
 * Sequentially stitch and deduplicate an array of transcript chunks.
 */
export function stitchTranscriptChunks(chunks: string[]): string {
  if (!chunks || chunks.length === 0) return "";
  if (chunks.length === 1) return deduplicateTranscript(stripWhisperHallucinations(chunks[0]));

  let assembled = "";
  for (const rawChunk of chunks) {
    const cleanedChunk = stripWhisperHallucinations(rawChunk || "");
    if (!cleanedChunk) continue;

    if (!assembled) {
      assembled = cleanedChunk;
    } else {
      const dedupedChunk = removeChunkOverlap(assembled, cleanedChunk);
      if (dedupedChunk) {
        assembled += " " + dedupedChunk;
      }
    }
  }

  return deduplicateTranscript(assembled);
}

// ─── 3. Medical Terminology Corrections ─────────────────────────────
// Deterministic regex corrections for corruptions found in tests and real-world audio.

const MEDICAL_CORRECTIONS: Array<{ pattern: RegExp; replacement: string }> = [
  // ── Specific test corruptions requested ──
  // Lasix corruptions (LASIK's, LASIK, ASICs, ASIC's, etc.)
  { pattern: /\b(?:lasik['’]?s|lasiks|asics|asic['’]?s|lasik)\b/gi, replacement: "Lasix" },
  
  // Lisinopril corruptions (acinopril, asinopril, lisnopril)
  { pattern: /\b(?:acinopril|asinopril|lisnopril|lysinopril)\b/gi, replacement: "lisinopril" },
  
  // Empagliflozin corruptions (piagliflozin, piegliflozin, pyagliflozin, impagliflozin)
  { pattern: /\b(?:piagliflozin|piegliflozin|pyagliflozin|impagliflozin)\b/gi, replacement: "empagliflozin" },
  
  // Amlodipine corruptions (lodopine nematode, lodopine, amlodopine)
  { pattern: /\blodopine(?:\s+nematode)?\b/gi, replacement: "amlodipine" },
  { pattern: /\bamlodopine\b/gi, replacement: "amlodipine" },
  
  // Bibasal crackles corruptions (fibasal crackles, fibasilar, phi basal)
  { pattern: /\bfibasal(?:\s+crackles)?\b/gi, replacement: "bibasal crackles" },
  { pattern: /\bfibasilar(?:\s+crackles)?\b/gi, replacement: "bibasilar crackles" },
  { pattern: /\bphi[\s-]?basal\b/gi, replacement: "bibasal" },

  // Cardiac / Pulmonary
  { pattern: /\bunstable\s+engine\b/gi, replacement: "unstable angina" },
  { pattern: /\bhardcatrization\b/gi, replacement: "cardiac catheterization" },
  { pattern: /\bheart\s+cath(?:eterization)?\b/gi, replacement: "cardiac catheterization" },
  { pattern: /\bcardiac\s+cath\b/gi, replacement: "cardiac catheterization" },
  { pattern: /\btac of cardio\b/gi, replacement: "tachycardia" },
  { pattern: /\btach(?:y)?[\s-]?cardia\b/gi, replacement: "tachycardia" },
  { pattern: /\ba[\s-]?fib\b/gi, replacement: "AFib" },
  { pattern: /\ba[\s-]?flutter\b/gi, replacement: "AFlutter" },
  { pattern: /\brvr\b/gi, replacement: "RVR" },
  { pattern: /\bnsvt\b/gi, replacement: "NSVT" },
  { pattern: /\bvt\b/gi, replacement: "VT" },
  { pattern: /\bvf\b/gi, replacement: "VF" },
  { pattern: /\btte\b/gi, replacement: "TTE" },
  { pattern: /\btee\b/gi, replacement: "TEE" },
  { pattern: /\bekg\b/gi, replacement: "EKG" },
  { pattern: /\becg\b/gi, replacement: "ECG" },
  { pattern: /\bchf\b/gi, replacement: "CHF" },
  { pattern: /\bhf[\s-]?ref\b/gi, replacement: "HFrEF" },
  { pattern: /\bhf[\s-]?pef\b/gi, replacement: "HFpEF" },
  { pattern: /\bcardia[\s-]?myopathy\b/gi, replacement: "cardiomyopathy" },
  { pattern: /\bendo[\s-]?card[\s-]?itis\b/gi, replacement: "endocarditis" },
  { pattern: /\bpneu[\s-]?monia\b/gi, replacement: "pneumonia" },
  { pattern: /\bdys[\s-]?pnea\b/gi, replacement: "dyspnea" },
  { pattern: /\bcpap\b/gi, replacement: "CPAP" },
  { pattern: /\bbipap\b/gi, replacement: "BiPAP" },

  // Infectious / Lab
  { pattern: /\bmrsa\b/gi, replacement: "MRSA" },
  { pattern: /\bvre\b/gi, replacement: "VRE" },
  { pattern: /\buti\b/gi, replacement: "UTI" },
  { pattern: /\bcbc\b/gi, replacement: "CBC" },
  { pattern: /\bbmp\b/gi, replacement: "BMP" },
  { pattern: /\bcmp\b/gi, replacement: "CMP" },
  { pattern: /\bbnp\b/gi, replacement: "BNP" },
  { pattern: /\bcrp\b/gi, replacement: "CRP" },
  { pattern: /\besr\b/gi, replacement: "ESR" },
  { pattern: /\batn\b/gi, replacement: "ATN" },
  { pattern: /\baki\b/gi, replacement: "AKI" },
  { pattern: /\bgfr\b/gi, replacement: "GFR" },
  { pattern: /\binr\b/gi, replacement: "INR" },
  { pattern: /\bptt\b/gi, replacement: "PTT" },
  { pattern: /\bhba1c\b/gi, replacement: "HbA1c" },
  { pattern: /\bcellul[\s-]?itis\b/gi, replacement: "cellulitis" },
  { pattern: /\bbacter[\s-]?emia\b/gi, replacement: "bacteremia" },
  { pattern: /\bsepti[\s-]?cemia\b/gi, replacement: "septicemia" },
  { pattern: /\btub[\s-]?ular[\s-]?necrosis\b/gi, replacement: "tubular necrosis" },
  { pattern: /\bvaso[\s-]?pressors?\b/gi, replacement: "vasopressor" },
  { pattern: /\bcardio[\s-]?version\b/gi, replacement: "cardioversion" },
  { pattern: /\bdefibrillat(?:e|ion|or)\b/gi, replacement: "defibrillation" },

  // Imaging / Procedures / Routes
  { pattern: /\bct\b/gi, replacement: "CT" },
  { pattern: /\bmri\b/gi, replacement: "MRI" },
  { pattern: /\biv\b/gi, replacement: "IV" },
  { pattern: /\bim\b/gi, replacement: "IM" },
  { pattern: /\bpo\b/gi, replacement: "PO" },
  { pattern: /\bprn\b/gi, replacement: "PRN" },
  { pattern: /\bbid\b/gi, replacement: "BID" },
  { pattern: /\btid\b/gi, replacement: "TID" },
  { pattern: /\bqid\b/gi, replacement: "QID" },
  { pattern: /\bqd\b/gi, replacement: "QD" },
  { pattern: /\bicu\b/gi, replacement: "ICU" },
  { pattern: /\bed\b/gi, replacement: "ED" },

  // Vital signs
  { pattern: /\bbp\b/gi, replacement: "BP" },
  { pattern: /\bhr\b/gi, replacement: "HR" },
  { pattern: /\brr\b/gi, replacement: "RR" },
  { pattern: /\bspo2\b/gi, replacement: "SpO2" },
  { pattern: /\bo2[\s-]?sat\b/gi, replacement: "O2 sat" },
  { pattern: /\bbmi\b/gi, replacement: "BMI" },

  // Common Drug Names
  { pattern: /\bentresto\b/gi, replacement: "Entresto" },
  { pattern: /\beliquis\b/gi, replacement: "Eliquis" },
  { pattern: /\bxarelto\b/gi, replacement: "Xarelto" },
  { pattern: /\bplavix\b/gi, replacement: "Plavix" },
  { pattern: /\bmetoprolol\b/gi, replacement: "metoprolol" },
  { pattern: /\batorvastatin\b/gi, replacement: "atorvastatin" },
  { pattern: /\blosartan\b/gi, replacement: "losartan" },
  { pattern: /\bomeprazole\b/gi, replacement: "omeprazole" },
  { pattern: /\bmetformin\b/gi, replacement: "metformin" },
  { pattern: /\bjardiance\b/gi, replacement: "Jardiance" },
  { pattern: /\bfarxiga\b/gi, replacement: "Farxiga" },
  { pattern: /\boxycodone\b/gi, replacement: "oxycodone" },
  { pattern: /\bhydrocodone\b/gi, replacement: "hydrocodone" },
  { pattern: /\bvancomycin\b/gi, replacement: "vancomycin" },
  { pattern: /\bzosyn\b/gi, replacement: "Zosyn" },
  { pattern: /\bheparin\b/gi, replacement: "heparin" },
  { pattern: /\bwarfarin\b/gi, replacement: "warfarin" },
  { pattern: /\binsulin\b/gi, replacement: "insulin" },
  { pattern: /\blevothyroxine\b/gi, replacement: "levothyroxine" },
  { pattern: /\bgabapentin\b/gi, replacement: "gabapentin" },
  { pattern: /\bprednisone\b/gi, replacement: "prednisone" },
  { pattern: /\bazithromycin\b/gi, replacement: "azithromycin" },
  { pattern: /\bamoxicillin\b/gi, replacement: "amoxicillin" },

  // Temperature / Units
  { pattern: /(\d+(?:\.\d+)?)\s*degrees?\s*(?:celsius|centigrade|C)\b/gi, replacement: "$1°C" },
  { pattern: /(\d+(?:\.\d+)?)\s*degrees?\s*(?:fahrenheit|F)\b/gi, replacement: "$1°F" },
];

/**
 * Apply deterministic medical terminology corrections to a transcript.
 */
export function applyMedicalCorrections(text: string): string {
  if (!text) return text;
  let result = text;
  for (const { pattern, replacement } of MEDICAL_CORRECTIONS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Master cleanup pipeline: runs hallucination removal, de-duplication,
 * and medical terminology normalization. Run this BEFORE SOAP generation.
 */
export function cleanTranscriptBeforeSoap(text: string): string {
  if (!text) return text;
  let cleaned = stripWhisperHallucinations(text);
  cleaned = deduplicateTranscript(cleaned);
  cleaned = applyMedicalCorrections(cleaned);
  return cleaned.trim();
}

// ─── 4. Full Pipeline ───────────────────────────────────────────────

export interface NormalizeResult {
  text: string;
  rawText: string;
  corrections: string[];
}

export async function medicalNormalizePipeline(
  rawText: string,
  prevSegmentTail?: string
): Promise<NormalizeResult> {
  const corrections: string[] = [];

  // Step 1: Strip hallucinations
  let text = stripWhisperHallucinations(rawText || "");
  if (text !== rawText) corrections.push("hallucinations-stripped");

  // Step 2: Remove chunk boundary overlap if previous tail is available
  if (prevSegmentTail) {
    const beforeOverlap = text;
    text = removeChunkOverlap(prevSegmentTail, text);
    if (text !== beforeOverlap) corrections.push("chunk-overlap-removed");
  }

  // Step 3: N-gram and sentence de-duplication
  const beforeDedup = text;
  text = deduplicateTranscript(text);
  if (text !== beforeDedup) corrections.push("duplicates-removed");

  // Step 4: Medical corrections
  const beforeCorrections = text;
  text = applyMedicalCorrections(text);
  if (text !== beforeCorrections) corrections.push("medical-terms-normalized");

  return { text, rawText, corrections };
}
