import { NextResponse } from "next/server";
import { runClinicalAssistantChat } from "@/lib/ai-client";
import { z } from "zod";

const schema = z.object({
  message: z.string().min(2).max(2000),
  role: z.enum(["patient", "doctor", "wellness"]).optional().default("patient"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, history, role } = schema.parse(body);
    const result = await runClinicalAssistantChat(message, history, { role });
    return NextResponse.json({
      success: true,
      content: result.content,
      provider: result.provider,
      model: result.model,
      mode: result.mode,
      carePath: result.carePath,
      intent: result.intent,
      analytics: result.analytics,
      audience: result.audience,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Chat failed",
      },
      { status: 400 }
    );
  }
}
