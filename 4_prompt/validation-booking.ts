import { z } from "zod";

// Personal Information Step
export const personalInfoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  age: z.number().min(1, "Age must be at least 1").max(150, "Invalid age"),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]),
  country: z.string().min(2, "Country is required"),
});

// Concern Step
export const concernSchema = z.object({
  consultationType: z.enum([
    "HOMEOPATHY",
    "PEDIATRICS",
    "FERTILITY",
    "WOMENS_WELLNESS",
    "EMOTIONAL_WELLNESS",
    "FAMILY_WELLNESS",
    "PREVENTIVE_CARE",
  ]),
  concern: z.string().min(5, "Please describe your concern in detail"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

// Doctor Selection
export const doctorSelectionSchema = z.object({
  doctorId: z.string().cuid("Invalid doctor ID"),
});

// Schedule Step
export const scheduleSchema = z.object({
  preferredDate: z.string().refine(
    (date) => {
      const selectedDate = new Date(date + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate > today; // Must be in future
    },
    "Appointment date must be in the future"
  ),
  preferredTime: z.string().regex(
    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    "Invalid time format"
  ),
});

// Combined Booking Schema
export const appointmentBookingSchema = personalInfoSchema
  .merge(concernSchema)
  .merge(doctorSelectionSchema)
  .merge(scheduleSchema);

// Type exports
export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;
export type ConcernInput = z.infer<typeof concernSchema>;
export type DoctorSelectionInput = z.infer<typeof doctorSelectionSchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;
export type AppointmentBookingInput = z.infer<typeof appointmentBookingSchema>;

// Additional validation for appointment availability
export const appointmentAvailabilitySchema = z.object({
  doctorId: z.string().cuid(),
  date: z.string().date(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
});

export type AppointmentAvailabilityInput = z.infer<
  typeof appointmentAvailabilitySchema
>;

// Appointment confirmation schema
export const appointmentConfirmationSchema = z.object({
  appointmentId: z.string().cuid(),
  patientEmail: z.string().email(),
  doctorName: z.string(),
  consultationType: z.string(),
  scheduledAt: z.date(),
  videoCallUrl: z.string().url(),
  meetingCode: z.string(),
});

export type AppointmentConfirmationInput = z.infer<
  typeof appointmentConfirmationSchema
>;

// Reschedule appointment schema
export const rescheduleAppointmentSchema = z.object({
  appointmentId: z.string().cuid(),
  newDate: z.string().refine(
    (date) => {
      const selectedDate = new Date(date + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate > today;
    },
    "Appointment date must be in the future"
  ),
  newTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
});

export type RescheduleAppointmentInput = z.infer<
  typeof rescheduleAppointmentSchema
>;

// Cancel appointment schema
export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().cuid(),
  reason: z.string().min(5, "Please provide a reason for cancellation"),
});

export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;

// Appointment feedback/rating schema
export const appointmentFeedbackSchema = z.object({
  appointmentId: z.string().cuid(),
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  comment: z.string().max(500, "Comment must be less than 500 characters"),
  wouldRecommend: z.boolean(),
});

export type AppointmentFeedbackInput = z.infer<
  typeof appointmentFeedbackSchema
>;
