/**
 * Shared care-path resolver used by Patient Concierge + booking handoff.
 * Doctor Clinical AI consumes the same packet on the encounter screen.
 */

export type CarePath = {
  specialty: string;
  consultationType:
    | "HOMEOPATHY"
    | "PEDIATRICS"
    | "FERTILITY"
    | "WOMENS_WELLNESS"
    | "EMOTIONAL_WELLNESS"
    | "FAMILY_WELLNESS"
    | "PREVENTIVE_CARE";
  concernLabel: string;
  firstAid: string[];
  prep: string[];
  redFlags: string;
  isEmergency: boolean;
};

const SPECIALTY_TO_TYPE: Record<string, CarePath["consultationType"]> = {
  Homeopathy: "HOMEOPATHY",
  Pediatrics: "PEDIATRICS",
  Fertility: "FERTILITY",
  "Women's Wellness": "WOMENS_WELLNESS",
  "Emotional Wellness": "EMOTIONAL_WELLNESS",
  "Family Wellness": "FAMILY_WELLNESS",
  "Preventive Care": "PREVENTIVE_CARE",
  "Emergency Care": "FAMILY_WELLNESS",
};

type Rule = {
  match: RegExp;
  specialty: string;
  concernLabel: string;
  firstAid: string[];
  prep: string[];
  redFlags: string;
  emergency?: boolean;
};

