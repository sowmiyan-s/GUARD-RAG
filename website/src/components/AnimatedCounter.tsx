/**
 * Animated number counter — inspired by 21st.dev id:1844 (preetsuthar17/animated-counter)
 * and id:20459 (danielpetho/number-ticker). Counts up with spring easing on mount/inView.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface AnimatedCounterProps {
  value: string;    // e.g. "8.2", "83", "9+"
  unit?: string;    // e.g. "ms", "/83"
  label: string;
  delay?: number;
}

function parseNumeric(v: string): { num: number; suffix: string; prefix: string } {
  const m = v.match(/^([<~]?)(\d+\.?\d*)([+a-zA-Z/%]*)$/);
  if (!m) return { num: 0, suffix: '', prefix: '' };
  return { prefix: m[1] ?? '', num: parseFloat(m[2]), suffix: m[3] ?? '' };
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, unit, label, delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.8 });
  const { num, suffix, prefix } = parseNumeric(value);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const steps = 44;
    const stepMs = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const pct = Math.min(1, step / steps);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - pct, 3);
      setDisplay(eased * num);
      if (step >= steps) clearInterval(timer);
    }, stepMs);
    return () => clearInterval(timer);
  }, [inView, num, delay]);

  const formatted =
    num < 10 && num !== Math.floor(num)
      ? display.toFixed(1)
      : Math.round(display).toString();

  return (
    <div ref={ref} className="text-left">
      <div className="flex items-baseline gap-0.5">
        {prefix && <span className="font-mono text-lg text-zinc-500">{prefix}</span>}
        <span className="font-mono text-3xl font-semibold tabular-nums text-white">{formatted}</span>
        <span className="font-mono text-base text-zinc-400">{suffix}{unit}</span>
      </div>
      <div className="mt-1 text-[11px] leading-tight text-zinc-500">{label}</div>
    </div>
  );
};
