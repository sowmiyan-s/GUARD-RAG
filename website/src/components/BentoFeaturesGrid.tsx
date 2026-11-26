/**
 * Premium Bento Feature Grid — inspired by 21st.dev id:47373 (my/bento-grid)
 * cursor-tracking spotlight, stagger animation, variable col/row spans.
 */
import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { GlowCard } from './GlowCard';
import { SUPPORTED_FORMATS } from '../data/guardragData';

const EASE = [0.42, 0, 0, 1] as const;

/* ── Animated mini-UIs for each bento cell ── */

function OfflineVaultMini() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { once: true, amount: 0.6 });
  const files = [
    { name: 'Contracts.pdf', color: '#00b91e', delay: 0.05 },
    { name: 'Q3_Budget.xlsx', color: '#38bdf8', delay: 0.17 },
    { name: 'Diagnosis_Notes.docx', color: '#a78bfa', delay: 0.3 },
  ];
  return (
    <div ref={ref} className="relative flex flex-col gap-2">
      {files.map((f) => (
        <motion.div
          key={f.name}
          initial={{ opacity: 0, x: -18 }}
          animate={on ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE, delay: f.delay }}
          className="flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-[#111118] px-3 py-2"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: f.color }} />
          <span className="font-mono text-[11px] text-zinc-300">{f.name}</span>
          <span className="ml-auto font-mono text-[9px] text-zinc-600">LOCAL</span>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={on ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.52, ease: EASE }}
        className="mt-1 flex items-center gap-2 rounded-lg border border-[#00b91e]/30 bg-[#00b91e]/[0.07] px-3 py-2"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#00b91e]" />
        <span className="font-mono text-[10px] font-semibold text-[#00b91e]">0 bytes sent to cloud</span>
      </motion.div>
    </div>
  );
}

function HybridSearchMini() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { once: true, amount: 0.6 });
  const rows = [
    { label: 'BM25 (keyword)', score: 0.91, bar: 'w-[91%]', active: true },
    { label: 'Dense FAISS (semantic)', score: 0.87, bar: 'w-[87%]', active: true },
    { label: 'RRF fusion score', score: 0.97, bar: 'w-[97%]', active: true },
  ];
  return (
    <div ref={ref} className="space-y-2.5">
      <div className="mb-3 font-mono text-[10px] text-zinc-500">Query: "Invoice ERR-9021"</div>
      {rows.map((r, i) => (
        <motion.div
          key={r.label}
          initial={{ opacity: 0, y: 8 }}
          animate={on ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE, delay: i * 0.12 }}
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[10px] text-zinc-400">{r.label}</span>
            <span className={`font-mono text-[10px] ${r.active ? 'text-[#00b91e]' : 'text-zinc-500'}`}>{r.score}</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full bg-[#00b91e]"
              initial={{ width: 0 }}
              animate={on ? { width: `${r.score * 100}%` } : {}}
              transition={{ duration: 0.7, ease: EASE, delay: 0.3 + i * 0.12 }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function PipelineFlowMini() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { once: true, amount: 0.6 });
  const steps = ['Upload File', 'PII Redact', 'Chunk + Embed', 'FAISS Index', 'Answer'];
  return (
    <div ref={ref} className="flex flex-wrap items-center gap-1.5">
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={on ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.4, ease: EASE, delay: 0.1 + i * 0.1 }}
            className="rounded-md border border-white/[0.1] bg-[#111118] px-2.5 py-1 font-mono text-[10px] text-zinc-200"
          >
            {step}
          </motion.div>
          {i < steps.length - 1 && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={on ? { opacity: 1 } : {}}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="text-zinc-600"
            >
              →
            </motion.span>
          )}
        </React.Fragment>
      ))}
      <motion.div
        initial={{ opacity: 0 }}
        animate={on ? { opacity: 1 } : {}}
        transition={{ delay: 0.7 }}
        className="mt-3 w-full rounded-lg border border-[#00b91e]/30 bg-[#071109] p-2 font-mono text-[10px] text-emerald-300"
      >
        <span className="text-zinc-500">{'>'} </span>Citing p.14 · chunk_id 0x4f2a · 8.2 ms
      </motion.div>
    </div>
  );
}

function FormatGridMini() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { once: true, amount: 0.6 });
  const fmts = SUPPORTED_FORMATS.slice(0, 6);
  return (
    <div ref={ref} className="grid grid-cols-3 gap-2">
      {fmts.map((f, i) => (
        <motion.div
          key={f.ext}
          initial={{ opacity: 0, y: 6 }}
          animate={on ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, ease: EASE, delay: 0.05 + i * 0.08 }}
          className="flex flex-col items-center gap-1 rounded-lg border border-white/[0.07] bg-[#0f0f14] px-2 py-2.5 text-center"
        >
          <span className="font-mono text-[10px] font-semibold text-white">{f.ext.split('/')[0]}</span>
          <span className="font-mono text-[9px] text-zinc-600">{f.engine}</span>
        </motion.div>
      ))}
    </div>
  );
}

