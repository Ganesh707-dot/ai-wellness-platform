import SimplePage from "@/components/simple-page";
import { APP_NAME } from "@/lib/app-brand";

export default function AboutPage() {
  return (
    <SimplePage
      title={`About ${APP_NAME}`}
      body={`${APP_NAME} is a multi-role telehealth platform built for clinical workflows — patient booking, doctor practice tools, and admin oversight — with Auth.js RBAC and Prisma domain models.`}
    />
  );
}
