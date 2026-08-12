import { AuthProvider } from "@/components/auth-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
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
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
