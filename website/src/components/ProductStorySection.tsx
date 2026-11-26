import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { SUPPORTED_FORMATS } from '../data/guardragData';

const EASE = [0.42, 0, 0, 1] as const;

/* ── 1. Local Vault Visual (adapted from 21st.dev BentoMiniUI ChipsVisual) ── */
function LocalVaultVisual({ on }: { on: boolean }) {
  const files = [
    { name: 'Contracts.pdf', x: -128, y: -12 },
    { name: 'Q3_Sheet.xlsx', x: 0, y: -56 },
    { name: 'Clinic_Notes.docx', x: 128, y: 18 },
  ];

  return (
    <div className="relative h-[200px] w-full">
      {files.map((f, i) => (
        <motion.div
          key={f.name}
          className="absolute left-1/2 top-1/2 w-[168px] rounded-lg border border-white/[0.1] bg-[#14141a] p-3 shadow-lg"
          style={{ marginLeft: -84, marginTop: -32 }}
          initial={{ opacity: 0, x: f.x, y: f.y + 28 }}
          animate={on ? { opacity: 1, x: f.x, y: f.y } : {}}
          transition={{ duration: 0.85, ease: EASE, delay: 0.1 + i * 0.12 }}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-medium text-zinc-200">{f.name}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#00b91e]" />
          </div>
          <span className="mt-2 block h-1.5 w-3/4 rounded-full bg-white/[0.08]" />
          <span className="mt-1.5 block h-1.5 w-1/2 rounded-full bg-white/[0.06]" />
        </motion.div>
      ))}

      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <motion.div
          className="rounded-lg border border-[#00b91e]/40 bg-[#0a140d] px-3.5 py-1.5 font-mono text-xs font-semibold text-[#00b91e] shadow-[0_8px_24px_rgba(0,0,0,0.65)]"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={on ? { opacity: 1, scale: [0.7, 1.08, 1] } : {}}
          transition={{ duration: 0.55, delay: 0.7 }}
        >
          Stored Locally · 0 Cloud Uploads
        </motion.div>
      </div>
    </div>
  );
}

/* ── 2. Exact Search Comparison (adapted from 21st.dev BentoMiniUI StrikeVisual) ── */
function ExactSearchVisual({ on }: { on: boolean }) {
  const missed = ['Cloud tools that upload your files', 'Vector-only search missing exact codes'];

  return (
    <motion.div
      className="w-full max-w-[330px] rounded-xl border border-white/[0.1] bg-[#14141a] p-4"
      initial={{ opacity: 0, y: 28 }}
      animate={on ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <div className="pb-2.5 font-mono text-[11px] text-zinc-500">
        Search: &quot;ERR-9021&quot; or &quot;Section 4.2(b)&quot;
      </div>
      <div className="flex items-center gap-2.5 border-t border-white/[0.08] py-2.5 text-[13px] font-medium text-white">
        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#00b91e]/20 text-[10px] text-[#00b91e]">
          ✓
        </span>
        <span>Exact match + meaning (BM25 + RRF)</span>
      </div>
      {missed.map((item, i) => (
        <div
          key={item}
          className="relative w-fit border-t border-white/[0.08] py-2.5 pl-[26px] text-[13px] text-zinc-500"
        >
          {item}
          <motion.span
            className="absolute left-[26px] right-0 top-1/2 h-px origin-left bg-zinc-400/60"
            initial={{ scaleX: 0 }}
            animate={on ? { scaleX: 1 } : {}}
            transition={{ duration: 0.5, ease: EASE, delay: 0.7 + i * 0.25 }}
          />
        </div>
      ))}
    </motion.div>
  );
}

/* ── 3. Auto-Redaction Review List (adapted from 21st.dev BentoMiniUI ReviewVisual) ── */
function RedactionReviewVisual({ on }: { on: boolean }) {
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (!on) return;
    const t = setTimeout(() => setResolved(true), 1700);
    return () => clearTimeout(t);
  }, [on]);

  const rows = [
    { label: 'API Keys & Passwords', badge: 'Blocked', done: true },
    { label: 'Credit Cards (Luhn Check)', badge: resolved ? 'Masked' : 'Scanning', done: resolved },
    { label: 'Emails, Phones & SSNs', badge: 'Masked', done: true },
  ];

  return (
    <motion.div
      className="w-full max-w-[330px] rounded-xl border border-white/[0.1] bg-[#14141a] p-4"
      initial={{ opacity: 0, y: 28 }}
      animate={on ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <div className="pb-2.5 font-mono text-[11px] text-zinc-500">Before indexing or streaming</div>
      {rows.map((r) => (
        <div
          key={r.label}
          className="flex items-center justify-between gap-3 border-t border-white/[0.08] py-2.5 text-[13px] text-zinc-200"
        >
          <span className="flex items-center gap-2">
            {r.done ? (
              <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#00b91e]/20 text-[10px] text-[#00b91e]">
                ✓
              </span>
            ) : (
              <span className="h-3.5 w-3.5 rounded-full border border-amber-400" />
            )}
            <span>{r.label}</span>
          </span>
          <span
            className={`rounded px-2 py-0.5 font-mono text-[10px] ${r.done ? 'bg-white/[0.07] text-zinc-300' : 'bg-amber-400/20 text-amber-300'
              }`}
          >
            {r.badge}
          </span>
        </div>
      ))}
    </motion.div>
  );
}

