"use client";

import { MotionValue, motion, useReducedMotion, useTransform } from "framer-motion";
import { LottieFromPublic } from "@/components/shared/lottie/LottieFromPublic";
import { LANDING_LOTTIE } from "@/components/shared/lottie/app-lottie-paths";

const floatTransition = {
  duration: 5.5,
  repeat: Infinity,
  repeatType: "reverse" as const,
  ease: "easeInOut" as const,
};

type FloatingSlotProps = {
  src: string;
  className: string;
  rotate: number;
  delay: number;
  yPx: number;
  scrollYProgress?: MotionValue<number> | undefined;
  depth?: number | undefined;
  shouldAnimate?: boolean;
};

function FloatingSlot({
  src,
  className,
  rotate,
  delay,
  yPx,
  scrollYProgress,
  depth = 1,
  shouldAnimate = true,
}: FloatingSlotProps) {
  const parallaxY = useTransform(scrollYProgress ?? motionValueFallback, [0, 1], [0, depth * 110]);

  return (
    <motion.div
      className={`pointer-events-none absolute z-0 select-none ${className}`}
      style={{ y: parallaxY }}
      aria-hidden
    >
      <motion.div
        initial={false}
        animate={
          shouldAnimate
            ? {
              y: [0, -yPx, 0],
              rotate: [rotate - 3, rotate + 3, rotate - 3],
            }
            : { rotate }
        }
        transition={
          shouldAnimate
            ? {
              ...floatTransition,
              delay,
            }
            : { duration: 0 }
        }
      >
        <LottieFromPublic
          src={src}
          decorative
          loop
          speed={0.9}
          className="h-full w-full object-contain opacity-[0.94] drop-shadow-[0_12px_32px_rgba(15,110,86,0.14)]"
          containerClassName="h-full w-full max-h-full max-w-full"
          reducedMotionFallback={null}
        />
      </motion.div>
    </motion.div>
  );
}

const motionValueFallback = { get: () => 0 } as MotionValue<number>;

/** Hero decoration: one ambient cube system that adds depth without competing with the product story. */
export function HeroFloatingLotties({
  scrollYProgress,
}: {
  scrollYProgress?: MotionValue<number> | undefined;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      aria-hidden
    >
      <FloatingSlot
        src={LANDING_LOTTIE.cubeShape}
        className="left-[-10%] top-[4%] h-44 w-44 sm:left-[-4%] sm:top-[6%] sm:h-52 sm:w-52 md:left-[0%] md:top-[8%] md:h-64 md:w-64 lg:left-[4%] lg:top-[8%] lg:h-72 lg:w-72 xl:h-[21rem] xl:w-[21rem]"
        rotate={-8}
        delay={0}
        yPx={20}
        scrollYProgress={scrollYProgress}
        depth={-0.75}
      />
      <FloatingSlot
        src={LANDING_LOTTIE.developing}
        className="right-[-23%] top-[15%] h-36 w-36 sm:right-[-18%] sm:top-[18%] sm:h-44 sm:w-44 md:right-[-13%] md:top-[20%] md:h-52 md:w-52 lg:right-[-6%] lg:top-[23%] lg:h-72 lg:w-72 xl:right-[0%] xl:h-[22rem] xl:w-[22rem]"
        rotate={3}
        delay={1.2}
        yPx={15}
        scrollYProgress={scrollYProgress}
        depth={-0.6}
        shouldAnimate={false}
      />
      <FloatingSlot
        src={LANDING_LOTTIE.appointmentBookingSmartphone}
        className="!z-20 left-[-6%] top-[52%] h-40 w-40 sm:left-[-4%] sm:top-[55%] sm:h-48 sm:w-48 md:left-[-2%] md:top-[56%] md:h-56 md:w-56 lg:left-[0%] lg:top-[60%] lg:h-72 lg:w-72 xl:left-[2%] xl:top-[60%] xl:h-80 xl:w-80"
        rotate={4}
        delay={0.8}
        yPx={18}
        scrollYProgress={scrollYProgress}
        depth={-0.4}
        shouldAnimate={true}
      />
    </div>
  );
}
