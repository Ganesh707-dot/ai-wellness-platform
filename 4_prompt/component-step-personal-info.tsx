"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookingFormData } from "./appointment-wizard";

interface StepPersonalInfoProps {
  data: BookingFormData;
  onChange: (field: keyof BookingFormData, value: any) => void;
}

export default function StepPersonalInfo({
  data,
  onChange,
}: StepPersonalInfoProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Tell us about yourself
        </h2>
        <p className="text-gray-600">
          We need your basic information to schedule your consultation
        </p>
      </div>

      {/* Name */}
      <div>
        <Label htmlFor="name" className="text-sm font-medium">
          Full Name *
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          value={data.name}
          onChange={(e) => onChange("name", e.target.value)}
          className="mt-1"
          required
        />
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="email" className="text-sm font-medium">
          Email Address *
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          value={data.email}
          onChange={(e) => onChange("email", e.target.value)}
          className="mt-1"
          required
        />
      </div>

      {/* Phone */}
      <div>
        <Label htmlFor="phone" className="text-sm font-medium">
          Phone Number *
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1 (555) 000-0000"
          value={data.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          className="mt-1"
          required
        />
      </div>

      {/* Age */}
      <div>
        <Label htmlFor="age" className="text-sm font-medium">
          Age *
        </Label>
        <Input
          id="age"
          type="number"
          placeholder="30"
          value={data.age || ""}
          onChange={(e) => onChange("age", parseInt(e.target.value) || 0)}
          className="mt-1"
          required
        />
      </div>

      {/* Gender */}
      <div>
        <Label htmlFor="gender" className="text-sm font-medium">
          Gender *
        </Label>
        <Select
          value={data.gender}
          onValueChange={(value) =>
            onChange(
              "gender",
              value as
                | "MALE"
                | "FEMALE"
                | "OTHER"
                | "PREFER_NOT_TO_SAY"
            )
          }
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MALE">Male</SelectItem>
            <SelectItem value="FEMALE">Female</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
            <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Country */}
      <div>
        <Label htmlFor="country" className="text-sm font-medium">
          Country *
        </Label>
        <Input
          id="country"
          type="text"
          placeholder="United States"
          value={data.country}
          onChange={(e) => onChange("country", e.target.value)}
          className="mt-1"
          required
        />
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 Your information is secure and will only be used to schedule your
          consultation.
        </p>
      </div>
    </div>
  );
}
