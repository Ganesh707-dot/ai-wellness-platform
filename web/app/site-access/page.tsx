import { Suspense } from "react";
import { SiteAccessForm } from "./site-access-form";

export default function SiteAccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center text-stone-500">
          Loading…
        </div>
      }
    >
      <SiteAccessForm />
    </Suspense>
  );
}
