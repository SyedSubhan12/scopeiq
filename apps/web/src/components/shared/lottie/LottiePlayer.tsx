"use client";

import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { useEffect, useRef } from "react";

type LottiePlayerProps = {
  animationData: unknown;
  className?: string | undefined;
  loop?: boolean | undefined;
  speed?: number | undefined;
};

export function LottiePlayer({
  animationData,
  className,
  loop = true,
  speed = 1,
}: LottiePlayerProps) {
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);

  useEffect(() => {
    lottieRef.current?.setSpeed(speed);
  }, [speed]);

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={animationData}
      loop={loop}
      className={className}
      onDOMLoaded={() => {
        lottieRef.current?.setSpeed(speed);
      }}
    />
  );
}