function AudioMini() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { once: true, amount: 0.6 });
  const bars = Array.from({ length: 20 }, (_, i) => i);
  return (
    <div ref={ref} className="flex flex-col gap-3">
      <div className="flex h-10 items-end justify-center gap-0.5">
        {bars.map((i) => (
          <motion.div
            key={i}
            className="w-1 rounded-full bg-[#00b91e]"
            initial={{ height: 4, opacity: 0.3 }}
            animate={on ? {
              height: [4, Math.random() * 36 + 4, 4],
              opacity: [0.3, 0.9, 0.3],
            } : {}}
            transition={{
              duration: 1.2 + Math.random() * 0.6,
              delay: on ? Math.random() * 0.4 : 0,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-[#0f0f14] px-3 py-2">
        <span className="font-mono text-[10px] text-zinc-300">Offline Voice Briefing</span>
        <span className="rounded bg-[#00b91e]/15 px-2 py-0.5 font-mono text-[9px] text-[#00b91e]">Web Speech API</span>
      </div>
    </div>
  );
}

function LANShareMini() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { once: true, amount: 0.6 });
  const devices = ['Host (You)', 'Team Member A', 'Guest B'];
  return (
    <div ref={ref} className="space-y-2">
      {devices.map((d, i) => (
        <motion.div
          key={d}
          initial={{ opacity: 0, x: i === 0 ? 0 : 20 }}
          animate={on ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE, delay: 0.1 + i * 0.15 }}
          className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-[#0f0f14] px-3 py-2"
        >
          <span className="font-mono text-[10px] text-zinc-200">{d}</span>
          <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] ${i === 0 ? 'bg-[#00b91e]/20 text-[#00b91e]' : 'bg-white/[0.05] text-zinc-400'}`}>
            {i === 0 ? 'Host' : 'Read-Only'}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Grid cells config ── */
const CELLS = [
  {
    id: 'offline',
    label: '100% Air-Gapped',
    title: 'Your files never touch the internet',
    body: 'Every PDF, spreadsheet, and slide is read, embedded, and answered entirely on your machine. No API calls. No cloud uploads. Ever.',
    visual: <OfflineVaultMini />,
    span: 'md:col-span-2 md:row-span-2',
  },
  {
    id: 'hybrid',
    label: 'Hybrid Retrieval',
    title: 'Exact codes + semantic meaning',
    body: 'BM25 keyword search fused with FAISS dense vectors via Reciprocal Rank Fusion. Invoice numbers and contract clauses always rank first.',
    visual: <HybridSearchMini />,
    span: 'md:col-span-2',
  },
  {
    id: 'pipeline',
    label: 'Full Pipeline',
    title: 'Ingest to answer in one command',
    body: 'Upload → auto-redact PII → chunk → embed with FastEmbed → index FAISS → stream with Ollama. Run guard-rag, nothing else.',
    visual: <PipelineFlowMini />,
    span: 'md:col-span-2',
  },
  {
    id: 'formats',
    label: '9+ Formats',
    title: 'PDF, XLSX, PPTX, DOCX, HTML & more',
    body: 'Native loaders for every common business file type, including recursive directory indexing.',
    visual: <FormatGridMini />,
    span: 'md:col-span-2',
  },
  {
    id: 'audio',
    label: 'Offline Audio',
    title: 'Listen to briefings. No external API.',
    body: 'Uses your browser\'s built-in Web Speech API for zero-network voice playback of document summaries.',
    visual: <AudioMini />,
    span: 'md:col-span-2',
  },
  {
    id: 'lan',
    label: 'LAN Sharing',
    title: 'Team access over office Wi-Fi',
    body: 'Share a read-only link with your LAN. Guests query indexed documents in any browser — no Python, no install.',
    visual: <LANShareMini />,
    span: 'md:col-span-2',
  },
];

export const BentoFeaturesGrid: React.FC = () => {
  return (
    <section id="features" className="relative border-t border-white/[0.06] py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-14 max-w-2xl">
          <div className="mb-3 font-mono text-xs uppercase tracking-wider text-[#00b91e]">Features</div>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Everything private RAG needs. Nothing extra.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Purpose-built for air-gapped environments. Every component runs locally — no cloud, no subscription, no telemetry.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:grid-rows-2">
          {CELLS.map((cell, i) => (
            <motion.div
              key={cell.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55, ease: EASE, delay: i * 0.08 }}
              className={cell.span}
            >
              <GlowCard className="h-full p-6">
                <div className="mb-4 font-mono text-[10px] uppercase tracking-widest text-[#00b91e]">
                  {cell.label}
                </div>
                <div className="mb-4">{cell.visual}</div>
                <div className="mt-auto border-t border-white/[0.06] pt-4">
                  <h3 className="text-sm font-semibold text-white">{cell.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{cell.body}</p>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
