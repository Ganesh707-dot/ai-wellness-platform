import SimplePage from "@/components/simple-page";

export default function PrivacyPage() {
  return (
    <SimplePage
      title="Privacy"
      body="This demo stores account and appointment data in your configured PostgreSQL database. Consent and audit log tables are part of the schema for healthcare-grade traceability."
    />
  );
}
