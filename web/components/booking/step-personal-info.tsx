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
import type { BookingFormData } from "./appointment-wizard";

interface StepPersonalInfoProps {
  data: BookingFormData;
  onChange: (field: keyof BookingFormData, value: string | number) => void;
}

export default function StepPersonalInfo({
  data,
  onChange,
}: StepPersonalInfoProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl text-stone-900 sm:text-3xl">
          Patient details
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Used for encounter creation and clinician handoff.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Full name *</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => onChange("name", e.target.value)}
            className="mt-1"
            placeholder="Your full name"
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="age">Age *</Label>
          <Input
            id="age"
            type="number"
            value={data.age || ""}
            onChange={(e) => onChange("age", parseInt(e.target.value) || 0)}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Gender *</Label>
          <Select
            value={data.gender}
            onValueChange={(value) => onChange("gender", value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FEMALE">Female</SelectItem>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
              <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="country">Country *</Label>
          <Input
            id="country"
            value={data.country}
            onChange={(e) => onChange("country", e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <p className="rounded-xl bg-teal-50 px-4 py-3 text-xs text-teal-900">
        Encrypted in transit · used only for care coordination
      </p>
    </div>
  );
}
