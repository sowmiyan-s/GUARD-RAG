import React from 'react';
import { REPO_META } from '../data/guardragData';

export const Footer: React.FC<{ onOpenDocs?: (sectionId?: string) => void }> = ({ onOpenDocs }) => {
  return (
    <footer className="border-t border-white/[0.08] bg-[#070709] py-14">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5">
              <img
                src="./assets/duck-mark.png"
                alt="GuardRAG"
                className="h-7 w-7 rounded-md object-contain"
              />
              <span className="text-[15px] font-semibold tracking-[-0.02em] text-white">
                Guard<span className="text-[#00b91e]">RAG</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-xs leading-relaxed text-zinc-400">
              100% offline, air-gapped document Q&amp;A secured by 4-tier safety guardrails, Hybrid
              BM25+Dense RRF retrieval, and local Ollama inference.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 font-mono text-[11px] text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00b91e]" />
              <span>{REPO_META.version} · MIT License</span>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs font-semibold text-white">Product</div>
            <ul className="mt-3 space-y-2 text-xs text-zinc-400">
              <li>
                <a href="#showcase" className="hover:text-white">
                  Interface
                </a>
              </li>
              <li>
                <a href="#story" className="hover:text-white">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#guardrails" className="hover:text-white">
                  4-Tier Guardrails
                </a>
              </li>
              <li>
                <a href="#quickstart" className="hover:text-white">
                  Quickstart
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <div className="text-xs font-semibold text-white">Documentation</div>
            <ul className="mt-3 space-y-2 text-xs text-zinc-400">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenDocs?.('introduction')}
                  className="hover:text-white"
                >
                  Getting Started
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenDocs?.('cli-reference')}
                  className="hover:text-white"
                >
                  CLI Reference
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenDocs?.('python-sdk')}
                  className="hover:text-white"
                >
                  Python SDK
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenDocs?.('rest-api')}
                  className="hover:text-white"
                >
                  REST API
                </button>
              </li>
              <li>
                <a href={REPO_META.securityUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  Security Policy
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs font-semibold text-white">Community</div>
            <ul className="mt-3 space-y-2 text-xs text-zinc-400">
              <li>
                <a href={REPO_META.githubUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  GitHub Repository
                </a>
              </li>
              <li>
                <a href={REPO_META.pypiUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  PyPI Package
                </a>
              </li>
              <li>
                <a href={`${REPO_META.githubUrl}/issues`} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  Issue Tracker
                </a>
              </li>
              <li>
                <a href={REPO_META.authorUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  Maintainer: {REPO_META.author}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-[11px] text-zinc-500 sm:flex-row">
          <div>
            © {new Date().getFullYear()} GuardRAG ·{' '}
            <a href={REPO_META.authorUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-white">
              {REPO_META.author}
            </a>
          </div>
          <div className="font-mono">guard-rag · 100% Local Execution</div>
        </div>
      </div>
    </footer>
  );
};
