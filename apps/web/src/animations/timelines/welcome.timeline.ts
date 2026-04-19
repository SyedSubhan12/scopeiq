import { gsap } from "@/animations/utils/gsap.config";

/**
 * Welcome / Name Workspace step entrance animation.
 * Staggered reveal: icon → headline → sub-text → input field.
 */
export function buildWelcomeTimeline(
    container: Element,
    reducedMotion: boolean
): gsap.core.Timeline {
    if (reducedMotion) {
        return gsap.timeline({ defaults: { duration: 0 } });
    }

    const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
    });

    tl
        .set(container, { opacity: 1 })
        .from(".ob-welcome-icon", {
            scale: 0,
            opacity: 0,
            duration: 0.45,
            ease: "back.out(1.7)",
        })
        .from(
            ".ob-welcome-heading",
            { y: 18, opacity: 0, duration: 0.5 },
            "-=0.15"
        )
        .from(
            ".ob-welcome-sub",
            { y: 12, opacity: 0, duration: 0.4 },
            "-=0.2"
        )
        .from(
            ".ob-welcome-field",
            { y: 10, opacity: 0, duration: 0.35 },
            "-=0.15"
        )
        .from(
            ".ob-welcome-cta",
            { y: 8, opacity: 0, duration: 0.3 },
            "-=0.1"
        );

    return tl;
}
