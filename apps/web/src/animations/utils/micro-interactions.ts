import anime from "animejs";

/**
 * Micro-interaction catalogue — Anime.js owns every interaction under 300ms.
 * Rule: if it's a response to user input (hover, press, focus, select) → Anime.js.
 *       if it's a narrative sequence → GSAP.
 */
export const Micro = {
    /** Persona / service card selection pulse */
    cardSelect(el: Element) {
        anime({
            targets: el,
            scale: [1, 1.04, 1],
            duration: 400,
            easing: "spring(1, 80, 12, 0)",
        });
    },

    /** Card hover press-down */
    cardPress(el: Element) {
        anime({ targets: el, scale: 0.97, duration: 100, easing: "linear" });
    },

    /** Card hover press-release spring */
    cardRelease(el: Element) {
        anime({
            targets: el,
            scale: 1,
            duration: 450,
            easing: "spring(1, 80, 10, 0)",
        });
    },

    /** Form field focus glow */
    fieldFocus(el: Element) {
        anime({
            targets: el,
            boxShadow: [
                "0 0 0 0px rgba(15,110,86,0)",
                "0 0 0 3px rgba(15,110,86,0.2)",
            ],
            duration: 200,
            easing: "easeOutQuad",
        });
    },

    /** Form field blur — remove glow */
    fieldBlur(el: Element) {
        anime({
            targets: el,
            boxShadow: "0 0 0 0px rgba(15,110,86,0)",
            duration: 300,
            easing: "easeOutQuad",
        });
    },

    /** Checkbox toggle spring */
    checkToggle(box: Element, checked: boolean) {
        anime({
            targets: box,
            scale: checked ? [1, 1.3, 1] : [1, 0.8, 1],
            duration: 350,
            easing: "spring(1, 80, 10, 0)",
        });
    },

    /** Phase dot morph: circle (8px) → pill (24px) */
    dotMorph(dot: Element, active: boolean) {
        anime({
            targets: dot,
            width: active ? 24 : 8,
            borderRadius: active ? 4 : 100,
            duration: 300,
            easing: "easeOutCubic",
        });
    },

    /** Copy-to-clipboard button success flash */
    copySuccess(el: Element) {
        anime({
            targets: el,
            scale: [1, 1.15, 1],
            duration: 350,
            easing: "spring(1, 80, 10, 0)",
        });
    },

    /** Drop zone / intake link pulsing border (looping) */
    dropZonePulse(el: Element): ReturnType<typeof anime> {
        return anime({
            targets: el,
            borderColor: ["#9FE1CB", "#0F6E56", "#9FE1CB"],
            duration: 1600,
            loop: true,
            easing: "easeInOutSine",
            direction: "alternate",
        });
    },

    /** Color swatch selection pop */
    swatchSelect(el: Element) {
        anime({
            targets: el,
            scale: [1, 1.25, 1.1],
            duration: 300,
            easing: "spring(1, 100, 10, 0)",
        });
    },

    /** Button press spring (mousedown) */
    buttonPress(el: Element) {
        anime({ targets: el, scale: 0.97, duration: 80, easing: "linear" });
    },

    /** Button release spring (mouseup) */
    buttonRelease(el: Element) {
        anime({
            targets: el,
            scale: 1,
            duration: 400,
            easing: "spring(1, 80, 10, 0)",
        });
    },
};
