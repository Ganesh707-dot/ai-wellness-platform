import { demoAppointments, demoPatients, demoPrescriptions } from "@/lib/demo-data";
import { searchClinicalIntent, topIntent } from "@/lib/intent-search";
import { resolveCarePath, buildDoctorBrief } from "@/lib/care-path";
import { listLiveEncounters, type LiveEncounter } from "@/lib/demo-store";

export type PatientDossier = {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  lastVisit: string;
  totalVisits: number;
  status: string;
  riskFlags: string[];
  avatarUrl?: string;
  chartUrl?: string;
  chiefComplaints: string[];
  encounters: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    consultationType: string;
    concern: string;
    chiefComplaint: string;
    aiSpecialty?: string;
    aiPathway?: string;
    doctorBrief?: string;
    source?: string;
    doctorId?: string;
  }>;
  prescriptions: typeof demoPrescriptions;
  analytics: {
    visitCount: number;
    completedCount: number;
    upcomingCount: number;
    openRiskCount: number;
    topPathways: { label: string; count: number }[];
    adherenceScore: number;
    symptomBurden: number;
    lastConcern: string;
  };
  ai: {
    summary: string;
    insights: string[];
    intentHits: ReturnType<typeof searchClinicalIntent>;
    suggestedFocus: string;
    soapDraft: {
      subjective: string;
      objective: string;
      assessment: string;
      plan: string;
    };
  };
};

function emailFor(name: string, id: string) {
  if (id === "pat_00001") return "patient@test.com";
  return `${name.toLowerCase().replace(/\s+/g, ".")}@patients.ai-wellness.health`;
}

function phoneFor(idx: number) {
  return `+91 98${String(10000000 + idx).slice(0, 8)}`;
}

type PanelPatient = (typeof demoPatients)[number] & {
  email?: string;
  fromLive?: boolean;
};

