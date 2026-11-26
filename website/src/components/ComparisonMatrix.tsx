import React from 'react';
import { COMPARISON_ROWS } from '../data/guardragData';

const CellBadge: React.FC<{ text: string; status: 'yes' | 'warn' | 'no'; highlight?: boolean }> = ({
  text,
  status,
  highlight = false,
}) => {
  if (status === 'yes') {
    return (
      <span
        className={`inline-flex items-center gap-2 text-sm sm:text-base font-medium ${
          highlight ? 'text-[#00b91e] font-semibold' : 'text-zinc-200'
        }`}
      >
        <span className={`font-mono text-xs sm:text-sm font-bold ${highlight ? 'text-[#00b91e]' : 'text-zinc-400'}`}>
          ✓
        </span>
        <span className="whitespace-normal leading-snug">{text}</span>
      </span>
    );
  }
  if (status === 'warn') {
    return (
      <span className="inline-flex items-center gap-2 text-sm sm:text-base text-zinc-400">
        <span className="font-mono text-xs sm:text-sm font-bold text-amber-400/80">~</span>
        <span className="whitespace-normal leading-snug">{text}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-sm sm:text-base text-zinc-500">
      <span className="font-mono text-xs sm:text-sm font-bold text-zinc-600">—</span>
      <span className="whitespace-normal leading-snug">{text}</span>
    </span>
  );
};

export const ComparisonMatrix: React.FC = () => {
  return (
    <section id="comparison" className="relative border-t border-white/[0.06] py-24 sm:py-32">
      <div className="mx-auto w-full max-w-[1840px] px-6 sm:px-12 lg:px-16 2xl:px-20">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <div className="mb-3 font-mono text-xs uppercase tracking-wider text-zinc-400">
            Private Alternative to Cloud AI
          </div>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl">
            How GuardRAG compares to public cloud assistants.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
            See the critical differences in data ownership, privacy safeguards, and document
            intelligence between GuardRAG and third-party cloud services.
          </p>
        </div>

        {/* Mobile Horizontal Scroll Indicator */}
        <div className="sm:hidden mb-3 text-right font-mono text-xs text-zinc-500">
          ← Scroll horizontally to compare →
        </div>

        <div className="card-hairline mx-auto w-full max-w-[1780px] overflow-hidden rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#111218] text-sm sm:text-base font-bold text-zinc-200">
                  <th className="sticky left-0 z-20 min-w-[240px] bg-[#111218] px-6 py-4.5 shadow-[4px_0_16px_rgba(0,0,0,0.6)]">
                    Capability
                  </th>
                  <th className="min-w-[220px] border-x border-[#00b91e]/25 bg-[#00b91e]/[0.06] px-6 py-4.5 text-white">
                    <div className="flex items-center gap-2.5">
                      <img src="./assets/duck-mark.png" alt="" className="h-5 w-5 rounded-sm" />
                      <span className="font-bold text-white">GuardRAG (Offline Engine)</span>
                    </div>
                  </th>
                  <th className="min-w-[200px] px-6 py-4.5 text-zinc-300">
                    Public Cloud AI (NotebookLM / Claude)
                  </th>
                  <th className="min-w-[200px] px-6 py-4.5 text-zinc-300">
                    DIY / Self-Hosted RAG
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.capability} className="transition-colors hover:bg-white/[0.02]">
                    <td className="sticky left-0 z-10 bg-[#0c0d12] px-6 py-4 text-sm sm:text-base font-semibold text-zinc-200 shadow-[4px_0_16px_rgba(0,0,0,0.6)]">
                      {row.capability}
                    </td>
                    <td className="border-x border-[#00b91e]/20 bg-[#00b91e]/[0.03] px-6 py-4">
                      <CellBadge text={row.guardrag.text} status={row.guardrag.status} highlight />
                    </td>
                    <td className="px-6 py-4">
                      <CellBadge text={row.cloud.text} status={row.cloud.status} />
                    </td>
                    <td className="px-6 py-4">
                      <CellBadge text={row.diy.text} status={row.diy.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonMatrix;
