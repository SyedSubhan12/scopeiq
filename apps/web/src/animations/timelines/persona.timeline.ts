import { gsap } from "@/animations/utils/gsap.config";

/**
 * Persona / Service-Type selection step entrance animation.
 * Cards stagger fade-up with a slight scale, icons pop in on top.
 */
export function buildPersonaTimeline(
    container: Element,
    reducedMotion: boolean
): gsap.core.Timeline {
    if (reducedMotion) {
        return gsap.timeline({ defaults: { duration: 0 } });
    }

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    tl
        .set(container, { opacity: 1 })
        .from(".ob-persona-heading", {
            y: 16,
            opacity: 0,
            duration: 0.45,
        })
        .from(
            ".ob-persona-sub",
            { y: 10, opacity: 0, duration: 0.35 },
            "-=0.2"
        )
        .from(
            ".ob-persona-card",
            {
                y: 28,
                opacity: 0,
                scale: 0.96,
                duration: 0.5,
                stagger: 0.07,
            },
            "-=0.2"
        )
        .from(
            ".ob-persona-icon",
            {
                scale: 0,
                duration: 0.3,
                stagger: 0.07,
                ease: "back.out(1.7)",
            },
            "-=0.35"
        );

    return tl;
}
