import React, { useMemo, useRef } from "react";
import { motion, useInView } from "framer-motion";

/**
 * ShimmeringText Component for CRA
 */
export function ShimmeringText({
  text,
  duration = 2,
  delay = 0,
  repeat = true,
  repeatDelay = 0.5,
  className,
  startOnView = true,
  once = false,
  inViewMargin,
  spread = 2,
  color = "#666666", // Default muted color
  shimmerColor = "#000000", // Default highlight color
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: inViewMargin });

  const dynamicSpread = useMemo(() => {
    return text.length * spread;
  }, [text, spread]);

  const shouldAnimate = !startOnView || isInView;

  // Manual styles to replace Tailwind classes
  const baseStyles = {
    display: "inline-block",
    position: "relative",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    color: "transparent",
    backgroundSize: "250% 100%, auto",
    backgroundRepeat: "no-repeat, padding-box",
  };

  return (
    <motion.span
      ref={ref}
      className={className}
      style={{
        ...baseStyles,
        "--spread": `${dynamicSpread}px`,
        backgroundImage: `linear-gradient(90deg, transparent calc(50% - var(--spread)), ${shimmerColor}, transparent calc(50% + var(--spread))), linear-gradient(${color}, ${color})`,
      }}
      initial={{
        backgroundPosition: "100% center",
        opacity: 0,
      }}
      animate={
        shouldAnimate
          ? {
              backgroundPosition: "0% center",
              opacity: 1,
            }
          : {}
      }
      transition={{
        backgroundPosition: {
          repeat: repeat ? Infinity : 0,
          duration,
          delay,
          repeatDelay,
          ease: "linear",
        },
        opacity: {
          duration: 0.3,
          delay,
        },
      }}
    >
      {text}
    </motion.span>
  );
}