/** Seed panel + live booking patients (so new bookings appear in intelligence). */
async function panelPatients(doctorId?: string | null): Promise<PanelPatient[]> {
  const base: PanelPatient[] = [...demoPatients];
  const extras: PanelPatient[] = [
    {
      id: "pat_00012",
      name: "Rohan Desai",
      age: 29,
      gender: "MALE",
      lastVisit: new Date(Date.now() - 3 * 86400000).toISOString(),
      activePrescriptions: 1,
      riskFlags: ["Recurrent headache"],
      chartUrl: demoPatients[0].chartUrl,
      avatarUrl: demoPatients[0].avatarUrl,
    },
    {
      id: "pat_00018",
      name: "Neha Iyer",
      age: 34,
      gender: "FEMALE",
      lastVisit: new Date(Date.now() - 5 * 86400000).toISOString(),
      activePrescriptions: 0,
      riskFlags: ["Eye irritation"],
      chartUrl: demoPatients[0].chartUrl,
      avatarUrl: demoPatients[0].avatarUrl,
    },
  ];
  for (const e of extras) {
    if (!base.find((p) => p.id === e.id || p.name === e.name)) {
      base.unshift(e);
    }
  }

  const live = await listLiveEncounters();
  const relevant = doctorId
    ? live.filter((e) => e.doctorId === doctorId)
    : live;

  for (const e of relevant) {
    const key = (e.patientEmail || e.patientName).toLowerCase();
    const existing = base.find(
      (p) =>
        p.id === e.patientId ||
        p.name.toLowerCase() === e.patientName.toLowerCase() ||
        emailFor(p.name, p.id).toLowerCase() === key
    );
    if (existing) continue;
    base.unshift({
      id: e.patientId || `pat_live_${e.id}`,
      name: e.patientName,
      age: 32,
      gender: "OTHER",
      lastVisit: e.scheduledAt,
      activePrescriptions: 0,
      riskFlags: e.priorityBand === "HIGH" ? ["High priority intake"] : [],
      chartUrl: demoPatients[0].chartUrl,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(e.patientName)}`,
      email: e.patientEmail,
      fromLive: true,
    });
  }

  const ashaIdx = base.findIndex((p) => p.id === "pat_00001");
  if (ashaIdx > 0) {
    const [asha] = base.splice(ashaIdx, 1);
    base.unshift(asha);
  }
  return base;
}

function encountersForPatient(
  p: PanelPatient,
  live: LiveEncounter[],
  doctorId?: string | null
) {
  const liveEnc = live
    .filter((e) => {
      const mine =
        e.patientId === p.id ||
        e.patientName === p.name ||
        (p.email && e.patientEmail === p.email) ||
        (p.id === "pat_00001" && e.patientEmail === "patient@test.com");
      if (!mine) return false;
      if (doctorId) return e.doctorId === doctorId;
      return true;
    })
    .map((e) => ({
      id: e.id,
      scheduledAt: e.scheduledAt,
      status: e.status,
      consultationType: e.consultationType,
      concern: e.concern,
      chiefComplaint: e.chiefComplaint || e.concern,
      aiSpecialty: e.aiSpecialty,
      aiPathway: e.aiPathway,
      doctorBrief: e.doctorBrief,
      source: e.source,
      doctorId: e.doctorId,
    }));

  const seedEnc = demoAppointments
    .filter((a) => a.patientId === p.id || a.patientName === p.name)
    .map((a) => {
      const path = resolveCarePath(a.concern);
      const brief = buildDoctorBrief(a.concern, path);
      return {
        id: a.id,
        scheduledAt: a.scheduledAt,
        status: a.status,
        consultationType: a.consultationType,
        concern: a.concern,
        chiefComplaint: a.concern,
        aiSpecialty: path.specialty,
        aiPathway: path.concernLabel,
        doctorBrief: brief.aiSummary,
        source: "seed" as const,
        doctorId: a.doctorId,
      };
    });

  return [...liveEnc, ...seedEnc].sort(
    (a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt)
  );
}

export async function buildPatientDossier(
  patientId: string,
  doctorId?: string | null
): Promise<PatientDossier | null> {
  const patients = await panelPatients(doctorId);
  const p = patients.find((x) => x.id === patientId);
  if (!p) return null;

  const idx = Math.max(
    0,
    patients.findIndex((x) => x.id === p.id)
  );
  const live = await listLiveEncounters();
  const encounters = encountersForPatient(p, live, doctorId);

  const complaints = encounters.map((e) => e.chiefComplaint);
  const corpus = complaints.join(" · ") || "general wellness follow-up";
  const intentHits = searchClinicalIntent(corpus, 4);
  const top = intentHits[0] || topIntent(corpus);
  const path = resolveCarePath(corpus);
  const brief = buildDoctorBrief(complaints[0] || corpus, path);

  const pathwayCounts = new Map<string, number>();
  for (const e of encounters) {
    const key = e.aiPathway || "general";
    pathwayCounts.set(key, (pathwayCounts.get(key) || 0) + 1);
  }

  const completedCount = encounters.filter(
    (e) => e.status === "COMPLETED"
  ).length;
  const upcomingCount = encounters.filter((e) =>
    ["SCHEDULED", "CONFIRMED", "PENDING_REVIEW"].includes(e.status)
  ).length;

  const prescriptions =
    p.id === "pat_00001" ? demoPrescriptions : demoPrescriptions.slice(0, 1);

  const adherenceScore = Math.min(
    98,
    62 +
      completedCount * 8 +
      prescriptions.filter((r) => r.status === "ACTIVE").length * 5
  );
  const symptomBurden = Math.min(
    95,
    25 + complaints.length * 12 + (p.riskFlags?.length || 0) * 10
  );

  return {
    id: p.id,
    name: p.name,
    email: p.email || emailFor(p.name, p.id),
    phone: phoneFor(idx),
    age: p.age,
    gender: p.gender,
    lastVisit: p.lastVisit,
    totalVisits: Math.max(encounters.length, 1 + (p.activePrescriptions || 0)),
    status: upcomingCount > 0 ? "ACTIVE" : "FOLLOW_UP",
    riskFlags: p.riskFlags || [],
    avatarUrl: p.avatarUrl,
    chartUrl: p.chartUrl,
    chiefComplaints: complaints,
    encounters,
    prescriptions,
    analytics: {
      visitCount: encounters.length,
      completedCount,
      upcomingCount,
      openRiskCount: p.riskFlags?.length || 0,
      topPathways: [...pathwayCounts.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      adherenceScore,
      symptomBurden,
      lastConcern: complaints[0] || "—",
    },
    ai: {
      summary: brief.aiSummary,
      insights: top
        ? [
            ...top.doctorAnswer.slice(0, 3),
            ...(top.contextHints[0]
              ? [`Context signal: ${top.contextHints[0]}`]
              : []),
            `Top intent match: ${top.label} (score ${top.score.toFixed(1)})`,
          ]
        : ["No strong intent match — review free-text concern."],
      intentHits,
      suggestedFocus: top?.label || path.concernLabel,
      soapDraft: brief.suggestedSoap,
    },
  };
}

export type PatientSearchFilters = {
  specialty?: string | null;
  status?: string | null;
  riskOnly?: boolean;
  doctorId?: string | null;
};

export async function searchPatientsForDoctor(
  query: string,
  filters: PatientSearchFilters = {}
) {
  const q = query.trim().toLowerCase();
  const live = await listLiveEncounters();
  const patients = await panelPatients(filters.doctorId);
  const qIntents = q ? searchClinicalIntent(q, 4) : [];
  const qIntentIds = new Set(qIntents.map((i) => i.id));

  const dossiers = patients.slice(0, 100).map((p, idx) => {
    const enc = encountersForPatient(p, live, filters.doctorId);
    const concerns = enc.map((e) => e.chiefComplaint);
    const specialties = enc.map((e) => e.consultationType);
    const statuses = enc.map((e) => e.status);
    const corpus = concerns.join(" ");
    const cIntents = corpus ? searchClinicalIntent(corpus, 5) : [];
    const overlap = cIntents.filter((c) => qIntentIds.has(c.id));

    const nameHit = !!q && p.name.toLowerCase().includes(q);
    const emailHit =
      !!q && (p.email || emailFor(p.name, p.id)).toLowerCase().includes(q);
    const concernHit = !!q && concerns.some((c) => c.toLowerCase().includes(q));
    const riskHit =
      !!q &&
      (p.riskFlags || []).some((r) => r.toLowerCase().includes(q));
    const intentHit = overlap.length > 0;

    let score = 0;
    if (!q) score = 1;
    if (nameHit) score += 10;
    if (emailHit) score += 8;
    if (concernHit) score += 7;
    if (riskHit) score += 4;
    if (intentHit) score += 9 + overlap[0].score;

    // Specialty filter (consultation type on encounters)
    if (filters.specialty) {
      const hasSpec = specialties.includes(filters.specialty);
      if (!hasSpec) {
        // Also allow AI specialty label match via care path on concerns
        const pathHit = concerns.some(
          (c) => resolveCarePath(c).consultationType === filters.specialty
        );
        if (!pathHit) score = 0;
      } else {
        score += 3;
      }
    }

    // Status filter — patient has at least one encounter in status
    if (filters.status && score > 0) {
      const st = filters.status.toUpperCase();
      if (st === "RISK") {
        if (!(p.riskFlags && p.riskFlags.length)) score = 0;
      } else if (!statuses.includes(st)) {
        score = 0;
      }
    }

    if (filters.riskOnly && !(p.riskFlags && p.riskFlags.length)) {
      score = 0;
    }

    const lastStatus = statuses[0] || "ACTIVE";
    const primarySpecialty =
      specialties[0] ||
      (concerns[0]
        ? resolveCarePath(concerns[0]).consultationType
        : "PREVENTIVE_CARE");

    return {
      id: p.id,
      name: p.name,
      email: p.email || emailFor(p.name, p.id),
      phone: phoneFor(idx),
      age: p.age,
      gender: p.gender,
      lastVisit: p.lastVisit,
      totalVisits: Math.max(enc.length, 1),
      status: lastStatus,
      specialty: primarySpecialty,
      riskFlags: p.riskFlags || [],
      avatarUrl: p.avatarUrl,
      lastConcern: concerns[0] || "No recent chief complaint",
      concernCount: concerns.length,
      matchedIntents: (q ? overlap : cIntents).slice(0, 2).map((i) => ({
        label: i.label,
        score: i.score,
        specialty: i.specialty,
      })),
      whyContacted: concerns.slice(0, 3),
      score,
    };
  });

  const filtered = dossiers
    .filter((d) => (q || filters.specialty || filters.status || filters.riskOnly
      ? d.score > 0
      : true))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  return {
    patients: filtered,
    intentPreview: qIntents.slice(0, 3),
    query: q,
    filters,
    facets: {
      specialties: countFacet(dossiers.map((d) => d.specialty)),
      statuses: countFacet(dossiers.map((d) => d.status)),
      riskCount: dossiers.filter((d) => d.riskFlags.length > 0).length,
    },
  };
}

function countFacet(values: string[]) {
  const m = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    m.set(v, (m.get(v) || 0) + 1);
  }
  return [...m.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);
}

export async function listPanelPatients(doctorId?: string | null) {
  return panelPatients(doctorId);
}

/** Healthcare BI snapshot for admin / clinical lead */
export async function buildCareBiSnapshot(doctorId?: string | null) {
  const live = await listLiveEncounters();
  const scoped = doctorId ? live.filter((e) => e.doctorId === doctorId) : live;
  const bySpecialty = new Map<string, number>();
  const byStatus = new Map<string, number>();
  const byDoctor = new Map<string, { name: string; count: number }>();
  let highPriority = 0;

  for (const e of scoped) {
    bySpecialty.set(
      e.consultationType,
      (bySpecialty.get(e.consultationType) || 0) + 1
    );
    byStatus.set(e.status, (byStatus.get(e.status) || 0) + 1);
    const prev = byDoctor.get(e.doctorId) || { name: e.doctorName, count: 0 };
    prev.count += 1;
    byDoctor.set(e.doctorId, prev);
    if (e.priorityBand === "HIGH" || e.priorityBand === "CRITICAL") {
      highPriority += 1;
    }
  }

  const search = await searchPatientsForDoctor("", { doctorId });
  const pathwayTop = new Map<string, number>();
  for (const p of search.patients) {
    for (const m of p.matchedIntents || []) {
      pathwayTop.set(m.label, (pathwayTop.get(m.label) || 0) + 1);
    }
    if (p.lastConcern && p.lastConcern !== "No recent chief complaint") {
      const path = resolveCarePath(p.lastConcern);
      pathwayTop.set(
        path.concernLabel,
        (pathwayTop.get(path.concernLabel) || 0) + 1
      );
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      liveEncounters: scoped.length,
      patientsOnPanel: search.patients.length,
      pendingReview: byStatus.get("PENDING_REVIEW") || 0,
      confirmed: byStatus.get("CONFIRMED") || 0,
      highPriority,
      riskPatients: search.facets.riskCount,
    },
    bySpecialty: [...bySpecialty.entries()]
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count),
    byStatus: [...byStatus.entries()]
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count),
    byClinician: [...byDoctor.entries()]
      .map(([id, v]) => ({ id, name: v.name, count: v.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    topPathways: [...pathwayTop.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    model: "aw-care-bi-v1",
  };
}
