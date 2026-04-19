import { useMutation } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

export interface SoftAskHintResult {
  suggestion: string;
  confidence: number;
}

const FALLBACK_HINTS: Record<string, string> = {
  high: "That sounds outside our current scope — I'd like to put together a formal change order before we proceed.",
  medium: "Happy to help with that! Let me check our SOW and come back with a quick quote.",
  low: "That sounds great — I'll put together a quick quote so we can move forward.",
};

export function useSoftAskHint(flagId: string, severity: string) {
  return useMutation<SoftAskHintResult, Error>({
    mutationFn: async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      try {
        const result = await fetchWithAuth(`/api/scope-flags/${flagId}/soft-ask`, {
          method: "POST",
          signal: controller.signal,
        }) as SoftAskHintResult;
        return result;
      } catch {
        // Fallback to local hint by severity
        return {
          suggestion: FALLBACK_HINTS[severity] ?? FALLBACK_HINTS.low ?? "I'll put together a quick quote.",
          confidence: 0.6,
        };
      } finally {
        clearTimeout(timeout);
      }
    },
  });
}
