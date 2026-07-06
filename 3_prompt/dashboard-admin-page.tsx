"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface AdminStats {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  pendingVerification: number;
  systemHealth: number;
  monthlyRevenue: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "ADMIN") {
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
      const response = await fetch("/api/admin/dashboard-stats");
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
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-indigo-100">
              System administration and platform monitoring
            </p>
          </div>
          <div className="text-6xl">⚙️</div>
        </div>
      </div>

      {/* Critical Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon="👥"
          color="bg-blue-50"
          accentColor="text-blue-600"
        />
        <StatCard
          title="Total Doctors"
          value={stats?.totalDoctors || 0}
          icon="👨‍⚕️"
          color="bg-green-50"
          accentColor="text-green-600"
        />
        <StatCard
          title="Pending Verification"
          value={stats?.pendingVerification || 0}
          icon="⏳"
          color="bg-yellow-50"
          accentColor="text-yellow-600"
          highlight={stats?.pendingVerification || 0 > 0}
        />
        <StatCard
          title="System Health"
          value={`${stats?.systemHealth || 100}%`}
          icon="❤️"
          color="bg-red-50"
          accentColor="text-red-600"
        />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <OverviewCard
          title="Total Appointments"
          value={stats?.totalAppointments || 0}
          trend="↑ 12% from last month"
          color="bg-gradient-to-br from-purple-50 to-purple-100"
          icon="📅"
        />
        <OverviewCard
          title="Monthly Revenue"
          value={`$${stats?.monthlyRevenue || 0}`}
          trend="↑ 8% from last month"
          color="bg-gradient-to-br from-green-50 to-green-100"
          icon="💰"
        />
        <OverviewCard
          title="Total Patients"
          value={stats?.totalPatients || 0}
          trend="↑ 5% growth"
          color="bg-gradient-to-br from-blue-50 to-blue-100"
          icon="👤"
        />
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Management */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">User Management</h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage users and permissions
              </p>
            </div>
            <span className="text-3xl">👥</span>
          </div>

          <div className="space-y-3 mb-6">
            <ManagementLink label="All Users" href="/admin/users" />
            <ManagementLink label="Verify Doctors" href="/admin/users?filter=pending" />
            <ManagementLink label="Suspend Users" href="/admin/users?filter=suspended" />
          </div>

          <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
            <Link href="/admin/users">Go to Users</Link>
          </Button>
        </Card>

        {/* Content Management */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Content Management</h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage articles and resources
              </p>
            </div>
            <span className="text-3xl">📝</span>
          </div>

          <div className="space-y-3 mb-6">
            <ManagementLink label="Articles" href="/admin/content/articles" />
            <ManagementLink label="Testimonials" href="/admin/content/testimonials" />
            <ManagementLink label="Categories" href="/admin/content/categories" />
          </div>

          <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
            <Link href="/admin/content">Go to Content</Link>
          </Button>
        </Card>

        {/* Appointments */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Appointments</h3>
              <p className="text-sm text-gray-600 mt-1">
                Monitor all consultations
              </p>
            </div>
            <span className="text-3xl">📅</span>
          </div>

          <div className="space-y-3 mb-6">
            <ManagementLink label="All Appointments" href="/admin/appointments" />
            <ManagementLink label="Issues & Disputes" href="/admin/appointments?filter=issues" />
            <ManagementLink label="Analytics" href="/admin/appointments/analytics" />
          </div>

          <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
            <Link href="/admin/appointments">Go to Appointments</Link>
          </Button>
        </Card>

        {/* System Settings */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Settings</h3>
              <p className="text-sm text-gray-600 mt-1">
                System configuration
              </p>
            </div>
            <span className="text-3xl">⚙️</span>
          </div>

          <div className="space-y-3 mb-6">
            <ManagementLink label="System Settings" href="/admin/settings" />
            <ManagementLink label="Email Configuration" href="/admin/settings/email" />
            <ManagementLink label="Audit Logs" href="/admin/settings/audit-logs" />
          </div>

          <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
            <Link href="/admin/settings">Go to Settings</Link>
          </Button>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
        <div className="space-y-4">
          <ActivityItem
            action="New doctor registration"
            user="Dr. Sarah Johnson"
            time="2 hours ago"
            icon="✨"
          />
          <ActivityItem
            action="User account suspended"
            user="user_id_12345"
            time="4 hours ago"
            icon="⛔"
          />
          <ActivityItem
            action="Article published"
            user="Dr. Michael Brown"
            time="6 hours ago"
            icon="📝"
          />
          <ActivityItem
            action="New appointment scheduled"
            user="John Doe"
            time="8 hours ago"
            icon="📅"
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
  highlight,
}: {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  accentColor: string;
  highlight?: boolean;
}) {
  return (
    <Card className={`p-6 ${color} ${highlight ? "ring-2 ring-yellow-400" : ""}`}>
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

function OverviewCard({
  title,
  value,
  trend,
  color,
  icon,
}: {
  title: string;
  value: number | string;
  trend: string;
  color: string;
  icon: string;
}) {
  return (
    <Card className={`p-6 ${color}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="text-4xl font-bold text-gray-900 mb-2">{value}</p>
      <p className="text-sm text-gray-600">{trend}</p>
    </Card>
  );
}

function ManagementLink({
  label,
  href,
}: {
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center p-2 rounded hover:bg-gray-100 transition-colors"
    >
      <span className="text-sm font-medium text-indigo-600">{label}</span>
      <span className="ml-auto text-gray-400">→</span>
    </Link>
  );
}

function ActivityItem({
  action,
  user,
  time,
  icon,
}: {
  action: string;
  user: string;
  time: string;
  icon: string;
}) {
  return (
    <div className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
      <div className="text-2xl flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <p className="font-semibold text-gray-900">{action}</p>
        <p className="text-sm text-gray-600">{user}</p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
}
