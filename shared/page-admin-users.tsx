"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading users");
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });

      if (!response.ok) throw new Error("Failed to deactivate user");
      fetchUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error deactivating user"
      );
    }
  };

  const handleActivate = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });

      if (!response.ok) throw new Error("Failed to activate user");
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error activating user");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            User Management
          </h1>
          <p className="text-gray-600">
            Manage all platform users and permissions
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-gray-700 font-medium mb-2 block">
                Search Users
              </label>
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-gray-700 font-medium mb-2 block">
                Filter by Role
              </label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="DOCTOR">Doctor</SelectItem>
                  <SelectItem value="PATIENT">Patient</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                Export Users
              </Button>
            </div>
          </div>
        </Card>

        {/* Users Count */}
        <div className="mb-6 text-gray-600">
          Found <strong>{filteredUsers.length}</strong> user(s)
        </div>

        {/* Users Table */}
        {filteredUsers.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500 text-lg">No users found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onDeactivate={handleDeactivate}
                onActivate={handleActivate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserCard({
  user,
  onDeactivate,
  onActivate,
}: {
  user: User;
  onDeactivate: (id: string) => void;
  onActivate: (id: string) => void;
}) {
  const createdDate = new Date(user.createdAt);
  const lastLoginDate = user.lastLogin ? new Date(user.lastLogin) : null;

  const roleColor = {
    ADMIN: "bg-red-100 text-red-800",
    DOCTOR: "bg-purple-100 text-purple-800",
    PATIENT: "bg-blue-100 text-blue-800",
  }[user.role] || "bg-gray-100 text-gray-800";

  const statusColor = user.isActive
    ? "bg-green-100 text-green-800"
    : "bg-red-100 text-red-800";

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
          <p className="text-gray-600 text-sm mb-3">{user.email}</p>
          <div className="flex gap-3 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColor}`}>
              {user.role}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}
            >
              {user.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pt-4 border-t border-gray-200 text-sm">
        <div>
          <span className="text-gray-600">Joined</span>
          <p className="font-semibold text-gray-900">
            {createdDate.toLocaleDateString()}
          </p>
        </div>
        <div>
          <span className="text-gray-600">Last Login</span>
          <p className="font-semibold text-gray-900">
            {lastLoginDate
              ? lastLoginDate.toLocaleDateString()
              : "Never"}
          </p>
        </div>
        <div>
          <span className="text-gray-600">Status</span>
          <p className={`font-semibold ${user.isActive ? "text-green-600" : "text-red-600"}`}>
            {user.isActive ? "● Active" : "● Inactive"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button variant="outline">View Details</Button>
        <Button variant="outline">Edit</Button>
        {user.isActive ? (
          <Button
            variant="outline"
            onClick={() => onDeactivate(user.id)}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            Deactivate
          </Button>
        ) : (
          <Button
            onClick={() => onActivate(user.id)}
            className="bg-green-600 hover:bg-green-700"
          >
            Activate
          </Button>
        )}
        <Button
          variant="outline"
          className="border-red-300 text-red-700 hover:bg-red-50"
        >
          Delete
        </Button>
      </div>
    </Card>
  );
}
