import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg p-8 shadow-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-800">
          Access denied
        </p>
        <h1 className="mt-2 font-serif text-3xl text-stone-900">
          This login is missing portal access
        </h1>
        <p className="mt-3 text-sm text-stone-600">
          Usually the account is still <strong>Pending</strong>, or an admin
          activated it without granting the role’s permissions.
        </p>

        <div className="mt-5 space-y-3 rounded-xl bg-[#f3f7f4] p-4 text-sm text-stone-700 ring-1 ring-teal-900/10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800">
            Admin fix (2 minutes)
          </p>
          <ol className="list-decimal space-y-2 pl-4 text-sm">
            <li>
              Sign in as <strong>admin@test.com</strong> →{" "}
              <strong>Users</strong>
            </li>
            <li>
              Find this person →{" "}
              <strong>Activate &amp; grant access</strong> (or{" "}
              <strong>Manage access</strong> if already active)
            </li>
            <li>
              Step 1: role = <strong>DOCTOR</strong>
              <br />
              Step 2: <strong>Link existing panel</strong> (pick the right
              name)
              <br />
              Step 3: leave <strong>Full DOCTOR access</strong> checked
            </li>
            <li>
              Save, then this user must <strong>sign out and sign in
              again</strong>
            </li>
          </ol>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href="/login">Sign in again</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/admin/users">Admin → Users</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