const RULES: Rule[] = [
  {
    match:
      /(chest pain|can't breathe|cannot breathe|unconscious|stroke|severe bleeding|suicidal)/i,
    specialty: "Emergency Care",
    concernLabel: "possible emergency pattern",
    firstAid: [
      "Call local emergency services / ER now",
      "Do not wait on chat — this is not emergency care",
      "Stay reachable for responders",
    ],
    prep: [],
    redFlags: "Emergency signs → ER immediately.",
    emergency: true,
  },
  {
    match:
      /(head\s*ache|headache|migraine|had ache|head pain|throbbing head)/i,
    specialty: "Family Wellness",
    concernLabel: "headache / migraine-type discomfort",
    firstAid: [
      "Rest in a dim quiet room; reduce screens 20–30 minutes",
      "Hydrate; cool compress on forehead/neck",
      "Avoid stacking multiple pain medicines",
    ],
    prep: [
      "Log intensity 1–10, location, triggers",
      "Note duration and what helps",
      "Bring BP / prior neuro reports if available",
    ],
    redFlags:
      "Thunderclap headache, neuro deficit, stiff neck + fever → ER.",
  },
  {
    match:
      /(eye pain|eye swelling|swollen eye|red eye|itchy eye|burning eyes|blurry vision|stye)/i,
    specialty: "Family Wellness",
    concernLabel: "eye pain / swelling",
    firstAid: [
      "Do not rub the eye; wash hands",
      "Rinse with clean water/saline if foreign body suspected",
      "Cool compress 10 min; remove contact lenses",
    ],
    prep: [
      "Note trauma, discharge, vision change",
      "Photo the eye for the consult",
      "List drops / contact lens use",
    ],
    redFlags: "Chemical splash, sudden vision loss, trauma → eye ER.",
  },
  {
    match: /(allerg|sneez|itch|pollen|sinus|runny nose|watery eyes)/i,
    specialty: "Homeopathy",
    concernLabel: "allergy / sinus-type symptoms",
    firstAid: [
      "Rinse face after outdoor exposure",
      "Saline nasal rinse if available",
      "Reduce dust/pollen exposure windows",
    ],
    prep: [
      "Track sneeze/itch score morning vs night",
      "Note exposure triggers",
      "Avoid OTC medicine stacking",
    ],
    redFlags: "Wheeze or facial swelling → emergency care.",
  },
  {
    match: /(child|baby|toddler|pediatric|kids? fever|my son|my daughter)/i,
    specialty: "Pediatrics",
    concernLabel: "pediatric symptom support",
    firstAid: [
      "Offer small frequent fluids",
      "Dress lightly if feverish",
      "Watch alertness and breathing",
    ],
    prep: [
      "Log temperature and intake",
      "Note lethargy or breathing effort",
      "Keep vaccine history handy",
    ],
    redFlags: "Infant fever <3 months, blue lips, seizures → ER.",
  },
  {
    match:
      /(stomach|nausea|vomit|diarrhea|diarrhoea|constipation|acid reflux|abdominal pain)/i,
    specialty: "Family Wellness",
    concernLabel: "stomach / GI discomfort",
    firstAid: [
      "Sip ORS / clear fluids",
      "Pause heavy spicy meals",
      "Rest; light foods only if tolerated",
    ],
    prep: [
      "Log stool frequency and fever",
      "Note recent foods / travel",
      "Bring prior GI reports if recurrent",
    ],
    redFlags: "Blood in stool, severe dehydration, sudden severe pain → ER.",
  },
  {
    match: /(fever|temperature|chills|body ache|flu like|viral)/i,
    specialty: "Family Wellness",
    concernLabel: "fever / flu-like illness",
    firstAid: [
      "Hydrate and rest",
      "Measure temperature every 4–6 hours",
      "Light clothing; lukewarm sponge if uncomfortable",
    ],
    prep: [
      "Log peak temps and associated symptoms",
      "Note sick contacts",
      "Prepare symptom timeline for video consult",
    ],
    redFlags: "Fever + stiff neck, confusion, or chest pain → ER.",
  },
  {
    match: /(stress|anxiet|sleep|insomnia|burnout|mood|depress|panic)/i,
    specialty: "Emotional Wellness",
    concernLabel: "stress / sleep concern",
    firstAid: [
      "Box breathing 4-4-4-4 for 2 minutes",
      "Step away from screens briefly",
      "Hydrate; short walk if safe",
    ],
    prep: [
      "Fixed wake time for 7 days",
      "Reduce screens before bed",
      "Note panic triggers",
    ],
    redFlags: "Suicidal thoughts → emergency / crisis line now.",
  },
  {
    match: /(fertility|conceive|ivf|ovulat)/i,
    specialty: "Fertility",
    concernLabel: "fertility planning",
    firstAid: [
      "Start cycle + sleep + stress log",
      "Avoid unverified supplement stacks",
      "Plan joint questions for consult",
    ],
    prep: [
      "Bring cycle history / labs",
      "List current medicines",
      "Note partner health questions",
    ],
    redFlags: "Severe pelvic pain or heavy bleeding → urgent care.",
  },
  {
    match: /(period|pcos|hormone|pregnan|cramps|pms)/i,
    specialty: "Women's Wellness",
    concernLabel: "women's / hormonal health",
    firstAid: [
      "Heat pack for menstrual cramps if helpful",
      "Hydrate; light movement if tolerated",
      "Rest if dizzy",
    ],
    prep: [
      "Track cycle day, flow, pain score",
      "Note PCOS/thyroid history",
      "List contraceptives / hormones",
    ],
    redFlags: "Soaking pad hourly, fainting, pregnancy bleeding → urgent care.",
  },
];

export function resolveCarePath(text: string): CarePath {
  for (const rule of RULES) {
    if (rule.match.test(text)) {
      return {
        specialty: rule.specialty,
        consultationType:
          SPECIALTY_TO_TYPE[rule.specialty] || "PREVENTIVE_CARE",
        concernLabel: rule.concernLabel,
        firstAid: rule.firstAid,
        prep: rule.prep,
        redFlags: rule.redFlags,
        isEmergency: Boolean(rule.emergency),
      };
    }
  }
  return {
    specialty: "Preventive Care",
    consultationType: "PREVENTIVE_CARE",
    concernLabel: "general wellness question",
    firstAid: [
      "Rest, hydrate, note onset + severity (1–10)",
      "Avoid new medicine stacks until reviewed",
      "Seek urgent care if symptoms escalate fast",
    ],
    prep: [
      "Capture onset and intensity",
      "Note triggers for 48 hours",
      "Prepare prior reports for consult",
    ],
    redFlags: "Emergency symptoms → call local emergency services first.",
    isEmergency: false,
  };
}

export function buildDoctorBrief(concern: string, path: CarePath) {
  return {
    whyContacted: concern,
    matchedPathway: path.concernLabel,
    suggestedSpecialty: path.specialty,
    patientFirstAidShared: path.firstAid,
    visitPrep: path.prep,
    redFlags: path.redFlags,
    aiSummary: `Patient contacted for: "${concern}". Clinical engine mapped to ${path.specialty} (${path.concernLabel}).`,
    suggestedSoap: {
      subjective: concern,
      objective: "Vitals / exam pending video intake",
      assessment: `Working impression aligned to ${path.concernLabel} — confirm on consult`,
      plan: `Review first-aid already shared; specialty focus ${path.specialty}; schedule follow-up as needed`,
    },
  };
}
