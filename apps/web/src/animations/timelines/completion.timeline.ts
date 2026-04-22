import { gsap } from "@/animations/utils/gsap.config";

export function buildCompletionTimeline(
    container: Element,
    reducedMotion: boolean
): gsap.core.Timeline {
    if (reducedMotion) return gsap.timeline({ defaults: { duration: 0 } });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl
        .set(container, { opacity: 1 })
        .from(".ob-complete-heading", { scale: 0.95, opacity: 0, duration: 0.6, ease: "back.out(1.4)" })
        .from(".ob-complete-checklist", { y: 20, opacity: 0, duration: 0.5 }, "-=0.2")
        .from(".ob-complete-checklist > * > div", { x: -12, opacity: 0, duration: 0.3, stagger: 0.06 }, "-=0.2")
        .from(".ob-complete-action", { y: 16, opacity: 0, duration: 0.45 }, "-=0.1")
        .from(".ob-complete-cta", { y: 10, opacity: 0, scale: 0.97, duration: 0.4, ease: "back.out(1.5)" }, "-=0.1");

    return tl;
}
