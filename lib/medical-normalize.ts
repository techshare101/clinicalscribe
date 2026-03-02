// lib/medical-normalize.ts
// Medical ASR post-processing: de-duplication, terminology normalization, confidence flagging.
// Runs server-side after Whisper transcription, before SOAP generation.

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── 1. Deterministic De-duplication ────────────────────────────────
// Removes repeated phrases caused by audio chunk overlap or Whisper retry loops.

/**
 * Remove repeated sentence-level phrases from a transcript.
 * Uses a sliding window to detect and collapse duplicated runs.
 */
export function deduplicateTranscript(text: string): string {
  if (!text || text.length < 20) return text;

  // Split into sentences (period, question mark, exclamation, or newline).
  const sentences = text
    .split(/(?<=[.?!\n])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length < 2) return text;

  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const sentence of sentences) {
    // Normalize for comparison: lowercase, collapse whitespace, strip trailing punctuation
    const key = sentence
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[.?!]+$/, "")
      .trim();

    if (key.length < 10) {
      // Very short fragments — keep them (e.g. "Yes." / "OK.")
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
 * Remove overlapping text between the tail of the previous segment and
 * the head of the current segment. Compares last N tokens of prev with
 * first N tokens of current using longest common subsequence at word level.
 */
export function removeChunkOverlap(
  prevSegment: string,
  currentSegment: string,
  overlapWindowWords: number = 25
): string {
  if (!prevSegment || !currentSegment) return currentSegment;

  const prevWords = prevSegment.trim().split(/\s+/);
  const currWords = currentSegment.trim().split(/\s+/);

  // Take last N words of previous segment
  const tailWords = prevWords.slice(-overlapWindowWords);
  // Take first N words of current segment
  const headWords = currWords.slice(0, overlapWindowWords);

  // Find longest suffix of tailWords that matches a prefix of headWords
  let bestOverlap = 0;
  for (let len = Math.min(tailWords.length, headWords.length); len >= 3; len--) {
    const tailSlice = tailWords.slice(-len).join(" ").toLowerCase();
    const headSlice = headWords.slice(0, len).join(" ").toLowerCase();
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

// ─── 2. Common Medical ASR Corrections ──────────────────────────────
// Deterministic find-and-replace for known Whisper misrecognitions in medical speech.

const MEDICAL_CORRECTIONS: Array<{ pattern: RegExp; replacement: string }> = [
  // Cardiac / Pulmonary
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

  // Imaging / Procedures
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
  { pattern: /\bor\b(?=\s+(?:room|suite|schedule|time))/gi, replacement: "OR" },

  // Vital signs / Physical exam
  { pattern: /\bbp\b/gi, replacement: "BP" },
  { pattern: /\bhr\b/gi, replacement: "HR" },
  { pattern: /\brr\b/gi, replacement: "RR" },
  { pattern: /\bspo2\b/gi, replacement: "SpO2" },
  { pattern: /\bo2[\s-]?sat\b/gi, replacement: "O2 sat" },
  { pattern: /\bbmi\b/gi, replacement: "BMI" },

  // Common Whisper misrecognitions of drug names
  { pattern: /\bentresto\b/gi, replacement: "Entresto" },
  { pattern: /\beliquis\b/gi, replacement: "Eliquis" },
  { pattern: /\bxarelto\b/gi, replacement: "Xarelto" },
  { pattern: /\bplavix\b/gi, replacement: "Plavix" },
  { pattern: /\bmetoprolol\b/gi, replacement: "metoprolol" },
  { pattern: /\blisinopril\b/gi, replacement: "lisinopril" },
  { pattern: /\bamlodipine\b/gi, replacement: "amlodipine" },
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

  // Common Whisper phonetic errors
  { pattern: /\btac of cardio\b/gi, replacement: "tachycardia" },
  { pattern: /\btach(?:y)?[\s-]?cardia\b/gi, replacement: "tachycardia" },
  { pattern: /\bcardia[\s-]?myopathy\b/gi, replacement: "cardiomyopathy" },
  { pattern: /\bendo[\s-]?card[\s-]?itis\b/gi, replacement: "endocarditis" },
  { pattern: /\bcellul[\s-]?itis\b/gi, replacement: "cellulitis" },
  { pattern: /\bbacter[\s-]?emia\b/gi, replacement: "bacteremia" },
  { pattern: /\bsepti[\s-]?cemia\b/gi, replacement: "septicemia" },
  { pattern: /\bpneu[\s-]?monia\b/gi, replacement: "pneumonia" },
  { pattern: /\bdys[\s-]?pnea\b/gi, replacement: "dyspnea" },
  { pattern: /\btub[\s-]?ular[\s-]?necrosis\b/gi, replacement: "tubular necrosis" },
  { pattern: /\bvaso[\s-]?pressors?\b/gi, replacement: "vasopressor" },
  { pattern: /\bcardio[\s-]?version\b/gi, replacement: "cardioversion" },
  { pattern: /\bdefibrillat(?:e|ion|or)\b/gi, replacement: "defibrillation" },

  // Temperature / Units normalization
  { pattern: /(\d+(?:\.\d+)?)\s*degrees?\s*(?:celsius|centigrade|C)\b/gi, replacement: "$1°C" },
  { pattern: /(\d+(?:\.\d+)?)\s*degrees?\s*(?:fahrenheit|F)\b/gi, replacement: "$1°F" },
];

/**
 * Apply deterministic medical terminology corrections.
 */
export function applyMedicalCorrections(text: string): string {
  let result = text;
  for (const { pattern, replacement } of MEDICAL_CORRECTIONS) {
    result = result.replace(pattern, replacement as string);
  }
  return result;
}

// ─── 3. LLM-based Medical Normalization (second pass) ───────────────
// Conservative correction of ASR errors that deterministic rules can't catch.

const MEDICAL_NORMALIZATION_PROMPT = `You are editing a verbatim medical transcript produced by speech-to-text.

Rules:
- Correct obvious speech-to-text errors in medical terminology.
- Standardize drug names, diagnosis names, and abbreviations to their correct forms.
- Remove duplicated phrases caused by audio glitches (identical or near-identical consecutive sentences).
- Do NOT add new clinical information that was not spoken.
- Do NOT summarize or paraphrase — preserve the original phrasing.
- Do NOT change the structure or order of the text.
- Preserve meaning exactly.
- If a medical term is uncertain (confidence < 90%), keep the original and append [check].
- Return the cleaned transcript only. No commentary, no explanations.`;

/**
 * Run a conservative LLM normalization pass on the transcript.
 * Only corrects obvious ASR errors — does NOT interpret or summarize.
 */
export async function normalizeMedicalTranscript(rawText: string): Promise<string> {
  if (!rawText || rawText.trim().length < 20) return rawText;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: Math.min(4096, Math.ceil(rawText.length * 1.2)),
      messages: [
        { role: "system", content: MEDICAL_NORMALIZATION_PROMPT },
        { role: "user", content: rawText },
      ],
    });

    const normalized = response.choices[0]?.message?.content?.trim();
    if (!normalized || normalized.length < rawText.length * 0.5) {
      // Safety: if LLM returned something much shorter, it may have summarized — reject
      console.warn("[medical-normalize] LLM output too short, keeping original");
      return rawText;
    }
    return normalized;
  } catch (err) {
    console.error("[medical-normalize] LLM normalization failed, returning original:", err);
    return rawText;
  }
}

