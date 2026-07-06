"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface AdminAppointment {
  id: string;
  patientName: string;
  doctorName: string;
  scheduledAt: string;
  status: string;
  consultationType: string;
  revenue: number;
}

export default function AdminAppointments() {
  const { status } = useSession();
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    revenue: 0,
    avgDuration: 0,
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetchAppointments();
    }
  }, [status]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/admin/appointments");
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments);
        setStats(data.stats);
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
        <p className="text-gray-600 mt-1">System-wide appointment management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Appointments"
          value={stats.total}
          icon="📅"
          color="bg-blue-50"
          accentColor="text-blue-600"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon="✅"
          color="bg-green-50"
          accentColor="text-green-600"
        />
        <StatCard
          title="Revenue"
          value={`$${stats.revenue}`}
          icon="💰"
          color="bg-purple-50"
          accentColor="text-purple-600"
        />
        <StatCard
          title="Avg Duration"
          value={`${stats.avgDuration} min`}
          icon="⏱️"
          color="bg-orange-50"
          accentColor="text-orange-600"
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Appointments</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAppointments} className="bg-indigo-600 hover:bg-indigo-700">
            Refresh
          </Button>
        </div>
      </Card>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No appointments found
          </h3>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Scheduled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAppointments.map((apt) => (
                  <AppointmentRow key={apt.id} appointment={apt} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  accentColor,
}: {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  accentColor: string;
}) {
  return (
    <Card className={`p-6 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <p className={`text-3xl font-bold ${accentColor}`}>{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </Card>
  );
}

function AppointmentRow({
  appointment,
}: {
  appointment: AdminAppointment;
}) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const appointmentDate = new Date(appointment.scheduledAt);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <p className="font-semibold text-gray-900">{appointment.patientName}</p>
      </td>
      <td className="px-6 py-4">
        <p className="font-semibold text-gray-900">{appointment.doctorName}</p>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm text-gray-600">{appointment.consultationType}</p>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm text-gray-600">
          {appointmentDate.toLocaleDateString()} {appointmentDate.toLocaleTimeString()}
        </p>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
            appointment.status
          )}`}
        >
          {appointment.status}
        </span>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm font-semibold text-gray-900">
          ${appointment.revenue}
        </p>
      </td>
      <td className="px-6 py-4">
        <Button variant="outline" size="sm">
          Details
        </Button>
      </td>
    </tr>
  );
}
