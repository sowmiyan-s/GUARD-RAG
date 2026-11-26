import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { REPO_META } from '../data/guardragData';
import { BeamsBackground } from './BeamsBackground';

const EASE = [0.16, 1, 0.3, 1] as const;

export const HeroSection: React.FC<{ onOpenDocs?: () => void }> = ({ onOpenDocs }) => {
  const [copied, setCopied] = useState(false);

  const copyCommand = () => {
    navigator.clipboard.writeText('pip install guard-rag');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Luxury Tenerai-style Gradient Photo & Lighting Backdrop */}
      <BeamsBackground className="absolute inset-0 z-0" />

      {/* Gentle ambient dark radial blend */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-20 z-0 h-[600px] w-full max-w-5xl -translate-x-1/2 rounded-full bg-[#00b91e]/[0.05] blur-[160px]"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1840px] px-6 sm:px-12 lg:px-16 2xl:px-20">
        {/* Main Center-Aligned Editorial Stack */}
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          {/* Announcement Badge — Clean, no version clutter */}
          <motion.a
            href={REPO_META.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/[0.12] bg-[#0c0d12]/80 px-5 py-2 text-sm font-medium text-zinc-200 shadow-[0_2px_12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md transition-all hover:border-[#00b91e]/40 hover:text-white"
          >
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#00b91e] animate-pulse" />
            <span className="font-semibold text-white">Private Document Intelligence</span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-300">100% Offline &amp; Air-Gapped</span>
            <span className="text-zinc-600">·</span>
            <span className="text-[#00b91e] font-semibold">Free &amp; Open Source ↗</span>
          </motion.a>

          {/* Master Headline — Human, clear, impactful */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
            className="text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-6xl lg:text-[76px]"
          >
            Ask anything about your
            <br />
            <span className="text-linear-metallic">confidential documents.</span>
            <br />
            <span
              className="mt-1 inline-block"
              style={{
                WebkitTextFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                backgroundImage: 'linear-gradient(135deg, #00b91e 0%, #10b981 50%, #34d399 100%)',
              }}
            >
              Completely private. Completely offline.
            </span>
          </motion.h1>

          {/* Subtitle Paragraph — Focus on user benefits and problem solved */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16, ease: EASE }}
            className="mt-8 max-w-3xl text-lg leading-relaxed text-zinc-300 sm:text-xl sm:leading-relaxed"
          >
            GuardRAG turns your contracts, financial spreadsheets, research papers, and private
            documents into an interactive Q&amp;A assistant. Your files never leave your computer, no
            data is sent to external cloud servers, and every answer is backed by verifiable citations.
          </motion.p>

          {/* Refined SaaS Call to Action Row */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.22, ease: EASE }}
            className="mt-10 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row"
          >
            <a
              href="#quickstart"
              className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00b91e] to-[#0ea540] px-8 text-base font-semibold text-black shadow-[0_4px_24px_rgba(0,185,30,0.25)] transition-all hover:from-[#14cf32] hover:to-[#10b981] hover:shadow-[0_6px_30px_rgba(0,185,30,0.35)] sm:w-auto"
            >
              <span>Get Started Free</span>
              <span aria-hidden="true">→</span>
            </a>

            <button
              type="button"
              onClick={onOpenDocs}
              className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-[#0c0d12]/90 px-7 text-base font-medium text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:border-white/25 hover:bg-[#12131a] hover:text-white sm:w-auto"
            >
              <span>Explore Documentation</span>
              <span aria-hidden="true" className="text-zinc-500">↗</span>
            </button>
          </motion.div>

          {/* Clean Quick-Copy Install Pill */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.26, ease: EASE }}
            className="mt-6 flex flex-wrap items-center justify-center gap-3"
          >
            <div className="inline-flex items-center gap-3 rounded-xl border border-white/[0.1] bg-[#0c0d12]/90 px-4 py-2 font-mono text-xs sm:text-sm shadow-sm backdrop-blur-md">
              <span className="text-zinc-500">$</span>
              <span className="text-zinc-200">pip install guard-rag</span>
              <button
                type="button"
                onClick={copyCommand}
                className="ml-2 rounded-md border border-white/[0.1] bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
              >
                {copied ? <span className="text-[#00b91e]">Copied!</span> : 'Copy'}
              </button>
            </div>
            <span className="font-mono text-xs text-zinc-400">
              100% on-device · Zero accounts · No cloud setup required
            </span>
          </motion.div>
        </div>

        {/* Full-Width Key Value Highlights Strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.32, ease: EASE }}
          className="mx-auto mt-16 w-full max-w-[1780px] rounded-2xl border border-white/[0.08] bg-[#0c0d12]/90 p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl sm:p-10"
        >
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
            <div className="flex flex-col items-center text-center sm:items-start sm:text-left sm:pr-8">
              <div className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">0 Bytes</div>
              <div className="mt-2 text-base sm:text-lg font-bold text-emerald-400">Never Uploaded</div>
              <p className="mt-2 text-sm sm:text-[15px] leading-relaxed text-zinc-300">
                Files and queries stay strictly on your local disk. Zero network telemetry.
              </p>
            </div>

            <div className="flex flex-col items-center text-center sm:items-start sm:text-left pt-6 sm:pt-0 sm:px-8">
              <div className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">100% Local</div>
              <div className="mt-2 text-base sm:text-lg font-bold text-emerald-400">Fast Execution</div>
              <p className="mt-2 text-sm sm:text-[15px] leading-relaxed text-zinc-300">
                Runs on your CPU using free Ollama models with zero external cloud latency.
              </p>
            </div>

            <div className="flex flex-col items-center text-center sm:items-start sm:text-left pt-6 sm:pt-0 sm:px-8">
              <div className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Universal</div>
              <div className="mt-2 text-base sm:text-lg font-bold text-emerald-400">9+ Formats</div>
              <p className="mt-2 text-sm sm:text-[15px] leading-relaxed text-zinc-300">
                Seamless native parsing for PDFs, Excel sheets, Word docs, slide decks, and folders.
              </p>
            </div>

            <div className="flex flex-col items-center text-center sm:items-start sm:text-left pt-6 sm:pt-0 sm:pl-8">
              <div className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Free</div>
              <div className="mt-2 text-base sm:text-lg font-bold text-emerald-400">Open Source MIT</div>
              <p className="mt-2 text-sm sm:text-[15px] leading-relaxed text-zinc-300">
                Transparent, fully auditable, and self-hosted with zero accounts or subscriptions.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
