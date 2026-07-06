"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRequireRole } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface AppointmentStats {
  upcoming: number;
  completed: number;
  cancelled: number;
}

interface HealthData {
  age?: number;
  gender?: string;
  medicalHistory?: string;
  lastConsultation?: string;
}

export default function PatientDashboard() {
  const { data: session, status } = useSession();
  const { isLoading: authLoading } = useRequireRole("PATIENT");
  const [stats, setStats] = useState<AppointmentStats>({
    upcoming: 0,
    completed: 0,
    cancelled: 0,
  });
  const [healthData, setHealthData] = useState<HealthData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard/patient/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data.appointmentStats || {});
      setHealthData(data.healthData || {});
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {session?.user?.name}! 👋
          </h1>
          <p className="text-gray-600">
            Manage your health and wellness journey in one place.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon="📅"
            title="Upcoming Appointments"
            value={stats.upcoming}
            color="blue"
            link="/dashboard/appointments?status=upcoming"
          />
          <StatCard
            icon="✅"
            title="Completed Consultations"
            value={stats.completed}
            color="green"
            link="/dashboard/appointments?status=completed"
          />
          <StatCard
            icon="💊"
            title="Active Prescriptions"
            value={0}
            color="purple"
            link="/dashboard/prescriptions"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Key Actions */}
          <div className="lg:col-span-2">
            <Card className="p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ActionButton
                  href="/book-appointment"
                  icon="📋"
                  title="Book Appointment"
                  description="Schedule with a specialist"
                />
                <ActionButton
                  href="/dashboard/prescriptions"
                  icon="💊"
                  title="View Prescriptions"
                  description="Check your medicines"
                />
                <ActionButton
                  href="/dashboard/reports"
                  icon="📄"
                  title="Medical Reports"
                  description="Access your reports"
                />
                <ActionButton
                  href="/dashboard/profile"
                  icon="👤"
                  title="Edit Profile"
                  description="Update your information"
                />
              </div>
            </Card>

            {/* Upcoming Appointments */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Upcoming Appointments
                </h2>
                <Link href="/dashboard/appointments">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>

              {stats.upcoming === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">
                    No upcoming appointments scheduled
                  </p>
                  <Link href="/book-appointment">
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      Book Your First Appointment
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <AppointmentCard />
                  <AppointmentCard />
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Health Info */}
          <div>
            <Card className="p-6 mb-6 bg-gradient-to-br from-indigo-50 to-blue-50">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Your Health Profile
              </h3>
              <div className="space-y-4">
                <ProfileItem
                  label="Age"
                  value={healthData.age ? `${healthData.age} years` : "Not set"}
                />
                <ProfileItem
                  label="Gender"
                  value={healthData.gender || "Not set"}
                />
                <ProfileItem
                  label="Last Consultation"
                  value={healthData.lastConsultation || "No consultations"}
                />
              </div>
              <Link href="/dashboard/profile">
                <Button
                  variant="outline"
                  className="w-full mt-6"
                >
                  Complete Your Profile
                </Button>
              </Link>
            </Card>

            {/* Wellness Tips */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Wellness Tips 💡
              </h3>
              <div className="space-y-3 text-sm">
                <TipItem text="Stay hydrated - drink 8-10 glasses daily" />
                <TipItem text="Get 7-8 hours of quality sleep" />
                <TipItem text="Exercise for 30 minutes daily" />
                <TipItem text="Manage stress with meditation" />
              </div>
            </Card>
          </div>
        </div>

        {/* Health Articles Section */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Health Articles & Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ArticleCard
              title="Understanding Homeopathy"
              excerpt="Learn the basics of homeopathic treatment..."
              category="Education"
            />
            <ArticleCard
              title="Women's Wellness Guide"
              excerpt="Complete guide to women's health and wellness..."
              category="Women's Health"
            />
            <ArticleCard
              title="Fertility Planning"
              excerpt="Everything you need to know about fertility..."
              category="Fertility"
            />
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
  link,
}: {
  icon: string;
  title: string;
  value: number;
  color: string;
  link: string;
}) {
  const bgColor = {
    blue: "from-blue-50 to-blue-100",
    green: "from-green-50 to-green-100",
    purple: "from-purple-50 to-purple-100",
  }[color];

  const textColor = {
    blue: "text-blue-900",
    green: "text-green-900",
    purple: "text-purple-900",
  }[color];

  return (
    <Link href={link}>
      <Card className={`p-6 bg-gradient-to-br ${bgColor} cursor-pointer hover:shadow-lg transition-shadow`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm mb-1">{title}</p>
            <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
          </div>
          <span className="text-4xl">{icon}</span>
        </div>
      </Card>
    </Link>
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
      <div className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors cursor-pointer">
        <div className="text-3xl mb-2">{icon}</div>
        <h3 className="font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
}

function AppointmentCard() {
  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-gray-900">
            Consultation with Dr. Sarah
          </h3>
          <p className="text-sm text-gray-600">Homeopathy Specialist</p>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
          Confirmed
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
        <span>📅 June 25, 2024 at 2:00 PM</span>
        <Button size="sm" variant="outline">
          Join Call
        </Button>
      </div>
    </div>
  );
}

function ProfileItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-200">
      <span className="text-gray-600 text-sm">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function TipItem({ text }: { text: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-indigo-600">✓</span>
      <span className="text-gray-700">{text}</span>
    </div>
  );
}

function ArticleCard({
  title,
  excerpt,
  category,
}: {
  title: string;
  excerpt: string;
  category: string;
}) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="mb-3">
        <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold">
          {category}
        </span>
      </div>
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{excerpt}</p>
      <Button variant="outline" size="sm">
        Read More
      </Button>
    </Card>
  );
}
