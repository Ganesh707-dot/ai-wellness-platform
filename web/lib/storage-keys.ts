/**
 * Centralized client/server storage keys.
 * Intention-revealing names beat brand-prefixed magic strings.
 */
export const STORAGE_KEYS = {
  liveEncountersCookie: "aw_live_encounters_v2",
  legacyLiveEncountersCookie: "maha_live_v2",
  legacyLiveEncountersCookieV1: "maha_live_encounters",
  managedUsersCookie: "aw_managed_users_v1",
  legacyManagedUsersCookie: "maha_admin_users",
  clinicBoard: "aw_clinic_board_v2",
  legacyClinicBoard: "maha_clinic_board_v2",
  bookingIntake: "aw_booking_intake",
  legacyBookingIntake: "maha_booking_intake",
  appointmentCache: (id: string) => `aw_appointment_${id}`,
  legacyAppointmentCache: (id: string) => `maha_apt_${id}`,
  sharedEncountersRedis: "aw:live-encounters:v2",
  sharedPanelsRedis: "aw:doctor-panels:v1",
} as const;
