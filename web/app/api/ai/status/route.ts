import { NextResponse } from "next/server";
import { isLiveLlmConfigured } from "@/lib/ai-client";

/** Public check: is a live LLM key configured on this deployment? */
export async function GET() {
  const groq = Boolean(process.env.GROQ_API_KEY);
  const gemini = Boolean(
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  );
  return NextResponse.json({
    liveLlm: isLiveLlmConfigured(),
    providers: { groq, gemini },
    hint: isLiveLlmConfigured()
      ? "Live AI model available on this deployment."
      : "No GROQ_API_KEY or GEMINI_API_KEY on server — using clinical intent engine fallback. Add a free Groq key in Vercel env for natural LLM replies.",
  });
}
