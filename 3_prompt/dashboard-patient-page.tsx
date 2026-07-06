"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface PatientStats {
  upcomingAppointments: number;
  activePrescriptions: number;
  medicalReports: number;
  doctorRating: number;
}

export default function PatientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "PATIENT") {
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
      const response = await fetch("/api/patient/dashboard-stats");
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
            <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}!</h1>
            <p className="text-indigo-100">
              Here's your wellness journey at a glance
            </p>
          </div>
          <div className="text-6xl">💚</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Upcoming Appointments"
          value={stats?.upcomingAppointments || 0}
          icon="📅"
          color="bg-blue-50"
          accentColor="text-blue-600"
        />
        <StatCard
          title="Active Prescriptions"
          value={stats?.activePrescriptions || 0}
          icon="💊"
          color="bg-green-50"
          accentColor="text-green-600"
        />
        <StatCard
          title="Medical Reports"
          value={stats?.medicalReports || 0}
          icon="📋"
          color="bg-purple-50"
          accentColor="text-purple-600"
        />
        <StatCard
          title="Your Doctor Rating"
          value={`${stats?.doctorRating || 4.5}`}
          icon="⭐"
          color="bg-yellow-50"
          accentColor="text-yellow-600"
          isRating
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Appointment */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Next Appointment</h3>
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-gray-600 mb-4">
            You have no upcoming appointments scheduled
          </p>
          <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
            <Link href="/book-appointment">Book Appointment</Link>
          </Button>
        </Card>

        {/* Recent Prescriptions */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Active Prescriptions</h3>
            <span className="text-2xl">💊</span>
          </div>
          <p className="text-gray-600 mb-4">
            {stats?.activePrescriptions || 0} prescription(s) in progress
          </p>
          <Button
            asChild
            variant="outline"
            className="w-full"
          >
            <Link href="/dashboard/prescriptions">View All</Link>
          </Button>
        </Card>
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Health Timeline */}
        <Card className="p-6 md:col-span-2">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Health Timeline</h3>
          <div className="space-y-4">
            <TimelineItem
              date="Dec 15, 2024"
              title="Consultation with Dr. Smith"
              description="General wellness checkup"
              icon="👨‍⚕️"
            />
            <TimelineItem
              date="Dec 10, 2024"
              title="Lab Report Received"
              description="Blood work results available"
              icon="📊"
            />
            <TimelineItem
              date="Dec 5, 2024"
              title="Prescription Issued"
              description="New wellness regimen started"
              icon="💊"
            />
          </div>
          <Button
            asChild
            variant="outline"
            className="w-full mt-4"
          >
            <Link href="/dashboard/reports">View All Reports</Link>
          </Button>
        </Card>

        {/* Quick Links */}
        <Card className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Links</h3>
          <div className="space-y-3">
            <QuickLink
              href="/dashboard/profile"
              label="Edit Profile"
              icon="👤"
            />
            <QuickLink
              href="/dashboard/appointments"
              label="All Appointments"
              icon="📅"
            />
            <QuickLink
              href="/dashboard/prescriptions"
              label="Prescriptions"
              icon="💊"
            />
            <QuickLink
              href="/dashboard/reports"
              label="Medical Reports"
              icon="📋"
            />
            <QuickLink
              href="/services"
              label="Our Services"
              icon="🏥"
            />
          </div>
        </Card>
      </div>

      {/* Health Tips */}
      <Card className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Daily Wellness Tip</h3>
        <p className="text-gray-700 mb-4">
          💧 Stay hydrated! Drinking 8-10 glasses of water daily supports your immune system
          and helps maintain optimal wellness. Make it a habit!
        </p>
        <Button
          asChild
          variant="outline"
          className="border-emerald-300 hover:bg-emerald-50"
        >
          <Link href="/articles">Read More Wellness Tips</Link>
        </Button>
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

function TimelineItem({
  date,
  title,
  description,
  icon,
}: {
  date: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
      <div className="text-2xl flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-gray-500 font-medium">{date}</p>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function QuickLink({
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
