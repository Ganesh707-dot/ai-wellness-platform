"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  consultationFee: number;
  bio?: string;
  image?: string;
}

interface StepDoctorProps {
  consultationType: string;
  selectedDoctorId: string;
  onChange: (doctorId: string) => void;
}

export default function StepDoctor({
  consultationType,
  selectedDoctorId,
  onChange,
}: StepDoctorProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, [consultationType]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/doctors?specialization=${consultationType}`
      );
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your Doctor
        </h2>
        <p className="text-gray-600">
          Select a doctor who specializes in your area of concern
        </p>
      </div>

      {doctors.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600">
            No doctors available for this specialization at the moment.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {doctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              isSelected={selectedDoctorId === doctor.id}
              onSelect={() => onChange(doctor.id)}
            />
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 You can read more about each doctor's experience and ratings to
          make the best choice.
        </p>
      </div>
    </div>
  );
}

function DoctorCard({
  doctor,
  isSelected,
  onSelect,
}: {
  doctor: Doctor;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      onClick={onSelect}
      className={`p-6 cursor-pointer transition-all ${
        isSelected
          ? "border-indigo-600 border-2 bg-indigo-50"
          : "border-gray-200 hover:border-indigo-300"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl flex-shrink-0">
          👨‍⚕️
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-lg font-bold text-gray-900">Dr. {doctor.name}</p>
              <p className="text-sm text-gray-600">{doctor.specialization}</p>
            </div>
            {isSelected && (
              <div className="px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-medium">
                Selected
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 mb-3">
            <div>
              <p className="text-xs text-gray-500">EXPERIENCE</p>
              <p className="text-sm font-semibold text-gray-900">
                {doctor.experience} years
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">RATING</p>
              <p className="text-sm font-semibold text-gray-900">
                {doctor.rating} ⭐
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">CONSULTATION</p>
              <p className="text-sm font-semibold text-gray-900">
                ${doctor.consultationFee}
              </p>
            </div>
          </div>

          {/* Bio */}
          {doctor.bio && (
            <p className="text-sm text-gray-600">{doctor.bio}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
