"use client";

import { useEffect } from "react";
import { useBootLoader } from "@/providers/boot-loader-provider";

type AssetOptions = {
  scopeId: string;
  lottieSrcs?: string[];
  imageSrcs?: string[];
  customTasks?: (Promise<unknown> | (() => Promise<unknown> | unknown))[];
};

/**
 * Hook to register critical assets with the BootLoaderProvider.
 * Ensures the app loader stays visible until these assets are ready.
 */
export function useAssetsReady({
  scopeId,
  lottieSrcs = [],
  imageSrcs = [],
  customTasks = [],
}: AssetOptions) {
  const { registerTasks, isBootReady } = useBootLoader();

  useEffect(() => {
    if (isBootReady) return;

    const tasks: (Promise<unknown> | (() => Promise<unknown> | unknown))[] = [
      ...customTasks,
    ];

    // Track Lottie preloads if any
    if (lottieSrcs.length > 0) {
      tasks.push(async () => {
        const { preloadLottieAnimationData } = await import("@/lib/lottie-preload");
        return Promise.all(lottieSrcs.map(src => preloadLottieAnimationData(src)));
      });
    }

    // Track Image preloads if any
    if (imageSrcs.length > 0) {
      tasks.push(() => {
        return Promise.all(
          imageSrcs.map((src) => {
            return new Promise((resolve) => {
              const img = new Image();
              img.src = src;
              img.onload = resolve;
              img.onerror = resolve; // Don't block forever if image fails
            });
          })
        );
      });
    }

    return registerTasks(scopeId, tasks);
  }, [scopeId, lottieSrcs, imageSrcs, customTasks, registerTasks, isBootReady]);
}
