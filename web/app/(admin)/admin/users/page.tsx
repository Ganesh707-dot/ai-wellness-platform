"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { RoleShell } from "@/components/layout/role-shell";

type Role = "PATIENT" | "DOCTOR" | "CLINICAL_LEAD" | "ADMIN";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive?: boolean;
  accessStatus?: "pending" | "active" | "suspended";
  grantedPermissions?: string[];
  doctorId?: string;
}

type PermMeta = {
  id: string;
  label: string;
  domain: string;
  description: string;
};

type DoctorPanel = {
  id: string;
  name: string;
  specialization: string;
  label: string;
  source?: string;
};

const DEFAULT_SPECIALTIES = [
  "HOMEOPATHY",
  "PEDIATRICS",
  "FERTILITY",
  "WOMENS_WELLNESS",
  "EMOTIONAL_WELLNESS",
  "FAMILY_WELLNESS",
  "PREVENTIVE_CARE",
];

function prettySpec(s: string) {
  return s.replaceAll("_", " ");
}

export default function AdminUsersPage() {
  const { status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [presets, setPresets] = useState<Record<string, PermMeta[]>>({});
  const [doctorPanels, setDoctorPanels] = useState<DoctorPanel[]>([]);
  const [specialties, setSpecialties] = useState<string[]>(DEFAULT_SPECIALTIES);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "PATIENT" as Role,
    password: "password123",
    specialization: "HOMEOPATHY",
    panelMode: "create" as "create" | "link",
    doctorId: "",
  });

  const [approving, setApproving] = useState<AdminUser | null>(null);
  const [approveRole, setApproveRole] = useState<Role>("DOCTOR");
  const [approveSpecialization, setApproveSpecialization] =
    useState("HOMEOPATHY");
  const [approvePanelMode, setApprovePanelMode] = useState<"create" | "link">(
    "link"
  );
  const [approveDoctorId, setApproveDoctorId] = useState("");
  const [useFullAccess, setUseFullAccess] = useState(true);
  const [showAdvancedPerms, setShowAdvancedPerms] = useState(false);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    role: "PATIENT" as Role,
    password: "",
    specialization: "HOMEOPATHY",
    panelMode: "link" as "create" | "link",
    doctorId: "",
    useFullAccess: true,
  });

  const load = () => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(Array.isArray(data.users) ? data.users : []);
        setPresets(data.rolePermissionPresets || {});
        setDoctorPanels(
          Array.isArray(data.doctorPanels) ? data.doctorPanels : []
        );
        if (Array.isArray(data.specialties) && data.specialties.length) {
          setSpecialties(data.specialties);
        }
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    load();
  }, [status]);

  useEffect(() => {
    if (!approving) return;
    setSelectedPerms((presets[approveRole] || []).map((p) => p.id));
  }, [approveRole, presets, approving]);

  const panelsBySpecialty = useMemo(() => {
    const map = new Map<string, DoctorPanel[]>();
    for (const p of doctorPanels) {
      const key = p.specialization || "OTHER";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [doctorPanels]);

  const panelMeta = (id?: string) =>
    doctorPanels.find((p) => p.id === id) || null;

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return users.filter((u) => {
      const st = u.accessStatus || (u.isActive ? "active" : "pending");
      const statusOk =
        statusFilter === "all" ||
        st === statusFilter ||
        (statusFilter === "pending" && !u.isActive && st !== "suspended");
      const panel = panelMeta(u.doctorId);
      const textOk =
        !q ||
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.role || "").toLowerCase().includes(q) ||
        (panel?.specialization || "").toLowerCase().includes(q);
      return statusOk && textOk;
    });
  }, [users, searchTerm, statusFilter, doctorPanels]);

  const pendingCount = users.filter(
    (u) => !u.isActive || u.accessStatus === "pending"
  ).length;

  const openApprove = (u: AdminUser) => {
    const role =
      u.role === "PATIENT" && (!u.isActive || u.accessStatus === "pending")
        ? "DOCTOR"
        : u.role || "DOCTOR";
    const panel = panelMeta(u.doctorId);
    setApproving(u);
    setEditing(null);
    setApproveRole(role);
    setApproveSpecialization(panel?.specialization || "HOMEOPATHY");
    setApprovePanelMode(u.doctorId || doctorPanels.length ? "link" : "create");
    setApproveDoctorId(u.doctorId || "");
    setUseFullAccess(true);
    setShowAdvancedPerms(false);
    setSelectedPerms((presets[role] || []).map((p) => p.id));
    setError(null);
    setMessage(null);
  };

  const openEdit = (u: AdminUser) => {
    const panel = panelMeta(u.doctorId);
    setEditing(u);
    setApproving(null);
    setEditForm({
      name: u.name,
      role: u.role,
      password: "",
      specialization: panel?.specialization || "HOMEOPATHY",
      panelMode: "link",
      doctorId: u.doctorId || "",
      useFullAccess: true,
    });
    setError(null);
    setMessage(null);
  };

  const createUser = () => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const isClinician =
        form.role === "DOCTOR" || form.role === "CLINICAL_LEAD";
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          role: form.role,
          password: form.password,
          specialization: isClinician ? form.specialization : undefined,
          createPanel: isClinician ? form.panelMode === "create" : undefined,
          doctorId:
            isClinician && form.panelMode === "link"
              ? form.doctorId || undefined
              : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Could not create user");
        return;
      }
      setMessage(data.message || "Created");
      setForm({
        name: "",
        email: "",
        role: "PATIENT",
        password: "password123",
        specialization: "HOMEOPATHY",
        panelMode: "create",
        doctorId: "",
      });
      setStatusFilter("pending");
      load();
    });
  };

  const activateUser = () => {
    if (!approving) return;
    setError(null);
    const isClinician =
      approveRole === "DOCTOR" || approveRole === "CLINICAL_LEAD";
    if (isClinician && approvePanelMode === "link" && !approveDoctorId) {
      setError(
        "Step 2: choose which specialty panel this doctor should use (e.g. Ananya Pandey), or switch to Create new panel."
      );
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: approving.id,
          activate: true,
          role: approveRole,
          useFullRoleAccess: useFullAccess,
          permissions: useFullAccess ? undefined : selectedPerms,
          specialization: isClinician ? approveSpecialization : undefined,
          createPanel: isClinician
            ? approvePanelMode === "create"
            : undefined,
          doctorId:
            isClinician && approvePanelMode === "link"
              ? approveDoctorId || undefined
              : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Activation failed");
        return;
      }
      setMessage(
        `${data.message || "User activated"} Tell them to sign out → sign in.`
      );
      setApproving(null);
      load();
    });
  };

  const saveEdit = () => {
    if (!editing) return;
    setError(null);
    const isClinician =
      editForm.role === "DOCTOR" || editForm.role === "CLINICAL_LEAD";
    if (isClinician && editForm.panelMode === "link" && !editForm.doctorId) {
      setError(
        "Choose an existing panel to link (e.g. Ananya Pandey). Linking does not rename that panel."
      );
      return;
    }
    startTransition(async () => {
      const body: Record<string, unknown> = {
        id: editing.id,
        name: editForm.name,
        role: editForm.role,
        specialization: isClinician ? editForm.specialization : undefined,
        createPanel: isClinician ? editForm.panelMode === "create" : undefined,
        doctorId: isClinician
          ? editForm.panelMode === "link"
            ? editForm.doctorId
            : undefined
          : null,
      };
      if (editForm.password.trim()) body.password = editForm.password.trim();
      if (editForm.useFullAccess) {
        body.grantedPermissions = (presets[editForm.role] || []).map(
          (p) => p.id
        );
      }

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Update failed");
        return;
      }
      setMessage(
        `${data.message || "Saved"} Important: that user must sign out and sign in again so the new panel/permissions apply.`
      );
      setEditing(null);
      load();
    });
  };

  const suspendUser = (u: AdminUser) => {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: u.id,
          isActive: false,
          accessStatus: "suspended",
          grantedPermissions: [],
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Suspend failed");
        return;
      }
      load();
    });
  };

  const togglePerm = (id: string) => {
    setSelectedPerms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const approvePerms = presets[approveRole] || [];

  return (
    <RoleShell role="ADMIN" title="User administration">
      <p className="mb-5 text-sm text-stone-600">
        Clinicians need a <strong>specialty panel</strong> (e.g. Homeopathy) so
        patients can book them. Create a new panel under a specialty, or link an
        existing one — then activate the account.
      </p>

      <Card className="mb-6 space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-800">
            Provision user
          </p>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900">
            Creates as Pending
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label>Full name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 bg-white"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              className="mt-1 bg-white"
            />
          </div>
          <div>
            <Label>Role</Label>
            <select
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({ ...f, role: e.target.value as Role }))
              }
              className="mt-1 flex h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm"
            >
              <option value="PATIENT">PATIENT</option>
              <option value="DOCTOR">DOCTOR</option>
              <option value="CLINICAL_LEAD">CLINICAL_LEAD</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div>
            <Label>Temp password</Label>
            <Input
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              className="mt-1 bg-white"
            />
          </div>
        </div>

        {(form.role === "DOCTOR" || form.role === "CLINICAL_LEAD") && (
          <ClinicianPanelFields
            specialties={specialties}
            panelsBySpecialty={panelsBySpecialty}
            specialization={form.specialization}
            panelMode={form.panelMode}
            doctorId={form.doctorId}
            onSpecialization={(v) =>
              setForm((f) => ({ ...f, specialization: v }))
            }
            onPanelMode={(v) => setForm((f) => ({ ...f, panelMode: v }))}
            onDoctorId={(id, panel) =>
              setForm((f) => ({
                ...f,
                doctorId: id,
                specialization: panel?.specialization || f.specialization,
              }))
            }
          />
        )}

        <Button
          onClick={createUser}
          disabled={pending || !form.name.trim() || !form.email.trim()}
        >
          {pending ? "Saving…" : "Create pending user"}
        </Button>
      </Card>

      {message && (
        <p className="mb-4 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search name, email, role, specialty…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md bg-white"
        />
        <div className="flex flex-wrap gap-2">
          {[
            ["pending", `Pending (${pendingCount})`],
            ["active", "Active"],
            ["suspended", "Suspended"],
            ["all", "All"],
          ].map(([id, label]) => (
            <Button
              key={id}
              size="sm"
              variant={statusFilter === id ? "default" : "outline"}
              onClick={() => setStatusFilter(id)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.map((u) => {
          const st = u.accessStatus || (u.isActive ? "active" : "pending");
          const panel = panelMeta(u.doctorId);
          return (
            <Card
              key={u.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-stone-900">{u.name}</p>
                <p className="text-sm text-stone-600">{u.email}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {u.role}
                  {panel ? (
                    <>
                      {" "}
                      ·{" "}
                      <span className="font-semibold text-teal-800">
                        {prettySpec(panel.specialization)}
                      </span>{" "}
                      · {panel.name}
                    </>
                  ) : u.doctorId ? (
                    <> · panel {u.doctorId}</>
                  ) : null}
                  {" · "}
                  {(u.grantedPermissions || []).length} perms
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    st === "active"
                      ? "bg-teal-50 text-teal-900"
                      : st === "suspended"
                        ? "bg-stone-100 text-stone-600"
                        : "bg-amber-50 text-amber-900"
                  }`}
                >
                  {st === "active"
                    ? "Active"
                    : st === "suspended"
                      ? "Suspended"
                      : "Pending"}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEdit(u)}
                  disabled={pending}
                >
                  Edit / change panel
                </Button>
                {(st === "pending" || !u.isActive) && st !== "suspended" && (
                  <Button
                    size="sm"
                    onClick={() => openApprove(u)}
                    disabled={pending}
                  >
                    Activate &amp; grant access
                  </Button>
                )}
                {st === "suspended" && (
                  <Button
                    size="sm"
                    onClick={() => openApprove(u)}
                    disabled={pending}
                  >
                    Re-activate &amp; grant access
                  </Button>
                )}
                {st === "active" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => openApprove(u)}
                      disabled={pending}
                    >
                      Manage access
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => suspendUser(u)}
                    >
                      Suspend
                    </Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="p-8 text-center text-sm text-stone-500">
            No users in this filter.
          </Card>
        )}
      </div>

      {/* Modal: edit — does not push/cover the list layout */}
      {editing && (
        <ModalShell
          title="Edit user"
          subtitle={editing.email}
          onClose={() => setEditing(null)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Full name</Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
                className="mt-1 bg-white"
              />
            </div>
            <div>
              <Label>Role</Label>
              <select
                value={editForm.role}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    role: e.target.value as Role,
                  }))
                }
                className="mt-1 flex h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm"
              >
                <option value="PATIENT">PATIENT</option>
                <option value="DOCTOR">DOCTOR</option>
                <option value="CLINICAL_LEAD">CLINICAL_LEAD</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label>New password (optional)</Label>
              <Input
                type="text"
                placeholder="Leave blank to keep current"
                value={editForm.password}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, password: e.target.value }))
                }
                className="mt-1 bg-white"
              />
            </div>
          </div>
          {(editForm.role === "DOCTOR" ||
            editForm.role === "CLINICAL_LEAD") && (
            <div className="mt-4">
              <ClinicianPanelFields
                specialties={specialties}
                panelsBySpecialty={panelsBySpecialty}
                specialization={editForm.specialization}
                panelMode={editForm.panelMode}
                doctorId={editForm.doctorId}
                onSpecialization={(v) =>
                  setEditForm((f) => ({ ...f, specialization: v }))
                }
                onPanelMode={(v) =>
                  setEditForm((f) => ({ ...f, panelMode: v }))
                }
                onDoctorId={(id, panel) =>
                  setEditForm((f) => ({
                    ...f,
                    doctorId: id,
                    specialization:
                      panel?.specialization || f.specialization,
                  }))
                }
              />
            </div>
          )}
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-teal-50 px-3 py-3 text-sm text-teal-950 ring-1 ring-teal-900/10">
            <input
              type="checkbox"
              className="mt-1"
              checked={editForm.useFullAccess}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  useFullAccess: e.target.checked,
                }))
              }
            />
            <span>
              <span className="font-semibold">
                Also grant full {editForm.role} access
              </span>
              <span className="mt-0.5 block text-xs text-teal-900/80">
                Fixes “Access Denied” by giving portal + role permissions.
                User must sign in again afterward.
              </span>
            </span>
          </label>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={saveEdit}
              disabled={pending || !editForm.name.trim()}
            >
              {pending ? "Saving…" : "Save panel & access"}
            </Button>
          </div>
        </ModalShell>
      )}

      {approving && (
        <ModalShell
          title={
            approving.isActive && approving.accessStatus !== "pending"
              ? "Manage access"
              : "Activate & grant access"
          }
          subtitle={`${approving.name} · ${approving.email}`}
          onClose={() => setApproving(null)}
        >
          <div className="space-y-5">
            <ol className="space-y-4 text-sm">
              <li className="rounded-xl border border-stone-200 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800">
                  Step 1 · Role
                </p>
                <p className="mt-1 text-xs text-stone-600">
                  DOCTOR opens the clinician portal. PATIENT opens the patient
                  dashboard.
                </p>
                <select
                  value={approveRole}
                  onChange={(e) => setApproveRole(e.target.value as Role)}
                  className="mt-2 flex h-10 w-full max-w-xs rounded-md border border-stone-300 bg-white px-3 text-sm font-medium"
                >
                  <option value="DOCTOR">DOCTOR (clinician portal)</option>
                  <option value="CLINICAL_LEAD">
                    CLINICAL_LEAD (clinic-wide)
                  </option>
                  <option value="PATIENT">PATIENT</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </li>

              {(approveRole === "DOCTOR" ||
                approveRole === "CLINICAL_LEAD") && (
                <li className="rounded-xl border border-stone-200 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800">
                    Step 2 · Specialty panel
                  </p>
                  <p className="mt-1 text-xs text-stone-600">
                    To switch from Ganesh → Ananya Pandey: choose{" "}
                    <strong>Link existing panel</strong>, then pick Ananya in
                    the list. Do not use “Create new” unless you want a brand
                    new bookable name.
                  </p>
                  <div className="mt-2">
                    <ClinicianPanelFields
                      specialties={specialties}
                      panelsBySpecialty={panelsBySpecialty}
                      specialization={approveSpecialization}
                      panelMode={approvePanelMode}
                      doctorId={approveDoctorId}
                      onSpecialization={setApproveSpecialization}
                      onPanelMode={setApprovePanelMode}
                      onDoctorId={(id, panel) => {
                        setApproveDoctorId(id);
                        if (panel?.specialization) {
                          setApproveSpecialization(panel.specialization);
                        }
                      }}
                    />
                  </div>
                </li>
              )}

              <li className="rounded-xl border border-teal-200 bg-teal-50/60 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800">
                  Step 3 · Permissions
                </p>
                <label className="mt-2 flex cursor-pointer items-start gap-3 text-sm text-teal-950">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={useFullAccess}
                    onChange={(e) => {
                      setUseFullAccess(e.target.checked);
                      if (e.target.checked) {
                        setSelectedPerms(
                          approvePerms.map((p) => p.id)
                        );
                        setShowAdvancedPerms(false);
                      }
                    }}
                  />
                  <span>
                    <span className="font-semibold">
                      Full {approveRole} access (recommended)
                    </span>
                    <span className="mt-0.5 block text-xs text-teal-900/80">
                      One click — includes portal access so they no longer see
                      “Access Denied”. No need to tick individual boxes.
                    </span>
                  </span>
                </label>
                <button
                  type="button"
                  className="mt-2 text-xs font-medium text-teal-900 underline"
                  onClick={() => {
                    setShowAdvancedPerms((v) => !v);
                    if (!showAdvancedPerms) setUseFullAccess(false);
                  }}
                >
                  {showAdvancedPerms
                    ? "Hide custom permissions"
                    : "Customize permissions (advanced)"}
                </button>
                {showAdvancedPerms && (
                  <div className="mt-3 grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2">
                    {approvePerms.map((p) => (
                      <label
                        key={p.id}
                        className="flex cursor-pointer gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPerms.includes(p.id)}
                          onChange={() => togglePerm(p.id)}
                          className="mt-0.5"
                        />
                        <span>
                          <span className="font-mono text-[11px] text-teal-900">
                            {p.id}
                          </span>
                          <span className="mt-0.5 block text-stone-600">
                            {p.label}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </li>
            </ol>

            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950 ring-1 ring-amber-200">
              After you save: the user must <strong>sign out and sign in
              again</strong>. Permissions live in the login session.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setApproving(null)}>
                Cancel
              </Button>
              <Button
                onClick={activateUser}
                disabled={
                  pending ||
                  (!useFullAccess && selectedPerms.length === 0)
                }
              >
                {pending
                  ? "Saving…"
                  : approving.isActive
                    ? "Save access"
                    : "Activate with access"}
              </Button>
            </div>
          </div>
        </ModalShell>
      )}
    </RoleShell>
  );
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-800">
              {title}
            </p>
            {subtitle && (
              <p className="mt-1 text-sm font-medium text-stone-900">
                {subtitle}
              </p>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ClinicianPanelFields({
  specialties,
  panelsBySpecialty,
  specialization,
  panelMode,
  doctorId,
  onSpecialization,
  onPanelMode,
  onDoctorId,
}: {
  specialties: string[];
  panelsBySpecialty: [string, DoctorPanel[]][];
  specialization: string;
  panelMode: "create" | "link";
  doctorId: string;
  onSpecialization: (v: string) => void;
  onPanelMode: (v: "create" | "link") => void;
  onDoctorId: (id: string, panel?: DoctorPanel) => void;
}) {
  const allPanels = panelsBySpecialty.flatMap(([, panels]) => panels);
  const selected = allPanels.find((p) => p.id === doctorId);

  return (
    <div className="rounded-2xl bg-[#f3f7f4] p-4 ring-1 ring-teal-900/10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-800">
        Which bookable doctor name?
      </p>
      <p className="mt-1 text-xs text-stone-600">
        Patients see this name when booking. Changing the login user’s display
        name does <strong>not</strong> rename an existing panel — pick the
        panel you want below.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Specialty filter</Label>
          <select
            value={specialization}
            onChange={(e) => onSpecialization(e.target.value)}
            className="mt-1 flex h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm font-medium"
          >
            {specialties.map((s) => (
              <option key={s} value={s}>
                {prettySpec(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Action</Label>
          <select
            value={panelMode}
            onChange={(e) =>
              onPanelMode(e.target.value as "create" | "link")
            }
            className="mt-1 flex h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm"
          >
            <option value="link">
              Link existing panel (change Ganesh → Ananya, etc.)
            </option>
            <option value="create">
              Create brand-new panel under {prettySpec(specialization)}
            </option>
          </select>
        </div>
      </div>

      {panelMode === "link" ? (
        <div className="mt-3">
          <Label>Select panel</Label>
          <select
            value={doctorId}
            onChange={(e) => {
              const id = e.target.value;
              const panel = allPanels.find((p) => p.id === id);
              onDoctorId(id, panel);
            }}
            className="mt-1 flex h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm"
          >
            <option value="">Select panel…</option>
            {panelsBySpecialty.map(([spec, panels]) => (
              <optgroup key={spec} label={prettySpec(spec)}>
                {panels.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {prettySpec(p.specialization)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {selected && (
            <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-stone-700 ring-1 ring-stone-200">
              Linked to <strong>{selected.name}</strong> (
              {prettySpec(selected.specialization)}). Appointments for this
              panel go to this login.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-stone-600 ring-1 ring-stone-200">
          Creates a <strong>new</strong> bookable panel named after this user
          under <strong>{prettySpec(specialization)}</strong>. Use this only
          for a first-time doctor — not to rename/switch panels.
        </p>
      )}
    </div>
  );
}
