import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { QUICKSTART_TABS, REPO_META } from '../data/guardragData';

export const QuickstartSection: React.FC = () => {
  const [activeTabId, setActiveTabId] = useState(QUICKSTART_TABS[0].id);
  const [copied, setCopied] = useState(false);

  const current = QUICKSTART_TABS.find((t) => t.id === activeTabId) ?? QUICKSTART_TABS[0];

  const copyCode = () => {
    navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section id="quickstart" className="relative border-t border-white/[0.06] py-24">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-12">
        <div className="max-w-3xl text-left">
          <div className="mb-3 font-mono text-xs uppercase tracking-wider text-[#00b91e]">
            Quickstart
          </div>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Run locally with guard-rag.
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-zinc-400">
            Python 3.9–3.12+ · Works with Ollama models{' '}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-zinc-200">llama3.2</code>,{' '}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-zinc-200">gemma3:1b</code>,{' '}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-zinc-200">deepseek-r1</code>,{' '}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-zinc-200">mistral</code>.
          </p>
        </div>

        <div className="card-hairline mt-10 overflow-hidden rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-[#111116] px-4 py-3">
            <div className="flex flex-wrap gap-1.5">
              {QUICKSTART_TABS.map((tab) => {
                const isActive = tab.id === activeTabId;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTabId(tab.id)}
                    className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="quickstartTabPill"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        className="absolute inset-0 rounded-lg border border-white/[0.12] bg-white/[0.06]"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={copyCode}
              className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
            >
              {copied ? <span className="text-[#00b91e]">Copied</span> : 'Copy'}
            </button>
          </div>

          <div className="bg-[#08080a] p-5 sm:p-6">
            <div className="mb-3 font-mono text-[11px] text-zinc-500">{current.subtitle}</div>
            <AnimatePresence mode="wait">
              <motion.pre
                key={current.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="overflow-x-auto font-mono text-xs leading-6 text-zinc-200 sm:text-[13px]"
              >
                <code>{current.code}</code>
              </motion.pre>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-start gap-3">
          <a
            href={REPO_META.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#00b91e] px-5 py-2.5 text-sm font-semibold text-black shadow-[0_0_24px_rgba(0,185,30,0.22)] transition-colors hover:bg-[#14cf32]"
          >
            <span>GitHub Repository</span>
            <span aria-hidden="true">↗</span>
          </a>
          <a
            href={REPO_META.pypiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.12] bg-[#121216] px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-white/25 hover:text-white"
          >
            <span>PyPI Package</span>
            <span aria-hidden="true" className="text-zinc-400">↗</span>
          </a>
        </div>
      </div>
    </section>
  );
};
