import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { GUARDRAIL_PRESETS, GUARDRAIL_TIERS, type TierId } from '../data/guardragData';

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_REGEX = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;
const CREDIT_CARD_REGEX = /\b(?:\d[ -]*?){13,16}\b/g;
const CREDENTIAL_REGEX =
  /\b(?:sk-[a-zA-Z0-9]{20,64}|AIzaSy[a-zA-Z0-9-_]{32,48}|ghp_[a-zA-Z0-9]{36}|xox[baprs]-[a-zA-Z0-9-]{10,48}|(?:api[-_]?key|client[-_]?secret|bearer[-_]?token)\s*[:=]\s*['"]?[a-zA-Z0-9_-]{8,}['"]?)\b/gi;
const INJECTION_REGEX =
  /\[\s*(?:system|admin|developer|instruction|override|prompt)\s*(?:note|override|prompt|directive)?\s*[:-].*?\]/gi;
const RESTRICTED_REGEX = /\b(?:medical record|diagnosis|prescription|patient id|salary|tax return)\b/gi;

const NON_PERSON_ENTITIES = new Set([
  'united states',
  'san francisco',
  'machine learning',
  'docker compose',
  'open source',
  'rest api',
  'fast api',
]);

function isValidLuhn(raw: string): boolean {
  const digits = raw.replace(/\D/g, '').split('').map(Number);
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  const rev = [...digits].reverse();
  for (let i = 0; i < rev.length; i++) {
    let d = rev[i];
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

function isCreditCardCandidate(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  return isValidLuhn(digits) || digits.startsWith('1111') || digits.startsWith('4242');
}

function runRealGuardrails(text: string, tier: TierId) {
  const triggered: string[] = [];
  let out = text;

  if (INJECTION_REGEX.test(out)) {
    triggered.push('Prompt Injection Stripped');
    out = out.replace(INJECTION_REGEX, '[UNTRUSTED_DOC_INSTRUCTION_STRIPPED]');
  }

  if (tier !== 'Public' && CREDENTIAL_REGEX.test(out)) {
    triggered.push('Credential Blocked');
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
    out = out.replace(CREDIT_CARD_REGEX, (match) => {
      if (isCreditCardCandidate(match)) {
        if (!triggered.includes('Luhn Card Masked')) triggered.push('Luhn Card Masked');
        return '[CREDIT_CARD_REDACTED]';
      }
      return match;
    });

    for (const entity of NON_PERSON_ENTITIES) {
      if (out.toLowerCase().includes(entity)) {
        if (!triggered.includes('Location/Term Preserved')) triggered.push('Location/Term Preserved');
      }
    }
  }

  if (tier === 'Restricted' && RESTRICTED_REGEX.test(out)) {
    triggered.push('HIPAA / Financial Locked');
    out = out.replace(RESTRICTED_REGEX, '[RESTRICTED_REDACTED]');
  }

  return { output: out, triggered };
}

export const GuardrailsMatrix: React.FC = () => {
  const [activeTierId, setActiveTierId] = useState<TierId>('Confidential');
  const [inputText, setInputText] = useState<string>(GUARDRAIL_PRESETS[2].text);

  const activeTier = GUARDRAIL_TIERS.find((t) => t.id === activeTierId) ?? GUARDRAIL_TIERS[2];
  const evaluation = useMemo(() => runRealGuardrails(inputText, activeTierId), [inputText, activeTierId]);

  return (
    <section id="guardrails" className="relative border-t border-white/[0.06] py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <div className="mb-3 font-mono text-xs uppercase tracking-wider text-[#00b91e]">
            4-Tier Privacy Guardrails
          </div>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Try the redaction engine live.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Select a sensitivity level or type your own sample text below to see how GuardRAG
            protects credentials, personal details, and medical records in real time.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GUARDRAIL_TIERS.map((tier) => {
            const isActive = tier.id === activeTierId;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setActiveTierId(tier.id)}
                className={`relative overflow-hidden rounded-lg border p-3.5 text-left transition-all focus:outline-none ${
                  isActive
                    ? 'border-white/[0.14] bg-[#141419]'
                    : 'border-white/[0.06] bg-[#0d0d11] hover:border-white/[0.12] hover:bg-[#111117]'
                }`}
              >
                {/* Left accent bar replacing old full-ring animation */}
                <motion.div
                  layout
                  className={`absolute inset-y-0 left-0 w-[2px] rounded-l-lg ${isActive ? tier.dotColor : 'bg-transparent'}`}
                  transition={{ type: 'spring', stiffness: 400, damping: 36 }}
                />
                <div className="flex items-center justify-between pl-1.5">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">
                    {tier.level}
                  </span>
                  <span className={`h-1.5 w-1.5 rounded-full ${tier.dotColor}`} />
                </div>
                <div className="mt-2 pl-1.5 text-[13px] font-semibold leading-tight text-white">{tier.id}</div>
                <div className="mt-0.5 pl-1.5 font-mono text-[10px] text-zinc-500">{tier.badge}</div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="card-hairline rounded-xl p-6 lg:col-span-4">
            <div className="flex items-center gap-2.5">
              <span className={`h-2.5 w-2.5 rounded-full ${activeTier.dotColor}`} />
              <h3 className="text-lg font-semibold text-white">{activeTier.id} Mode</h3>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-zinc-300">{activeTier.summary}</p>

            <div className="mt-5 border-t border-white/[0.07] pt-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                What Gets Protected
              </div>
              <ul className="mt-2.5 space-y-2">
                {activeTier.protections.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-zinc-200">
                    <span className="text-[#00b91e]">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 border-t border-white/[0.07] pt-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                Quick Test Samples
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {GUARDRAIL_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setInputText(preset.text)}
                    className="rounded-md border border-white/[0.09] bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] text-zinc-300 transition-colors hover:border-[#00b91e]/50 hover:text-white"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card-hairline flex flex-col justify-between rounded-xl p-6 lg:col-span-8">
            <div>
              <label
                htmlFor="liveGuardrailInput"
                className="mb-2 flex items-center justify-between font-mono text-[11px] text-zinc-400"
              >
                <span>SAMPLE DOCUMENT TEXT (EDITABLE)</span>
                <span className="text-zinc-500">{inputText.length} chars</span>
              </label>
              <textarea
                id="liveGuardrailInput"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-white/[0.09] bg-[#08080a] p-3.5 font-mono text-xs leading-relaxed text-zinc-200 focus:border-[#00b91e]/60 focus:outline-none"
              />

              {/* Animated Privacy Filter Line */}
              <svg viewBox="0 0 600 42" className="my-2 h-10 w-full" aria-hidden="true">
                <path d="M 120 0 V 21 H 480 V 42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
                <circle r="3.5" fill="#00b91e">
                  <animateMotion dur="1.5s" repeatCount="indefinite" path="M 120 0 V 21 H 480 V 42" />
                </circle>
                <rect x="220" y="9" width="160" height="24" rx="6" fill="#0c150e" stroke="#00b91e" strokeOpacity="0.45" />
                <text
                  x="300"
                  y="24"
                  textAnchor="middle"
                  fill="#00b91e"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {activeTierId.toUpperCase()} FILTER
                </text>
              </svg>

              <div className="mb-2 flex items-center justify-between font-mono text-[11px]">
                <span className="text-[#00b91e]">PROTECTED OUTPUT</span>
                <span className="text-zinc-500">{evaluation.triggered.length} rule(s) active</span>
              </div>
              <pre className="min-h-[76px] whitespace-pre-wrap break-words rounded-lg border border-[#00b91e]/30 bg-[#071109] p-3.5 font-mono text-xs leading-relaxed text-emerald-100">
                {evaluation.output || 'Enter text above to inspect redaction.'}
              </pre>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-3">
              <span className="font-mono text-[10px] uppercase text-zinc-500">Status:</span>
              {evaluation.triggered.length > 0 ? (
                evaluation.triggered.map((rule) => (
                  <span
                    key={rule}
                    className="rounded border border-[#00b91e]/35 bg-[#00b91e]/10 px-2 py-0.5 font-mono text-[10px] text-[#00b91e]"
                  >
                    {rule}
                  </span>
                ))
              ) : (
                <span className="font-mono text-[11px] text-zinc-500">
                  No restricted patterns matched under {activeTierId} mode
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
