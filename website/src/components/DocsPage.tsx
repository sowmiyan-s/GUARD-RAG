import React, { useState } from 'react';
import { REPO_META, SUPPORTED_FORMATS, GUARDRAIL_TIERS } from '../data/guardragData';

export interface DocSection {
  id: string;
  group: 'Getting Started' | 'Core Usage' | 'Architecture & API';
  title: string;
  description: string;
  render: (copy: (id: string, text: string) => void, copiedId: string | null) => React.ReactNode;
}

const CodeBlock: React.FC<{
  id: string;
  title?: string;
  code: string;
  copy: (id: string, text: string) => void;
  copiedId: string | null;
}> = ({ id, title, code, copy, copiedId }) => (
  <div className="my-4 overflow-hidden rounded-xl border border-white/[0.09] bg-[#0b0b0f]">
    <div className="flex items-center justify-between border-b border-white/[0.07] bg-[#111116] px-4 py-2">
      <span className="font-mono text-[11px] text-zinc-400">{title ?? 'bash'}</span>
      <button
        type="button"
        onClick={() => copy(id, code)}
        className="rounded border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 font-mono text-[10px] text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
      >
        {copiedId === id ? <span className="text-[#00b91e]">Copied</span> : 'Copy'}
      </button>
    </div>
    <pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-zinc-200">
      <code>{code}</code>
    </pre>
  </div>
);

