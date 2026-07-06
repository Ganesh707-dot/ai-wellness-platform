"use client";

import { useEffect, useState } from "react";
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
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate next 14 days
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      if (date.getDay() !== 0) {
        // Skip Sundays
        dates.push(date);
      }
    }
    return dates;
  };

  const availableDates = getAvailableDates();

  // Fetch time slots when date changes
  useEffect(() => {
    if (preferredDate && doctorId) {
      fetchTimeSlots();
    }
  }, [preferredDate, doctorId]);

  const fetchTimeSlots = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/doctors/${doctorId}/availability?date=${preferredDate}`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      // Mock slots for demo
      setAvailableSlots(getMockTimeSlots());
    } finally {
      setLoading(false);
    }
  };

  const getMockTimeSlots = (): TimeSlot[] => {
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        slots.push({
          time: timeStr,
          available: Math.random() > 0.3, // 70% availability
        });
      }
    }
    return slots;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Schedule Your Appointment
        </h2>
        <p className="text-gray-600">
          Choose a date and time that works best for you
        </p>
      </div>

      {/* Date Selection */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          Preferred Date *
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {availableDates.map((date) => {
            const dateStr = formatDate(date);
            return (
              <button
                key={dateStr}
                onClick={() => onDateChange(dateStr)}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  preferredDate === dateStr
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 hover:border-indigo-300"
                }`}
              >
                <p className="text-xs text-gray-600 font-medium">
                  {formatDisplayDate(dateStr)}
                </p>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  {date.getDate()}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Selection */}
      {preferredDate && (
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Preferred Time *
          </Label>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading available times...</p>
            </div>
          ) : availableSlots.length === 0 ? (
            <Card className="p-4 text-center">
              <p className="text-gray-600">
                No available slots for this date. Please select another date.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && onTimeChange(slot.time)}
                  disabled={!slot.available}
                  className={`p-3 rounded-lg border-2 transition-all text-center font-medium ${
                    slot.available
                      ? preferredTime === slot.time
                        ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                        : "border-gray-200 hover:border-indigo-300 text-gray-900"
                      : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selection Summary */}
      {preferredDate && preferredTime && (
        <Card className="p-4 bg-green-50 border border-green-200">
          <p className="text-sm text-green-700">
            ✓ Appointment scheduled for{" "}
            <strong>{formatDisplayDate(preferredDate)}</strong> at{" "}
            <strong>{preferredTime}</strong>
          </p>
        </Card>
      )}

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 You'll receive a confirmation email with video call details 24 hours
          before your appointment.
        </p>
      </div>
    </div>
  );
}
