"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import {
  appointmentBookingSchema,
  rescheduleAppointmentSchema,
  cancelAppointmentSchema,
  appointmentFeedbackSchema,
  type AppointmentBookingInput,
  type RescheduleAppointmentInput,
  type CancelAppointmentInput,
  type AppointmentFeedbackInput,
} from "@/lib/validation";
import { generateMeetingCode, sendConfirmationEmail } from "@/lib/appointment-utils";
import { redirect } from "next/navigation";

export async function bookAppointmentAction(input: AppointmentBookingInput) {
  try {
    // Validate input
    const validated = appointmentBookingSchema.parse(input);

    // Get or create patient profile
    let user = await db.user.findUnique({
      where: { email: validated.email },
      include: { patientProfile: true },
    });

    // Create new user/patient if doesn't exist
    if (!user) {
      user = await db.user.create({
        data: {
          email: validated.email,
          name: validated.name,
          role: "PATIENT",
          password: null, // Password not required for booking
          patientProfile: {
            create: {
              age: validated.age,
              gender: validated.gender,
              country: validated.country,
              phone: validated.phone,
            },
          },
        },
        include: { patientProfile: true },
      });
    }

    if (!user.patientProfile) {
      return {
        success: false,
        error: "Unable to create patient profile",
      };
    }

    // Get doctor
    const doctor = await db.doctorProfile.findUnique({
      where: { id: validated.doctorId },
      include: { user: true },
    });

    if (!doctor) {
      return {
        success: false,
        error: "Doctor not found",
      };
    }

    // Check availability
    const existingAppointment = await db.appointment.findFirst({
      where: {
        doctorId: validated.doctorId,
        scheduledAt: new Date(`${validated.preferredDate}T${validated.preferredTime}`),
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
    });

    if (existingAppointment) {
      return {
        success: false,
        error: "This time slot is no longer available. Please choose another.",
      };
    }

    // Generate meeting code
    const meetingCode = generateMeetingCode();

    // Create appointment
    const appointment = await db.appointment.create({
      data: {
        patientId: user.patientProfile.id,
        doctorId: doctor.id,
        userId: user.id,
        consultationType: validated.consultationType,
        concern: validated.concern,
        notes: validated.notes,
        scheduledAt: new Date(`${validated.preferredDate}T${validated.preferredTime}`),
        status: "SCHEDULED",
        meetingCode,
        videoCallUrl: `https://meet.wellness-platform.com/${meetingCode}`,
      },
    });

    // Send confirmation email
    await sendConfirmationEmail({
      patientEmail: user.email,
      patientName: user.name,
      doctorName: doctor.user.name,
      appointmentDate: appointment.scheduledAt,
      consultationType: validated.consultationType,
      meetingCode,
      videoCallUrl: appointment.videoCallUrl!,
    });

    // Create notification
    await db.notification.create({
      data: {
        userId: user.id,
        appointmentId: appointment.id,
        type: "APPOINTMENT_CONFIRMATION",
        title: "Appointment Confirmed",
        message: `Your appointment with Dr. ${doctor.user.name} has been confirmed for ${appointment.scheduledAt.toLocaleDateString()}.`,
      },
    });

    // Log action
    await db.auditLog.create({
      data: {
        userId: user.id,
        appointmentId: appointment.id,
        action: "Created",
        entity: "Appointment",
        entityId: appointment.id,
      },
    });

    return {
      success: true,
      message: "Appointment booked successfully",
      appointmentId: appointment.id,
    };
  } catch (error: any) {
    console.error("Booking error:", error);
    return {
      success: false,
      error: error.message || "Failed to book appointment",
    };
  }
}

export async function rescheduleAppointmentAction(
  input: RescheduleAppointmentInput
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const validated = rescheduleAppointmentSchema.parse(input);

    // Get appointment
    const appointment = await db.appointment.findUnique({
      where: { id: validated.appointmentId },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });

    if (!appointment) {
      return {
        success: false,
        error: "Appointment not found",
      };
    }

    // Verify ownership
    if (appointment.patient.user.email !== session.user.email) {
      return {
        success: false,
        error: "You can only reschedule your own appointments",
      };
    }

    // Check availability
    const existingAppointment = await db.appointment.findFirst({
      where: {
        doctorId: appointment.doctorId,
        scheduledAt: new Date(`${validated.newDate}T${validated.newTime}`),
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        id: { not: validated.appointmentId },
      },
    });

    if (existingAppointment) {
      return {
        success: false,
        error: "This time slot is no longer available",
      };
    }

    // Update appointment
    const updated = await db.appointment.update({
      where: { id: validated.appointmentId },
      data: {
        scheduledAt: new Date(`${validated.newDate}T${validated.newTime}`),
        status: "RESCHEDULED",
      },
    });

    // Create notification
    await db.notification.create({
      data: {
        userId: appointment.userId,
        appointmentId: appointment.id,
        type: "APPOINTMENT_CONFIRMATION",
        title: "Appointment Rescheduled",
        message: `Your appointment has been rescheduled for ${updated.scheduledAt.toLocaleDateString()}.`,
      },
    });

    // Log action
    await db.auditLog.create({
      data: {
        userId: session.user.id as string,
        appointmentId: appointment.id,
        action: "Updated",
        entity: "Appointment",
        entityId: appointment.id,
        changes: JSON.stringify({
          from: appointment.scheduledAt,
          to: updated.scheduledAt,
        }),
      },
    });

    return {
      success: true,
      message: "Appointment rescheduled successfully",
    };
  } catch (error: any) {
    console.error("Reschedule error:", error);
    return {
      success: false,
      error: error.message || "Failed to reschedule appointment",
    };
  }
}

