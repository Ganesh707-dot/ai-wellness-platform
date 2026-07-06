"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface DoctorPatient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  age?: number;
  lastVisit: string;
  totalVisits: number;
  status: string;
}

export default function DoctorPatients() {
  const { status } = useSession();
  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      fetchPatients();
    }
  }, [status]);

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/doctor/patients");
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Patients</h1>
        <p className="text-gray-600 mt-1">
          {patients.length} patient(s) under your care
        </p>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by name or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-md"
      />

      {/* Patients List */}
      {filteredPatients.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No patients found
          </h3>
          <p className="text-gray-600">
            Your patients will appear here once they book consultations
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPatients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      )}
    </div>
  );
}

function PatientCard({ patient }: { patient: DoctorPatient }) {
  const lastVisitDate = new Date(patient.lastVisit);
  const daysAgo = Math.floor(
    (Date.now() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-xl">
            👤
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{patient.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{patient.email}</p>
            {patient.phone && (
              <p className="text-sm text-gray-600 mt-1">{patient.phone}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 font-medium">VISITS</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {patient.totalVisits}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-gray-200">
        <DetailBox label="Age" value={patient.age ? `${patient.age} yrs` : "—"} />
        <DetailBox
          label="Last Visit"
          value={daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
        />
        <DetailBox
          label="Status"
          value={
            <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          }
        />
      </div>

      <div className="flex gap-3">
        <Button
          asChild
          variant="outline"
          className="flex-1"
        >
          <Link href={`/doctor/patients/${patient.id}`}>
            View Profile
          </Link>
        </Button>
        <Button
          asChild
          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
        >
          <Link href={`/doctor/patients/${patient.id}/prescription`}>
            New Prescription
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function DetailBox({
  label,
  value,
}: {
  label: string;
  value: string | JSX.Element;
}) {
  return (
    <div className="text-center">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-sm font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
