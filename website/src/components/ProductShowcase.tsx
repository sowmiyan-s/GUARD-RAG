import React, { useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { PRODUCT_SCREENSHOTS } from '../data/guardragData';

export const ProductShowcase: React.FC = () => {
  const [activeId, setActiveId] = useState(PRODUCT_SCREENSHOTS[0].id);
  const stageRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start end', 'center center'],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [8, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.96, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0.72, 1]);

  const activeTab = PRODUCT_SCREENSHOTS.find((t) => t.id === activeId) ?? PRODUCT_SCREENSHOTS[0];

  return (
    <section id="showcase" ref={stageRef} className="relative pb-24 pt-2">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Clean Pill Switcher (no generic icon clutter) */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          {PRODUCT_SCREENSHOTS.map((tab) => {
            const isActive = tab.id === activeId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveId(tab.id)}
                className={`relative inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="showcaseTabBg"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-lg border border-white/[0.12] bg-[#141419] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                  />
                )}
                <span
                  className={`relative z-10 h-1.5 w-1.5 rounded-full ${
                    isActive ? 'bg-[#00b91e]' : 'bg-zinc-600'
                  }`}
                />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3D Perspective Product Stage */}
        <div style={{ perspective: 1400 }}>
          <motion.div
            style={{ rotateX, scale, opacity }}
            className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0c0c0f] shadow-[0_32px_90px_-20px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.04)]"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
            />

            <div className="flex items-center justify-between border-b border-white/[0.07] bg-[#111115] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="ml-2 rounded border border-white/[0.07] bg-black/30 px-2.5 py-0.5 font-mono text-[11px] text-zinc-400">
                  http://127.0.0.1:8000
                </span>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00b91e]/30 bg-[#00b91e]/10 px-2.5 py-0.5 font-mono text-[10px] font-medium text-[#00b91e]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00b91e]" />
                {activeTab.badge}
              </span>
            </div>

            <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#121214]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeTab.id}
                  src={activeTab.src}
                  alt={activeTab.title}
                  initial={{ opacity: 0, scale: 1.01 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full w-full object-cover object-top"
                />
              </AnimatePresence>
            </div>

            <div className="flex flex-col justify-between gap-2 border-t border-white/[0.07] bg-[#0e0e12] px-5 py-3.5 sm:flex-row sm:items-center">
              <div>
                <div className="text-sm font-semibold text-white">{activeTab.title}</div>
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">{activeTab.caption}</p>
              </div>
              <div className="hidden shrink-0 items-center gap-2 font-mono text-[11px] text-zinc-400 sm:flex">
                <img src="/assets/duck-avatar.png" alt="" className="h-5 w-5 rounded-full" />
                <span>guard-rag v1.3.3</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
