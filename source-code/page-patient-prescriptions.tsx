"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface Prescription {
  id: string;
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  doctorName: string;
  startedAt: string;
  endedAt?: string;
  status: string;
  instructions?: string;
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch("/api/prescriptions");
      if (!response.ok) throw new Error("Failed to fetch prescriptions");
      const data = await response.json();
      setPrescriptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading prescriptions");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const activePrescriptions = prescriptions.filter((p) => p.status === "ACTIVE");
  const inactivePrescriptions = prescriptions.filter((p) => p.status !== "ACTIVE");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Prescriptions
          </h1>
          <p className="text-gray-600">
            Track your medications and treatment plans
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Active Prescriptions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-1 h-8 bg-indigo-600 mr-3"></span>
            Active Prescriptions ({activePrescriptions.length})
          </h2>

          {activePrescriptions.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No active prescriptions</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activePrescriptions.map((prescription) => (
                <PrescriptionCard
                  key={prescription.id}
                  prescription={prescription}
                />
              ))}
            </div>
          )}
        </div>

        {/* Inactive Prescriptions */}
        {inactivePrescriptions.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-1 h-8 bg-gray-400 mr-3"></span>
              Past Prescriptions ({inactivePrescriptions.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inactivePrescriptions.map((prescription) => (
                <PrescriptionCard
                  key={prescription.id}
                  prescription={prescription}
                  archived
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PrescriptionCard({
  prescription,
  archived = false,
}: {
  prescription: Prescription;
  archived?: boolean;
}) {
  const startDate = new Date(prescription.startedAt);
  const endDate = prescription.endedAt ? new Date(prescription.endedAt) : null;

  return (
    <Card
      className={`p-6 ${
        archived
          ? "bg-gradient-to-br from-gray-50 to-gray-100"
          : "bg-gradient-to-br from-blue-50 to-indigo-50"
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {prescription.medicine}
          </h3>
          <p className="text-sm text-gray-600">
            Prescribed by Dr. {prescription.doctorName}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            prescription.status === "ACTIVE"
              ? "bg-green-100 text-green-800"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          {prescription.status}
        </span>
      </div>

      {/* Medicine Details */}
      <div className="space-y-3 mb-6 pb-6 border-b border-gray-300">
        <DetailRow label="Dosage" value={prescription.dosage} />
        <DetailRow label="Frequency" value={prescription.frequency} />
        <DetailRow label="Duration" value={prescription.duration} />
        {prescription.instructions && (
          <DetailRow label="Instructions" value={prescription.instructions} />
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs text-gray-600 mb-1">Started</p>
          <p className="font-semibold text-gray-900">
            {startDate.toLocaleDateString()}
          </p>
        </div>
        {endDate && (
          <div>
            <p className="text-xs text-gray-600 mb-1">Ended</p>
            <p className="font-semibold text-gray-900">
              {endDate.toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" size="sm" className="flex-1">
          Download
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          Print
        </Button>
      </div>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-700 font-medium">{label}:</span>
      <span className="text-gray-900 font-semibold">{value}</span>
    </div>
  );
}