// ─── 4. Full Pipeline ───────────────────────────────────────────────

export interface NormalizeResult {
  text: string;
  rawText: string;
  corrections: string[];
}

/**
 * Full medical ASR validation pipeline:
 * 1. Deterministic de-duplication
 * 2. Deterministic medical term corrections
 * 3. (Optional) LLM-based normalization for remaining ASR errors
 *
 * @param rawText - Raw Whisper output
 * @param prevSegmentTail - Last ~25 words of previous segment (for overlap removal)
 * @param useLLMNormalization - Whether to run the LLM pass (adds latency + cost)
 */
export async function medicalNormalizePipeline(
  rawText: string,
  prevSegmentTail?: string,
  useLLMNormalization: boolean = false
): Promise<NormalizeResult> {
  const corrections: string[] = [];

  // Step 1: Remove chunk boundary overlap
  let text = prevSegmentTail
    ? removeChunkOverlap(prevSegmentTail, rawText)
    : rawText;
  if (text !== rawText) corrections.push("chunk-overlap-removed");

  // Step 2: Sentence-level de-duplication
  const beforeDedup = text;
  text = deduplicateTranscript(text);
  if (text !== beforeDedup) corrections.push("duplicates-removed");

  // Step 3: Deterministic medical corrections
  const beforeCorrections = text;
  text = applyMedicalCorrections(text);
  if (text !== beforeCorrections) corrections.push("medical-terms-normalized");

  // Step 4: Optional LLM normalization
  if (useLLMNormalization) {
    const beforeLLM = text;
    text = await normalizeMedicalTranscript(text);
    if (text !== beforeLLM) corrections.push("llm-normalized");
  }

  return { text, rawText, corrections };
}
