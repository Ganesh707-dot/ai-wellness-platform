"use client";

import { useEffect, useMemo, useState, startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import StepPersonalInfo from "@/components/booking/step-personal-info";
import StepConcern, {
  type AiMatchHint,
} from "@/components/booking/step-concern";
import StepDoctor from "@/components/booking/step-doctor";
import StepSchedule from "@/components/booking/step-schedule";
import StepConfirmation from "@/components/booking/step-confirmation";
import { bookAppointmentAction } from "@/actions/appointment-actions";
import {
  personalInfoSchema,
  concernSchema,
  doctorSelectionSchema,
  scheduleSchema,
} from "@/lib/validation-booking";
import { upsertClinicBoard } from "@/lib/clinic-board";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { APP_NAME } from "@/lib/app-brand";

export interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  country: string;
  consultationType:
    | "HOMEOPATHY"
    | "PEDIATRICS"
    | "FERTILITY"
    | "WOMENS_WELLNESS"
    | "EMOTIONAL_WELLNESS"
    | "FAMILY_WELLNESS"
    | "PREVENTIVE_CARE";
  concern: string;
  notes: string;
  doctorId: string;
  preferredDate: string;
  preferredTime: string;
}

const STEPS = [
  "You",
  "Concern",
  "Clinician",
  "Schedule",
  "Confirm",
] as const;

const initialFormData: BookingFormData = {
  name: "Asha Patel",
  email: "patient@test.com",
  phone: "+91 98765 43210",
  age: 32,
  gender: "FEMALE",
  country: "India",
  consultationType: "HOMEOPATHY",
  concern: "Seasonal sneezing and disrupted sleep",
  notes: "",
  doctorId: "",
  preferredDate: "",
  preferredTime: "",
};

