import { cookies } from "next/headers";
import { resolveCarePath } from "@/lib/care-path";
import { buildClinicalCopilot } from "@/lib/ai-client";
import { topIntent } from "@/lib/intent-search";
import { generateMeetingCode } from "@/lib/appointment-utils";
import type { AppointmentBookingInput } from "@/lib/validation-booking";
import {
  sharedListCompacts,
  sharedUpsertEncounter,
  sharedWriteCompacts,
  encounterToSharedCompact,
  type SharedCompact,
} from "@/lib/shared-booking-store";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { mergeEncounterLists, preferEncounter } from "@/lib/encounter-merge";

export type EncounterStatus =
  | "PENDING_REVIEW"
  | "CONFIRMED"
  | "DECLINED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type PriorityBand = "CRITICAL" | "HIGH" | "ROUTINE";

export type LiveEncounter = {
  id: string;
  patientName: string;
  patientId: string;
  patientEmail: string;
  doctorName: string;
  doctorId: string;
  consultationType: string;
  status: EncounterStatus;
  scheduledAt: string;
  concern: string;
  notes?: string;
  meetingCode: string;
  videoCallUrl: string;
  chiefComplaint: string;
  aiSpecialty: string;
  aiPathway: string;
  aiFirstAid: string[];
  visitPrep: string[];
  redFlags: string;
  doctorBrief: string;
  aiInsights: string[];
  aiModel: string;
  intentLabel?: string;
  intentScore?: number;
  aiIntakeSummary?: string;
  priorityBand: PriorityBand;
  riskScore: number;
  soapDraft: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  source: "live-booking" | "seed";
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  decisionNote?: string;
};

/** Compact wire format — keeps cookie under browser 4KB limit */
type CompactEncounter = {
  id: string;
  pn: string; // patientName
  pe: string; // patientEmail
  pid: string; // patientId
  dn: string; // doctorName
  did: string; // doctorId
  ct: string; // consultationType
  st: EncounterStatus;
  at: string; // scheduledAt
  c: string; // concern
  n?: string; // notes
  mc: string; // meetingCode
  cr: string; // createdAt
  pb: PriorityBand;
  rs: number;
  dat?: string;
  dby?: string;
  dnote?: string;
  is?: string; // aiIntakeSummary
};

const COOKIE = STORAGE_KEYS.liveEncountersCookie;
const MAX = 8;

type GlobalStore = { __awLiveEncounters?: LiveEncounter[] };

function memory(): LiveEncounter[] {
  const g = globalThis as GlobalStore;
  if (!g.__awLiveEncounters) g.__awLiveEncounters = [];
  return g.__awLiveEncounters;
}

function priorityFromAi(riskScore: number, emergency: boolean): PriorityBand {
  if (emergency || riskScore >= 0.85) return "CRITICAL";
  if (riskScore >= 0.45) return "HIGH";
  return "ROUTINE";
}

function hydrateFromConcern(
  base: Omit<
    LiveEncounter,
    | "aiSpecialty"
    | "aiPathway"
    | "aiFirstAid"
    | "visitPrep"
    | "redFlags"
    | "doctorBrief"
    | "aiInsights"
    | "aiModel"
    | "intentLabel"
    | "intentScore"
    | "soapDraft"
    | "priorityBand"
    | "riskScore"
  > &
    Partial<Pick<LiveEncounter, "priorityBand" | "riskScore">>
): LiveEncounter {
  const corpus = `${base.concern} ${base.notes || ""}`.trim();
  const path = resolveCarePath(corpus);
  const hit = topIntent(corpus);
  const copilot = buildClinicalCopilot(corpus);
  const risk = base.riskScore ?? copilot.riskScore;
  const emergency = Boolean(path.isEmergency || hit?.intent === "emergency");
  return {
    ...base,
    chiefComplaint: base.chiefComplaint || base.concern,
    aiSpecialty: hit?.specialty || path.specialty,
    aiPathway: hit?.label || path.concernLabel,
    aiFirstAid: hit?.patientAnswer || path.firstAid,
    visitPrep: path.prep,
    redFlags: (hit?.redFlags || [path.redFlags]).join("; "),
    doctorBrief: copilot.aiSummary,
    aiInsights: copilot.aiInsights,
    aiModel: copilot.model,
    intentLabel: hit?.label,
    intentScore: hit?.score,
    priorityBand: base.priorityBand || priorityFromAi(risk, emergency),
    riskScore: risk,
    soapDraft: copilot.suggestedSoap,
  };
}

