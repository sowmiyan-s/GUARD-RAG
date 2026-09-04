/* ═══════════════════════════════════════════════════════════════════════════
   GUARDRAILS LOCAL RAG BOT — Frontend Logic
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const API_BASE = window.location.origin;

// ─── Default Ollama endpoint ──────────────────────────────────────────────────
const DEFAULT_OLLAMA_ENDPOINT = 'http://localhost:11434';

// ─── App state ────────────────────────────────────────────────────────────────
const state = {
  sessionId: null,
  ollamaRunning: false,
  models: [],
  selectedFiles: [],
  isProcessing: false,
  isChatting: false,
  uploadOpen: true,
  currentDbId: null,
  activeDocName: '',
  serverConfig: null,
  currentProfile: 'legal',
  rawPreviewText: '',
  redactedPreviewText: '',
  isSharedSession: false,
  sharedSystemPrompt: '',
  sharedCustomRules: [],
  activeTab: 'new-chat',
};

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const $ = id => {
  const el = document.getElementById(id);
  if (el) return el;
  const noop = () => {};
  const mockObj = {
    style: {},
    classList: {
      add: noop,
      remove: noop,
      toggle: noop,
      contains: () => false
    },
    value: '',
    checked: false,
    scrollHeight: 0,
    textContent: '',
    innerHTML: '',
    setAttribute: noop,
    getAttribute: () => null,
    addEventListener: noop,
    removeEventListener: noop,
    focus: noop,
    blur: noop,
    click: noop,
    cloneNode: () => mockObj,
    appendChild: () => mockObj,
    removeChild: () => mockObj,
    insertBefore: () => mockObj,
    replaceChild: () => mockObj,
    querySelector: () => null,
    querySelectorAll: () => []
  };
  return mockObj;
};

const sidebar = $('sidebar');
const sidebarBackdrop = $('sidebarBackdrop');
const sidebarOpen = $('sidebarOpen');
const sidebarClose = $('sidebarClose');
const sidebarCollapseBtn = $('sidebarCollapseBtn');
const sidebarExpandBtn = $('sidebarExpandBtn');
const sidebarBody = $('sidebarBody');
const sidebarRail = $('sidebarRail');
const railStatusDot = $('railStatusDot');
const railClearBtn = $('railClearBtn');

const ollamaEndpointInput = $('ollamaEndpoint');
const btnStartOllama = $('btnStartOllama');
const railStartOllama = $('railStartOllama');
const startOllamaHint = $('startOllamaHint');
const modelSelect = $('modelSelect');
const connectionBadge = $('connectionBadge');

const activeDocBanner = $('activeDocBanner');
const activeDocName = $('activeDocName');

const guardrailsToggle = $('guardrailsToggle');
const sensitivitySelect = $('sensitivitySelect');
const sensitivityBadge = $('sensitivityBadge');
const sensitivityBadgeLabel = $('sensitivityBadgeLabel');
const sensitivityDesc = $('sensitivityDesc');
const sensitivityHint = $('sensitivityHint');
const guardrailsIndicator = $('guardrailsIndicator');

const chunkSize = $('chunkSize');
const chunkOverlap = $('chunkOverlap');

const storagePool = $('storagePool');
const storageEmpty = $('storageEmpty');
const btnRefreshStorage = $('btnRefreshStorage');

const uploadPanelToggle = $('uploadPanelToggle');
const uploadSection = $('uploadSection');
const uploadToggleIcon = $('uploadToggleIcon');
const uploadFileCount = $('uploadFileCount');
const uploadSectionBody = $('uploadSectionBody');
const dropZone = $('dropZone');
const dropClick = $('dropClick');
const fileInput = $('fileInput');
const fileList = $('fileList');
const btnProcess = $('btnProcess');
const btnReset = $('btnReset');
const uploadStatus = $('uploadStatus');

const step1Card = $('step1Card');
const step2Card = $('step2Card');
const step3Card = $('step3Card');

const profileOptionsContainer = $('profileOptionsContainer');
const btnSaveCustomProfile = $('btnSaveCustomProfile');
const confirmModal = $('confirmModal');
const promptModal = $('promptModal');

const shieldIconWrapper = $('shieldIconWrapper');
const shieldStatusText = $('shieldStatusText');
const shieldSubstatusText = $('shieldSubstatusText');

const lightRed = $('lightRed');
const lightOrange = $('lightOrange');
const lightGreen = $('lightGreen');

const advancedToggle = $('advancedToggle');
const advancedSettingsContainer = $('advancedSettingsContainer');

const magicPromptsWrapper = $('magicPromptsWrapper');
const magicPrompts = $('magicPrompts');

const emptyState = $('emptyState');
const chatMessages = $('chatMessages');
const chatSection = $('chatSection');
const readyBanner = $('readyBanner');
const inputBarWrapper = $('inputBarWrapper');
const typingIndicator = $('typingIndicator');
const chatInput = $('chatInput');
const btnSend = $('btnSend');
const btnClear = $('btnClear');
const toastContainer = $('toastContainer');

const tunnelModal = $('tunnelModal');
const tunnelModalClose = $('tunnelModalClose');

const ollamaStartModal = $('ollamaStartModal');
const ollamaStartModalClose = $('ollamaStartModalClose');
const ollamaStartRetry = $('ollamaStartRetry');

// ─── Ollama endpoint (stored in localStorage) ─────────────────────────────────
function getOllamaEndpoint() {
  return (ollamaEndpointInput.value || '').trim() || DEFAULT_OLLAMA_ENDPOINT;
}

/**
 * Fetch server-side config (/api/config).
 * - If the user has never saved a custom endpoint, we use the server's OLLAMA_HOST.
 * - If the user previously saved a custom endpoint in localStorage, we keep it.
 */
async function fetchConfig() {
  try {
    const cfg = await apiFetch('/api/config');
    state.serverConfig = cfg;

    const saved = localStorage.getItem('ragbot_ollama_endpoint');
    if (!saved && cfg.server_ollama_host) {
      ollamaEndpointInput.value = cfg.server_ollama_host;
    } else {
      loadSavedEndpoint();
    }
    await refreshHealth();
  } catch {
    loadSavedEndpoint();
    await refreshHealth();
  }
}

function loadSavedEndpoint() {
  const saved = localStorage.getItem('ragbot_ollama_endpoint');
  if (saved) ollamaEndpointInput.value = saved;
  else ollamaEndpointInput.value = DEFAULT_OLLAMA_ENDPOINT;
}

ollamaEndpointInput.addEventListener('change', () => {
  const val = ollamaEndpointInput.value.trim();
  localStorage.setItem('ragbot_ollama_endpoint', val || DEFAULT_OLLAMA_ENDPOINT);
  refreshHealth();
});
ollamaEndpointInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    ollamaEndpointInput.blur();
  }
});
ollamaEndpointInput.addEventListener('blur', () => {
  const val = ollamaEndpointInput.value.trim();
  localStorage.setItem('ragbot_ollama_endpoint', val || DEFAULT_OLLAMA_ENDPOINT);
  refreshHealth();
});

// ─── Utility ──────────────────────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const headers = opts.headers ? { ...opts.headers } : {};
  const storedKey = localStorage.getItem('guardrag_api_key');
  if (storedKey && !headers['Authorization'] && !headers['x-api-key']) {
    headers['Authorization'] = `Bearer ${storedKey}`;
  }
  opts.headers = headers;
  const res = await fetch(API_BASE + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

function toast(msg, type = 'info', duration = 3400) {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  toastContainer.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toastOut 0.22s ease forwards';
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, duration);
}

// ─── Custom Confirm & Prompt Modals ───────────────────────────────────────────
function showCustomConfirm(title, message, isDanger = false) {
  return new Promise((resolve) => {
    const modal = $('confirmModal');
    const titleEl = $('confirmModalTitle');
    const msgEl = $('confirmModalMessage');
    const proceedBtn = $('btnConfirmProceed');
    const cancelBtn = $('btnConfirmCancel');
    const closeBtn = $('confirmModalClose');

    titleEl.textContent = title;
    msgEl.textContent = message;

    if (isDanger) {
      proceedBtn.style.backgroundColor = 'var(--danger)';
      proceedBtn.style.borderColor = 'var(--danger)';
      proceedBtn.style.color = '#fff';
    } else {
      proceedBtn.style.backgroundColor = 'var(--accent)';
      proceedBtn.style.borderColor = 'var(--accent)';
      proceedBtn.style.color = '#000';
    }

    modal.style.display = 'flex';

    function cleanUp(result) {
      modal.style.display = 'none';
      proceedBtn.removeEventListener('click', onProceed);
      cancelBtn.removeEventListener('click', onCancel);
      closeBtn.removeEventListener('click', onCancel);
      resolve(result);
    }

    function onProceed() { cleanUp(true); }
    function onCancel() { cleanUp(false); }

    proceedBtn.addEventListener('click', onProceed);
    cancelBtn.addEventListener('click', onCancel);
    closeBtn.addEventListener('click', onCancel);
  });
}

function showCustomPrompt(title, label, placeholder = '') {
  return new Promise((resolve) => {
    const modal = $('promptModal');
    const titleEl = $('promptModalTitle');
    const labelEl = $('promptModalLabel');
    const inputEl = $('promptModalInput');
    const submitBtn = $('btnPromptSubmit');
    const cancelBtn = $('btnPromptCancel');
    const closeBtn = $('promptModalClose');

    titleEl.textContent = title;
    labelEl.textContent = label;
    inputEl.placeholder = placeholder;
    inputEl.value = '';
    modal.style.display = 'flex';
    setTimeout(() => inputEl.focus(), 50);

    function cleanUp(val) {
      modal.style.display = 'none';
      submitBtn.removeEventListener('click', onSubmit);
      cancelBtn.removeEventListener('click', onCancel);
      closeBtn.removeEventListener('click', onCancel);
      inputEl.removeEventListener('keydown', onKeyDown);
      resolve(val);
    }

    function onSubmit() {
      cleanUp(inputEl.value.trim());
    }
    function onCancel() {
      cleanUp(null);
    }
    function onKeyDown(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSubmit();
      }
    }

    submitBtn.addEventListener('click', onSubmit);
    cancelBtn.addEventListener('click', onCancel);
    closeBtn.addEventListener('click', onCancel);
    inputEl.addEventListener('keydown', onKeyDown);
  });
}

// ─── Tunnel modal ─────────────────────────────────────────────────────────────
tunnelModalClose.addEventListener('click', () => { tunnelModal.style.display = 'none'; });
tunnelModal.addEventListener('click', e => { if (e.target === tunnelModal) tunnelModal.style.display = 'none'; });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (tunnelModal && tunnelModal.style.display !== 'none') tunnelModal.style.display = 'none';
    if (ollamaStartModal && ollamaStartModal.style.display !== 'none') {
      ollamaStartModal.style.display = 'none';
      if (_ollamaPoller) { clearInterval(_ollamaPoller); _ollamaPoller = null; }
    }
    if (confirmModal && confirmModal.style.display !== 'none') $('btnConfirmCancel').click();
    if (promptModal && promptModal.style.display !== 'none') $('btnPromptCancel').click();
    if ($('customProfileModal') && $('customProfileModal').style.display !== 'none') $('btnCustomProfileCancel').click();
    if ($('shareModal') && $('shareModal').style.display !== 'none') closeShareModal();
    if ($('guestSettingsModal') && $('guestSettingsModal').style.display !== 'none') closeGuestSettings();
    if ($('clientChatInspectModal') && $('clientChatInspectModal').style.display !== 'none') $('clientChatInspectModal').style.display = 'none';
    if ($('citationsInspectorPanel') && $('citationsInspectorPanel').style.display !== 'none') $('citationsInspectorPanel').style.display = 'none';
    if ($('settingsCenterModal') && $('settingsCenterModal').style.display !== 'none') $('settingsCenterModal').style.display = 'none';
  }
});

// Close modals when clicking on their overlay backdrop
['tunnelModal', 'ollamaStartModal', 'shareModal', 'guestSettingsModal', 'clientChatInspectModal', 'settingsCenterModal'].forEach(id => {
  const m = $(id);
  if (m) {
    m.addEventListener('click', e => {
      if (e.target === m) {
        m.style.display = 'none';
        if (id === 'ollamaStartModal' && _ollamaPoller) { clearInterval(_ollamaPoller); _ollamaPoller = null; }
      }
    });
  }
});

if (confirmModal) {
  confirmModal.addEventListener('click', e => {
    if (e.target === confirmModal) $('btnConfirmCancel').click();
  });
}
if (promptModal) {
  promptModal.addEventListener('click', e => {
    if (e.target === promptModal) $('btnPromptCancel').click();
  });
}
const cpModal = $('customProfileModal');
if (cpModal) {
  cpModal.addEventListener('click', e => {
    if (e.target === cpModal) $('btnCustomProfileCancel').click();
  });
}

// ─── Start Ollama modal ───────────────────────────────────────────────────────
if (ollamaStartModalClose) {
  ollamaStartModalClose.addEventListener('click', () => {
    ollamaStartModal.style.display = 'none';
    if (_ollamaPoller) { clearInterval(_ollamaPoller); _ollamaPoller = null; }
  });
}
if (ollamaStartModal) {
  ollamaStartModal.addEventListener('click', e => {
    if (e.target === ollamaStartModal) {
      ollamaStartModal.style.display = 'none';
      if (_ollamaPoller) { clearInterval(_ollamaPoller); _ollamaPoller = null; }
    }
  });
}
if (ollamaStartRetry) {
  ollamaStartRetry.addEventListener('click', async () => {
    ollamaStartRetry.disabled = true;
    ollamaStartRetry.innerHTML = '<span class="btn-spinner"></span> Checking…';
    const { running } = await checkOllamaDirectly(getOllamaEndpoint());
    if (running) {
      if (_ollamaPoller) { clearInterval(_ollamaPoller); _ollamaPoller = null; }
      ollamaStartModal.style.display = 'none';
      await refreshHealth();
      toast('Ollama is now running!', 'success');
    } else {
      toast('Ollama not detected yet — make sure you ran the command above.', 'warn', 4000);
      ollamaStartRetry.disabled = false;
      ollamaStartRetry.innerHTML = 'Check Again';
    }
  });
}

