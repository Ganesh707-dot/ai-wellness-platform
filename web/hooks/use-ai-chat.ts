"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { setConversationConcern } from "@/lib/patient-ai-intake";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ChatSessionMeta = {
  provider: string;
  mode: string;
  intentLabel?: string;
  specialty?: string;
  consultationType?: string;
  conversationConcern?: string;
};

type SendOpts = {
  role?: "patient" | "doctor" | "wellness";
  onMeta?: (meta: ChatSessionMeta) => void;
  onSuccess?: (data: Record<string, unknown>) => void;
};

/**
 * Conversational AI hook — refs for stable history, one in-flight request,
 * cumulative concern for booking handoff across turns.
 */
export function useAiChat(initialAssistant: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: initialAssistant },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionMeta, setSessionMeta] = useState<ChatSessionMeta | null>(null);

  const messagesRef = useRef(messages);
  const isLoadingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const send = useCallback(async (text: string, opts?: SendOpts) => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 2) return;
    if (isLoadingRef.current) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const reqId = ++reqIdRef.current;

    const priorHistory = messagesRef.current.slice(1);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          role: opts?.role ?? "patient",
          history: priorHistory.slice(-8),
        }),
        signal: controller.signal,
      });

      if (reqId !== reqIdRef.current) return;

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Request failed");

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content },
      ]);

      const meta: ChatSessionMeta = {
        provider: data.provider,
        mode: data.mode,
        intentLabel: data.intent?.label,
        specialty: data.analytics?.specialty || data.carePath?.specialty,
        consultationType: data.carePath?.consultationType,
        conversationConcern:
          data.conversationConcern ||
          data.analytics?.conversationConcern ||
          trimmed,
      };
      setSessionMeta(meta);
      if (meta.conversationConcern) setConversationConcern(meta.conversationConcern);
      opts?.onMeta?.(meta);
      opts?.onSuccess?.(data);
    } catch {
      if (reqId !== reqIdRef.current) return;
      setError("Request timed out or failed — please retry.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I couldn't finish that reply in time. Please send again — the clinical intent engine responds instantly even without a live model key.",
        },
      ]);
    } finally {
      clearTimeout(timeout);
      if (reqId === reqIdRef.current) {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    reqIdRef.current++;
    isLoadingRef.current = false;
    setIsLoading(false);
    setError(null);
    setSessionMeta(null);
    setMessages([{ role: "assistant", content: initialAssistant }]);
  }, [initialAssistant]);

  return {
    messages,
    send,
    isLoading,
    error,
    reset,
    sessionMeta,
    setMessages,
  };
}
