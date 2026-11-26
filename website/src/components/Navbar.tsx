import React, { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { REPO_META } from '../data/guardragData';

const NAV_LINKS = [
  { label: 'Product', href: '#showcase' },
  { label: 'How It Works', href: '#story' },
  { label: 'Guardrails', href: '#guardrails' },
  { label: 'Benchmarks', href: '#benchmarks' },
  { label: 'Quickstart', href: '#quickstart' },
  { label: 'SDK Docs', href: '#sdk-docs' },
];

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 280, damping: 32, restDelta: 0.001 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/[0.08] bg-[#09090b]/85 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <motion.div
        style={{ scaleX }}
        className="absolute inset-x-0 top-0 h-[1.5px] origin-left bg-[#00b91e]"
      />

      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Clean Brand Lockup */}
        <a href="#" className="group flex items-center gap-2.5 focus:outline-none">
          <img
            src="./assets/duck-mark.png"
            alt="GuardRAG"
            className="h-7 w-7 rounded-md object-contain transition-transform duration-200 group-hover:scale-105"
          />
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-white">
            Guard<span className="text-[#00b91e]">RAG</span>
          </span>
          <span className="hidden font-mono text-[11px] text-zinc-500 sm:inline">
            {REPO_META.version}
          </span>
        </a>

        {/* Clean Borderless Navigation */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-[13px] font-medium text-zinc-400 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Crisp Action Buttons (Authentic GitHub mark, zero generic icon clutter) */}
        <div className="hidden items-center gap-2.5 md:flex">
          <a
            href={REPO_META.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-1.5 text-[13px] font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
          >
            <svg className="h-3.5 w-3.5 fill-current text-zinc-300" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            <span>GitHub</span>
          </a>
          <a
            href="#quickstart"
            className="inline-flex items-center rounded-lg bg-[#00b91e] px-3.5 py-1.5 text-[13px] font-semibold text-black transition-colors hover:bg-[#14cf32]"
          >
            Run guard-rag
          </a>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-300 md:hidden"
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
        <div className="border-b border-white/[0.08] bg-[#09090b]/95 px-4 pb-5 pt-2 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/[0.05] hover:text-white"
              >
                {link.label}
              </a>
            ))}
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
                Run guard-rag
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
