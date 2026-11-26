import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { REPO_META } from '../data/guardragData';
import { BeamsBackground } from './BeamsBackground';
import { AnimatedCounter } from './AnimatedCounter';

const EASE = [0.16, 1, 0.3, 1] as const;

const STATS = [
  { value: '0', unit: ' Bytes', label: 'Sent to external servers' },
  { value: '8.2', unit: ' ms', label: 'FastEmbed CPU vectorization' },
  { value: '9+', unit: '', label: 'File formats supported' },
  { value: '83', unit: '/83', label: 'Automated pytest checks' },
];

export const HeroSection: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('pip install guard-rag');
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="relative overflow-hidden pt-28 pb-14 sm:pt-40 sm:pb-20">
      {/* Animated beams background */}
      <BeamsBackground className="absolute inset-0 z-0" />

      {/* Gradient vignette bottom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-32"
        style={{ background: 'linear-gradient(to bottom, transparent, #09090b)' }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          {/* Version Pill */}
          <motion.a
            href={REPO_META.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-[#00b91e]/30 bg-[#00b91e]/[0.07] px-4 py-1.5 text-xs text-[#00b91e] transition-colors hover:bg-[#00b91e]/[0.12]"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00b91e] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#00b91e]" />
            </span>
            <span className="font-semibold">GuardRAG {REPO_META.version}</span>
            <span className="text-[#00b91e]/60">·</span>
            <span className="text-[#00b91e]/80">100% Offline · MIT Open Source</span>
            <span aria-hidden="true" className="text-[#00b91e]/60">↗</span>
          </motion.a>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.07, ease: EASE }}
            className="text-linear-metallic text-[42px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[64px]"
          >
            Ask your confidential
            <br />
            files anything.
            <br />
            <span
              className="relative"
              style={{
                WebkitTextFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                backgroundImage: 'linear-gradient(135deg, #00b91e 0%, #00e030 50%, #14cf32 100%)',
              }}
            >
              Nothing leaves.
            </span>
          </motion.h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.14, ease: EASE }}
            className="mx-auto mt-7 max-w-2xl text-[17px] leading-relaxed text-zinc-400"
          >
            Turn PDFs, Excel sheets, PowerPoint decks, and entire folders into a private Q&amp;A
            workspace — instant citations, offline voice briefings, automatic PII redaction,
            all running locally via Ollama. Zero cloud, zero subscription.
          </motion.p>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2, ease: EASE }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <a
              href="#quickstart"
              className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-[#00b91e] px-6 text-sm font-semibold text-black shadow-[0_0_40px_rgba(0,185,30,0.3)] transition-all hover:bg-[#14cf32] hover:shadow-[0_0_55px_rgba(0,185,30,0.4)] sm:w-auto"
            >
              <span>Get Started Free</span>
              <span aria-hidden="true">→</span>
            </a>

            {/* Two-line terminal block */}
            <div className="group flex w-full flex-col gap-0 rounded-xl border border-white/[0.1] bg-[#0c0c10] px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors hover:border-white/20 sm:w-auto">
              <div className="flex items-center justify-between gap-6">
                <code className="font-mono text-xs text-zinc-200">
                  <span className="select-none text-zinc-500">$ </span>pip install guard-rag
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label="Copy install command"
                  className="shrink-0 rounded border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-zinc-500 transition-colors hover:border-white/20 hover:text-white"
                >
                  {copied ? <span className="text-[#00b91e]">✓</span> : 'Copy'}
                </button>
              </div>
              <code className="font-mono text-xs">
                <span className="select-none text-zinc-500">$ </span>
                <span className="text-[#00b91e]">guard-rag</span>
                <span className="text-zinc-600">  # → http://127.0.0.1:8000</span>
              </code>
            </div>

            <a
              href={REPO_META.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-5 text-sm font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/[0.06] sm:w-auto"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              <span>GitHub</span>
            </a>
          </motion.div>

          {/* Animated stats strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.32 }}
            className="mt-14 grid grid-cols-2 gap-6 border-t border-white/[0.07] pt-8 sm:grid-cols-4"
          >
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 + i * 0.07, ease: EASE }}
              >
                <AnimatedCounter value={s.value} unit={s.unit} label={s.label} delay={i * 80} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
