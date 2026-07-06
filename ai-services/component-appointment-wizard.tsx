"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import StepPersonalInfo from "@/components/booking/step-personal-info";
import StepConcern from "@/components/booking/step-concern";
import StepDoctor from "@/components/booking/step-doctor";
import StepSchedule from "@/components/booking/step-schedule";
import StepConfirmation from "@/components/booking/step-confirmation";
import { bookAppointmentAction } from "@/actions/appointment-actions";

export interface BookingFormData {
  // Personal Info
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  country: string;

  // Concern
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

  // Doctor
  doctorId: string;

  // Schedule
  preferredDate: string;
  preferredTime: string;
}

const initialFormData: BookingFormData = {
  name: "",
  email: "",
  phone: "",
  age: 0,
  gender: "PREFER_NOT_TO_SAY",
  country: "",
  consultationType: "HOMEOPATHY",
  concern: "",
  notes: "",
  doctorId: "",
  preferredDate: "",
  preferredTime: "",
};

export default function AppointmentWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 5;

  const handleNext = () => {
    setError(null);
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (
    field: keyof BookingFormData,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await bookAppointmentAction(formData);

      if (!result.success) {
        setError(result.error || "Failed to book appointment");
        return;
      }

      // Redirect to success page or dashboard
      router.push(`/appointment-confirmed/${result.appointmentId}`);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Book Your Wellness Consultation
          </h1>
          <p className="text-gray-600">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full transition-all ${
                i + 1 <= currentStep ? "bg-indigo-600" : "bg-gray-300"
              }`}
            ></div>
          ))}
        </div>

        {/* Main Card */}
        <Card className="p-8 shadow-xl">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Step Content */}
          <div className="min-h-96">
            {currentStep === 1 && (
              <StepPersonalInfo
                data={formData}
                onChange={handleInputChange}
              />
            )}

            {currentStep === 2 && (
              <StepConcern data={formData} onChange={handleInputChange} />
            )}

            {currentStep === 3 && (
              <StepDoctor
                consultationType={formData.consultationType}
                selectedDoctorId={formData.doctorId}
                onChange={(doctorId) => handleInputChange("doctorId", doctorId)}
              />
            )}

            {currentStep === 4 && (
              <StepSchedule
                doctorId={formData.doctorId}
                preferredDate={formData.preferredDate}
                preferredTime={formData.preferredTime}
                onDateChange={(date) =>
                  handleInputChange("preferredDate", date)
                }
                onTimeChange={(time) =>
                  handleInputChange("preferredTime", time)
                }
              />
            )}

            {currentStep === 5 && (
              <StepConfirmation data={formData} />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8 pt-8 border-t border-gray-200">
            <Button
              onClick={handleBack}
              disabled={currentStep === 1 || isLoading}
              variant="outline"
              className="flex-1"
            >
              Back
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={isLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? "Booking..." : "Confirm & Book"}
              </Button>
            )}
          </div>

          {/* Step Indicator */}
          <div className="text-center mt-4 text-sm text-gray-500">
            Step {currentStep} of {totalSteps}
          </div>
        </Card>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Need help?{" "}
            <a href="/contact" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
