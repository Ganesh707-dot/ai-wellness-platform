import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export function generateMeetingCode(): string {
  return Math.random().toString(36).substring(2, 15).toUpperCase();
}

export function generateVideoCallUrl(meetingCode: string): string {
  return `https://meet.wellness-platform.com/${meetingCode}`;
}

interface ConfirmationEmailData {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  appointmentDate: Date;
  consultationType: string;
  meetingCode: string;
  videoCallUrl: string;
}

export async function sendConfirmationEmail(
  data: ConfirmationEmailData
) {
  try {
    const { patientEmail, patientName, doctorName, appointmentDate, consultationType, videoCallUrl, meetingCode } = data;

    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
            .content { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .details { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Your Appointment is Confirmed!</h1>
            </div>

            <p>Hi ${patientName},</p>

            <p>Great news! Your wellness consultation has been confirmed with Dr. ${doctorName}.</p>

            <div class="details">
              <h3>Appointment Details</h3>
              <p><strong>Date & Time:</strong> ${formattedDate}</p>
              <p><strong>Consultation Type:</strong> ${consultationType}</p>
              <p><strong>Meeting Code:</strong> ${meetingCode}</p>
            </div>

            <div class="content">
              <h3>How to Join</h3>
              <p>Click the button below to join your video consultation:</p>
              <a href="${videoCallUrl}" class="button">Join Consultation</a>
              <p>Or visit: <code>${videoCallUrl}</code></p>
            </div>

            <div class="content">
              <h3>Before Your Appointment</h3>
              <ul>
                <li>Ensure you have a stable internet connection</li>
                <li>Find a quiet, comfortable space</li>
                <li>Have your camera and microphone ready</li>
                <li>Join 5 minutes early to test your setup</li>
              </ul>
            </div>

            <div class="content">
              <h3>Need Help?</h3>
              <p>If you need to reschedule or have any questions, please contact our support team at support@wellness-platform.com</p>
            </div>

            <p>We look forward to seeing you soon!</p>

            <p>Best regards,<br>The Wellness Platform Team</p>

            <div class="footer">
              <p>This is an automated email. Please do not reply directly.</p>
              <p>&copy; 2024 Wellness Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const response = await resend.emails.send({
      from: "noreply@wellness-platform.com",
      to: patientEmail,
      subject: `Your Appointment Confirmed - ${formattedDate}`,
      html: emailHtml,
    });

    if (response.error) {
      console.error("Email sending error:", response.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    return false;
  }
}

interface RescheduleEmailData {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  newDate: Date;
  oldDate: Date;
  videoCallUrl: string;
}

export async function sendRescheduleEmail(
  data: RescheduleEmailData
) {
  try {
    const { patientEmail, patientName, doctorName, newDate, oldDate, videoCallUrl } = data;

    const newFormattedDate = newDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const oldFormattedDate = oldDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
            .details { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Your Appointment has been Rescheduled</h1>
            </div>

            <p>Hi ${patientName},</p>

            <p>Your appointment with Dr. ${doctorName} has been successfully rescheduled.</p>

            <div class="details">
              <h3>Previous Appointment</h3>
              <p><strong>Date & Time:</strong> ${oldFormattedDate}</p>
            </div>

            <div class="details">
              <h3>New Appointment</h3>
              <p><strong>Date & Time:</strong> ${newFormattedDate}</p>
            </div>

            <p>
              <a href="${videoCallUrl}" class="button">Join Your Consultation</a>
            </p>

            <p>If you have any questions, please contact our support team.</p>

            <p>Best regards,<br>The Wellness Platform Team</p>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: "noreply@wellness-platform.com",
      to: patientEmail,
      subject: "Your Appointment has been Rescheduled",
      html: emailHtml,
    });

    return true;
  } catch (error) {
    console.error("Error sending reschedule email:", error);
    return false;
  }
}

interface CancellationEmailData {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  appointmentDate: Date;
  reason?: string;
}

export async function sendCancellationEmail(
  data: CancellationEmailData
) {
  try {
    const { patientEmail, patientName, doctorName, appointmentDate, reason } = data;

    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 8px; }
            .details { background: white; padding: 15px; border-left: 4px solid #f5576c; margin: 15px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Appointment has been Cancelled</h1>
            </div>

            <p>Hi ${patientName},</p>

            <p>Your appointment with Dr. ${doctorName} has been cancelled.</p>

            <div class="details">
              <h3>Cancelled Appointment Details</h3>
              <p><strong>Date & Time:</strong> ${formattedDate}</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
            </div>

            <p>If you'd like to schedule a new appointment, you can do so anytime at your dashboard.</p>

            <p><a href="https://wellness-platform.com/dashboard" class="button">Go to Dashboard</a></p>

            <p>If you have any questions, please contact our support team.</p>

            <p>Best regards,<br>The Wellness Platform Team</p>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: "noreply@wellness-platform.com",
      to: patientEmail,
      subject: "Your Appointment has been Cancelled",
      html: emailHtml,
    });

    return true;
  } catch (error) {
    console.error("Error sending cancellation email:", error);
    return false;
  }
}

// Check if time slot is available
export async function isTimeSlotAvailable(
  doctorId: string,
  date: string,
  time: string
): Promise<boolean> {
  // This would be called from an API endpoint
  // Implementation depends on your database setup
  return true;
}

// Get available time slots for a date
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

// Calculate appointment duration
export function calculateDuration(
  startTime: Date,
  endTime: Date
): number {
  return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
}

// Check if appointment can be rescheduled (not too close to original time)
export function canReschedule(appointmentDate: Date): boolean {
  const now = new Date();
  const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilAppointment >= 24; // Can only reschedule 24+ hours before
}

// Check if appointment can be cancelled
export function canCancel(appointmentStatus: string): boolean {
  return appointmentStatus !== "COMPLETED" && appointmentStatus !== "CANCELLED";
}
