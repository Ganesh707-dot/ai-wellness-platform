import { Suspense } from "react";
import AppointmentWizard from "@/components/booking/appointment-wizard";
import { LoadingSpinner } from "@/components/common/loading-spinner";

export default function BookAppointmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <LoadingSpinner />
        </div>
      }
    >
      <AppointmentWizard />
    </Suspense>
  );
}
