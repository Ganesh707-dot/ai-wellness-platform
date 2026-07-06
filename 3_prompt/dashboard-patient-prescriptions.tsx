"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface Prescription {
  id: string;
  medicine: string;
  potency?: string;
  dosage: string;
  frequency: string;
  duration: string;
  status: string;
  startedAt: string;
  doctorName: string;
  instructions?: string;
}

export default function PatientPrescriptions() {
  const { status } = useSession();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("active");

  useEffect(() => {
    if (status === "authenticated") {
      fetchPrescriptions();
    }
  }, [status]);

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch("/api/patient/prescriptions");
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data);
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter((rx) => {
    if (filter === "all") return true;
    return rx.status.toLowerCase() === filter.toLowerCase();
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Prescriptions</h1>
        <p className="text-gray-600 mt-1">Track your medications and wellness treatments</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "active", "completed"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f as any)}
            className={filter === f ? "bg-indigo-600" : ""}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Prescriptions Grid */}
      {filteredPrescriptions.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">💊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No prescriptions found
          </h3>
          <p className="text-gray-600">
            Your prescriptions will appear here after your consultations
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPrescriptions.map((rx) => (
            <PrescriptionCard key={rx.id} prescription={rx} />
          ))}
        </div>
      )}
    </div>
  );
}

function PrescriptionCard({ prescription }: { prescription: Prescription }) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "discontinued":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const startDate = new Date(prescription.startedAt);

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {prescription.medicine}
          </h3>
          {prescription.potency && (
            <p className="text-sm text-gray-600 mt-1">{prescription.potency}</p>
          )}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(
            prescription.status
          )}`}
        >
          {prescription.status}
        </span>
      </div>

      {/* Prescribed By */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <p className="text-xs text-gray-500 font-medium">PRESCRIBED BY</p>
        <p className="text-sm font-semibold text-gray-900 mt-1">
          {prescription.doctorName}
        </p>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <DetailItem label="Dosage" value={prescription.dosage} />
        <DetailItem label="Frequency" value={prescription.frequency} />
        <DetailItem label="Duration" value={prescription.duration} />
        <DetailItem
          label="Started"
          value={startDate.toLocaleDateString()}
        />
      </div>

      {/* Instructions */}
      {prescription.instructions && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700 font-medium">INSTRUCTIONS</p>
          <p className="text-sm text-blue-900 mt-1">
            {prescription.instructions}
          </p>
        </div>
      )}

      {/* Actions */}
      <Button variant="outline" className="w-full">
        Download Prescription
      </Button>
    </Card>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-sm font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
