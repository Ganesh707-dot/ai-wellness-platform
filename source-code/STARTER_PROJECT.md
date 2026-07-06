# AI-Powered Holistic Wellness Platform - Starter Project

## QUICK START

```bash
npx create-next-app@latest wellness-platform --typescript --tailwind --shadcn-ui
cd wellness-platform
npm install
npm run dev
```

---

## FOLDER STRUCTURE

```
wellness-platform/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── providers.tsx
│   ├── (public)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── about/page.tsx
│   │   ├── services/page.tsx
│   │   ├── conditions/
│   │   │   ├── page.tsx
│   │   │   ├── [slug]/page.tsx
│   │   ├── articles/
│   │   │   ├── page.tsx
│   │   │   ├── [slug]/page.tsx
│   │   ├── testimonials/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── book-appointment/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── terms/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── appointments/route.ts
│   │   ├── patients/route.ts
│   │   ├── doctors/route.ts
│   │   ├── consultations/route.ts
│   │   ├── prescriptions/route.ts
│   │   ├── notifications/route.ts
│   │   ├── upload/route.ts
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── appointments/page.tsx
│   │   │   ├── prescriptions/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   ├── profile/page.tsx
│   ├── (doctor)/
│   │   ├── layout.tsx
│   │   ├── doctor/
│   │   │   ├── page.tsx
│   │   │   ├── appointments/page.tsx
│   │   │   ├── patients/page.tsx
│   │   │   ├── articles/page.tsx
│   │   │   ├── prescriptions/page.tsx
│   ├── (admin)/
│   │   ├── layout.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx
│   │   │   ├── users/page.tsx
│   │   │   ├── content/page.tsx
│   │   │   ├── appointments/page.tsx
│   │   │   ├── settings/page.tsx
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── tabs.tsx
│   │   ├── badge.tsx
│   ├── layout/
│   │   ├── navbar.tsx
│   │   ├── footer.tsx
│   │   ├── sidebar.tsx
│   │   ├── mobile-nav.tsx
│   ├── public/
│   │   ├── hero.tsx
│   │   ├── features.tsx
│   │   ├── doctors-showcase.tsx
│   │   ├── testimonials-carousel.tsx
│   │   ├── cta-section.tsx
│   │   ├── services-grid.tsx
│   │   ├── conditions-grid.tsx
│   ├── booking/
│   │   ├── appointment-wizard.tsx
│   │   ├── step-personal-info.tsx
│   │   ├── step-concern.tsx
│   │   ├── step-schedule.tsx
│   │   ├── step-confirmation.tsx
│   ├── dashboard/
│   │   ├── appointment-card.tsx
│   │   ├── prescription-card.tsx
│   │   ├── report-card.tsx
│   │   ├── profile-form.tsx
│   │   ├── stats-overview.tsx
│   ├── doctor/
│   │   ├── patient-list.tsx
│   │   ├── appointment-schedule.tsx
│   │   ├── prescription-form.tsx
│   │   ├── consultation-timer.tsx
│   ├── admin/
│   │   ├── user-management.tsx
│   │   ├── content-editor.tsx
│   │   ├── analytics-dashboard.tsx
│   ├── common/
│   │   ├── auth-guard.tsx
│   │   ├── loading-spinner.tsx
│   │   ├── error-boundary.tsx
│   │   ├── toast.tsx
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── utils.ts
│   ├── validation.ts
│   ├── constants.ts
│   ├── api-client.ts
├── hooks/
│   ├── use-auth.ts
│   ├── use-appointments.ts
│   ├── use-patient.ts
│   ├── use-doctor.ts
│   ├── use-notifications.ts
├── services/
│   ├── appointment-service.ts
│   ├── patient-service.ts
│   ├── doctor-service.ts
│   ├── prescription-service.ts
│   ├── notification-service.ts
│   ├── ai/
│   │   ├── wellness-assistant.ts
│   │   ├── fertility-assistant.ts
│   │   ├── pediatric-assistant.ts
│   │   ├── knowledge-assistant.ts
│   │   ├── consultation-copilot.ts
├── actions/
│   ├── appointment-actions.ts
│   ├── patient-actions.ts
│   ├── doctor-actions.ts
│   ├── auth-actions.ts
│   ├── prescription-actions.ts
├── middleware.ts
├── types/
│   ├── index.ts
│   ├── user.ts
│   ├── appointment.ts
│   ├── prescription.ts
│   ├── consultation.ts
│   ├── ai.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   ├── logo.svg
│   ├── hero-bg.jpg
│   ├── doctors/
│   └── conditions/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
├── .env.example
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## PRISMA SCHEMA

**File: `prisma/schema.prisma`**

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  PATIENT
  DOCTOR
  ADMIN
}

enum Gender {
  MALE
  FEMALE
  OTHER
  PREFER_NOT_TO_SAY
}

enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  RESCHEDULED
}

enum ConsultationType {
  HOMEOPATHY
  PEDIATRICS
  FERTILITY
  WOMENS_WELLNESS
  EMOTIONAL_WELLNESS
  FAMILY_WELLNESS
  PREVENTIVE_CARE
}

enum PrescriptionStatus {
  ACTIVE
  COMPLETED
  DISCONTINUED
  ARCHIVED
}

enum NotificationType {
  APPOINTMENT_REMINDER
  APPOINTMENT_CONFIRMATION
  PRESCRIPTION_READY
  REPORT_AVAILABLE
  MESSAGE
  SYSTEM
}

model User {
  id                    String      @id @default(cuid())
  email                 String      @unique
  emailVerified         DateTime?
  password              String?
  name                  String
  image                 String?
  role                  UserRole    @default(PATIENT)
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  lastLogin             DateTime?
  isActive              Boolean     @default(true)
  
  patientProfile        PatientProfile?
  doctorProfile         DoctorProfile?
  appointments          Appointment[]
  notifications         Notification[]
  auditLogs             AuditLog[]
  consentLogs           ConsentLog[]
  
  @@index([email])
  @@index([role])
}

model PatientProfile {
  id                    String      @id @default(cuid())
  userId                String      @unique
  user                  User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  age                   Int?
  gender                Gender?
  country               String?
  phone                 String?
  address               String?
  bloodType             String?
  allergies             String?
  medicalHistory        String?
  currentMedications    String?
  emergencyContact      String?
  emergencyPhone        String?
  
  familyHistory         String?
  lifestyle             String?
  diet                  String?
  
  profileImage          String?
  preferredLanguage     String      @default("en")
  timezone              String?
  
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  
  appointments          Appointment[]
  consultations         Consultation[]
  prescriptions         Prescription[]
  reports               MedicalReport[]
  
  @@index([userId])
}

model DoctorProfile {
  id                    String      @id @default(cuid())
  userId                String      @unique
  user                  User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  specialization        ConsultationType
  licenseNumber         String      @unique
  licenseExpiry         DateTime
  qualifications        String[]
  experience            Int         // Years
  bio                   String?
  profileImage          String?
  
  consultationFee       Float
  currency              String      @default("USD")
  availableHours        String?     // JSON format for availability
  
  rating                Float       @default(0)
  totalConsultations    Int         @default(0)
  
  isVerified            Boolean     @default(false)
  verificationDate      DateTime?
  
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  
  appointments          Appointment[]
  consultations         Consultation[]
  articles              Article[]
  prescriptions         Prescription[]
  
  @@index([specialization])
  @@index([isVerified])
}

model Appointment {
  id                    String      @id @default(cuid())
  patientId             String
  patient               PatientProfile @relation(fields: [patientId], references: [id], onDelete: Cascade)
  
  doctorId              String
  doctor                DoctorProfile @relation(fields: [doctorId], references: [id])
  
  userId                String
  user                  User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  consultationType      ConsultationType
  status                AppointmentStatus @default(SCHEDULED)
  
  scheduledAt           DateTime
  startedAt             DateTime?
  endedAt               DateTime?
  duration              Int?        // Minutes
  
  concern               String
  notes                 String?
  attachments           String[]    // File URLs
  
  videoCallUrl          String?
  meetingCode           String?
  
  cancellationReason    String?
  cancelledAt           DateTime?
  cancelledBy           String?
  
  reminderSentAt        DateTime?
  
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  
  consultation          Consultation?
  notifications         Notification[]
  auditLog              AuditLog[]
  
  @@index([patientId])
  @@index([doctorId])
  @@index([status])
  @@index([scheduledAt])
}

model Consultation {
  id                    String      @id @default(cuid())
  appointmentId         String      @unique
  appointment           Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  
  patientId             String
  patient               PatientProfile @relation(fields: [patientId], references: [id])
  
  doctorId              String
  doctor                DoctorProfile @relation(fields: [doctorId], references: [id])
  
  notes                 String?
  diagnosis             String?
  observations          String?
  recommendations       String?
  
  vitalSigns            String?     // JSON: BP, HR, Temp, etc.
  symptoms              String[]
  
  startedAt             DateTime
  endedAt               DateTime?
  duration              Int?
  
  recordingUrl          String?
  transcription         String?
  
  aiSummary             String?
  aiInsights            String?
  
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  
  prescriptions         Prescription[]
  reports               MedicalReport[]
  
  @@index([patientId])
  @@index([doctorId])
}

model Prescription {
  id                    String      @id @default(cuid())
  consultationId        String
  consultation          Consultation @relation(fields: [consultationId], references: [id], onDelete: Cascade)
  
  patientId             String
  patient               PatientProfile @relation(fields: [patientId], references: [id])
  
  doctorId              String
  doctor                DoctorProfile @relation(fields: [doctorId], references: [id])
  
  medicine              String
  potency               String?     // For homeopathy
  dosage                String
  frequency             String
  duration              String
  instructions          String?
  
  status                PrescriptionStatus @default(ACTIVE)
  startedAt             DateTime
  endedAt               DateTime?
  
  notes                 String?
  attachments           String[]
  
  issuedAt              DateTime
  expiresAt             DateTime?
  
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  
  @@index([patientId])
  @@index([doctorId])
  @@index([status])
}

model MedicalReport {
  id                    String      @id @default(cuid())
  consultationId        String
  consultation          Consultation @relation(fields: [consultationId], references: [id], onDelete: Cascade)
  
  patientId             String
  patient               PatientProfile @relation(fields: [patientId], references: [id])
  
  doctorId              String
  doctor                DoctorProfile @relation(fields: [doctorId], references: [id])
  
  title                 String
  reportType            String      // lab-report, imaging, diagnosis, etc.
  description           String?
  
  fileUrl               String
  mimeType              String
  fileSize              Int
  
  findings              String?
  recommendations       String?
  
  issuedAt              DateTime
  validUntil            DateTime?
  
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  
  @@index([patientId])
  @@index([doctorId])
}

model Article {
  id                    String      @id @default(cuid())
  doctorId              String
  doctor                DoctorProfile @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  
  categoryId            String
  category              Category    @relation(fields: [categoryId], references: [id])
  
  title                 String
  slug                  String      @unique
  excerpt               String
  content               String      // Rich text
  
  coverImage            String?
  author                String
  
  published             Boolean     @default(false)
  publishedAt           DateTime?
  
  viewCount             Int         @default(0)
  likes                 Int         @default(0)
  
  seoTitle              String?
  seoDescription        String?
  seoKeywords           String[]
  
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  
  @@index([doctorId])
  @@index([slug])
  @@index([published])
}

model Category {
  id                    String      @id @default(cuid())
  name                  String      @unique
  slug                  String      @unique
  description           String?
  icon                  String?
  
  articles              Article[]
  
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
}

model Testimonial {
  id                    String      @id @default(cuid())
  patientName           String
  patientEmail          String?
  patientImage          String?
  
  doctorId              String
  doctor                DoctorProfile @relation("DoctorTestimonials", fields: [doctorId], references: [id], onDelete: Cascade)
  
  rating                Int         // 1-5
  title                 String
  content               String
  
  verified              Boolean     @default(false)
  published             Boolean     @default(false)
  
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  
  @@index([doctorId])
}

model Notification {
  id                    String      @id @default(cuid())
  userId                String
  user                  User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  appointmentId         String?
  appointment           Appointment? @relation(fields: [appointmentId], references: [id], onDelete: SetNull)
  
  type                  NotificationType
  title                 String
  message               String
  
  data                  String?     // JSON payload
  
  read                  Boolean     @default(false)
  readAt                DateTime?
  
  createdAt             DateTime    @default(now())
  
  @@index([userId])
  @@index([read])
}

model ConsentLog {
  id                    String      @id @default(cuid())
  userId                String
  user                  User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  consentType           String      // privacy, terms, data-sharing, etc.
  version               String
  
  accepted              Boolean
  ipAddress             String?
  userAgent             String?
  
  createdAt             DateTime    @default(now())
}

model AuditLog {
  id                    String      @id @default(cuid())
  userId                String
  user                  User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  appointmentId         String?
  appointment           Appointment? @relation(fields: [appointmentId], references: [id], onDelete: SetNull)
  
  action                String      // Created, Updated, Deleted, Viewed
  entity                String      // Appointment, Prescription, Report, etc.
  entityId              String
  
  changes               String?     // JSON diff
  ipAddress             String?
  userAgent             String?
  
  createdAt             DateTime    @default(now())
  
  @@index([userId])
  @@index([action])
  @@index([createdAt])
}
```