// ─── SIDEBAR — Mobile drawer ───────────────────────────────────────────────────
function openMobileSidebar() {
  sidebar.classList.add('open');
  sidebarBackdrop.classList.add('visible');
  sidebarOpen.setAttribute('aria-expanded', 'true');
  setTimeout(() => sidebarClose.focus(), 50);
}
function closeMobileSidebar() {
  sidebar.classList.remove('open');
  sidebarBackdrop.classList.remove('visible');
  sidebarOpen.setAttribute('aria-expanded', 'false');
}

sidebarOpen.addEventListener('click', openMobileSidebar);
sidebarClose.addEventListener('click', closeMobileSidebar);
sidebarBackdrop.addEventListener('click', closeMobileSidebar);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && sidebar.classList.contains('open')) closeMobileSidebar();
});

// ─── SIDEBAR — Desktop collapse / expand ──────────────────────────────────────
function collapseSidebar() {
  state.sidebarCollapsed = true;
  sidebar.classList.add('collapsed');
  sidebarExpandBtn.style.display = 'flex';
  sidebarCollapseBtn.setAttribute('aria-label', 'Expand sidebar');
  syncRailStatus();
}

function expandSidebar() {
  state.sidebarCollapsed = false;
  sidebar.classList.remove('collapsed');
  sidebarExpandBtn.style.display = 'none';
  sidebarCollapseBtn.setAttribute('aria-label', 'Collapse sidebar');
}

if (sidebarCollapseBtn) sidebarCollapseBtn.addEventListener('click', collapseSidebar);
if (sidebarExpandBtn) sidebarExpandBtn.addEventListener('click', expandSidebar);

if (railStartOllama) {
  railStartOllama.addEventListener('click', () => btnStartOllama.click());
}

if (railClearBtn) { railClearBtn.addEventListener('click', clearConversation); }

function syncRailStatus() {
  if (!railStatusDot) return;
  railStatusDot.className = 'status-dot';
  if (state.ollamaRunning) {
    railStatusDot.style.background = 'var(--accent)';
    railStatusDot.style.boxShadow = '0 0 5px var(--accent)';
  } else {
    railStatusDot.style.background = 'var(--danger)';
    railStatusDot.style.boxShadow = '0 0 5px var(--danger)';
  }
}

// ─── UPLOAD PANEL — Toggle collapse ───────────────────────────────────────────
function setUploadPanelOpen(open) {
  state.uploadOpen = open;
  if (uploadSection) {
    if (open) {
      uploadSection.classList.remove('collapsed');
    } else {
      uploadSection.classList.add('collapsed');
    }
  }
  if (uploadPanelToggle) {
    if (open) {
      uploadPanelToggle.classList.remove('collapsed');
      uploadPanelToggle.setAttribute('aria-expanded', 'true');
    } else {
      uploadPanelToggle.classList.add('collapsed');
      uploadPanelToggle.setAttribute('aria-expanded', 'false');
    }
  }
}

if (uploadPanelToggle) {
  uploadPanelToggle.addEventListener('click', () => setUploadPanelOpen(!state.uploadOpen));
}

function autoCollapseUpload() {
  if (state.uploadOpen) setUploadPanelOpen(false);
}

// ─── OLLAMA HEALTH — checked directly from the browser (client → localhost) ────
// The browser pings Ollama directly. This works even when the app is hosted
// on Railway because Ollama allows cross-origin requests from any page.
// The backend is NOT used as a proxy here — that way the status always
// reflects whether Ollama is running on THIS user's machine.
async function checkOllamaDirectly(endpoint) {
  try {
    const url = endpoint.replace(/\/$/, '') + '/api/tags';
    // First try browser-direct (useful if frontend is remote and Ollama is local)
    const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const data = await res.json();
      return {
        running: true,
        models: (data.models || []).map(m => m.name),
      };
    }
  } catch (e) {
    console.warn("Direct browser check failed (expected in Brave due to local CORS shields), falling back to backend health proxy...", e);
  }
  
  // Fallback to backend proxy health check
  try {
    const data = await apiFetch(`/api/health?ollama_host=${encodeURIComponent(endpoint)}`);
    return {
      running: data.ollama_running,
      models: data.models || [],
    };
  } catch {
    return { running: false, models: [] };
  }
}

async function refreshHealth() {
  const endpoint = getOllamaEndpoint();
  const isLocal = endpoint.includes('localhost') || endpoint.includes('127.0.0.1');

  const { running, models } = await checkOllamaDirectly(endpoint);

  // Update state
  const changed = state.ollamaRunning !== running;
  state.ollamaRunning = running;
  state.models = models;

  const toggleBtn = $('btnToggleOllama');
  const statusDot = $('ollamaStatusDot');
  const topLbl = $('topbarModelLabel');
  const modalModel = $('modalModelSelect');

  if (running) {
    if (btnStartOllama) btnStartOllama.style.display = 'none';
    if (railStartOllama) railStartOllama.style.display = 'none';
    if (startOllamaHint) startOllamaHint.style.display = 'none';

    const modelGuideCard = document.querySelector('.model-guide-card');
    if (modelGuideCard) modelGuideCard.style.display = 'none';

    // Update header widget
    if (connectionBadge) {
      connectionBadge.textContent = isLocal ? 'OLLAMA: ONLINE' : 'OLLAMA: REMOTE';
      connectionBadge.style.color = 'var(--text-primary)';
    }
    if (statusDot) statusDot.style.background = 'var(--accent)';
    if (toggleBtn) {
      if (!toggleBtn.classList.contains('is-loading') || toggleBtn.dataset.action !== 'stopping') {
        toggleBtn.textContent = 'Stop';
        toggleBtn.style.color = 'var(--danger)';
        toggleBtn.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      }
    }

    // Populate ONLY existing models on this device (no mockup models!)
    const currentModel = modelSelect.value;
    modelSelect.innerHTML = '';
    if (modalModel) modalModel.innerHTML = '';

    if (!models || models.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'No models installed (ollama pull)';
      opt.disabled = true;
      opt.selected = true;
      modelSelect.appendChild(opt);
      if (modalModel) modalModel.appendChild(opt.cloneNode(true));
      if (topLbl) topLbl.textContent = 'No Models';
      state.selectedModel = '';
    } else {
      models.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        if (m === currentModel || m === state.selectedModel) opt.selected = true;
        modelSelect.appendChild(opt);
        if (modalModel) modalModel.appendChild(opt.cloneNode(true));
      });
      if (!modelSelect.value || !models.includes(modelSelect.value)) {
        modelSelect.selectedIndex = 0;
        if (modalModel) modalModel.selectedIndex = 0;
      }
      state.selectedModel = modelSelect.value;
      if (topLbl) topLbl.textContent = state.selectedModel;
    }

    if (changed) toast('Ollama connection established.', 'success');
  } else {
    if (btnStartOllama) btnStartOllama.style.display = 'flex';
    if (railStartOllama) railStartOllama.style.display = 'flex';

    if (startOllamaHint) {
      startOllamaHint.style.display = 'block';
      startOllamaHint.textContent = isLocal
        ? 'Ollama is offline. Click Start above to launch.'
        : 'Remote server unreachable. Check URL or tunnel.';
    }

    // Update header widget
    if (connectionBadge) {
      connectionBadge.textContent = 'OLLAMA: OFFLINE';
      connectionBadge.style.color = 'var(--text-muted)';
    }
    if (statusDot) statusDot.style.background = 'var(--danger)';
    if (toggleBtn) {
      if (!toggleBtn.classList.contains('is-loading') || toggleBtn.dataset.action !== 'starting') {
        toggleBtn.textContent = 'Start';
        toggleBtn.style.color = 'var(--accent)';
        toggleBtn.style.borderColor = 'var(--accent)';
      }
    }

    // Clear models to offline state — NEVER show fake mockup models
    modelSelect.innerHTML = '<option value="" disabled selected>Ollama Offline (No models)</option>';
    if (modalModel) modalModel.innerHTML = '<option value="" disabled selected>Ollama Offline (No models)</option>';
    if (topLbl) topLbl.textContent = 'Offline';
    state.selectedModel = '';
  }
  syncRailStatus();
}

// ─── START OLLAMA — shows instructions & polls until Ollama comes online ─────
// Browsers cannot spawn OS processes, so we show the command to run and
// keep retrying until Ollama responds at the user's localhost.
btnStartOllama.addEventListener('click', async () => {
  const endpoint = getOllamaEndpoint();
  const isLocal = endpoint.includes('localhost') || endpoint.includes('127.0.0.1');

  if (!isLocal) {
    tunnelModal.style.display = 'flex';
    return;
  }

  // Attempt to start via backend first
  btnStartOllama.disabled = true;
  if (railStartOllama) railStartOllama.classList.add('loading');
  btnStartOllama.innerHTML = '<span class="btn-spinner"></span> Starting…';

  try {
    toast('Telling backend to start Ollama...', 'info');
    const data = await apiFetch('/api/ollama/start', { method: 'POST' });
    if (data.started) {
      toast('Ollama starting! Waiting to connect...', 'success');
      // Wait a moment for it to actually bind the port
      setTimeout(async () => {
        await refreshHealth();
        if (state.ollamaRunning) {
          btnStartOllama.disabled = false;
          if (railStartOllama) railStartOllama.classList.remove('loading');
          btnStartOllama.innerHTML = 'LAUNCH OLLAMA';
        } else {
          // If still not running, show instructions modal
          showOllamaStartModal(endpoint);
        }
      }, 1500);
    }
  } catch (e) {
    console.warn('Backend start failed:', e);
    // If backend fails (e.g. not on the same machine), show manual instructions
    showOllamaStartModal(endpoint);
  } finally {
    // Reset button after a delay if modal didn't close
    setTimeout(() => {
      btnStartOllama.disabled = false;
      if (railStartOllama) railStartOllama.classList.remove('loading');
      btnStartOllama.innerHTML = 'LAUNCH OLLAMA';
    }, 3000);
  }
});

// ─── HEADER OLLAMA START/STOP WIDGET BUTTON ──────────────────────────────────
const headerToggleBtn = $('btnToggleOllama');
if (headerToggleBtn) {
  headerToggleBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (headerToggleBtn.disabled) return;
    headerToggleBtn.disabled = true;

    const isRunning = state.ollamaRunning;

    if (isRunning) {
      // User clicked STOP
      headerToggleBtn.classList.add('is-loading');
      headerToggleBtn.dataset.action = 'stopping';
      headerToggleBtn.innerHTML = '<span class="btn-spinner danger"></span> Stopping…';
      try {
        toast('Stopping Ollama process...', 'info');
        const data = await apiFetch('/api/ollama/stop', { method: 'POST' });
        if (data.stopped) {
          toast('Ollama stopped successfully.', 'success');
        }
      } catch (err) {
        console.warn('Failed to stop Ollama:', err);
        toast('Failed to stop Ollama process.', 'error');
      } finally {
        headerToggleBtn.classList.remove('is-loading');
        delete headerToggleBtn.dataset.action;
        await refreshHealth();
        headerToggleBtn.disabled = false;
      }
    } else {
      // User clicked START
      headerToggleBtn.classList.add('is-loading');
      headerToggleBtn.dataset.action = 'starting';
      headerToggleBtn.innerHTML = '<span class="btn-spinner"></span> Starting…';
      try {
        toast('Starting Ollama server...', 'info');
        const data = await apiFetch('/api/ollama/start', { method: 'POST' });
        if (data.started) {
          toast('Ollama starting! Checking connection...', 'success');
        }
      } catch (err) {
        console.warn('Backend start error:', err);
        toast('Starting Ollama... waiting for connection.', 'info');
      }

      // Poll up to 6 times (every 800ms) for Ollama to become healthy
      let connected = false;
      for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 800));
        await refreshHealth();
        if (state.ollamaRunning) {
          connected = true;
          toast('Ollama is now ONLINE!', 'success');
          break;
        }
      }

      if (!connected) {
        toast('Ollama did not respond in time. Ensure it is installed on host.', 'error');
      }
      headerToggleBtn.classList.remove('is-loading');
      delete headerToggleBtn.dataset.action;
      await refreshHealth();
      headerToggleBtn.disabled = false;
    }
  });
}

function showOllamaStartModal(endpoint) {
  const epLabel = document.getElementById('ollamaStartModalEndpoint');
  if (epLabel) epLabel.textContent = endpoint;
  ollamaStartModal.style.display = 'flex';
  startOllamaPoller();
}

// Poll every 2 s until Ollama comes online (called after modal is shown)
let _ollamaPoller = null;
function startOllamaPoller() {
  if (_ollamaPoller) return; // already polling
  _ollamaPoller = setInterval(async () => {
    const endpoint = getOllamaEndpoint();
    const { running } = await checkOllamaDirectly(endpoint);
    if (running) {
      clearInterval(_ollamaPoller); _ollamaPoller = null;
      ollamaStartModal.style.display = 'none';
      await refreshHealth();
      toast('Ollama is now running!', 'success');
    }
  }, 2000);
}

// ─── SENSITIVITY / GUARDRAILS ─────────────────────────────────────────────────
const SENSITIVITY_META = {
  Public: { badge: 'badge-public', hint: 'No extra filters — jailbreak protection only.' },
  Internal: { badge: 'badge-internal', hint: 'Internal — API keys &amp; credentials protected.' },
  Confidential: { badge: 'badge-confidential', hint: 'Confidential — PII (SSN, email, phone) protected.' },
  Restricted: { badge: 'badge-restricted', hint: 'Restricted — Medical, financial, HIPAA/GDPR protected.' },
};
const SENSITIVITY_DESC = {
  Public: 'No data classification restrictions. Basic jailbreak protection only.',
  Internal: 'Suitable for internal business data. Blocks credential and API key exposure.',
  Confidential: 'For confidential data. Adds PII protection (emails, phone, SSNs).',
  Restricted: 'Maximum protection for HIPAA/GDPR/financial data.',
};

