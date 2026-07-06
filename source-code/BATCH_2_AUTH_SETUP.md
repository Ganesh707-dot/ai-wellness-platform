# BATCH 2: Authentication Complete

## FILES GENERATED

### 1. Auth Configuration
- **auth.ts** - NextAuth setup with providers (GitHub, Google, Credentials)
- **route-auth.ts** - Auth route handler (app/api/auth/[...nextauth]/route.ts)

### 2. Middleware & RBAC
- **middleware.ts** - Request routing and access control
- **rbac.ts** - Role-based permission system and utilities

### 3. Validation & Types
- **validation-auth.ts** - Zod schemas for login, register, password reset

### 4. Server Actions
- **auth-actions.ts** - Server-side auth operations (login, register, logout)

### 5. Client Hooks
- **use-auth.ts** - React hooks for auth state and actions

### 6. Components
- **auth-provider.tsx** - SessionProvider wrapper
- **auth-guard.tsx** - Protected component wrappers

### 7. Pages
- **page-login.tsx** - Login page (app/(auth)/login/page.tsx)
- **page-register.tsx** - Registration page (app/(auth)/register/page.tsx)
- **page-forgot-password.tsx** - Forgot password page
- **page-unauthorized.tsx** - Unauthorized access page

### 8. API Routes
- **route-profile.ts** - User profile endpoint (app/api/users/profile/route.ts)

---

## INSTALLATION STEPS

### 1. Copy Auth Files

```bash
# Copy auth.ts to root (alongside next.config.ts)
cp auth.ts wellness-platform/

# Copy middleware to root
cp middleware.ts wellness-platform/

# Copy route handler to correct location
mkdir -p wellness-platform/app/api/auth/
cp route-auth.ts wellness-platform/app/api/auth/[...nextauth]/route.ts
```

### 2. Copy Library Files

```bash
# Add to lib/ directory
cp validation-auth.ts wellness-platform/lib/validation.ts
cp rbac.ts wellness-platform/lib/rbac.ts
```

### 3. Copy Actions

```bash
# Add to actions/ directory
mkdir -p wellness-platform/actions/
cp auth-actions.ts wellness-platform/actions/
```

### 4. Copy Hooks

```bash
# Add to hooks/ directory
mkdir -p wellness-platform/hooks/
cp use-auth.ts wellness-platform/hooks/
```

### 5. Copy Components

```bash
# Add to components/
mkdir -p wellness-platform/components/common/
cp auth-provider.tsx wellness-platform/components/
cp auth-guard.tsx wellness-platform/components/common/
```

### 6. Copy Pages

```bash
# Auth pages
mkdir -p wellness-platform/app/\(auth\)/login/
mkdir -p wellness-platform/app/\(auth\)/register/
mkdir -p wellness-platform/app/\(auth\)/forgot-password/

cp page-login.tsx wellness-platform/app/\(auth\)/login/page.tsx
cp page-register.tsx wellness-platform/app/\(auth\)/register/page.tsx
cp page-forgot-password.tsx wellness-platform/app/\(auth\)/forgot-password/page.tsx
cp page-unauthorized.tsx wellness-platform/app/unauthorized/page.tsx
```

### 7. Copy API Routes

```bash
# Profile endpoint
mkdir -p wellness-platform/app/api/users/
cp route-profile.ts wellness-platform/app/api/users/profile/route.ts
```

---

## ENVIRONMENT VARIABLES TO ADD

```bash
# Auth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GITHUB_ID="your-github-id"
GITHUB_SECRET="your-github-secret"
GOOGLE_CLIENT_ID="your-google-id"
GOOGLE_CLIENT_SECRET="your-google-secret"
```

### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

---

## DATABASE SETUP

```bash
# Push Prisma schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Create admin user (optional)
npx prisma db seed
```

---

## ROOT LAYOUT MODIFICATION

Update `app/layout.tsx`:

```tsx
import { AuthProvider } from "@/components/auth-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## USAGE EXAMPLES

### Use Auth Hook in Component

```tsx
"use client";

