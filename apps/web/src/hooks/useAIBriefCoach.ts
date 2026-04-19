"use client";

import { useCallback, useRef, useState } from "react";

export interface BriefCoachHint {
  hint: string;
  tone: "tip" | "warning" | "praise";
}

const FALLBACK_HINTS: Record<string, BriefCoachHint> = {
  project_goals: {
    hint: "Try stating the single measurable outcome this project must achieve.",
    tone: "tip",
  },
  target_audience: {
    hint: "Be specific — who exactly is this for and what do they need from this?",
    tone: "tip",
  },
  deliverables: {
    hint: "List each deliverable separately so scope is unambiguous.",
    tone: "warning",
  },
  timeline: {
    hint: "Include key milestones, not just a final deadline.",
    tone: "tip",
  },
  budget: {
    hint: "Providing a budget range helps set realistic expectations upfront.",
    tone: "tip",
  },
  default: {
    hint: "Add more detail here to improve your brief clarity score.",
    tone: "tip",
  },
};

function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

export function useAIBriefCoach(fieldKey: string) {
  const [hint, setHint] = useState<BriefCoachHint | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cacheRef = useRef<Map<string, BriefCoachHint>>(new Map());

  const fetchHint = useCallback(
    async (value: string) => {
      if (value.length < 20) {
        setHint(null);
        return;
      }

      const cacheKey = `${fieldKey}:${simpleHash(value)}`;
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        setHint(cached);
        return;
      }

      setLoading(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch("/api/v1/briefs/coach-hint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fieldKey, value }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = (await response.json()) as { data: BriefCoachHint };
          cacheRef.current.set(cacheKey, data.data);
          setHint(data.data);
        } else {
          setHint(FALLBACK_HINTS[fieldKey] ?? FALLBACK_HINTS.default ?? null);
        }
      } catch {
        setHint(FALLBACK_HINTS[fieldKey] ?? FALLBACK_HINTS.default ?? null);
      } finally {
        setLoading(false);
      }
    },
    [fieldKey],
  );

  const onValueChange = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void fetchHint(value);
      }, 1000);
    },
    [fetchHint],
  );

  return { hint, loading, onValueChange };
}
