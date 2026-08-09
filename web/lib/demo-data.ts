/**
 * Maha AI — enterprise demo data fabric
 * Procedurally generates thousands of records with stable seed + realistic CDN/mock URLs.
 * DEMO_MODE=true (default). Set DEMO_MODE=false + DATABASE_URL for Neon persistence.
 */

export const DEMO_PASSWORD_HASH =
  "$2b$10$gNjoUVJ7gujtIQLUKheLDeuicGgmaNTqGsqdhYz/NkeAC45TRaspi"; // password123

export type DemoRole = "PATIENT" | "DOCTOR" | "CLINICAL_LEAD" | "ADMIN";

const FIRST = [
  "Asha", "Meera", "Arjun", "Kavya", "Rohit", "Neha", "Vikram", "Ananya", "Kabir", "Diya",
  "Ishaan", "Pooja", "Aditya", "Sneha", "Rahul", "Priya", "Dev", "Nisha", "Siddharth", "Riya",
];
const LAST = [
  "Patel", "Sharma", "Nair", "Iyer", "Sen", "Kapoor", "Reddy", "Das", "Khan", "Joshi",
  "Malhotra", "Gupta", "Menon", "Bose", "Chopra", "Rao", "Singh", "Verma", "Mehta", "Pillai",
];
const SPECIALIZATIONS = [
  "HOMEOPATHY",
  "PEDIATRICS",
  "FERTILITY",
  "WOMENS_WELLNESS",
  "EMOTIONAL_WELLNESS",
  "FAMILY_WELLNESS",
  "PREVENTIVE_CARE",
] as const;
const STATUSES = ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
const CONCERNS = [
  "Seasonal allergic rhinitis with sleep disruption",
  "Postpartum recovery and fatigue management",
  "Pediatric immunity and nutrition planning",
  "Cycle irregularity and fertility counseling",
  "Work stress with anxiety and insomnia",
  "Preventive metabolic wellness review",
  "Chronic migraine with lifestyle triggers",
  "Gut discomfort and dietary intolerance",
];

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]) {
  return arr[Math.floor(rng() * arr.length)];
}

function pad(n: number, w = 4) {
  return String(n).padStart(w, "0");
}

const UNSplash = [
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=1200&q=80",
];

export const CDN = {
  avatar: (id: string) =>
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(id)}`,
  report: (id: string) =>
    `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf#${id}`,
  cover: (slug: string) => {
    const idx =
      Math.abs(
        slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
      ) % UNSplash.length;
    return UNSplash[idx];
  },
  meet: (code: string) => `https://meet.jit.si/maha-ai-${code}`,
  fhir: (resource: string, id: string) =>
    `https://api.maha-ai.health/fhir/r4/${resource}/${id}`,
  telemetry: (stream: string) =>
    `https://telemetry.maha-ai.health/v1/streams/${stream}`,
};

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  role: DemoRole;
  password: string;
  image?: string;
  /** false = pending admin approval or suspended — cannot sign in */
  isActive: boolean;
  /** Admin-granted permissions at activation (least privilege). Empty while pending. */
  grantedPermissions?: string[];
  /** pending | active | suspended */
  accessStatus?: "pending" | "active" | "suspended";
  /** Clinician panel id — appointments booked to this doctorId appear in their inbox */
  doctorId?: string;
}

/** Login accounts for recruiters */
export const demoUsers: DemoUser[] = [
  {
    id: "usr_patient_01",
    email: "patient@test.com",
    name: "Asha Patel",
    role: "PATIENT",
    password: DEMO_PASSWORD_HASH,
    image: CDN.avatar("usr_patient_01"),
    isActive: true,
  },
  {
    id: "usr_doctor_01",
    email: "doctor@test.com",
    name: "Dr. Meera Sharma",
    role: "DOCTOR",
    password: DEMO_PASSWORD_HASH,
    image: CDN.avatar("usr_doctor_01"),
    isActive: true,
    doctorId: "doc_01",
  },
  {
    id: "usr_admin_01",
    email: "admin@test.com",
    name: "Platform Admin",
    role: "ADMIN",
    password: DEMO_PASSWORD_HASH,
    image: CDN.avatar("usr_admin_01"),
    isActive: true,
  },
  {
    id: "usr_lead_01",
    email: "lead@test.com",
    name: "Dr. Ananya Rao",
    role: "CLINICAL_LEAD",
    password: DEMO_PASSWORD_HASH,
    image: CDN.avatar("usr_lead_01"),
    isActive: true,
    doctorId: "doc_lead",
  },
];

