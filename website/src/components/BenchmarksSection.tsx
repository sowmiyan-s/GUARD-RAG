import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BENCHMARKS, REPO_META } from '../data/guardragData';

interface HardwarePreset {
  id: string;
  label: string;
  model: string;
  embedMs: number;
  faissMs: string;
  ttftMs: number;
  tokPerSec: number;
  memory: string;
  device: string;
}

const HARDWARE_PRESETS: HardwarePreset[] = [
  {
    id: 'laptop-cpu',
    label: '8 GB Laptop (CPU)',
    model: 'gemma3:1b',
    embedMs: 8.2,
    faissMs: '< 1.0 ms',
    ttftMs: 140,
    tokPerSec: 24.5,
    memory: '1.4 GB RAM',
    device: 'CPU Only · Zero GPU',
  },
  {
    id: 'workstation',
    label: '16 GB Workstation',
    model: 'llama3.1:8b',
    embedMs: 8.2,
    faissMs: '< 1.0 ms',
    ttftMs: 140,
    tokPerSec: 24.5,
    memory: '5.2 GB RAM',
    device: 'Multi-Core CPU / Metal',
  },
  {
    id: 'rtx-gpu',
    label: '32 GB + RTX 4070',
    model: 'llama3.1:8b',
    embedMs: 8.2,
    faissMs: '< 1.0 ms',
    ttftMs: 140,
    tokPerSec: 72.0,
    memory: '6.1 GB VRAM',
    device: 'Local CUDA GPU',
  },
];

export const BenchmarksSection: React.FC = () => {
  const [presetId, setPresetId] = useState(HARDWARE_PRESETS[2].id);
  const [simStep, setSimStep] = useState<number>(3);
  const [running, setRunning] = useState(false);

  const preset = HARDWARE_PRESETS.find((p) => p.id === presetId) ?? HARDWARE_PRESETS[0];

  const runSimulation = () => {
    setRunning(true);
    setSimStep(0);
  };

  useEffect(() => {
    if (!running) return;
    const t1 = setTimeout(() => setSimStep(1), 350);
    const t2 = setTimeout(() => setSimStep(2), 700);
    const t3 = setTimeout(() => {
      setSimStep(3);
      setRunning(false);
    }, 1150);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [running, presetId]);

  const stages = [
    { label: 'FastEmbed ONNX (1 chunk)', val: `${preset.embedMs} ms`, active: simStep >= 1 },
    { label: 'FAISS-CPU Search (10,000 chunks)', val: preset.faissMs, active: simStep >= 2 },
    { label: `Ollama (${preset.model})`, val: `${preset.tokPerSec} tok/s`, active: simStep >= 3 },
  ];

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

        {/* Interactive Hardware Benchmark Simulator */}
        <div className="card-hairline mb-6 rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
            <div className="flex flex-wrap gap-2">
              {HARDWARE_PRESETS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setPresetId(item.id);
                    runSimulation();
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    item.id === presetId
                      ? 'border-[#00b91e]/50 bg-[#00b91e]/15 text-[#00b91e]'
                      : 'border-white/[0.08] bg-[#0a0a0e] text-zinc-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={runSimulation}
              className="rounded-lg bg-[#00b91e] px-3.5 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-[#14cf32]"
            >
              {running ? 'Running…' : 'Simulate Benchmark'}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            {stages.map((s) => (
              <div
                key={s.label}
                className={`rounded-xl border p-4 transition-colors duration-300 ${
                  s.active ? 'border-[#00b91e]/35 bg-[#0a130c]' : 'border-white/[0.07] bg-[#0a0a0e]'
                }`}
              >
                <div className="text-xs text-zinc-400">{s.label}</div>
                <motion.div
                  key={`${presetId}-${s.val}-${simStep}`}
                  initial={{ opacity: 0.4, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 font-mono text-2xl font-semibold text-white"
                >
                  {s.active ? s.val : '—'}
                </motion.div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-zinc-400">
            <span>
              Profile: <strong className="text-white">{preset.device}</strong> · TTFT:{' '}
              <strong className="text-white">{preset.ttftMs} ms</strong>
            </span>
            <span>
              Footprint: <strong className="text-[#00b91e]">{preset.memory}</strong> + ~60 MB FastEmbed
            </span>
          </div>
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
