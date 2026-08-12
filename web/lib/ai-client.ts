/**
 * Clinical AI runtime — intent engine + optional free mini LLMs (Groq / Gemini).
 * Patient: conversational Symptom Navigator. Doctor: intent analytics + CDS.
 */

import { resolveCarePath, type CarePath } from "@/lib/care-path";
import { searchClinicalIntent, topIntent, type IntentHit } from "@/lib/intent-search";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type IntentAnalytics = {
  topIntent: IntentHit | null;
  allIntents: IntentHit[];
  carePath: CarePath;
  specialty: string;
  concernLabel: string;
  whyMatched: string[];
  differentials: string[];
  redFlags: string[];
  patientSteps: string[];
  doctorSteps: string[];
  isEmergency: boolean;
};

/** Merge prior user turns so follow-ups ("for 3 days", "it's my mother") keep specialty context. */
export function buildConversationIntentText(
  userMessage: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = []
): string {
  const current = userMessage.trim();
  const priorUser = history
    .filter((h) => h.role === "user")
    .slice(-4)
    .map((h) => h.content.trim())
    .filter(Boolean);

  if (!priorUser.length) return current;
  if (current.length >= 48) return current;

  return [...priorUser, current].join(". ");
}

export function buildIntentAnalytics(
  text: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = []
): IntentAnalytics {
  const intentText = buildConversationIntentText(text, history);
  const carePath = resolveCarePath(intentText);
  const top = topIntent(intentText);
  const allIntents = searchClinicalIntent(intentText, 4);
  const hit = top || allIntents[0] || null;

  const specialty =
    carePath.intentConfidence && carePath.intentConfidence >= 0.35
      ? carePath.specialty
      : hit?.specialty || carePath.specialty;

  return {
    topIntent: hit,
    allIntents,
    carePath,
    specialty,
    concernLabel:
      carePath.intentConfidence && carePath.intentConfidence >= 0.35
        ? carePath.concernLabel
        : hit?.label || carePath.concernLabel,
    whyMatched:
      carePath.whyMatched?.length
        ? carePath.whyMatched
        : hit?.whyMatched || ["symptom context in free text"],
    differentials: hit?.differentials || [],
    redFlags: hit?.redFlags || [carePath.redFlags],
    patientSteps: hit?.patientAnswer || carePath.firstAid,
    doctorSteps: hit?.doctorAnswer || [],
    isEmergency: Boolean(carePath.isEmergency || hit?.intent === "emergency"),
  };
}

function conversationalPatientReply(
  analytics: IntentAnalytics,
  historyLen: number,
  userMessage: string
) {
  const { topIntent: hit, carePath, patientSteps, specialty } = analytics;
  const snippet = userMessage.trim().slice(0, 120);

  if (analytics.isEmergency) {
    return `This could be urgent — please contact local emergency services or go to the ER now.

While help is on the way:
${patientSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

This assistant is not emergency care.`;
  }

  const greet =
    historyLen > 0
      ? `Got it — building on what you shared about “${snippet}”.`
      : `Thanks for telling me about “${snippet}”.`;

  const pathway = hit && hit.score >= 3
    ? `This sounds like **${hit.label}**, so I'd connect you with **${specialty}** for a video consult.`
    : `I'd start with **${specialty}** (${carePath.concernLabel}) based on how you described it.`;

  const steps = `\n\nHere's what you can do now (guidance only — not a diagnosis):\n${patientSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;

  const prep =
    carePath.prep.length > 0
      ? `\n\nBefore your visit, jot down:\n${carePath.prep.slice(0, 3).map((s, i) => `${i + 1}. ${s}`).join("\n")}`
      : "";

  const flags = `\n\nSee urgent care if: ${analytics.redFlags.join("; ")}`;

  const handoff = `\n\nWhen you're ready, book a **${specialty}** clinician — your chat and intent tags go with the request.`;

  return `${greet} ${pathway}${steps}${prep}${flags}${handoff}`;
}

function conversationalDoctorReply(analytics: IntentAnalytics, userText: string) {
  const hit = analytics.topIntent;
  return `Clinician intent analytics · "${userText.slice(0, 120)}"

Top intent: **${analytics.concernLabel}**${hit ? ` (score ${hit.score.toFixed(1)})` : ""}
Specialty frame: ${analytics.specialty}
Context signals: ${(hit?.contextHints || ["none"]).join("; ")}

Match rationale:
${analytics.whyMatched.map((w) => `• ${w}`).join("\n")}

Suggested clinical actions:
${(analytics.doctorSteps.length ? analytics.doctorSteps : analytics.patientSteps).map((s, i) => `${i + 1}. ${s}`).join("\n")}

Differentials to confirm:
${analytics.differentials.map((d) => `• ${d}`).join("\n") || "• Review free-text concern on video"}

Red flags: ${analytics.redFlags.join("; ")}

SOAP draft
S: ${userText}
O: Vitals/exam pending intake
A: ${analytics.concernLabel} — verify on consult
P: Document comfort steps shared; follow-up under ${analytics.specialty}

Related intents: ${analytics.allIntents.map((i) => i.label).join(" · ") || "none"}`;
}

function intentSystemPrompt(
  analytics: IntentAnalytics,
  audience: "patient" | "doctor"
) {
  const base =
    audience === "doctor"
      ? "You are Encounter CDS for licensed clinicians. Use the intent analytics below. Never diagnose. Be concise and actionable."
      : "You are Symptom Navigator — warm, conversational clinical decision support for patients. Reply in the same language the patient uses (English, Hindi, or mixed). Never diagnose. Give practical self-care steps and when to escalate. Sound natural, not like a template.";

  return `${base}

INTENT CONTEXT (from clinical engine — trust this):
- Concern label: ${analytics.concernLabel}
- Specialty: ${analytics.specialty}
- Emergency: ${analytics.isEmergency}
- Why matched: ${analytics.whyMatched.join("; ")}
- Patient steps: ${analytics.patientSteps.join(" | ")}
- Red flags: ${analytics.redFlags.join("; ")}
- Differentials: ${analytics.differentials.join("; ") || "review on consult"}`;
}