export const PLATFORM_SCALE = {
  patients: 4820,
  doctors: 186,
  appointments: 28460,
  prescriptions: 19320,
  articles: 420,
  reports: 12640,
  aiTriageRuns: 9180,
  regions: ["IN-WEST", "IN-SOUTH", "IN-NORTH", "IN-EAST", "UAE", "SG"],
};

function buildDoctors(count = 186) {
  const rng = mulberry32(42);
  const doctors = [];
  for (let i = 1; i <= count; i++) {
    const id = `doc_${pad(i, 4)}`;
    const name = `Dr. ${pick(rng, FIRST)} ${pick(rng, LAST)}`;
    const specialization = pick(rng, SPECIALIZATIONS);
    doctors.push({
      id,
      userId: `usr_doc_${pad(i, 4)}`,
      name,
      specialization,
      experience: 3 + Math.floor(rng() * 22),
      consultationFee: 800 + Math.floor(rng() * 25) * 100,
      currency: "INR",
      rating: Number((3.8 + rng() * 1.2).toFixed(1)),
      totalConsultations: 40 + Math.floor(rng() * 900),
      bio: `${specialization.replaceAll("_", " ")} clinician on Maha AI care network.`,
      isVerified: rng() > 0.08,
      qualifications:
        specialization === "HOMEOPATHY"
          ? ["BHMS", "MD Homeopathy"]
          : ["MBBS", "MD"],
      profileImage: CDN.avatar(id),
      fhirPractitionerUrl: CDN.fhir("Practitioner", id),
      calendarFeedUrl: `https://cal.maha-ai.health/feeds/${id}.ics`,
    });
  }
  // Pin demo login clinicians so booking privacy maps cleanly
  doctors[0] = {
    ...doctors[0],
    id: "doc_01",
    userId: "usr_doctor_01",
    name: "Dr. Meera Sharma",
    specialization: "HOMEOPATHY",
    experience: 12,
    consultationFee: 1200,
    rating: 4.8,
    totalConsultations: 1240,
    bio: "Fresh clinician · Homeopathy panel · Login: doctor@test.com",
    isVerified: true,
    qualifications: ["BHMS", "MD Homeopathy", "Certified Lifestyle Medicine"],
  };
  doctors[1] = {
    ...doctors[1],
    id: "doc_lead",
    userId: "usr_lead_01",
    name: "Dr. Ananya Rao",
    specialization: "FAMILY_WELLNESS",
    experience: 18,
    consultationFee: 1800,
    rating: 4.9,
    totalConsultations: 2100,
    bio: "Clinical lead · Oversight + own panel · Login: lead@test.com",
    isVerified: true,
    qualifications: ["MBBS", "MD Family Medicine"],
  };
  return doctors;
}

export const demoDoctors = buildDoctors(PLATFORM_SCALE.doctors);

