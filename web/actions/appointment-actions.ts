"use server";

import {
  appointmentBookingSchema,
  type AppointmentBookingInput,
} from "@/lib/validation-booking";
import { buildLiveEncounter, saveLiveEncounter } from "@/lib/demo-store";
import { getDoctorPanel, listBookableDoctors } from "@/lib/doctor-panel-store";
import { matchCliniciansForConcern } from "@/lib/match-clinician";
import { auth } from "@/auth";

export async function bookAppointmentAction(input: AppointmentBookingInput) {
  try {
    const session = await auth();
    const validated = appointmentBookingSchema.parse(input);

    // Resolve against live specialty panels (managed + seed) — never remap to Meera
    let panel = await getDoctorPanel(validated.doctorId);
    if (!panel) {
      const bookable = await listBookableDoctors(validated.consultationType, {
        soft: true,
      });
      panel = bookable.find((d) => d.id === validated.doctorId) || null;
    }
    if (!panel) {
      return {
        success: false,
        error:
          "Selected clinician panel was not found. Go back and pick a clinician from the list (e.g. Ganesh under Homeopathy).",
      };
    }

    const encounter = buildLiveEncounter(
      {
        ...validated,
        email: session?.user?.email || validated.email,
        name: validated.name || session?.user?.name || "Patient",
        doctorId: panel.id,
        consultationType: (panel.specialization ||
          validated.consultationType) as AppointmentBookingInput["consultationType"],
      },
      panel.name
    );

    await saveLiveEncounter(encounter);

    return {
      success: true,
      appointmentId: encounter.id,
      meetingCode: encounter.meetingCode,
      status: encounter.status,
      priorityBand: encounter.priorityBand,
      aiPathway: encounter.aiPathway,
      doctorId: panel.id,
      doctorName: panel.name,
      encounter,
      message: `Request sent to ${panel.name} — they must accept before the slot is confirmed`,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Booking failed",
    };
  }
}

export async function aiMatchCliniciansAction(opts: {
  concern: string;
  specialty?: string;
}) {
  try {
    const result = await matchCliniciansForConcern({
      concern: opts.concern,
      specialty: opts.specialty,
      limit: 8,
    });
    return { success: true, ...result };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Match failed",
    };
  }
}

export async function decideAppointmentAction(
  appointmentId: string,
  decision: "accept" | "decline",
  note?: string
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const role = (session.user as { role?: string }).role;
    if (role !== "DOCTOR" && role !== "CLINICAL_LEAD" && role !== "ADMIN") {
      return { success: false, error: "Only clinicians can decide requests" };
    }

    const {
      decideLiveEncounter,
      getLiveEncounter,
      canViewEncounter,
      clinicianDoctorIdForEmail,
    } = await import("@/lib/demo-store");
    const { resolveClinicianDoctorId } = await import("@/lib/user-store");

    const existing = await getLiveEncounter(appointmentId);
    if (!existing) {
      return { success: false, error: "Live request not found" };
    }

    const doctorId =
      (session.user as { doctorId?: string }).doctorId ||
      (await resolveClinicianDoctorId(session.user.email)) ||
      clinicianDoctorIdForEmail(session.user.email);

    const allowed = canViewEncounter(existing, {
      role,
      email: session.user.email,
      doctorId,
    });
    if (!allowed) {
      return {
        success: false,
        error: "Privacy: this request is assigned to another clinician",
      };
    }

    const updated = await decideLiveEncounter(
      appointmentId,
      decision,
      session.user.name || session.user.email || "Clinician",
      note
    );

    if (!updated) {
      return { success: false, error: "Live request not found" };
    }

    return {
      success: true,
      appointment: updated,
      message:
        decision === "accept"
          ? "Accepted — patient slot confirmed"
          : "Declined — patient can rebook",
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Decision failed",
    };
  }
}

export async function rescheduleAppointmentAction() {
  return { success: true, message: "Rescheduled (demo)" };
}

export async function cancelAppointmentAction() {
  return { success: true, message: "Cancelled (demo)" };
}

export async function appointmentFeedbackAction() {
  return { success: true, message: "Feedback saved (demo)" };
}
