"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { useRouter } from "next/navigation";

interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  consultationType: string;
  scheduledAt: string;
  status: string;
  concern: string;
  videoCallUrl?: string;
}

export default function DoctorAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("upcoming");

  useEffect(() => {
    fetchAppointments();
  }, [selectedTab]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`/api/doctor/appointments?status=${selectedTab}`);
      if (!response.ok) throw new Error("Failed to fetch appointments");
      const data = await response.json();
      setAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading appointments");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Appointments
          </h1>
          <p className="text-gray-600">
            Manage your consultation schedule
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <Card className="p-6 mb-8">
          <div className="flex gap-4 border-b border-gray-200">
            {["upcoming", "today", "completed", "cancelled"].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`pb-3 px-4 font-medium transition-colors ${
                  selectedTab === tab
                    ? "border-b-2 border-purple-600 text-purple-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </Card>

        {/* Appointments List */}
        {appointments.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500 text-lg">
              No {selectedTab} appointments
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onAction={() => router.refresh()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AppointmentCard({
  appointment,
  onAction,
}: {
  appointment: Appointment;
  onAction: () => void;
}) {
  const appointmentDate = new Date(appointment.scheduledAt);
  const now = new Date();
  const isToday =
    appointmentDate.toDateString() === now.toDateString();

  const statusColor = {
    SCHEDULED: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  }[appointment.status] || "bg-gray-100 text-gray-800";

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h3 className="text-xl font-bold text-gray-900">
              {appointment.patientName}
            </h3>
            {isToday && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold">
                TODAY
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm mb-2">{appointment.patientEmail}</p>
          <p className="text-gray-700">
            <strong>Concern:</strong> {appointment.concern}
          </p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColor}`}>
          {appointment.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 pt-4 border-t border-gray-200">
        <div>
          <p className="text-gray-600 text-sm">Date & Time</p>
          <p className="font-semibold text-gray-900">
            {appointmentDate.toLocaleDateString()} {appointmentDate.toLocaleTimeString()}
          </p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Consultation Type</p>
          <p className="font-semibold text-gray-900">
            {appointment.consultationType}
          </p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Duration</p>
          <p className="font-semibold text-gray-900">30 minutes</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Status</p>
          <p className="font-semibold text-gray-900">
            {appointment.status}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {appointment.status === "CONFIRMED" && appointment.videoCallUrl && (
          <Button className="bg-green-600 hover:bg-green-700">
            Start Consultation
          </Button>
        )}
        {(appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED") && (
          <>
            <Button variant="outline">Reschedule</Button>
            <Button
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Cancel
            </Button>
          </>
        )}
        {appointment.status === "COMPLETED" && (
          <Button className="bg-purple-600 hover:bg-purple-700">
            Add Notes
          </Button>
        )}
        <Button variant="outline">View Patient</Button>
      </div>
    </Card>
  );
}