function buildAppointments(count = 500) {
  const rng = mulberry32(99);
  const list = [];
  for (let i = 1; i <= count; i++) {
    const id = `apt_${pad(i, 5)}`;
    const doctor = pick(rng, demoDoctors);
    const dayOffset = Math.floor(rng() * 90) - 45;
    const scheduledAt = new Date(Date.now() + dayOffset * 86400000);
    scheduledAt.setHours(9 + Math.floor(rng() * 8), rng() > 0.5 ? 0 : 30, 0, 0);
    const code = `MAHA-${pad(i, 4)}`;
    list.push({
      id,
      patientName: `${pick(rng, FIRST)} ${pick(rng, LAST)}`,
      patientId: `pat_${pad(1 + Math.floor(rng() * PLATFORM_SCALE.patients), 5)}`,
      doctorName: doctor.name,
      doctorId: doctor.id,
      consultationType: doctor.specialization,
      status: pick(rng, STATUSES),
      scheduledAt: scheduledAt.toISOString(),
      concern: pick(rng, CONCERNS),
      meetingCode: code,
      videoCallUrl: CDN.meet(code),
      fhirEncounterUrl: CDN.fhir("Encounter", id),
      recordingUrl:
        rng() > 0.7
          ? `https://cdn.maha-ai.health/recordings/${id}/session.m3u8`
          : null,
    });
  }
  // Guaranteed patient demo appointments near top (rich clinician handoff)
  list.unshift(
    {
      id: "apt_01",
      patientName: "Asha Patel",
      patientId: "pat_00001",
      doctorName: "Dr. Meera Sharma",
      doctorId: "doc_01",
      consultationType: "HOMEOPATHY",
      status: "CONFIRMED",
      scheduledAt: new Date(Date.now() + 3 * 86400000).toISOString(),
      concern: "Seasonal sneezing, itchy eyes, and disrupted sleep for 5 days",
      meetingCode: "MAHA-7K2P",
      videoCallUrl: CDN.meet("MAHA-7K2P"),
      fhirEncounterUrl: CDN.fhir("Encounter", "apt_01"),
      recordingUrl: null,
    },
    {
      id: "apt_02",
      patientName: "Asha Patel",
      patientId: "pat_00001",
      doctorName: "Dr. Meera Sharma",
      doctorId: "doc_01",
      consultationType: "EMOTIONAL_WELLNESS",
      status: "COMPLETED",
      scheduledAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      concern: "Stress and waking at 3am with racing thoughts",
      meetingCode: "MAHA-DONE1",
      videoCallUrl: CDN.meet("MAHA-DONE1"),
      fhirEncounterUrl: CDN.fhir("Encounter", "apt_02"),
      recordingUrl: `https://cdn.maha-ai.health/recordings/apt_02/session.m3u8`,
    },
    {
      id: "apt_03",
      patientName: "Rohan Desai",
      patientId: "pat_00012",
      doctorName: "Dr. Meera Sharma",
      doctorId: "doc_01",
      consultationType: "FAMILY_WELLNESS",
      status: "SCHEDULED",
      scheduledAt: new Date(Date.now() + 1 * 86400000).toISOString(),
      concern: "Headache for 2 days — needs instant first-aid guidance then consult",
      meetingCode: "MAHA-HEAD1",
      videoCallUrl: CDN.meet("MAHA-HEAD1"),
      fhirEncounterUrl: CDN.fhir("Encounter", "apt_03"),
      recordingUrl: null,
    },
    {
      id: "apt_04",
      patientName: "Neha Iyer",
      patientId: "pat_00018",
      doctorName: "Dr. Meera Sharma",
      doctorId: "doc_01",
      consultationType: "FAMILY_WELLNESS",
      status: "CONFIRMED",
      scheduledAt: new Date(Date.now() + 2 * 86400000).toISOString(),
      concern: "Eye pain and swelling after outdoor dust exposure",
      meetingCode: "MAHA-EYE1",
      videoCallUrl: CDN.meet("MAHA-EYE1"),
      fhirEncounterUrl: CDN.fhir("Encounter", "apt_04"),
      recordingUrl: null,
    }
  );
  return list;
}

export const demoAppointments = buildAppointments(520);

function buildPatients(count = 240) {
  const rng = mulberry32(7);
  const list = [];
  for (let i = 1; i <= count; i++) {
    const id = `pat_${pad(i, 5)}`;
    list.push({
      id,
      name: `${pick(rng, FIRST)} ${pick(rng, LAST)}`,
      age: 18 + Math.floor(rng() * 55),
      gender: pick(rng, ["FEMALE", "MALE", "OTHER"] as const),
      lastVisit: new Date(Date.now() - Math.floor(rng() * 120) * 86400000).toISOString(),
      activePrescriptions: Math.floor(rng() * 4),
      riskFlags: rng() > 0.75 ? [pick(rng, ["Follow-up due", "Allergy alert", "High stress score"])] : [],
      chartUrl: CDN.fhir("Patient", id),
      avatarUrl: CDN.avatar(id),
    });
  }
  list[0] = {
    id: "pat_00001",
    name: "Asha Patel",
    age: 32,
    gender: "FEMALE",
    lastVisit: new Date(Date.now() - 10 * 86400000).toISOString(),
    activePrescriptions: 2,
    riskFlags: ["Seasonal allergy"],
    chartUrl: CDN.fhir("Patient", "pat_00001"),
    avatarUrl: CDN.avatar("pat_00001"),
  };
  return list;
}

