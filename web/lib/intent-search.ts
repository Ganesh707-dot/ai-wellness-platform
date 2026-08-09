/**
 * Context-based intent search for Maha Clinical AI.
 * Used by doctor patient search + patient/doctor answer generation.
 * Scores meaning (intent + context), not blind keyword templates.
 */

export type IntentHit = {
  id: string;
  label: string;
  intent:
    | "first_aid"
    | "triage"
    | "specialty_route"
    | "sleep"
    | "allergy"
    | "headache"
    | "eye"
    | "fever"
    | "gi"
    | "pediatric"
    | "womens"
    | "fertility"
    | "mental"
    | "emergency"
    | "general";
  score: number;
  whyMatched: string[];
  contextHints: string[];
  patientAnswer: string[];
  doctorAnswer: string[];
  differentials: string[];
  redFlags: string[];
  specialty: string;
};

type KnowledgeCard = {
  id: string;
  label: string;
  intent: IntentHit["intent"];
  specialty: string;
  /** tokens that boost score when present */
  tokens: string[];
  /** phrases that strongly indicate this intent */
  phrases: string[];
  /** contextual modifiers that refine the answer */
  context: { token: string; hint: string }[];
  patientAnswer: string[];
  doctorAnswer: string[];
  differentials: string[];
  redFlags: string[];
};

