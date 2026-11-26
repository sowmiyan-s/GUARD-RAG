import React, { useState } from 'react';

export const ProductStorySection: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section id="story" className="relative border-t border-white/[0.06] py-24 sm:py-32">
      {/* Subtle ambient lighting backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-full max-w-4xl -translate-x-1/2 rounded-full bg-[#00b91e]/[0.03] blur-[150px]"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1840px] px-6 sm:px-12 lg:px-16 2xl:px-20">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
            How It Works
          </div>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
            Private intelligence, simplified.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-300">
            No cloud uploads, zero telemetry, and zero subscriptions. Everything runs directly on your computer.
          </p>
        </div>

        {/* 3-Step Interactive Process Pipeline (React Bits style) */}
        <div className="mx-auto mb-16 w-full max-w-[1780px]">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Step 1 */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0d12]/90 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 hover:border-white/25 hover:shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00b91e]/15 text-sm font-bold text-[#00b91e] border border-[#00b91e]/25">
                  01
                </span>
                <span className="font-mono text-xs font-medium text-zinc-400">Fast Ingestion</span>
              </div>
              <h3 className="mt-6 text-xl sm:text-2xl font-bold tracking-tight text-white">Drop Any File</h3>
              <p className="mt-3 text-base leading-relaxed text-zinc-300">
                Drag in legal agreements, spreadsheets, slide decks, or whole folders. Parsed locally in milliseconds.
              </p>
            </div>

            {/* Step 2 */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0d12]/90 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 hover:border-white/25 hover:shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00b91e]/15 text-sm font-bold text-[#00b91e] border border-[#00b91e]/25">
                  02
                </span>
                <span className="font-mono text-xs font-medium text-zinc-400">Local Reasoning</span>
              </div>
              <h3 className="mt-6 text-xl sm:text-2xl font-bold tracking-tight text-white">Ask in Plain English</h3>
              <p className="mt-3 text-base leading-relaxed text-zinc-300">
                Ask questions naturally. Get conversational answers streamed from free, open local AI models.
              </p>
            </div>

            {/* Step 3 */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0d12]/90 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 hover:border-white/25 hover:shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00b91e]/15 text-sm font-bold text-[#00b91e] border border-[#00b91e]/25">
                  03
                </span>
                <span className="font-mono text-xs font-medium text-zinc-400">Zero Hallucinations</span>
              </div>
              <h3 className="mt-6 text-xl sm:text-2xl font-bold tracking-tight text-white">Verify or Listen</h3>
              <p className="mt-3 text-base leading-relaxed text-zinc-300">
                Inspect exact page citations and highlighted quotes, or tap Audio Overview for a 2-minute spoken briefing.
              </p>
            </div>
          </div>
        </div>

        {/* Bento Grid: 1 Hero Wide Card + 2 Paired Cards (UIverse / 21st style) */}
        <div className="mx-auto w-full max-w-[1780px]">
          <div className="mb-6 flex items-center justify-between">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Core Capabilities
            </span>
            <span className="font-mono text-xs text-emerald-400">100% Air-Gapped Engine</span>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
            {/* Bento Card 1: 100% On-Device Privacy Architecture (7 Columns) */}
            <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0c0d12]/90 p-8 sm:p-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:border-white/20">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00b91e]/15 text-[#00b91e]">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <span className="rounded-full border border-[#00b91e]/25 bg-[#00b91e]/10 px-3 py-1 font-mono text-xs font-semibold text-[#00b91e]">
                      Zero Cloud Egress
                    </span>
                  </div>
                  <span className="font-mono text-xs text-zinc-500">Local Hard Drive Vault</span>
                </div>

                <h3 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  100% On-Device Privacy Architecture
                </h3>
                <p className="mt-3 text-base leading-relaxed text-zinc-300">
                  When you ask questions, your confidential files never leave your computer. Parsing, vector search,
                  and model reasoning occur strictly within your computer&apos;s memory with zero telemetry.
                </p>
              </div>

              {/* Visual Mockup: Sleek Encrypted Local Directory Strip */}
              <div className="mt-8 rounded-xl border border-white/[0.08] bg-[#07080c] p-4.5 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-zinc-400">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-zinc-200 font-semibold">Local Storage Ingestion</span>
                  </span>
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/25">
                    0 Bytes Egress
                  </span>
                </div>

                <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center justify-between rounded-lg bg-white/[0.02] p-3 border border-white/[0.05]">
                    <div className="truncate">
                      <div className="truncate text-xs font-semibold text-zinc-200">Merger_Agreement.pdf</div>
                      <div className="text-[10px] text-zinc-500">2.4 MB · Indexed</div>
                    </div>
                    <span className="text-[#00b91e] font-bold text-sm">✓</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white/[0.02] p-3 border border-white/[0.05]">
                    <div className="truncate">
                      <div className="truncate text-xs font-semibold text-zinc-200">Q3_Financials.xlsx</div>
                      <div className="text-[10px] text-zinc-500">1.8 MB · Indexed</div>
                    </div>
                    <span className="text-[#00b91e] font-bold text-sm">✓</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white/[0.02] p-3 border border-white/[0.05]">
                    <div className="truncate">
                      <div className="truncate text-xs font-semibold text-zinc-200">Board_Minutes.docx</div>
                      <div className="text-[10px] text-zinc-500">840 KB · Indexed</div>
                    </div>
                    <span className="text-[#00b91e] font-bold text-sm">✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Card 2: Verifiable Page Citations (5 Columns) */}
            <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0c0d12]/90 p-8 sm:p-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:border-white/20">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 font-mono text-xs font-semibold text-sky-400">
                    Source Grounded
                  </span>
                </div>

                <h3 className="mt-6 text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Verifiable Document Citations
                </h3>
                <p className="mt-3 text-base leading-relaxed text-zinc-300">
                  Every claim is grounded directly in your uploaded files with clickable page numbers and exact highlighted quotes.
                </p>
              </div>

              {/* Visual Citation Preview */}
              <div className="mt-8 rounded-xl border border-sky-500/20 bg-[#070910] p-4.5 font-mono text-xs">
                <div className="flex items-center justify-between text-zinc-400 pb-2.5 border-b border-white/[0.06]">
                  <span className="text-sky-300 font-semibold">Contract_Agreement.pdf</span>
                  <span className="rounded bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-bold text-sky-300 border border-sky-500/30">
                    Page 14 · § 4.2
                  </span>
                </div>
                <div className="mt-3 text-zinc-200 leading-relaxed text-xs bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
                  &quot;...termination obligations require{' '}
                  <span className="rounded bg-sky-500/25 px-1 py-0.5 font-semibold text-sky-200 border border-sky-400/30">
                    thirty (30) days prior written notice
                  </span>{' '}
                  to all governing parties...&quot;
                </div>
              </div>
            </div>

            {/* Bento Card 3: Hands-Free Spoken Audio Briefings (Full Width 12 Columns) */}
            <div className="lg:col-span-12 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-white/[0.08] bg-[#0c0d12]/90 p-8 sm:p-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:border-white/20">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Offline Spoken Audio Briefings
                  </h3>
                </div>
                <p className="mt-3 text-base leading-relaxed text-zinc-300">
                  Synthesize natural spoken executive overviews directly in your browser with standard Play/Pause controls.
                  Zero external cloud voice fees and 100% offline playback.
                </p>
              </div>

              {/* Dynamic Waveform Player Mockup */}
              <div className="w-full sm:w-auto shrink-0 rounded-xl border border-white/[0.08] bg-[#07080c] px-6 py-4 flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  aria-label="Play sample audio"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00b91e] text-black shadow-[0_0_20px_rgba(0,185,30,0.3)] hover:bg-[#14cf32] transition-colors"
                >
                  <span className="text-xs font-bold">{isPlaying ? '❚❚' : '▶'}</span>
                </button>
                <div className="flex flex-col">
                  <span className="font-mono text-xs font-bold text-white">Executive Briefing Audio</span>
                  <div className="mt-2 flex items-center gap-1.5 h-4">
                    {[40, 70, 30, 90, 60, 100, 45, 80, 55, 95, 35, 75, 50].map((h, i) => (
                      <span
                        key={i}
                        className={`w-1 rounded-full bg-emerald-400 transition-all duration-300 ${
                          isPlaying ? 'animate-pulse' : 'opacity-60'
                        }`}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 font-mono text-[10px] text-zinc-400">
                    <span>2:14</span>
                    <span>·</span>
                    <span className="text-emerald-400 font-medium">Browser Speech API</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Minimalist Document Format Strip */}
        <div className="mx-auto mt-12 w-full max-w-[1780px] rounded-2xl border border-white/[0.08] bg-[#08080c] p-6 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-[#00b91e]" />
              <span className="text-sm sm:text-base font-semibold text-white">
                Universal Support:
              </span>
              <span className="text-sm sm:text-base text-zinc-300 font-mono">
                PDF · Excel (XLSX) · Word (DOCX) · PowerPoint · HTML · Entire Folders
              </span>
            </div>
            <span className="font-mono text-xs text-[#00b91e] font-semibold bg-[#00b91e]/10 border border-[#00b91e]/25 px-3 py-1 rounded-full w-fit">
              100% Native Parsers · Zero Cloud Upload
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductStorySection;