export const demoPatients = buildPatients(240);

export const demoPrescriptions = [
  {
    id: "rx_01",
    medicine: "Allium Cepa",
    potency: "30C",
    dosage: "4 drops",
    frequency: "Twice daily",
    duration: "7 days",
    instructions: "Take away from meals",
    status: "ACTIVE",
    doctorName: "Dr. Meera Sharma",
    issuedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    fhirMedicationRequestUrl: CDN.fhir("MedicationRequest", "rx_01"),
    labelPdfUrl: CDN.report("rx_01-label"),
  },
  {
    id: "rx_02",
    medicine: "Nux Vomica",
    potency: "200C",
    dosage: "1 dose",
    frequency: "Once weekly",
    duration: "4 weeks",
    instructions: "Evening dose preferred",
    status: "ACTIVE",
    doctorName: "Dr. Meera Sharma",
    issuedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    fhirMedicationRequestUrl: CDN.fhir("MedicationRequest", "rx_02"),
    labelPdfUrl: CDN.report("rx_02-label"),
  },
  {
    id: "rx_03",
    medicine: "Arsenicum Album",
    potency: "30C",
    dosage: "3 drops",
    frequency: "Thrice daily",
    duration: "5 days",
    instructions: "Stop if symptoms resolve earlier",
    status: "COMPLETED",
    doctorName: "Dr. Meera Sharma",
    issuedAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    fhirMedicationRequestUrl: CDN.fhir("MedicationRequest", "rx_03"),
    labelPdfUrl: CDN.report("rx_03-label"),
  },
];

const ARTICLE_SEEDS = [
  {
    title: "Circadian recovery protocols for clinic follow-ups",
    slug: "circadian-recovery-protocols",
    excerpt: "How Maha AI clinics structure sleep-linked recovery between visits.",
    category: { name: "Preventive Care", slug: "preventive-care" },
  },
  {
    title: "Pediatric immunity: observation framework for parents",
    slug: "pediatric-immunity-framework",
    excerpt: "A clinician checklist parents can use before escalation.",
    category: { name: "Pediatrics", slug: "pediatrics" },
  },
  {
    title: "Fertility wellness: cycle-aware lifestyle levers",
    slug: "fertility-wellness-levers",
    excerpt: "Lifestyle levers discussed alongside medical fertility protocols.",
    category: { name: "Fertility", slug: "fertility" },
  },
  {
    title: "Homeopathy case patterns in allergic rhinitis",
    slug: "homeopathy-allergic-rhinitis",
    excerpt: "Pattern recognition notes from 1,200+ allergy consults on-platform.",
    category: { name: "Homeopathy", slug: "homeopathy" },
  },
  {
    title: "Emotional load scoring for women's wellness visits",
    slug: "emotional-load-womens-wellness",
    excerpt: "How care teams combine self-report + triage signals.",
    category: { name: "Women's Wellness", slug: "womens-wellness" },
  },
];

export const demoArticles = ARTICLE_SEEDS.map((a, i) => ({
  id: `art_${pad(i + 1, 3)}`,
  title: a.title,
  slug: a.slug,
  excerpt: a.excerpt,
  content: `${a.excerpt}\n\nThis clinical education article is authored for Maha AI patients and referring clinicians. It is not a substitute for personalized medical advice.\n\nCare teams on the platform use these protocols with appointment history, prescription context, and AI triage summaries to prepare denser consults.`,
  author: i % 2 === 0 ? "Dr. Meera Sharma" : "Dr. Arjun Nair",
  coverImage: CDN.cover(a.slug),
  publishedAt: new Date(Date.now() - (i + 2) * 86400000).toISOString(),
  viewCount: 800 + i * 340,
  likes: 40 + i * 17,
  category: a.category,
  seoKeywords: [a.category.slug, "maha-ai", "wellness"],
  canonicalUrl: `https://www.maha-ai.health/articles/${a.slug}`,
}));