/* ── 4. Offline Audio Overview + Office LAN Share Visual ── */
function AudioAndShareVisual({ on }: { on: boolean }) {
  const [speaking, setSpeaking] = useState(false);
  const [pct, setPct] = useState(0);

  const toggleAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setPct(0);
      return;
    }
    window.speechSynthesis.cancel();
    const text =
      'GuardRAG offline briefing. All documents stay on your local computer, and team members on your office Wi-Fi can ask read-only questions without installing anything.';
    const u = new SpeechSynthesisUtterance(text);
    u.onstart = () => {
      setSpeaking(true);
      setPct(8);
    };
    u.onboundary = (e) => {
      if (typeof e.charIndex === 'number') {
        setPct(Math.min(100, Math.round((e.charIndex / text.length) * 100)));
      }
    };
    u.onend = () => {
      setSpeaking(false);
      setPct(0);
    };
    u.onerror = () => {
      setSpeaking(false);
      setPct(0);
    };
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <motion.div
      className="w-full max-w-[330px] space-y-2.5"
      initial={{ opacity: 0, y: 28 }}
      animate={on ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: EASE }}
    >
      {/* Real Offline Voice Player */}
      <div className="rounded-xl border border-white/[0.1] bg-[#14141a] p-3.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-white">Offline Voice Briefing</div>
            <div className="font-mono text-[10px] text-zinc-400">
              {speaking ? `Playing locally · ${pct}%` : 'Uses your browser voice engine'}
            </div>
          </div>
          <button
            type="button"
            onClick={toggleAudio}
            className="rounded-lg border border-[#00b91e]/40 bg-[#00b91e]/15 px-3 py-1.5 text-xs font-semibold text-[#00b91e] transition-colors hover:bg-[#00b91e]/25"
          >
            {speaking ? 'Stop' : 'Listen'}
          </button>
        </div>
        <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full bg-[#00b91e] transition-all duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Host vs Guest LAN Access */}
      <div className="flex items-center justify-between rounded-xl border border-white/[0.09] bg-[#101015] px-3.5 py-2.5 text-xs">
        <span className="text-zinc-300">Office Wi-Fi Guest Link</span>
        <span className="rounded bg-[#00b91e]/15 px-2 py-0.5 font-mono text-[10px] text-[#00b91e]">
          Read-Only · Host Controlled
        </span>
      </div>
    </motion.div>
  );
}

function StoryCard({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: (on: boolean) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { once: true, amount: 0.45 });

  return (
    <div
      ref={ref}
      className="card-hairline flex flex-col overflow-hidden rounded-2xl transition-colors duration-300 hover:border-white/[0.15]"
    >
      <div className="relative flex h-[240px] items-center justify-center overflow-hidden border-b border-white/[0.06] bg-[#0a0a0e] px-5">
        {children(on)}
      </div>
      <div className="p-6 sm:p-7">
        <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
      </div>
    </div>
  );
}

export const ProductStorySection: React.FC = () => {
  return (
    <section id="story" className="relative border-t border-white/[0.06] py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 max-w-2xl">
          <div className="mb-3 font-mono text-xs uppercase tracking-wider text-[#00b91e]">
            How it works
          </div>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Built for teams that cannot upload files to the cloud.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Legal teams, clinics, finance departments, and engineers get fast answers with verified
            page citations—without exposing a single record online.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <StoryCard
            title="Your files never leave your computer"
            body="Drop PDFs, spreadsheets, slides, or entire folders into GuardRAG. Every file is read, indexed, and answered locally on your own hardware."
          >
            {(on) => <LocalVaultVisual on={on} />}
          </StoryCard>

          <StoryCard
            title="Finds exact codes and clauses, not guesses"
            body="Combines keyword precision with meaning search so invoice numbers, error codes, and contract sections always surface at the top."
          >
            {(on) => <ExactSearchVisual on={on} />}
          </StoryCard>

          <StoryCard
            title="Sensitive details masked automatically"
            body="Automatically hides API keys, phone numbers, emails, SSNs, and verified card numbers before storing or streaming any response."
          >
            {(on) => <RedactionReviewVisual on={on} />}
          </StoryCard>

          <StoryCard
            title="Listen offline and share on office Wi-Fi"
            body="Play spoken document briefings directly in your browser with zero external voice APIs, or share a read-only link across your local network."
          >
            {(on) => <AudioAndShareVisual on={on} />}
          </StoryCard>
        </div>

        {/* Supported Formats Strip */}
        <div className="card-hairline mt-4 rounded-2xl p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
              Supported Local Formats
            </span>
            <span className="font-mono text-[11px] text-[#00b91e]">
              9+ Native Loaders · Zero Cloud Parsing
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-9">
            {SUPPORTED_FORMATS.map((fmt) => (
              <div
                key={fmt.ext}
                className="rounded-lg border border-white/[0.07] bg-[#0a0a0e] px-2.5 py-2"
                title={fmt.note}
              >
                <div className="font-mono text-xs font-semibold text-white">{fmt.ext}</div>
                <div className="mt-0.5 truncate font-mono text-[10px] text-zinc-500">
                  {fmt.engine}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
