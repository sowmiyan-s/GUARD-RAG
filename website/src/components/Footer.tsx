import React from 'react';
import { REPO_META } from '../data/guardragData';

export const Footer: React.FC<{ onOpenDocs?: (sectionId?: string) => void }> = ({ onOpenDocs }) => {
  return (
    <footer className="border-t border-white/[0.08] bg-[#060709] py-14">
      <div className="mx-auto w-full max-w-[1840px] px-6 sm:px-12 lg:px-16 2xl:px-20">
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
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-300">
              100% offline, private document intelligence with automatic confidentiality protection,
              verifiable citations, and hands-free spoken audio summaries.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-[#00b91e]" />
              <span>Private Document Intelligence · MIT Open Source</span>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="text-sm font-bold text-white">Navigation</div>
            <ul className="mt-3.5 space-y-2.5 text-sm text-zinc-300">
              <li>
                <a href="#showcase" className="hover:text-white">
                  Overview
                </a>
              </li>
              <li>
                <a href="#story" className="hover:text-white">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#guardrails" className="hover:text-white">
                  Privacy Shield
                </a>
              </li>
              <li>
                <a href="#comparison" className="hover:text-white">
                  Comparison
                </a>
              </li>
              <li>
                <a href="#quickstart" className="hover:text-white">
                  Get Started
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <div className="text-sm font-bold text-white">Documentation</div>
            <ul className="mt-3.5 space-y-2.5 text-sm text-zinc-300">
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
                  onClick={() => onOpenDocs?.('docker-tests')}
                  className="hover:text-white"
                >
                  Docker &amp; Testing
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
                <a href={REPO_META.portfolioUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  Portfolio: sowmiyan.me
                </a>
              </li>
              <li>
                <a href={REPO_META.authorUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  GitHub: {REPO_META.author}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-[11px] text-zinc-500 sm:flex-row">
          <div>
            © {new Date().getFullYear()} GuardRAG · Built by{' '}
            <a href={REPO_META.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-[#00b91e]">
              {REPO_META.author} (sowmiyan.me)
            </a>
          </div>
          <div className="font-mono">guard-rag · 100% Local Execution</div>
        </div>
      </div>
    </footer>
  );
};