const KB: KnowledgeCard[] = [
  {
    id: "ha-migraine",
    label: "Migraine-pattern headache",
    intent: "headache",
    specialty: "Family Wellness",
    tokens: ["headache", "head", "ache", "migraine", "throbbing", "hadache", "had ache"],
    phrases: ["one side", "light sensitive", "nausea with head", "aura"],
    context: [
      { token: "screen", hint: "screen / visual strain trigger" },
      { token: "period", hint: "possible menstrual migraine link" },
      { token: "sleep", hint: "sleep disruption as trigger/amplifier" },
      { token: "stress", hint: "stress-associated cephalalgia" },
      { token: "dehydrat", hint: "dehydration contribution likely" },
    ],
    patientAnswer: [
      "Dim the room and rest; reduce screens 20–30 minutes",
      "Sip water; cool compress on forehead/neck",
      "Avoid stacking multiple pain medicines",
      "If this is sudden 'worst ever' pain, seek ER — do not wait on chat",
    ],
    doctorAnswer: [
      "Confirm laterality, photophobia, nausea, aura, and attack duration",
      "Screen for thunderclap / neuro deficit / meningism red flags first",
      "Correlate sleep, caffeine, screens, cycle, and hydration",
      "SOAP: document intensity 1–10 + prior response to homeopathy/OTC",
    ],
    differentials: [
      "Migraine without aura",
      "Tension-type headache",
      "Dehydration / caffeine withdrawal",
      "Secondary headache (red-flag screen)",
    ],
    redFlags: [
      "Thunderclap onset",
      "Focal neuro deficit",
      "Fever + stiff neck",
      "New headache after trauma",
    ],
  },
  {
    id: "ha-tension",
    label: "Tension / screen-strain headache",
    intent: "headache",
    specialty: "Family Wellness",
    tokens: ["headache", "pressure", "band", "temple", "neck", "tight"],
    phrases: ["all around head", "band like", "work all day", "laptop"],
    context: [
      { token: "neck", hint: "cervicogenic / posture component" },
      { token: "work", hint: "occupational screen load" },
      { token: "eye", hint: "possible eye-strain overlap" },
    ],
    patientAnswer: [
      "Stand, stretch neck/shoulders; 20-20-20 eye rule",
      "Warm compress on neck if tight; hydrate",
      "Short walk; pause caffeine stacking",
    ],
    doctorAnswer: [
      "Assess posture, screen hours, cervical ROM, and eye strain",
      "Differentiate migraine vs tension vs sinus contribution",
      "Counsel ergonomics + sleep before potency escalation",
    ],
    differentials: ["Tension-type", "Cervicogenic", "Asthenopia"],
    redFlags: ["Progressive morning headache", "Vomiting with progressive pain"],
  },
  {
    id: "eye-inflam",
    label: "Eye pain / swelling pathway",
    intent: "eye",
    specialty: "Family Wellness",
    tokens: ["eye", "swelling", "swollen", "red", "vision", "stye", "itch"],
    phrases: ["eye pain", "eye swelling", "can't open eye", "dust in eye"],
    context: [
      { token: "dust", hint: "irritant / allergic exposure" },
      { token: "contact", hint: "contact-lens related risk" },
      { token: "chemical", hint: "chemical injury — emergency rinse" },
      { token: "discharge", hint: "possible infectious conjunctivitis" },
    ],
    patientAnswer: [
      "Do not rub; wash hands; remove contacts",
      "Rinse with clean water/saline if foreign body/dust",
      "Cool clean compress 10 min on / 10 off",
      "Avoid leftover steroid drops unless prescribed for this episode",
    ],
    doctorAnswer: [
      "Document vision change, trauma, contacts, discharge color",
      "Rule out chemical injury / acute angle issues / orbital cellulitis signs",
      "Photo documentation helpful; consider specialty refer if vision drops",
    ],
    differentials: [
      "Allergic conjunctivitis",
      "Irritant exposure",
      "Stye / blepharitis",
      "Infectious conjunctivitis",
    ],
    redFlags: ["Sudden vision loss", "Chemical splash", "Severe photophobia", "Trauma"],
  },
  {
    id: "allergy",
    label: "Allergy / rhinitis pathway",
    intent: "allergy",
    specialty: "Homeopathy",
    tokens: ["allerg", "sneez", "pollen", "sinus", "itchy", "rhinitis", "runny"],
    phrases: ["seasonal sneezing", "itchy eyes", "pollen"],
    context: [
      { token: "sleep", hint: "allergy disrupting sleep architecture" },
      { token: "dust", hint: "indoor allergen contribution" },
      { token: "season", hint: "seasonal pattern" },
    ],
    patientAnswer: [
      "Rinse face after outdoor exposure; saline rinse if available",
      "Reduce dust/pollen windows; change pillow covers",
      "Avoid stacking multiple OTC allergy medicines",
    ],
    doctorAnswer: [
      "Score sneeze/itch AM vs PM; correlate AQI/pollen if available",
      "Review prior homeopathic response and sleep impact",
      "Attach IgE/prior labs if in chart; plan 14-day follow-up threshold",
    ],
    differentials: ["Allergic rhinitis", "Non-allergic rhinitis", "Viral URI"],
    redFlags: ["Wheeze", "Facial swelling", "Anaphylaxis signs"],
  },
  {
    id: "sleep-stress",
    label: "Sleep / stress recovery",
    intent: "mental",
    specialty: "Emotional Wellness",
    tokens: ["sleep", "insomni", "stress", "anxiet", "burnout", "3am", "panic", "mood"],
    phrases: ["waking at 3", "can't sleep", "racing thoughts"],
    context: [
      { token: "work", hint: "occupational burnout pattern" },
      { token: "caffeine", hint: "stimulant late-day contribution" },
      { token: "screen", hint: "evening light hygiene issue" },
    ],
    patientAnswer: [
      "Box breathing 4-4-4-4 for 2 minutes",
      "Fixed wake time; screens off 45 min before bed",
      "Hydrate; short walk if safe; delay late caffeine",
    ],
    doctorAnswer: [
      "Quantify sleep latency, awakenings, PHQ/GAD screen as appropriate",
      "Review stimulants, screens, and shift work",
      "Safety screen for suicidal ideation before coaching plans",
    ],
    differentials: ["Insomnia", "Anxiety-related sleep break", "Burnout"],
    redFlags: ["Suicidal thoughts", "Inability to stay safe"],
  },
  {
    id: "fever",
    label: "Fever / viral-type illness",
    intent: "fever",
    specialty: "Family Wellness",
    tokens: ["fever", "temperature", "chills", "flu", "viral", "body ache"],
    phrases: ["high temperature", "flu like"],
    context: [
      { token: "child", hint: "pediatric fever pathway" },
      { token: "cough", hint: "respiratory involvement" },
      { token: "travel", hint: "travel-related exposure" },
    ],
    patientAnswer: [
      "Hydrate; rest; light clothing",
      "Log temperature every 4–6 hours",
      "Use fever medicine only as previously advised for age/weight",
    ],
    doctorAnswer: [
      "Trend temps, fluids, urine output, and red-flag screen",
      "Pediatric vs adult thresholds differ — age-adjust urgency",
      "Document sick contacts and vaccination context when relevant",
    ],
    differentials: ["Viral syndrome", "Bacterial infection (rule-out)", "Heat illness"],
    redFlags: ["Stiff neck", "Confusion", "Chest pain", "Infant <3 months fever"],
  },
  {
    id: "gi",
    label: "GI / stomach pathway",
    intent: "gi",
    specialty: "Family Wellness",
    tokens: ["stomach", "nausea", "vomit", "diarrhea", "diarrhoea", "gastric", "abdominal"],
    phrases: ["food poison", "loose motion", "acid reflux"],
    context: [
      { token: "travel", hint: "travelers' diarrhea risk" },
      { token: "blood", hint: "bloody stool — escalate" },
      { token: "pregnan", hint: "pregnancy-safe counseling needed" },
    ],
    patientAnswer: [
      "ORS / clear fluids in small sips",
      "Pause heavy/spicy meals",
      "Rest; avoid anti-diarrheal stacking with high fever/blood",
    ],
    doctorAnswer: [
      "Assess dehydration, blood, fever, duration, and food history",
      "ORS first-line; escalate if peritoneal signs",
      "Note pregnancy / pediatric constraints",
    ],
    differentials: ["Gastroenteritis", "Foodborne illness", "Functional dyspepsia"],
    redFlags: ["Bloody stool", "Severe dehydration", "Acute abdomen"],
  },
  {
    id: "pediatric",
    label: "Pediatric support",
    intent: "pediatric",
    specialty: "Pediatrics",
    tokens: ["child", "baby", "toddler", "pediatric", "son", "daughter", "kids"],
    phrases: ["my toddler", "my baby", "kids fever"],
    context: [
      { token: "fever", hint: "pediatric fever monitoring" },
      { token: "appetite", hint: "intake / feeding concern" },
      { token: "rash", hint: "pediatric rash pathway" },
    ],
    patientAnswer: [
      "Offer small frequent fluids; dress lightly if feverish",
      "Watch alertness, urine, and breathing effort",
      "Do not give adult medicines to children",
    ],
    doctorAnswer: [
      "Age, weight, vaccination, feeding, and lethargy are mandatory fields",
      "Escalate infants <3 months with fever",
      "Parent-reported intake + wet diapers are key outpatient signals",
    ],
    differentials: ["Viral illness", "Otitis / URI", "Dehydration risk"],
    redFlags: ["Blue lips", "Seizure", "Not waking", "Infant fever"],
  },
  {
    id: "emergency",
    label: "Emergency escalation",
    intent: "emergency",
    specialty: "Emergency Care",
    tokens: ["chest pain", "can't breathe", "stroke", "unconscious", "suicidal", "bleeding"],
    phrases: ["cannot breathe", "severe bleeding", "one sided weakness"],
    context: [],
    patientAnswer: [
      "Call local emergency services / ER now",
      "Do not wait for this chat",
      "Stay reachable for responders",
    ],
    doctorAnswer: [
      "This is not a telehealth-first presentation — divert to EMS/ER",
      "Document time of onset and advise immediate emergency care",
      "Do not delay for SOAP drafting",
    ],
    differentials: ["ACS", "Stroke", "Anaphylaxis", "Major trauma"],
    redFlags: ["Any matched emergency token"],
  },
];

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