export function isDemoMode() {
  return process.env.DEMO_MODE !== "false";
}

export function findDemoUser(email: string) {
  return demoUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function paginate<T>(items: T[], page = 1, pageSize = 20) {
  const start = (page - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    page,
    pageSize,
    total: items.length,
    totalPages: Math.ceil(items.length / pageSize),
  };
}

export function getPatientStats() {
  return {
    upcomingAppointments: demoAppointments.filter(
      (a) =>
        a.patientName === "Asha Patel" &&
        ["SCHEDULED", "CONFIRMED"].includes(a.status)
    ).length,
    activePrescriptions: demoPrescriptions.filter((p) => p.status === "ACTIVE")
      .length,
    medicalReports: 14,
    doctorRating: 4.8,
    carePlanUrl: CDN.report("careplan-asha-2026"),
    fhirPatientUrl: CDN.fhir("Patient", "pat_00001"),
    networkScale: PLATFORM_SCALE,
  };
}

export function getDoctorStats() {
  return {
    todaysAppointments: 11,
    totalPatients: PLATFORM_SCALE.patients,
    completedThisWeek: 47,
    averageRating: 4.8,
    revenueThisMonth: 268400,
    panelSize: 312,
    aiAssistedNotes: 186,
    calendarFeedUrl: `https://cal.maha-ai.health/feeds/doc_01.ics`,
    networkScale: PLATFORM_SCALE,
  };
}

export function getAdminStats() {
  return {
    totalUsers: PLATFORM_SCALE.patients + PLATFORM_SCALE.doctors + 18,
    totalPatients: PLATFORM_SCALE.patients,
    totalDoctors: PLATFORM_SCALE.doctors,
    totalAppointments: PLATFORM_SCALE.appointments,
    pendingVerification: 17,
    systemHealth: 99.4,
    monthlyRevenue: 6842000,
    appointmentsToday: 312,
    aiTriageRuns: PLATFORM_SCALE.aiTriageRuns,
    regionsOnline: PLATFORM_SCALE.regions.length,
    telemetryUrl: CDN.telemetry("platform-health"),
    networkScale: PLATFORM_SCALE,
  };
}

export function runSymptomTriage(input: {
  age: number;
  gender: string;
  symptoms: string;
  durationDays: number;
}) {
  const text = input.symptoms.toLowerCase();
  const flags: string[] = [];
  let urgency: "LOW" | "MODERATE" | "HIGH" = "LOW";
  let likelyCategory = "PREVENTIVE_CARE";
  let confidence = 0.62;

  if (/(chest pain|breath|unconscious|uncontrollable bleeding|stroke|seizure)/.test(text)) {
    urgency = "HIGH";
    confidence = 0.91;
    flags.push("Emergency-pattern language detected");
  } else if (/(fever|migraine|dizzy|rash|vomit|severe pain)/.test(text)) {
    urgency = "MODERATE";
    confidence = 0.74;
  }

  if (/(allerg|sneez|itch|pollen)/.test(text)) {
    likelyCategory = "HOMEOPATHY";
    confidence += 0.08;
  }
  if (/(fertility|cycle|pregnan|ivf)/.test(text)) likelyCategory = "FERTILITY";
  if (/(child|pediatric|baby|toddler)/.test(text)) likelyCategory = "PEDIATRICS";
  if (/(stress|anxiet|sleep|mood|burnout)/.test(text))
    likelyCategory = "EMOTIONAL_WELLNESS";
  if (/(period|pcos|menstrual|hormone)/.test(text))
    likelyCategory = "WOMENS_WELLNESS";

  if (input.durationDays >= 14) flags.push("Persistence ≥ 14 days");
  if (input.age >= 60) flags.push("Age escalation threshold");
  if (input.age <= 12) flags.push("Pediatric pathway suggested");

  const matchedDoctors = demoDoctors
    .filter((d) => d.specialization === likelyCategory && d.isVerified)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3)
    .map((d) => ({
      id: d.id,
      name: d.name,
      rating: d.rating,
      consultationFee: d.consultationFee,
      profileImage: d.profileImage,
      bookUrl: `/book-appointment?doctorId=${d.id}&type=${likelyCategory}`,
    }));

  return {
    urgency,
    confidence: Math.min(0.96, Number(confidence.toFixed(2))),
    likelyCategory,
    summary: `Maha triage mapped this presentation to ${likelyCategory.replaceAll("_", " ").toLowerCase()} with ${urgency.toLowerCase()} urgency (confidence ${Math.round(Math.min(0.96, confidence) * 100)}%).`,
    recommendedNextStep:
      urgency === "HIGH"
        ? "Escalate to emergency services now. Do not rely on telehealth for red-flag symptoms."
        : "Book a Maha AI clinician consult and attach this triage packet to the encounter.",
    careTips: [
      "Log onset time, triggers, and current medications",
      "Capture vitals if available (temp, SpO2, BP)",
      "Upload prior reports to your patient chart before the visit",
    ],
    flags,
    matchedDoctors,
    evidenceLinks: [
      {
        label: "Care pathway card",
        url: `https://knowledge.maha-ai.health/pathways/${likelyCategory.toLowerCase()}`,
      },
      {
        label: "Safety rubric",
        url: "https://knowledge.maha-ai.health/safety/triage-rubric-v3",
      },
    ],
    disclaimer:
      "AI triage is clinical decision support only — not a diagnosis or emergency service.",
    model: "maha-triage-v2-demo",
    traceId: `trace_${Date.now().toString(36)}`,
    latencyMs: 380 + Math.floor(Math.random() * 220),
  };
}