function updateSensitivityUI() {
  const level = sensitivitySelect.value;
  const topSens = $('topbarSensitivitySelect');
  if (topSens && topSens.value !== level) topSens.value = level;
  const modalSens = $('modalSensitivitySelect');
  if (modalSens && modalSens.value !== level) modalSens.value = level;

  // Sync custom topbar and doc studio labels
  const labelMap = {
    'Public': 'Public (Low)',
    'Internal': 'Internal (Med)',
    'Confidential': 'Confidential (High)',
    'Restricted': 'Restricted (Strict)'
  };
  const dispLabel = labelMap[level] || `${level}`;
  const topLbl = $('topbarSensitivityLabel');
  if (topLbl) topLbl.textContent = dispLabel;
  const docLbl = $('docStudioSecurityLabel');
  if (docLbl) docLbl.textContent = dispLabel;

  // Sync active card in #securityControlModal
  document.querySelectorAll('.sec-level-card').forEach(card => {
    card.classList.toggle('active', card.dataset.level === level);
  });

  const meta = SENSITIVITY_META[level] || SENSITIVITY_META['Internal'];
  if (sensitivityBadge) sensitivityBadge.className = `sensitivity-badge ${meta.badge}`;
  if (sensitivityBadgeLabel) sensitivityBadgeLabel.textContent = level.toUpperCase();
  if (sensitivityDesc) sensitivityDesc.textContent = SENSITIVITY_DESC[level] || '';
  if (sensitivityHint) sensitivityHint.innerHTML = guardrailsToggle.checked ? meta.hint : 'Guardrails disabled.';
  
  // Sync stoplight safety status
  updateTrafficLightDashboard();
}

function updateTrafficLightDashboard(overrideSensitivity) {
  const sensitivity = overrideSensitivity || (sensitivitySelect ? sensitivitySelect.value : 'Internal');
  const isEnabled = guardrailsToggle ? guardrailsToggle.checked : true;
  
  // Reset all lights and shield classes
  if (lightRed) lightRed.classList.remove('active');
  if (lightOrange) lightOrange.classList.remove('active');
  if (lightGreen) lightGreen.classList.remove('active');
  if (shieldIconWrapper) shieldIconWrapper.className = 'shield-icon-wrapper';
  
  if (!isEnabled || sensitivity === 'Public') {
    if (lightGreen) lightGreen.classList.add('active');
    if (shieldStatusText) shieldStatusText.textContent = 'SAFE MODE ACTIVE';
    if (shieldSubstatusText) shieldSubstatusText.textContent = 'Safe for Public Data. Basic jailbreak protection only.';
  } else if (sensitivity === 'Internal') {
    if (lightOrange) lightOrange.classList.add('active');
    if (shieldIconWrapper) shieldIconWrapper.classList.add('orange-shield');
    if (shieldStatusText) shieldStatusText.textContent = 'PROTECTED MODE ACTIVE';
    if (shieldSubstatusText) shieldSubstatusText.textContent = 'API keys & credentials locked locally.';
  } else if (sensitivity === 'Confidential') {
    if (lightOrange) lightOrange.classList.add('active');
    if (shieldIconWrapper) shieldIconWrapper.classList.add('orange-shield');
    if (shieldStatusText) shieldStatusText.textContent = 'CONFIDENTIAL ACTIVE';
    if (shieldSubstatusText) shieldSubstatusText.textContent = 'Full PII & credential redaction enforced.';
  } else if (sensitivity === 'Restricted') {
    if (lightRed) lightRed.classList.add('active');
    if (shieldIconWrapper) shieldIconWrapper.classList.add('red-shield');
    if (shieldStatusText) shieldStatusText.textContent = 'STRICT LOCK ACTIVE';
    if (shieldSubstatusText) shieldSubstatusText.textContent = 'Certified lock: Medical & Financial data masked.';
  }
}

const PROFILES = {
  balanced: {
    chunkSize: 1000,
    chunkOverlap: 200,
    sensitivity: 'Internal',
    guardrails: true,
    name: 'Balanced (Default)',
    desc: 'Optimized for general reading & balanced safety.',
    goal: 'You are GuardRAG, a professional AI document assistant. Answer the user\'s question using ONLY the provided context. If the context doesn\'t contain the answer, politely state that the information is missing from the uploaded documents. Maintain a helpful, concise, and accurate tone.',
    rules: ''
  },
  strict: {
    chunkSize: 1000,
    chunkOverlap: 200,
    sensitivity: 'Restricted',
    guardrails: true,
    name: 'Strict Privacy',
    desc: 'Strict compliance: blocks PII, medical & financial references.',
    goal: 'You are GuardRAG, a highly secure AI assistant operating under strict confidentiality. Answer the user\'s question using ONLY the provided context. Do not mention any sensitive details, names, or addresses unless explicitly verified in the context. If you cannot answer using only the context, state that clearly.',
    rules: 'ssn, password, api key, credit card, medical record'
  },
  fast: {
    chunkSize: 600,
    chunkOverlap: 100,
    sensitivity: 'Public',
    guardrails: true,
    name: 'Fast Summarizer',
    desc: 'Fast summary for short documents.',
    goal: 'You are GuardRAG, a quick summarization assistant. Provide direct, bulleted, and very concise summaries or answers based strictly on the provided context.',
    rules: ''
  }
};

function loadCustomProfiles() {
  try {
    const saved = JSON.parse(localStorage.getItem('ragbot_custom_profiles') || '{}');
    Object.assign(PROFILES, saved);
  } catch (e) {
    console.error("Failed to load custom profiles:", e);
  }
}

function renderProfileButtons() {
  const container = $('profileOptionsContainer');
  if (!container) return;
  container.innerHTML = '';

  const activeProfile = state.pendingProfile !== undefined ? state.pendingProfile : state.currentProfile;

  Object.entries(PROFILES).forEach(([key, config]) => {
    const btn = document.createElement('button');
    const isActive = activeProfile === key;
    btn.className = 'profile-btn' + (isActive ? ' active' : '');
    btn.type = 'button';
    btn.dataset.profile = key;

    const sensLevel = config.sensitivity || 'Internal';
    const sensTag = `<span class="profile-sens-tag">${escapeHtml(sensLevel.toUpperCase())}</span>`;
    const activeTag = isActive ? `<span class="profile-active-tag"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> ACTIVE</span>` : '';
    const deleteBtn = key.startsWith('custom_') ? `<span class="profile-delete-btn" data-key="${key}" title="Delete profile" style="color:var(--text-muted); cursor:pointer; padding:2px 6px; line-height:1; display:flex; align-items:center; border-radius:4px; transition:all 0.15s ease;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>` : '';

    btn.innerHTML = `
      <div class="profile-btn-header">
        <div style="display:flex; align-items:center; gap:0.45rem;">
          <span class="profile-name">${escapeHtml(config.name)}</span>
          ${sensTag}
        </div>
        <div style="display:flex; align-items:center; gap:0.4rem;">
          ${activeTag}
          ${deleteBtn}
        </div>
      </div>
      <span class="profile-desc">${escapeHtml(config.desc)}</span>
    `;

    btn.addEventListener('click', (e) => {
      if (e.target.closest('.profile-delete-btn')) {
        e.stopPropagation();
        deleteCustomProfile(key);
        return;
      }
      state.pendingProfile = key;
      state.pendingSensitivity = config.sensitivity || 'Internal';
      updateModalCardsAndUI();
    });

    container.appendChild(btn);
  });
}

async function deleteCustomProfile(key) {
  const confirmed = await showCustomConfirm(
    'Delete Profile',
    `Are you sure you want to delete the custom profile "${PROFILES[key].name}"?`,
    true
  );
  if (!confirmed) return;

  delete PROFILES[key];
  
  try {
    const saved = JSON.parse(localStorage.getItem('ragbot_custom_profiles') || '{}');
    delete saved[key];
    localStorage.setItem('ragbot_custom_profiles', JSON.stringify(saved));
  } catch (e) {
    console.error(e);
  }

  if (state.pendingProfile === key) {
    state.pendingProfile = 'balanced';
    state.pendingSensitivity = PROFILES.balanced.sensitivity;
  }
  if (state.currentProfile === key) {
    state.currentProfile = 'balanced';
    localStorage.setItem('ragbot_active_profile', 'balanced');
  }
  
  updateModalCardsAndUI();
  toast('Profile deleted.', 'info');
}

function selectProfile(profileName) {
  state.currentProfile = profileName;
  
  const config = PROFILES[profileName];
  if (config) {
    if (chunkSize) chunkSize.value = config.chunkSize;
    if (chunkOverlap) chunkOverlap.value = config.chunkOverlap;
    if (sensitivitySelect) sensitivitySelect.value = config.sensitivity;
    if (guardrailsToggle) guardrailsToggle.checked = config.guardrails;
    
    updateSensitivityUI();
  }

  renderProfileButtons();
}

function syncProfileHighlight() {
  const currentChunkSize = chunkSize ? parseInt(chunkSize.value, 10) : 1000;
  const currentChunkOverlap = chunkOverlap ? parseInt(chunkOverlap.value, 10) : 200;
  const currentSensitivity = sensitivitySelect ? sensitivitySelect.value : 'Internal';
  const currentGuardrails = guardrailsToggle ? guardrailsToggle.checked : true;

  let matchedProfile = null;
  for (const [name, config] of Object.entries(PROFILES)) {
    if (
      config.chunkSize === currentChunkSize &&
      config.chunkOverlap === currentChunkOverlap &&
      config.sensitivity === currentSensitivity &&
      config.guardrails === currentGuardrails
    ) {
      matchedProfile = name;
      break;
    }
  }

  state.currentProfile = matchedProfile;
  renderProfileButtons();
}

if (sensitivitySelect) {
  sensitivitySelect.addEventListener('change', () => {
    updateSensitivityUI();
    syncProfileHighlight();
  });
}
if (guardrailsToggle) {
  guardrailsToggle.addEventListener('change', () => {
    if (sensitivitySelect) sensitivitySelect.disabled = !guardrailsToggle.checked;
    if (guardrailsIndicator) guardrailsIndicator.classList.toggle('active', guardrailsToggle.checked);
    updateSensitivityUI();
    syncProfileHighlight();
  });
}
if (chunkSize) chunkSize.addEventListener('change', syncProfileHighlight);
if (chunkOverlap) chunkOverlap.addEventListener('change', syncProfileHighlight);

// ─── SECURITY & PRIVACY CONTROL MODAL CONTROLLER ─────────────────────────────
const secModal = $('securityControlModal');
const btnSecurityMenu = $('btnSecurityMenu');
const btnDocStudioSecurity = $('btnDocStudioSecurity');
const secModalClose = $('secModalClose');
const btnSecModalCancel = $('btnSecModalCancel');
const btnSecModalSave = $('btnSecModalSave');
const btnSecModalDone = $('btnSecModalDone');

function updateModalCardsAndUI() {
  const currentSens = state.pendingSensitivity || (sensitivitySelect ? sensitivitySelect.value : 'Internal');
  
  // Highlight active level card
  document.querySelectorAll('.sec-level-card').forEach(card => {
    card.classList.toggle('active', card.dataset.level === currentSens);
  });

  // Update active policy text pill
  const pill = $('modalActivePolicyPill');
  if (pill) {
    pill.textContent = `${currentSens} Policy`;
  }

  // Update stoplight & safety shield in modal
  updateTrafficLightDashboard(currentSens);

  // Render profiles with pending highlight
  renderProfileButtons();
}

function openSecurityModal() {
  if (state.isSharedSession) {
    toast('Security and privacy policy is locked and managed exclusively by the host.', 'info');
    return;
  }
  state.pendingProfile = state.currentProfile || 'balanced';
  state.pendingSensitivity = sensitivitySelect ? sensitivitySelect.value : 'Internal';
  if (secModal) {
    secModal.style.display = 'flex';
    updateModalCardsAndUI();
  }
}

function closeSecurityModal() {
  state.pendingProfile = undefined;
  state.pendingSensitivity = undefined;
  if (secModal) secModal.style.display = 'none';
  renderProfileButtons();
}

function saveSecurityModalSettings() {
  const profKey = state.pendingProfile || state.currentProfile || 'balanced';
  const sensLevel = state.pendingSensitivity || (PROFILES[profKey] ? PROFILES[profKey].sensitivity : (sensitivitySelect ? sensitivitySelect.value : 'Internal'));

  state.currentProfile = profKey;
  if (PROFILES[profKey]) {
    const config = PROFILES[profKey];
    if (chunkSize) chunkSize.value = config.chunkSize;
    if (chunkOverlap) chunkOverlap.value = config.chunkOverlap;
    if (sensitivitySelect) sensitivitySelect.value = config.sensitivity;
    if (guardrailsToggle) guardrailsToggle.checked = config.guardrails;
  } else if (sensitivitySelect && sensLevel) {
    sensitivitySelect.value = sensLevel;
  }

  // Save to localStorage for permanent persistence
  try {
    if (state.currentProfile) localStorage.setItem('ragbot_active_profile', state.currentProfile);
    if (sensitivitySelect) localStorage.setItem('ragbot_sensitivity_level', sensitivitySelect.value);
  } catch (e) {
    console.error("Failed to save settings to localStorage:", e);
  }

  updateSensitivityUI();
  closeSecurityModal();
  toast(`Security policy (${sensitivitySelect ? sensitivitySelect.value : 'Internal'}) confirmed and active!`, 'success');
}

if (btnSecurityMenu) btnSecurityMenu.addEventListener('click', openSecurityModal);
if (btnDocStudioSecurity) btnDocStudioSecurity.addEventListener('click', openSecurityModal);
if (secModalClose) secModalClose.addEventListener('click', closeSecurityModal);
if (btnSecModalCancel) btnSecModalCancel.addEventListener('click', closeSecurityModal);
if (btnSecModalSave) btnSecModalSave.addEventListener('click', saveSecurityModalSettings);
if (btnSecModalDone) btnSecModalDone.addEventListener('click', saveSecurityModalSettings);

if (secModal) {
  secModal.addEventListener('click', (e) => {
    if (e.target === secModal) closeSecurityModal();
  });
}

// Wire the 4 level cards inside the modal
document.querySelectorAll('.sec-level-card').forEach(card => {
  card.addEventListener('click', () => {
    const level = card.dataset.level;
    if (level) {
      state.pendingSensitivity = level;
      let matched = null;
      for (const [name, config] of Object.entries(PROFILES)) {
        if (config.sensitivity === level) {
          matched = name;
          break;
        }
      }
      state.pendingProfile = matched || null;
      updateModalCardsAndUI();
    }
  });
});

