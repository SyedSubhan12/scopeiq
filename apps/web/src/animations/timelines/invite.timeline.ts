import { gsap } from "@/animations/utils/gsap.config";

export function buildInviteTimeline(
    container: Element,
    reducedMotion: boolean
): gsap.core.Timeline {
    if (reducedMotion) return gsap.timeline({ defaults: { duration: 0 } });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl
        .set(container, { opacity: 1 })
        .from(".ob-invite-heading", { y: 24, opacity: 0, duration: 0.5 })
        .from(".ob-invite-team-section", { y: 16, opacity: 0, duration: 0.4 }, "-=0.2")
        .from(".ob-invite-client-section", { y: 12, opacity: 0, duration: 0.35 }, "-=0.15")
        .from(".ob-invite-cta", { y: 8, opacity: 0, duration: 0.3 }, "-=0.1");

    return tl;
}