function toCompact(e: LiveEncounter): CompactEncounter {
  return {
    id: e.id,
    pn: e.patientName,
    pe: e.patientEmail,
    pid: e.patientId,
    dn: e.doctorName,
    did: e.doctorId,
    ct: e.consultationType,
    st: e.status,
    at: e.scheduledAt,
    c: e.concern.slice(0, 280),
    n: e.notes?.slice(0, 800),
    mc: e.meetingCode,
    cr: e.createdAt,
    pb: e.priorityBand,
    rs: e.riskScore,
    dat: e.decidedAt,
    dby: e.decidedBy,
    dnote: e.decisionNote?.slice(0, 160),
    is: e.aiIntakeSummary?.slice(0, 4000),
  };
}

function fromCompact(c: CompactEncounter): LiveEncounter {
  const base = hydrateFromConcern({
    id: c.id,
    patientName: c.pn,
    patientEmail: c.pe,
    patientId: c.pid,
    doctorName: c.dn,
    doctorId: c.did,
    consultationType: c.ct,
    status: c.st,
    scheduledAt: c.at,
    concern: c.c,
    notes: c.n,
    meetingCode: c.mc,
    videoCallUrl: `https://meet.veridian-clinical.demo/room/${c.mc}`,
    chiefComplaint: c.c,
    source: "live-booking",
    createdAt: c.cr,
    priorityBand: c.pb,
    riskScore: c.rs,
    decidedAt: c.dat,
    decidedBy: c.dby,
    decisionNote: c.dnote,
  });
  if (c.is) base.aiIntakeSummary = c.is;
  return base;
}

export function buildLiveEncounter(
  input: AppointmentBookingInput,
  doctorName = "Dr. Meera Sharma"
): LiveEncounter {
  const chief =
    input.conversationConcern?.trim() || input.concern.trim();
  const aiPacket = input.aiIntakeSummary?.trim() || "";
  const corpus = `${chief} ${input.notes || ""} ${aiPacket}`.trim();
  const path = resolveCarePath(corpus);
  const hit = topIntent(corpus);
  const copilot = buildClinicalCopilot(corpus);
  const id = `apt_live_${Date.now()}`;
  const meetingCode = generateMeetingCode();
  const scheduledAt = new Date(
    `${input.preferredDate}T${input.preferredTime}:00`
  ).toISOString();
  const emergency = Boolean(path.isEmergency || hit?.intent === "emergency");

  const mergedNotes = [input.notes, aiPacket].filter(Boolean).join("\n\n");

  return {
    id,
    patientName: input.name,
    patientId: "pat_00001",
    patientEmail: input.email.trim().toLowerCase(),
    doctorName,
    doctorId: input.doctorId || "doc_01",
    consultationType: input.consultationType || path.consultationType,
    status: "PENDING_REVIEW",
    scheduledAt,
    concern: chief,
    notes: mergedNotes || undefined,
    meetingCode,
    videoCallUrl: `https://meet.veridian-clinical.demo/room/${meetingCode}`,
    chiefComplaint: chief,
    aiSpecialty: hit?.specialty || path.specialty,
    aiPathway: hit?.label || path.concernLabel,
    aiFirstAid: hit?.patientAnswer || path.firstAid,
    visitPrep: path.prep,
    redFlags: (hit?.redFlags || [path.redFlags]).join("; "),
    doctorBrief: copilot.aiSummary,
    aiInsights: copilot.aiInsights,
    aiModel: copilot.model,
    intentLabel: hit?.label,
    intentScore: hit?.score,
    aiIntakeSummary: aiPacket || undefined,
    priorityBand: priorityFromAi(copilot.riskScore, emergency),
    riskScore: copilot.riskScore,
    soapDraft: copilot.suggestedSoap,
    source: "live-booking",
    createdAt: new Date().toISOString(),
  };
}

