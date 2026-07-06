"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  age?: number;
  gender?: string;
  lastConsultation?: string;
  totalConsultations: number;
}

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm]);

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/doctor/patients");
      if (!response.ok) throw new Error("Failed to fetch patients");
      const data = await response.json();
      setPatients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading patients");
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    const filtered = patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPatients(filtered);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Patients
          </h1>
          <p className="text-gray-600">
            Manage your patient list and consultations
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Search */}
        <Card className="p-6 mb-8">
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </Card>

        {/* Patients Count */}
        <div className="mb-6 text-gray-600">
          Found <strong>{filteredPatients.length}</strong> patient(s)
        </div>

        {/* Patients Table */}
        {filteredPatients.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500 text-lg">No patients found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPatients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PatientCard({ patient }: { patient: Patient }) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">{patient.name}</h3>
          <p className="text-gray-600 text-sm mb-3">{patient.email}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {patient.phone && (
              <div>
                <span className="text-gray-600">Phone:</span>
                <p className="font-semibold text-gray-900">{patient.phone}</p>
              </div>
            )}
            {patient.age && (
              <div>
                <span className="text-gray-600">Age:</span>
                <p className="font-semibold text-gray-900">{patient.age}</p>
              </div>
            )}
            {patient.gender && (
              <div>
                <span className="text-gray-600">Gender:</span>
                <p className="font-semibold text-gray-900">{patient.gender}</p>
              </div>
            )}
            <div>
              <span className="text-gray-600">Consultations:</span>
              <p className="font-semibold text-gray-900">{patient.totalConsultations}</p>
            </div>
          </div>
        </div>
      </div>

      {patient.lastConsultation && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Last Consultation: {new Date(patient.lastConsultation).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button className="bg-purple-600 hover:bg-purple-700">
          View Profile
        </Button>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          Schedule Appointment
        </Button>
        <Button variant="outline">
          View History
        </Button>
        <Button variant="outline">
          Send Message
        </Button>
      </div>
    </Card>
  );
}
