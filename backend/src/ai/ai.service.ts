import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatRequestDto } from './dto/chat-request.dto';

type GroqMessage = { role: 'system' | 'user' | 'assistant'; content: string };

const SYSTEM_PROMPTS: Record<string, string> = {
  patient:
    'You are Veridian Clinical Symptom Navigator — empathetic, concise, safety-first. Never diagnose. Encourage booking a clinician. Flag emergencies.',
  doctor:
    'You are Veridian Clinical Consultation Copilot — structured CDS-style support for licensed clinicians. Suggest differentials, red flags, and documentation prompts.',
  concierge:
    'You are Veridian Clinical Concierge — help patients navigate services, specialties, and booking.',
  wellness:
    'You are Veridian Wellness Coach — lifestyle, preventive care, and holistic wellness guidance. Not medical diagnosis.',
};

@Injectable()
export class AiService {
  constructor(private readonly config: ConfigService) {}

  async chat(dto: ChatRequestDto) {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    const model = this.config.get<string>('GROQ_MODEL') ?? 'llama-3.3-70b-versatile';
    const mode = dto.mode ?? 'patient';

    if (!apiKey) {
      return {
        reply: this.fallbackReply(dto.message, mode),
        liveLlm: false,
        model: 'fallback',
        mode,
      };
    }

    const messages: GroqMessage[] = [
      { role: 'system', content: SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.patient },
      ...(dto.history ?? []).map((m) => ({
        role: m.role as GroqMessage['role'],
        content: m.content,
      })),
      { role: 'user', content: dto.message },
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.4,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new ServiceUnavailableException(`Groq API error: ${response.status} ${detail}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const reply =
      data.choices?.[0]?.message?.content?.trim() ??
      'I could not generate a response. Please try again or book a clinician.';

    return { reply, liveLlm: true, model, mode };
  }

  status() {
    const groqConfigured = Boolean(this.config.get<string>('GROQ_API_KEY'));
    return {
      liveLlm: groqConfigured,
      groqModel: this.config.get<string>('GROQ_MODEL') ?? 'llama-3.3-70b-versatile',
      provider: 'groq',
    };
  }

  private fallbackReply(message: string, mode: string) {
    const snippet = message.trim().slice(0, 80);
    if (mode === 'doctor') {
      return `Clinical copilot (offline mode): Review "${snippet}" — document chief complaint, vitals, differentials, and red flags. Configure GROQ_API_KEY for live LLM.`;
    }
    return `Thanks for sharing "${snippet}". I recommend booking a video consult with a Veridian clinician. Configure GROQ_API_KEY for live AI responses.`;
  }
}
