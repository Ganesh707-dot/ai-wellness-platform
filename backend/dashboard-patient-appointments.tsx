"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface Appointment {
  id: string;
  doctorName: string;
  consultationType: string;
  scheduledAt: string;
  status: string;
  concern: string;
}

export default function PatientAppointments() {
  const { status } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed" | "cancelled">("all");

  useEffect(() => {
    if (status === "authenticated") {
      fetchAppointments();
    }
  }, [status]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/patient/appointments");
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === "all") return true;
    return apt.status.toLowerCase() === filter.toLowerCase();
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600 mt-1">Manage your consultations</p>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
          <Link href="/book-appointment">Book New</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["all", "upcoming", "completed", "cancelled"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f as any)}
            className={filter === f ? "bg-indigo-600" : ""}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No {filter !== "all" ? filter : ""} appointments
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === "upcoming"
              ? "Schedule your first consultation with our wellness experts"
              : "You don't have any appointments yet"}
          </p>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
            <Link href="/book-appointment">Book Appointment</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => (
            <AppointmentCard key={apt.id} appointment={apt} />
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "📋";
      case "confirmed":
        return "✅";
      case "completed":
        return "✔️";
      case "cancelled":
        return "❌";
      default:
        return "❓";
    }
  };

  const appointmentDate = new Date(appointment.scheduledAt);

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="text-4xl">👨‍⚕️</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">
              {appointment.doctorName}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {appointment.consultationType}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Concern: {appointment.concern}
            </p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
            appointment.status
          )}`}
        >
          {getStatusIcon(appointment.status)} {appointment.status}
        </span>
      </div>

      <div className="flex items-center gap-6 mb-4 pt-4 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-500 font-medium">DATE & TIME</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            {appointmentDate.toLocaleDateString()} at{" "}
            {appointmentDate.toLocaleTimeString()}
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <Button variant="outline" className="flex-1">
          Reschedule
        </Button>
        {appointment.status.toLowerCase() === "scheduled" && (
          <Button
            variant="outline"
            className="flex-1 text-red-600 hover:bg-red-50"
          >
            Cancel
          </Button>
        )}
        <Button asChild className="flex-1 bg-indigo-600 hover:bg-indigo-700">
          <Link href={`/dashboard/appointments/${appointment.id}`}>
            View Details
          </Link>
        </Button>
      </div>
    </Card>
  );
}
