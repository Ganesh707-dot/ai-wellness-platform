import { NextResponse } from "next/server";
import { runClinicalAssistantChat } from "@/lib/ai-client";
import { runWellnessCoach } from "@/lib/demo-data";
import { z } from "zod";

const schema = z.object({
  prompt: z.string().min(8).max(1000),
  /** When true, returns structured plan + conversational narrative */
  withPlan: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, withPlan } = schema.parse(body);
    const structured = withPlan !== false ? runWellnessCoach(prompt) : null;
    const llm = await runClinicalAssistantChat(prompt, [], { role: "wellness" });

    return NextResponse.json({
      success: true,
      content: llm.content,
      provider: llm.provider,
      model: llm.model,
      mode: llm.mode,
      intent: llm.intent,
      analytics: llm.analytics,
      result: structured
        ? {
            ...structured,
            narrative: llm.content,
            provider: llm.provider,
            model: llm.model,
            mode: llm.mode,
          }
        : undefined,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Invalid request",
      },
      { status: 400 }
    );
  }
}
