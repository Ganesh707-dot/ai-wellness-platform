"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRequireRole } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface DoctorStats {
  totalPatients: number;
  todayAppointments: number;
  completedConsultations: number;
  averageRating: number;
}

export default function DoctorDashboard() {
  const { data: session } = useSession();
  const { isLoading: authLoading } = useRequireRole("DOCTOR");
  const [stats, setStats] = useState<DoctorStats>({
    totalPatients: 0,
    todayAppointments: 0,
    completedConsultations: 0,
    averageRating: 0,
  });
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/doctor/dashboard");
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      const data = await response.json();
      setStats(data.stats);
      setAppointments(data.appointments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading data");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome, Dr. {session?.user?.name}! 👨‍⚕️
          </h1>
          <p className="text-gray-600">
            Manage your patients and consultations efficiently
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon="👥"
            title="Total Patients"
            value={stats.totalPatients}
            color="blue"
          />
          <StatCard
            icon="📅"
            title="Today's Appointments"
            value={stats.todayAppointments}
            color="green"
          />
          <StatCard
            icon="✅"
            title="Completed Consultations"
            value={stats.completedConsultations}
            color="purple"
          />
          <StatCard
            icon="⭐"
            title="Average Rating"
            value={stats.averageRating.toFixed(1)}
            color="yellow"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Actions & Appointments */}
          <div className="lg:col-span-2">
            {/* Quick Actions */}
            <Card className="p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ActionButton
                  href="/doctor/patients"
                  icon="👥"
                  title="View Patients"
                  description="Manage your patients"
                />
                <ActionButton
                  href="/doctor/appointments"
                  icon="📅"
                  title="My Appointments"
                  description="Check your schedule"
                />
                <ActionButton
                  href="/doctor/articles"
                  icon="📝"
                  title="Write Article"
                  description="Share health insights"
                />
                <ActionButton
                  href="/doctor/prescriptions"
                  icon="💊"
                  title="Issue Prescription"
                  description="Create prescriptions"
                />
              </div>
            </Card>

            {/* Today's Appointments */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Today's Appointments
                </h2>
                <Link href="/doctor/appointments">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>

              {appointments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No appointments today</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.slice(0, 3).map((apt: any) => (
                    <AppointmentCard key={apt.id} appointment={apt} />
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Info & Quick Links */}
          <div>
            {/* Profile Status */}
            <Card className="p-6 mb-6 bg-gradient-to-br from-purple-50 to-indigo-50">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Profile Status
              </h3>
              <div className="space-y-4">
                <StatusItem
                  label="Verification"
                  status="Verified"
                  color="green"
                />
                <StatusItem
                  label="License"
                  status="Active"
                  color="green"
                />
                <StatusItem
                  label="Availability"
                  status="Online"
                  color="green"
                />
              </div>
              <Link href="/doctor/settings">
                <Button variant="outline" className="w-full mt-6">
                  Manage Profile
                </Button>
              </Link>
            </Card>

            {/* Upcoming Features */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Resources
              </h3>
              <div className="space-y-3">
                <ResourceLink
                  icon="📚"
                  title="Knowledge Base"
                  description="Medical references"
                />
                <ResourceLink
                  icon="📊"
                  title="Analytics"
                  description="Your statistics"
                />
                <ResourceLink
                  icon="⚙️"
                  title="Settings"
                  description="Manage preferences"
                />
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Consultations */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Recent Consultations
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-bold text-gray-900">
                    Patient
                  </th>
                  <th className="text-left py-3 px-4 font-bold text-gray-900">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 font-bold text-gray-900">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 font-bold text-gray-900">
                    Duration
                  </th>
                  <th className="text-left py-3 px-4 font-bold text-gray-900">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-bold text-gray-900">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">Sarah Johnson</td>
                    <td className="py-3 px-4">June 24, 2024</td>
                    <td className="py-3 px-4">Homeopathy</td>
                    <td className="py-3 px-4">30 min</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                        Completed
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  color,
}: {
  icon: string;
  title: string;
  value: string | number;
  color: string;
}) {
  const bgColor = {
    blue: "from-blue-50 to-blue-100",
    green: "from-green-50 to-green-100",
    purple: "from-purple-50 to-purple-100",
    yellow: "from-yellow-50 to-yellow-100",
  }[color];

  const textColor = {
    blue: "text-blue-900",
    green: "text-green-900",
    purple: "text-purple-900",
    yellow: "text-yellow-900",
  }[color];

  return (
    <Card className={`p-6 bg-gradient-to-br ${bgColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-1">{title}</p>
          <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </Card>
  );
}

function ActionButton({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <div className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors cursor-pointer">
        <div className="text-3xl mb-2">{icon}</div>
        <h3 className="font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
}

function AppointmentCard({ appointment }: { appointment: any }) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-gray-900">{appointment.patientName}</h3>
          <p className="text-sm text-gray-600">{appointment.consultationType}</p>
        </div>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
          {appointment.status}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-3">📅 {appointment.time}</p>
      <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
        Join Consultation
      </Button>
    </div>
  );
}

function StatusItem({
  label,
  status,
  color,
}: {
  label: string;
  status: string;
  color: string;
}) {
  const statusColor = color === "green" ? "text-green-600" : "text-red-600";

  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-200">
      <span className="text-gray-700 font-medium">{label}</span>
      <span className={`font-semibold ${statusColor}`}>● {status}</span>
    </div>
  );
}

function ResourceLink({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-3 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors cursor-pointer">
      <div className="flex gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
}
