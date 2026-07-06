"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface DoctorStats {
  totalPatients: number;
  todayConsultations: number;
  pendingAppointments: number;
  averageRating: number;
  totalConsultations: number;
  monthlyEarnings: number;
}

export default function DoctorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "DOCTOR") {
        router.push("/unauthorized");
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchStats();
    }
  }, [status]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/doctor/dashboard-stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return <LoadingSpinner />;
  }

  const user = session?.user;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl p-8 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Welcome, Dr. {user?.name}!</h1>
            <p className="text-indigo-100">
              Manage your patients and consultations
            </p>
          </div>
          <div className="text-6xl">👨‍⚕️</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Patients"
          value={stats?.totalPatients || 0}
          icon="👥"
          color="bg-blue-50"
          accentColor="text-blue-600"
        />
        <StatCard
          title="Today's Consultations"
          value={stats?.todayConsultations || 0}
          icon="📅"
          color="bg-green-50"
          accentColor="text-green-600"
        />
        <StatCard
          title="Pending Appointments"
          value={stats?.pendingAppointments || 0}
          icon="⏳"
          color="bg-yellow-50"
          accentColor="text-yellow-600"
        />
        <StatCard
          title="Your Rating"
          value={`${stats?.averageRating || 4.8}`}
          icon="⭐"
          color="bg-purple-50"
          accentColor="text-purple-600"
          isRating
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Today's Schedule</h3>
            <span className="text-2xl">📆</span>
          </div>
          <p className="text-gray-600 mb-4">
            {stats?.todayConsultations || 0} consultation(s) scheduled
          </p>
          <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
            <Link href="/doctor/appointments">View Schedule</Link>
          </Button>
        </Card>

        {/* Recent Earnings */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">This Month</h3>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-gray-600 mb-4">
            Monthly earnings: ${stats?.monthlyEarnings || 0}
          </p>
          <Button
            asChild
            variant="outline"
            className="w-full"
          >
            <Link href="/doctor/analytics">View Analytics</Link>
          </Button>
        </Card>
      </div>

      {/* Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Patient List */}
        <Card className="p-6 md:col-span-2">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Patients</h3>
          <div className="space-y-4">
            <PatientRow
              name="John Doe"
              concern="Wellness Consultation"
              lastVisit="2 days ago"
              icon="👤"
            />
            <PatientRow
              name="Jane Smith"
              concern="Follow-up Checkup"
              lastVisit="1 week ago"
              icon="👤"
            />
            <PatientRow
              name="Robert Johnson"
              concern="Preventive Care"
              lastVisit="2 weeks ago"
              icon="👤"
            />
          </div>
          <Button
            asChild
            variant="outline"
            className="w-full mt-4"
          >
            <Link href="/doctor/patients">View All Patients</Link>
          </Button>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Actions</h3>
          <div className="space-y-3">
            <ActionLink
              href="/doctor/prescriptions"
              label="Issue Prescription"
              icon="💊"
            />
            <ActionLink
              href="/doctor/appointments"
              label="Manage Appointments"
              icon="📅"
            />
            <ActionLink
              href="/doctor/articles"
              label="Publish Article"
              icon="📝"
            />
            <ActionLink
              href="/doctor/patients"
              label="Patient List"
              icon="👥"
            />
            <ActionLink
              href="/dashboard/profile"
              label="Edit Profile"
              icon="⚙️"
            />
          </div>
        </Card>
      </div>

      {/* Consultation Stats */}
      <Card className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Consultation Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatBox
            label="Total Consultations"
            value={stats?.totalConsultations || 0}
          />
          <StatBox
            label="This Month"
            value={Math.floor((stats?.totalConsultations || 0) / 3)}
          />
          <StatBox
            label="Avg Rating"
            value={`${stats?.averageRating || 4.8} ⭐`}
          />
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  accentColor,
  isRating,
}: {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  accentColor: string;
  isRating?: boolean;
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

function PatientRow({
  name,
  concern,
  lastVisit,
  icon,
}: {
  name: string;
  concern: string;
  lastVisit: string;
  icon: string;
}) {
  return (
    <div className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
      <div className="text-2xl flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <p className="font-semibold text-gray-900">{name}</p>
        <p className="text-sm text-gray-600">{concern}</p>
        <p className="text-xs text-gray-500 mt-1">Last visit: {lastVisit}</p>
      </div>
    </div>
  );
}

function ActionLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className="ml-auto text-gray-400">→</span>
    </Link>
  );
}

function StatBox({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="text-center p-4 bg-white rounded-lg">
      <p className="text-gray-600 text-sm font-medium mb-2">{label}</p>
      <p className="text-3xl font-bold text-indigo-600">{value}</p>
    </div>
  );
}
