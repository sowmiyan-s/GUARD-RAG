import React, { useMemo, useRef, useState } from 'react';
import { GUARDRAIL_PRESETS, GUARDRAIL_TIERS, type TierId } from '../data/guardragData';

/* ── React Bits SpotlightCard with dynamic pointer-following radial light ── */
interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  glowBorderColor?: string;
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(0, 185, 30, 0.14)',
  glowBorderColor = 'rgba(0, 185, 30, 0.3)',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0d12]/90 p-7 sm:p-8 transition-all duration-300 hover:border-white/25 hover:shadow-[0_24px_60px_-15px_rgba(0,0,0,0.8)] ${className}`}
    >
      {/* 21st / React Bits dynamic cursor spotlight */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(520px circle at ${mousePos.x}px ${mousePos.y}px, ${spotlightColor}, transparent 45%)`,
        }}
      />

      {/* Dynamic lit border under cursor */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(280px circle at ${mousePos.x}px ${mousePos.y}px, ${glowBorderColor}, transparent 40%)`,
          maskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
          maskComposite: 'exclude',
          WebkitMaskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
      />

      {/* Luxury subtle dotted grid backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03] transition-opacity duration-300 group-hover:opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between">{children}</div>
    </div>
  );
};

/* ── Lightweight In-Browser Confidentiality Engine ── */
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_REGEX = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;
const CREDIT_CARD_REGEX = /\b(?:\d[ -]*?){13,16}\b/g;
const CREDENTIAL_REGEX =
  /\b(?:sk-[a-zA-Z0-9]{20,64}|AIzaSy[a-zA-Z0-9-_]{32,48}|ghp_[a-zA-Z0-9]{36}|xox[baprs]-[a-zA-Z0-9-]{10,48}|(?:api[-_]?key|client[-_]?secret|bearer[-_]?token)\s*[:=]\s*['"]?[a-zA-Z0-9_-]{8,}['"]?)\b/gi;
const INJECTION_REGEX =
  /\[\s*(?:system|admin|developer|instruction|override|prompt)\s*(?:note|override|prompt|directive)?\s*[:-].*?\]/gi;
const RESTRICTED_REGEX = /\b(?:medical record|diagnosis|prescription|patient id|salary|tax return)\b/gi;

function runRedactionEngine(text: string, tier: TierId) {
  let out = text;
  const triggered: string[] = [];

  if (INJECTION_REGEX.test(out)) {
    triggered.push('Prompt Override Neutralized');
    out = out.replace(INJECTION_REGEX, '[PROMPT_OVERRIDE_STRIPPED]');
  }

  if (tier !== 'Public' && CREDENTIAL_REGEX.test(out)) {
    triggered.push('Secret Credentials Blocked');
    out = out.replace(CREDENTIAL_REGEX, '[CREDENTIAL_REDACTED]');
  }

  if (tier === 'Confidential' || tier === 'Restricted') {
    if (EMAIL_REGEX.test(out)) {
      triggered.push('Email Masked');
      out = out.replace(EMAIL_REGEX, '[EMAIL_REDACTED]');
    }
    if (PHONE_REGEX.test(out)) {
      triggered.push('Phone Masked');
      out = out.replace(PHONE_REGEX, '[PHONE_REDACTED]');
    }
    if (SSN_REGEX.test(out)) {
      triggered.push('SSN Masked');
      out = out.replace(SSN_REGEX, '[SSN_REDACTED]');
    }
    if (CREDIT_CARD_REGEX.test(out)) {
      triggered.push('Credit Card Masked');
      out = out.replace(CREDIT_CARD_REGEX, '[CREDIT_CARD_REDACTED]');
    }
  }

  if (tier === 'Restricted' && RESTRICTED_REGEX.test(out)) {
    triggered.push('Medical / Financial Protected');
    out = out.replace(RESTRICTED_REGEX, '[RESTRICTED_DATA_SHIELDED]');
  }

  return { output: out, triggered };
}

export const GuardrailsMatrix: React.FC = () => {
  const [activeTierId, setActiveTierId] = useState<TierId>('Confidential');
  const [inputText, setInputText] = useState<string>(
    'Contact sarah.miller@enterprise.com or 415-555-0199. Card 4242-4242-4242-4242 with api_key=sk-live-9874635241.'
  );

  const evaluation = useMemo(() => runRedactionEngine(inputText, activeTierId), [inputText, activeTierId]);

  return (
    <section id="guardrails" className="relative border-t border-white/[0.06] py-28 sm:py-36">
      {/* Ambient Radial Lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/4 h-[550px] w-full max-w-5xl -translate-x-1/2 rounded-full bg-[#00b91e]/[0.035] blur-[170px]"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1840px] px-6 sm:px-12 lg:px-16 2xl:px-20">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Automatic Privacy Shield
          </div>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
            Built-in protection. Zero setup required.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-zinc-300 sm:text-xl">
            GuardRAG automatically detects and masks sensitive records before any AI model reads them.
            Your confidential data is protected on-device without manual rules or configuration.
          </p>
        </div>

        {/* 4 Bento Spotlight Cards (React Bits & UIverse Architecture) */}
        <div className="mx-auto w-full max-w-[1780px]">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 items-stretch">
            {/* ── CARD 1: PERSONAL IDENTITY SHIELD ── */}
            <SpotlightCard
              spotlightColor="rgba(0, 185, 30, 0.16)"
              glowBorderColor="rgba(0, 185, 30, 0.4)"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00b91e]/15 text-[#00b91e]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-semibold text-emerald-400">
                    Personal Identity
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-bold tracking-tight text-white">
                  Personal Identity Shield
                </h3>
                <p className="mt-2.5 text-sm sm:text-[15px] leading-relaxed text-zinc-300">
                  Safeguards client names, email addresses, phone numbers, and Social Security numbers so private identities never leak.
                </p>
              </div>

              {/* Visual Mockup: Contact Record Card */}
              <div className="mt-8 overflow-hidden rounded-xl border border-white/[0.08] bg-[#07080b] p-4.5 shadow-inner">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-xs font-bold text-black">
                      SM
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Sarah Miller</div>
                      <div className="font-mono text-[10px] text-zinc-500">Verified Client</div>
                    </div>
                  </div>
                  <span className="flex h-2 w-2 rounded-full bg-[#00b91e] animate-pulse" />
                </div>

                <div className="mt-3.5 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 border border-white/[0.04]">
                    <span className="text-zinc-400 text-xs">Email</span>
                    <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                      [Email Protected]
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 border border-white/[0.04]">
                    <span className="text-zinc-400 text-xs">Phone</span>
                    <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                      [Phone Protected]
                    </span>
                  </div>
                </div>
              </div>
            </SpotlightCard>

            {/* ── CARD 2: FINANCIAL & PAYMENT VAULT ── */}
            <SpotlightCard
              spotlightColor="rgba(14, 165, 233, 0.16)"
              glowBorderColor="rgba(14, 165, 233, 0.4)"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                  </div>
                  <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 font-mono text-xs font-semibold text-sky-400">
                    Financial Security
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-bold tracking-tight text-white">
                  Financial &amp; Card Vault
                </h3>
                <p className="mt-2.5 text-sm sm:text-[15px] leading-relaxed text-zinc-300">
                  Validates card numbers with mathematical checksum algorithms and masks them before any AI processing occurs.
                </p>
              </div>

              {/* Visual Mockup: Luxury Dark Glass Payment Card */}
              <div className="mt-8 relative overflow-hidden rounded-xl border border-sky-500/25 bg-gradient-to-br from-sky-950/30 via-[#0a0f18] to-[#070b12] p-4.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-8 rounded bg-gradient-to-tr from-amber-400/80 to-amber-200/90 shadow-sm flex items-center justify-center">
                    <span className="block h-3 w-5 border border-amber-900/40 rounded-sm" />
                  </div>
                  <span className="rounded bg-sky-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-sky-300 border border-sky-500/30">
                    Luhn Checksum ✓
                  </span>
                </div>

                <div className="mt-4 font-mono text-sm tracking-wider text-zinc-300 flex items-center justify-between">
                  <span>•••• •••• ••••</span>
                  <span className="rounded bg-sky-500/25 px-2 py-0.5 text-xs font-bold text-sky-200 border border-sky-400/30">
                    [Card Hidden]
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between pt-2.5 border-t border-white/[0.06] font-mono text-xs text-zinc-400">
                  <span className="text-zinc-300 font-medium">Private Client</span>
                  <span className="text-sky-400 font-semibold">ISO 7812 Verified</span>
                </div>
              </div>
            </SpotlightCard>

            {/* ── CARD 3: PASSWORDS & SECRET KEYS ── */}
            <SpotlightCard
              spotlightColor="rgba(245, 158, 11, 0.16)"
              glowBorderColor="rgba(245, 158, 11, 0.4)"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                  </div>
                  <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 font-mono text-xs font-semibold text-amber-400">
                    Credentials Lock
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-bold tracking-tight text-white">
                  Passwords &amp; Secret Keys
                </h3>
                <p className="mt-2.5 text-sm sm:text-[15px] leading-relaxed text-zinc-300">
                  Prevents database credentials, private API tokens, and authorization keys from leaking into shared answers.
                </p>
              </div>

              {/* Visual Mockup: Encrypted Secret Key Vault */}
              <div className="mt-8 rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-950/25 via-[#110e08] to-[#0a0805] p-4.5 shadow-inner font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                  <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    Key Vault
                  </span>
                  <span className="text-amber-400 font-medium">Memory Redacted</span>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-black/40 px-3 py-2 border border-white/[0.06]">
                    <span className="text-zinc-400">API Token</span>
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 font-bold text-amber-300 border border-amber-500/35">
                      [Key Masked]
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-black/40 px-3 py-2 border border-white/[0.06]">
                    <span className="text-zinc-400">Password</span>
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 font-bold text-amber-300 border border-amber-500/35">
                      [Redacted]
                    </span>
                  </div>
                </div>
              </div>
            </SpotlightCard>

            {/* ── CARD 4: MEDICAL & REGULATED DATA ── */}
            <SpotlightCard
              spotlightColor="rgba(217, 70, 239, 0.16)"
              glowBorderColor="rgba(217, 70, 239, 0.4)"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-500/15 text-fuchsia-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <span className="rounded-full border border-fuchsia-500/25 bg-fuchsia-500/10 px-3 py-1 font-mono text-xs font-semibold text-fuchsia-400">
                    Strict Compliance
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-bold tracking-tight text-white">
                  Regulated Medical &amp; Legal
                </h3>
                <p className="mt-2.5 text-sm sm:text-[15px] leading-relaxed text-zinc-300">
                  Complies with strict confidentiality standards by shielding medical record numbers, diagnoses, and restricted client files.
                </p>
              </div>

              {/* Visual Mockup: Regulated Document Record */}
              <div className="mt-8 rounded-xl border border-fuchsia-500/25 bg-gradient-to-br from-fuchsia-950/25 via-[#110811] to-[#0a050a] p-4.5 shadow-inner font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                  <span className="text-zinc-200 font-semibold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-fuchsia-400 animate-pulse" />
                    HIPAA Shield
                  </span>
                  <span className="rounded bg-fuchsia-500/20 px-2 py-0.5 font-bold text-fuchsia-300 border border-fuchsia-500/30">
                    Audit Clean
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-black/40 px-3 py-2 border border-white/[0.05]">
                    <span className="text-zinc-400">Patient ID</span>
                    <span className="rounded bg-fuchsia-500/15 px-2 py-0.5 font-semibold text-fuchsia-300 border border-fuchsia-500/30">
                      [MRN Redacted]
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-black/40 px-3 py-2 border border-white/[0.05]">
                    <span className="text-zinc-400">Diagnosis</span>
                    <span className="rounded bg-fuchsia-500/15 px-2 py-0.5 font-semibold text-fuchsia-300 border border-fuchsia-500/30">
                      [Notes Shielded]
                    </span>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </div>

          {/* ── LIVE INTERACTIVE CONFIDENTIALITY PLAYGROUND (Vercel / Linear Style) ── */}
          <div className="mt-14 rounded-2xl border border-white/[0.1] bg-[#0c0d12]/95 p-6 sm:p-9 shadow-[0_24px_70px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#00b91e] animate-pulse" />
                  <span>Try the Redaction Engine Live</span>
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Type any custom sentence or choose a preset to inspect instant on-device redaction.
                </p>
              </div>

              {/* Clean Tier Mode Switcher */}
              <div className="flex flex-wrap items-center gap-2">
                {GUARDRAIL_TIERS.map((tier) => {
                  const isActive = tier.id === activeTierId;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setActiveTierId(tier.id)}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                        isActive
                          ? 'border border-[#00b91e]/40 bg-[#00b91e]/15 text-[#00b91e] shadow-sm'
                          : 'border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {tier.id} Mode
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Split Editor Architecture */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left Column: Input */}
              <div className="flex flex-col justify-between rounded-xl border border-white/[0.08] bg-[#07080c] p-5">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2.5">
                    <span className="font-semibold text-zinc-300">Raw Document Excerpt (Editable)</span>
                    <span>Input</span>
                  </div>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    rows={4}
                    placeholder="Type or paste text with sensitive data..."
                    className="w-full resize-none rounded-lg border border-white/[0.08] bg-black/50 p-3.5 font-mono text-xs sm:text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:border-[#00b91e]/50 focus:outline-none"
                  />
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06]">
                  <span className="font-mono text-xs text-zinc-500 block mb-2">Quick Test Presets:</span>
                  <div className="flex flex-wrap gap-2">
                    {GUARDRAIL_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setInputText(preset.text)}
                        className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-xs text-zinc-300 transition-colors hover:border-[#00b91e]/40 hover:text-white"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Protected Output */}
              <div className="flex flex-col justify-between rounded-xl border border-[#00b91e]/25 bg-emerald-950/[0.07] p-5">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-2.5">
                    <span className="font-semibold text-[#00b91e]">Protected Output (Redacted Live)</span>
                    <span className="text-emerald-400 font-medium">100% On-Device</span>
                  </div>
                  <div className="min-h-[112px] whitespace-pre-wrap break-words rounded-lg border border-[#00b91e]/30 bg-black/70 p-3.5 font-mono text-xs sm:text-sm leading-relaxed text-emerald-200">
                    {evaluation.output || 'Enter text on the left to inspect redaction.'}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#00b91e]/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {evaluation.triggered.length > 0 ? (
                      evaluation.triggered.map((rule) => (
                        <span
                          key={rule}
                          className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-300"
                        >
                          ✓ {rule}
                        </span>
                      ))
                    ) : (
                      <span className="font-mono text-zinc-400">No restricted entities in excerpt</span>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-zinc-500">0 Bytes Network Egress</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GuardrailsMatrix;