export default function AppointmentWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiMatch, setAiMatch] = useState<AiMatchHint | null>(null);

  useEffect(() => {
    const concern = searchParams.get("concern");
    const type = searchParams.get("type") as BookingFormData["consultationType"] | null;
    const doctorId = searchParams.get("doctorId");
    let fromStore: Partial<BookingFormData> = {};
    try {
      const raw =
        sessionStorage.getItem(STORAGE_KEYS.bookingIntake) ||
        sessionStorage.getItem(STORAGE_KEYS.legacyBookingIntake);
      if (raw) fromStore = JSON.parse(raw);
    } catch {
      /* ignore */
    }
    setFormData((prev) => ({
      ...prev,
      concern: concern || fromStore.concern || prev.concern,
      consultationType:
        type ||
        fromStore.consultationType ||
        prev.consultationType,
      doctorId: doctorId || prev.doctorId,
    }));
    if (concern || fromStore.concern) setCurrentStep(2);
  }, [searchParams]);

  const progress = useMemo(
    () => (currentStep / STEPS.length) * 100,
    [currentStep]
  );

  const handleInputChange = (
    field: keyof BookingFormData,
    value: string | number
  ) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Specialty change invalidates prior clinician pick
      if (field === "consultationType" && value !== prev.consultationType) {
        next.doctorId = "";
      }
      return next;
    });
  };

  const validateStep = () => {
    if (currentStep === 1) {
      const r = personalInfoSchema.safeParse(formData);
      return r.success ? null : r.error.issues[0]?.message || "Check your details";
    }
    if (currentStep === 2) {
      const r = concernSchema.safeParse(formData);
      return r.success ? null : r.error.issues[0]?.message || "Add your concern";
    }
    if (currentStep === 3) {
      const r = doctorSelectionSchema.safeParse(formData);
      return r.success ? null : "Please select a clinician";
    }
    if (currentStep === 4) {
      const r = scheduleSchema.safeParse(formData);
      return r.success ? null : r.error.issues[0]?.message || "Pick date & time";
    }
    return null;
  };

  const handleNext = () => {
    const msg = validateStep();
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  };

  const handleSubmit = async () => {
    const msg = validateStep();
    if (msg) {
      setError(msg);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await bookAppointmentAction(formData);
      if (!result.success) {
        setError(result.error || "Booking failed");
        return;
      }
      if (result.encounter) {
        upsertClinicBoard(result.encounter);
        try {
          sessionStorage.setItem(
            STORAGE_KEYS.appointmentCache(result.appointmentId!),
            JSON.stringify(result.encounter)
          );
        } catch {
          /* ignore quota */
        }
      }
      startTransition(() => {
        router.push(`/appointment-confirmed/${result.appointmentId}`);
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[85vh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,#d5ebe3_0%,transparent_42%),radial-gradient(circle_at_90%_10%,#e8dcc8_0%,transparent_40%)]" />

      <div className="relative mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr] lg:py-12">
        <aside className="space-y-4">
          <div className="rounded-3xl border border-teal-900/10 bg-[#0f3d38] p-6 text-white shadow-lg">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-100">
              {APP_NAME} booking
            </p>
            <h1 className="mt-3 font-serif text-3xl leading-tight">
              Book a clinician consult
            </h1>
            <p className="mt-3 text-sm text-teal-50/85">
              AI maps your concern to a specialty, ranks the right clinician
              panel, and routes the request only to them.
            </p>
          </div>

          <ol className="rounded-3xl border border-stone-200 bg-white/90 p-4 shadow-sm">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const active = n === currentStep;
              const done = n < currentStep;
              return (
                <li
                  key={label}
                  className={`flex items-center gap-3 rounded-xl px-2 py-2.5 ${
                    active ? "bg-teal-50" : ""
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      done
                        ? "bg-teal-800 text-white"
                        : active
                          ? "bg-teal-900 text-white"
                          : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {done ? "✓" : n}
                  </span>
                  <span
                    className={`text-sm ${
                      active ? "font-semibold text-teal-950" : "text-stone-600"
                    }`}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </aside>

        <section className="min-w-0">
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-stone-200/80">
            <div
              className="h-full rounded-full bg-teal-800 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <Card className="border-stone-200/80 bg-white/95 p-5 shadow-[0_24px_60px_-36px_rgba(15,70,60,0.55)] sm:p-8">
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="min-h-[320px]">
              {currentStep === 1 && (
                <StepPersonalInfo data={formData} onChange={handleInputChange} />
              )}
              {currentStep === 2 && (
                <StepConcern
                  data={formData}
                  onChange={handleInputChange}
                  aiMatch={aiMatch}
                  onAiMatch={setAiMatch}
                />
              )}
              {currentStep === 3 && (
                <StepDoctor
                  consultationType={formData.consultationType}
                  concern={formData.concern}
                  selectedDoctorId={formData.doctorId}
                  aiMatch={aiMatch}
                  onChange={(doctorId) =>
                    handleInputChange("doctorId", doctorId)
                  }
                />
              )}
              {currentStep === 4 && (
                <StepSchedule
                  doctorId={formData.doctorId}
                  preferredDate={formData.preferredDate}
                  preferredTime={formData.preferredTime}
                  onDateChange={(date) => handleInputChange("preferredDate", date)}
                  onTimeChange={(time) => handleInputChange("preferredTime", time)}
                />
              )}
              {currentStep === 5 && (
                <StepConfirmation data={formData} aiMatch={aiMatch} />
              )}
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-stone-100 pt-6 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="sm:flex-1"
                disabled={currentStep === 1 || isLoading}
                onClick={() => {
                  setError(null);
                  setCurrentStep((s) => Math.max(1, s - 1));
                }}
              >
                Back
              </Button>
              {currentStep < STEPS.length ? (
                <Button type="button" className="sm:flex-1" onClick={handleNext}>
                  Continue
                </Button>
              ) : (
                <Button
                  type="button"
                  className="sm:flex-1"
                  disabled={isLoading}
                  onClick={handleSubmit}
                >
                  {isLoading ? "Submitting…" : "Submit for clinician review"}
                </Button>
              )}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
