import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { REPO_META } from '../data/guardragData';

interface DocStep {
  step: string;
  title: string;
  summary: string;
  code: string;
  note?: string;
}

interface DocTrack {
  id: 'sdk' | 'cli' | 'api';
  label: string;
  subtitle: string;
  steps: DocStep[];
}

const DOC_TRACKS: DocTrack[] = [
  {
    id: 'sdk',
    label: 'Python SDK',
    subtitle: 'Embed GuardRAG indexing, retrieval, and PII redaction directly in Python.',
    steps: [
      {
        step: '01',
        title: 'Install package & pull a local model',
        summary: 'Install guard-rag from PyPI and ensure Ollama has at least one local model available.',
        code: `pip install guard-rag
ollama pull llama3.1`,
        note: 'Supports Python 3.9–3.12+. Zero external API keys required.',
      },
      {
        step: '02',
        title: 'Build & index a guarded RAG chain',
        summary:
          'Call build_rag_chain() to sanitize, redact PII, chunk, and vectorize documents into local FAISS storage.',
        code: `from guardrag.rag.core import build_rag_chain

db_id, chain = build_rag_chain(
    file_paths=["data/legal_agreement.pdf"],
    model="llama3.1",
    chunk_size=1000,
    chunk_overlap=200,
    ollama_host="http://localhost:11434",
    storage_dir=".guardrag_storage",
    redact_pii=True,
    manual_redactions=["Acme Corp", "Project Titan"],
    temperature=0.0,
)`,
        note: 'Returns (db_id, rag_chain) so you can reuse the cached vector index later.',
      },
      {
        step: '03',
        title: 'Query & reload cached indexes without re-embedding',
        summary:
          'Invoke the chain with chat history, or reload an existing db_id on startup using load_stored_rag_chain().',
        code: `from guardrag.rag.core import load_stored_rag_chain

# Reload an already-indexed dataset in milliseconds
chain = load_stored_rag_chain(
    db_id=db_id,
    model="llama3.1",
    storage_dir=".guardrag_storage",
)

result = chain.invoke({
    "input": "What are the termination liabilities?",
    "chat_history": [],
})
print(result["answer"])`,
      },
      {
        step: '04',
        title: 'Use standalone safety & PII redaction utilities',
        summary:
          'Call GuardRAG redaction and prompt-injection checks independently in your own pipelines.',
        code: `from guardrag.utils.safety import check_input_safety, sanitize_document_content
from guardrag.utils.redactor import redact_and_map

# 1. Strip indirect prompt injections from untrusted document text
clean_text = sanitize_document_content(raw_document_text)

# 2. Context-aware PII tokenization with reversible mapping
anonymized, mapping = redact_and_map("Contact Alice at alice@corp.com", redact_names=True)
# -> "Contact [PERSON_1] at [EMAIL_1]"

# 3. Validate user query against active sensitivity tier
is_safe, reason = check_input_safety(user_query, tier="Confidential")`,
      },
    ],
  },
  {
    id: 'cli',
    label: 'CLI & Web Studio',
    subtitle: 'Run the interactive FastAPI studio or headless terminal queries with guard-rag.',
    steps: [
      {
        step: '01',
        title: 'Install once via pip',
        summary: 'Installs the guard-rag executable and local FastEmbed ONNX runtime.',
        code: `pip install guard-rag`,
      },
      {
        step: '02',
        title: 'Launch the local Web Studio',
        summary: 'Running guard-rag with no file flags starts the local UI and auto-connects to Ollama.',
        code: `guard-rag
# Optional custom host/port:
guard-rag --host 127.0.0.1 --port 8000`,
        note: 'Open http://127.0.0.1:8000 in your browser.',
      },
      {
        step: '03',
        title: 'Run headless queries on files or directories',
        summary: 'Pass --pdf / --file, --model, and --sensitivity for scripted or CI workflows.',
        code: `guard-rag --pdf contracts/NDA.pdf \\
  --query "Summarize confidentiality terms" \\
  --model llama3.1 \\
  --sensitivity Confidential \\
  --output-format markdown`,
      },
    ],
  },
  {
    id: 'api',
    label: 'REST API',
    subtitle: 'Integrate GuardRAG over HTTP from any language on localhost or office LAN.',
    steps: [
      {
        step: '01',
        title: 'Enable optional API key protection',
        summary: 'Set GUARDRAG_API_KEY on the host to protect upload and policy endpoints.',
        code: `export GUARDRAG_API_KEY="your-secure-token"
guard-rag --host 0.0.0.0 --port 8000`,
      },
      {
        step: '02',
        title: 'Ingest documents via POST /api/upload',
        summary: 'Upload files with a sensitivity tier and custom redaction list.',
        code: `curl -X POST http://localhost:8000/api/upload \\
  -H "X-API-Key: your-secure-token" \\
  -F "files=@contract_q4.pdf" \\
  -F "sensitivity=Confidential" \\
  -F "chunk_size=1000"`,
      },
      {
        step: '03',
        title: 'Inspect health & indexed storage',
        summary: 'Check Ollama status, installed models, and stored vector collections.',
        code: `curl http://localhost:8000/api/health
curl http://localhost:8000/api/storage`,
      },
    ],
  },
];

