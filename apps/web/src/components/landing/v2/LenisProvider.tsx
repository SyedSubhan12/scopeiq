"use client";

import { useLenisScroll } from "@/hooks/useLenisScroll";

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useLenisScroll({ desktopOnly: true, syncWithGsap: true, duration: 1.2, lerp: 0.1 });
  return <>{children}</>;
}
