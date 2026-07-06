"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerAction, doctorRegistrationAction } from "@/actions/auth-actions";

type RegistrationRole = "PATIENT" | "DOCTOR";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<RegistrationRole>("PATIENT");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    // Doctor specific
    specialization: "",
    licenseNumber: "",
    qualifications: "",
    experience: "",
    consultationFee: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.email) {
        setError("Please fill in all fields");
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.password || !formData.confirmPassword) {
        setError("Please fill in all fields");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords don't match");
        return false;
      }
    } else if (currentStep === 3 && role === "DOCTOR") {
      if (
        !formData.specialization ||
        !formData.licenseNumber ||
        !formData.qualifications ||
        !formData.experience ||
        !formData.consultationFee
      ) {
        setError("Please fill in all fields");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateStep()) {
      return;
    }

    if (role === "PATIENT" && currentStep < 2) {
      setCurrentStep(2);
      return;
    }

    if (role === "DOCTOR" && currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setIsLoading(true);

    try {
      let result;

      if (role === "PATIENT") {
        result = await registerAction({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          role: "PATIENT",
        });
      } else {
        result = await doctorRegistrationAction({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          role: "DOCTOR",
          specialization: formData.specialization as any,
          licenseNumber: formData.licenseNumber,
          qualifications: formData.qualifications,
          experience: Number(formData.experience),
          consultationFee: Number(formData.consultationFee),
        });
      }

      if (!result.success) {
        setError(result.error || "Registration failed");
        return;
      }

      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (currentStep === 1 && !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Join Our Wellness Community
              </h1>
              <p className="text-gray-600 mt-2">
                Choose your role to get started
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => {
                  setRole("PATIENT");
                  setCurrentStep(1);
                }}
                className="w-full h-24 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">👤</div>
                  <div>
                    <div className="font-bold">Patient</div>
                    <div className="text-sm">Book consultations & manage health</div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => {
                  setRole("DOCTOR");
                  setCurrentStep(1);
                }}
                className="w-full h-24 bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">👨‍⚕️</div>
                  <div>
                    <div className="font-bold">Doctor</div>
                    <div className="text-sm">Manage patients & consultations</div>
                  </div>
                </div>
              </Button>
            </div>

            <p className="text-center text-sm text-gray-600 mt-8">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {role === "PATIENT" ? "Patient Registration" : "Doctor Registration"}
            </h1>
            <p className="text-gray-600 mt-2">Step {currentStep} of {role === "DOCTOR" ? 3 : 2}</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8 flex space-x-2">
            {[1, 2, ...(role === "DOCTOR" ? [3] : [])].map((step) => (
              <div
                key={step}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  step <= currentStep ? "bg-indigo-600" : "bg-gray-300"
                }`}
              ></div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <>
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="mt-1"
                    required
                  />
                </div>
              </>
            )}

            {/* Step 2: Password */}
            {currentStep === 2 && (
              <>
                <div>
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="mt-1"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    At least 8 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="mt-1"
                    required
                  />
                </div>
              </>
            )}

            {/* Step 3: Doctor Details */}
            {currentStep === 3 && role === "DOCTOR" && (
              <>
                <div>
                  <Label htmlFor="specialization" className="text-sm font-medium">
                    Specialization
                  </Label>
                  <Select
                    value={formData.specialization}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, specialization: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HOMEOPATHY">Homeopathy</SelectItem>
                      <SelectItem value="PEDIATRICS">Pediatrics</SelectItem>
                      <SelectItem value="FERTILITY">Fertility</SelectItem>
                      <SelectItem value="WOMENS_WELLNESS">Women's Wellness</SelectItem>
                      <SelectItem value="EMOTIONAL_WELLNESS">
                        Emotional Wellness
                      </SelectItem>
                      <SelectItem value="FAMILY_WELLNESS">Family Wellness</SelectItem>
                      <SelectItem value="PREVENTIVE_CARE">
                        Preventive Care
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="licenseNumber" className="text-sm font-medium">
                    License Number
                  </Label>
                  <Input
                    id="licenseNumber"
                    name="licenseNumber"
                    type="text"
                    placeholder="Your license number"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="experience" className="text-sm font-medium">
                    Years of Experience
                  </Label>
                  <Input
                    id="experience"
                    name="experience"
                    type="number"
                    placeholder="10"
                    value={formData.experience}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="consultationFee" className="text-sm font-medium">
                    Consultation Fee (USD)
                  </Label>
                  <Input
                    id="consultationFee"
                    name="consultationFee"
                    type="number"
                    placeholder="50"
                    value={formData.consultationFee}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="qualifications" className="text-sm font-medium">
                    Qualifications (comma separated)
                  </Label>
                  <Input
                    id="qualifications"
                    name="qualifications"
                    type="text"
                    placeholder="MBBS, MD, Specialization"
                    value={formData.qualifications}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="mt-1"
                    required
                  />
                </div>
              </>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              {currentStep > 1 && (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  variant="outline"
                  className="flex-1"
                  disabled={isLoading}
                >
                  Back
                </Button>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? "Creating account..." : currentStep === (role === "DOCTOR" ? 3 : 2) ? "Sign Up" : "Next"}
              </Button>
            </div>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
