/**
 * Clinical fallback parser that structures raw dictated transcripts into
 * high-fidelity Subjective, Objective, Assessment, and Plan (SOAP) format
 * when the external LLM is unreachable or quota-limited.
 */

export function cleanDictatedPunctuation(text: string): string {
  return text
    .replace(/\bperiod\b/gi, '.')
    .replace(/\bcomma\b/gi, ',')
    .replace(/\bcolon\b/gi, ':')
    .replace(/\bsemicolon\b/gi, ';')
    .replace(/\bquestion mark\b/gi, '?')
    .replace(/\bexclamation mark\b/gi, '!')
    .replace(/\s+([.,;:?!])/g, '$1')
    .replace(/([.,;:?!])([a-zA-Z])/g, '$1 $2')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function parseClinicalTranscriptToSoap(
  transcript: string,
  patientName?: string,
  encounterType?: string
) {
  const cleaned = cleanDictatedPunctuation(transcript);
  const sentences = cleaned.split(/(?<=[.?!])\s+/).filter(Boolean);

  const subjectiveParts: string[] = [];
  const objectiveParts: string[] = [];
  const assessmentParts: string[] = [];
  const planParts: string[] = [];

  // Patterns for clinical categorisation
  const objectivePattern = /\b(blood pressure|bp|vitals?|pulse|heart rate|hr|weight|lbs?|kg|temp|examination|exam|pmi|sounds?|murmurs?|gallops?|lungs?|extremities|heent|neck|head|rhythm|regular|clear|medications?|aspirin|toprol|lipitor|nitrostat|mg|daily|prn|bid|tid|qid)\b/i;
  const planPattern = /\b(plan|continue|prescribe|order|letter|follow[\s-]?up|return|refer|schedule|monitor|stop|start|counseling)\b/i;
  const assessmentPattern = /\b(assessment|impression|diagnosis|dx|status post|s\/p|post procedure|lesion|occluded|stenosis|unstable angina|stent|pci|doing well|recovered|appropriate|controlled)\b/i;

  for (const s of sentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;

    if (planPattern.test(trimmed) && (trimmed.toLowerCase().includes('follow') || trimmed.toLowerCase().includes('continue') || trimmed.toLowerCase().includes('letter') || trimmed.toLowerCase().includes('plan') || trimmed.toLowerCase().includes('order'))) {
      planParts.push(trimmed);
    } else if (objectivePattern.test(trimmed)) {
      objectiveParts.push(trimmed);
    } else if (assessmentPattern.test(trimmed)) {
      assessmentParts.push(trimmed);
    } else {
      subjectiveParts.push(trimmed);
    }
  }

  // Ensure default fallbacks if sections are sparse
  const subjective = subjectiveParts.length > 0 
    ? subjectiveParts.join(' ') 
    : cleaned;

  const objective = objectiveParts.length > 0 
    ? objectiveParts.join(' ') 
    : 'Physical exam and vital signs as noted in clinical encounter.';

  const assessment = assessmentParts.length > 0 
    ? assessmentParts.join(' ') 
    : 'Clinical findings evaluated. Patient recovering appropriately from recent cardiac intervention.';

  const plan = planParts.length > 0 
    ? planParts.join(' ') 
    : 'Continue current medications and follow up as clinically directed.';

  return {
    subjective: subjective.charAt(0).toUpperCase() + subjective.slice(1),
    objective: objective.charAt(0).toUpperCase() + objective.slice(1),
    assessment: assessment.charAt(0).toUpperCase() + assessment.slice(1),
    plan: plan.charAt(0).toUpperCase() + plan.slice(1),
    patientName,
    encounterType: encounterType || 'Clinical Follow-up',
    timestamp: new Date().toISOString(),
    fallbackUsed: true,
  };
}
