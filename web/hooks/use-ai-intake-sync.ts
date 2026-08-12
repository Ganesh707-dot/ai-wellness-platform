"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  getDeviceId,
  hydrateAiTranscriptFromServer,
  syncAiIntakeToServer,
} from "@/lib/patient-ai-intake";

/**
 * Hydrates AI transcript from server (Redis) on mount — cross-tab / cross-device
 * when patient is logged in or returns on same device.
 */
export function useAiIntakeSync() {
  const { data: session, status } = useSession();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void hydrateAiTranscriptFromServer(getDeviceId());
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      void hydrateAiTranscriptFromServer(getDeviceId());
    }
  }, [status, session?.user?.email]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void syncAiIntakeToServer(getDeviceId());
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
}
