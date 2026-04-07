"use client";

import { useEffect } from "react";
import { useBootLoader } from "@/providers/boot-loader-provider";

type AssetOptions = {
  scopeId: string;
  enabled?: boolean;
  lottieSrcs?: string[];
  imageSrcs?: string[];
  tasks?: (Promise<unknown> | (() => Promise<unknown> | unknown))[];
  customTasks?: (Promise<unknown> | (() => Promise<unknown> | unknown))[];
};

/**
 * Hook to register critical assets with the BootLoaderProvider.
 * Ensures the app loader stays visible until these assets are ready.
 */
export function useAssetsReady({
  scopeId,
  enabled = true,
  lottieSrcs = [],
  imageSrcs = [],
  tasks = [],
  customTasks = [],
}: AssetOptions) {
  const { registerTasks, isBootReady } = useBootLoader();

  useEffect(() => {
    if (isBootReady || !enabled) return;

    const taskQueue: (Promise<unknown> | (() => Promise<unknown> | unknown))[] = [
      ...tasks,
      ...customTasks,
    ];

    // Track Lottie preloads if any
    if (lottieSrcs.length > 0) {
      taskQueue.push(async () => {
        const { preloadLottieAnimationData } = await import("@/lib/lottie-preload");
        return Promise.all(lottieSrcs.map(src => preloadLottieAnimationData(src)));
      });
    }

    // Track Image preloads if any
    if (imageSrcs.length > 0) {
      taskQueue.push(() => {
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

    return registerTasks(scopeId, taskQueue);
  }, [scopeId, enabled, lottieSrcs, imageSrcs, tasks, customTasks, registerTasks, isBootReady]);
}
