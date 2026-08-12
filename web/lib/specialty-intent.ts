/**
 * Sentence-based specialty intent — phrase-first scoring with subject context.
 * Avoids naive token hits (e.g. "child" in "child birth" → Women's Wellness, not Pediatrics).
 */

export type ConsultationType =
  | "HOMEOPATHY"
  | "PEDIATRICS"
  | "FERTILITY"
  | "WOMENS_WELLNESS"
  | "EMOTIONAL_WELLNESS"
  | "FAMILY_WELLNESS"
  | "PREVENTIVE_CARE";

export type SpecialtyIntentResult = {
  consultationType: ConsultationType;
  specialty: string;
  concernLabel: string;
  confidence: number;
  whyMatched: string[];
  isEmergency: boolean;
};

const TYPE_TO_LABEL: Record<ConsultationType, string> = {
  HOMEOPATHY: "Homeopathy",
  PEDIATRICS: "Pediatrics",
  FERTILITY: "Fertility",
  WOMENS_WELLNESS: "Women's Wellness",
  EMOTIONAL_WELLNESS: "Emotional Wellness",
  FAMILY_WELLNESS: "Family Wellness",
  PREVENTIVE_CARE: "Preventive Care",
};

type IntentRule = {
  id: string;
  consultationType: ConsultationType;
  concernLabel: string;
  /** Strong multi-word / contextual signals (+8 each) */
  phrases: RegExp[];
  /** Weaker signals (+3 each) — ignored when blocked by context */
  tokens: RegExp[];
  weight?: number;
  emergency?: boolean;
  /** If any match, skip this rule entirely */
  blockWhen?: RegExp[];
};

/** Strip compound phrases so isolated tokens like "child" don't misfire */
export function normalizeClinicalText(raw: string): string {
  return raw
    .replace(/\bchild\s*[-\s]?birth\b/gi, " childbirth_recovery ")
    .replace(/\bchildbirth\b/gi, " childbirth_recovery ")
    .replace(/\bgiving\s+birth\b/gi, " childbirth_recovery ")
    .replace(/\bafter\s+delivery\b/gi, " postpartum_recovery ")
    .replace(/\bpost\s*partum\b/gi, " postpartum_recovery ")
    .replace(/\bpostpartum\b/gi, " postpartum_recovery ");
}

export function hasMaternalSubjectContext(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /(mother|mom|mum|maternal|woman|women|she|her)\b/.test(t) &&
    /(birth|delivery|childbirth|postpartum|post\s*partum|breast\s*feed|lochia|c[\-\s]?section|ppd|baby blues|after birth)/.test(
      t
    )
  );
}

export function hasPediatricSubjectContext(text: string): boolean {
  if (hasMaternalSubjectContext(text)) return false;
  const n = normalizeClinicalText(text);
  return (
    /\b(my|the|our)\s+(son|daughter|baby|toddler|kid|child|infant)\b/i.test(n) ||
    /\b(child|baby|toddler|infant|pediatric|kids?)\s+(has|have|with|is|got|feels?|developing|sick|fever|cough|rash)/i.test(
      n
    ) ||
    /\bkids?\s+(fever|sick|cough|rash|vomit)/i.test(n) ||
    /\b\d+\s*(month|year)[\-\s]?old\b/i.test(n)
  );
}