export function getConsultationAiInsights() {
  return {
    aiSummary:
      "Patient presents with seasonal allergic rhinitis and secondary sleep fragmentation. Prior homeopathic response favorable; pollen-index correlation recommended.",
    aiInsights: [
      "Correlate symptom spikes with regional air-quality index",
      "Revisit sleep hygiene before potency escalation",
      "Schedule 14-day follow-up if sneezing score remains >6/10",
      "Attach prior IgE panel from chart if available",
    ],
    suggestedSoap: {
      subjective: "Sneezing, itchy eyes, fragmented sleep × 5 days",
      objective: "No fever reported; vitals pending video intake",
      assessment: "Likely allergic rhinitis — rule out infection",
      plan: "Homeopathy protocol + sleep hygiene + 2-week review",
    },
    riskScore: 0.28,
    model: "maha-copilot-v2-demo",
    knowledgeBaseUrl: "https://knowledge.maha-ai.health/copilot/allergy-v2",
  };
}

export function runWellnessCoach(prompt: string) {
  const p = prompt.toLowerCase();
  let focus = "balanced recovery";
  if (/(sleep|insomnia)/.test(p)) focus = "sleep architecture";
  if (/(stress|anxiet)/.test(p)) focus = "nervous system downregulation";
  if (/(diet|gut|nutrition)/.test(p)) focus = "metabolic & gut rhythm";

  return {
    focus,
    plan: [
      "Morning light exposure within 30 minutes of waking",
      "Protein-forward breakfast; hydrate 500ml before caffeine",
      "10-minute breath protocol at mid-day (box breathing 4-4-4-4)",
      "Screens off 45 minutes before sleep; fixed wake time ±30 min",
    ],
    weeklyTargets: {
      sleepConsistency: "6/7 nights",
      movementMinutes: 150,
      stressCheckIns: 5,
    },
    relatedArticles: demoArticles.slice(0, 2).map((a) => ({
      title: a.title,
      url: `/articles/${a.slug}`,
    })),
    model: "maha-coach-v1-demo",
    disclaimer: "Coaching guidance is educational and not medical advice.",
  };
}
