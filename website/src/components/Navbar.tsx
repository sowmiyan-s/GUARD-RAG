import React, { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { REPO_META } from '../data/guardragData';

const NAV_LINKS = [
  { label: 'Overview', href: '#showcase' },
  { label: 'How It Works', href: '#story' },
  { label: 'Privacy Shield', href: '#guardrails' },
  { label: 'Comparison', href: '#comparison' },
];

interface NavbarProps {
  isDocs?: boolean;
  onOpenDocs: () => void;
  onGoHome: (anchor?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ isDocs = false, onOpenDocs, onGoHome }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 280, damping: 32, restDelta: 0.001 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-2.5 sm:px-6">
      <motion.div
        style={{ scaleX }}
        className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-[#00b91e]"
      />

      {/* Floating Solid Navbar with Deep Backdrop Blur */}
      <div
        className={`mx-auto flex h-14 w-full max-w-[1840px] items-center justify-between rounded-2xl px-4 transition-all duration-300 sm:px-6 xl:px-8 border ${
          scrolled || isDocs
            ? 'border-white/[0.12] bg-[#060709]/95 shadow-[0_16px_40px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl'
            : 'border-white/[0.08] bg-[#060709]/85 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl'
        }`}
      >
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            onGoHome();
          }}
          className="group flex shrink-0 items-center gap-2.5 focus:outline-none"
        >
          <img
            src="./assets/duck-mark.png"
            alt="GuardRAG"
            className="h-7 w-7 rounded-md object-contain transition-transform duration-200 group-hover:scale-105"
          />
          <span className="text-base sm:text-lg font-bold tracking-[-0.02em] text-white shrink-0">
            Guard<span className="text-[#00b91e]">RAG</span>
          </span>
        </a>

        {/* Morphing Pill Navigation — Visible on lg: (1024px+) to prevent any text wrapping */}
        <nav
          className="hidden items-center gap-1 lg:flex shrink-0"
          aria-label="Primary navigation"
          onMouseLeave={() => setHoveredNav(null)}
        >
          {NAV_LINKS.map((link) => {
            const active = hoveredNav === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                onMouseEnter={() => setHoveredNav(link.href)}
                onClick={(e) => {
                  if (isDocs) {
                    e.preventDefault();
                    onGoHome(link.href);
                  }
                }}
                className="relative rounded-lg px-3.5 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:text-white whitespace-nowrap"
              >
                {active && (
                  <motion.span
                    layoutId="navMorphPill"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-lg border border-white/[0.08] bg-white/[0.06]"
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </a>
            );
          })}
          <button
            type="button"
            onMouseEnter={() => setHoveredNav('docs')}
            onClick={onOpenDocs}
            className={`relative rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
              isDocs ? 'text-[#00b91e] font-semibold' : 'text-zinc-300 hover:text-white'
            }`}
          >
            {(hoveredNav === 'docs' || isDocs) && (
              <motion.span
                layoutId="navMorphPill"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-lg border border-[#00b91e]/25 bg-[#00b91e]/10"
              />
            )}
            <span className="relative z-10">Documentation</span>
          </button>
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex shrink-0">
          <a
            href={REPO_META.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-white/25 hover:bg-white/[0.07] whitespace-nowrap"
          >
            <svg className="h-3.5 w-3.5 fill-current text-zinc-300" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            <span>GitHub</span>
          </a>
          <a
            href="#quickstart"
            onClick={(e) => {
              if (isDocs) {
                e.preventDefault();
                onGoHome('#quickstart');
              }
            }}
            className="shimmer-btn inline-flex h-9 items-center rounded-lg bg-[#00b91e] px-4 text-xs font-semibold text-black shadow-[0_0_24px_rgba(0,185,30,0.25)] transition-colors hover:bg-[#14cf32] whitespace-nowrap"
          >
            Get Started
          </a>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-300 lg:hidden"
          aria-label="Toggle navigation"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? (
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="mx-auto mt-2 max-w-[1840px] rounded-2xl border border-white/[0.1] bg-[#0a0a0e]/95 px-4 pb-5 pt-2 backdrop-blur-2xl md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  setMobileOpen(false);
                  if (isDocs) {
                    e.preventDefault();
                    onGoHome(link.href);
                  }
                }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/[0.05] hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenDocs();
              }}
              className={`rounded-lg px-3 py-2 text-left text-sm font-medium ${
                isDocs ? 'text-[#00b91e]' : 'text-zinc-300 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              Documentation
            </button>
            <div className="mt-3 flex gap-2 border-t border-white/[0.08] pt-3">
              <a
                href={REPO_META.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] py-2 text-xs font-medium text-zinc-200"
              >
                GitHub
              </a>
              <a
                href="#quickstart"
                onClick={() => setMobileOpen(false)}
                className="flex flex-1 items-center justify-center rounded-lg bg-[#00b91e] py-2 text-xs font-semibold text-black"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