function encodeCookiePayload(compact: CompactEncounter[]) {
  return Buffer.from(JSON.stringify(compact), "utf8").toString("base64url");
}

function decodeCookiePayload(raw: string): CompactEncounter[] {
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    if (parsed[0]?.patientName || parsed[0]?.concern) {
      return (parsed as LiveEncounter[]).map((e) => toCompact(e));
    }
    return parsed as CompactEncounter[];
  } catch {
    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      if (!Array.isArray(parsed)) return [];
      if (parsed[0]?.patientName || parsed[0]?.concern) {
        return (parsed as LiveEncounter[]).map((e) => toCompact(e));
      }
      return parsed as CompactEncounter[];
    } catch {
      return [];
    }
  }
}

async function readCookieCompacts(): Promise<CompactEncounter[]> {
  try {
    const jar = await cookies();
    const raw =
      jar.get(COOKIE)?.value ||
      jar.get(STORAGE_KEYS.legacyLiveEncountersCookie)?.value ||
      jar.get(STORAGE_KEYS.legacyLiveEncountersCookieV1)?.value;
    if (!raw) return [];
    return decodeCookiePayload(raw);
  } catch {
    return [];
  }
}

function sharedToLive(c: SharedCompact | CompactEncounter): LiveEncounter {
  return fromCompact(c as CompactEncounter);
}

async function persistAll(list: LiveEncounter[]) {
  let compact = list.slice(0, MAX).map(toCompact);
  let payload = encodeCookiePayload(compact);
  while (payload.length > 3500 && compact.length > 1) {
    compact = compact.slice(0, compact.length - 1);
    payload = encodeCookiePayload(compact);
  }

  const jar = await cookies();
  jar.set(COOKIE, payload, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });

  const mem = memory();
  mem.length = 0;
  mem.push(...list.slice(0, MAX));

  await sharedWriteCompacts(list.map(encounterToSharedCompact)).catch(
    () => false
  );
}

export async function saveLiveEncounter(encounter: LiveEncounter) {
  const fromCookie = (await readCookieCompacts()).map(fromCompact);
  const fromMem = memory();
  const existing = [...fromMem, ...fromCookie].find(
    (e) => e.id === encounter.id
  );
  const winner = existing ? preferEncounter(existing, encounter) : encounter;
  const merged = mergeEncounterLists(fromMem, fromCookie, [winner])
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, MAX);

  try {
    await persistAll(merged);
  } catch {
    const mem = memory();
    const idx = mem.findIndex((e) => e.id === winner.id);
    if (idx >= 0) mem[idx] = preferEncounter(mem[idx], winner);
    else mem.unshift(winner);
    if (mem.length > MAX) mem.length = MAX;
  }

  await sharedUpsertEncounter(winner).catch(() => false);
  return winner;
}

export async function listLiveEncounters(): Promise<LiveEncounter[]> {
  const fromCookie = (await readCookieCompacts()).map(fromCompact);
  const fromMem = memory();
  const fromShared = await sharedListCompacts();
  const sharedLive = (fromShared || []).map(sharedToLive) as LiveEncounter[];
  return mergeEncounterLists(fromMem, fromCookie, sharedLive).sort((a, b) => {
    const pri = { CRITICAL: 0, HIGH: 1, ROUTINE: 2 } as const;
    const pa = pri[a.priorityBand] ?? 2;
    const pb = pri[b.priorityBand] ?? 2;
    if (a.status === "PENDING_REVIEW" && b.status !== "PENDING_REVIEW")
      return -1;
    if (b.status === "PENDING_REVIEW" && a.status !== "PENDING_REVIEW")
      return 1;
    if (pa !== pb) return pa - pb;
    return +new Date(b.createdAt) - +new Date(a.createdAt);
  });
}

