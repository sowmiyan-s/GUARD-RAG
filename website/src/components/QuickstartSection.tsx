import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { REPO_META } from '../data/guardragData';

const FAQS = [
  {
    q: 'Does any file or text ever leave my computer?',
    a: 'No. GuardRAG is 100% offline and air-gapped. File extraction, vector search, AI reasoning, and audio generation happen exclusively on your local machine. Zero internet connection or cloud telemetry is required.',
  },
  {
    q: 'Do I need an OpenAI key or monthly cloud subscription?',
    a: 'Never. GuardRAG connects directly to free local models running on your machine via Ollama (e.g. Llama 3.2, Gemma 3, Mistral). There are zero subscriptions, zero usage quotas, and no hidden API bills.',
  },
  {
    q: 'What document types are supported?',
    a: 'You can drop in PDFs, Word files (.docx), Excel spreadsheets (.xlsx), PowerPoint slides (.pptx), HTML pages, CSV, JSON, markdown, or entire folders at once. All parsed natively without cloud conversion.',
  },
  {
    q: 'Can colleagues on my office Wi-Fi view the documents?',
    a: 'Yes. GuardRAG includes a Host-Controlled LAN sharing feature. You can broadcast a secure link over your local Wi-Fi. Teammates can chat with the documents in their browser with zero software installed on their machines.',
  },
];

export const QuickstartSection: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const copyInstall = () => {
    navigator.clipboard.writeText('pip install guard-rag');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="quickstart" className="relative border-t border-white/[0.06] py-24 sm:py-32">
      <div className="mx-auto w-full max-w-[1840px] px-6 sm:px-12 lg:px-16 2xl:px-20">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-3 font-mono text-xs uppercase tracking-wider text-zinc-400">
            Get Started in Seconds
          </div>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl">
            Ready to explore your documents privately?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
            GuardRAG is 100% free, open-source under the MIT license, and runs locally on standard
            Mac, Windows, and Linux machines.
          </p>
        </div>

        {/* 2-Column Full-Width Grid: Left Setup + Right FAQ / Common Answers */}
        <div className="mx-auto grid w-full max-w-[1780px] grid-cols-1 gap-8 lg:grid-cols-12 items-stretch">
          {/* Left Column: Quick Launch Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0c0d12]/90 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] lg:col-span-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-[#00b91e]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Quick Installation
                </span>
              </div>

              <h3 className="mt-4 text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Up and running in two simple steps
              </h3>
              <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-zinc-300">
                Install the package from PyPI and launch the private studio directly in your default
                browser.
              </p>

              <div className="mt-8 space-y-5">
                <div className="rounded-xl border border-white/[0.08] bg-[#08080c] p-5">
                  <div className="flex items-center justify-between text-sm text-zinc-300">
                    <span className="font-bold text-white">Step 1: Install GuardRAG</span>
                    <button
                      type="button"
                      onClick={copyInstall}
                      className="rounded-md border border-white/[0.12] bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-white/25 hover:text-white"
                    >
                      {copied ? <span className="text-[#00b91e]">Copied!</span> : 'Copy Command'}
                    </button>
                  </div>
                  <div className="mt-3 font-mono text-sm sm:text-base font-semibold text-emerald-400">
                    pip install guard-rag
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-[#08080c] p-5">
                  <div className="text-sm sm:text-base font-bold text-white">Step 2: Start the Local Studio</div>
                  <p className="mt-1.5 text-xs sm:text-sm text-zinc-400">
                    Launch the dashboard with a single command:
                  </p>
                  <div className="mt-3 font-mono text-sm sm:text-base font-semibold text-emerald-400">
                    guard-rag
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3.5 border-t border-white/[0.08] pt-6 sm:flex-row">
              <a
                href={REPO_META.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white/[0.05] border border-white/[0.12] px-5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.1] hover:border-white/25"
              >
                <span>GitHub Repository</span>
                <span aria-hidden="true">↗</span>
              </a>
              <a
                href={REPO_META.pypiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white/[0.05] border border-white/[0.12] px-5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.1] hover:border-white/25"
              >
                <span>PyPI Package</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          {/* Right Column: Key Questions & Clarity */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0c0d12]/90 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] lg:col-span-7">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-[#00b91e]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Common Questions
                </span>
              </div>

              <h3 className="mt-4 text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Everything you need to know
              </h3>

              <div className="mt-8 space-y-3">
                {FAQS.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={faq.q}
                      className={`overflow-hidden rounded-xl border transition-colors ${
                        isOpen
                          ? 'border-[#00b91e]/30 bg-[#0c120e]'
                          : 'border-white/[0.08] bg-[#08080c] hover:border-white/20'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="flex w-full items-center justify-between p-5 text-left transition-colors focus:outline-none"
                      >
                        <span className="text-base sm:text-[17px] font-semibold text-white pr-4">
                          {faq.q}
                        </span>
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border font-mono text-xs font-bold transition-all ${
                            isOpen
                              ? 'border-[#00b91e]/40 bg-[#00b91e]/15 text-[#00b91e]'
                              : 'border-white/[0.08] bg-white/[0.04] text-zinc-400'
                          }`}
                        >
                          {isOpen ? '−' : '+'}
                        </span>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                          >
                            <div className="px-5 pb-5 text-sm sm:text-base leading-relaxed text-zinc-300 border-t border-white/[0.06] pt-3.5">
                              {faq.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 border-t border-white/[0.08] pt-5 text-sm text-zinc-300">
              Need technical documentation or API reference?{' '}
              <a
                href={REPO_META.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00b91e] font-semibold underline underline-offset-2 hover:text-[#10b981]"
              >
                Read the documentation on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuickstartSection;
