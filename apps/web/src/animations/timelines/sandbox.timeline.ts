import { gsap } from "@/animations/utils/gsap.config";

/**
 * Demo Sandbox step entrance animation.
 * Headline → sub → mini stepper → content panel.
 */
export function buildSandboxTimeline(
    container: Element,
    reducedMotion: boolean
): gsap.core.Timeline {
    if (reducedMotion) {
        return gsap.timeline({ defaults: { duration: 0 } });
    }

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl
        .set(container, { opacity: 1 })
        .from(".ob-sandbox-heading", {
            y: 18,
            opacity: 0,
            duration: 0.45,
        })
        .from(
            ".ob-sandbox-sub",
            { y: 10, opacity: 0, duration: 0.35 },
            "-=0.2"
        )
        .from(
            ".ob-sandbox-stepper",
            { y: 12, opacity: 0, duration: 0.4 },
            "-=0.15"
        )
        .from(
            ".ob-sandbox-panel",
            {
                y: 20,
                opacity: 0,
                scale: 0.98,
                duration: 0.45,
                ease: "power2.out",
            },
            "-=0.2"
        );

    return tl;
}
