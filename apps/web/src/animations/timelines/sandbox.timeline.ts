import { gsap } from "@/animations/utils/gsap.config";

export function buildSandboxTimeline(
    container: Element,
    reducedMotion: boolean
): gsap.core.Timeline {
    if (reducedMotion) return gsap.timeline({ defaults: { duration: 0 } });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl
        .set(container, { opacity: 1 })
        .from(".ob-pain-heading, .ob-sg-heading, .ob-ap-heading, .ob-bb-heading", { y: 24, opacity: 0, duration: 0.5 })
        .from(".ob-pain-sub", { y: 10, opacity: 0, duration: 0.35 }, "-=0.2")
        .from(".ob-pain-card, .ob-sg-tabs, .ob-ap-form, .ob-bb-templates", {
            y: 18,
            opacity: 0,
            duration: 0.4,
            stagger: 0.07,
        }, "-=0.15")
        .from(".ob-pain-cta, .ob-sg-cta, .ob-ap-cta, .ob-bb-cta", { y: 8, opacity: 0, duration: 0.3 }, "-=0.1");

    return tl;
}