// ─── STORAGE POOL (Document Library - ChatGPT Minimalist List) ───────────────
async function loadStoragePool() {
  storageEmpty.textContent = 'Loading…';
  storageEmpty.style.display = 'block';
  // Remove old collection cards
  storagePool.querySelectorAll('.storage-card').forEach(c => c.remove());

  try {
    const data = await apiFetch('/api/storage');
    const collections = data.collections || [];

    if (collections.length === 0) {
      storageEmpty.textContent = 'No chat history yet.';
      return;
    }

    storageEmpty.style.display = 'none';

    collections.forEach(col => {
      const card = document.createElement('div');
      card.className = 'storage-card' + (col.available ? '' : ' unavailable');
      card.dataset.dbId = col.db_id;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');

      const names = col.files.join(', ') || 'Unknown files';
      const date = col.created_at ? new Date(col.created_at).toLocaleDateString() : '—';

      card.innerHTML = `
        <div class="storage-card-header">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span class="storage-card-name" title="${escapeHtml(names)}">${escapeHtml(truncate(names, 36))}</span>
        </div>
        <button class="storage-del-btn" data-db-id="${col.db_id}" title="Delete chat session" aria-label="Delete chat session">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      `;

      card.addEventListener('click', () => loadStoredSession(col));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          loadStoredSession(col);
        }
      });
      card.querySelector('.storage-del-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteStoredSession(col.db_id, card);
      });

      storagePool.appendChild(card);
    });
  } catch (e) {
    storageEmpty.textContent = `Error loading chat history: ${e.message}`;
  }
}

async function loadStoredSession(col) {
  if (!state.ollamaRunning) {
    toast('Ollama is not connected. Launch Ollama first.', 'error');
    return;
  }

  // Highlight active card
  storagePool.querySelectorAll('.storage-card').forEach(c => c.classList.remove('active'));
  const card = storagePool.querySelector(`[data-db-id="${col.db_id}"]`);
  if (card) {
    card.classList.add('active');
    const loadBtn = card.querySelector('.storage-load-btn');
    if (loadBtn) {
      loadBtn.textContent = 'Loading…';
      loadBtn.disabled = true;
    }
  }

  try {
    const activeProfile = PROFILES[state.currentProfile] || PROFILES.balanced;
    const data = await apiFetch('/api/sessions/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        db_id: col.db_id,
        model: modelSelect.value,
        ollama_host: getOllamaEndpoint(),
        system_prompt: activeProfile.goal || '',
      }),
    });

    state.sessionId = data.session_id;
    state.currentDbId = col.db_id;
    state.activeDocName = col.files.length > 1 ? `${col.files[0]} (+${col.files.length - 1} more)` : col.files[0];
    localStorage.setItem('ragbot_active_db_id', col.db_id);
    localStorage.setItem('ragbot_active_session_id', data.session_id);
    localStorage.setItem('ragbot_active_doc_name', state.activeDocName);

    // Restore message history without clearing
    chatMessages.innerHTML = '';
    const messages = data.messages || [];
    if (Array.isArray(messages) && messages.length > 0) {
      messages.forEach(msg => {
        if (!msg) return;
        if (typeof msg === 'string') {
          appendMessage('user', msg);
        } else {
          appendMessage(
            msg.role || 'assistant',
            msg.content || '',
            msg.blocked || false,
            msg.is_error || false,
            msg.citations || [],
            msg.latency_sec || 0
          );
        }
      });
    }

    // Update upload status text
    setUploadStatus(`Loaded: ${data.files.join(', ')}`, 'success');
    toast(`Loaded "${data.files.join(', ')}" from history.`, 'success');
    showChatReady();
    autoCollapseUpload();
    if (window.innerWidth <= 900) closeMobileSidebar();
  } catch (e) {
    toast(`Failed to load: ${e.message}`, 'error', 6000);
    if (card) {
      card.classList.remove('active');
      card.querySelector('.storage-load-btn').textContent = 'Load Session';
      card.querySelector('.storage-load-btn').disabled = false;
    }
  }
}

async function deleteStoredSession(dbId, cardEl) {
  const confirmed = await showCustomConfirm(
    'Delete Session',
    'Are you sure you want to delete this indexed collection from disk? This cannot be undone.',
    true
  );
  if (!confirmed) return;
  try {
    await apiFetch('/api/storage/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ db_id: dbId }),
    });
    cardEl.style.animation = 'toastOut 0.2s ease forwards';
    setTimeout(() => { cardEl.remove(); checkStorageEmpty(); }, 220);
    toast('Collection deleted.', 'info');
  } catch (e) {
    toast(`Delete failed: ${e.message}`, 'error');
  }
}

function checkStorageEmpty() {
  if (!storagePool.querySelector('.storage-card')) {
    storageEmpty.textContent = 'No chat history yet.';
    storageEmpty.style.display = 'block';
  }
}

btnRefreshStorage.addEventListener('click', loadStoragePool);

// ─── FILE HANDLING ────────────────────────────────────────────────────────────
const getExt = name => name.split('.').pop().toLowerCase();
const truncate = (s, n) => s.length > n ? s.slice(0, n) + '…' : s;

function renderFileList() {
  const n = state.selectedFiles.length;
  if (n === 0) {
    fileList.style.display = 'none';
    btnProcess.disabled = true;
    btnReset.style.display = 'none';
    uploadFileCount.style.display = 'none';
    return;
  }
  fileList.style.display = 'flex';
  btnProcess.disabled = false;
  btnReset.style.display = 'inline-flex';
  uploadFileCount.textContent = `${n} file${n > 1 ? 's' : ''}`;
  uploadFileCount.style.display = 'inline-flex';

  fileList.innerHTML = '';
  state.selectedFiles.forEach(f => {
    const chip = document.createElement('div');
    chip.className = 'file-chip';
    chip.setAttribute('role', 'listitem');
    chip.innerHTML = `<span class="ext-tag">${getExt(f.name)}</span>${f.name}`;
    fileList.appendChild(chip);
  });
}

function addFiles(files) {
  const allowed = new Set(['pdf', 'txt', 'doc', 'docx', 'md', 'json', 'csv', 'log', 'py']);
  const incoming = Array.from(files);
  const valid = incoming.filter(f => allowed.has(getExt(f.name)));
  if (valid.length < incoming.length) toast('Some files skipped (unsupported format).', 'warn');
  const names = new Set(state.selectedFiles.map(f => f.name));
  valid.filter(f => !names.has(f.name)).forEach(f => state.selectedFiles.push(f));
  renderFileList();
}

function translateError(error) {
  const msg = (error.message || String(error)).toLowerCase();
  if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('503')) {
    return '<strong>Ollama is currently asleep.</strong> Please open the Ollama app on your computer and click "Retry".';
  }
  if (msg.includes('model') && (msg.includes('not found') || msg.includes('not installed'))) {
    return '<strong>Selected model is not installed.</strong> Please select another model in the sidebar, or run <code>ollama pull</code> in your terminal.';
  }
  if (msg.includes('empty') || msg.includes('no text')) {
    return '<strong>No readable text found.</strong> This document seems to be empty or contains scanned images. Try using an OCR-scanned PDF or a text file.';
  }
  return `<strong>Error:</strong> ${error.message || error}`;
}

dropZone.addEventListener('click', () => fileInput.click());
dropClick.addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
dropZone.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
});
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', e => {
  if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('drag-over');
});
dropZone.addEventListener('drop', e => {
  e.preventDefault(); dropZone.classList.remove('drag-over');
  addFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', () => { addFiles(fileInput.files); fileInput.value = ''; });

btnReset.addEventListener('click', () => {
  state.selectedFiles = [];
  state.sessionId = null;
  state.currentDbId = null;
  // step2Card is always enabled now, no need to toggle disabled class
  renderFileList();
  setUploadStatus('');
  setUploadPanelOpen(true);
  showEmptyState();
});

// ─── UPLOAD / PROCESS ─────────────────────────────────────────────────────────
function setUploadStatus(msg, type = '') {
  uploadStatus.innerHTML = msg;
  uploadStatus.className = `upload-status ${type}`.trim();
}

btnProcess.addEventListener('click', processDocuments);

async function processDocuments() {
  if (state.isProcessing || !state.selectedFiles.length) return;
  if (!state.ollamaRunning) {
    toast('Ollama is not running. Set the Ollama Endpoint in the sidebar.', 'error');
    return;
  }

  state.isProcessing = true;
  btnProcess.disabled = true;
  btnReset.disabled = true;
  setUploadStatus('Embedding documents — please wait…', 'loading');

  const activeProfile = PROFILES[state.currentProfile] || PROFILES.balanced;
  const form = new FormData();
  state.selectedFiles.forEach(f => form.append('files', f));
  form.append('model', modelSelect.value);
  form.append('chunk_size', chunkSize.value);
  form.append('chunk_overlap', chunkOverlap.value);
  form.append('ollama_host', getOllamaEndpoint());
  form.append('redact_pii', 'true');
  form.append('system_prompt', activeProfile.goal || '');

  try {
    const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || res.statusText);
    }
    const data = await res.json();
    state.sessionId = data.session_id;
    state.currentDbId = data.db_id;
    state.activeDocName = state.selectedFiles.length > 1 ? `${state.selectedFiles[0].name} (+${state.selectedFiles.length - 1} more)` : state.selectedFiles[0].name;
    localStorage.setItem('ragbot_active_db_id', data.db_id);
    localStorage.setItem('ragbot_active_session_id', data.session_id);
    localStorage.setItem('ragbot_active_doc_name', state.activeDocName);

    chatMessages.innerHTML = '';
    const messages = data.messages || [];
    if (Array.isArray(messages) && messages.length > 0) {
      messages.forEach(msg => {
        if (!msg) return;
        if (typeof msg === 'string') {
          appendMessage('user', msg);
        } else {
          appendMessage(
            msg.role || 'assistant',
            msg.content || '',
            msg.blocked || false,
            msg.is_error || false,
            msg.citations || [],
            msg.latency_sec || 0
          );
        }
      });
    }

    setUploadStatus(`${data.files.length} document(s) indexed.`, 'success');
    toast('Documents ready — start chatting!', 'success');
    showChatReady();
    autoCollapseUpload();
    await loadStoragePool();
  } catch (e) {
    console.error("Error in processDocuments:", e);
    const friendly = translateError(e);
    setUploadStatus(friendly, 'error');
    toast(e.message || 'Processing failed', 'error', 6000);
  } finally {
    state.isProcessing = false;
    btnProcess.disabled = false;
    btnReset.disabled = false;
  }
}

// ─── CHAT STATE TRANSITIONS ───────────────────────────────────────────────────
function showEmptyState() {
  state.activeTab = 'new-chat';
  const tabs = $('viewTabs');
  if (tabs) {
    tabs.style.display = state.sessionId ? 'inline-flex' : 'none';
  }
  
  emptyState.style.display = '';
  if (uploadSection) {
    uploadSection.style.display = '';
    uploadSection.classList.remove('collapsed');
  }
  if (dropZone) dropZone.style.display = '';
  chatMessages.style.display = 'none';
  readyBanner.style.display = 'none';
  activeDocBanner.style.display = 'none';
  typingIndicator.style.display = 'none';
  inputBarWrapper.style.display = 'block';
  magicPromptsWrapper.style.display = 'none';
  chatInput.disabled = false;
  chatInput.placeholder = "Ask anything about your document or start typing...";
  btnSend.disabled = false;
  updateTabUI();
}

const MAGIC_PROMPTS = {
  balanced: [
    { label: 'Key Info', text: 'What is the main subject of this document?' },
    { label: 'Summary', text: 'Provide a concise overview of the key points.' },
    { label: 'Timeline', text: 'Extract any dates or timeline details from the document.' }
  ],
  strict: [
    { label: 'Risks', text: 'Identify any potential legal or financial risks mentioned.' },
    { label: 'Obligations', text: 'List the main duties or obligations of the parties.' },
    { label: 'Data Audit', text: 'Identify any potential sensitive data references.' }
  ],
  fast: [
    { label: 'TL;DR', text: 'Give a 1-sentence TL;DR summary.' },
    { label: 'Bullets', text: 'Summarize the document in 3 bullet points.' },
    { label: 'Action Items', text: 'Are there any action items mentioned?' }
  ]
};

function renderMagicPrompts() {
  const profile = state.currentProfile || 'balanced';
  const prompts = MAGIC_PROMPTS[profile] || MAGIC_PROMPTS.balanced;
  
  magicPrompts.innerHTML = '';
  prompts.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'magic-prompt-btn';
    btn.type = 'button';
    btn.innerHTML = p.label;
    btn.addEventListener('click', () => {
      chatInput.value = p.text;
      chatInput.dispatchEvent(new Event('input'));
      sendMessage();
    });
    magicPrompts.appendChild(btn);
  });
  
  magicPromptsWrapper.style.display = 'block';
}

function showChatReady() {
  state.activeTab = 'chat';
  const tabs = $('viewTabs');
  if (tabs && !state.isSharedSession) tabs.style.display = 'inline-flex';
  updateTabUI();
  
  if (!state.isSharedSession) {
    fetchDocSuggestions();
  } else if (magicPromptsWrapper) {
    magicPromptsWrapper.style.display = 'none';
    magicPromptsWrapper.innerHTML = '';
  }
  requestAnimationFrame(() => chatInput.focus());
}

