/* ═══════════════════════════════════════════════════════════════════════════
   GuardRAG — UI & Component Controller (ui.js)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

window.GuardUI = (() => {
  // ─── Toast Notification System ──────────────────────────────────────────
  function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 100000;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const colors = {
      info: 'rgba(30, 41, 59, 0.95)',
      success: 'rgba(16, 185, 129, 0.95)',
      warning: 'rgba(245, 158, 11, 0.95)',
      danger: 'rgba(239, 68, 68, 0.95)',
    };

    toast.style.cssText = `
      background: ${colors[type] || colors.info};
      color: #fff;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-family: inherit;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(6px);
      pointer-events: auto;
      transition: opacity 0.25s ease, transform 0.25s ease;
      opacity: 0;
      transform: translateY(8px);
      max-width: 340px;
      word-break: break-word;
    `;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  // ─── Custom Modal Confirm Dialog ─────────────────────────────────────────
  function confirmModal(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
      const modal = document.getElementById('customConfirmModal');
      const titleEl = document.getElementById('confirmModalTitle');
      const descEl = document.getElementById('confirmModalDesc');
      const btnOk = document.getElementById('confirmModalOk');
      const btnCancel = document.getElementById('confirmModalCancel');

      if (!modal) {
        resolve(window.confirm(message));
        return;
      }

      if (titleEl) titleEl.textContent = title;
      if (descEl) descEl.textContent = message;
      if (btnOk) btnOk.textContent = confirmText;
      if (btnCancel) btnCancel.textContent = cancelText;

      modal.style.display = 'flex';

      function cleanup(result) {
        modal.style.display = 'none';
        if (btnOk) btnOk.removeEventListener('click', onOk);
        if (btnCancel) btnCancel.removeEventListener('click', onCancel);
        resolve(result);
      }

      function onOk() { cleanup(true); }
      function onCancel() { cleanup(false); }

      if (btnOk) btnOk.addEventListener('click', onOk);
      if (btnCancel) btnCancel.addEventListener('click', onCancel);
    });
  }

  // ─── Custom Modal Prompt Dialog ──────────────────────────────────────────
  function promptModal(title, message, defaultValue = '', placeholder = '') {
    return new Promise((resolve) => {
      const modal = document.getElementById('customPromptModal');
      const titleEl = document.getElementById('promptModalTitle');
      const descEl = document.getElementById('promptModalDesc');
      const inputEl = document.getElementById('promptModalInput');
      const btnOk = document.getElementById('promptModalOk');
      const btnCancel = document.getElementById('promptModalCancel');

      if (!modal || !inputEl) {
        resolve(window.prompt(message, defaultValue));
        return;
      }

      if (titleEl) titleEl.textContent = title;
      if (descEl) descEl.textContent = message;
      inputEl.value = defaultValue;
      inputEl.placeholder = placeholder;

      modal.style.display = 'flex';
      setTimeout(() => inputEl.focus(), 50);

      function cleanup(result) {
        modal.style.display = 'none';
        if (btnOk) btnOk.removeEventListener('click', onOk);
        if (btnCancel) btnCancel.removeEventListener('click', onCancel);
        resolve(result);
      }

      function onOk() { cleanup(inputEl.value.trim()); }
      function onCancel() { cleanup(null); }

      if (btnOk) btnOk.addEventListener('click', onOk);
      if (btnCancel) btnCancel.addEventListener('click', onCancel);
    });
  }

  // ─── Copy to Clipboard with Feedback ─────────────────────────────────────
  async function copyToClipboard(text, successMessage = 'Copied to clipboard!') {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      showToast(successMessage, 'success');
      return true;
    } catch (err) {
      showToast('Failed to copy to clipboard', 'danger');
      return false;
    }
  }

  // ─── Sidebar Drawer & Collapsible Controller ────────────────────────────
  function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    const sidebarOpen = document.getElementById('sidebarOpen');
    const sidebarClose = document.getElementById('sidebarClose');
    const collapseBtn = document.getElementById('sidebarCollapseBtn');
    const expandBtn = document.getElementById('sidebarExpandBtn');

    if (sidebarOpen && sidebar) {
      sidebarOpen.addEventListener('click', () => {
        sidebar.classList.add('mobile-open');
        if (sidebarBackdrop) sidebarBackdrop.classList.add('visible');
      });
    }

    if (sidebarClose && sidebar) {
      sidebarClose.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        if (sidebarBackdrop) sidebarBackdrop.classList.remove('visible');
      });
    }

    if (sidebarBackdrop && sidebar) {
      sidebarBackdrop.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        sidebarBackdrop.classList.remove('visible');
      });
    }

    if (collapseBtn && sidebar) {
      collapseBtn.addEventListener('click', () => {
        sidebar.classList.add('collapsed');
        localStorage.setItem('sidebar_collapsed', '1');
      });
    }

    if (expandBtn && sidebar) {
      expandBtn.addEventListener('click', () => {
        sidebar.classList.remove('collapsed');
        localStorage.removeItem('sidebar_collapsed');
      });
    }

    // Restore desktop preference
    if (localStorage.getItem('sidebar_collapsed') === '1' && sidebar) {
      sidebar.classList.add('collapsed');
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────
  return {
    toast: showToast,
    confirm: confirmModal,
    prompt: promptModal,
    copy: copyToClipboard,
    setupSidebar,
  };
})();