export async function cancelAppointmentAction(
  input: CancelAppointmentInput
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const validated = cancelAppointmentSchema.parse(input);

    // Get appointment
    const appointment = await db.appointment.findUnique({
      where: { id: validated.appointmentId },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });

    if (!appointment) {
      return {
        success: false,
        error: "Appointment not found",
      };
    }

    // Verify ownership
    if (appointment.patient.user.email !== session.user.email) {
      return {
        success: false,
        error: "You can only cancel your own appointments",
      };
    }

    // Check if already completed
    if (appointment.status === "COMPLETED") {
      return {
        success: false,
        error: "Cannot cancel a completed appointment",
      };
    }

    // Update appointment
    await db.appointment.update({
      where: { id: validated.appointmentId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledBy: session.user.email,
        cancellationReason: validated.reason,
      },
    });

    // Create notification
    await db.notification.create({
      data: {
        userId: appointment.userId,
        appointmentId: appointment.id,
        type: "APPOINTMENT_CONFIRMATION",
        title: "Appointment Cancelled",
        message: `Your appointment has been cancelled.`,
      },
    });

    // Log action
    await db.auditLog.create({
      data: {
        userId: session.user.id as string,
        appointmentId: appointment.id,
        action: "Deleted",
        entity: "Appointment",
        entityId: appointment.id,
        changes: JSON.stringify({ reason: validated.reason }),
      },
    });

    return {
      success: true,
      message: "Appointment cancelled successfully",
    };
  } catch (error: any) {
    console.error("Cancel error:", error);
    return {
      success: false,
      error: error.message || "Failed to cancel appointment",
    };
  }
}

export async function submitAppointmentFeedbackAction(
  input: AppointmentFeedbackInput
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const validated = appointmentFeedbackSchema.parse(input);

    // Get appointment
    const appointment = await db.appointment.findUnique({
      where: { id: validated.appointmentId },
      include: {
        doctor: true,
      },
    });

    if (!appointment) {
      return {
        success: false,
        error: "Appointment not found",
      };
    }

    // Create testimonial
    await db.testimonial.create({
      data: {
        patientName: (session.user as any).name || "Anonymous",
        patientEmail: session.user.email,
        doctorId: appointment.doctorId,
        rating: validated.rating,
        title: `Great consultation` ,
        content: validated.comment,
        verified: true,
      },
    });

    // Update doctor rating (simple average)
    const allRatings = await db.testimonial.findMany({
      where: { doctorId: appointment.doctorId },
    });

    const avgRating =
      allRatings.reduce((sum, t) => sum + t.rating, 0) / allRatings.length;

    await db.doctorProfile.update({
      where: { id: appointment.doctorId },
      data: { rating: avgRating },
    });

    return {
      success: true,
      message: "Thank you for your feedback!",
    };
  } catch (error: any) {
    console.error("Feedback error:", error);
    return {
      success: false,
      error: error.message || "Failed to submit feedback",
    };
  }
}