---

## ENVIRONMENT VARIABLES

**File: `.env.example`**

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/wellness_platform"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Auth Providers (optional)
GITHUB_ID="your-github-id"
GITHUB_SECRET="your-github-secret"

GOOGLE_CLIENT_ID="your-google-id"
GOOGLE_CLIENT_SECRET="your-google-secret"

# Email Service
RESEND_API_KEY="your-resend-key"

# File Upload
UPLOADTHING_SECRET="your-uploadthing-secret"
UPLOADTHING_APP_ID="your-uploadthing-app-id"

# Cloudflare R2 (optional, for production)
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="wellness-platform"

# AI Services (placeholder)
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"

# Stripe (payments)
STRIPE_SECRET_KEY="your-stripe-key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-publishable-key"

# Environment
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## KEY FILES

### 1. **lib/auth.ts**

```typescript
import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "./db";

const config = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          throw new Error("User not found");
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password || ""
        );

        if (!passwordMatch) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signUp: "/register",
  },
} satisfies NextAuthConfig;

export const { auth, handlers, signIn, signOut } = NextAuth(config);
```

### 2. **lib/db.ts**

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

### 3. **types/index.ts**

```typescript
export type UserRole = "PATIENT" | "DOCTOR" | "ADMIN";
export type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
export type ConsultationType =
  | "HOMEOPATHY"
  | "PEDIATRICS"
  | "FERTILITY"
  | "WOMENS_WELLNESS"
  | "EMOTIONAL_WELLNESS"
  | "FAMILY_WELLNESS"
  | "PREVENTIVE_CARE";
export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "RESCHEDULED";
export type NotificationType =
  | "APPOINTMENT_REMINDER"
  | "APPOINTMENT_CONFIRMATION"
  | "PRESCRIPTION_READY"
  | "REPORT_AVAILABLE"
  | "MESSAGE"
  | "SYSTEM";

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
}

export interface PatientProfile extends User {
  age?: number;
  gender?: Gender;
  country?: string;
  phone?: string;
  medicalHistory?: string;
  allergies?: string;
}

export interface DoctorProfile extends User {
  specialization: ConsultationType;
  licenseNumber: string;
  experience: number;
  rating: number;
  consultationFee: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledAt: Date;
  status: AppointmentStatus;
  concern: string;
  consultationType: ConsultationType;
}

export interface Prescription {
  id: string;
  patientId: string;
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  status: "ACTIVE" | "COMPLETED" | "DISCONTINUED" | "ARCHIVED";
}
```

