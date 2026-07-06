"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { BookingFormData } from "./appointment-wizard";

interface StepConcernProps {
  data: BookingFormData;
  onChange: (field: keyof BookingFormData, value: any) => void;
}

const CONSULTATION_TYPES = [
  {
    value: "HOMEOPATHY",
    label: "Homeopathy",
    icon: "🌿",
    description: "Classical homeopathic treatments",
  },
  {
    value: "PEDIATRICS",
    label: "Pediatrics",
    icon: "👶",
    description: "Child health and wellness",
  },
  {
    value: "FERTILITY",
    label: "Fertility",
    icon: "👪",
    description: "Fertility and conception support",
  },
  {
    value: "WOMENS_WELLNESS",
    label: "Women's Wellness",
    icon: "👩‍🦰",
    description: "Women's health and wellness",
  },
  {
    value: "EMOTIONAL_WELLNESS",
    label: "Emotional Wellness",
    icon: "💭",
    description: "Mental health and wellness",
  },
  {
    value: "FAMILY_WELLNESS",
    label: "Family Wellness",
    icon: "👨‍👩‍👧‍👦",
    description: "Family health support",
  },
  {
    value: "PREVENTIVE_CARE",
    label: "Preventive Care",
    icon: "🛡️",
    description: "Preventive wellness measures",
  },
];

export default function StepConcern({
  data,
  onChange,
}: StepConcernProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          What brings you here?
        </h2>
        <p className="text-gray-600">
          Select the type of consultation you need
        </p>
      </div>

      {/* Consultation Types */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Type of Consultation *</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CONSULTATION_TYPES.map((type) => (
            <Card
              key={type.value}
              onClick={() =>
                onChange(
                  "consultationType",
                  type.value as BookingFormData["consultationType"]
                )
              }
              className={`p-4 cursor-pointer transition-all ${
                data.consultationType === type.value
                  ? "border-indigo-600 border-2 bg-indigo-50"
                  : "border-gray-200 hover:border-indigo-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{type.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900">{type.label}</p>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Concern */}
      <div>
        <Label htmlFor="concern" className="text-sm font-medium">
          What is your main concern? *
        </Label>
        <Input
          id="concern"
          type="text"
          placeholder="e.g., Chronic fatigue, Skin issues, Anxiety, etc."
          value={data.concern}
          onChange={(e) => onChange("concern", e.target.value)}
          className="mt-1"
          required
        />
      </div>

      {/* Additional Notes */}
      <div>
        <Label htmlFor="notes" className="text-sm font-medium">
          Additional Details (optional)
        </Label>
        <Textarea
          id="notes"
          placeholder="Tell us more about your health concerns, symptoms, or medical history that might be relevant..."
          value={data.notes}
          onChange={(e) => onChange("notes", e.target.value)}
          className="mt-1"
          rows={4}
        />
      </div>

      {/* Info Box */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-700">
          ✓ This information helps us match you with the right doctor for your needs.
        </p>
      </div>
    </div>
  );
}

// Input component (add to ui folder if not exists)
function Input({
  id,
  type,
  placeholder,
  value,
  onChange,
  className,
  required,
}: {
  id: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  required?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className || ""}`}
      required={required}
    />
  );
}

// Textarea component (add to ui folder if not exists)
function Textarea({
  id,
  placeholder,
  value,
  onChange,
  className,
  rows,
}: {
  id: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={rows}
      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className || ""}`}
    />
  );
}