export function isLiveLlmConfigured() {
  return Boolean(
    process.env.GROQ_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY
  );
}

async function tryGroq(messages: ChatMessage[]) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages,
        temperature: 0.65,
        max_tokens: 700,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;
    return {
      content: String(content).trim(),
      provider: "groq",
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    };
  } catch {
    return null;
  }
}

async function tryGemini(messages: ChatMessage[]) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) return null;

  const system = messages.find((m) => m.role === "system")?.content || "";
  const turns = messages.filter((m) => m.role !== "system");
  const contents = turns.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-1.5-flash"}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        contents,
        generationConfig: { temperature: 0.55, maxOutputTokens: 650 },
      }),
      signal: AbortSignal.timeout(12000),
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) return null;
  return {
    content: String(content).trim(),
    provider: "gemini",
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  };
}

async function tryLiveLLM(messages: ChatMessage[]) {
  const groq = await tryGroq(messages);
  if (groq) return groq;
  const gemini = await tryGemini(messages);
  if (gemini) return gemini;
  return null;
}

/** Fast path: intent engine always returns within one tick; LLM enriches when keys exist. */
export async function runClinicalAssistantChat(
  userMessage: string,
  history: ChatMessage[] = [],
  opts?: { role?: "patient" | "doctor" | "wellness" }
) {
  const role = opts?.role || "patient";
  const isDoctor =
    role === "doctor" ||
    /assisting a DOCTOR|clinician|SOAP/i.test(userMessage);

  const analytics = buildIntentAnalytics(
    userMessage,
    history.filter(
      (h): h is { role: "user" | "assistant"; content: string } =>
        h.role === "user" || h.role === "assistant"
    )
  );
  const hit = analytics.topIntent;
  const path = analytics.carePath;
  const conversationConcern = buildConversationIntentText(userMessage, history);

  const fallback = isDoctor
    ? conversationalDoctorReply(analytics, userMessage)
    : conversationalPatientReply(
        analytics,
        history.filter((h) => h.role === "user").length,
        userMessage
      );

  const audience = isDoctor ? "doctor" : "patient";
  const wellnessExtra =
    role === "wellness"
      ? " Focus on sleep, stress, gentle 2-week habits between visits — still not a diagnosis."
      : "";

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: intentSystemPrompt(analytics, audience) + wellnessExtra,
    },
    ...history
      .filter((h) => h.role === "user" || h.role === "assistant")
      .slice(-8)
      .map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
    { role: "user", content: userMessage },
  ];

  const llmTimeout = isLiveLlmConfigured() ? 14000 : 0;
  const livePromise = tryLiveLLM(messages);
  const live = llmTimeout
    ? await Promise.race([
        livePromise,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), llmTimeout)),
      ])
    : await livePromise;

  if (live) {
    return {
      content: live.content,
      provider: live.provider,
      model: live.model,
      mode: "live-llm" as const,
      carePath: path,
      intent: hit,
      analytics,
      audience,
      conversationConcern,
    };
  }

  return {
    content: fallback,
    provider: "clinical-intent-engine",
    model: isDoctor ? "doctor-intent-v2" : "patient-intent-v2",
    mode: "clinical-engine" as const,
    carePath: path,
    intent: hit,
    analytics,
    audience,
    conversationConcern,
  };
}

/** @deprecated use runClinicalAssistantChat */
export const chatWithMahaAI = runClinicalAssistantChat;

export function buildClinicalCopilot(concern: string) {
  const analytics = buildIntentAnalytics(concern);
  const hit = analytics.topIntent;
  return {
    aiSummary: hit
      ? `Intent **${hit.label}** (score ${hit.score.toFixed(1)}) for: "${concern}". Context: ${hit.contextHints.join("; ") || "none"}. Specialty ${analytics.specialty}.`
      : `Clinician brief for: "${concern}". Pathway: ${analytics.concernLabel} → ${analytics.specialty}.`,
    aiInsights: hit
      ? [
          ...hit.doctorAnswer.slice(0, 3),
          `Differentials: ${hit.differentials.join("; ")}`,
          `Matched via: ${hit.whyMatched.slice(0, 3).join("; ")}`,
          `Context: ${hit.contextHints.join("; ") || "general presentation"}`,
        ]
      : [
          `Chief complaint: ${concern}`,
          `First-aid shared: ${analytics.patientSteps[0]}`,
          `Red flags: ${analytics.redFlags.join("; ")}`,
        ],
    suggestedSoap: {
      subjective: concern,
      objective: "Vitals and exam pending video intake",
      assessment: hit
        ? `${hit.label} — confirm differentials on consult`
        : `Aligned to ${analytics.concernLabel} — verify on consult`,
      plan: hit
        ? hit.doctorAnswer[0] || `Follow-up under ${analytics.specialty}`
        : `Document comfort steps; follow-up under ${analytics.specialty}`,
    },
    riskScore: analytics.isEmergency ? 0.92 : hit && hit.score >= 8 ? 0.55 : 0.3,
    model: "encounter-copilot-v3",
    specialty: analytics.specialty,
    firstAidSharedWithPatient: analytics.patientSteps,
    intent: hit,
    analytics,
  };
}
