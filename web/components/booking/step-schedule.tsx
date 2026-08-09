"use client";

import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface StepScheduleProps {
  doctorId: string;
  preferredDate: string;
  preferredTime: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function StepSchedule({
  doctorId,
  preferredDate,
  preferredTime,
  onDateChange,
  onTimeChange,
}: StepScheduleProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const dates = useMemo(() => {
    const list: Date[] = [];
    const today = new Date();
    for (let i = 1; i <= 12; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if (d.getDay() !== 0) list.push(d);
    }
    return list;
  }, []);

  useEffect(() => {
    if (!preferredDate || !doctorId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/doctors/${doctorId}/availability?date=${preferredDate}`
        );
        const data = await res.json();
        if (!cancelled) {
          setSlots(Array.isArray(data.slots) ? data.slots : []);
        }
      } catch {
        if (!cancelled) {
          setSlots(
            ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "15:00", "16:00"].map(
              (time, i) => ({ time, available: i % 3 !== 0 })
            )
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [preferredDate, doctorId]);

  const toKey = (d: Date) => d.toISOString().slice(0, 10);
  const label = (key: string) =>
    new Date(key + "T00:00:00").toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl text-stone-900 sm:text-3xl">
          Schedule
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Pick a clinic slot — confirmation includes secure video link.
        </p>
      </div>

      <div>
        <Label className="mb-2 block">Date *</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {dates.map((d) => {
            const key = toKey(d);
            const active = preferredDate === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onDateChange(key)}
                className={`rounded-xl border px-3 py-3 text-center text-sm transition ${
                  active
                    ? "border-teal-800 bg-teal-50 font-semibold text-teal-950"
                    : "border-stone-200 hover:border-teal-700/40"
                }`}
              >
                {label(key)}
              </button>
            );
          })}
        </div>
      </div>

      {preferredDate && (
        <div>
          <Label className="mb-2 block">Time *</Label>
          {loading ? (
            <p className="py-6 text-center text-sm text-stone-500">
              Loading slots…
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => slot.available && onTimeChange(slot.time)}
                  className={`rounded-xl border px-2 py-2.5 text-sm font-medium transition ${
                    !slot.available
                      ? "cursor-not-allowed border-stone-100 bg-stone-50 text-stone-300"
                      : preferredTime === slot.time
                        ? "border-teal-800 bg-teal-50 text-teal-950"
                        : "border-stone-200 hover:border-teal-700/40"
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {preferredDate && preferredTime && (
        <Card className="border-teal-200 bg-teal-50 p-4 text-sm text-teal-950">
          Selected: <strong>{label(preferredDate)}</strong> at{" "}
          <strong>{preferredTime}</strong>
        </Card>
      )}
    </div>
  );
}