function updateTabUI() {
  if (activeDocName) activeDocName.textContent = state.activeDocName || 'Document Name';
  const tabNew = $('tabNewChat');
  const tabActive = $('tabActiveChat');
  
  if (state.activeTab === 'chat') {
    if (tabActive) tabActive.classList.add('active');
    if (tabNew) tabNew.classList.remove('active');
    
    emptyState.style.display = 'none';
    chatMessages.style.display = 'flex';
    activeDocBanner.style.display = 'flex';
    inputBarWrapper.style.display = 'block';
    
    // Collapse upload section when chatting
    if (uploadSection) uploadSection.classList.add('collapsed');
    if (uploadToggleIcon) {
      uploadToggleIcon.style.transform = 'rotate(180deg)';
    }
  } else {
    if (tabNew) tabNew.classList.add('active');
    if (tabActive) tabActive.classList.remove('active');
    
    emptyState.style.display = '';
    chatMessages.style.display = 'none';
    activeDocBanner.style.display = 'none';
    inputBarWrapper.style.display = 'block';
    chatInput.disabled = false;
    btnSend.disabled = false;
    
    // Ensure upload section and drop zone are fully visible for New Chat
    if (uploadSection) {
      uploadSection.style.display = '';
      uploadSection.classList.remove('collapsed');
    }
    if (uploadPanelToggle) uploadPanelToggle.style.display = '';
    if (dropZone) dropZone.style.display = '';
    
    if (uploadToggleIcon) {
      uploadToggleIcon.style.transform = 'rotate(0deg)';
    }
  }
}

// ─── START NEW CHAT & CLEAR CONVERSATION ────────────────────────────────────
function startNewChat() {
  state.activeTab = 'new-chat';
  storagePool.querySelectorAll('.storage-card').forEach(c => c.classList.remove('active'));
  showEmptyState();
  if (window.innerWidth <= 900) closeMobileSidebar();
}

async function clearConversation() {
  const confirmed = await showCustomConfirm(
    'Clear Conversation',
    'Are you sure you want to clear the conversation history? This will reset the active session.',
    true
  );
  if (!confirmed) return;

  if (state.sessionId) {
    try {
      await apiFetch('/api/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: state.sessionId }),
      });
    } catch { /* best-effort */ }
  }
  // FULL RESET
  state.sessionId = null;
  state.currentDbId = null;
  state.selectedFiles = [];
  state.activeDocName = '';
  chatMessages.innerHTML = '';
  localStorage.removeItem('ragbot_active_db_id');
  localStorage.removeItem('ragbot_active_session_id');
  localStorage.removeItem('ragbot_active_doc_name');
  renderFileList();
  showEmptyState();
  toast('Session terminated. Please select a new document.', 'info');
  if (window.innerWidth <= 900) closeMobileSidebar();
}

btnClear.addEventListener('click', startNewChat);

// ─── CHAT INPUT ────────────────────────────────────────────────────────────────
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 130) + 'px';
  btnSend.disabled = !chatInput.value.trim() || state.isChatting;
});

chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
btnSend.addEventListener('click', sendMessage);

// ─── STREAMING ASSISTANT MESSAGE ──────────────────────────────────────────────
function createStreamingAssistantMessage() {
  const wrap = document.createElement('div');
  wrap.className = 'chat-message assistant';

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar bot-av';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.innerHTML = '<img src="static/logo.png" alt="GuardRAG Assistant" style="width:100%; height:100%; object-fit:contain;" />';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  const content = document.createElement('div');
  content.className = 'markdown-body-stream';
  bubble.appendChild(content);

  wrap.appendChild(avatar);
  wrap.appendChild(bubble);
  chatMessages.appendChild(wrap);
  scrollToBottom();

  return {
    wrap,
    bubble,
    content,
    update(text) {
      content.innerHTML = marked.parse(text);
      scrollToBottom();
    },
    finalize(finalText, blocked = false, citations = [], latencySec = 0) {
      if (blocked) {
        bubble.classList.add('blocked');
        const label = document.createElement('div');
        label.className = 'guard-label';
        label.textContent = 'GUARDRAIL TRIGGERED';
        bubble.insertBefore(label, content);
      }
      content.innerHTML = marked.parse(finalText || '');
      if (citations && citations.length > 0) {
        const inspectBtn = document.createElement('button');
        inspectBtn.className = 'btn btn-secondary inspect-citations-btn';
        inspectBtn.style.marginTop = '0.65rem';
        inspectBtn.style.fontSize = '0.68rem';
        inspectBtn.style.padding = '0.35rem 0.75rem';
        inspectBtn.style.minHeight = 'unset';
        inspectBtn.textContent = 'Inspect Citations';
        inspectBtn.addEventListener('click', () => {
          showCitationsInspector(citations, latencySec);
        });
        bubble.appendChild(inspectBtn);
      }
      scrollToBottom();
    },
    remove() {
      wrap.remove();
    }
  };
}

// ─── SEND MESSAGE ─────────────────────────────────────────────────────────────
async function sendMessage() {
  const question = chatInput.value.trim();
  if (!question || state.isChatting || !state.sessionId) return;

  state.isChatting = true;
  chatInput.value = '';
  chatInput.style.height = 'auto';
  btnSend.disabled = true;
  chatInput.disabled = true;
  readyBanner.style.display = 'none';

  appendMessage('user', question);
  typingIndicator.style.display = 'flex';
  scrollToBottom();

  let streamMsg = null;

  try {
    const activeProfile = state.isSharedSession
      ? { goal: state.sharedSystemPrompt || '', rules: (state.sharedCustomRules || []).join(', ') }
      : (PROFILES[state.currentProfile] || PROFILES.balanced);
    const rulesList = activeProfile.rules 
      ? activeProfile.rules.split(',').map(s => s.trim()).filter(Boolean) 
      : [];

    const modelToUse = state.isSharedSession
      ? (state.selectedModel || modelSelect?.value || 'gemma3:1b')
      : (modelSelect?.value || state.selectedModel || 'gemma3:1b');
    const guardrailsToUse = state.isSharedSession
      ? (state.guardrailsEnabled ?? true)
      : (guardrailsToggle?.checked ?? true);
    const sensitivityToUse = state.isSharedSession
      ? (state.sensitivityLevel || 'Internal')
      : (sensitivitySelect?.value || 'Internal');

    const headers = { 'Content-Type': 'application/json' };
    const storedKey = localStorage.getItem('guardrag_api_key');
    if (storedKey) {
      headers['Authorization'] = `Bearer ${storedKey}`;
    }

    const payload = {
      session_id: state.sessionId,
      question,
      model: modelToUse,
      enable_guardrails: guardrailsToUse,
      sensitivity_level: sensitivityToUse,
      ollama_host: getOllamaEndpoint(),
      system_prompt: activeProfile.goal || '',
      custom_rules: rulesList
    };

    const response = await fetch(API_BASE + '/api/chat/stream', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(err.detail || response.statusText);
    }

    typingIndicator.style.display = 'none';
    streamMsg = createStreamingAssistantMessage();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulatedText = '';
    let citations = [];
    let isBlocked = false;
    let latencySec = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split('\n\n');
      buffer = events.pop();

      for (const evt of events) {
        if (!evt.trim()) continue;
        const lines = evt.split('\n');
        let eventType = 'message';
        let dataStr = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            dataStr = line.slice(6);
          }
        }
        if (!dataStr) continue;
        try {
          const data = JSON.parse(dataStr);
          if (eventType === 'citations') {
            citations = data.citations || [];
          } else if (eventType === 'token') {
            accumulatedText += data.token || '';
            streamMsg.update(accumulatedText);
          } else if (eventType === 'blocked' || eventType === 'blocked_output') {
            isBlocked = true;
            accumulatedText = data.answer || '';
            streamMsg.update(accumulatedText);
          } else if (eventType === 'end') {
            accumulatedText = data.answer || accumulatedText;
            citations = data.citations || citations;
            latencySec = data.latency_sec || latencySec;
          } else if (eventType === 'error') {
            throw new Error(data.error || 'Streaming error occurred');
          }
        } catch (jsonErr) {
          console.warn('Failed to parse SSE chunk:', jsonErr, dataStr);
        }
      }
    }

    streamMsg.finalize(accumulatedText, isBlocked, citations, latencySec);

  } catch (e) {
    typingIndicator.style.display = 'none';
    if (streamMsg) {
      streamMsg.remove();
    }
    const friendly = translateError(e);
    appendMessage('assistant', friendly, false, true);
    toast(e.message || 'Chat query failed', 'error', 6000);
  } finally {
    state.isChatting = false;
    chatInput.disabled = false;
    btnSend.disabled = false;
    requestAnimationFrame(() => chatInput.focus());
  }
}

// ─── RENDER MESSAGE ───────────────────────────────────────────────────────────
function appendMessage(role, text, blocked = false, isError = false, citations = [], latencySec = 0) {
  const wrap = document.createElement('div');
  wrap.className = `chat-message ${role}`;

  const avatar = document.createElement('div');
  avatar.className = `msg-avatar ${role === 'user' ? 'user-av' : 'bot-av'}`;
  avatar.setAttribute('aria-hidden', 'true');
  if (role === 'user') {
    avatar.textContent = 'U';
  } else {
    avatar.innerHTML = '<img src="static/logo.png" alt="Duck Assistant" style="width:100%; height:100%; object-fit:contain;" />';
  }

  const bubble = document.createElement('div');
  bubble.className = `msg-bubble${blocked || isError ? ' blocked' : ''}`;

  if (blocked) {
    const label = document.createElement('div');
    label.className = 'guard-label';
    label.textContent = 'GUARDRAIL TRIGGERED';
    bubble.appendChild(label);
  }

  const content = document.createElement('div');
  content.innerHTML = role === 'assistant'
    ? marked.parse(text)
    : escapeHtml(text);
  bubble.appendChild(content);

  if (role === 'assistant' && citations && citations.length > 0) {
    const inspectBtn = document.createElement('button');
    inspectBtn.className = 'btn btn-secondary inspect-citations-btn';
    inspectBtn.style.marginTop = '0.65rem';
    inspectBtn.style.fontSize = '0.68rem';
    inspectBtn.style.padding = '0.35rem 0.75rem';
    inspectBtn.style.minHeight = 'unset';
    inspectBtn.textContent = 'Inspect Citations';
    inspectBtn.addEventListener('click', () => {
      showCitationsInspector(citations, latencySec);
    });
    bubble.appendChild(inspectBtn);
  }

  wrap.appendChild(avatar);
  wrap.appendChild(bubble);
  chatMessages.appendChild(wrap);
  scrollToBottom();
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    const scrollContainer = $('mainContentScrollable');
    if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
  });
}

// ─── CITATIONS INSPECTOR ─────────────────────────────────────────────────────
const citationsInspectorPanel = $('citationsInspectorPanel');
const btnCloseCitations = $('btnCloseCitations');

if (btnCloseCitations) {
  btnCloseCitations.addEventListener('click', () => {
    citationsInspectorPanel.style.display = 'none';
  });
}
if (citationsInspectorPanel) {
  citationsInspectorPanel.addEventListener('click', (e) => {
    if (e.target === citationsInspectorPanel) {
      citationsInspectorPanel.style.display = 'none';
    }
  });
}

