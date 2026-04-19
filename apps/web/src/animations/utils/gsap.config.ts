import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register core plugins eagerly (always needed)
gsap.registerPlugin(ScrollTrigger);

// Configure global GSAP defaults
gsap.config({
    force3D: true,         // always use GPU layers for transforms
    nullTargetWarn: false, // silence missing-element warnings in dev
});

// Sensible global defaults for all tweens unless overridden
gsap.defaults({
    ease: "power3.out",
    duration: 0.4,
});

export { gsap, ScrollTrigger };

/** Lazy-load DrawSVGPlugin — only needed on the completion screen */
export async function loadDrawSVG() {
    try {
        const { DrawSVGPlugin } = await import("gsap/DrawSVGPlugin");
        gsap.registerPlugin(DrawSVGPlugin);
        return DrawSVGPlugin;
    } catch {
        console.warn("[GSAP] DrawSVGPlugin not available — is it in your GSAP bundle?");
        return null;
    }
}

/** Lazy-load SplitText — only needed on the welcome headline */
export async function loadSplitText() {
    try {
        const { SplitText } = await import("gsap/SplitText");
        gsap.registerPlugin(SplitText);
        return SplitText;
    } catch {
        console.warn("[GSAP] SplitText not available — is it in your GSAP bundle?");
        return null;
    }
}
