import { gsap } from "@/animations/utils/gsap.config";

export function buildPersonaTimeline(
    container: Element,
    reducedMotion: boolean
): gsap.core.Timeline {
    if (reducedMotion) return gsap.timeline({ defaults: { duration: 0 } });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl
        .set(container, { opacity: 1 })
        .from(".ob-persona-heading", { y: 24, opacity: 0, duration: 0.55 })
        .from(".ob-persona-sub", { y: 12, opacity: 0, duration: 0.4 }, "-=0.2")
        .from(".ob-persona-cards > div", { y: 20, opacity: 0, scale: 0.97, duration: 0.45, stagger: 0.08 }, "-=0.15")
        .from(".ob-service-pills", { y: 12, opacity: 0, duration: 0.4 }, "-=0.1")
        .from(".ob-service-pills button", { opacity: 0, scale: 0.9, duration: 0.25, stagger: 0.04 }, "-=0.2")
        .from(".ob-persona-cta", { y: 8, opacity: 0, duration: 0.3 }, "-=0.1");

    return tl;
}
