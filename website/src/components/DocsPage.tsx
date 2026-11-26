import React, { useState } from 'react';
import { REPO_META, SUPPORTED_FORMATS, GUARDRAIL_TIERS } from '../data/guardragData';

export interface DocSection {
  id: string;
  group: 'Getting Started' | 'Core Features' | 'Advanced & API';
  title: string;
  description: string;
  headings: { id: string; label: string }[];
  render: (copy: (id: string, text: string) => void, copiedId: string | null) => React.ReactNode;
}

const CodeBlock: React.FC<{
  id: string;
  title?: string;
  code: string;
  copy: (id: string, text: string) => void;
  copiedId: string | null;
}> = ({ id, title, code, copy, copiedId }) => (
  <div className="my-6 w-full overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0c10] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
    <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#101117] px-4 py-3">
      <span className="font-mono text-sm font-medium text-zinc-300">{title ?? 'bash'}</span>
      <button
        type="button"
        onClick={() => copy(id, code)}
        className="rounded-md border border-white/[0.1] bg-white/[0.04] px-3 py-1 font-mono text-xs font-semibold text-zinc-200 transition-colors hover:border-white/20 hover:text-white"
      >
        {copiedId === id ? <span className="text-[#00b91e]">Copied!</span> : 'Copy'}
      </button>
    </div>
    <pre className="overflow-x-auto p-5 font-mono text-sm sm:text-[15px] leading-7 text-zinc-200">
      <code>{code}</code>
    </pre>
  </div>
);

const Callout: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="my-6 w-full rounded-xl border border-emerald-500/25 bg-emerald-950/15 px-6 py-5 text-sm sm:text-base leading-relaxed text-zinc-200">
    <span className="mr-2.5 inline-block rounded border border-emerald-500/35 bg-emerald-500/15 px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
      {label}
    </span>
    {children}
  </div>
);

