"use client";

const animationCache = new Map<string, unknown>();
const animationRequestCache = new Map<string, Promise<unknown>>();

let lottiePlayerModulePromise: Promise<unknown> | null = null;

export function getCachedLottieAnimationData(src: string) {
  return animationCache.get(src) ?? null;
}

export function preloadLottieAnimationData(src: string) {
  const cached = animationCache.get(src);
  if (cached) {
    return Promise.resolve(cached);
  }

  const pending = animationRequestCache.get(src);
  if (pending) {
    return pending;
  }

  const request = fetch(src)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return res.json() as Promise<unknown>;
    })
    .then((data) => {
      animationCache.set(src, data);
      animationRequestCache.delete(src);
      return data;
    })
    .catch((error) => {
      animationRequestCache.delete(src);
      throw error;
    });

  animationRequestCache.set(src, request);
  return request;
}

export function preloadLottieAnimations(srcs: string[]) {
  return Promise.all(srcs.map((src) => preloadLottieAnimationData(src)));
}

export function preloadLottiePlayerModule() {
  if (!lottiePlayerModulePromise) {
    lottiePlayerModulePromise = import("@/components/shared/lottie/LottiePlayer");
  }

  return lottiePlayerModulePromise;
}
