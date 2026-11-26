import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { REPO_META } from '../data/guardragData';
import { BeamsBackground } from './BeamsBackground';
import { AnimatedCounter } from './AnimatedCounter';

const EASE = [0.16, 1, 0.3, 1] as const;

const STATS = [
  { value: '0', unit: ' Bytes', label: 'Sent to external servers' },
  { value: '4', unit: ' Tiers', label: 'Public to Restricted AI guardrails' },
  { value: '9+', unit: '', label: 'Local formats: PDF, XLSX, PPTX, DOCX' },
  { value: '83', unit: '/83', label: 'Automated pytest checks passing' },
];

const TERMINAL_LINES = [
  { text: '$ pip install guard-rag', tone: 'cmd' },
  { text: 'Successfully installed guard-rag-1.3.3', tone: 'muted' },
  { text: '$ guard-rag --pdf NDA.pdf --sensitivity Confidential', tone: 'cmd' },
  { text: '✓ Sanitized prompt injections · Luhn card check active', tone: 'ok' },
  { text: '✓ Masked [EMAIL_REDACTED] & [CREDIT_CARD_REDACTED]', tone: 'ok' },
  { text: '✓ Hybrid BM25 + FAISS index ready (0 bytes uploaded)', tone: 'ok' },
  { text: '→ Studio live at http://127.0.0.1:8000', tone: 'accent' },
];

const InteractiveTerminal: React.FC = () => {
  const [visibleCount, setVisibleCount] = useState(2);

  useEffect(() => {
    if (visibleCount >= TERMINAL_LINES.length) return;
    const t = setTimeout(() => setVisibleCount((c) => c + 1), 650);
    return () => clearTimeout(t);
  }, [visibleCount]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.22, ease: EASE }}
      className="card-hairline overflow-hidden rounded-2xl bg-[#09090d]"
    >
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#101016] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#00b91e]/80" />
          <span className="ml-2 font-mono text-[11px] text-zinc-400">guard-rag — zsh</span>
        </div>
        <button
          type="button"
          onClick={() => setVisibleCount(1)}
          className="rounded border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-zinc-400 transition-colors hover:text-white"
        >
          Replay
        </button>
      </div>
      <div className="min-h-[236px] space-y-2 p-5 font-mono text-xs leading-relaxed">
        {TERMINAL_LINES.slice(0, visibleCount).map((line, i) => (
          <motion.div
            key={line.text}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className={
              line.tone === 'cmd'
                ? 'text-white'
                : line.tone === 'ok'
                  ? 'text-emerald-300'
                  : line.tone === 'accent'
                    ? 'font-semibold text-[#00b91e]'
                    : 'text-zinc-500'
            }
          >
            {line.text}
            {i === visibleCount - 1 && visibleCount < TERMINAL_LINES.length && (
              <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-[#00b91e] align-middle" />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export const HeroSection: React.FC<{ onOpenDocs?: () => void }> = ({ onOpenDocs }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('pip install guard-rag');
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="relative overflow-hidden pt-28 pb-12 sm:pt-36 sm:pb-16">
      <BeamsBackground className="absolute inset-0 z-0" />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-32"
        style={{ background: 'linear-gradient(to bottom, transparent, #050507)' }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          {/* Left 7 cols: Full-Width Editorial Headline + Shimmer CTAs */}
          <div className="lg:col-span-7">
            <motion.a
              href={REPO_META.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-[#00b91e]/30 bg-[#00b91e]/[0.07] px-4 py-1.5 text-xs text-[#00b91e] transition-colors hover:bg-[#00b91e]/[0.12]"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00b91e] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#00b91e]" />
              </span>
              <span className="font-semibold">GuardRAG (guard-rag) {REPO_META.version}</span>
              <span className="text-[#00b91e]/60">·</span>
              <span className="text-[#00b91e]/85">AI Safety &amp; Air-Gapped RAG</span>
              <span aria-hidden="true" className="text-[#00b91e]/60">↗</span>
            </motion.a>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.07, ease: EASE }}
              className="text-linear-metallic text-4xl font-semibold leading-[1.03] tracking-[-0.04em] sm:text-6xl xl:text-[68px]"
            >
              Private AI for confidential files.
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
                Zero cloud. Zero leaks.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.14, ease: EASE }}
              className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg"
            >
              <strong className="font-medium text-zinc-200">GuardRAG</strong> (
              <code className="font-mono text-[#00b91e]">guard-rag</code>) protects sensitive PDFs,
              spreadsheets, and docs with 4-tier LLM guardrails, PII redaction, Hybrid BM25+FAISS
              citations, and local Ollama inference.
            </motion.p>

            {/* Uniform h-11 CTA Row with 21st.dev Shimmer Button */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2, ease: EASE }}
              className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center"
            >
              <a
                href="#quickstart"
                className="shimmer-btn inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#00b91e] px-5 text-sm font-semibold text-black shadow-[0_0_32px_rgba(0,185,30,0.3)] transition-all hover:bg-[#14cf32]"
              >
                <span>Get Started</span>
                <span aria-hidden="true">→</span>
              </a>

              <div className="flex h-11 items-center justify-between gap-3 rounded-lg border border-white/[0.12] bg-[#0b0b0f] px-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:border-white/25">
                <code className="font-mono text-xs text-zinc-200">
                  <span className="select-none text-zinc-500">$ </span>pip install guard-rag
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label="Copy install command"
                  className="shrink-0 rounded border border-white/[0.09] bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-zinc-400 transition-colors hover:border-white/25 hover:text-white"
                >
                  {copied ? <span className="text-[#00b91e]">Copied</span> : 'Copy'}
                </button>
              </div>

              <button
                type="button"
                onClick={onOpenDocs}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.03] px-4 text-sm font-medium text-zinc-200 transition-colors hover:border-white/25 hover:bg-white/[0.07]"
              >
                <span>Documentation</span>
              </button>
            </motion.div>
          </div>

          {/* Right 5 cols: 21st.dev-style Interactive Terminal */}
          <div className="lg:col-span-5">
            <InteractiveTerminal />
          </div>
        </div>

        {/* Full-Width Capabilities Strip */}
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
    </section>
  );
};
