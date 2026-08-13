"use client";

import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { homeForRole } from "@/lib/rbac";

const DEMOS = [
  { email: "patient@test.com", role: "Patient", href: "/dashboard" },
  {
    email: "doctor@test.com",
    role: "Fresh clinician",
    href: "/doctor",
  },
  {
    email: "lead@test.com",
    role: "Clinical lead",
    href: "/doctor",
  },
  { email: "admin@test.com", role: "Admin · RBAC", href: "/admin/rbac" },
] as const;

function safeCallback(callbackUrl: string | null, role?: string | null) {
  if (!callbackUrl || !callbackUrl.startsWith("/")) return null;
  if (callbackUrl.startsWith("/unauthorized")) return null;
  // Don't send clinicians into patient portal via stale callback
  if (
    callbackUrl.startsWith("/dashboard") &&
    (role === "DOCTOR" || role === "CLINICAL_LEAD" || role === "ADMIN")
  ) {
    return null;
  }
  if (
    callbackUrl.startsWith("/doctor") &&
    role === "PATIENT"
  ) {
    return null;
  }
  if (
    callbackUrl.startsWith("/admin") &&
    role !== "ADMIN"
  ) {
    return null;
  }
  if (
    callbackUrl.startsWith("/docs/hand-on") &&
    role === "PATIENT"
  ) {
    return null;
  }
  return callbackUrl;
}

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "patient@test.com",
    password: "password123",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const email = formData.email.trim().toLowerCase();
      const result = await signIn("credentials", {
        email,
        password: formData.password,
        redirect: false,
      });

      if (!result || result.error) {
        setError(
          "Invalid email/password, or account is still Pending. Admin must activate + grant permissions first."
        );
        return;
      }

      const session = await getSession();
      const role = (session?.user as { role?: string } | undefined)?.role;
      const dest =
        safeCallback(params.get("callbackUrl"), role) ||
        homeForRole(role) ||
        "/";

      router.replace(dest);
      router.refresh();
    } catch {
      setError("Sign-in failed. Please retry.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,#d5ebe3,transparent_40%),radial-gradient(circle_at_80%_0%,#e8dcc8,transparent_35%)]" />
      <Card className="relative w-full max-w-md border-stone-200/80 bg-white/95 p-8 shadow-xl">
        <h1 className="font-serif text-3xl text-stone-900">Welcome back</h1>
        <p className="mt-2 text-sm text-stone-600">
          Enterprise RBAC workspaces — patient, clinician, lead, admin
        </p>
        {params.get("registered") === "true" && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
            Registration received as <strong>Pending</strong>. An admin must
            activate your account and grant permissions before sign-in works.
          </p>
        )}

        <div className="mt-4 grid gap-2">
          {DEMOS.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() =>
                setFormData({ email: d.email, password: "password123" })
              }
              className="rounded-lg border border-stone-200 bg-[#f6faf7] px-3 py-2 text-left text-xs text-stone-700 hover:border-teal-700/40"
            >
              <span className="font-semibold text-teal-900">{d.role}</span> —{" "}
              {d.email}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((s) => ({ ...s, email: e.target.value }))
              }
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData((s) => ({ ...s, password: e.target.value }))
              }
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-stone-500">
          New doctors must be <strong>Activated</strong> in Admin → Users (with
          permissions checked) before login works.
          <br />
          <Link href="/ai/concierge" className="text-teal-800 hover:underline">
            Or try Symptom Navigator without login
          </Link>
        </p>
      </Card>
    </div>
  );
}