function showCitationsInspector(citations, latencySec) {
  const panel = $('citationsInspectorPanel');
  const latencyVal = $('citationsLatencyVal');
  const countVal = $('citationsCountVal');
  const container = $('citationsListContainer');

  latencyVal.textContent = (latencySec || 0).toFixed(3) + 's';
  countVal.textContent = citations ? citations.length : 0;
  container.innerHTML = '';

  if (!citations || citations.length === 0) {
    container.innerHTML = '<div class="hint-text">No source citations available for this response.</div>';
  } else {
    citations.forEach((c, idx) => {
      const card = document.createElement('div');
      card.className = 'citation-card';
      card.style.background = 'var(--bg-raised)';
      card.style.border = '1px solid var(--border)';
      card.style.borderRadius = 'var(--radius-sm)';
      card.style.padding = '0.8rem';
      
      const pageStr = c.page ? ` (Page ${c.page})` : '';
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem; font-size:0.72rem; color:var(--text-muted);">
          <span><strong>Source #${idx + 1}:</strong> ${escapeHtml(c.source)}${pageStr}</span>
          <span style="font-family:var(--font-mono); color:var(--accent);">Score: ${(c.score || 0).toFixed(4)}</span>
        </div>
        <div style="font-size:0.78rem; line-height:1.5; color:var(--text-secondary); white-space:pre-wrap;">${escapeHtml(c.content)}</div>
      `;
      container.appendChild(card);
    });
  }

  panel.style.display = 'flex';
}

// ─── DYNAMIC SUGGESTIONS ─────────────────────────────────────────────────────
async function fetchDocSuggestions() {
  if (!state.sessionId || state.isSharedSession) {
    if (magicPromptsWrapper) {
      magicPromptsWrapper.style.display = 'none';
      magicPromptsWrapper.innerHTML = '';
    }
    return;
  }
  
  magicPrompts.innerHTML = '<span style="font-size:0.68rem; color:var(--text-muted); padding:0.35rem 0.55rem;">Generating custom questions…</span>';
  magicPromptsWrapper.style.display = 'block';
  
  try {
    const data = await apiFetch('/api/suggest_questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: state.sessionId }),
    });
    
    const questions = data.questions || [];
    magicPrompts.innerHTML = '';
    
    if (questions.length === 0) {
      magicPromptsWrapper.style.display = 'none';
      return;
    }
    
    questions.forEach(q => {
      const btn = document.createElement('button');
      btn.className = 'magic-prompt-btn';
      btn.type = 'button';
      btn.innerHTML = escapeHtml(q);
      btn.addEventListener('click', () => {
        chatInput.value = q;
        chatInput.dispatchEvent(new Event('input'));
        sendMessage();
      });
      magicPrompts.appendChild(btn);
    });
  } catch (e) {
    console.error("Failed to fetch custom question suggestions:", e);
    renderMagicPrompts();
  }
}

// ─── POLICIES ────────────────────────────────────────────────────────────────
async function fetchPolicies() {
  try {
    const data = await apiFetch('/api/policies');
    const level = $('policyLevelSelect').value;
    const policy = data[level] || { description: '', input_patterns: [], output_patterns: [] };
    
    $('policyDescInput').value = policy.description || '';
    $('policyInputPatterns').value = (policy.input_patterns || []).join(', ');
    $('policyOutputPatterns').value = (policy.output_patterns || []).join(', ');
  } catch (e) {
    console.error("Failed to fetch policies:", e);
  }
}

async function savePolicyRules() {
  const level = $('policyLevelSelect').value;
  const desc = $('policyDescInput').value.trim();
  const inputPat = $('policyInputPatterns').value.split(',').map(s => s.trim()).filter(Boolean);
  const outputPat = $('policyOutputPatterns').value.split(',').map(s => s.trim()).filter(Boolean);

  try {
    const currentPolicies = await apiFetch('/api/policies');
    currentPolicies[level] = {
      description: desc,
      input_patterns: inputPat,
      output_patterns: outputPat
    };

    await apiFetch('/api/policies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentPolicies)
    });
    toast('Policy rules updated successfully.', 'success');
  } catch (e) {
    toast(`Failed to save policy: ${e.message}`, 'error');
  }
}

// ─── VECTOR DB CONFIG ────────────────────────────────────────────────────────
async function loadVectorConfig() {
  try {
    const config = await apiFetch('/api/vector/config');
    $('vectorStoreType').value = config.type || 'FAISS';
    $('vectorStoreHost').value = config.host || '';
    $('vectorStoreApiKey').value = config.api_key || '';
    
    toggleVectorConfigInputs();
  } catch (e) {
    console.error("Failed to load vector config:", e);
  }
}

function toggleVectorConfigInputs() {
  const type = $('vectorStoreType').value;
  const showRemote = (type === 'Qdrant' || type === 'Chroma');
  if ($('remoteVectorSettings')) $('remoteVectorSettings').style.display = showRemote ? 'block' : 'none';
  if ($('remoteVectorUrlGroup')) $('remoteVectorUrlGroup').style.display = showRemote ? 'block' : 'none';
  if ($('remoteVectorApiKeyGroup')) $('remoteVectorApiKeyGroup').style.display = (showRemote && type === 'Qdrant') ? 'block' : 'none';
}

async function testVectorConnection() {
  const type = $('vectorStoreType').value;
  const host = $('vectorStoreHost').value.trim();
  const apiKey = $('vectorStoreApiKey').value.trim();

  const testBtn = $('btnTestVector');
  testBtn.disabled = true;
  testBtn.textContent = 'Testing...';

  try {
    const res = await apiFetch('/api/vector/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, host, api_key: apiKey })
    });
    toast(res.message || 'Connection test successful!', 'success');
  } catch (e) {
    toast(`Connection failed: ${e.message}`, 'error');
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = 'Test Link';
  }
}

async function saveVectorConfig() {
  const type = $('vectorStoreType').value;
  const host = $('vectorStoreHost').value.trim();
  const apiKey = $('vectorStoreApiKey').value.trim();

  try {
    await apiFetch('/api/vector/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, host, api_key: apiKey })
    });
    toast('Vector database configuration saved.', 'success');
  } catch (e) {
    toast(`Failed to save vector config: ${e.message}`, 'error');
  }
}

// ─── AUDIT LOGS ──────────────────────────────────────────────────────────────
async function refreshAuditLogs() {
  const container = $('auditLoggerContent');
  if (!container) return;

  try {
    const data = await apiFetch('/api/audit/logs');
    const logs = data.logs || [];
    if (logs.length === 0) {
      container.innerHTML = '<div class="audit-log-entry" style="color:var(--text-muted);">No logs recorded.</div>';
      return;
    }

    container.innerHTML = '';
    logs.forEach(log => {
      const entry = document.createElement('div');
      entry.className = 'audit-log-entry';
      
      let color = 'var(--text-secondary)';
      if (log.type === 'safety_alert') color = 'var(--danger)';
      else if (log.type === 'retrieval') color = 'var(--success)';
      else if (log.type === 'system') color = 'var(--info)';

      const timeStr = log.timestamp ? log.timestamp.split('T')[1]?.substring(0, 8) || '' : '';
      entry.innerHTML = `<span style="color:var(--text-muted);">[${timeStr}]</span> <span style="color:${color}; font-weight:bold;">${log.type.toUpperCase()}</span> ${escapeHtml(log.message)}`;
      container.appendChild(entry);
    });
  } catch (e) {
    console.error("Failed to load audit logs:", e);
  }
}

// ─── TOOLTIP LOGIC ────────────────────────────────────────────────────────────
const TOOLTIP_DATA = {
  'active-model': {
    title: 'Active Model',
    desc: 'The specific local language model used to generate responses.',
    why: 'Allows switching between different models depending on your hardware capability and quality requirements.',
    how: 'Select from the dropdown of currently downloaded models.',
    example: 'gemma3:1b'
  },
  'safety-privacy': {
    title: 'Safety & Privacy',
    desc: 'Enables or disables safety guardrails and sets the sensitivity levels.',
    why: 'Prevents the AI from outputting confidential data, jailbreaks, or violating safety compliance rules.',
    how: 'Toggle guardrails on or off, and select the sensitivity classification matching your documents.',
    example: 'Confidential level blocks names, locations, and personal identifiers.'
  },
  'enable-guardrails': {
    title: 'Enable Guardrails',
    desc: 'Controls NVIDIA NeMo Guardrails to enforce alignment policies.',
    why: 'Keeps the model\'s inputs and outputs within safe boundaries, rejecting jailbreaks and protecting sensitive terms.',
    how: 'Toggle the switch to enable or disable real-time policy filtering.',
    example: 'Blocks user prompt attempts to bypass safety filters (jailbreaking).'
  },
  'sensitivity-level': {
    title: 'Sensitivity Level',
    desc: 'Determines which data classification policy rules are enforced (Public, Internal, Confidential, Restricted).',
    why: 'Higher sensitivity tiers automatically redact more information like PII and credentials.',
    how: 'Select the classification matching the vulnerability of your input documents.',
    example: 'Restricted blocks medical or financial references.'
  },
  'sensitivity-reference': {
    title: 'Sensitivity Reference',
    desc: 'A summary of what types of data are blocked/redacted at each sensitivity level.',
    why: 'Provides transparency on exactly what safety policies are active, helping you audit compliance requirements.',
    how: 'Refer to this table to see the progression of protection from Public to Restricted.',
    example: 'Internal blocks API keys and passwords.'
  },
  'document-library': {
    title: 'Document Library',
    desc: 'A list of document collections previously uploaded and indexed on this system.',
    why: 'Allows reloading past documents instantly without reprocessing or re-embedding them.',
    how: 'Click Load Session on any card to restore the knowledge base for that document.',
    example: 'Standard Contract session'
  },
  'system-settings': {
    title: 'System Settings',
    desc: 'Configures the core local LLM infrastructure for running the AI engine.',
    why: 'Controls the host and local backend execution parameters for offline privacy.',
    how: 'Enable the Advanced Settings (Pro) toggle below to view and configure these settings.',
    example: 'Modify endpoint URL if hosting Ollama on a different port or machine.'
  },
  'ollama-endpoint': {
    title: 'Ollama Endpoint',
    desc: 'The local network address where your Ollama server is hosted.',
    why: 'Connects the app directly to Ollama, enabling local inference with no third-party data sharing.',
    how: 'Enter the endpoint URL (default is http://localhost:11434). If using a remote server, use ngrok or cloudflared tunnel.',
    example: 'http://localhost:11434 or https://xxxx.ngrok-free.app'
  },
  'chunking-parameters': {
    title: 'Chunking Parameters',
    desc: 'Configures how uploaded documents are split into smaller segments (chunks) and how much they overlap.',
    why: 'Optimizes how search queries locate relevant context inside large documents.',
    how: 'Increase chunk size for long-form narrative text; decrease it for tables or precise data.',
    example: 'Size: 1000, Overlap: 200'
  },
  'vector-db-config': {
    title: 'Vector Database Config',
    desc: 'Selects the storage engine and path for document vector embeddings.',
    why: 'Stores vectorized document structures for semantic search queries.',
    how: 'Choose FAISS for local storage, or connect to remote Qdrant/Chroma servers.',
    example: 'FAISS (Local)'
  },
  'policy-rules-editor': {
    title: 'Visual Policy Rules Editor',
    desc: 'Interface to define custom safety policy rules, description, input and output patterns.',
    why: 'Allows tailoring specific domain guardrails (such as legal, engineering, HR) for custom blocking rules.',
    how: 'Select a policy tier, enter blocked keywords or patterns, and click Save Policy Rules.',
    example: 'Add pattern "CONFIDENTIAL_PROJECT" to block related output.'
  },
  'security-auditor': {
    title: 'Security Sandbox & Auditor',
    desc: 'Live audit log window tracking guardrail violations and safety validations.',
    why: 'Provides real-time visibility into why queries were blocked or redacted.',
    how: 'Read the chronological logs here or click Refresh Logs.',
    example: 'Security audit entry: "Blocked query: user requested API key"'
  },
  'step1-select-doc': {
    title: 'Select Document',
    desc: 'Drag and drop or browse to select your source files.',
    why: 'Ingests documents into local memory so the AI can use them as context.',
    how: 'Supports PDF, TXT, DOC, and DOCX formats.',
    example: 'contract.pdf'
  },
  'step2-smart-profile': {
    title: 'Choose Smart Profile',
    desc: 'Select a preset configuration profile optimized for different document types.',
    why: 'Sets chunk size, overlap, and sensitivity parameters automatically.',
    how: 'Click on a card profile like Contracts or Quick Read, or save your own custom configuration.',
    example: 'Financial/Medical profile'
  },
  'step3-safety-dashboard': {
    title: 'Safety Dashboard',
    desc: 'Real-time indicators showing the current guardrail classification and status.',
    why: 'Gives visual confirmation of security mode (Safe, Protected, or Strict Lock).',
    how: 'Updates dynamically as you switch profiles or change sensitivity levels.',
    example: 'Strict Lock Active when Restricted sensitivity is selected'
  }
};

function initInfoTooltips() {
  const tooltipEl = $('infoFloatingTooltip');
  if (!tooltipEl) return;

  const infoButtons = document.querySelectorAll('.info-btn');
  infoButtons.forEach(btn => {
    const infoKey = btn.getAttribute('data-info');
    const data = TOOLTIP_DATA[infoKey];
    if (!data) return;

    btn.addEventListener('mouseenter', showTooltip);
    btn.addEventListener('mouseleave', hideTooltip);
    btn.addEventListener('focus', showTooltip);
    btn.addEventListener('blur', hideTooltip);

    function showTooltip() {
      tooltipEl.innerHTML = `
        <div class="info-tooltip-title">${escapeHtml(data.title)}</div>
        <div class="info-tooltip-desc">${escapeHtml(data.desc)}</div>
        <div class="info-tooltip-why">
          <strong>Why Use This:</strong>
          ${escapeHtml(data.why)}
        </div>
        <div class="info-tooltip-section">
          <strong>How to Modify:</strong>
          ${escapeHtml(data.how)}
        </div>
        <div class="info-tooltip-section">
          <strong>Example:</strong>
          <code>${escapeHtml(data.example)}</code>
        </div>
      `;

      tooltipEl.classList.add('visible');
      tooltipEl.style.display = 'block';

      // Position calculations
      const rect = btn.getBoundingClientRect();
      const tooltipRect = tooltipEl.getBoundingClientRect();

      let top = rect.top - tooltipRect.height - 8;
      let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

      if (top < 8) {
        top = rect.bottom + 8;
      }
      if (left < 8) {
        left = 8;
      } else if (left + tooltipRect.width > window.innerWidth - 8) {
        left = window.innerWidth - tooltipRect.width - 8;
      }

      tooltipEl.style.top = `${top}px`;
      tooltipEl.style.left = `${left}px`;
    }

    function hideTooltip() {
      tooltipEl.classList.remove('visible');
      tooltipEl.style.display = 'none';
    }
  });

  window.addEventListener('scroll', () => {
    tooltipEl.classList.remove('visible');
    tooltipEl.style.display = 'none';
  }, { passive: true });
  document.addEventListener('scroll', () => {
    tooltipEl.classList.remove('visible');
    tooltipEl.style.display = 'none';
  }, { capture: true, passive: true });
  window.addEventListener('resize', () => {
    tooltipEl.classList.remove('visible');
    tooltipEl.style.display = 'none';
  }, { passive: true });
}

function initAdvancedToggle() {
  if (advancedToggle && advancedSettingsContainer) {
    advancedToggle.addEventListener('change', () => {
      advancedSettingsContainer.style.display = advancedToggle.checked ? 'block' : 'none';
    });
  }
}

function showCustomProfileModal() {
  return new Promise((resolve) => {
    const modal = $('customProfileModal');
    const nameInput = $('customProfileName');
    const goalInput = $('customProfileGoal');
    const rulesInput = $('customProfileRules');
    const sensSelect = $('customProfileSensitivity');
    const guardSelect = $('customProfileGuardrails');
    const sizeInput = $('customProfileChunkSize');
    const overlapInput = $('customProfileChunkOverlap');
    const saveBtn = $('btnCustomProfileSave');
    const cancelBtn = $('btnCustomProfileCancel');
    const closeBtn = $('btnCustomProfileClose');

    // Populate with current settings
    nameInput.value = '';
    goalInput.value = '';
    rulesInput.value = '';
    sensSelect.value = sensitivitySelect.value;
    guardSelect.value = guardrailsToggle.checked ? 'true' : 'false';
    sizeInput.value = chunkSize.value;
    overlapInput.value = chunkOverlap.value;

    modal.style.display = 'flex';
    setTimeout(() => nameInput.focus(), 50);

    function cleanUp(result) {
      modal.style.display = 'none';
      saveBtn.removeEventListener('click', onSave);
      cancelBtn.removeEventListener('click', onCancel);
      closeBtn.removeEventListener('click', onCancel);
      resolve(result);
    }

    function onSave() {
      const name = nameInput.value.trim();
      if (!name) {
        toast('Profile name is required.', 'warn');
        return;
      }
      cleanUp({
        name,
        goal: goalInput.value.trim(),
        rules: rulesInput.value.trim(),
        sensitivity: sensSelect.value,
        guardrails: guardSelect.value === 'true',
        chunkSize: parseInt(sizeInput.value, 10) || 1000,
        chunkOverlap: parseInt(overlapInput.value, 10) || 200
      });
    }

    function onCancel() {
      cleanUp(null);
    }

    saveBtn.addEventListener('click', onSave);
    cancelBtn.addEventListener('click', onCancel);
    closeBtn.addEventListener('click', onCancel);
  });
}

// ─── SHARE & HOST ACCESS CONTROL CENTER ────────────────────────────────────────
async function shareSession() {
  if (!state.sessionId) {
    toast('No active session to share.', 'warn');
    return;
  }
  
  const modal = $('shareModal');
  if (modal) {
    if ($('shareLinkResult')) $('shareLinkResult').style.display = 'none';
    if ($('shareUrlInput')) $('shareUrlInput').value = '';
    modal.style.display = 'flex';
    switchShareTab('create');
    updateShareLinkCounts();
  }
}

// Share Navigation Tabs
function switchShareTab(tabName) {
  const tabCreate = $('shareTabCreate');
  const tabActive = $('shareTabActive');
  const tabClientChats = $('shareTabClientChats');
  const paneCreate = $('sharePaneCreate');
  const paneActive = $('sharePaneActive');
  const paneClientChats = $('sharePaneClientChats');

  if (!paneCreate || !paneActive || !paneClientChats) return;

  [tabCreate, tabActive, tabClientChats].forEach(t => {
    if (t) {
      t.classList.remove('active');
      t.style.borderBottomColor = 'transparent';
      t.style.color = 'var(--text-muted)';
    }
  });

  paneCreate.style.display = 'none';
  paneActive.style.display = 'none';
  paneClientChats.style.display = 'none';

  if (tabName === 'create') {
    if (tabCreate) { tabCreate.classList.add('active'); tabCreate.style.borderBottomColor = 'var(--accent)'; tabCreate.style.color = 'var(--text-primary)'; }
    paneCreate.style.display = 'block';
  } else if (tabName === 'active') {
    if (tabActive) { tabActive.classList.add('active'); tabActive.style.borderBottomColor = 'var(--accent)'; tabActive.style.color = 'var(--text-primary)'; }
    paneActive.style.display = 'block';
    loadActiveShareLinks();
  } else if (tabName === 'clientChats') {
    if (tabClientChats) { tabClientChats.classList.add('active'); tabClientChats.style.borderBottomColor = 'var(--accent)'; tabClientChats.style.color = 'var(--text-primary)'; }
    paneClientChats.style.display = 'block';
    loadClientChats();
    if (window._clientChatsRefreshTimer) clearInterval(window._clientChatsRefreshTimer);
    window._clientChatsRefreshTimer = setInterval(() => {
      if (paneClientChats.style.display !== 'none') {
        loadClientChats();
      } else {
        clearInterval(window._clientChatsRefreshTimer);
      }
    }, 4000);
  }
}

$('shareTabCreate')?.addEventListener('click', () => switchShareTab('create'));
$('shareTabActive')?.addEventListener('click', () => switchShareTab('active'));
$('shareTabClientChats')?.addEventListener('click', () => switchShareTab('clientChats'));

// Update Share Link and Client Chat Counts
async function updateShareLinkCounts() {
  if (!state.sessionId) return;
  try {
    const linksData = await apiFetch(`/api/share/list/${state.sessionId}`);
    const activeCount = linksData.links ? linksData.links.length : 0;
    if ($('activeLinksCount')) $('activeLinksCount').textContent = activeCount;

    const clientsData = await apiFetch(`/api/share/client-chats/${state.sessionId}`);
    const clientCount = clientsData.clients ? clientsData.clients.length : 0;
    if ($('clientChatsCount')) $('clientChatsCount').textContent = clientCount;
  } catch (e) {
    console.error("Error updating share counts:", e);
  }
}

// Generate Customized Share Link
$('btnShareGenerate')?.addEventListener('click', async () => {
  if (!state.sessionId) return;
  const name = $('shareLinkNameInput')?.value.trim() || 'Public Share Link';
  const chatAccess = $('shareChatAccessSelect')?.value; // 'interactive' vs 'readonly'
  const historyAccess = $('shareHistorySelect')?.value; // 'yes' vs 'no'
  const syncMode = $('shareSyncSelect')?.value; // 'sync' vs 'isolated'
  const privacyLevel = $('shareSensitivitySelect')?.value || 'Internal';

  const generateBtn = $('btnShareGenerate');
  if (generateBtn) generateBtn.disabled = true;

  try {
    const res = await apiFetch('/api/share/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: state.sessionId,
        name: name,
        show_history: historyAccess === 'yes',
        read_only: chatAccess === 'readonly',
        sync: syncMode === 'sync',
        sensitivity_level: privacyLevel
      })
    });

    // Resolve actual LAN network address if accessed via localhost
    let hostAddress = window.location.host;
    try {
      const netInfo = await apiFetch('/api/share/network-info');
      if (netInfo && netInfo.local_ip && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        hostAddress = `${netInfo.local_ip}:${netInfo.port || window.location.port || 8000}`;
      }
    } catch {
      // fallback to current host
    }

    const shareUrl = `${window.location.protocol}//${hostAddress}/?share=${res.share_id}`;
    if ($('shareLinkResult')) $('shareLinkResult').style.display = 'block';
    if ($('shareUrlInput')) $('shareUrlInput').value = shareUrl;
    toast('Custom share link generated!', 'success');
    updateShareLinkCounts();
  } catch (err) {
    toast(`Share failed: ${err.message}`, 'error');
  } finally {
    if (generateBtn) generateBtn.disabled = false;
  }
});

$('btnCopyShareUrl')?.addEventListener('click', async () => {
  const url = $('shareUrlInput')?.value;
  if (!url) return;
  try {
    await navigator.clipboard.writeText(url);
    toast('Share link copied to clipboard!', 'success');
  } catch (err) {
    toast('Failed to copy. Please copy manually.', 'error');
  }
});

// Load Active Links List
async function loadActiveShareLinks() {
  const container = $('activeLinksList');
  if (!container || !state.sessionId) return;
  container.innerHTML = '<div style="font-size:0.75rem; color:var(--text-muted);">Loading active links...</div>';
  try {
    const data = await apiFetch(`/api/share/list/${state.sessionId}`);
    const links = data.links || [];
    if (links.length === 0) {
      container.innerHTML = '<div style="font-size:0.8rem; color:var(--text-muted); padding:1rem; text-align:center;">No active share links generated yet.</div>';
      return;
    }
    container.innerHTML = '';
    links.forEach(l => {
      const card = document.createElement('div');
      card.className = 'share-link-card';
      card.style.background = 'var(--bg-tertiary)';
      card.style.border = '1px solid var(--border-color)';
      card.style.borderRadius = '8px';
      card.style.padding = '0.75rem';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.gap = '0.4rem';

      const shareUrl = `${window.location.protocol}//${window.location.host}/?share=${l.share_id}`;
      const confPercent = Math.round((l.min_confidence || 0) * 100);

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="font-size:0.82rem; color:var(--text-primary);">${escapeHtml(l.name)}</strong>
          <span style="font-size:0.7rem; color:var(--text-muted);">${l.created_at ? l.created_at.replace('T', ' ').replace('Z', '') : ''}</span>
        </div>
        <div style="display:flex; gap:0.4rem; flex-wrap:wrap; font-size:0.7rem;">
          <span style="background:${l.read_only ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)'}; color:${l.read_only ? '#ef4444' : '#22c55e'}; padding:2px 6px; border-radius:4px; font-weight:600;">
            ${l.read_only ? 'Read-Only' : 'Chat Allowed'}
          </span>
          <span style="background:rgba(59, 130, 246, 0.15); color:#3b82f6; padding:2px 6px; border-radius:4px; font-weight:600;">
            ${l.show_history ? 'History Visible' : 'Clean Slate'}
          </span>
          <span style="background:rgba(168, 85, 247, 0.15); color:#a855f7; padding:2px 6px; border-radius:4px; font-weight:600;">
            ${l.sync ? 'Live Sync' : 'Isolated Thread'}
          </span>
          <span style="background:rgba(0, 185, 30, 0.15); color:var(--accent); padding:2px 6px; border-radius:4px; font-weight:600;">
            Policy: ${escapeHtml(l.sensitivity_level || 'Internal')}
          </span>
        </div>
        <div style="display:flex; gap:0.4rem; margin-top:0.2rem;">
          <input type="text" readonly value="${shareUrl}" class="form-control" style="font-size:0.75rem; flex:1; padding:0.2rem 0.5rem;" />
          <button class="btn btn-secondary btn-copy-link" data-url="${shareUrl}" style="font-size:0.72rem; padding:0.2rem 0.6rem;">Copy</button>
          <button class="btn btn-secondary btn-revoke-link" data-id="${l.share_id}" style="font-size:0.72rem; padding:0.2rem 0.6rem; color:#ef4444; border-color:rgba(239, 68, 68, 0.3);">Revoke</button>
        </div>
      `;
      container.appendChild(card);
    });

    // Copy event listeners
    container.querySelectorAll('.btn-copy-link').forEach(btn => {
      btn.addEventListener('click', async () => {
        const u = btn.getAttribute('data-url');
        await navigator.clipboard.writeText(u);
        toast('Link copied!', 'success');
      });
    });

    // Revoke event listeners
    container.querySelectorAll('.btn-revoke-link').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to revoke this share link? Guests using it will lose access.')) {
          await apiFetch(`/api/share/revoke/${id}`, { method: 'DELETE' });
          toast('Share link revoked!', 'success');
          loadActiveShareLinks();
          updateShareLinkCounts();
        }
      });
    });
  } catch (e) {
    container.innerHTML = `<div style="font-size:0.8rem; color:var(--error);">Failed to load links: ${e.message}</div>`;
  }
}

// Load Client Guest Chats List
async function loadClientChats() {
  const container = $('clientChatsList');
  if (!container || !state.sessionId) return;
  container.innerHTML = '<div style="font-size:0.75rem; color:var(--text-muted);">Loading guest chats...</div>';
  try {
    const data = await apiFetch(`/api/share/client-chats/${state.sessionId}`);
    const clients = data.clients || [];
    if (clients.length === 0) {
      container.innerHTML = '<div style="font-size:0.8rem; color:var(--text-muted); padding:1rem; text-align:center;">No guest client sessions recorded yet.</div>';
      return;
    }
    container.innerHTML = '';
    clients.forEach(c => {
      const card = document.createElement('div');
      card.style.background = 'var(--bg-tertiary)';
      card.style.border = '1px solid var(--border-color)';
      card.style.borderRadius = '8px';
      card.style.padding = '0.75rem';
      card.style.display = 'flex';
      card.style.justifyContent = 'space-between';
      card.style.alignItems = 'center';

      const ip = c.client_ip || 'Unknown IP';
      let platform = 'Client Device';
      if (c.user_agent) {
        if (/iphone|ipad|ipod/i.test(c.user_agent)) platform = 'iOS Device';
        else if (/android/i.test(c.user_agent)) platform = 'Android Device';
        else if (/macintosh|mac os x/i.test(c.user_agent)) platform = 'macOS Client';
        else if (/windows/i.test(c.user_agent)) platform = 'Windows Client';
        else if (/linux/i.test(c.user_agent)) platform = 'Linux Client';
      }
      const lastActive = c.last_active ? c.last_active.replace('T', ' ').replace('Z', ' UTC') : 'Active recently';

      card.innerHTML = `
        <div style="flex:1;">
          <div style="font-size:0.82rem; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:0.4rem;">
            <span>${escapeHtml(c.share_name)}</span>
            <span style="font-size:0.65rem; background:rgba(99,102,241,0.15); color:var(--accent); padding:1px 6px; border-radius:4px; font-weight:600;">${escapeHtml(platform)}</span>
          </div>
          <div style="font-size:0.72rem; color:var(--text-secondary); margin-top:0.2rem;">
            IP: <span style="color:var(--text-primary); font-family:var(--font-mono);">${escapeHtml(ip)}</span> · Messages: <strong>${c.message_count}</strong>
          </div>
          <div style="font-size:0.68rem; color:var(--text-muted); margin-top:0.1rem;">
            Session ID: ${c.client_session_id} · Last active: ${escapeHtml(lastActive)}
          </div>
        </div>
        <button class="btn btn-secondary btn-inspect-chat" style="font-size:0.72rem; padding:0.3rem 0.65rem; align-self:center;">Inspect Chat</button>
      `;

      card.querySelector('.btn-inspect-chat').addEventListener('click', () => {
        openInspectClientChat(c.share_name, c.messages);
      });
      container.appendChild(card);
    });
  } catch (e) {
    container.innerHTML = `<div style="font-size:0.8rem; color:var(--error);">Failed to load guest chats: ${e.message}</div>`;
  }
}

function openInspectClientChat(name, messages) {
  const modal = $('clientChatInspectModal');
  const title = $('clientChatInspectTitle');
  const body = $('clientChatInspectBody');
  if (!modal || !body) return;

  if (title) title.textContent = `Guest Chat Transcript (${name})`;
  body.innerHTML = '';
  if (!messages || messages.length === 0) {
    body.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:1rem;">No conversation history for this guest session yet.</div>';
  } else {
    messages.forEach(m => {
      const bubble = document.createElement('div');
      bubble.style.margin = '0.5rem 0';
      bubble.style.padding = '0.5rem 0.8rem';
      bubble.style.borderRadius = '6px';
      if (m.role === 'user') {
        bubble.style.background = 'var(--accent-glow)';
        bubble.style.color = 'var(--text-primary)';
        bubble.innerHTML = `<strong>Guest User:</strong> ${escapeHtml(m.content)}`;
      } else {
        bubble.style.background = 'var(--bg-secondary)';
        bubble.style.color = 'var(--text-primary)';
        bubble.innerHTML = `<strong>RAG AI:</strong> ${escapeHtml(m.content)}`;
      }
      body.appendChild(bubble);
    });
  }
  modal.style.display = 'flex';
}

$('btnClientChatInspectClose')?.addEventListener('click', () => {
  if ($('clientChatInspectModal')) $('clientChatInspectModal').style.display = 'none';
});
$('btnClientChatInspectDone')?.addEventListener('click', () => {
  if ($('clientChatInspectModal')) $('clientChatInspectModal').style.display = 'none';
});

const closeShareModal = () => {
  const modal = $('shareModal');
  if (modal) modal.style.display = 'none';
  if ($('shareLinkResult')) $('shareLinkResult').style.display = 'none';
  if ($('shareUrlInput')) $('shareUrlInput').value = '';
};

$('btnShareClose')?.addEventListener('click', closeShareModal);
$('btnShareCancel')?.addEventListener('click', closeShareModal);

// ─── GUEST SETTINGS ───────────────────────────────────────────────────────────
const openGuestSettings = () => {
  const modal = $('guestSettingsModal');
  if (modal) {
    // Populate model select
    const guestModelSelect = $('guestModelSelect');
    if (guestModelSelect) {
      guestModelSelect.innerHTML = '';
      state.models.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        guestModelSelect.appendChild(opt);
      });
      // Fallback if current model isn't in state.models
      if (!state.models.includes(state.selectedModel)) {
        const opt = document.createElement('option');
        opt.value = state.selectedModel;
        opt.textContent = state.selectedModel;
        guestModelSelect.appendChild(opt);
      }
      guestModelSelect.value = state.selectedModel;
    }

    $('guestGuardrailsToggle').checked = state.guardrailsEnabled;
    $('guestSensitivitySelect').value = state.sensitivityLevel;
    $('guestSystemPrompt').value = state.sharedSystemPrompt;
    
    modal.style.display = 'flex';
  }
};

const closeGuestSettings = () => {
  const modal = $('guestSettingsModal');
  if (modal) modal.style.display = 'none';
};

$('btnGuestSettings')?.addEventListener('click', openGuestSettings);
$('btnGuestSettingsClose')?.addEventListener('click', closeGuestSettings);
$('btnGuestSettingsCancel')?.addEventListener('click', closeGuestSettings);

$('btnGuestSettingsSave')?.addEventListener('click', () => {
  state.selectedModel = $('guestModelSelect')?.value || state.selectedModel;
  state.guardrailsEnabled = $('guestGuardrailsToggle')?.checked ?? true;
  state.sensitivityLevel = $('guestSensitivitySelect')?.value || 'Internal';
  state.sharedSystemPrompt = $('guestSystemPrompt')?.value || '';
  toast('Session preferences saved', 'success');
  closeGuestSettings();
});

// Live Sync Polling for guest/host shared sessions
let liveSyncInterval = null;
let lastSyncMessageCount = 0;

function startLiveSyncPolling() {
  if (liveSyncInterval) clearInterval(liveSyncInterval);
  lastSyncMessageCount = chatMessages ? chatMessages.querySelectorAll('.chat-message').length : 0;
  
  liveSyncInterval = setInterval(async () => {
    if (!state.sessionId || !state.isSharedSession || state.isChatting) return;
    try {
      const data = await apiFetch(`/api/sessions/${state.sessionId}/messages`);
      if (data && Array.isArray(data.messages)) {
        if (data.messages.length > lastSyncMessageCount) {
          const newMessages = data.messages.slice(lastSyncMessageCount);
          newMessages.forEach(m => {
            appendMessage(m.role, m.content);
          });
          lastSyncMessageCount = data.messages.length;
        }
      }
    } catch {
      // Quietly ignore background sync hiccups
    }
  }, 3500);
}

// ─── CHECK SHARED SESSION (GUEST CONNECTOR) ───────────────────────────────────
async function checkSharedSession() {
  const urlParams = new URLSearchParams(window.location.search);
  const shareSessionId = urlParams.get('share');
  if (!shareSessionId) return;

  // Multi-device persistence: retrieve or maintain persistent device session ID
  const savedDeviceId = localStorage.getItem('guardrag_device_session_' + shareSessionId) || '';
  const resolveUrl = savedDeviceId 
    ? `/api/share/resolve/${shareSessionId}?client_id=${encodeURIComponent(savedDeviceId)}`
    : `/api/share/resolve/${shareSessionId}`;

  try {
    const sessionInfo = await apiFetch(resolveUrl);
    if (sessionInfo && sessionInfo.session_id) {
      state.sessionId = sessionInfo.session_id;
      if (sessionInfo.client_session_id) {
        localStorage.setItem('guardrag_device_session_' + shareSessionId, sessionInfo.client_session_id);
      }
      state.currentDbId = sessionInfo.db_id;
      state.activeDocName = (sessionInfo.files && sessionInfo.files.length) ? sessionInfo.files.join(', ') : 'Host Document';
      state.isSharedSession = true;
      state.isReadOnly = sessionInfo.read_only || false;
      state.selectedModel = sessionInfo.model || 'gemma3:1b';
      state.sensitivityLevel = sessionInfo.sensitivity_level || 'Internal';
      if (sensitivitySelect) sensitivitySelect.value = state.sensitivityLevel;

      // 1. Hide/disable host controls (sidebar, upload section)
      if (sidebar) sidebar.style.display = 'none';
      if (sidebarOpen) sidebarOpen.style.display = 'none';
      if (sidebarCollapseBtn) sidebarCollapseBtn.style.display = 'none';
      if (sidebarExpandBtn) sidebarExpandBtn.style.display = 'none';
      if (sidebarBackdrop) sidebarBackdrop.style.display = 'none';
      
      const mainWrapper = $('mainWrapper');
      if (mainWrapper) {
        mainWrapper.style.marginLeft = '0';
        mainWrapper.style.width = '100%';
      }

      if (uploadSection) uploadSection.style.display = 'none';
      if (uploadPanelToggle) uploadPanelToggle.style.display = 'none';
      
      // Lock security/privacy level for guest: only host has control
      if (btnSecurityMenu) {
        btnSecurityMenu.style.cursor = 'default';
        btnSecurityMenu.style.pointerEvents = 'none';
        btnSecurityMenu.title = 'Security & Privacy policy is locked and controlled exclusively by the host.';
        btnSecurityMenu.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent); flex-shrink:0;">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span id="topbarSensitivityLabel">${escapeHtml(state.sensitivityLevel)} (Host Locked)</span>
        `;
      }

      // Hide host action elements in topbar for guest
      const btnHdrSettings = $('btnHeaderSettings');
      if (btnHdrSettings) btnHdrSettings.style.display = 'none';
      const btnTglOllama = $('btnToggleOllama');
      if (btnTglOllama) btnTglOllama.style.display = 'none';
      const btnAtt = $('btnAttachFile');
      if (btnAtt) btnAtt.style.display = 'none';
      const vTabs = $('viewTabs');
      if (vTabs) vTabs.style.display = 'none';

      // Hide suggestion questions in guest mode
      if (magicPromptsWrapper) {
        magicPromptsWrapper.style.display = 'none';
        magicPromptsWrapper.innerHTML = '';
      }

      // 2. Show shared session banner
      const sharedBanner = $('sharedSessionBanner');
      if (sharedBanner) {
        sharedBanner.style.display = 'flex';
        const bannerText = sharedBanner.querySelector('.shared-session-text');
        if (bannerText) {
          bannerText.innerHTML = state.isReadOnly
            ? `<strong>Connected to Host Session (${escapeHtml(sessionInfo.name || 'Shared')})</strong> — <span style="color:#ef4444; font-weight:700;">Read-Only Mode</span>. Document stays on host.`
            : `<strong>Connected to Host Session (${escapeHtml(sessionInfo.name || 'Shared')})</strong>. Interactive chat active under host document.`;
        }
      }

      const shareBtn = $('btnShareSession');
      if (shareBtn) shareBtn.style.display = 'none';

      // 3. Handle Read-Only state for chat UI
      if (state.isReadOnly) {
        if (chatInput) {
          chatInput.disabled = true;
          chatInput.placeholder = "Read-Only Mode: Host Admin has restricted chat access for this link.";
        }
        if (btnSend) btnSend.disabled = true;
      }

      // 4. Load messages if present
      if (sessionInfo.messages && sessionInfo.messages.length > 0) {
        chatMessages.innerHTML = '';
        sessionInfo.messages.forEach(m => {
          appendMessage(m.role, m.content);
        });
        lastSyncMessageCount = sessionInfo.messages.length;
      }

      // 5. Start live sync if session is in sync mode
      if (sessionInfo.sync) {
        startLiveSyncPolling();
      }

      // Transition to chat ready
      showChatReady();
      toast(`Connected to host session: ${sessionInfo.name || 'Shared'}`, 'success');
    }
  } catch (e) {
    console.error("Failed to load shared session:", e);
    toast('The shared session does not exist or has expired.', 'error', 8000);
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
(async function init() {
  state.sidebarCollapsed = false;
  sidebarExpandBtn.style.display = 'none';

  // 1. Bind static UI elements and event listeners (run immediately, non-blocking)
  initAdvancedToggle();
  initInfoTooltips();

  const tabNew = $('tabNewChat');
  const tabActive = $('tabActiveChat');
  if (tabNew && tabActive) {
    tabNew.addEventListener('click', () => {
      if (state.isSharedSession) {
        toast('In shared guest mode, active host documents and controls are managed by the host admin.', 'info');
        return;
      }
      state.activeTab = 'new-chat';
      state.isSharedSession = false;
      
      // Cleanly remove ?share=... from address bar if present
      if (window.history && window.history.replaceState && window.location.search.includes('share=')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      // Restore sidebar, banner, and upload section
      if (sidebar) sidebar.style.display = '';
      if (sidebarOpen) sidebarOpen.style.display = '';
      if (uploadSection) uploadSection.style.display = '';
      if (uploadPanelToggle) uploadPanelToggle.style.display = '';
      if (dropZone) dropZone.style.display = '';
      const sharedBanner = $('sharedSessionBanner');
      if (sharedBanner) sharedBanner.style.display = 'none';

      updateTabUI();
    });
    tabActive.addEventListener('click', () => {
      state.activeTab = 'chat';
      updateTabUI();
      scrollToBottom();
    });
  }

  // Attach document button
  const btnAttachFile = $('btnAttachFile');
  if (btnAttachFile) {
    btnAttachFile.addEventListener('click', () => {
      if (state.isSharedSession) {
        toast('Document uploads are disabled in shared guest mode.', 'info');
        return;
      }
      if (fileInput) fileInput.click();
    });
  }

  const btnShareSession = $('btnShareSession');
  if (btnShareSession) {
    btnShareSession.addEventListener('click', shareSession);
  }

  if (btnSaveCustomProfile) {
    btnSaveCustomProfile.addEventListener('click', async () => {
      const data = await showCustomProfileModal();
      if (!data) return;

      const key = 'custom_' + Date.now();
      const newProfile = {
        chunkSize: data.chunkSize,
        chunkOverlap: data.chunkOverlap,
        sensitivity: data.sensitivity,
        guardrails: data.guardrails,
        name: data.name,
        desc: data.rules ? `Goal prompt + custom rules: ${data.rules}` : `Goal prompt only`,
        goal: data.goal,
        rules: data.rules
      };

      PROFILES[key] = newProfile;

      try {
        const saved = JSON.parse(localStorage.getItem('ragbot_custom_profiles') || '{}');
        saved[key] = newProfile;
        localStorage.setItem('ragbot_custom_profiles', JSON.stringify(saved));
      } catch (e) {
        console.error(e);
      }

      state.pendingProfile = key;
      state.pendingSensitivity = newProfile.sensitivity;
      updateModalCardsAndUI();
      toast(`Profile "${data.name}" created! Click "Save & Apply" to confirm.`, 'success');
    });
  }

  // Load custom profiles from local storage
  loadCustomProfiles();

  // Load previously saved active profile & sensitivity from localStorage
  try {
    const savedProfile = localStorage.getItem('ragbot_active_profile');
    const savedSens = localStorage.getItem('ragbot_sensitivity_level');
    if (savedProfile && PROFILES[savedProfile]) {
      selectProfile(savedProfile);
    } else {
      selectProfile('balanced');
    }
    if (savedSens && sensitivitySelect && !savedProfile) {
      sensitivitySelect.value = savedSens;
      updateSensitivityUI();
    }
  } catch {
    selectProfile('balanced');
  }

  // Bind change event to toggle redact names toggle (removed redactNamesToggle ReferenceError)

  // Vector DB settings event bindings
  if ($('vectorStoreType')) {
    $('vectorStoreType').addEventListener('change', toggleVectorConfigInputs);
  }
  if ($('btnTestVector')) {
    $('btnTestVector').addEventListener('click', testVectorConnection);
  }
  if ($('btnSaveVector')) {
    $('btnSaveVector').addEventListener('click', saveVectorConfig);
  }
  if ($('policyLevelSelect')) {
    $('policyLevelSelect').addEventListener('change', fetchPolicies);
  }
  if ($('btnSavePolicy')) {
    $('btnSavePolicy').addEventListener('click', savePolicyRules);
  }
  if ($('btnRefreshAuditLogs')) {
    $('btnRefreshAuditLogs').addEventListener('click', refreshAuditLogs);
  }

  // 2. Load background server dependencies (non-blocking, try-catch protected)
  try {
    await fetchConfig();
  } catch (e) {
    console.warn("Failed to load server config:", e);
  }
  
  try {
    await fetchPolicies();
  } catch (e) {
    console.warn("Failed to load policies:", e);
  }

  try {
    await loadVectorConfig();
  } catch (e) {
    console.warn("Failed to load vector config:", e);
  }

  try {
    await refreshAuditLogs();
  } catch (e) {
    console.warn("Failed to load audit logs:", e);
  }

  try {
    await refreshHealth();
  } catch (e) {
    console.warn("Failed to check health:", e);
  }

  try {
    await loadStoragePool();
  } catch (e) {
    console.warn("Failed to load storage pool:", e);
  }

  // Check if this page load is for a shared session
  await checkSharedSession();

  // Restore active session and its chat history if available
  if (!state.isSharedSession) {
    const savedActiveDbId = localStorage.getItem('ragbot_active_db_id');
    if (savedActiveDbId) {
      try {
        const data = await apiFetch('/api/storage');
        const found = (data.collections || []).find(c => c.db_id === savedActiveDbId && c.available);
        if (found) {
          await loadStoredSession(found);
        }
      } catch (e) {
        console.warn("Could not restore previous active session:", e);
      }
    }
  }

  // 3. Poll health every 12 s
  setInterval(refreshHealth, 12_000);
  
  // 4. Poll audit logs every 5 s
  if (!state.isSharedSession) {
    setInterval(refreshAuditLogs, 5_000);
  }
})();
