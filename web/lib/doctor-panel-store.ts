/**
 * Clinician panels — bookable profiles with specialty.
 * IAM users link via doctorId; booking filters panels by specialization.
 */

import { cookies } from "next/headers";
import { demoDoctors } from "@/lib/demo-data";
import {
  sharedListPanels,
  sharedUpsertPanel,
  sharedWritePanels,
} from "@/lib/shared-panel-store";

export const CLINICIAN_SPECIALTIES = [
  "HOMEOPATHY",
  "PEDIATRICS",
  "FERTILITY",
  "WOMENS_WELLNESS",
  "EMOTIONAL_WELLNESS",
  "FAMILY_WELLNESS",
  "PREVENTIVE_CARE",
] as const;

export type ClinicianSpecialty = (typeof CLINICIAN_SPECIALTIES)[number];

export type DoctorPanel = {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  consultationFee: number;
  currency: string;
  rating: number;
  totalConsultations: number;
  bio: string;
  isVerified: boolean;
  qualifications: string[];
  profileImage?: string;
  source: "managed" | "seed";
  linkedUserEmail?: string;
  createdAt: string;
};

const COOKIE = "aw_doctor_panels_v1";
const MAX = 200;

type GlobalStore = { __awDoctorPanels?: DoctorPanel[] };

function memory(): DoctorPanel[] {
  const g = globalThis as GlobalStore;
  if (!g.__awDoctorPanels) g.__awDoctorPanels = [];
  return g.__awDoctorPanels;
}

async function readCookie(): Promise<DoctorPanel[]> {
  try {
    const jar = await cookies();
    const raw = jar.get(COOKIE)?.value;
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DoctorPanel[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeManaged(panels: DoctorPanel[]) {
  const managed = panels
    .filter((p) => p.source === "managed")
    .slice(0, MAX);
  const jar = await cookies();
  jar.set(COOKIE, JSON.stringify(managed), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
  const mem = memory();
  mem.length = 0;
  mem.push(...managed);
}

function seedAsPanels(): DoctorPanel[] {
  return demoDoctors
    .filter((d) => d.isVerified)
    .map((d) => ({
      id: d.id,
      name: d.name,
      specialization: d.specialization,
      experience: d.experience,
      consultationFee: d.consultationFee,
      currency: d.currency || "INR",
      rating: d.rating,
      totalConsultations: d.totalConsultations,
      bio: d.bio,
      isVerified: true,
      qualifications: d.qualifications || [],
      profileImage: d.profileImage,
      source: "seed" as const,
      createdAt: "2024-01-01T00:00:00.000Z",
    }));
}

export async function listDoctorPanels(): Promise<DoctorPanel[]> {
  const fromShared = (await sharedListPanels().catch(() => null)) || [];
  const managed = [...memory(), ...(await readCookie()), ...fromShared];
  const map = new Map<string, DoctorPanel>();
  for (const p of seedAsPanels()) map.set(p.id, p);
  for (const p of managed) {
    map.set(p.id, { ...p, source: "managed" });
  }
  return [...map.values()].sort((a, b) => {
    if (a.source !== b.source) return a.source === "managed" ? -1 : 1;
    const sa = a.specialization.localeCompare(b.specialization);
    if (sa !== 0) return sa;
    return a.name.localeCompare(b.name);
  });
}

export async function getDoctorPanel(id: string) {
  return (await listDoctorPanels()).find((p) => p.id === id) || null;
}

export type UpsertPanelInput = {
  id?: string;
  name: string;
  specialization: string;
  linkedUserEmail?: string;
  experience?: number;
  consultationFee?: number;
  bio?: string;
};

export async function upsertDoctorPanel(
  input: UpsertPanelInput
): Promise<DoctorPanel> {
  const specialization = CLINICIAN_SPECIALTIES.includes(
    input.specialization as ClinicianSpecialty
  )
    ? input.specialization
    : "PREVENTIVE_CARE";

  const id = input.id?.trim() || `doc_live_${Date.now()}`;
  const existingManaged = (await readCookie()).find((p) => p.id === id);
  const existingAny = await getDoctorPanel(id);

  const panel: DoctorPanel = {
    id,
    name: input.name.trim(),
    specialization,
    experience:
      input.experience ??
      existingManaged?.experience ??
      existingAny?.experience ??
      5,
    consultationFee:
      input.consultationFee ??
      existingManaged?.consultationFee ??
      existingAny?.consultationFee ??
      1200,
    currency: "INR",
    rating: existingManaged?.rating ?? existingAny?.rating ?? 4.6,
    totalConsultations:
      existingManaged?.totalConsultations ??
      existingAny?.totalConsultations ??
      0,
    bio:
      input.bio?.trim() ||
      existingManaged?.bio ||
      `${specialization.replaceAll("_", " ")} clinician · bookable on AI Wellness`,
    isVerified: true,
    qualifications:
      specialization === "HOMEOPATHY"
        ? ["BHMS", "MD Homeopathy"]
        : ["MBBS", "MD"],
    profileImage:
      existingManaged?.profileImage ||
      existingAny?.profileImage ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(input.name)}`,
    source: "managed",
    linkedUserEmail:
      input.linkedUserEmail || existingManaged?.linkedUserEmail,
    createdAt:
      existingManaged?.createdAt ||
      existingAny?.createdAt ||
      new Date().toISOString(),
  };

  const prev = await readCookie();
  const next = [panel, ...prev.filter((p) => p.id !== id)].slice(0, MAX);
  await writeManaged(next);
  await sharedUpsertPanel(panel).catch(() => false);
  // Keep Redis catalog aligned with cookie+memory managed set
  const allManaged = next.filter((p) => p.source === "managed");
  await sharedWritePanels(allManaged).catch(() => false);
  return panel;
}

export async function listPanelsForAdmin() {
  const panels = await listDoctorPanels();
  return panels.map((p) => ({
    id: p.id,
    name: p.name,
    specialization: p.specialization,
    label: `[${p.specialization.replaceAll("_", " ")}] ${p.name}`,
    source: p.source,
    linkedUserEmail: p.linkedUserEmail,
  }));
}

export async function listBookableDoctors(
  specialization?: string | null,
  opts?: { soft?: boolean }
) {
  let panels = (await listDoctorPanels()).filter((p) => p.isVerified);
  if (specialization) {
    const matched = panels.filter((p) => p.specialization === specialization);
    if (matched.length > 0) {
      panels = matched;
    } else if (!opts?.soft) {
      panels = [];
    }
    // soft: keep full catalog so AI can suggest adjacent clinicians
  }

  const pinned = ["doc_01", "doc_lead"];
  return [
    ...panels.filter((p) => p.source === "managed"),
    ...panels.filter((p) => pinned.includes(p.id)),
    ...panels.filter(
      (p) => p.source !== "managed" && !pinned.includes(p.id)
    ),
  ].filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);
}
