import Lenis from "@studio-freight/lenis";
import { gsap } from "./gsap.config";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let lenisInstance: Lenis | null = null;
let tickerCallback: ((time: number) => void) | null = null;

export function initLenis(): Lenis {
    if (lenisInstance) return lenisInstance;

    lenisInstance = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        touchMultiplier: 2,
        syncTouch: true, // For mobile Safari
    });

    // CRITICAL: Sync Lenis scroll position with ScrollTrigger on every frame
    lenisInstance.on("scroll", ScrollTrigger.update);

    // CRITICAL: Hook Lenis RAF into GSAP ticker (not requestAnimationFrame directly)
    tickerCallback = (time: number) => {
        lenisInstance?.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);

    // CRITICAL: Disable GSAP lag smoothing to avoid scroll judder
    gsap.ticker.lagSmoothing(0);

    return lenisInstance;
}

export function getLenis(): Lenis | null {
    return lenisInstance;
}

export function destroyLenis(): void {
    if (tickerCallback) {
        gsap.ticker.remove(tickerCallback);
        tickerCallback = null;
    }
    lenisInstance?.destroy();
    lenisInstance = null;
}