const Callout: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="my-5 rounded-xl border border-[#00b91e]/25 bg-[#00b91e]/[0.05] px-4 py-3.5 text-xs leading-relaxed text-zinc-300">
    <span className="mr-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#00b91e]">
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
      'GuardRAG is a 100% offline, air-gapped document Q&A system combining Hybrid BM25 + FAISS retrieval, 4-tier PII redaction, and local Ollama inference.',
    render: () => (
      <div className="space-y-4 text-sm leading-relaxed text-zinc-300">
        <p>
          GuardRAG lets you index PDFs, Word documents, Excel spreadsheets, PowerPoint decks, HTML
          pages, and entire local directories on your own machine—with zero cloud uploads and zero
          external API keys.
        </p>
        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
          <div className="rounded-xl border border-white/[0.08] bg-[#101015] p-4">
            <div className="font-mono text-xs font-semibold text-[#00b91e]">Hybrid Retrieval</div>
            <p className="mt-1.5 text-xs text-zinc-400">
              Combines BM25 keyword search with FastEmbed ONNX + FAISS dense vectors via Reciprocal
              Rank Fusion (RRF).
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#101015] p-4">
            <div className="font-mono text-xs font-semibold text-[#00b91e]">4-Tier Guardrails</div>
            <p className="mt-1.5 text-xs text-zinc-400">
              Enforces Public, Internal, Confidential, and Restricted privacy policies with Luhn
              card validation and prompt-injection stripping.
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#101015] p-4">
            <div className="font-mono text-xs font-semibold text-[#00b91e]">Web Studio &amp; CLI</div>
            <p className="mt-1.5 text-xs text-zinc-400">
              Launch an interactive browser studio with <code className="text-zinc-200">guard-rag</code> or run
              headless queries in scripts.
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#101015] p-4">
            <div className="font-mono text-xs font-semibold text-[#00b91e]">Python SDK &amp; REST API</div>
            <p className="mt-1.5 text-xs text-zinc-400">
              Import <code className="text-zinc-200">build_rag_chain</code> directly in Python or connect over HTTP on
              localhost and office LAN.
            </p>
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
      'Install GuardRAG from PyPI and configure a local Ollama model in under two minutes.',
    render: (copy, copiedId) => (
      <div className="space-y-4 text-sm leading-relaxed text-zinc-300">
        <p>
          GuardRAG requires <strong className="text-white">Python 3.9–3.12+</strong> and a local{' '}
          <strong className="text-white">Ollama</strong> installation for LLM inference.
        </p>
        <h3 className="pt-2 text-base font-semibold text-white">1. Install the package</h3>
        <CodeBlock
          id="install-pip"
          title="Terminal"
          code={`pip install guard-rag`}
          copy={copy}
          copiedId={copiedId}
        />
        <h3 className="pt-2 text-base font-semibold text-white">2. Pull a local Ollama model</h3>
        <p className="text-xs text-zinc-400">
          Recommended models: <code className="text-zinc-200">llama3.2</code>,{' '}
          <code className="text-zinc-200">gemma3:1b</code> (fast on CPU),{' '}
          <code className="text-zinc-200">llama3.1</code>, or{' '}
          <code className="text-zinc-200">deepseek-r1</code>.
        </p>
        <CodeBlock
          id="install-ollama"
          title="Terminal"
          code={`ollama pull gemma3:1b
ollama pull llama3.1`}
          copy={copy}
          copiedId={copiedId}
        />
        <Callout label="Note">
          Embeddings run locally on CPU via FastEmbed ONNX (<code>BAAI/bge-small-en-v1.5</code>,
          ~60 MB RAM), so no GPU is required for indexing or vector search.
        </Callout>
      </div>
    ),
  },
  {
    id: 'quickstart',
    group: 'Getting Started',
    title: 'Quickstart (Web Studio)',
    description:
      'Start the local FastAPI studio, upload your first document, and ask grounded questions.',
    render: (copy, copiedId) => (
      <div className="space-y-4 text-sm leading-relaxed text-zinc-300">
        <p>Run GuardRAG with no arguments to launch the local web interface:</p>
        <CodeBlock
          id="qs-launch"
          title="Terminal"
          code={`guard-rag
# Listening on http://127.0.0.1:8000`}
          copy={copy}
          copiedId={copiedId}
        />
        <ol className="list-decimal space-y-2 pl-5 text-xs text-zinc-300">
          <li>Open <code className="text-zinc-200">http://127.0.0.1:8000</code> in your browser.</li>
          <li>Select a sensitivity tier (<strong className="text-white">Public</strong>, <strong className="text-white">Internal</strong>, <strong className="text-white">Confidential</strong>, or <strong className="text-white">Restricted</strong>).</li>
          <li>Upload one or more documents (PDF, DOCX, XLSX, PPTX, HTML, TXT, MD).</li>
          <li>Ask questions—GuardRAG cites exact source chunks and supports offline Web Speech audio briefings.</li>
        </ol>
      </div>
    ),
  },
  {
    id: 'cli-reference',
    group: 'Core Usage',
    title: 'CLI Reference',
    description:
      'Use the guard-rag terminal command for single files, recursive directories, and scripted queries.',
    render: (copy, copiedId) => (
      <div className="space-y-4 text-sm leading-relaxed text-zinc-300">
        <CodeBlock
          id="cli-examples"
          title="Terminal"
          code={`# Launch the web UI on a custom host/port
guard-rag --host 127.0.0.1 --port 8000

# Query a single document headlessly
guard-rag --pdf contracts/NDA.pdf \\
  --query "Summarize confidentiality terms" \\
  --model llama3.1 \\
  --sensitivity Confidential \\
  --output-format markdown

# Recursively index and query a folder
guard-rag ./docs/`}
          copy={copy}
          copiedId={copiedId}
        />
        <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
          <table className="w-full min-w-[540px] text-left text-xs">
            <thead className="border-b border-white/[0.07] bg-[#111116] font-mono text-[10px] uppercase text-zinc-400">
              <tr>
                <th className="px-4 py-3">Flag</th>
                <th className="px-4 py-3">Short</th>
                <th className="px-4 py-3">Default</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] text-zinc-300">
              <tr>
                <td className="px-4 py-2.5 font-mono text-[#00b91e]">--pdf &lt;path&gt;</td>
                <td className="px-4 py-2.5 font-mono">-p</td>
                <td className="px-4 py-2.5 font-mono text-zinc-400">None</td>
                <td className="px-4 py-2.5">Document file path (launches Web UI if omitted)</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-[#00b91e]">--query &lt;str&gt;</td>
                <td className="px-4 py-2.5 font-mono">-q</td>
                <td className="px-4 py-2.5 font-mono text-zinc-400">Interactive</td>
                <td className="px-4 py-2.5">Question to run against the indexed file</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-[#00b91e]">--model &lt;str&gt;</td>
                <td className="px-4 py-2.5 font-mono">-m</td>
                <td className="px-4 py-2.5 font-mono text-zinc-400">gemma3:1b</td>
                <td className="px-4 py-2.5">Local Ollama model name</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-[#00b91e]">--sensitivity &lt;str&gt;</td>
                <td className="px-4 py-2.5 font-mono">-s</td>
                <td className="px-4 py-2.5 font-mono text-zinc-400">Internal</td>
                <td className="px-4 py-2.5">Public, Internal, Confidential, or Restricted</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-[#00b91e]">--chunk-size &lt;int&gt;</td>
                <td className="px-4 py-2.5 font-mono">—</td>
                <td className="px-4 py-2.5 font-mono text-zinc-400">1000</td>
                <td className="px-4 py-2.5">Characters per text chunk (500–4000)</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-[#00b91e]">--output-format</td>
                <td className="px-4 py-2.5 font-mono">—</td>
                <td className="px-4 py-2.5 font-mono text-zinc-400">text</td>
                <td className="px-4 py-2.5">Output format: text, json, or markdown</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-[#00b91e]">--port / --host</td>
                <td className="px-4 py-2.5 font-mono">—</td>
                <td className="px-4 py-2.5 font-mono text-zinc-400">8000 / 0.0.0.0</td>
                <td className="px-4 py-2.5">Web UI server host and port</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: 'python-sdk',
    group: 'Core Usage',
    title: 'Python SDK',
    description:
      'Build, query, and reload persistent RAG chains directly inside your Python applications.',
    render: (copy, copiedId) => (
      <div className="space-y-4 text-sm leading-relaxed text-zinc-300">
        <h3 className="text-base font-semibold text-white">Step 1: Build &amp; index a chain</h3>
        <p className="text-xs text-zinc-400">
          <code className="text-zinc-200">build_rag_chain()</code> parses files, applies PII
          redaction, builds the FAISS + BM25 index, and returns <code className="text-zinc-200">(db_id, chain)</code>.
        </p>
        <CodeBlock
          id="sdk-build"
          title="python"
          code={`from guardrag.rag.core import build_rag_chain

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
)`}
          copy={copy}
          copiedId={copiedId}
        />

        <h3 className="pt-2 text-base font-semibold text-white">
          Step 2: Query &amp; reload cached indexes
        </h3>
        <p className="text-xs text-zinc-400">
          Pass <code className="text-zinc-200">db_id</code> to{' '}
          <code className="text-zinc-200">load_stored_rag_chain()</code> on subsequent runs to skip
          re-embedding.
        </p>
        <CodeBlock
          id="sdk-load"
          title="python"
          code={`from guardrag.rag.core import load_stored_rag_chain

chain = load_stored_rag_chain(
    db_id=db_id,
    model="llama3.1",
    ollama_host="http://localhost:11434",
    storage_dir=".guardrag_storage",
    temperature=0.0,
)

result = chain.invoke({
    "input": "What are the termination liabilities?",
    "chat_history": [],
})
print(result["answer"])`}
          copy={copy}
          copiedId={copiedId}
        />

        <h3 className="pt-2 text-base font-semibold text-white">Parameters Reference</h3>
        <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
          <table className="w-full min-w-[540px] text-left text-xs">
            <thead className="border-b border-white/[0.07] bg-[#111116] font-mono text-[10px] uppercase text-zinc-400">
              <tr>
                <th className="px-4 py-3">Parameter</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Default</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] text-zinc-300">
              <tr>
                <td className="px-4 py-2.5 font-mono text-[#00b91e]">file_paths</td>
                <td className="px-4 py-2.5 font-mono">List[str]</td>
                <td className="px-4 py-2.5 font-mono text-zinc-400">Required</td>
                <td className="px-4 py-2.5">Document paths to parse and embed</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-[#00b91e]">model</td>
                <td className="px-4 py-2.5 font-mono">str</td>
                <td className="px-4 py-2.5 font-mono text-zinc-400">&quot;gemma3:1b&quot;</td>
                <td className="px-4 py-2.5">Target Ollama model name</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-[#00b91e]">chunk_size</td>
                <td className="px-4 py-2.5 font-mono">int</td>
                <td className="px-4 py-2.5 font-mono text-zinc-400">1000</td>
                <td className="px-4 py-2.5">Max character count per chunk</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-[#00b91e]">chunk_overlap</td>
                <td className="px-4 py-2.5 font-mono">int</td>
                <td className="px-4 py-2.5 font-mono text-zinc-400">200</td>
                <td className="px-4 py-2.5">Overlapping characters between chunks</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-[#00b91e]">redact_pii</td>
                <td className="px-4 py-2.5 font-mono">bool</td>
                <td className="px-4 py-2.5 font-mono text-zinc-400">False</td>
                <td className="px-4 py-2.5">Redact names, emails, phones, cards, and secrets</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-[#00b91e]">manual_redactions</td>
                <td className="px-4 py-2.5 font-mono">List[str]</td>
                <td className="px-4 py-2.5 font-mono text-zinc-400">None</td>
                <td className="px-4 py-2.5">Custom entities or terms to mask</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-[#00b91e]">storage_dir</td>
                <td className="px-4 py-2.5 font-mono">str</td>
                <td className="px-4 py-2.5 font-mono text-zinc-400">&quot;.guardrag_storage&quot;</td>
                <td className="px-4 py-2.5">Directory storing persisted vector indexes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: 'safety-redaction',
    group: 'Core Usage',
    title: 'Safety & PII Redaction',
    description:
      'Use GuardRAG guardrails standalone to sanitize untrusted documents, mask PII, and block prompt injections.',
    render: (copy, copiedId) => (
      <div className="space-y-4 text-sm leading-relaxed text-zinc-300">
        <CodeBlock
          id="sdk-safety"
          title="python"
          code={`from guardrag.utils.safety import check_input_safety, sanitize_document_content
from guardrag.utils.redactor import redact_and_map

# 1. Strip indirect prompt injections from untrusted documents
clean_text = sanitize_document_content(raw_document_text)

# 2. Context-aware PII tokenization with reversible mapping
anonymized, mapping = redact_and_map(
    "Contact Alice at alice@corp.com",
    redact_names=True,
)
# -> "Contact [PERSON_1] at [EMAIL_1]"

# 3. Inspect user query against a sensitivity tier
is_safe, reason = check_input_safety(user_query, tier="Confidential")
if not is_safe:
    print(f"Blocked: {reason}")`}
          copy={copy}
          copiedId={copiedId}
        />
        <h3 className="pt-2 text-base font-semibold text-white">4 Cumulative Sensitivity Tiers</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {GUARDRAIL_TIERS.map((tier) => (
            <div key={tier.id} className="rounded-xl border border-white/[0.08] bg-[#101015] p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{tier.id}</span>
                <span className="font-mono text-[10px] text-zinc-400">{tier.badge}</span>
              </div>
              <p className="mt-1.5 text-xs text-zinc-400">{tier.summary}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'formats-retrieval',
    group: 'Architecture & API',
    title: 'Hybrid Retrieval & Formats',
    description:
      'How GuardRAG parses 9+ document formats and fuses BM25 + FAISS dense search.',
    render: () => (
      <div className="space-y-4 text-sm leading-relaxed text-zinc-300">
        <p>
          Every query runs both lexical BM25 matching (for exact invoice IDs, error codes, and
          section numbers) and dense vector similarity in FAISS-CPU, then merges rankings with
          Reciprocal Rank Fusion (RRF).
        </p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {SUPPORTED_FORMATS.map((fmt) => (
            <div key={fmt.ext} className="rounded-xl border border-white/[0.08] bg-[#101015] p-3.5">
              <div className="font-mono text-xs font-semibold text-[#00b91e]">{fmt.ext}</div>
              <div className="mt-1 font-mono text-[11px] text-zinc-300">{fmt.engine}</div>
              <div className="mt-1 text-[11px] text-zinc-500">{fmt.note}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'rest-api',
    group: 'Architecture & API',
    title: 'REST API',
    description:
      'Integrate GuardRAG from any language over HTTP with optional API key authentication.',
    render: (copy, copiedId) => (
      <div className="space-y-4 text-sm leading-relaxed text-zinc-300">
        <p className="text-xs text-zinc-400">
          Set <code className="text-zinc-200">GUARDRAG_API_KEY</code> on the server to enforce{' '}
          <code className="text-zinc-200">X-API-Key</code> or{' '}
          <code className="text-zinc-200">Authorization: Bearer</code> authentication on upload and
          policy routes.
        </p>
        <CodeBlock
          id="api-curl"
          title="Terminal"
          code={`# 1. Start server with optional API key protection
export GUARDRAG_API_KEY="your-secure-token"
guard-rag --host 0.0.0.0 --port 8000

# 2. Upload & index a document
curl -X POST http://localhost:8000/api/upload \\
  -H "X-API-Key: your-secure-token" \\
  -F "files=@contract_q4.pdf" \\
  -F "sensitivity=Confidential" \\
  -F "chunk_size=1000"

# 3. Inspect health & stored vector indexes
curl http://localhost:8000/api/health
curl http://localhost:8000/api/storage`}
          copy={copy}
          copiedId={copiedId}
        />
      </div>
    ),
  },
  {
    id: 'docker-tests',
    group: 'Architecture & API',
    title: 'Docker & Testing',
    description:
      'Run GuardRAG with Ollama in containers or verify all 83 automated pytest checks locally.',
    render: (copy, copiedId) => (
      <div className="space-y-4 text-sm leading-relaxed text-zinc-300">
        <CodeBlock
          id="docker-cmd"
          title="Terminal"
          code={`# Clone and start GuardRAG + Ollama containers
git clone https://github.com/sowmiyan-s/GUARD-RAG.git
cd GUARD-RAG
docker-compose up -d

# Run the automated test suite (83 tests)
pytest -v`}
          copy={copy}
          copiedId={copiedId}
        />
        <Callout label="Source Docs">
          Full markdown specifications are also maintained in{' '}
          <a
            href={REPO_META.apiReferenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white underline hover:text-[#00b91e]"
          >
            docs/API_REFERENCE.md
          </a>{' '}
          and{' '}
          <a
            href={REPO_META.architectureUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white underline hover:text-[#00b91e]"
          >
            docs/ARCHITECTURE.md
          </a>
          .
        </Callout>
      </div>
    ),
  },
];

const GROUPS: DocSection['group'][] = ['Getting Started', 'Core Usage', 'Architecture & API'];

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
    <div className="min-h-screen bg-[#09090b] pt-16 text-zinc-200">
      <div className="mx-auto flex max-w-6xl flex-col px-4 sm:px-6 lg:flex-row lg:gap-10">
        {/* Mobile section selector */}
        <div className="border-b border-white/[0.08] py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg border border-white/[0.1] bg-[#101015] px-3.5 py-2 text-xs font-medium text-white"
          >
            <span>
              <span className="text-zinc-500">{current.group} / </span>
              {current.title}
            </span>
            <span className="font-mono text-zinc-400">{mobileMenuOpen ? '−' : '+'}</span>
          </button>
          {mobileMenuOpen && (
            <nav className="mt-2 space-y-4 rounded-xl border border-white/[0.08] bg-[#0e0e13] p-4">
              {GROUPS.map((group) => (
                <div key={group}>
                  <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    {group}
                  </div>
                  <div className="space-y-0.5">
                    {DOC_SECTIONS.filter((s) => s.group === group).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => selectAndScroll(s.id)}
                        className={`block w-full rounded-md px-2.5 py-1.5 text-left text-xs ${
                          s.id === current.id
                            ? 'bg-[#00b91e]/15 font-medium text-[#00b91e]'
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

        {/* Desktop Left Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-white/[0.07] py-10 pr-6 lg:block">
          <div className="sticky top-24 space-y-7">
            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex items-center gap-1.5 font-mono text-xs text-zinc-400 transition-colors hover:text-white"
            >
              <span aria-hidden="true">←</span>
              <span>Back to Product</span>
            </button>

            {GROUPS.map((group) => (
              <div key={group}>
                <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {group}
                </div>
                <ul className="space-y-1 border-l border-white/[0.07]">
                  {DOC_SECTIONS.filter((s) => s.group === group).map((s) => {
                    const active = s.id === current.id;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => selectAndScroll(s.id)}
                          className={`-ml-px block w-full border-l-2 py-1.5 pl-3.5 text-left text-[13px] transition-colors ${
                            active
                              ? 'border-[#00b91e] font-medium text-[#00b91e]'
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

        {/* Main Docs Content */}
        <article className="min-w-0 flex-1 py-10 lg:py-12">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2 font-mono text-[11px] text-zinc-500">
              <span>Docs</span>
              <span>/</span>
              <span>{current.group}</span>
              <span>/</span>
              <span className="text-[#00b91e]">{current.title}</span>
            </div>

            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              {current.title}
            </h1>
            <p className="mt-3 border-b border-white/[0.07] pb-6 text-sm leading-relaxed text-zinc-400">
              {current.description}
            </p>

            <div className="pt-6">{current.render(copy, copiedId)}</div>

            {/* Ordered Previous / Next Navigation (LangChain style) */}
            <div className="mt-14 grid grid-cols-1 gap-3 border-t border-white/[0.08] pt-8 sm:grid-cols-2">
              {prev ? (
                <button
                  type="button"
                  onClick={() => selectAndScroll(prev.id)}
                  className="rounded-xl border border-white/[0.08] bg-[#0e0e13] p-4 text-left transition-colors hover:border-white/20"
                >
                  <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    ← Previous
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">{prev.title}</div>
                </button>
              ) : (
                <div />
              )}

              {next && (
                <button
                  type="button"
                  onClick={() => selectAndScroll(next.id)}
                  className="rounded-xl border border-white/[0.08] bg-[#0e0e13] p-4 text-right transition-colors hover:border-[#00b91e]/40"
                >
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#00b91e]">
                    Next →
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">{next.title}</div>
                </button>
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
