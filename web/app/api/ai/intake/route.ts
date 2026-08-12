import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import {
  loadAiIntake,
  mergeAiIntake,
  aiIntakeStoreEnabled,
  type AiIntakePacket,
} from "@/lib/ai-intake-server";

const turnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(4000),
  intentLabel: z.string().optional(),
  specialty: z.string().optional(),
  intentScore: z.number().optional(),
  whyMatched: z.array(z.string()).optional(),
  mode: z.string().optional(),
  at: z.string().optional(),
});

const postSchema = z.object({
  deviceId: z.string().min(8).max(80),
  turns: z.array(turnSchema).max(24),
  conversationConcern: z.string().max(2000).optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("deviceId") || "";
  const email = session?.user?.email?.toLowerCase();

  const ids = [email && `email:${email}`, deviceId && `device:${deviceId}`].filter(
    Boolean
  ) as string[];

  if (!ids.length) {
    return NextResponse.json({
      success: true,
      packet: null,
      serverSync: aiIntakeStoreEnabled(),
    });
  }

  let best: AiIntakePacket | null = null;
  for (const id of ids) {
    const packet = await loadAiIntake(id);
    if (
      packet &&
      (!best || packet.turns.length >= best.turns.length)
    ) {
      best = packet;
    }
  }

  return NextResponse.json({
    success: true,
    packet: best,
    serverSync: aiIntakeStoreEnabled(),
  });
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = postSchema.parse(await request.json());
    const email = session?.user?.email?.toLowerCase();

    const packet: AiIntakePacket = {
      turns: body.turns.map((t) => ({
        ...t,
        at: t.at || new Date().toISOString(),
      })),
      conversationConcern: body.conversationConcern,
      updatedAt: new Date().toISOString(),
    };

    const deviceKey = `device:${body.deviceId}`;
    await mergeAiIntake(deviceKey, packet);
    if (email) await mergeAiIntake(`email:${email}`, packet);

    return NextResponse.json({
      success: true,
      serverSync: aiIntakeStoreEnabled(),
      turnCount: packet.turns.length,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Intake sync failed",
      },
      { status: 400 }
    );
  }
}
