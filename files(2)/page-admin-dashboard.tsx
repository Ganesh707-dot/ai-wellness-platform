"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRequireRole } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface AdminStats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  platformRevenue: number;
  avgRating: number;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const { isLoading: authLoading } = useRequireRole("ADMIN");
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    platformRevenue: 0,
    avgRating: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/admin/dashboard");
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      const data = await response.json();
      setStats(data.stats);
      setRecentUsers(data.recentUsers || []);
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Admin Dashboard 🛡️
          </h1>
          <p className="text-gray-600">
            Monitor platform health and manage system resources
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <MetricCard
            icon="👥"
            title="Total Users"
            value={stats.totalUsers}
            color="blue"
          />
          <MetricCard
            icon="👨‍⚕️"
            title="Doctors"
            value={stats.totalDoctors}
            color="purple"
          />
          <MetricCard
            icon="🤝"
            title="Patients"
            value={stats.totalPatients}
            color="green"
          />
          <MetricCard
            icon="📅"
            title="Appointments"
            value={stats.totalAppointments}
            color="indigo"
          />
          <MetricCard
            icon="💰"
            title="Revenue"
            value={`$${stats.platformRevenue}`}
            color="yellow"
          />
          <MetricCard
            icon="⭐"
            title="Avg Rating"
            value={stats.avgRating.toFixed(1)}
            color="orange"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Quick Actions */}
          <div className="lg:col-span-2">
            {/* Admin Controls */}
            <Card className="p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Admin Controls
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AdminAction
                  href="/admin/users"
                  icon="👥"
                  title="Manage Users"
                  description="View and manage all users"
                />
                <AdminAction
                  href="/admin/content"
                  icon="📝"
                  title="Manage Content"
                  description="Edit articles and resources"
                />
                <AdminAction
                  href="/admin/appointments"
                  icon="📅"
                  title="Manage Appointments"
                  description="View all appointments"
                />
                <AdminAction
                  href="/admin/settings"
                  icon="⚙️"
                  title="System Settings"
                  description="Configure platform settings"
                />
                <AdminAction
                  href="/admin/doctors"
                  icon="🔍"
                  title="Doctor Verification"
                  description="Verify doctor credentials"
                />
                <AdminAction
                  href="/admin/analytics"
                  icon="📊"
                  title="Analytics"
                  description="Platform analytics and reports"
                />
              </div>
            </Card>

            {/* Platform Health */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Platform Health
              </h2>
              <div className="space-y-4">
                <HealthIndicator
                  name="Database Status"
                  status="Healthy"
                  percentage={99.9}
                />
                <HealthIndicator
                  name="API Response Time"
                  status="Good"
                  percentage={85}
                />
                <HealthIndicator
                  name="Server CPU"
                  status="Healthy"
                  percentage={45}
                />
                <HealthIndicator
                  name="Memory Usage"
                  status="Optimal"
                  percentage={62}
                />
              </div>
            </Card>
          </div>

          {/* Right Column - System Info */}
          <div>
            {/* Recent Activities */}
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Recent Users
              </h3>
              <div className="space-y-3">
                {recentUsers.slice(0, 5).map((user: any) => (
                  <RecentUserItem key={user.id} user={user} />
                ))}
              </div>
              <Link href="/admin/users">
                <Button variant="outline" className="w-full mt-4">
                  View All Users
                </Button>
              </Link>
            </Card>

            {/* System Status */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                System Status
              </h3>
              <div className="space-y-3">
                <StatusBadge label="API" status="Online" />
                <StatusBadge label="Database" status="Connected" />
                <StatusBadge label="Email Service" status="Active" />
                <StatusBadge label="File Storage" status="Active" />
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Appointments */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Recent Appointments
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-bold text-gray-900">
                    Patient
                  </th>
                  <th className="text-left py-3 px-4 font-bold text-gray-900">
                    Doctor
                  </th>
                  <th className="text-left py-3 px-4 font-bold text-gray-900">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 font-bold text-gray-900">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-bold text-gray-900">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 font-bold text-gray-900">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">Sarah Johnson</td>
                    <td className="py-3 px-4">Dr. Michael</td>
                    <td className="py-3 px-4">June 24, 2024</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                        Completed
                      </span>
                    </td>
                    <td className="py-3 px-4">Homeopathy</td>
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

function MetricCard({
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
    purple: "from-purple-50 to-purple-100",
    green: "from-green-50 to-green-100",
    indigo: "from-indigo-50 to-indigo-100",
    yellow: "from-yellow-50 to-yellow-100",
    orange: "from-orange-50 to-orange-100",
  }[color];

  const textColor = {
    blue: "text-blue-900",
    purple: "text-purple-900",
    green: "text-green-900",
    indigo: "text-indigo-900",
    yellow: "text-yellow-900",
    orange: "text-orange-900",
  }[color];

  return (
    <Card className={`p-4 bg-gradient-to-br ${bgColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-xs mb-1">{title}</p>
          <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </Card>
  );
}

function AdminAction({
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
      <div className="p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors cursor-pointer">
        <div className="text-3xl mb-2">{icon}</div>
        <h3 className="font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
}

function HealthIndicator({
  name,
  status,
  percentage,
}: {
  name: string;
  status: string;
  percentage: number;
}) {
  const statusColor = {
    Healthy: "text-green-600",
    Good: "text-blue-600",
    Optimal: "text-indigo-600",
  }[status] || "text-gray-600";

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="font-medium text-gray-900">{name}</span>
        <span className={`text-sm font-semibold ${statusColor}`}>{status}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function RecentUserItem({ user }: { user: any }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <div>
        <p className="font-semibold text-gray-900">{user.name}</p>
        <p className="text-xs text-gray-600">{user.email}</p>
      </div>
      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
        {user.role}
      </span>
    </div>
  );
}

function StatusBadge({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="text-gray-700 font-medium">{label}</span>
      <span className="text-green-600 font-semibold">● {status}</span>
    </div>
  );
}