export function searchClinicalIntent(query: string, limit = 4): IntentHit[] {
  const q = query.toLowerCase();
  const tokens = tokenize(query);
  if (!q.trim()) return [];

  const scored = KB.map((card) => {
    let score = 0;
    const why: string[] = [];
    const hints: string[] = [];

    for (const t of card.tokens) {
      if (q.includes(t)) {
        score += t.length > 4 ? 3 : 2;
        why.push(`symptom token: ${t}`);
      }
    }
    for (const p of card.phrases) {
      if (q.includes(p)) {
        score += 4;
        why.push(`phrase: "${p}"`);
      }
    }
    for (const tok of tokens) {
      if (card.tokens.some((ct) => ct.includes(tok) || tok.includes(ct))) {
        score += 1;
      }
    }
    for (const c of card.context) {
      if (q.includes(c.token)) {
        score += 2;
        hints.push(c.hint);
        why.push(`context: ${c.hint}`);
      }
    }
    if (/(first\s*aid|instant|what should i do|relieve|stop)/i.test(q)) {
      score += card.intent === "emergency" ? 1 : 1.5;
      why.push("user intent: immediate help");
    }

    return {
      id: card.id,
      label: card.label,
      intent: card.intent,
      score,
      whyMatched: why.slice(0, 6),
      contextHints: hints,
      patientAnswer: card.patientAnswer,
      doctorAnswer: card.doctorAnswer,
      differentials: card.differentials,
      redFlags: card.redFlags,
      specialty: card.specialty,
    } satisfies IntentHit;
  })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

export function topIntent(query: string): IntentHit | null {
  return searchClinicalIntent(query, 1)[0] || null;
}
