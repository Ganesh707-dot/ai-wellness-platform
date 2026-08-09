import Link from "next/link";
import { AuthProvider } from "@/components/auth-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { APP_NAME, APP_TAGLINE } from "@/lib/app-brand";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description:
    "Telehealth referral platform with RBAC workspaces, encounter handoff, and clinical decision support (CDS). Not a medical diagnosis service.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sans.variable} ${display.variable} min-h-screen bg-[#f4f7f4] text-stone-900 antialiased`}
      >
        <AuthProvider>
          <SiteHeader />
          <main>{children}</main>
          <footer className="mt-20 border-t border-stone-200 bg-[#eef3ef]">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 text-sm text-stone-600 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-[family-name:var(--font-display)] text-lg text-teal-950">
                  {APP_NAME}
                </p>
                <p className="mt-1 max-w-md">
                  Telehealth referral with clinical decision support — Auth.js
                  RBAC, encounter handoff, and CDS tools (not a diagnosis
                  service).
                </p>
              </div>
              <div className="flex gap-4">
                <Link href="/guest">Guest intake</Link>
                <Link href="/ai/concierge">Symptom Navigator</Link>
                <Link href="/privacy">Privacy</Link>
                <Link href="/terms">Terms</Link>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