export async function getLiveEncounter(id: string) {
  const all = await listLiveEncounters();
  return all.find((e) => e.id === id) || null;
}

export async function decideLiveEncounter(
  id: string,
  decision: "accept" | "decline",
  actorName: string,
  note?: string
): Promise<LiveEncounter | null> {
  const all = await listLiveEncounters();
  const idx = all.findIndex((e) => e.id === id);
  if (idx < 0) return null;

  const current = all[idx];
  if (current.status !== "PENDING_REVIEW") {
    return current;
  }

  const updated: LiveEncounter = {
    ...current,
    status: decision === "accept" ? "CONFIRMED" : "DECLINED",
    decidedAt: new Date().toISOString(),
    decidedBy: actorName,
    decisionNote:
      note?.trim() ||
      (decision === "accept"
        ? "Clinician accepted — slot held for telehealth"
        : "Clinician declined — patient should rebook another slot"),
  };

  all[idx] = updated;
  await persistAll(all);
  await sharedUpsertEncounter(updated).catch(() => false);
  return updated;
}

/** Map login email → clinician panel id (privacy boundary) */
export function clinicianDoctorIdForEmail(email?: string | null): string | null {
  const e = (email || "").toLowerCase();
  if (e === "doctor@test.com") return "doc_01";
  if (e === "lead@test.com") return "doc_lead";
  return null;
}

/**
 * Privacy:
 * - PATIENT: own email only
 * - DOCTOR (fresher): only their doctorId panel
 * - CLINICAL_LEAD / ADMIN: clinic-wide (oversight)
 */
export function canViewEncounter(
  encounter: LiveEncounter,
  opts: {
    role?: string | null;
    email?: string | null;
    doctorId?: string | null;
  }
): boolean {
  const role = opts.role || "";
  if (role === "ADMIN" || role === "CLINICAL_LEAD") return true;
  if (role === "PATIENT") {
    return (
      encounter.patientEmail.toLowerCase() ===
      (opts.email || "").toLowerCase()
    );
  }
  if (role === "DOCTOR") {
    const mine = opts.doctorId || clinicianDoctorIdForEmail(opts.email);
    return Boolean(mine && encounter.doctorId === mine);
  }
  return false;
}

export function enrichSeedAppointment(a: {
  id: string;
  patientName: string;
  patientId?: string;
  doctorName: string;
  doctorId: string;
  consultationType: string;
  status: string;
  scheduledAt: string;
  concern: string;
  meetingCode?: string;
  videoCallUrl?: string;
  notes?: string;
  chiefComplaint?: string;
  aiSpecialty?: string;
  aiPathway?: string;
  aiFirstAid?: string[];
  visitPrep?: string[];
  redFlags?: string;
  doctorBrief?: string;
  soapDraft?: LiveEncounter["soapDraft"];
}): LiveEncounter {
  return hydrateFromConcern({
    id: a.id,
    patientName: a.patientName,
    patientId: a.patientId || "pat_unknown",
    patientEmail: "patient@test.com",
    doctorName: a.doctorName,
    doctorId: a.doctorId,
    consultationType: a.consultationType,
    status: (a.status as EncounterStatus) || "CONFIRMED",
    scheduledAt: a.scheduledAt,
    concern: a.concern,
    notes: a.notes,
    meetingCode: a.meetingCode || "VCLN-SEED",
    videoCallUrl: a.videoCallUrl || `https://meet.veridian-clinical.demo/room/${a.id}`,
    chiefComplaint: a.chiefComplaint || a.concern,
    source: "seed",
    createdAt: a.scheduledAt,
  });
}
