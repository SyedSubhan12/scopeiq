// Ambient module declarations for animation libraries whose shipped types
// do not resolve cleanly under the monorepo's strict TS setup. The packages
// themselves are installed; this just tells TS to treat their imports as `any`.
declare module "gsap/dist/gsap";
declare module "gsap/dist/ScrollTrigger";
declare module "gsap/dist/Flip";
declare module "gsap/dist/Draggable";
declare module "animejs";