import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const { user, isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <SignInButton />;
  }

  return (
    <div>
      Welcome, {user?.name}!
      {role === "DOCTOR" && <DoctorMenu />}
      {role === "PATIENT" && <PatientMenu />}
    </div>
  );
}
```

### Protected Page

```tsx
import { requireRole } from "@/lib/rbac";

export default async function PatientDashboard() {
  const session = await requirePatient();

  return (
    <div>
      <h1>Welcome, {session.user?.name}</h1>
    </div>
  );
}
```

### Role Guard Component

```tsx
"use client";

import { RoleGuard } from "@/components/common/auth-guard";

export function AdminPanel() {
  return (
    <RoleGuard roles={["ADMIN"]}>
      <div>Admin content here</div>
    </RoleGuard>
  );
}
```

---

## ROUTE STRUCTURE

### Public Routes
- `/` - Home
- `/login` - Login page
- `/register` - Registration page
- `/forgot-password` - Password reset request
- `/about`, `/services`, `/conditions`, etc.

### Patient Routes (Protected)
- `/dashboard` - Patient dashboard
- `/dashboard/appointments` - View appointments
- `/dashboard/prescriptions` - View prescriptions
- `/dashboard/reports` - Medical reports
- `/dashboard/profile` - Edit profile

### Doctor Routes (Protected)
- `/doctor` - Doctor dashboard
- `/doctor/appointments` - Manage appointments
- `/doctor/patients` - Patient list
- `/doctor/articles` - Manage articles
- `/doctor/prescriptions` - Issue prescriptions

### Admin Routes (Protected)
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/content` - Content management
- `/admin/appointments` - Manage all appointments
- `/admin/settings` - System settings

---

## AUTHENTICATION FLOW

### Login Flow
1. User enters email/password
2. Submitted to server action `loginAction()`
3. NextAuth validates credentials against database
4. JWT token created
5. Session established
6. Redirect to `/dashboard` or role-specific page

### Registration Flow
1. User selects PATIENT or DOCTOR role
2. Multi-step form collects information
3. Password hashed with bcryptjs
4. User record created in database
5. Profile created (PatientProfile or DoctorProfile)
6. Redirect to `/login`

### OAuth Flow
1. User clicks "Sign in with GitHub/Google"
2. Redirected to provider
3. User authorizes app
4. Provider returns profile data
5. Check if user exists
6. Create user if new
7. Session established

---

## PERMISSIONS SYSTEM

### Role-Based Access Control (RBAC)

**PATIENT Permissions:**
- View own dashboard
- Book appointments
- View own prescriptions
- View own medical reports
- Edit own profile
- Cancel appointments
- Rate doctors

**DOCTOR Permissions:**
- View doctor dashboard
- Manage own appointments
- View assigned patients
- Issue prescriptions
- Upload medical reports
- Publish articles
- Manage availability

**ADMIN Permissions:**
- Manage all users
- Manage content
- View all appointments
- Access system settings
- Verify doctors
- Suspend users
- View audit logs

---

## TESTING CREDENTIALS

For local testing, create test users:

```bash
npx prisma db seed
```

Or manually via Prisma Studio:

```bash
npx prisma studio
```

Default test accounts (after seed):
- Patient: patient@test.com / password123
- Doctor: doctor@test.com / password123
- Admin: admin@test.com / password123

---

## SECURITY FEATURES

✅ Password hashing with bcryptjs
✅ JWT token-based sessions
✅ CSRF protection (NextAuth)
✅ Secure HTTP-only cookies
✅ Role-based middleware
✅ Permission checking on server
✅ Audit logging
✅ Consent tracking
✅ Account status validation
✅ Last login tracking

---

## NEXT STEPS

1. Install dependencies: `npm install bcryptjs`
2. Copy all files to correct locations
3. Update `.env.local` with OAuth credentials
4. Run database migrations
5. Test login/registration flows
6. Move to **Batch 3** for API routes and services

---

**BATCH 2 COMPLETE**

Ready for Batch 3? Message: "Generate Batch 3: API Routes and Services"