export const DOC_SECTIONS: DocSection[] = [
  {
    id: 'introduction',
    group: 'Getting Started',
    title: 'Introduction',
    description:
      'Learn what GuardRAG is, how it works, and why it provides absolute confidentiality for sensitive documents.',
    headings: [
      { id: 'overview', label: 'System Overview' },
      { id: 'value-pillars', label: 'Core Value Pillars' },
      { id: 'architecture', label: 'Local Architecture' },
      { id: 'problem-solved', label: 'Threat Model & Security' },
      { id: 'quick-comparison', label: 'Cloud AI vs GuardRAG' },
    ],
    render: () => (
      <div className="space-y-12 text-base sm:text-[17px] leading-relaxed text-zinc-300">
        {/* System Overview */}
        <div id="overview" className="scroll-mt-24 space-y-4">
          <p className="text-lg sm:text-xl leading-relaxed text-zinc-200">
            <strong className="text-white font-semibold">GuardRAG</strong> is a 100% offline document intelligence system designed for individuals, legal teams, healthcare professionals, and enterprises that cannot upload confidential files to public cloud AI tools.
          </p>
          <p>
            Drop in legal agreements, financial spreadsheets, medical records, PowerPoint decks, or entire folders. GuardRAG indexes and analyzes them directly on your computer, providing conversational answers with exact source citations and spoken audio briefings—all with zero network egress.
          </p>

          {/* Quick Security Badges */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 font-mono text-xs">
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 font-semibold text-emerald-400">
              ✓ 100% On-Device
            </span>
            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 font-semibold text-sky-400">
              ✓ Zero Cloud Telemetry
            </span>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 font-semibold text-amber-400">
              ✓ 4-Tier Automated Redaction
            </span>
            <span className="rounded-full border border-zinc-700 bg-white/[0.04] px-3.5 py-1 font-semibold text-zinc-300">
              ✓ MIT Open Source
            </span>
          </div>
        </div>

        {/* 4 Elevated Core Value Pillars (React Bits / UIverse aesthetic) */}
        <div id="value-pillars" className="scroll-mt-24">
          <h3 className="mb-6 pt-2 text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#00b91e]" />
            <span>Core Value Pillars</span>
          </h3>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {/* Pillar 1 */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0c0d12] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00b91e]/15 text-[#00b91e] border border-[#00b91e]/25">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="mt-5 text-lg font-bold text-white">100% On-Device</h4>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                Zero cloud uploads, zero telemetry, and zero third-party servers. Your documents and vectors never leave your physical hard drive.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0c0d12] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/25">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="mt-5 text-lg font-bold text-white">Confidentiality Shield</h4>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                Automatically detects and masks credit cards, passwords, personal contacts, SSNs, and HIPAA data before reasoning occurs.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0c0d12] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="mt-5 text-lg font-bold text-white">Verifiable Citations</h4>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                Eliminates hallucinations by grounding every answer directly in source documents with exact page numbers and highlighted quotes.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0c0d12] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/25">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </div>
              <h4 className="mt-5 text-lg font-bold text-white">Spoken Audio Briefings</h4>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                Synthesizes spoken executive summaries using your browser&apos;s native Web Speech API with zero external cloud voice fees.
              </p>
            </div>
          </div>
        </div>

        {/* Local Architecture & Data Flow */}
        <div id="architecture" className="scroll-mt-24 rounded-2xl border border-white/[0.09] bg-[#0c0d12] p-8">
          <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5 mb-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#00b91e]" />
            <span>Air-Gapped Architecture &amp; Data Pipeline</span>
          </h3>
          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-6">
            GuardRAG executes every stage of the document intelligence pipeline entirely within your device&apos;s local memory space:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-white/[0.08] bg-[#07080c] p-4.5">
              <div className="font-mono text-xs font-semibold text-[#00b91e]">STEP 01</div>
              <div className="mt-1.5 font-bold text-white text-base">Native File Ingest</div>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                PyPDF, openpyxl, docx2txt, and python-pptx extract clean text and metadata locally.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#07080c] p-4.5">
              <div className="font-mono text-xs font-semibold text-sky-400">STEP 02</div>
              <div className="mt-1.5 font-bold text-white text-base">Privacy Shield</div>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                4-tier regex filter and Luhn checksum redact PII and strip prompt override attempts.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#07080c] p-4.5">
              <div className="font-mono text-xs font-semibold text-amber-400">STEP 03</div>
              <div className="mt-1.5 font-bold text-white text-base">Hybrid Retrieval</div>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Dense semantic vector search + BM25 keyword matching blended using Reciprocal Rank Fusion.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#07080c] p-4.5">
              <div className="font-mono text-xs font-semibold text-fuchsia-400">STEP 04</div>
              <div className="mt-1.5 font-bold text-white text-base">Local AI Stream</div>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Free local Ollama models stream answers with exact citations and native spoken audio.
              </p>
            </div>
          </div>
        </div>

        {/* Threat Model */}
        <div id="problem-solved" className="scroll-mt-24 rounded-2xl border border-white/[0.09] bg-[#0c0d12] p-8">
          <h4 className="text-xl sm:text-2xl font-bold text-white mb-3">Why Cloud AI Poses a Confidentiality Risk</h4>
          <p className="text-base leading-relaxed text-zinc-300">
            When you upload private documents to public cloud AI tools (such as ChatGPT, Claude, or Google NotebookLM), your files travel over external networks and can be retained, reviewed, or used for model training. GuardRAG eliminates this exposure entirely by running parsing, indexing, and reasoning directly on your local CPU.
          </p>
        </div>

        {/* Comparison Table */}
        <div id="quick-comparison" className="scroll-mt-24">
          <h3 className="mb-4 text-xl sm:text-2xl font-bold text-white">Cloud AI vs GuardRAG at a Glance</h3>
          <div className="w-full overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#0c0d12]">
            <table className="w-full min-w-[560px] text-left text-sm sm:text-base">
              <thead className="border-b border-white/[0.07] bg-[#101117] font-mono text-xs sm:text-sm font-semibold uppercase text-zinc-400">
                <tr>
                  <th className="px-6 py-4">Security Dimension</th>
                  <th className="px-6 py-4 text-emerald-400">GuardRAG (Offline)</th>
                  <th className="px-6 py-4 text-zinc-400">Public Cloud AI Tools</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-zinc-300">
                <tr>
                  <td className="px-6 py-4 font-semibold text-white">Data Storage</td>
                  <td className="px-6 py-4 text-emerald-400 font-semibold">100% Local Hard Drive</td>
                  <td className="px-6 py-4 text-zinc-400">Remote Cloud Servers</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold text-white">Sensitive PII Redaction</td>
                  <td className="px-6 py-4 text-emerald-400 font-semibold">Automatic 4-Tier Filtering</td>
                  <td className="px-6 py-4 text-zinc-400">Manual / None</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold text-white">Internet Requirement</td>
                  <td className="px-6 py-4 text-emerald-400 font-semibold">Air-gapped (Zero Egress)</td>
                  <td className="px-6 py-4 text-zinc-400">Always Connected</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold text-white">Cost &amp; Licensing</td>
                  <td className="px-6 py-4 text-emerald-400 font-semibold">Free &amp; Open Source (MIT)</td>
                  <td className="px-6 py-4 text-zinc-400">Monthly Subscriptions</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'installation',
    group: 'Getting Started',
    title: 'Installation',
    description:
      'Set up GuardRAG and configure a free local model in under two minutes.',
    headings: [
      { id: 'step-1', label: '1. Install GuardRAG' },
      { id: 'step-2', label: '2. Start Local Model' },
      { id: 'hardware', label: 'Hardware Requirements' },
    ],
    render: (copy, copiedId) => (
      <div className="space-y-8 text-base sm:text-[17px] leading-relaxed text-zinc-300">
        <p>
          GuardRAG runs locally on Windows, macOS, and Linux. It requires <strong className="text-white">Python 3.9–3.12+</strong> and a free local model provider such as <strong className="text-white">Ollama</strong>.
        </p>

        <div id="step-1" className="scroll-mt-24">
          <h3 className="text-xl sm:text-2xl font-bold text-white">Step 1: Install GuardRAG</h3>
          <p className="mt-2 text-sm sm:text-base text-zinc-400">
            Install the official package from PyPI in your terminal or virtual environment:
          </p>
          <CodeBlock
            id="install-pip"
            title="Terminal"
            code={`pip install guard-rag`}
            copy={copy}
            copiedId={copiedId}
          />
        </div>

        <div id="step-2" className="scroll-mt-24">
          <h3 className="text-xl sm:text-2xl font-bold text-white">Step 2: Start a Free Local Model</h3>
          <p className="mt-2 text-sm sm:text-base text-zinc-400">
            If you don&apos;t have Ollama yet, download it from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-[#00b91e] underline">ollama.ai</a>. Then pull a recommended model:
          </p>
          <CodeBlock
            id="install-ollama"
            title="Terminal"
            code={`# Fast and efficient on standard laptop CPUs
ollama run llama3.2

# Or try lightweight models
ollama pull gemma3:1b
ollama pull mistral`}
            copy={copy}
            copiedId={copiedId}
          />
        </div>

        <div id="hardware" className="scroll-mt-24">
          <Callout label="No GPU Required">
            Document vectorization runs locally on CPU using SIMD-accelerated FastEmbed ONNX (~60 MB RAM). You do not need an expensive GPU or CUDA setup to index and search your documents.
          </Callout>
        </div>
      </div>
    ),
  },
  {
    id: 'quickstart',
    group: 'Getting Started',
    title: 'Quickstart (Browser Studio)',
    description:
      'Launch the local browser studio, upload your documents, and start asking questions.',
    headings: [
      { id: 'launch-cmd', label: 'Launch Command' },
      { id: 'studio-workflow', label: '3-Step Studio Workflow' },
    ],
    render: (copy, copiedId) => (
      <div className="space-y-8 text-base sm:text-[17px] leading-relaxed text-zinc-300">
        <div id="launch-cmd" className="scroll-mt-24">
          <p>
            To open the private document workspace in your default browser, run GuardRAG with no arguments:
          </p>
          <CodeBlock
            id="qs-launch"
            title="Terminal"
            code={`guard-rag`}
            copy={copy}
            copiedId={copiedId}
          />
        </div>

        <div id="studio-workflow" className="scroll-mt-24">
          <h3 className="mb-4 pt-2 text-xl sm:text-2xl font-bold text-white">How to Use the Workspace</h3>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="rounded-xl border border-white/[0.08] bg-[#0c0d12] p-6 shadow-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00b91e]/15 text-base font-bold text-[#00b91e]">
                1
              </span>
              <h4 className="mt-4 text-base sm:text-lg font-bold text-white">Choose a Sensitivity Level</h4>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Select from <em>Public</em>, <em>Internal</em>, <em>Confidential</em>, or <em>Restricted</em> depending on your document&apos;s privacy needs.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#0c0d12] p-6 shadow-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00b91e]/15 text-base font-bold text-[#00b91e]">
                2
              </span>
              <h4 className="mt-4 text-base sm:text-lg font-bold text-white">Drop in Your Files</h4>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Add PDFs, Word docs, Excel spreadsheets, PowerPoint slides, or text files. GuardRAG parses and indexes them locally.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#0c0d12] p-6 shadow-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00b91e]/15 text-base font-bold text-[#00b91e]">
                3
              </span>
              <h4 className="mt-4 text-base sm:text-lg font-bold text-white">Ask in Plain English</h4>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Ask questions naturally. Review verifiable citations or click &quot;Audio Overview&quot; for a hands-free spoken summary.
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'cli-reference',
    group: 'Core Features',
    title: 'Command Line Guide',
    description:
      'Query documents headlessly or index entire directories straight from your terminal.',
    headings: [
      { id: 'cli-examples', label: 'Command Examples' },
      { id: 'cli-options', label: 'CLI Options Table' },
    ],
    render: (copy, copiedId) => (
      <div className="space-y-8 text-base sm:text-[17px] leading-relaxed text-zinc-300">
        <div id="cli-examples" className="scroll-mt-24">
          <p>
            Prefer the command line? You can query single documents or entire folders directly from your terminal:
          </p>
          <CodeBlock
            id="cli-examples"
            title="Terminal"
            code={`# Query a single document headlessly
guard-rag --file contracts/NDA.pdf \\
  --query "What are our non-disclosure obligations?" \\
  --sensitivity Confidential

# Recursively index and query an entire folder
guard-rag ./financial_reports/

# Launch the web studio on custom port
guard-rag --port 8080`}
            copy={copy}
            copiedId={copiedId}
          />
        </div>

        <div id="cli-options" className="scroll-mt-24">
          <h3 className="mb-4 text-xl sm:text-2xl font-bold text-white">Common CLI Options</h3>
          <div className="w-full overflow-x-auto rounded-xl border border-white/[0.08]">
            <table className="w-full min-w-[540px] text-left text-sm sm:text-base">
              <thead className="border-b border-white/[0.07] bg-[#101117] font-mono text-xs sm:text-sm font-semibold uppercase text-zinc-400">
                <tr>
                  <th className="px-5 py-3.5">Option</th>
                  <th className="px-5 py-3.5">Short</th>
                  <th className="px-5 py-3.5">Default</th>
                  <th className="px-5 py-3.5">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-zinc-300">
                <tr>
                  <td className="px-5 py-3.5 font-mono text-emerald-400">--file &lt;path&gt;</td>
                  <td className="px-5 py-3.5 font-mono">-f</td>
                  <td className="px-5 py-3.5 font-mono text-zinc-400">None</td>
                  <td className="px-5 py-3.5">Path to document (opens Web UI if omitted)</td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 font-mono text-emerald-400">--query &lt;text&gt;</td>
                  <td className="px-5 py-3.5 font-mono">-q</td>
                  <td className="px-5 py-3.5 font-mono text-zinc-400">Interactive</td>
                  <td className="px-5 py-3.5">Question to answer from the document</td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 font-mono text-emerald-400">--sensitivity &lt;tier&gt;</td>
                  <td className="px-5 py-3.5 font-mono">-s</td>
                  <td className="px-5 py-3.5 font-mono text-zinc-400">Internal</td>
                  <td className="px-5 py-3.5">Public, Internal, Confidential, or Restricted</td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 font-mono text-emerald-400">--model &lt;name&gt;</td>
                  <td className="px-5 py-3.5 font-mono">-m</td>
                  <td className="px-5 py-3.5 font-mono text-zinc-400">llama3.2</td>
                  <td className="px-5 py-3.5">Local Ollama model name</td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 font-mono text-emerald-400">--port &lt;int&gt;</td>
                  <td className="px-5 py-3.5 font-mono">-p</td>
                  <td className="px-5 py-3.5 font-mono text-zinc-400">8000</td>
                  <td className="px-5 py-3.5">Port for the web dashboard</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'supported-formats',
    group: 'Core Features',
    title: 'Supported File Formats',
    description:
      'Universal document parsing across contracts, spreadsheets, slide decks, web pages, and folders.',
    headings: [
      { id: 'native-engines', label: 'Native Document Engines' },
      { id: 'folder-support', label: 'Directory Ingestion' },
    ],
    render: () => (
      <div className="space-y-8 text-base sm:text-[17px] leading-relaxed text-zinc-300">
        <div id="native-engines" className="scroll-mt-24">
          <p>
            GuardRAG includes native document parsers that extract clean text, tables, and slide notes
            directly on your local machine without using any third-party conversion APIs:
          </p>

          <div className="mt-4 w-full overflow-x-auto rounded-xl border border-white/[0.08]">
            <table className="w-full min-w-[540px] text-left text-sm sm:text-base">
              <thead className="border-b border-white/[0.07] bg-[#101117] font-mono text-xs sm:text-sm font-semibold uppercase text-zinc-400">
                <tr>
                  <th className="px-5 py-3.5">Format</th>
                  <th className="px-5 py-3.5">Engine</th>
                  <th className="px-5 py-3.5">Parsing Capability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-zinc-300">
                {SUPPORTED_FORMATS.map((fmt) => (
                  <tr key={fmt.ext}>
                    <td className="px-5 py-3.5 font-mono text-emerald-400 font-semibold">{fmt.ext}</td>
                    <td className="px-5 py-3.5 font-mono text-zinc-300">{fmt.engine}</td>
                    <td className="px-5 py-3.5 text-zinc-300">{fmt.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div id="folder-support" className="scroll-mt-24 rounded-xl border border-white/[0.08] bg-[#0c0d12] p-7">
          <h4 className="text-lg sm:text-xl font-bold text-white">Batch Directory Ingestion</h4>
          <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-zinc-300">
            Have dozens of files across subdirectories? Run <code className="text-emerald-400">guard-rag ./my_folder/</code> to automatically traverse and index all compatible documents in a single unified knowledge base.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'safety-redaction',
    group: 'Core Features',
    title: 'Confidentiality Shield',
    description:
      'Understand how GuardRAG prevents accidental leaks with 4 sensitivity protection levels.',
    headings: [
      { id: 'sensitivity-tiers', label: '4 Protection Levels' },
      { id: 'python-redactor', label: 'Programmatic Redaction' },
    ],
    render: (copy, copiedId) => (
      <div className="space-y-8 text-base sm:text-[17px] leading-relaxed text-zinc-300">
        <p>
          GuardRAG enforces real-time confidentiality checks on both uploaded documents and generated answers.
        </p>

        <div id="sensitivity-tiers" className="scroll-mt-24">
          <h3 className="mb-4 text-xl sm:text-2xl font-bold text-white">4 Sensitivity Protection Levels</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {GUARDRAIL_TIERS.map((tier) => (
              <div key={tier.id} className="rounded-xl border border-white/[0.08] bg-[#0c0d12] p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-base sm:text-lg font-bold text-white">{tier.id}</span>
                  <span className="rounded border border-white/[0.1] bg-white/[0.03] px-2.5 py-0.5 text-xs text-zinc-300 font-mono">
                    {tier.badge}
                  </span>
                </div>
                <p className="mt-2.5 text-sm sm:text-[15px] leading-relaxed text-zinc-300">{tier.summary}</p>
                <div className="mt-3.5 text-xs sm:text-sm text-zinc-400">
                  <strong className="text-zinc-300">Best for:</strong> {tier.useCase}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div id="python-redactor" className="scroll-mt-24">
          <h3 className="mb-2 text-xl sm:text-2xl font-bold text-white">Using Safety in Python</h3>
          <CodeBlock
            id="sdk-safety"
            title="python"
            code={`from guardrag.utils.safety import check_input_safety, sanitize_document_content
from guardrag.utils.redactor import redact_and_map

# 1. Neutralize indirect prompt injection payloads
clean_text = sanitize_document_content(untrusted_document_text)

# 2. Context-preserving PII masking with reversible mapping
anonymized, mapping = redact_and_map("Contact Alice at alice@company.com")
# Output: "Contact [PERSON_1] at [EMAIL_1]"

# 3. Test queries against sensitivity tiers
is_safe, reason = check_input_safety(user_query, tier="Confidential")`}
            copy={copy}
            copiedId={copiedId}
          />
        </div>
      </div>
    ),
  },
  {
    id: 'offline-audio',
    group: 'Core Features',
    title: 'Offline Audio Overviews',
    description:
      'Generate and listen to hands-free spoken document briefings without sending audio to the cloud.',
    headings: [
      { id: 'how-audio-works', label: 'How Audio Overviews Work' },
      { id: 'audio-benefits', label: 'Privacy & Cost Benefits' },
    ],
    render: () => (
      <div className="space-y-8 text-base sm:text-[17px] leading-relaxed text-zinc-300">
        <p>
          GuardRAG brings the viral NotebookLM audio briefing experience to completely offline setups.
        </p>

        <div id="how-audio-works" className="scroll-mt-24 rounded-xl border border-white/[0.08] bg-[#0c0d12] p-7 space-y-4">
          <h4 className="text-lg sm:text-xl font-bold text-white">How Offline Audio Works</h4>
          <ol className="list-decimal space-y-3 pl-5 text-sm sm:text-base text-zinc-300">
            <li>Ingest any document (PDF contract, spreadsheet, or slide deck).</li>
            <li>Click the <strong className="text-white">Audio Overview</strong> button in the document header.</li>
            <li>Your browser&apos;s native speech engine (<code className="text-emerald-400">window.speechSynthesis</code>) synthesizes the briefing instantly.</li>
            <li>Control playback with standard Play, Pause, and Resume controls.</li>
          </ol>
        </div>

        <div id="audio-benefits" className="scroll-mt-24 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-xl border border-white/[0.08] bg-[#08080c] p-6 text-sm sm:text-base leading-relaxed text-zinc-300">
            <strong className="text-white font-semibold">Zero Cloud Voice Fees:</strong> No ElevenLabs or OpenAI audio API subscriptions required.
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#08080c] p-6 text-sm sm:text-base leading-relaxed text-zinc-300">
            <strong className="text-white font-semibold">Zero Data Egress:</strong> Audio waveform data never leaves your computer or browser.
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'lan-sharing',
    group: 'Core Features',
    title: 'Office LAN Collaboration',
    description:
      'Share document Q&A across your office Wi-Fi with host-enforced access controls.',
    headings: [
      { id: 'host-authority', label: 'Host Authority Principle' },
      { id: 'guest-experience', label: 'Guest Browser Experience' },
    ],
    render: () => (
      <div className="space-y-8 text-base sm:text-[17px] leading-relaxed text-zinc-300">
        <p>
          Need colleagues to review the same documents? GuardRAG lets you share an interactive Q&amp;A link across your office Wi-Fi or local network without uploading files to the internet.
        </p>

        <div id="host-authority" className="scroll-mt-24">
          <h3 className="mb-2 text-xl sm:text-2xl font-bold text-white">The Host Authority Principle</h3>
          <p className="text-sm sm:text-base text-zinc-400">
            GuardRAG enforces strict security boundaries between the host machine and guest viewers:
          </p>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-white/[0.08] bg-[#0c0d12] p-6">
              <div className="text-base sm:text-lg font-bold text-white">Host Privileges (Your PC)</div>
              <ul className="mt-3 space-y-2 text-sm sm:text-[15px] text-zinc-300">
                <li>✓ Ingest &amp; delete documents</li>
                <li>✓ Toggle sensitivity tiers &amp; model parameters</li>
                <li>✓ Control share link permissions &amp; access status</li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#0c0d12] p-6">
              <div className="text-base sm:text-lg font-bold text-white">Guest Privileges (Colleagues)</div>
              <ul className="mt-3 space-y-2 text-sm sm:text-[15px] text-zinc-300">
                <li>✓ Chat with indexed documents in any web browser</li>
                <li>✓ Inspect highlighted citations &amp; listen to audio</li>
                <li>✕ Zero file upload or vector setting access</li>
              </ul>
            </div>
          </div>
        </div>

        <div id="guest-experience" className="scroll-mt-24">
          <Callout label="Zero Setup for Guests">
            Colleagues only need a standard web browser on the same Wi-Fi. They do not need to install Python, Ollama, or any software.
          </Callout>
        </div>
      </div>
    ),
  },
  {
    id: 'python-sdk',
    group: 'Advanced & API',
    title: 'Python SDK Integration',
    description:
      'Embed local RAG pipelines and PII redaction directly inside Python applications.',
    headings: [
      { id: 'sdk-usage', label: 'build_rag_chain() Usage' },
    ],
    render: (copy, copiedId) => (
      <div className="space-y-8 text-base sm:text-[17px] leading-relaxed text-zinc-300">
        <div id="sdk-usage" className="scroll-mt-24">
          <p>
            Import <code className="text-emerald-400">build_rag_chain</code> directly into your scripts or backend services:
          </p>
          <CodeBlock
            id="sdk-code"
            title="python"
            code={`from guardrag.rag.core import build_rag_chain

db_id, chain = build_rag_chain(
    file_paths=["documents/partnership_agreement.pdf"],
    model="llama3.2",
    chunk_size=1000,
    chunk_overlap=200,
    redact_pii=True,
    storage_dir=".guardrag_storage",
)

response = chain.invoke({
    "input": "What are the intellectual property terms?",
    "chat_history": [],
})
print(response["answer"])`}
            copy={copy}
            copiedId={copiedId}
          />
        </div>
      </div>
    ),
  },
  {
    id: 'docker-tests',
    group: 'Advanced & API',
    title: 'Docker & Testing',
    description:
      'Deploy containerized GuardRAG services or run automated pytest checks.',
    headings: [
      { id: 'docker-deploy', label: 'Docker Compose' },
      { id: 'pytest-suite', label: 'Automated Tests' },
    ],
    render: (copy, copiedId) => (
      <div className="space-y-8 text-base sm:text-[17px] leading-relaxed text-zinc-300">
        <div id="docker-deploy" className="scroll-mt-24">
          <p>
            Deploy GuardRAG in containerized environments with persistent volume storage:
          </p>
          <CodeBlock
            id="docker-cmd"
            title="Terminal"
            code={`# Clone repository
git clone https://github.com/sowmiyan-s/GUARD-RAG.git
cd GUARD-RAG

# Launch bundled GuardRAG + Ollama services
docker-compose up -d`}
            copy={copy}
            copiedId={copiedId}
          />
        </div>

        <div id="pytest-suite" className="scroll-mt-24">
          <h4 className="text-lg sm:text-xl font-bold text-white">Running the Test Suite</h4>
          <CodeBlock
            id="pytest-cmd"
            title="Terminal"
            code={`# Run the automated pytest suite (84 tests passing)
pytest -v`}
            copy={copy}
            copiedId={copiedId}
          />

          <Callout label="Full Documentation">
            Detailed architecture diagrams, API schemas, and deployment instructions are available on{' '}
            <a
              href={REPO_META.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline hover:text-[#00b91e]"
            >
              GitHub Docs
            </a>
            .
          </Callout>
        </div>
      </div>
    ),
  },
];

const GROUPS: DocSection['group'][] = ['Getting Started', 'Core Features', 'Advanced & API'];

interface DocsPageProps {
  activeSectionId: string;
  onSelectSection: (id: string) => void;
  onBackHome: () => void;
}

export const DocsPage: React.FC<DocsPageProps> = ({
  activeSectionId,
  onSelectSection,
  onBackHome,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentIdx = Math.max(
    0,
    DOC_SECTIONS.findIndex((s) => s.id === activeSectionId)
  );
  const current = DOC_SECTIONS[currentIdx] ?? DOC_SECTIONS[0];
  const prev = currentIdx > 0 ? DOC_SECTIONS[currentIdx - 1] : null;
  const next = currentIdx < DOC_SECTIONS.length - 1 ? DOC_SECTIONS[currentIdx + 1] : null;

  const copy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const selectAndScroll = (id: string) => {
    onSelectSection(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen w-full bg-[#060709] pt-20 pb-24 text-zinc-200">
      {/* Expansive Full-Width 3-Column Documentation Architecture */}
      <div className="mx-auto flex w-full max-w-[1840px] flex-col px-4 sm:px-8 lg:flex-row lg:gap-10 xl:gap-12 xl:px-12 2xl:px-16">
        {/* Mobile section selector */}
        <div className="border-b border-white/[0.08] py-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-white/[0.1] bg-[#0c0d12] px-4 py-2.5 text-xs font-medium text-white shadow-sm"
          >
            <span>
              <span className="text-zinc-500">{current.group} / </span>
              {current.title}
            </span>
            <span className="font-mono text-zinc-400">{mobileMenuOpen ? '−' : '+'}</span>
          </button>
          {mobileMenuOpen && (
            <nav className="mt-2 space-y-4 rounded-xl border border-white/[0.08] bg-[#0c0d12] p-5">
              {GROUPS.map((group) => (
                <div key={group}>
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    {group}
                  </div>
                  <div className="space-y-1">
                    {DOC_SECTIONS.filter((s) => s.group === group).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => selectAndScroll(s.id)}
                        className={`block w-full rounded-lg px-3 py-2 text-left text-xs ${
                          s.id === current.id
                            ? 'bg-[#00b91e]/15 font-semibold text-[#00b91e]'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          )}
        </div>

        {/* Desktop Left Navigation Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-white/[0.07] py-10 pr-6 lg:block 2xl:w-72">
          <div className="sticky top-24 space-y-8">
            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0c0d12] px-3.5 py-1.5 font-mono text-xs text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
            >
              <span aria-hidden="true">←</span>
              <span>Back to Overview</span>
            </button>

            {GROUPS.map((group) => (
              <div key={group}>
                <div className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {group}
                </div>
                <ul className="space-y-1.5 border-l border-white/[0.08]">
                  {DOC_SECTIONS.filter((s) => s.group === group).map((s) => {
                    const active = s.id === current.id;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => selectAndScroll(s.id)}
                          className={`-ml-px block w-full border-l-2 py-2 pl-4 text-left text-sm transition-colors ${
                            active
                              ? 'border-[#00b91e] font-semibold text-[#00b91e]'
                              : 'border-transparent text-zinc-400 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          {s.title}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Docs Content — Expands dynamically across screen */}
        <article className="min-w-0 flex-1 py-10 lg:py-12">
          <div className="w-full">
            <div className="mb-3 flex items-center gap-2 font-mono text-xs sm:text-sm text-zinc-400">
              <span>Docs</span>
              <span>/</span>
              <span>{current.group}</span>
              <span>/</span>
              <span className="text-emerald-400">{current.title}</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {current.title}
            </h1>
            <p className="mt-4 border-b border-white/[0.08] pb-8 text-lg sm:text-xl leading-relaxed text-zinc-300">
              {current.description}
            </p>

            <div className="pt-8">{current.render(copy, copiedId)}</div>

            {/* Previous / Next Navigation Cards — Span full width */}
            <div className="mt-16 grid grid-cols-1 gap-5 border-t border-white/[0.08] pt-8 sm:grid-cols-2">
              {prev ? (
                <button
                  type="button"
                  onClick={() => selectAndScroll(prev.id)}
                  className="rounded-xl border border-white/[0.08] bg-[#0c0d12] p-6 text-left transition-colors hover:border-white/20"
                >
                  <div className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    ← Previous
                  </div>
                  <div className="mt-1.5 text-base sm:text-lg font-semibold text-white">{prev.title}</div>
                </button>
              ) : (
                <div />
              )}

              {next && (
                <button
                  type="button"
                  onClick={() => selectAndScroll(next.id)}
                  className="rounded-xl border border-white/[0.08] bg-[#0c0d12] p-6 text-right transition-colors hover:border-[#00b91e]/40"
                >
                  <div className="font-mono text-xs font-semibold uppercase tracking-wider text-[#00b91e]">
                    Next →
                  </div>
                  <div className="mt-1.5 text-base sm:text-lg font-semibold text-white">{next.title}</div>
                </button>
              )}
            </div>
          </div>
        </article>

        {/* Desktop Right Rail: "On this page" & Quick Resources (Linear/Next.js/Stripe style) */}
        <aside className="hidden w-64 lg:w-72 xl:w-80 shrink-0 border-l border-white/[0.07] py-10 pl-8 lg:block">
          <div className="sticky top-24 space-y-8">
            {/* Quick Jumps */}
            {current.headings && current.headings.length > 0 && (
              <div>
                <div className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  On this page
                </div>
                <ul className="space-y-2.5 border-l border-white/[0.08] text-sm">
                  {current.headings.map((h) => (
                    <li key={h.id}>
                      <a
                        href={`#${h.id}`}
                        className="-ml-px block border-l-2 border-transparent pl-4 text-zinc-400 transition-colors hover:border-[#00b91e] hover:text-white"
                      >
                        {h.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Community & Quick Links */}
            <div className="rounded-xl border border-white/[0.08] bg-[#0c0d12] p-5 text-sm">
              <div className="font-bold text-white text-base">Community &amp; Code</div>
              <ul className="mt-3.5 space-y-2.5 text-zinc-300">
                <li>
                  <a
                    href={REPO_META.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between hover:text-white"
                  >
                    <span>GitHub Repository</span>
                    <span>↗</span>
                  </a>
                </li>
                <li>
                  <a
                    href={REPO_META.pypiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between hover:text-white"
                  >
                    <span>PyPI Package</span>
                    <span>↗</span>
                  </a>
                </li>
                <li>
                  <a
                    href={REPO_META.architectureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between hover:text-white"
                  >
                    <span>Architecture Guide</span>
                    <span>↗</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Offline Assurance Badge */}
            <div className="flex items-center gap-2.5 rounded-lg border border-[#00b91e]/25 bg-[#00b91e]/[0.06] p-3.5 text-xs text-zinc-200">
              <span className="h-2 w-2 rounded-full bg-[#00b91e] animate-pulse" />
              <span>100% Offline · Zero Telemetry</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DocsPage;
