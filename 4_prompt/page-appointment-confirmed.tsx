"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface AppointmentConfirmed {
  id: string;
  doctorName: string;
  consultationType: string;
  scheduledAt: string;
  videoCallUrl: string;
  meetingCode: string;
}

export default function AppointmentConfirmedPage() {
  const params = useParams();
  const appointmentId = params.id as string;
  const [appointment, setAppointment] = useState<AppointmentConfirmed | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await fetch(
          `/api/appointments/${appointmentId}`
        );
        if (response.ok) {
          const data = await response.json();
          setAppointment(data);
        }
      } catch (error) {
        console.error("Error fetching appointment:", error);
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
        <Card className="max-w-md p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Appointment Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            We couldn't find your appointment details.
          </p>
          <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const appointmentDate = new Date(appointment.scheduledAt);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Card */}
        <Card className="p-12 text-center mb-8 shadow-xl">
          <div className="text-7xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Appointment Confirmed!
          </h1>
          <p className="text-gray-600 text-lg">
            Your consultation has been successfully scheduled
          </p>
        </Card>

        {/* Details */}
        <Card className="p-8 mb-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Your Appointment Details
          </h2>

          <div className="space-y-6">
            {/* Doctor & Type */}
            <div className="flex items-start gap-4 pb-6 border-b border-gray-200">
              <span className="text-4xl">👨‍⚕️</span>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">
                  Doctor
                </p>
                <p className="text-lg font-bold text-gray-900">
                  Dr. {appointment.doctorName}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {appointment.consultationType}
                </p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-start gap-4 pb-6 border-b border-gray-200">
              <span className="text-4xl">📅</span>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">
                  Date & Time
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {appointmentDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {appointmentDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Meeting Code */}
            <div className="flex items-start gap-4 pb-6 border-b border-gray-200">
              <span className="text-4xl">🔐</span>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">
                  Meeting Code
                </p>
                <p className="text-lg font-bold text-gray-900 font-mono">
                  {appointment.meetingCode}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Save this code for your records
                </p>
              </div>
            </div>
          </div>

          {/* Join Button */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <Button
              asChild
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold"
            >
              <Link href={appointment.videoCallUrl}>
                Join Video Consultation
              </Link>
            </Button>
            <p className="text-center text-sm text-gray-600 mt-4">
              Or visit: <code className="text-xs bg-gray-100 px-2 py-1 rounded">{appointment.videoCallUrl}</code>
            </p>
          </div>
        </Card>

        {/* Next Steps */}
        <Card className="p-8 mb-8 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            What Happens Next
          </h3>

          <div className="space-y-4">
            <Step
              number={1}
              title="Confirmation Email"
              description="Check your email for appointment details and video call link"
              icon="📧"
            />
            <Step
              number={2}
              title="24-Hour Reminder"
              description="You'll receive a reminder notification before your appointment"
              icon="⏰"
            />
            <Step
              number={3}
              title="Join the Call"
              description="Click the video call link 5 minutes before the scheduled time"
              icon="📹"
            />
            <Step
              number={4}
              title="Share Feedback"
              description="After your consultation, please share your experience with us"
              icon="⭐"
            />
          </div>
        </Card>

        {/* Tips */}
        <Card className="p-8 mb-8 bg-blue-50 border border-blue-200 shadow-lg">
          <h3 className="text-xl font-bold text-blue-900 mb-4">💡 Tips for a Great Consultation</h3>
          <ul className="space-y-3 text-blue-900">
            <li className="flex gap-3">
              <span>✓</span>
              <span>Find a quiet, well-lit space for the call</span>
            </li>
            <li className="flex gap-3">
              <span>✓</span>
              <span>Test your camera and microphone beforehand</span>
            </li>
            <li className="flex gap-3">
              <span>✓</span>
              <span>Have a stable internet connection</span>
            </li>
            <li className="flex gap-3">
              <span>✓</span>
              <span>Prepare any medical documents or questions</span>
            </li>
          </ul>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/">Back to Home</Link>
          </Button>
          <Button asChild className="flex-1 bg-indigo-600 hover:bg-indigo-700">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  description,
  icon,
}: {
  number: number;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold flex-shrink-0">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <p className="font-semibold text-gray-900">{title}</p>
        </div>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );
}
