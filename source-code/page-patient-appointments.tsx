"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import Link from "next/link";

interface Appointment {
  id: string;
  doctorName: string;
  specialization: string;
  scheduledAt: string;
  status: string;
  concern: string;
  videoCallUrl?: string;
}

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, statusFilter]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/appointments");
      if (!response.ok) throw new Error("Failed to fetch appointments");
      const data = await response.json();
      setAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading appointments");
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    if (statusFilter === "all") {
      setFilteredAppointments(appointments);
    } else {
      setFilteredAppointments(
        appointments.filter(
          (apt) => apt.status.toLowerCase() === statusFilter.toLowerCase()
        )
      );
    }
  };

  const handleCancel = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to cancel appointment");
      setAppointments(appointments.filter((apt) => apt.id !== appointmentId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error cancelling appointment"
      );
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Appointments
            </h1>
            <p className="text-gray-600">
              Manage your consultations and appointments
            </p>
          </div>
          <Link href="/book-appointment">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Book New Appointment
            </Button>
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Filter */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-4">
            <label className="text-gray-700 font-medium">Filter by status:</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Appointments</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No appointments found</p>
            <Link href="/book-appointment">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Book Your First Appointment
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <AppointmentListItem
                key={appointment.id}
                appointment={appointment}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AppointmentListItem({
  appointment,
  onCancel,
}: {
  appointment: Appointment;
  onCancel: (id: string) => void;
}) {
  const appointmentDate = new Date(appointment.scheduledAt);
  const isPast = appointmentDate < new Date();
  const isCompleted = appointment.status === "COMPLETED";
  const isCancelled = appointment.status === "CANCELLED";

  const statusColor = {
    SCHEDULED: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    IN_PROGRESS: "bg-purple-100 text-purple-800",
  }[appointment.status] || "bg-gray-100 text-gray-800";

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            Dr. {appointment.doctorName}
          </h3>
          <p className="text-gray-600 text-sm mb-3">{appointment.specialization}</p>
          <p className="text-gray-700">
            <strong>Concern:</strong> {appointment.concern}
          </p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColor}`}>
          {appointment.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pt-4 border-t border-gray-200">
        <div>
          <p className="text-gray-600 text-sm">Date & Time</p>
          <p className="font-semibold text-gray-900">
            {appointmentDate.toLocaleDateString()} at{" "}
            {appointmentDate.toLocaleTimeString()}
          </p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Duration</p>
          <p className="font-semibold text-gray-900">30 minutes</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Consultation Type</p>
          <p className="font-semibold text-gray-900">Video Call</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {!isPast && !isCancelled && (
          <>
            {appointment.status === "CONFIRMED" && appointment.videoCallUrl && (
              <Button className="bg-green-600 hover:bg-green-700">
                Join Video Call
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onCancel(appointment.id)}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Cancel Appointment
            </Button>
          </>
        )}
        {isCompleted && (
          <>
            <Button variant="outline">View Report</Button>
            <Button variant="outline">Rate Doctor</Button>
          </>
        )}
        <Button variant="outline">View Details</Button>
      </div>
    </Card>
  );
}
