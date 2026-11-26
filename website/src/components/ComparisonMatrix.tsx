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
        className={`inline-flex items-center gap-2 text-xs font-medium ${
          highlight ? 'text-[#00b91e]' : 'text-zinc-200'
        }`}
      >
        <span className={`font-mono text-[11px] ${highlight ? 'text-[#00b91e]' : 'text-zinc-400'}`}>
          ✓
        </span>
        <span>{text}</span>
      </span>
    );
  }
  if (status === 'warn') {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-zinc-400">
        <span className="font-mono text-[11px] text-amber-400/80">~</span>
        <span>{text}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-xs text-zinc-500">
      <span className="font-mono text-[11px] text-zinc-600">—</span>
      <span>{text}</span>
    </span>
  );
};

export const ComparisonMatrix: React.FC = () => {
  return (
    <section id="comparison" className="relative border-t border-white/[0.06] py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <div className="mb-3 font-mono text-xs uppercase tracking-wider text-[#00b91e]">
            Feature Comparison
          </div>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            How GuardRAG compares to cloud notebooks.
          </h2>
        </div>

        <div className="card-hairline overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-dashed border-white/[0.09] bg-[#121217] text-xs font-semibold text-zinc-300">
                  <th className="px-5 py-4">Capability</th>
                  <th className="border-x border-[#00b91e]/25 bg-[#00b91e]/[0.06] px-5 py-4 text-white">
                    <div className="flex items-center gap-2">
                      <img src="./assets/duck-mark.png" alt="" className="h-4 w-4 rounded-sm" />
                      <span>GuardRAG</span>
                    </div>
                  </th>
                  <th className="px-5 py-4 text-zinc-400">Google NotebookLM</th>
                  <th className="px-5 py-4 text-zinc-400">Cloud Chat Tools</th>
                  <th className="px-5 py-4 text-zinc-400">PrivateGPT</th>
                  <th className="px-5 py-4 text-zinc-400">Bare LangChain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-white/[0.07]">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.capability} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5 text-xs font-medium text-zinc-200">
                      {row.capability}
                    </td>
                    <td className="border-x border-[#00b91e]/20 bg-[#00b91e]/[0.03] px-5 py-3.5">
                      <CellBadge text={row.guardrag.text} status={row.guardrag.status} highlight />
                    </td>
                    <td className="px-5 py-3.5">
                      <CellBadge text={row.notebooklm.text} status={row.notebooklm.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <CellBadge text={row.cloud.text} status={row.cloud.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <CellBadge text={row.privategpt.text} status={row.privategpt.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <CellBadge text={row.langchain.text} status={row.langchain.status} />
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
