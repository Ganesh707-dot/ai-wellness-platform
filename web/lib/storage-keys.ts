/**
 * Centralized client/server storage keys.
 * Intention-revealing names beat brand-prefixed magic strings.
 */
export const STORAGE_KEYS = {
  liveEncountersCookie: "aw_live_encounters_v2",
  legacyLiveEncountersCookie: "aw_legacy_live_v2",
  legacyLiveEncountersCookieV1: "aw_legacy_live_encounters",
  managedUsersCookie: "aw_managed_users_v1",
  legacyManagedUsersCookie: "aw_legacy_admin_users",
  clinicBoard: "aw_clinic_board_v2",
  legacyClinicBoard: "aw_legacy_clinic_board_v2",
  bookingIntake: "aw_booking_intake",
  legacyBookingIntake: "aw_legacy_booking_intake",
  aiTranscript: "aw_ai_transcript_v1",
  legacyAiTranscript: "aw_legacy_ai_transcript",
  appointmentCache: (id: string) => `aw_appointment_${id}`,
  legacyAppointmentCache: (id: string) => `aw_legacy_apt_${id}`,
  sharedEncountersRedis: "aw:live-encounters:v2",
  sharedPanelsRedis: "aw:doctor-panels:v1",
  aiIntakeRedisPrefix: "aw:ai-intake:v1",
} as const;
