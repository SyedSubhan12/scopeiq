import { gsap } from "@/animations/utils/gsap.config";

/**
 * Brief link / Workspace step entrance animation.
 * Icon → headline → link box → value prop → CTA.
 */
export function buildWorkspaceTimeline(
    container: Element,
    reducedMotion: boolean
): gsap.core.Timeline {
    if (reducedMotion) {
        return gsap.timeline({ defaults: { duration: 0 } });
    }

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl
        .set(container, { opacity: 1 })
        .from(".ob-workspace-icon", {
            scale: 0,
            opacity: 0,
            duration: 0.45,
            ease: "back.out(1.7)",
        })
        .from(
            ".ob-workspace-heading",
            { y: 16, opacity: 0, duration: 0.4 },
            "-=0.15"
        )
        .from(
            ".ob-workspace-sub",
            { y: 10, opacity: 0, duration: 0.35 },
            "-=0.2"
        )
        .from(
            ".ob-workspace-linkbox",
            { y: 14, opacity: 0, duration: 0.4, ease: "power2.out" },
            "-=0.15"
        )
        .from(
            ".ob-workspace-valueprop",
            { y: 12, opacity: 0, duration: 0.35 },
            "-=0.2"
        )
        .from(
            ".ob-workspace-cta",
            { y: 8, opacity: 0, duration: 0.3 },
            "-=0.1"
        );

    return tl;
}
