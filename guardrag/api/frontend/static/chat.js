/* ═══════════════════════════════════════════════════════════════════════════
   GuardRAG — Chat & Offline Audio Overview Controller (chat.js)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

window.GuardChat = (() => {

  // ─── HTML & Markdown Formatting Utilities ────────────────────────────────
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');
  }

  function renderMarkdown(rawText) {
    if (!rawText) return '';
    if (typeof marked !== 'undefined' && marked.parse) {
      try {
        return marked.parse(rawText);
      } catch (err) {
        console.warn('marked.parse failed, falling back to escapeHtml:', err);
      }
    }
    return escapeHtml(rawText);
  }

  // ─── Code Copy Enhancement for Rendered Markdown ─────────────────────────
  function attachCodeBlockCopyButtons(containerElement) {
    if (!containerElement) return;
    const preBlocks = containerElement.querySelectorAll('pre');
    preBlocks.forEach((pre) => {
      if (pre.querySelector('.code-copy-btn')) return; // already added

      pre.style.position = 'relative';
      const copyBtn = document.createElement('button');
      copyBtn.className = 'code-copy-btn';
      copyBtn.setAttribute('aria-label', 'Copy code snippet');
      copyBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Copy</span>
      `;
      copyBtn.style.cssText = `
        position: absolute;
        top: 6px;
        right: 6px;
        background: rgba(30, 41, 59, 0.85);
        color: #94a3b8;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        padding: 2px 7px;
        font-size: 0.68rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.15s ease;
      `;

      copyBtn.addEventListener('click', async () => {
        const codeText = pre.querySelector('code')?.innerText || pre.innerText;
        if (window.GuardUI && window.GuardUI.copy) {
          await window.GuardUI.copy(codeText, 'Code copied to clipboard');
        } else {
          navigator.clipboard?.writeText(codeText);
        }
        copyBtn.querySelector('span').textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.querySelector('span').textContent = 'Copy';
        }, 2000);
      });

      pre.appendChild(copyBtn);
    });
  }

  // ─── NotebookLM-Style Offline Audio Overview (Web Speech API) ─────────────
  const AudioOverview = (() => {
    let synth = window.speechSynthesis;
    let isSpeaking = false;
    let isPaused = false;
    let utteranceQueue = [];
    let stateCallbacks = [];

    function notifyState(status) {
      stateCallbacks.forEach((cb) => {
        try { cb(status); } catch (e) { console.error(e); }
      });
    }

    function isSupported() {
      return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    }

    // Split text into natural sentence-sized chunks for smooth browser TTS streaming
    function splitSentences(text) {
      if (!text) return [];
      // Clean markdown symbols to avoid reading syntax symbols aloud
      const cleaned = text
        .replace(/```[\s\S]*?```/g, ' [code snippet omitted] ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[*_#>[\]()]/g, '')
        .replace(/https?:\/\/\S+/g, 'link');

      const matches = cleaned.match(/[^.!?\n]+[.!?\n]+/g);
      if (!matches) return [cleaned.trim()].filter(Boolean);
      return matches.map(s => s.trim()).filter(s => s.length > 0);
    }

    function stop() {
      if (!isSupported()) return;
      synth.cancel();
      utteranceQueue = [];
      isSpeaking = false;
      isPaused = false;
      notifyState({ isSpeaking: false, isPaused: false });
    }

    function pause() {
      if (!isSupported()) return;
      if (isSpeaking && !isPaused) {
        synth.pause();
        isPaused = true;
        notifyState({ isSpeaking: true, isPaused: true });
      }
    }

    function resume() {
      if (!isSupported()) return;
      if (isSpeaking && isPaused) {
        synth.resume();
        isPaused = false;
        notifyState({ isSpeaking: true, isPaused: false });
      }
    }

    function speak(text, options = {}) {
      if (!isSupported()) {
        if (window.GuardUI) {
          window.GuardUI.toast('Speech synthesis is not supported on this browser.', 'warning');
        }
        return;
      }

      stop();

      const chunks = splitSentences(text);
      if (chunks.length === 0) return;

      isSpeaking = true;
      isPaused = false;
      notifyState({ isSpeaking: true, isPaused: false });

      const voices = synth.getVoices ? synth.getVoices() : [];
      // Prefer modern natural English voice if available
      const voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google')))
        || voices.find(v => v.lang.startsWith('en'))
        || null;

      let currentIndex = 0;

      function speakNextChunk() {
        if (currentIndex >= chunks.length) {
          isSpeaking = false;
          isPaused = false;
          notifyState({ isSpeaking: false, isPaused: false });
          return;
        }

        const chunkText = chunks[currentIndex];
        const utterance = new SpeechSynthesisUtterance(chunkText);
        if (voice) utterance.voice = voice;
        utterance.rate = options.rate || 1.05;
        utterance.pitch = options.pitch || 1.0;

        utterance.onend = () => {
          currentIndex++;
          speakNextChunk();
        };

        utterance.onerror = (e) => {
          console.warn('SpeechSynthesisUtterance error:', e);
          currentIndex++;
          speakNextChunk();
        };

        synth.speak(utterance);
      }

      speakNextChunk();
    }

    function onStateChange(callback) {
      if (typeof callback === 'function') {
        stateCallbacks.push(callback);
      }
    }

    return {
      isSupported,
      speak,
      pause,
      resume,
      stop,
      onStateChange,
      getState: () => ({ isSpeaking, isPaused })
    };
  })();

  // ─── Public API ──────────────────────────────────────────────────────────
  return {
    escapeHtml,
    renderMarkdown,
    attachCodeBlockCopyButtons,
    AudioOverview,
  };
})();