---

## PACKAGE.JSON

```json
{
  "name": "wellness-platform",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "generate": "prisma generate"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@hookform/resolvers": "^3.3.4",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.4",
    "@prisma/client": "^5.7.0",
    "next-auth": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "resend": "^3.0.0",
    "uploadthing": "^6.0.0",
    "stripe": "^14.0.0",
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-tabs": "^1.0.4",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.1",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.6",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@types/bcryptjs": "^2.4.6",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.1",
    "prisma": "^5.7.0",
    "@tailwindcss/typography": "^0.5.10"
  }
}
```

---

## INSTALLATION

```bash
# 1. Clone or initialize
git clone <repo>
cd wellness-platform

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local
# Edit .env.local with your database URL

# 4. Setup database
npx prisma db push
npx prisma generate

# 5. Run development server
npm run dev

# 6. Visit
# http://localhost:3000
```

---

## DEPLOYMENT CHECKLIST

- [ ] PostgreSQL database hosted (Railway, Supabase, Vercel Postgres)
- [ ] NextAuth configured with production secret
- [ ] Resend email service API key
- [ ] UploadThing for file uploads
- [ ] Stripe keys for payments
- [ ] Environment variables configured on Vercel
- [ ] Database migrations run (`npx prisma migrate deploy`)
- [ ] Build test: `npm run build`
- [ ] Deploy to Vercel

---

## NEXT STEPS

1. Implement API routes in `/app/api/`
2. Create dashboard components
3. Build booking wizard
4. Setup authentication pages
5. Configure Stripe integration
6. Connect email service

**STOP HERE - Awaiting next prompt for Batch 2**
