/**
 * Clinical AI runtime — context-intent answers for patient vs doctor roles.
 */

import { resolveCarePath } from "@/lib/care-path";
import { searchClinicalIntent, topIntent } from "@/lib/intent-search";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function buildPatientReply(userText: string, historyLen: number) {
  const hit = topIntent(userText);
  const path = resolveCarePath(userText);
  const intents = searchClinicalIntent(userText, 3);

  if (path.isEmergency || hit?.intent === "emergency") {
    return `This may be an emergency pattern. Please contact local emergency services / ER now.

${(hit?.patientAnswer || path.firstAid).map((s, i) => `${i + 1}. ${s}`).join("\n")}

This assistant does not replace emergency care.`;
  }

  const opener = hit
    ? `${historyLen > 0 ? "Got it" : "Thanks"} — intent match **${hit.label}**${
        hit.contextHints[0] ? ` (${hit.contextHints[0]})` : ""
      }.`
    : `${historyLen > 0 ? "Got it" : "Thanks"} — routed to **${path.concernLabel}**.`;

  const steps = hit?.patientAnswer || path.firstAid;
  const alts = intents
    .slice(1, 3)
    .map((i) => i.label)
    .join(", ");

  return `${opener}

Why this answer (context search):
${(hit?.whyMatched || ["general wellness tokens"]).map((w) => `• ${w}`).join("\n")}

Immediate self-care suggestions (clinical decision support — not a diagnosis):
${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

${
  path.prep.length
    ? `Before consult:\n${path.prep.map((s, i) => `${i + 1}. ${s}`).join("\n")}`
    : ""
}

Specialty handoff: **${hit?.specialty || path.specialty}**.
Red flags: ${(hit?.redFlags || [path.redFlags]).join("; ")}
${alts ? `\nAlso considered: ${alts}` : ""}

Next: Book specialty consult (/book-appointment) · Structured triage (/ai/symptom-checker) · Between-visit guidance (/ai/wellness-coach)`;
}

function buildDoctorReply(userText: string) {
  const hit = topIntent(userText);
  const path = resolveCarePath(userText);
  const intents = searchClinicalIntent(userText, 3);

  if (hit?.intent === "emergency" || path.isEmergency) {
    return `CLINICIAN ALERT — emergency pattern in notes.

${(hit?.doctorAnswer || []).map((s, i) => `${i + 1}. ${s}`).join("\n")}

Divert to EMS/ER. Do not treat as routine telehealth.`;
  }

  return `Doctor intent analytics for: "${userText}"

Top match: **${hit?.label || path.concernLabel}** (score ${hit?.score?.toFixed(1) || "—"})
Specialty frame: ${hit?.specialty || path.specialty}
Context: ${(hit?.contextHints || ["none detected"]).join("; ")}

Matched because:
${(hit?.whyMatched || ["token overlap"]).map((w) => `• ${w}`).join("\n")}

Clinical actions:
${(hit?.doctorAnswer || path.firstAid).map((s, i) => `${i + 1}. ${s}`).join("\n")}

Differentials to confirm:
${(hit?.differentials || []).map((d) => `• ${d}`).join("\n") || "• Review free text"}

Red flags: ${(hit?.redFlags || [path.redFlags]).join("; ")}

SOAP draft
S: ${userText}
O: Vitals/exam pending
A: ${hit?.label || path.concernLabel} — verify on consult
P: Address comfort steps already shared; document; follow-up under ${hit?.specialty || path.specialty}

Related intents: ${intents.map((i) => i.label).join(" · ") || "none"}
Open patient panel search with this query to pull full dossiers.`;
}

async function tryLiveLLM(messages: ChatMessage[]) {
  if (!process.env.GROQ_API_KEY && process.env.AI_LIVE !== "true") {
    throw new Error("live-llm-disabled");
  }

  if (process.env.GROQ_API_KEY) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        messages,
        temperature: 0.5,
        max_tokens: 550,
      }),
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) throw new Error("groq failed");
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("empty");
    return {
      content: String(content).trim(),
      provider: "groq",
      model: "llama-3.1-8b-instant",
    };
  }

  throw new Error("live-llm-disabled");
}

/** Role-aware clinical assistant (navigator for patients, CDS for clinicians). */
export async function runClinicalAssistantChat(
  userMessage: string,
  history: ChatMessage[] = [],
  opts?: { role?: "patient" | "doctor" }
) {
  const role = opts?.role || "patient";
  const isDoctor =
    role === "doctor" ||
    /assisting a DOCTOR|clinician|SOAP/i.test(userMessage);

  const path = resolveCarePath(userMessage);
  const hit = topIntent(userMessage);
  const fallback = isDoctor
    ? buildDoctorReply(userMessage)
    : buildPatientReply(userMessage, history.length);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: isDoctor
        ? "You are Encounter CDS for licensed clinicians. Context/intent analysis, differentials to consider, red flags, SOAP documentation support. Never claim a diagnosis. Never speak as the patient Symptom Navigator."
        : "You are Symptom Navigator (patient clinical decision support). Context-based self-care suggestions and specialty routing. Never diagnose. Escalate emergencies.",
    },
    ...history.slice(-6),
    { role: "user", content: userMessage },
  ];

  try {
    const live = await tryLiveLLM(messages);
    return {
      content: live.content,
      provider: live.provider,
      model: live.model,
      mode: "live-llm" as const,
      carePath: path,
      intent: hit,
      audience: isDoctor ? "doctor" : "patient",
    };
  } catch {
    return {
      content: fallback,
      provider: "clinical-intent-engine",
      model: isDoctor ? "doctor-intent-v1" : "patient-intent-v1",
      mode: "clinical-engine" as const,
      carePath: path,
      intent: hit,
      audience: isDoctor ? "doctor" : "patient",
    };
  }
}

/** @deprecated use runClinicalAssistantChat */
export const chatWithMahaAI = runClinicalAssistantChat;

export function buildClinicalCopilot(concern: string) {
  const path = resolveCarePath(concern);
  const hit = topIntent(concern);
  return {
    aiSummary: hit
      ? `Intent **${hit.label}** for: "${concern}". Context: ${hit.contextHints.join("; ") || "none"}. Specialty ${hit.specialty}.`
      : `Clinician brief for: "${concern}". Pathway: ${path.concernLabel} → ${path.specialty}.`,
    aiInsights: hit
      ? [
          ...hit.doctorAnswer.slice(0, 3),
          `Differentials: ${hit.differentials.join("; ")}`,
          `Matched via: ${hit.whyMatched.slice(0, 3).join("; ")}`,
        ]
      : [
          `Chief complaint: ${concern}`,
          `First-aid already shared: ${path.firstAid[0]}`,
          `Red flags: ${path.redFlags}`,
        ],
    suggestedSoap: {
      subjective: concern,
      objective: "Vitals and exam pending video intake",
      assessment: hit
        ? `${hit.label} — confirm differentials on consult`
        : `Aligned to ${path.concernLabel} — verify on consult`,
      plan: hit
        ? hit.doctorAnswer[0]
        : `Document comfort steps; follow-up under ${path.specialty}`,
    },
    riskScore: path.isEmergency || hit?.intent === "emergency" ? 0.92 : 0.3,
    model: "encounter-copilot-v2",
    specialty: hit?.specialty || path.specialty,
    firstAidSharedWithPatient: hit?.patientAnswer || path.firstAid,
    intent: hit,
  };
}
