export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pages render their own RoleShell — do not wrap DoctorShell here (avoids double nav).
  return children;
}
