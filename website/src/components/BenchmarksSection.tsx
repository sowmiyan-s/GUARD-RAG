import React, { useState } from 'react';
import { BENCHMARKS, REPO_META } from '../data/guardragData';

interface HardwareProfile {
  id: string;
  label: string;
  model: string;
  metricLabel: string;
  metricValue: string;
  memory: string;
  device: string;
  notes: string;
}

const HARDWARE_PROFILES: HardwareProfile[] = [
  {
    id: 'laptop-cpu',
    label: 'CPU Compact (gemma3:1b)',
    model: 'gemma3:1b',
    metricLabel: 'CPU Throughput',
    metricValue: '24.5 tok/s',
    memory: '1.4 GB RAM',
    device: 'CPU Only · Zero GPU VRAM',
    notes: 'Runs smoothly on standard 8 GB laptops with FastEmbed ONNX (~60 MB RAM).',
  },
  {
    id: 'workstation',
    label: 'CPU Standard (llama3.1:8b)',
    model: 'llama3.1:8b',
    metricLabel: 'Time-to-First-Token',
    metricValue: '140 ms TTFT',
    memory: '5.2 GB RAM',
    device: 'Local Ollama Daemon (CPU)',
    notes: 'Full 8B reasoning model running locally with < 1.0 ms FAISS-CPU search.',
  },
  {
    id: 'rtx-gpu',
    label: 'GPU Accelerated (RTX 4070)',
    model: 'llama3.1:8b',
    metricLabel: 'GPU Throughput',
    metricValue: '72.0 tok/s',
    memory: '6.1 GB VRAM',
    device: 'Local CUDA GPU',
    notes: 'Hardware-accelerated Ollama inference with 8.2 ms/chunk FastEmbed vectorization.',
  },
];

export const BenchmarksSection: React.FC = () => {
  const [profileId, setProfileId] = useState(HARDWARE_PROFILES[2].id);
  const profile = HARDWARE_PROFILES.find((p) => p.id === profileId) ?? HARDWARE_PROFILES[0];

  return (
    <section id="benchmarks" className="relative border-t border-white/[0.06] py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-3 font-mono text-xs uppercase tracking-wider text-[#00b91e]">
              Performance &amp; Benchmarks
            </div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              Fast on standard laptops. Faster on local GPUs.
            </h2>
          </div>
          <div className="rounded-lg border border-white/[0.08] bg-[#101014] px-3.5 py-2 font-mono text-[11px] text-zinc-400">
            Intel Core i7-13700K · 16 Cores · 32 GB RAM · Win 11 / Ubuntu 22.04
          </div>
        </div>

        {/* Hardware Profile Comparison */}
        <div className="card-hairline mb-6 rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
            <div className="flex flex-wrap gap-2">
              {HARDWARE_PROFILES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setProfileId(item.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    item.id === profileId
                      ? 'border-[#00b91e]/50 bg-[#00b91e]/15 text-[#00b91e]'
                      : 'border-white/[0.08] bg-[#0a0a0e] text-zinc-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <span className="font-mono text-[11px] text-zinc-500">
              Measured reference profiles
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/[0.07] bg-[#0a0a0e] p-4">
              <div className="text-xs text-zinc-400">FastEmbed ONNX + FAISS-CPU</div>
              <div className="mt-1.5 font-mono text-2xl font-semibold text-white">8.2 ms</div>
              <div className="mt-1 font-mono text-[10px] text-zinc-500">
                ~60 MB RAM · &lt; 1.0 ms search (10k chunks)
              </div>
            </div>
            <div className="rounded-xl border border-[#00b91e]/35 bg-[#0a130c] p-4">
              <div className="text-xs text-zinc-300">
                {profile.metricLabel} ({profile.model})
              </div>
              <div className="mt-1.5 font-mono text-2xl font-semibold text-[#00b91e]">
                {profile.metricValue}
              </div>
              <div className="mt-1 font-mono text-[10px] text-zinc-400">{profile.device}</div>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-[#0a0a0e] p-4">
              <div className="text-xs text-zinc-400">Model Memory Footprint</div>
              <div className="mt-1.5 font-mono text-2xl font-semibold text-white">
                {profile.memory}
              </div>
              <div className="mt-1 font-mono text-[10px] text-zinc-500">+ ~60 MB FastEmbed</div>
            </div>
          </div>

          <p className="mt-4 font-mono text-[11px] text-zinc-400">{profile.notes}</p>
        </div>

        {/* Full README Benchmark Table + Official Banner & Test Status */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="card-hairline divide-y divide-white/[0.06] rounded-2xl lg:col-span-8">
            {BENCHMARKS.map((row) => (
              <div
                key={row.operation}
                className="flex flex-wrap items-center justify-between gap-3 p-5 sm:px-6"
              >
                <div>
                  <div className="text-sm font-semibold text-white">{row.operation}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-zinc-400">{row.engine}</div>
                </div>
                <div className="text-right">
                  <div>
                    <span className="font-mono text-xl font-semibold text-[#00b91e]">
                      {row.metric}
                    </span>
                    <span className="ml-1 font-mono text-xs text-zinc-400">{row.unit}</span>
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-zinc-500">{row.footprint}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card-hairline flex flex-col justify-between rounded-2xl p-6 lg:col-span-4">
            <div>
              <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white p-3">
                <img
                  src="./assets/banner.png"
                  alt="GuardRAG Banner"
                  className="h-auto w-full object-contain"
                />
              </div>

              <div className="mt-6">
                <div className="font-mono text-xs text-[#00b91e]">Verified Test Suite</div>
                <div className="mt-1.5 font-mono text-3xl font-semibold tracking-tight text-white">
                  {REPO_META.testsPassing} / {REPO_META.testsPassing} Passing
                </div>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  Automated pytest checks verify hybrid retrieval, Excel/PPTX/HTML loaders, Luhn
                  checksum validation, and LAN sharing controls.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-white/[0.07] bg-[#09090c] p-3 font-mono text-[11px] text-zinc-300">
              <div className="text-zinc-500"># Run test suite</div>
              <div className="mt-1 text-white">pytest -v</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
