import Link from "next/link";
import { readFileSync } from "fs";
import path from "path";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { sessionHasPermission } from "@/lib/rbac";
import { StudyGuideAuthBanner } from "@/components/docs/study-guide-auth-banner";
import { BrandWatermark } from "@/components/layout/brand-watermark";

/** Secured study guide — middleware + server auth + RBAC permission. */
export default async function HandsOnGuidePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/docs/hand-on");
  }

  const role = session.user.role;
  const granted = (session.user as { permissions?: string[] }).permissions;

  if (!sessionHasPermission(role, "content:study_guide", granted)) {
    redirect("/unauthorized");
  }

  const guidePath = path.join(process.cwd(), "docs", "HANDS_ON_GUIDE.md");
  let content = "";
  try {
    content = readFileSync(guidePath, "utf8");
  } catch {
    content = "# Guide loading\n\nSee `web/docs/HANDS_ON_GUIDE.md` in the repository.";
  }

  const sections = content.split(/^## /m).filter(Boolean);

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-12">
      <BrandWatermark variant="guide" />
      <Link href="/" className="text-sm text-teal-800 hover:underline">
        ← Home
      </Link>
      <StudyGuideAuthBanner session={session} />
      <h1 className="mt-2 font-serif text-4xl text-stone-900">Hands-On Study Guide</h1>
      <p className="mt-2 text-stone-600">
        Scenario-based flows for full-stack interviews — git, Vercel, live AI, and file map.
        Authorized clinician &amp; admin access only.
      </p>

      <article className="prose prose-stone mt-10 max-w-none prose-headings:font-serif prose-a:text-teal-800">
        {sections.map((block, i) => {
          const [title, ...rest] = block.split("\n");
          const body = rest.join("\n");
          if (i === 0 && !title.includes("\n")) {
            return (
              <div key="intro" className="whitespace-pre-wrap text-sm leading-relaxed">
                {block.replace(/^# .*?\n\n?/, "")}
              </div>
            );
          }
          return (
            <section key={title} className="mt-10 border-t border-stone-200 pt-8">
              <h2 className="text-2xl text-teal-950">{title.trim()}</h2>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
                {body.trim()}
              </div>
            </section>
          );
        })}
      </article>
    </div>
  );
}