const SDK_PARAMS = [
  { name: 'file_paths', type: 'List[str]', def: 'Required', desc: 'Document paths to parse, redact, and embed' },
  { name: 'model', type: 'str', def: '"gemma3:1b"', desc: 'Local Ollama model name' },
  { name: 'chunk_size', type: 'int', def: '1000', desc: 'Max characters per text chunk (500–4000)' },
  { name: 'chunk_overlap', type: 'int', def: '200', desc: 'Overlapping characters between chunks' },
  { name: 'redact_pii', type: 'bool', def: 'False', desc: 'Masks emails, phones, SSNs, Luhn cards, and names' },
  { name: 'manual_redactions', type: 'List[str]', def: 'None', desc: 'Custom words or entities to scrub before indexing' },
  { name: 'storage_dir', type: 'str', def: '".guardrag_storage"', desc: 'Local directory for persisted vector indexes' },
  { name: 'temperature', type: 'float', def: '0.0', desc: 'LLM generation determinism (0.0 = factual)' },
];

export const SdkDocsSection: React.FC = () => {
  const [activeTrackId, setActiveTrackId] = useState<'sdk' | 'cli' | 'api'>('sdk');
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  const track = DOC_TRACKS.find((t) => t.id === activeTrackId) ?? DOC_TRACKS[0];

  const handleCopyStep = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedStep(key);
    setTimeout(() => setCopiedStep(null), 1600);
  };

  return (
    <section id="sdk-docs" className="relative border-t border-white/[0.06] py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 font-mono text-xs uppercase tracking-wider text-[#00b91e]">
              Developer Documentation
            </div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              Step-by-step SDK &amp; CLI guide.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              {track.subtitle}
            </p>
          </div>

          {/* Track Switcher */}
          <div className="inline-flex w-fit rounded-lg border border-white/[0.09] bg-[#0e0e12] p-1">
            {DOC_TRACKS.map((t) => {
              const active = t.id === activeTrackId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTrackId(t.id)}
                  className={`relative rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    active ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="sdkTrackPill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-md border border-white/[0.12] bg-white/[0.07]"
                    />
                  )}
                  <span className="relative z-10">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step-by-Step Timeline Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            {track.steps.map((item) => {
              const stepKey = `${track.id}-${item.step}`;
              const isCopied = copiedStep === stepKey;
              return (
                <div
                  key={stepKey}
                  className="card-hairline grid grid-cols-1 overflow-hidden rounded-2xl lg:grid-cols-12"
                >
                  {/* Left: Step explanation */}
                  <div className="flex flex-col justify-between border-b border-white/[0.07] p-6 lg:col-span-5 lg:border-b-0 lg:border-r">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex h-6 items-center rounded-md border border-[#00b91e]/35 bg-[#00b91e]/10 px-2 font-mono text-[11px] font-semibold text-[#00b91e]">
                          STEP {item.step}
                        </span>
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-white">{item.title}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-zinc-400">{item.summary}</p>
                    </div>
                    {item.note && (
                      <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 font-mono text-[11px] text-zinc-400">
                        {item.note}
                      </div>
                    )}
                  </div>

                  {/* Right: Copyable code block */}
                  <div className="relative bg-[#08080b] p-5 sm:p-6 lg:col-span-7">
                    <button
                      type="button"
                      onClick={() => handleCopyStep(stepKey, item.code)}
                      className="absolute right-4 top-4 rounded-md border border-white/[0.09] bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] text-zinc-400 transition-colors hover:border-white/25 hover:text-white"
                    >
                      {isCopied ? <span className="text-[#00b91e]">Copied</span> : 'Copy'}
                    </button>
                    <pre className="overflow-x-auto pr-14 font-mono text-xs leading-6 text-zinc-200">
                      <code>{item.code}</code>
                    </pre>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Compact SDK Parameter Reference */}
        {activeTrackId === 'sdk' && (
          <div className="card-hairline mt-6 overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.07] bg-[#101015] px-5 py-3.5">
              <span className="font-mono text-xs font-semibold text-white">
                build_rag_chain() Parameters
              </span>
              <a
                href={REPO_META.apiReferenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] text-[#00b91e] hover:underline"
              >
                Full API Reference ↗
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    <th className="px-5 py-3">Parameter</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Default</th>
                    <th className="px-5 py-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {SDK_PARAMS.map((p) => (
                    <tr key={p.name} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-2.5 font-mono font-medium text-[#00b91e]">{p.name}</td>
                      <td className="px-5 py-2.5 font-mono text-zinc-400">{p.type}</td>
                      <td className="px-5 py-2.5 font-mono text-zinc-300">{p.def}</td>
                      <td className="px-5 py-2.5 text-zinc-400">{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