const RULES: IntentRule[] = [
  {
    id: "emergency",
    consultationType: "FAMILY_WELLNESS",
    concernLabel: "possible emergency pattern",
    phrases: [
      /can't breathe|cannot breathe|chest pain|unconscious|severe bleeding|one sided weakness|suicidal/i,
    ],
    tokens: [/stroke|anaphylaxis|seizure lasting/i],
    weight: 100,
    emergency: true,
  },
  {
    id: "postpartum-maternal",
    consultationType: "WOMENS_WELLNESS",
    concernLabel: "postpartum / maternal recovery",
    phrases: [
      /health.*(mother|mom|mum|maternal|woman).*(birth|delivery|childbirth|postpartum)/i,
      /(mother|mom|mum).*(not well|unwell|weak|tired|pain|recovery).*(birth|delivery|child)/i,
      /after\s+(child\s*birth|childbirth|delivery|giving birth|c[\-\s]?section)/i,
      /post\s*partum|postpartum|baby blues|breast\s*feed|breastfeed|lochia|maternal health/i,
      /childbirth_recovery|postpartum_recovery/i,
    ],
    tokens: [/ppd|mastitis|uterine|lochia/i],
    weight: 12,
  },
  {
    id: "womens-hormonal",
    consultationType: "WOMENS_WELLNESS",
    concernLabel: "women's / hormonal health",
    phrases: [
      /irregular period|heavy period|menstrual|pcos|hormone imbalance|pms cramps/i,
      /pregnancy (concern|bleeding|nausea)|prenatal/i,
    ],
    tokens: [/period|pcos|hormone|pregnan|cramps|pms|ovulation pain/i],
    weight: 8,
  },
  {
    id: "fertility",
    consultationType: "FERTILITY",
    concernLabel: "fertility planning",
    phrases: [/trying to conceive|ivf cycle|fertility workup/i],
    tokens: [/fertility|conceive|ivf|ovulat/i],
    weight: 8,
  },
  {
    id: "pediatric",
    consultationType: "PEDIATRICS",
    concernLabel: "pediatric symptom support",
    phrases: [
      /\bmy\s+(son|daughter|baby|toddler|kid|child)\b/i,
      /\b(child|baby|toddler|infant)\s+(has|have|with|is|got|feels?)\b/i,
      /\bkids?\s+(fever|sick|cough|rash)/i,
    ],
    tokens: [/pediatric|infant fever|vaccination/i],
    weight: 9,
    blockWhen: [/childbirth_recovery|postpartum_recovery|postpartum|after delivery/i],
  },
  {
    id: "homeopathy-allergy",
    consultationType: "HOMEOPATHY",
    concernLabel: "allergy / homeopathy pathway",
    phrases: [/seasonal sneezing|itchy eyes|pollen allergy|homeopathy for allergy/i],
    tokens: [/allerg|sneez|pollen|rhinitis|homeopath/i],
    weight: 7,
  },
  {
    id: "emotional",
    consultationType: "EMOTIONAL_WELLNESS",
    concernLabel: "stress / sleep / emotional wellness",
    phrases: [/can't sleep|racing thoughts|panic attack|burned out|waking at 3/i],
    tokens: [/stress|anxiet|sleep|insomnia|burnout|mood|depress|panic/i],
    weight: 7,
  },
  {
    id: "headache",
    consultationType: "FAMILY_WELLNESS",
    concernLabel: "headache / migraine-type discomfort",
    phrases: [/worst headache|migraine with aura|throbbing head/i],
    tokens: [/head\s*ache|headache|migraine|head pain/i],
    weight: 6,
  },
  {
    id: "eye",
    consultationType: "FAMILY_WELLNESS",
    concernLabel: "eye discomfort",
    phrases: [/red eye|blurry vision|swollen eye/i],
    tokens: [/eye pain|eye swelling|itchy eye|stye/i],
    weight: 6,
  },
  {
    id: "gi",
    consultationType: "FAMILY_WELLNESS",
    concernLabel: "stomach / GI discomfort",
    phrases: [/food poison|loose motion|acid reflux/i],
    tokens: [/stomach|nausea|vomit|diarrhea|constipation|abdominal/i],
    weight: 6,
  },
  {
    id: "fever-adult",
    consultationType: "FAMILY_WELLNESS",
    concernLabel: "fever / flu-like illness",
    phrases: [/flu like|high temperature|body ache and fever/i],
    tokens: [/fever|temperature|chills|viral/i],
    weight: 5,
    blockWhen: [/\b(my|the)\s+(son|daughter|baby|toddler|kid|child)\b/i],
  },
];

function scoreRule(rule: IntentRule, raw: string): { score: number; why: string[] } {
  const normalized = normalizeClinicalText(raw);
  const why: string[] = [];
  let score = 0;

  if (rule.blockWhen?.some((re) => re.test(raw) || re.test(normalized))) {
    return { score: 0, why: [] };
  }

  for (const p of rule.phrases) {
    if (p.test(raw) || p.test(normalized)) {
      score += 8;
      why.push(`phrase: ${p.source.slice(0, 48)}`);
    }
  }
  for (const t of rule.tokens) {
    if (t.test(raw) || t.test(normalized)) {
      score += 3;
      why.push(`signal: ${t.source.slice(0, 40)}`);
    }
  }

  if (rule.id === "pediatric" && !hasPediatricSubjectContext(raw)) {
    score = Math.max(0, score - 12);
    if (score > 0) why.push("pediatric subject not confirmed — score reduced");
  }

  if (rule.id === "postpartum-maternal" && hasMaternalSubjectContext(raw)) {
    score += 6;
    why.push("maternal subject + postpartum context");
  }

  if (rule.weight) score += Math.min(rule.weight, score > 0 ? 4 : 0);

  return { score, why: why.slice(0, 5) };
}

export function resolveSpecialtyIntent(text: string): SpecialtyIntentResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      consultationType: "PREVENTIVE_CARE",
      specialty: TYPE_TO_LABEL.PREVENTIVE_CARE,
      concernLabel: "general wellness question",
      confidence: 0,
      whyMatched: [],
      isEmergency: false,
    };
  }

  let best: {
    rule: IntentRule;
    score: number;
    why: string[];
  } | null = null;

  for (const rule of RULES) {
    const { score, why } = scoreRule(rule, trimmed);
    if (score <= 0) continue;
    if (!best || score > best.score) {
      best = { rule, score, why };
    }
  }

  if (!best) {
    return {
      consultationType: "PREVENTIVE_CARE",
      specialty: TYPE_TO_LABEL.PREVENTIVE_CARE,
      concernLabel: "general wellness question",
      confidence: 0.2,
      whyMatched: ["no strong specialty phrase — default preventive pathway"],
      isEmergency: false,
    };
  }

  const confidence = Math.min(0.98, best.score / 20);

  return {
    consultationType: best.rule.consultationType,
    specialty: TYPE_TO_LABEL[best.rule.consultationType],
    concernLabel: best.rule.concernLabel,
    confidence,
    whyMatched: best.why,
    isEmergency: Boolean(best.rule.emergency),
  };
}
