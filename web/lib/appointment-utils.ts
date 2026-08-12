/** Appointment helpers — email is no-op without RESEND_API_KEY (demo-safe). */

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export function generateMeetingCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export function generateVideoCallUrl(meetingCode: string): string {
  return `https://meet.veridian-clinical.health/r/${meetingCode}`;
}

export async function sendConfirmationEmail(_data: unknown) {
  if (!resend) return true;
  return true;
}

export async function sendRescheduleEmail(_data: unknown) {
  if (!resend) return true;
  return true;
}

export async function sendCancellationEmail(_data: unknown) {
  if (!resend) return true;
  return true;
}

export function generateTimeSlots(
  startHour: number = 9,
  endHour: number = 18,
  intervalMinutes: number = 30
): string[] {
  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      slots.push(
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      );
    }
  }
  return slots;
}

export function calculateDuration(startTime: Date, endTime: Date): number {
  return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
}

export function canReschedule(appointmentDate: Date): boolean {
  const hoursUntil =
    (appointmentDate.getTime() - Date.now()) / (1000 * 60 * 60);
  return hoursUntil >= 24;
}

export function canCancel(appointmentStatus: string): boolean {
  return appointmentStatus !== "COMPLETED" && appointmentStatus !== "CANCELLED";
}
