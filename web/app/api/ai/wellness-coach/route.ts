import { NextResponse } from "next/server";
import { runClinicalAssistantChat } from "@/lib/ai-client";
import { runWellnessCoach } from "@/lib/demo-data";
import { z } from "zod";

const schema = z.object({
  prompt: z.string().min(8).max(1000),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = schema.parse(body);
    const structured = runWellnessCoach(prompt);
    const llm = await runClinicalAssistantChat(
      `Create a concise 2-week wellness coaching plan for: ${prompt}`
    );

    return NextResponse.json({
      success: true,
      result: {
        ...structured,
        narrative: llm.content,
        provider: llm.provider,
        model: llm.model,
        mode: llm.mode,
      },
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
