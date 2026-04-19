"use client";

import { gsap } from "./gsap.config";
import { getLenis } from "./lenis.config";
// import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Barba.js Page Transition Orchestrator.
 * Handles the "moment between worlds" — transitioning from Onboarding to Dashboard.
 * 
 * Note: Barba and Next.js require careful syncing of the DOM. 
 * We use Barba's hooks to trigger GSAP transitions between page containers.
 */
export async function initBarba() {
    if (typeof window === "undefined") return;

    // Dynamic import to avoid SSR ReferenceError: Element is not defined
    const { default: barba } = await import("@barba/core");

    barba.init({
        transitions: [
            {
                name: "onboarding-to-dashboard",
                from: { custom: ({ trigger }: any) => (trigger as HTMLElement)?.dataset?.barbaNamespace === "onboarding" },
                to: { custom: ({ trigger }: any) => (trigger as HTMLElement)?.dataset?.barbaNamespace === "dashboard" },

                async leave(data: any) {
                    const tl = gsap.timeline();
                    await tl
                        .to(data.current.container, {
                            scale: 0.96,
                            opacity: 0,
                            duration: 0.4,
                            ease: "power2.in",
                        })
                        .to(".ob-logo-mark", {
                            scale: 20,
                            opacity: 0,
                            duration: 0.6,
                            ease: "power3.in",
                            transformOrigin: "center",
                        }, "-=0.2")
                        .promise();
                },

                async enter(data: any) {
                    // Reset Lenis scroll position instantly
                    getLenis()?.scrollTo(0, { immediate: true });

                    const tl = gsap.timeline();
                    await tl
                        .fromTo(data.next.container,
                            { opacity: 0, y: 30 },
                            { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
                        )
                        .from("[data-dashboard-panel]", {
                            y: 20,
                            opacity: 0,
                            stagger: 0.06,
                            duration: 0.4,
                            ease: "power2.out",
                        }, "-=0.2")
                        .promise();
                },
            },
            {
                name: "default",
                async leave(data: any) {
                    await gsap.to(data.current.container, {
                        opacity: 0,
                        duration: 0.25,
                        ease: "power2.in",
                    }).then();
                },
                async enter(data: any) {
                    await gsap.from(data.next.container, {
                        opacity: 0,
                        duration: 0.3,
                        ease: "power2.out",
                    }).then();
                },
            },

        ],

        views: [
            {
                namespace: "onboarding",
                afterEnter() {
                    // Stop Lenis during onboarding (wizard mode = no scroll)
                    getLenis()?.stop();
                },
            },
            {
                namespace: "dashboard",
                afterEnter() {
                    getLenis()?.start();
                    // Re-init all ScrollTriggers for new DOM
                    // ScrollTrigger.refresh();
                },
            },
        ],
    });
}
