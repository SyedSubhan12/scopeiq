import { gsap } from "@/animations/utils/gsap.config";

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
        .from(".ob-ws-heading", { y: 24, opacity: 0, duration: 0.5 })
        .from(".ob-ws-name-field", { y: 16, opacity: 0, duration: 0.4 }, "-=0.2")
        .from(".ob-ws-color-row", { y: 12, opacity: 0, duration: 0.35 }, "-=0.15")
        .from(".ob-ws-logo-zone", { y: 10, opacity: 0, duration: 0.35 }, "-=0.15")
        .from(".ob-ws-cta", { y: 8, opacity: 0, duration: 0.3 }, "-=0.1");

    return tl;
}
