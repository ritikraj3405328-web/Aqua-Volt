/* =========================================================================
   AQUAVAULT — MULTI-PAGE PWA APPLICATION ENGINE (v4 — CROSS-VERIFIED)
   ========================================================================= */

const ICONS = {
  home: `<svg class="icon" viewBox="0 0 24 24"><path d="M3 10.5L12 3l9 7.5"/><path d="M5.5 9.5V20a1 1 0 0 0 1 1h4v-6h3v6h4a1 1 0 0 0 1-1V9.5"/></svg>`,
  warranty: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 3l7.5 3v5.5c0 4.8-3.2 8.9-7.5 10.5-4.3-1.6-7.5-5.7-7.5-10.5V6L12 3z"/><path d="M9 12l2 2 4-4"/></svg>`,
  devices: `<svg class="icon" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h6v6H9z"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/></svg>`,
  calc: `<svg class="icon" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 7h8"/><path d="M8 12h2M14 12h2M8 16h2M14 16h2"/></svg>`,
  notes: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
  hub: `<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>`,
  privacy: `<svg class="icon" viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/><circle cx="12" cy="16" r="1"/></svg>`,
  sun: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>`,
  moon: `<svg class="icon" viewBox="0 0 24 24"><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a6.5 6.5 0 0 0 11 11z"/></svg>`,
  gauge: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 12l5-5"/><path d="M12 7v1M7 12H6M12 12a1 1 0 1 0 0 .01"/></svg>`,
  droplet: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 2.8S6 9.6 6 14.2a6 6 0 0 0 12 0C18 9.6 12 2.8 12 2.8z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/></svg>`,
  receipt: `<svg class="icon" viewBox="0 0 24 24"><path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>`,
  wrench: `<svg class="icon" viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.3-2.3 1.6-3z"/></svg>`,
  arrowLeft: `<svg class="icon" viewBox="0 0 24 24"><path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/></svg>`,
  arrowRight: `<svg class="icon" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>`,
  arrowUpRight: `<svg class="icon" viewBox="0 0 24 24"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>`,
  pin: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 21s-6-5.4-6-10.5a6 6 0 1 1 12 0C18 15.6 12 21 12 21z"/><circle cx="12" cy="10.5" r="2"/></svg>`,
  bookmark: `<svg class="icon" viewBox="0 0 24 24"><path d="M6 4h12v17l-6-4-6 4V4z"/></svg>`,
  mail: `<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>`,
  cloud: `<svg class="icon" viewBox="0 0 24 24"><path d="M7 18h10.5a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7.2 8.7 4 4 0 0 0 7 18z"/></svg>`,
  download: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 4v11"/><path d="M8 11l4 4 4-4"/><path d="M4 19h16"/></svg>`,
  printer: `<svg class="icon" viewBox="0 0 24 24"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v6H7z"/></svg>`,
  trash: `<svg class="icon" viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/></svg>`,
  search: `<svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`,
  close: `<svg class="icon" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  globe: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>`,
  bolt: `<svg class="icon" viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>`,
  activity: `<svg class="icon" viewBox="0 0 24 24"><path d="M3 12h4l2.5-6 4 12 2.5-6H21"/></svg>`,
  refresh: `<svg class="icon" viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2 5.3"/><path d="M20 4v7h-7"/></svg>`,
  check: `<svg class="icon" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>`,
  smartphone: `<svg class="icon" viewBox="0 0 24 24"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18h2"/></svg>`
};

const ROUTES = [
  { id: 'home', href: 'index.html', label: 'Home', subtitle: 'Overview', icon: 'home', group: 'care', dock: true },
  { id: 'warranty', href: 'warranty.html', label: 'Warranty', subtitle: 'Live Countdown', icon: 'warranty', group: 'care', dock: true },
  { id: 'devices', href: 'devices.html', label: 'Devices', subtitle: 'Bills & Service', icon: 'devices', group: 'care', dock: true },
  { id: 'calculator', href: 'calculator.html', label: 'Hisab', fullLabel: 'Hisab-Kitab', subtitle: 'Calculator', icon: 'calc', group: 'work', dock: true },
  { id: 'invoice', href: 'invoice.html', label: 'Invoice', fullLabel: 'Invoice Generator', subtitle: 'Invoice Studio', icon: 'receipt', group: 'work', dock: false },
  { id: 'notes', href: 'notes.html', label: 'Notes', fullLabel: 'Notepad & Sync', subtitle: 'Notepad Sync', icon: 'notes', group: 'work', dock: true },
  { id: 'hub', href: 'hub.html', label: 'New Tab', fullLabel: 'New Tab (Apps Hub)', subtitle: 'Apps Hub', icon: 'hub', group: 'work', dock: false },
  { id: 'privacy', href: 'privacy.html', label: 'Privacy', fullLabel: 'DPDP Privacy & Settings', subtitle: 'DPDP & Settings', icon: 'privacy', group: 'work', dock: false }
];

const HUB_APPS = [
  {
    id: 'h1',
    name: 'AquaVault Official Store',
    category: 'Website',
    desc: 'Explore flagship dual-tank controllers, brass stoppers, and genuine spare sensors.',
    url: 'https://www.google.com/search?q=smart+water+level+controller',
    icon: 'globe'
  },
  {
    id: 'h2',
    name: 'HydroSense IoT Companion',
    category: 'New App',
    desc: 'Live Wi-Fi tank telemetry, motor runtime alerts, and water savings analytics.',
    url: 'https://www.google.com/search?q=smart+water+tank+monitor+app',
    icon: 'activity'
  },
  {
    id: 'h3',
    name: 'Tank Volume & Flow Estimator',
    category: 'Tool',
    desc: 'Calculate cylindrical & rectangular overhead tank capacity in liters and refill time.',
    url: 'https://www.google.com/search?q=water+tank+volume+calculator+liters',
    icon: 'gauge'
  },
  {
    id: 'h4',
    name: 'AquaCare Express Service Portal',
    category: 'Website',
    desc: 'Locate certified installation engineers, warranty policies, and wiring manuals.',
    url: 'https://www.google.com/search?q=water+level+controller+wiring+manual',
    icon: 'wrench'
  },
  {
    id: 'h5',
    name: 'Solar Pump Auto-Sync',
    category: 'New App',
    desc: 'Smart daylight pump scheduling for rooftop solar and borewell setups.',
    url: 'https://www.google.com/search?q=solar+water+pump+controller',
    icon: 'bolt'
  },
  {
    id: 'h6',
    name: 'Rainwater Harvest Planner',
    category: 'Tool',
    desc: 'Estimate rooftop monsoon water capture and sump storage sizing.',
    url: 'https://www.google.com/search?q=rainwater+harvesting+calculator',
    icon: 'droplet'
  }
];

const STORAGE_KEY = 'aquavault_luxury_state_v2';
const REMOTE_CONFIG_KEY = 'aquavault_admin_config_v1';
const PWA_POPUP_SESSION_KEY = 'aquavault_pwa_top_popup_shown';
const DAY_MS = 86400000;
const CURRENT_PAGE = document.body.dataset.page || 'home';

function getRemoteConfig() {
  try {
    const raw = localStorage.getItem(REMOTE_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isFeatureEnabled(key) {
  if (key === 'home') return true;
  const cfg = getRemoteConfig();
  if (!cfg || !cfg.features) return true;
  return cfg.features[key] !== false;
}

function shiftDays(delta) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return new Date(d.getTime() + delta * DAY_MS).toISOString().slice(0, 10);
}

function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(iso) {
  const d = parseISO(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatINR(num) {
  const n = Number(num) || 0;
  const sign = n < 0 ? '-' : '';
  return sign + '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function getWarrantyMetrics(unit) {
  const start = parseISO(unit.installDate);
  const end = parseISO(unit.expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalDays = Math.max(1, Math.round((end - start) / DAY_MS));
  const rawElapsed = Math.round((today - start) / DAY_MS);
  const elapsedDays = Math.max(0, Math.min(totalDays, rawElapsed));
  const remainingDays = Math.max(0, totalDays - elapsedDays);
  const pctRemaining = Math.round((remainingDays / totalDays) * 100);

  let status = 'active';
  let statusLabel = 'Active Shield';
  let badgeClass = 'badge-emerald';
  let strokeColor = 'var(--emerald)';
  if (remainingDays === 0) {
    status = 'expired';
    statusLabel = 'Warranty Expired';
    badgeClass = 'badge-rose';
    strokeColor = 'var(--rose)';
  } else if (remainingDays <= 45) {
    status = 'expiring';
    statusLabel = 'Expiring Soon';
    badgeClass = 'badge-amber';
    strokeColor = 'var(--amber)';
  }

  return { totalDays, elapsedDays, remainingDays, pctRemaining, status, statusLabel, badgeClass, strokeColor };
}

function buildInitialState() {
  return {
    theme: 'light',
    selectedUnitId: 'u1',
    devicesSubTab: 'units',
    calcMode: 'standard',
    calcDisplay: '0',
    calcExpr: '',
    calcJustEvaluated: false,
    calcFreshOperand: true,
    hubFilter: 'All',
    noteFilter: 'All',
    noteSearch: '',
    noteDraft: { title: '', tag: 'Maintenance', body: '' },
    customer: {
      name: 'Aarav Sharma',
      accountId: 'AQV-2026-8419',
      email: 'aarav.sharma@gmail.com',
      city: 'Bengaluru, Karnataka'
    },
    sync: {
      gmailSync: true,
      driveAutoSave: true,
      lastSynced: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    },
    dpdp: {
      consentGranted: true,
      auditTrail: [
        { time: formatDate(shiftDays(-124)), event: 'DPDP Act 2023 Explicit Consent Recorded' },
        { time: formatDate(shiftDays(-12)), event: 'Verified Digital GST Warranty Vault Activated' }
      ]
    },
    units: [
      {
        id: 'u1',
        type: 'controller',
        model: 'AquaVault Pro-X7 Dual Tank Controller',
        serial: 'AV-WLC-88412',
        location: 'Overhead Tank (Terrace)',
        installDate: shiftDays(-489),
        expiryDate: shiftDays(241),
        invoiceNo: 'INV-AQV-2025-1104',
        basePrice: 8450,
        gstRate: 18
      },
      {
        id: 'u2',
        type: 'controller',
        model: 'AquaVault SumpGuard S4 Controller',
        serial: 'AV-WLC-88905',
        location: 'Underground Sump',
        installDate: shiftDays(-330),
        expiryDate: shiftDays(35),
        invoiceNo: 'INV-AQV-2025-2218',
        basePrice: 6800,
        gstRate: 18
      },
      {
        id: 'u3',
        type: 'stopper',
        model: 'AquaVault HydroSeal Brass Stopper',
        serial: 'AV-WST-55210',
        location: 'Main Terrace Inlet Valve',
        installDate: shiftDays(-185),
        expiryDate: shiftDays(545),
        invoiceNo: 'INV-AQV-2026-0412',
        basePrice: 4950,
        gstRate: 18
      },
      {
        id: 'u4',
        type: 'stopper',
        model: 'AquaVault SmartCutoff Valve V2',
        serial: 'AV-WST-51084',
        location: 'Garden Line & Utility',
        installDate: shiftDays(-400),
        expiryDate: shiftDays(-35),
        invoiceNo: 'INV-AQV-2024-8910',
        basePrice: 3600,
        gstRate: 18
      }
    ],
    tickets: [
      {
        id: 'SRV-9402',
        unitId: 'u2',
        unitName: 'AquaVault SumpGuard S4 Controller',
        issue: 'Annual Sensor Calibration',
        notes: 'Routine ultrasonic level calibration before monsoon.',
        status: 'Scheduled',
        date: formatDate(shiftDays(-2))
      },
      {
        id: 'SRV-8817',
        unitId: 'u1',
        unitName: 'AquaVault Pro-X7 Dual Tank Controller',
        issue: 'Initial Commissioning Check',
        notes: 'Verified zero-overflow cutoff and dry-run protection.',
        status: 'Resolved',
        date: formatDate(shiftDays(-64))
      }
    ],
    tape: [
      { id: 't1', label: 'Overhead Tank Sensor + Valve', expr: '2 × 4950 + 18% GST', result: 11682, time: 'Today' },
      { id: 't2', label: 'Plumbing & Copper Fittings', expr: '1450 + 820', result: 2270, time: 'Yesterday' }
    ],
    notes: [
      {
        id: 'n1',
        title: 'Terrace Tank Float Calibration Log',
        tag: 'Maintenance',
        body: 'Upper cutoff set to 94%, auto-start refill threshold at 35%. Dry-run timer verified at 45 seconds.',
        pinned: true,
        updatedAt: formatDate(shiftDays(-3))
      },
      {
        id: 'n2',
        title: 'SumpGuard Warranty Renewal Reminder',
        tag: 'Warranty',
        body: 'Schedule extended 2-year AquaShield renewal before expiry next month.',
        pinned: false,
        updatedAt: formatDate(shiftDays(-9))
      }
    ]
  };
}

let state = loadState();
let chartInspectDay = null;
let deferredInstallPrompt = null;
let pwaAutoHideTimer = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialState();
    const parsed = JSON.parse(raw);
    return { ...buildInitialState(), ...parsed };
  } catch {
    return buildInitialState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

/* =========================================================================
   TRUE MULTI-PAGE NAVIGATION & BACK BUTTON SUPPORT
   ========================================================================= */
function goBackPage() {
  if (window.history.length > 1 && document.referrer && document.referrer.startsWith(window.location.origin)) {
    window.history.back();
  } else {
    window.location.href = 'index.html';
  }
}

/* =========================================================================
   PWA SERVICE WORKER + 7-SECOND AUTO-HIDING TOP INSTALL POPUP
   ========================================================================= */
function isStandalonePWA() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function initPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (isFeatureEnabled('pwaPopup') && !isStandalonePWA() && !sessionStorage.getItem(PWA_POPUP_SESSION_KEY)) {
      showTopInstallPopup();
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    hideTopInstallPopup();
    showToast('AquaVault App installed successfully');
    if (CURRENT_PAGE === 'privacy') render();
  });

  if (isFeatureEnabled('pwaPopup') && !isStandalonePWA() && !sessionStorage.getItem(PWA_POPUP_SESSION_KEY)) {
    setTimeout(() => {
      showTopInstallPopup();
    }, 450);
  }
}

function showTopInstallPopup(force = false) {
  const popup = document.getElementById('pwaInstallPopup');
  if (!popup) return;
  if (!force && isStandalonePWA()) return;

  sessionStorage.setItem(PWA_POPUP_SESSION_KEY, '1');

  popup.classList.remove('visible');
  void popup.offsetWidth;
  popup.classList.add('visible');

  clearTimeout(pwaAutoHideTimer);
  pwaAutoHideTimer = setTimeout(() => {
    hideTopInstallPopup();
  }, 7000);
}

function hideTopInstallPopup() {
  clearTimeout(pwaAutoHideTimer);
  const popup = document.getElementById('pwaInstallPopup');
  if (popup) popup.classList.remove('visible');
}

async function triggerPWAInstall() {
  hideTopInstallPopup();
  if (deferredInstallPrompt) {
    try {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      if (outcome === 'accepted') {
        showToast('Installing AquaVault App...');
      }
      return;
    } catch {}
  }

  if (isStandalonePWA()) {
    showToast('AquaVault is already installed as an app');
    return;
  }

  openInstallGuideModal();
}

function openInstallGuideModal() {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const modal = document.getElementById('installGuideModal');
  const body = document.getElementById('installGuideBody');
  if (!modal || !body) return;

  body.innerHTML = isIOS ? `
    <div class="install-step">
      <span class="install-step-num">1</span>
      <div>
        <div style="font-size:13.5px;font-weight:700;">Tap the Share button in Safari</div>
        <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">Located in the bottom toolbar of Safari.</div>
      </div>
    </div>
    <div class="install-step">
      <span class="install-step-num">2</span>
      <div>
        <div style="font-size:13.5px;font-weight:700;">Select "Add to Home Screen"</div>
        <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">Tap Add to launch AquaVault full-screen like a native app.</div>
      </div>
    </div>
  ` : `
    <div class="install-step">
      <span class="install-step-num">1</span>
      <div>
        <div style="font-size:13.5px;font-weight:700;">Open Chrome Menu (&vellip;)</div>
        <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">Tap the three-dot menu at the top-right corner of your browser.</div>
      </div>
    </div>
    <div class="install-step">
      <span class="install-step-num">2</span>
      <div>
        <div style="font-size:13.5px;font-weight:700;">Tap "Install app" or "Add to Home screen"</div>
        <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">AquaVault installs with its home screen icon and full offline PWA support.</div>
      </div>
    </div>
  `;

  pushModalState('install');
  modal.classList.add('open');
}

function closeInstallGuideModal(fromPopState = false) {
  const modal = document.getElementById('installGuideModal');
  if (modal && modal.classList.contains('open')) {
    modal.classList.remove('open');
    if (!fromPopState && history.state && history.state.modal === 'install') {
      history.back();
    }
  }
}

/* =========================================================================
   MODAL HISTORY STACK (BACK BUTTON CLOSES MODALS CLEANLY)
   ========================================================================= */
function pushModalState(modalName) {
  try {
    history.pushState({ modal: modalName }, '', window.location.href);
  } catch {}
}

window.addEventListener('popstate', () => {
  const cert = document.getElementById('certModal');
  const conf = document.getElementById('confirmModal');
  const inst = document.getElementById('installGuideModal');
  if (cert && cert.classList.contains('open')) cert.classList.remove('open');
  if (conf && conf.classList.contains('open')) conf.classList.remove('open');
  if (inst && inst.classList.contains('open')) inst.classList.remove('open');
});

/* =========================================================================
   THEME & TOAST
   ========================================================================= */
function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const meta = document.getElementById('meta-theme-color');
  if (meta) meta.setAttribute('content', state.theme === 'dark' ? '#06060A' : '#FFFFFF');

  const isDark = state.theme === 'dark';
  const iconHtml = isDark ? ICONS.sun : ICONS.moon;
  const topIcon = document.getElementById('topThemeIcon');
  const topLabel = document.getElementById('topThemeLabel');
  const sideIcon = document.getElementById('sidebarThemeIcon');
  const sideLabel = document.getElementById('sidebarThemeLabel');

  if (topIcon) topIcon.innerHTML = iconHtml;
  if (topLabel) topLabel.textContent = isDark ? 'Day' : 'Night';
  if (sideIcon) sideIcon.innerHTML = iconHtml;
  if (sideLabel) sideLabel.textContent = isDark ? 'Switch to Day Mode' : 'Switch to Night Mode';
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  saveState();
  applyTheme();
  if (CURRENT_PAGE === 'privacy') render();
  showToast(state.theme === 'dark' ? 'Night Mode — Obsidian & Violet' : 'Day Mode — Porcelain & Royal Purple');
}

function setThemeDirect(mode) {
  if (state.theme === mode) return;
  state.theme = mode;
  saveState();
  applyTheme();
  render();
  showToast(mode === 'dark' ? 'Switched to Night Mode' : 'Switched to Day Mode');
}

let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* =========================================================================
   SHELL INJECTION (SHARED ACROSS ALL 7 REAL HTML PAGES)
   ========================================================================= */
function mountShell() {
  const current = ROUTES.find(r => r.id === CURRENT_PAGE) || ROUTES[0];
  const isSubPage = CURRENT_PAGE !== 'home';

  document.getElementById('appRoot').innerHTML = `
    <!-- 7-SECOND AUTO-HIDING TOP PWA INSTALL POPUP -->
    <div class="pwa-install-popup" id="pwaInstallPopup" role="dialog" aria-label="Install AquaVault App">
      <div class="pwa-popup-inner">
        <div class="pwa-popup-icon"><img src="assets/icon-192.png" alt="AquaVault App Icon" /></div>
        <div class="pwa-popup-copy">
          <div class="pwa-popup-title">Install AquaVault App</div>
          <div class="pwa-popup-sub">Home screen &amp; offline PWA access</div>
        </div>
        <button class="pwa-install-cta" onclick="triggerPWAInstall()">
          ${ICONS.download} <span>Install</span>
        </button>
        <button class="pwa-install-close" onclick="hideTopInstallPopup()" aria-label="Dismiss install banner">
          ${ICONS.close}
        </button>
      </div>
      <div class="pwa-popup-timer"><div class="pwa-popup-timer-bar"></div></div>
    </div>

    <div class="app-shell">
      <aside class="sidebar" aria-label="Primary Navigation">
        <a href="index.html" class="sidebar-brand">
          <div class="brand-emblem"><img src="assets/app-icon.jpg" alt="AquaVault Crest" /></div>
          <div>
            <div class="brand-wordmark">AquaVault</div>
            <div class="brand-caption">Customer Edition</div>
          </div>
        </a>

        <nav class="sidebar-nav" id="sidebarNav"></nav>

        <div class="sidebar-footer">
          <button class="theme-pill-btn" style="width:100%;justify-content:center" onclick="toggleTheme()">
            <span id="sidebarThemeIcon"></span>
            <span id="sidebarThemeLabel">Night Mode</span>
          </button>
        </div>
      </aside>

      <div class="main-column">
        <header class="topbar">
          <div class="topbar-left">
            ${isSubPage ? `
              <button class="topbar-back-btn" onclick="goBackPage()" aria-label="Go Back" title="Back">
                ${ICONS.arrowLeft}
              </button>
            ` : `
              <a href="index.html" class="topbar-emblem topbar-mobile-only" aria-label="AquaVault Home">
                <img src="assets/app-icon.jpg" alt="AquaVault" />
              </a>
            `}
            <div class="topbar-title-group">
              <span class="topbar-brand">${isSubPage ? current.label : 'AquaVault'}</span>
              <span class="topbar-page-tag">${current.subtitle}</span>
            </div>
          </div>

          <div class="topbar-actions">
            ${isFeatureEnabled('invoice') ? `<a href="invoice.html" class="icon-circle-btn topbar-mobile-only ${CURRENT_PAGE === 'invoice' ? 'active' : ''}" aria-label="Invoice Generator" title="Colorful Invoice Generator">${ICONS.receipt}</a>` : ''}
            ${isFeatureEnabled('hub') ? `<a href="hub.html" class="icon-circle-btn topbar-mobile-only ${CURRENT_PAGE === 'hub' ? 'active' : ''}" aria-label="Apps Hub" title="New Tab — Apps Hub">${ICONS.hub}</a>` : ''}
            ${isFeatureEnabled('privacy') ? `<a href="privacy.html" class="icon-circle-btn topbar-mobile-only ${CURRENT_PAGE === 'privacy' ? 'active' : ''}" aria-label="Privacy & Settings" title="DPDP Privacy & Settings">${ICONS.privacy}</a>` : ''}
            <button class="theme-pill-btn" onclick="toggleTheme()" aria-label="Switch Day or Night Mode">
              <span id="topThemeIcon"></span>
              <span id="topThemeLabel">Night</span>
            </button>
          </div>
        </header>

        <main class="content-wrap" id="appMain"></main>
      </div>
    </div>

    <nav class="bottom-dock" id="bottomDock" aria-label="Mobile Navigation"></nav>

    <div class="modal-backdrop" id="certModal" role="dialog" aria-modal="true" aria-labelledby="certModalTitle">
      <div class="cert-modal" id="certModalContent"></div>
    </div>

    <div class="modal-backdrop" id="confirmModal" role="dialog" aria-modal="true">
      <div class="cert-modal" style="max-width:420px;padding:24px;">
        <div class="eyebrow" style="color:var(--rose);margin-bottom:6px;">DPDP Act 2023 &bull; Right to Erasure</div>
        <h3 class="serif" style="font-size:28px;margin:0 0 8px;">Erase Local Customer Data?</h3>
        <p style="font-size:13.5px;color:var(--ink-secondary);margin:0 0 20px;">
          This will permanently remove your local calculator tape, personal notes, service requests, and consent preferences from this device.
        </p>
        <div class="dual-actions">
          <button class="btn btn-outline" onclick="closeConfirmModal()">Cancel</button>
          <button class="btn btn-danger-outline" onclick="executeEraseData()">Erase All Data</button>
        </div>
      </div>
    </div>

    <div class="modal-backdrop" id="installGuideModal" role="dialog" aria-modal="true">
      <div class="cert-modal" style="max-width:430px;padding:24px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="pwa-popup-icon" style="width:38px;height:38px;"><img src="assets/icon-192.png" alt="AquaVault" /></div>
            <div>
              <div class="eyebrow" style="color:var(--primary);">Install AquaVault PWA</div>
              <h3 class="serif" style="font-size:25px;margin:0;line-height:1.1;">Add to Home Screen</h3>
            </div>
          </div>
          <button class="icon-circle-btn" onclick="closeInstallGuideModal()" aria-label="Close">${ICONS.close}</button>
        </div>
        <div id="installGuideBody"></div>
        <button class="btn btn-primary" style="width:100%;margin-top:6px;" onclick="closeInstallGuideModal()">Got It</button>
      </div>
    </div>

    <div class="toast" id="toast" role="status" aria-live="polite"></div>
  `;

  const careItems = ROUTES.filter(r => r.group === 'care' && isFeatureEnabled(r.id));
  const workItems = ROUTES.filter(r => r.group === 'work');
  document.getElementById('sidebarNav').innerHTML = `
    <div class="nav-section-label">Customer Vault</div>
    ${careItems.map(r => `
      <a href="${r.href}" class="side-btn ${CURRENT_PAGE === r.id ? 'active' : ''}">
        ${ICONS[r.icon]}
        <span>${r.fullLabel || r.label}</span>
      </a>
    `).join('')}
    <div class="nav-section-label" style="margin-top:10px;">Personal Workspace</div>
    ${workItems.filter(r => isFeatureEnabled(r.id)).map(r => `
      <a href="${r.href}" class="side-btn ${CURRENT_PAGE === r.id ? 'active' : ''}">
        ${ICONS[r.icon]}
        <span>${r.fullLabel || r.label}</span>
      </a>
    `).join('')}
  `;

  const dockItems = ROUTES.filter(r => r.dock && isFeatureEnabled(r.id));
  document.getElementById('bottomDock').innerHTML = dockItems.map(r => `
    <a href="${r.href}" class="dock-btn ${CURRENT_PAGE === r.id ? 'active' : ''}" aria-label="${r.label}">
      ${ICONS[r.icon]}
      <span>${r.label}</span>
    </a>
  `).join('');

  document.getElementById('certModal').addEventListener('click', (e) => {
    if (e.target.id === 'certModal') closeCertificate();
  });
  document.getElementById('confirmModal').addEventListener('click', (e) => {
    if (e.target.id === 'confirmModal') closeConfirmModal();
  });
  document.getElementById('installGuideModal').addEventListener('click', (e) => {
    if (e.target.id === 'installGuideModal') closeInstallGuideModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCertificate();
      closeConfirmModal();
      closeInstallGuideModal();
    }
    if (CURRENT_PAGE === 'calculator' && state.calcMode === 'standard') {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (/^[0-9.]$/.test(e.key)) calcInput(e.key);
      else if (e.key === '+') calcInput('+');
      else if (e.key === '-') calcInput('-');
      else if (e.key === '*') calcInput('×');
      else if (e.key === '/') { e.preventDefault(); calcInput('÷'); }
      else if (e.key === '%') calcInput('%');
      else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); calcInput('='); }
      else if (e.key === 'Backspace') calcInput('DEL');
    }
  });
}

/* =========================================================================
   SCULPTURAL SVG CIRCULAR COUNTDOWN RING
   ========================================================================= */
function renderCountdownRing(remainingDays, totalDays, strokeColor, size = 104, strokeWidth = 7) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = Math.max(0, Math.min(1, remainingDays / Math.max(1, totalDays)));
  const dashOffset = circumference * (1 - fraction);
  const fontSize = size >= 130 ? 34 : 24;

  return `
    <div class="ring-wrap" style="width:${size}px;height:${size}px;">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg);">
        <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="var(--surface-track)" stroke-width="${strokeWidth}" />
        <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}"
          stroke-linecap="round" stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${dashOffset.toFixed(2)}" />
      </svg>
      <div class="ring-center">
        <span class="ring-value" style="font-size:${fontSize}px;">${remainingDays}</span>
        <span class="ring-unit">Days Left</span>
      </div>
    </div>
  `;
}

/* =========================================================================
   PAGE 1: HOME / OVERVIEW
   ========================================================================= */
function renderHome() {
  const controllers = state.units.filter(u => u.type === 'controller');
  const stoppers = state.units.filter(u => u.type === 'stopper');
  const activeCount = state.units.filter(u => getWarrantyMetrics(u).remainingDays > 0).length;
  const primaryUnit = state.units.find(u => u.id === state.selectedUnitId) || state.units[0];
  const pm = getWarrantyMetrics(primaryUnit);

  return `
    <div class="page-view">
      <section class="hero-showcase">
        <img class="hero-bg" src="assets/hero-controller.jpg" alt="AquaVault Smart Water Level Controller and Water Stopper" />
        <div class="hero-scrim"></div>

        <div class="hero-top">
          <span class="hero-chip mono">${state.customer.accountId}</span>
          <span class="hero-chip hero-chip-shield">
            <span class="badge-dot"></span> ${activeCount} Units Shielded
          </span>
        </div>

        <div class="hero-bottom">
          <h1 class="hero-title">Precision Water<br/>Protection</h1>
          <p class="hero-desc">
            Day-by-day decreasing warranty telemetry, verified GST digital bills, one-click engineer dispatch, and synced workspace tools.
          </p>
          <div class="hero-actions">
            <a href="warranty.html" class="hero-btn-light">
              ${ICONS.warranty}
              <span>Warranty Graph</span>
            </a>
            <button class="hero-btn-glass" onclick="openCertificate('${primaryUnit.id}')">
              ${ICONS.receipt}
              <span>Digital Bill</span>
            </button>
          </div>
        </div>
      </section>

      <div class="kpi-grid">
        <a href="devices.html" class="kpi-card">
          <div class="kpi-head">
            <span class="icon-badge">${ICONS.gauge}</span>
            <span style="color:var(--ink-tertiary)">${ICONS.arrowRight}</span>
          </div>
          <div>
            <div class="kpi-num">${controllers.length}</div>
            <div class="kpi-label">Water Level Controllers</div>
            <div class="kpi-sub">Overhead &amp; Sump</div>
          </div>
        </a>

        <a href="devices.html" class="kpi-card">
          <div class="kpi-head">
            <span class="icon-badge">${ICONS.droplet}</span>
            <span style="color:var(--ink-tertiary)">${ICONS.arrowRight}</span>
          </div>
          <div>
            <div class="kpi-num">${stoppers.length}</div>
            <div class="kpi-label">Water Stoppers</div>
            <div class="kpi-sub">Brass &amp; Cutoff Valves</div>
          </div>
        </a>
      </div>

      <div class="spotlight-card">
        <div class="spotlight-body">
          <div class="spotlight-info">
            <div class="eyebrow" style="color:var(--primary);">Primary Warranty Shield</div>
            <div class="spotlight-model">${escapeHtml(primaryUnit.model)}</div>
            <div class="spotlight-meta">${escapeHtml(primaryUnit.location)} &middot; Expires ${formatDate(primaryUnit.expiryDate)}</div>
            <span class="badge ${pm.badgeClass}">
              <span class="badge-dot"></span> ${pm.statusLabel}
            </span>
          </div>
          ${renderCountdownRing(pm.remainingDays, pm.totalDays, pm.strokeColor, 98, 7)}
        </div>
        <a href="warranty.html" class="spotlight-footer">
          <span>Inspect Decreasing Day-by-Day Graph</span>
          ${ICONS.arrowRight}
        </a>
      </div>

      <div class="section-head">
        <h2 class="section-title">Personal Workspace</h2>
      </div>

      ${isFeatureEnabled('invoice') ? `
      <a href="invoice.html" class="invoice-promo-card">
        <div style="display:flex;align-items:center;gap:12px;min-width:0;">
          <span class="icon-badge" style="background:rgba(255,255,255,0.18);color:#FFFFFF;">${ICONS.receipt}</span>
          <div style="min-width:0;">
            <div style="font-size:15px;font-weight:800;letter-spacing:-0.015em;">Colorful Invoice Generator</div>
            <div style="font-size:12px;color:rgba(243,239,253,0.86);margin-top:2px;">6 luxury themes &middot; PDF, HD Image &amp; Google Sheets CSV</div>
          </div>
        </div>
        <span style="flex-shrink:0;color:#FFFFFF;">${ICONS.arrowRight}</span>
      </a>
      ` : ''}

      <div class="bento-grid">
        ${isFeatureEnabled('calculator') ? `
        <a href="calculator.html" class="bento-card">
          <span class="icon-badge">${ICONS.calc}</span>
          <div>
            <div class="bento-title">Hisab-Kitab</div>
            <p class="bento-sub">Standard, GST billing, split &amp; running tape</p>
          </div>
        </a>
        ` : ''}

        ${isFeatureEnabled('notes') ? `
        <a href="notes.html" class="bento-card">
          <span class="icon-badge">${ICONS.notes}</span>
          <div>
            <div class="bento-title">Notepad Sync</div>
            <p class="bento-sub">${state.notes.length} note(s) &middot; Gmail &amp; Drive backup</p>
          </div>
        </a>
        ` : ''}

        ${isFeatureEnabled('hub') ? `
        <a href="hub.html" class="bento-card">
          <span class="icon-badge">${ICONS.hub}</span>
          <div>
            <div class="bento-title">New Tab Hub</div>
            <p class="bento-sub">1-click access to brand apps &amp; portals</p>
          </div>
        </a>
        ` : ''}

        ${isFeatureEnabled('privacy') ? `
        <a href="privacy.html" class="bento-card">
          <span class="icon-badge">${ICONS.privacy}</span>
          <div>
            <div class="bento-title">DPDP &amp; Theme</div>
            <p class="bento-sub">Consent controls, JSON export &amp; Night mode</p>
          </div>
        </a>
        ` : ''}
      </div>

      <div class="card" style="margin-top:14px;padding:15px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div style="display:flex;align-items:center;gap:11px;min-width:0;">
          <span class="icon-badge" style="background:var(--emerald-soft);color:var(--emerald);">${ICONS.warranty}</span>
          <div style="min-width:0;">
            <div style="font-size:13px;font-weight:700;">DPDP Act 2023 Compliant</div>
            <div style="font-size:12px;color:var(--ink-secondary);">Zero third-party tracking. Full export &amp; erasure control.</div>
          </div>
        </div>
        <a href="privacy.html" class="btn btn-outline btn-sm">Manage</a>
      </div>
    </div>
  `;
}

/* =========================================================================
   PAGE 2: ACCOUNT & WARRANTY DASHBOARD (CRISP ASPECT-RATIO SVG + SMOOTH SCRUB)
   ========================================================================= */
const CHART_W = 360, CHART_H = 190;
const CHART_PAD_L = 40, CHART_PAD_R = 14, CHART_PAD_T = 16, CHART_PAD_B = 30;

function selectWarrantyUnit(id) {
  state.selectedUnitId = id;
  chartInspectDay = null;
  saveState();
  render();
}

function renderWarranty() {
  const unit = state.units.find(u => u.id === state.selectedUnitId) || state.units[0];
  const m = getWarrantyMetrics(unit);
  const activeDay = chartInspectDay !== null ? chartInspectDay : m.elapsedDays;
  const inspRemaining = Math.max(0, m.totalDays - activeDay);
  const inspDateObj = new Date(parseISO(unit.installDate).getTime() + activeDay * DAY_MS);
  const inspDateLabel = inspDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const isToday = activeDay === m.elapsedDays;

  const plotW = CHART_W - CHART_PAD_L - CHART_PAD_R;
  const plotH = CHART_H - CHART_PAD_T - CHART_PAD_B;

  const xForDay = (day) => CHART_PAD_L + (day / Math.max(1, m.totalDays)) * plotW;
  const yForRem = (rem) => CHART_PAD_T + (1 - rem / Math.max(1, m.totalDays)) * plotH;

  const startX = xForDay(0), startY = yForRem(m.totalDays);
  const todayX = xForDay(m.elapsedDays), todayY = yForRem(m.remainingDays);
  const endX = xForDay(m.totalDays), endY = yForRem(0);
  const inspX = xForDay(activeDay), inspY = yForRem(inspRemaining);
  const midDays = Math.round(m.totalDays / 2);
  const midY = yForRem(midDays);
  const baseY = yForRem(0);

  return `
    <div class="page-view">
      <div class="page-header">
        <div class="page-eyebrow">Customer Protection Vault</div>
        <h1 class="page-h1">Warranty Dashboard</h1>
        <p class="page-sub">Live day-by-day countdown for your installed AquaVault controllers and water stoppers.</p>
      </div>

      <div class="unit-strip" role="tablist" aria-label="Installed Devices">
        ${state.units.map(u => {
          const um = getWarrantyMetrics(u);
          const isSel = u.id === unit.id;
          return `
            <button class="unit-pill-card ${isSel ? 'active' : ''}" role="tab" aria-selected="${isSel}" onclick="selectWarrantyUnit('${u.id}')">
              <div class="unit-pill-name">${escapeHtml(u.model)}</div>
              <div class="unit-pill-loc">${escapeHtml(u.location)}</div>
              <div class="unit-pill-foot">
                <span class="mono" style="color:${um.strokeColor};">${um.remainingDays}d left</span>
                <span style="color:var(--ink-tertiary);">${u.type === 'controller' ? 'Controller' : 'Stopper'}</span>
              </div>
            </button>
          `;
        }).join('')}
      </div>

      <div class="card">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:16px;">
          <div style="min-width:0;">
            <div class="eyebrow mono" style="color:var(--primary);">${escapeHtml(unit.serial)}</div>
            <h2 style="font-size:18px;font-weight:700;letter-spacing:-0.02em;margin:4px 0 3px;">${escapeHtml(unit.model)}</h2>
            <div style="font-size:12.5px;color:var(--ink-secondary);display:flex;align-items:center;gap:5px;">
              ${ICONS.pin} <span>${escapeHtml(unit.location)}</span>
            </div>
          </div>
          <span class="badge ${m.badgeClass}">
            <span class="badge-dot"></span> ${m.statusLabel}
          </span>
        </div>

        <div class="telemetry-layout">
          <div style="display:flex;justify-content:center;">
            ${renderCountdownRing(m.remainingDays, m.totalDays, m.strokeColor, 144, 9)}
          </div>

          <div class="spec-grid">
            <div class="spec-tile">
              <div class="spec-k">Installed</div>
              <div class="spec-v">${formatDate(unit.installDate)}</div>
            </div>
            <div class="spec-tile">
              <div class="spec-k">Expires</div>
              <div class="spec-v">${formatDate(unit.expiryDate)}</div>
            </div>
            <div class="spec-tile">
              <div class="spec-k">Total Coverage</div>
              <div class="spec-v">${m.totalDays} Days</div>
            </div>
            <div class="spec-tile">
              <div class="spec-k">Days Elapsed</div>
              <div class="spec-v">${m.elapsedDays} Days</div>
            </div>
          </div>
        </div>

        <div class="dual-actions" style="margin-top:16px;">
          <button class="btn btn-primary" onclick="openCertificate('${unit.id}')">
            ${ICONS.receipt} <span>Digital Bill</span>
          </button>
          <button class="btn btn-outline" onclick="openServiceForUnit('${unit.id}')">
            ${ICONS.wrench} <span>Book Service</span>
          </button>
        </div>
      </div>

      <div class="card chart-card">
        <div class="chart-header">
          <div>
            <div class="eyebrow" style="color:var(--primary);">1-Day Resolution Telemetry</div>
            <h3 style="font-size:16.5px;font-weight:700;margin:3px 0 2px;letter-spacing:-0.015em;">Day-by-Day Decreasing Trajectory</h3>
            <p style="font-size:12px;color:var(--ink-secondary);margin:0;">Slide finger or tap along the graph to inspect any day.</p>
          </div>
          <div id="chartResetWrap">
            ${!isToday ? `<button class="btn btn-soft btn-sm" onclick="resetChartToday()">Reset to Today</button>` : `<span class="badge badge-violet">Today: ${m.remainingDays}d</span>`}
          </div>
        </div>

        <div class="chart-inspector">
          <div>
            <div class="insp-label" id="inspLabel">${isToday ? 'Today (Live)' : 'Inspected'}</div>
            <div class="insp-val" id="inspDate">${inspDateLabel}</div>
          </div>
          <div>
            <div class="insp-label">Remaining</div>
            <div class="insp-val" id="inspRem" style="color:var(--primary);">${inspRemaining} days</div>
          </div>
          <div>
            <div class="insp-label">Coverage</div>
            <div class="insp-val" id="inspPct">${Math.round((inspRemaining / m.totalDays) * 100)}%</div>
          </div>
        </div>

        <div class="chart-stage" id="warrantyChartStage" data-total="${m.totalDays}" data-elapsed="${m.elapsedDays}" data-install="${unit.installDate}">
          <svg class="chart-svg" id="warrantyChartSvg" viewBox="0 0 ${CHART_W} ${CHART_H}" preserveAspectRatio="xMidYMid meet" aria-label="Decreasing Warranty Countdown Graph">
            <defs>
              <linearGradient id="remFillGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.30" />
                <stop offset="100%" stop-color="var(--primary)" stop-opacity="0.01" />
              </linearGradient>
            </defs>

            <line x1="${CHART_PAD_L}" y1="${startY}" x2="${CHART_W - CHART_PAD_R}" y2="${startY}" stroke="var(--chart-grid)" stroke-dasharray="3 4" />
            <text x="${CHART_PAD_L - 6}" y="${startY + 3}" text-anchor="end" fill="var(--ink-tertiary)" font-size="9.5" font-family="JetBrains Mono, monospace">${m.totalDays}d</text>

            <line x1="${CHART_PAD_L}" y1="${midY}" x2="${CHART_W - CHART_PAD_R}" y2="${midY}" stroke="var(--chart-grid)" stroke-dasharray="3 4" />
            <text x="${CHART_PAD_L - 6}" y="${midY + 3}" text-anchor="end" fill="var(--ink-tertiary)" font-size="9.5" font-family="JetBrains Mono, monospace">${midDays}d</text>

            <line x1="${CHART_PAD_L}" y1="${baseY}" x2="${CHART_W - CHART_PAD_R}" y2="${baseY}" stroke="var(--border-strong)" />
            <text x="${CHART_PAD_L - 6}" y="${baseY + 3}" text-anchor="end" fill="var(--ink-tertiary)" font-size="9.5" font-family="JetBrains Mono, monospace">0d</text>

            <path d="M ${todayX} ${todayY} L ${endX} ${endY} L ${todayX} ${baseY} Z" fill="url(#remFillGrad)" />
            <line x1="${startX}" y1="${startY}" x2="${todayX}" y2="${todayY}" stroke="var(--ink-tertiary)" stroke-width="2" stroke-dasharray="4 4" opacity="0.6" />
            <line x1="${todayX}" y1="${todayY}" x2="${endX}" y2="${endY}" stroke="var(--primary)" stroke-width="2.8" stroke-linecap="round" />

            <line id="scrubberLine" x1="${inspX}" y1="${CHART_PAD_T}" x2="${inspX}" y2="${baseY}" stroke="var(--primary)" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.75" />

            <circle cx="${startX}" cy="${startY}" r="3.8" fill="var(--surface)" stroke="var(--ink-tertiary)" stroke-width="1.8" />
            <circle cx="${endX}" cy="${endY}" r="3.8" fill="var(--surface)" stroke="var(--rose)" stroke-width="1.8" />
            <circle cx="${todayX}" cy="${todayY}" r="8" fill="var(--primary)" opacity="0.18" />
            <circle cx="${todayX}" cy="${todayY}" r="4.5" fill="var(--primary)" stroke="var(--surface)" stroke-width="1.8" />
            <circle id="scrubberDot" cx="${inspX}" cy="${inspY}" r="${isToday ? 0 : 5.5}" fill="var(--surface)" stroke="var(--primary)" stroke-width="2.2" />

            <text x="${startX}" y="${CHART_H - 7}" text-anchor="start" fill="var(--ink-tertiary)" font-size="9.5" font-family="Plus Jakarta Sans, sans-serif" font-weight="600">Installed ${formatDate(unit.installDate)}</text>
            <text x="${endX}" y="${CHART_H - 7}" text-anchor="end" fill="var(--ink-tertiary)" font-size="9.5" font-family="Plus Jakarta Sans, sans-serif" font-weight="600">Expiry ${formatDate(unit.expiryDate)}</text>
          </svg>
        </div>
      </div>
    </div>
  `;
}

function updateChartScrubberDOM(day) {
  const stage = document.getElementById('warrantyChartStage');
  if (!stage) return;
  const totalDays = Number(stage.dataset.total || 365);
  const elapsedDays = Number(stage.dataset.elapsed || 0);
  const installDate = stage.dataset.install;

  chartInspectDay = day;
  const rem = Math.max(0, totalDays - day);
  const pct = Math.round((rem / Math.max(1, totalDays)) * 100);
  const isToday = day === elapsedDays;
  const dObj = new Date(parseISO(installDate).getTime() + day * DAY_MS);
  const dLabel = dObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const plotW = CHART_W - CHART_PAD_L - CHART_PAD_R;
  const plotH = CHART_H - CHART_PAD_T - CHART_PAD_B;
  const x = CHART_PAD_L + (day / Math.max(1, totalDays)) * plotW;
  const y = CHART_PAD_T + (1 - rem / Math.max(1, totalDays)) * plotH;

  const line = document.getElementById('scrubberLine');
  const dot = document.getElementById('scrubberDot');
  if (line) { line.setAttribute('x1', x); line.setAttribute('x2', x); }
  if (dot) { dot.setAttribute('cx', x); dot.setAttribute('cy', y); dot.setAttribute('r', isToday ? '0' : '5.5'); }

  const lbl = document.getElementById('inspLabel');
  const dt = document.getElementById('inspDate');
  const rm = document.getElementById('inspRem');
  const pc = document.getElementById('inspPct');
  const rw = document.getElementById('chartResetWrap');
  if (lbl) lbl.textContent = isToday ? 'Today (Live)' : 'Inspected';
  if (dt) dt.textContent = dLabel;
  if (rm) rm.textContent = `${rem} days`;
  if (pc) pc.textContent = `${pct}%`;
  if (rw) {
    rw.innerHTML = !isToday
      ? `<button class="btn btn-soft btn-sm" onclick="resetChartToday()">Reset to Today</button>`
      : `<span class="badge badge-violet">Today: ${totalDays - elapsedDays}d</span>`;
  }
}

function bindChartInteraction() {
  const stage = document.getElementById('warrantyChartStage');
  if (!stage) return;
  const totalDays = Number(stage.dataset.total || 365);

  const handlePointer = (clientX) => {
    const rect = stage.getBoundingClientRect();
    const padLeftFrac = CHART_PAD_L / CHART_W;
    const padRightFrac = CHART_PAD_R / CHART_W;
    const rel = (clientX - rect.left) / rect.width;
    const norm = (rel - padLeftFrac) / (1 - padLeftFrac - padRightFrac);
    const clamped = Math.max(0, Math.min(1, norm));
    const day = Math.round(clamped * totalDays);
    updateChartScrubberDOM(day);
  };

  stage.addEventListener('pointerdown', (e) => {
    try { stage.setPointerCapture(e.pointerId); } catch {}
    handlePointer(e.clientX);
  });
  stage.addEventListener('pointermove', (e) => {
    if (e.buttons === 1 || e.pointerType === 'touch') handlePointer(e.clientX);
  });
}

function resetChartToday() {
  const stage = document.getElementById('warrantyChartStage');
  const elapsedDays = Number(stage?.dataset.elapsed || 0);
  chartInspectDay = null;
  updateChartScrubberDOM(elapsedDays);
}

/* =========================================================================
   PAGE 3: DEVICES, BILLS & SERVICE
   ========================================================================= */
function setDevicesTab(tab) {
  state.devicesSubTab = tab;
  saveState();
  render();
}

function openServiceForUnit(unitId) {
  state.selectedUnitId = unitId;
  state.devicesSubTab = 'service';
  saveState();
  if (CURRENT_PAGE === 'devices') {
    render();
  } else {
    window.location.href = 'devices.html';
  }
}

function renderDevices() {
  const tab = state.devicesSubTab || 'units';
  const controllers = state.units.filter(u => u.type === 'controller').length;
  const stoppers = state.units.filter(u => u.type === 'stopper').length;

  let contentHtml = '';
  if (tab === 'units') {
    contentHtml = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
        <span class="badge badge-violet">${controllers} Water Level Controllers</span>
        <span class="badge badge-violet">${stoppers} Water Stoppers</span>
      </div>

      <div class="device-list">
        ${state.units.map(u => {
          const m = getWarrantyMetrics(u);
          return `
            <div class="device-card">
              <div class="device-top">
                <div style="display:flex;gap:11px;min-width:0;">
                  <span class="icon-badge">${u.type === 'controller' ? ICONS.gauge : ICONS.droplet}</span>
                  <div style="min-width:0;">
                    <h3 class="device-title">${escapeHtml(u.model)}</h3>
                    <div class="device-meta">${ICONS.pin} <span>${escapeHtml(u.location)}</span></div>
                  </div>
                </div>
              </div>

              <div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;font-size:12px;gap:8px;">
                  <span class="mono" style="color:var(--ink-tertiary);overflow:hidden;text-overflow:ellipsis;">${escapeHtml(u.serial)}</span>
                  <span class="badge ${m.badgeClass}" style="padding:3px 9px;font-size:11px;">
                    <span class="badge-dot"></span> ${m.remainingDays}d left
                  </span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width:${m.pctRemaining}%;background:${m.strokeColor};"></div>
                </div>
              </div>

              <div class="dual-actions">
                <button class="btn btn-outline btn-sm" onclick="openCertificate('${u.id}')">
                  ${ICONS.receipt} <span>Digital Bill</span>
                </button>
                <button class="btn btn-soft btn-sm" onclick="openServiceForUnit('${u.id}')">
                  ${ICONS.wrench} <span>Book Service</span>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else if (tab === 'bills') {
    contentHtml = `
      <a href="invoice.html" class="invoice-promo-card" style="margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:11px;min-width:0;">
          <span class="icon-badge" style="background:rgba(255,255,255,0.18);color:#FFFFFF;">${ICONS.receipt}</span>
          <div style="min-width:0;">
            <div style="font-size:14px;font-weight:800;">Create Custom Colorful Invoice</div>
            <div style="font-size:11.5px;color:rgba(243,239,253,0.85);">Download PDF, PNG Image &amp; Google Sheets CSV</div>
          </div>
        </div>
        <span style="flex-shrink:0;color:#FFFFFF;">${ICONS.arrowRight}</span>
      </a>
    ` + state.units.map(u => {
      const total = u.basePrice * (1 + u.gstRate / 100);
      return `
        <div class="bill-row">
          <div style="display:flex;align-items:center;gap:11px;min-width:0;flex:1;">
            <span class="icon-badge">${ICONS.receipt}</span>
            <div style="min-width:0;">
              <div style="font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(u.model)}</div>
              <div class="mono" style="font-size:11px;color:var(--ink-tertiary);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(u.invoiceNo)} &middot; ${formatDate(u.installDate)}</div>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div class="mono" style="font-size:14px;font-weight:700;margin-bottom:6px;">${formatINR(total)}</div>
            <button class="btn btn-soft btn-sm" onclick="openCertificate('${u.id}')">Certificate</button>
          </div>
        </div>
      `;
    }).join('');
  } else {
    contentHtml = `
      <div class="card" style="margin-bottom:16px;">
        <div class="eyebrow" style="color:var(--primary);margin-bottom:4px;">One-Click Technician Dispatch</div>
        <h3 style="font-size:18px;font-weight:700;margin:0 0 14px;">Request Certified Service</h3>
        <form onsubmit="submitServiceRequest(event)">
          <div style="margin-bottom:12px;">
            <label class="field-label" for="srvUnit">Select Installed Unit</label>
            <select class="select" id="srvUnit">
              ${state.units.map(u => `<option value="${u.id}" ${u.id === state.selectedUnitId ? 'selected' : ''}>${escapeHtml(u.model)} (${escapeHtml(u.location)})</option>`).join('')}
            </select>
          </div>
          <div style="margin-bottom:12px;">
            <label class="field-label" for="srvIssue">Service Requirement</label>
            <select class="select" id="srvIssue">
              <option>Ultrasonic / Float Sensor Calibration</option>
              <option>Water Stopper Valve Inspection</option>
              <option>Auto-Cutoff Relay Diagnostic</option>
              <option>Extended Warranty Shield Renewal</option>
              <option>Preventive Annual Maintenance</option>
            </select>
          </div>
          <div style="margin-bottom:14px;">
            <label class="field-label" for="srvNotes">Additional Details (Optional)</label>
            <textarea class="textarea" id="srvNotes" style="min-height:80px;" placeholder="Preferred visit slot or observations..."></textarea>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;">
            ${ICONS.wrench} <span>Submit Service Request</span>
          </button>
        </form>
      </div>

      <div class="section-head"><h3 class="section-title">Service History (${state.tickets.length})</h3></div>
      ${state.tickets.map(t => {
        const bClass = t.status === 'Resolved' ? 'badge-emerald' : t.status === 'Scheduled' ? 'badge-violet' : 'badge-amber';
        return `
          <div class="card" style="padding:15px;margin-bottom:10px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px;">
              <span class="mono" style="font-size:12px;font-weight:700;color:var(--primary);">${escapeHtml(t.id)}</span>
              <span class="badge ${bClass}"><span class="badge-dot"></span> ${escapeHtml(t.status)}</span>
            </div>
            <div style="font-size:14.5px;font-weight:700;">${escapeHtml(t.issue)}</div>
            <div style="font-size:12.5px;color:var(--ink-secondary);margin-top:2px;">${escapeHtml(t.unitName)} &middot; ${escapeHtml(t.date)}</div>
            ${t.notes ? `<div style="font-size:12.5px;color:var(--ink-tertiary);margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">${escapeHtml(t.notes)}</div>` : ''}
          </div>
        `;
      }).join('')}
    `;
  }

  return `
    <div class="page-view">
      <div class="page-header">
        <div class="page-eyebrow">Hardware &amp; Care</div>
        <h1 class="page-h1">Devices, Bills &amp; Service</h1>
        <p class="page-sub">Inspect every installed unit, download official GST warranty certificates, or request an engineer.</p>
      </div>

      <div class="segmented" role="tablist">
        <button class="seg-btn ${tab === 'units' ? 'active' : ''}" onclick="setDevicesTab('units')">Units (${state.units.length})</button>
        <button class="seg-btn ${tab === 'bills' ? 'active' : ''}" onclick="setDevicesTab('bills')">Digital Bills</button>
        <button class="seg-btn ${tab === 'service' ? 'active' : ''}" onclick="setDevicesTab('service')">Service (${state.tickets.length})</button>
      </div>

      ${contentHtml}
    </div>
  `;
}

function submitServiceRequest(e) {
  e.preventDefault();
  const unitId = document.getElementById('srvUnit').value;
  const issue = document.getElementById('srvIssue').value;
  const notes = document.getElementById('srvNotes').value.trim();
  const unit = state.units.find(u => u.id === unitId) || state.units[0];

  const ticket = {
    id: 'SRV-' + Math.floor(1000 + Math.random() * 9000),
    unitId: unit.id,
    unitName: unit.model,
    issue,
    notes,
    status: 'Requested',
    date: formatDate(shiftDays(0))
  };
  state.tickets.unshift(ticket);
  saveState();
  render();
  showToast(`Service request ${ticket.id} registered`);
}

/* =========================================================================
   DIGITAL WARRANTY CERTIFICATE & GST BILL MODAL
   ========================================================================= */
function openCertificate(unitId) {
  const u = state.units.find(x => x.id === unitId) || state.units[0];
  const m = getWarrantyMetrics(u);
  const gst = u.basePrice * (u.gstRate / 100);
  const halfGst = gst / 2;
  const grandTotal = u.basePrice + gst;

  document.getElementById('certModalContent').innerHTML = `
    <div class="cert-banner">
      <img src="assets/crystal-water.jpg" alt="" />
      <div class="cert-banner-scrim"></div>
      <div class="cert-banner-inner">
        <div>
          <div class="eyebrow" style="color:#DDD6FE;">Official GST Bill &amp; Warranty Certificate</div>
          <h2 class="serif" id="certModalTitle" style="font-size:30px;margin:4px 0 2px;line-height:1.1;color:#FFFFFF;">AquaVault Shield</h2>
          <div class="mono" style="font-size:11.5px;color:#C4B5FD;">${escapeHtml(u.invoiceNo)}</div>
        </div>
        <button class="icon-circle-btn no-print" style="background:rgba(255,255,255,0.12);border-color:rgba(255,255,255,0.2);color:#FFFFFF;" onclick="closeCertificate()" aria-label="Close">
          ${ICONS.close}
        </button>
      </div>
    </div>

    <div class="cert-body">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;">
        <div style="min-width:0;">
          <div style="font-size:15px;font-weight:700;">${escapeHtml(u.model)}</div>
          <div style="font-size:12px;color:var(--ink-secondary);">${escapeHtml(state.customer.name)} &middot; ${escapeHtml(state.customer.city)}</div>
        </div>
        <span class="badge ${m.badgeClass}"><span class="badge-dot"></span> ${m.remainingDays}d Left</span>
      </div>

      <div class="spec-grid" style="margin-bottom:14px;">
        <div class="spec-tile">
          <div class="spec-k">Serial Number</div>
          <div class="spec-v" style="font-size:12px;">${escapeHtml(u.serial)}</div>
        </div>
        <div class="spec-tile">
          <div class="spec-k">Location</div>
          <div class="spec-v" style="font-size:12px;font-family:inherit;">${escapeHtml(u.location)}</div>
        </div>
        <div class="spec-tile">
          <div class="spec-k">Installed On</div>
          <div class="spec-v" style="font-size:12px;">${formatDate(u.installDate)}</div>
        </div>
        <div class="spec-tile">
          <div class="spec-k">Warranty Expiry</div>
          <div class="spec-v" style="font-size:12px;">${formatDate(u.expiryDate)}</div>
        </div>
      </div>

      <table class="cert-table">
        <tr><td style="color:var(--ink-secondary);">Hardware Taxable Value</td><td>${formatINR(u.basePrice)}</td></tr>
        <tr><td style="color:var(--ink-secondary);">CGST (${u.gstRate / 2}%)</td><td>${formatINR(halfGst)}</td></tr>
        <tr><td style="color:var(--ink-secondary);">SGST (${u.gstRate / 2}%)</td><td>${formatINR(halfGst)}</td></tr>
        <tr class="total-row"><td>Grand Total (Paid)</td><td>${formatINR(grandTotal)}</td></tr>
      </table>

      <div class="dual-actions no-print" style="margin-top:16px;">
        <button class="btn btn-primary" onclick="window.print()">
          ${ICONS.printer} <span>Print / PDF</span>
        </button>
        <button class="btn btn-outline" onclick="downloadReceipt('${u.id}')">
          ${ICONS.download} <span>Download</span>
        </button>
      </div>
    </div>
  `;

  pushModalState('cert');
  document.getElementById('certModal').classList.add('open');
}

function closeCertificate() {
  const modal = document.getElementById('certModal');
  if (modal && modal.classList.contains('open')) {
    modal.classList.remove('open');
    if (history.state && history.state.modal === 'cert') history.back();
  }
}

function downloadReceipt(unitId) {
  const u = state.units.find(x => x.id === unitId) || state.units[0];
  const m = getWarrantyMetrics(u);
  const gst = u.basePrice * (u.gstRate / 100);
  const text = [
    'AQUAVAULT — OFFICIAL WARRANTY CERTIFICATE & GST BILL',
    '====================================================',
    `Invoice No:      ${u.invoiceNo}`,
    `Customer:        ${state.customer.name} (${state.customer.accountId})`,
    `Product:         ${u.model}`,
    `Serial Number:   ${u.serial}`,
    `Location:        ${u.location}`,
    `Installed Date:  ${formatDate(u.installDate)}`,
    `Expiry Date:     ${formatDate(u.expiryDate)}`,
    `Remaining Days:  ${m.remainingDays} of ${m.totalDays} days (${m.statusLabel})`,
    '----------------------------------------------------',
    `Taxable Value:   ${formatINR(u.basePrice)}`,
    `GST (${u.gstRate}%):       ${formatINR(gst)}`,
    `Grand Total:     ${formatINR(u.basePrice + gst)}`,
    '===================================================='
  ].join('\n');
  triggerDownload(`${u.invoiceNo}.txt`, text, 'text/plain');
  showToast('Digital bill downloaded');
}

/* =========================================================================
   PAGE 4: HISAB-KITAB CALCULATOR (VERIFIED MATH & PERCENTAGE LOGIC)
   ========================================================================= */
function setCalcMode(mode) {
  state.calcMode = mode;
  saveState();
  render();
}

function evalSafeArithmetic(exprStr) {
  const jsExpr = exprStr.replace(/×/g, '*').replace(/÷/g, '/').trim();
  if (!jsExpr || !/^[0-9+\-*/.()\s]+$/.test(jsExpr)) return { error: 'Invalid expression' };
  try {
    const val = Function('"use strict";return (' + jsExpr + ')')();
    if (val === Infinity || val === -Infinity || Number.isNaN(val)) {
      return { error: 'Cannot divide by 0' };
    }
    return { value: Math.round(val * 10000) / 10000 };
  } catch {
    return { error: 'Invalid expression' };
  }
}

function calcInput(key) {
  if (key === 'C') {
    state.calcDisplay = '0';
    state.calcExpr = '';
    state.calcJustEvaluated = false;
    state.calcFreshOperand = true;
  } else if (key === 'DEL') {
    if (state.calcJustEvaluated) {
      state.calcDisplay = '0';
      state.calcExpr = '';
      state.calcJustEvaluated = false;
      state.calcFreshOperand = true;
    } else {
      state.calcDisplay = state.calcDisplay.length > 1 ? state.calcDisplay.slice(0, -1) : '0';
      if (state.calcDisplay === '0') state.calcFreshOperand = true;
    }
  } else if (key === '%') {
    const cur = parseFloat(state.calcDisplay) || 0;
    const trimmed = state.calcExpr.trim();
    // Smart percentage: "1000 + 18%" -> 18% of 1000 = 180; otherwise cur / 100
    if ((trimmed.endsWith('+') || trimmed.endsWith('-')) && !state.calcJustEvaluated) {
      const baseRes = evalSafeArithmetic(trimmed.slice(0, -1));
      if (!baseRes.error) {
        state.calcDisplay = String(Math.round((baseRes.value * cur / 100) * 10000) / 10000);
      } else {
        state.calcDisplay = String(Math.round((cur / 100) * 10000) / 10000);
      }
    } else {
      state.calcDisplay = String(Math.round((cur / 100) * 10000) / 10000);
    }
    state.calcFreshOperand = false;
    state.calcJustEvaluated = false;
  } else if (['+', '-', '×', '÷'].includes(key)) {
    if (state.calcJustEvaluated) {
      state.calcExpr = state.calcDisplay + ' ' + key + ' ';
      state.calcDisplay = '0';
      state.calcJustEvaluated = false;
      state.calcFreshOperand = true;
    } else if (state.calcFreshOperand && state.calcExpr.trim().length > 0 && /[+\-×÷]$/.test(state.calcExpr.trim())) {
      // Replace consecutive trailing operator cleanly
      state.calcExpr = state.calcExpr.trim().slice(0, -1) + key + ' ';
    } else {
      state.calcExpr = state.calcExpr + state.calcDisplay + ' ' + key + ' ';
      state.calcDisplay = '0';
      state.calcFreshOperand = true;
    }
  } else if (key === '=') {
    if (state.calcJustEvaluated) return;
    if (!state.calcExpr.trim()) return;
    const full = (state.calcExpr + state.calcDisplay).trim();
    const res = evalSafeArithmetic(full);
    if (res.error) {
      showToast(res.error);
      return;
    }
    state.tape.unshift({
      id: 't' + Date.now(),
      label: 'Standard Calculation',
      expr: full,
      result: res.value,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    });
    state.calcExpr = full + ' =';
    state.calcDisplay = String(res.value);
    state.calcJustEvaluated = true;
    state.calcFreshOperand = true;
  } else {
    // Digits, '00', or '.'
    if (state.calcJustEvaluated) {
      if (key === '.') state.calcDisplay = '0.';
      else if (key === '00') state.calcDisplay = '0';
      else state.calcDisplay = key;
      state.calcExpr = '';
      state.calcJustEvaluated = false;
      state.calcFreshOperand = state.calcDisplay === '0';
    } else if (key === '.') {
      if (!state.calcDisplay.includes('.')) {
        state.calcDisplay += '.';
        state.calcFreshOperand = false;
      }
    } else if (key === '00') {
      if (state.calcDisplay !== '0') {
        state.calcDisplay += '00';
      }
      state.calcFreshOperand = false;
    } else {
      if (state.calcDisplay === '0') {
        state.calcDisplay = key;
      } else if (state.calcDisplay.length < 15) {
        state.calcDisplay += key;
      }
      state.calcFreshOperand = false;
    }
  }
  saveState();
  render();
}

function saveSpecialCalc(mode) {
  let label = '', expr = '', result = 0;
  if (mode === 'gst') {
    const qty = Math.max(0, parseFloat(document.getElementById('cQty')?.value) || 0);
    const rate = Math.max(0, parseFloat(document.getElementById('cRate')?.value) || 0);
    const gst = Math.max(0, parseFloat(document.getElementById('cGst')?.value) || 0);
    const sub = qty * rate;
    result = Math.round((sub + sub * gst / 100) * 100) / 100;
    if (result <= 0) { showToast('Enter quantity and rate above 0'); return; }
    label = document.getElementById('cGstLabel')?.value.trim() || 'Qty × Rate + GST';
    expr = `${qty} × ${rate} + ${gst}% GST`;
  } else if (mode === 'split') {
    const total = Math.max(0, parseFloat(document.getElementById('cSplitTotal')?.value) || 0);
    const people = Math.max(1, parseInt(document.getElementById('cSplitPeople')?.value, 10) || 1);
    result = Math.round((total / people) * 100) / 100;
    if (result <= 0) { showToast('Enter a total bill amount above 0'); return; }
    label = `Expense Split (${people} shares)`;
    expr = `${formatINR(total)} ÷ ${people}`;
  } else if (mode === 'margin') {
    const cost = Math.max(0, parseFloat(document.getElementById('cCost')?.value) || 0);
    const sell = Math.max(0, parseFloat(document.getElementById('cSell')?.value) || 0);
    if (cost === 0 && sell === 0) { showToast('Enter cost and selling price'); return; }
    result = Math.round((sell - cost) * 100) / 100;
    const pct = sell > 0 ? Math.round(((sell - cost) / sell) * 1000) / 10 : 0;
    label = `Net Margin (${pct}%)`;
    expr = `Sell ${sell} − Cost ${cost}`;
  }
  state.tape.unshift({
    id: 't' + Date.now(),
    label,
    expr,
    result,
    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  });
  saveState();
  render();
  showToast('Saved to Hisab-Kitab tape');
}

function recallTape(val) {
  state.calcMode = 'standard';
  state.calcDisplay = String(val);
  state.calcExpr = '';
  state.calcJustEvaluated = false;
  state.calcFreshOperand = false;
  saveState();
  render();
  showToast(`Recalled ${val}`);
}

function deleteTape(id) {
  state.tape = state.tape.filter(t => t.id !== id);
  saveState();
  render();
}

function clearTape() {
  state.tape = [];
  saveState();
  render();
  showToast('Calculation tape cleared');
}

function renderCalculator() {
  const m = state.calcMode || 'standard';
  const tapeSum = state.tape.reduce((acc, item) => acc + (Number(item.result) || 0), 0);

  let modePanel = '';
  if (m === 'standard') {
    const keys = [
      { k: 'C', cls: 'muted' }, { k: 'DEL', cls: 'muted' }, { k: '%', cls: 'op' }, { k: '÷', cls: 'op' },
      { k: '7' }, { k: '8' }, { k: '9' }, { k: '×', cls: 'op' },
      { k: '4' }, { k: '5' }, { k: '6' }, { k: '-', cls: 'op' },
      { k: '1' }, { k: '2' }, { k: '3' }, { k: '+', cls: 'op' },
      { k: '00' }, { k: '0' }, { k: '.' }, { k: '=', cls: 'eq' }
    ];
    modePanel = `
      <div class="card">
        <div class="calc-screen">
          <div class="calc-expr">${escapeHtml(state.calcExpr) || '&nbsp;'}</div>
          <div class="calc-val">${escapeHtml(state.calcDisplay)}</div>
        </div>
        <div class="keypad">
          ${keys.map(btn => `<button class="key-btn ${btn.cls || ''}" onclick="calcInput('${btn.k}')">${btn.k}</button>`).join('')}
        </div>
      </div>
    `;
  } else if (m === 'gst') {
    modePanel = `
      <div class="card">
        <div class="eyebrow" style="color:var(--primary);margin-bottom:10px;">Itemized Qty &times; Rate + GST</div>
        <div style="display:grid;gap:12px;">
          <div>
            <label class="field-label">Item Label</label>
            <input class="input" id="cGstLabel" placeholder="e.g. Sensor Wire / Plumber Bill" />
          </div>
          <div class="spec-grid">
            <div>
              <label class="field-label">Quantity</label>
              <input class="input mono" id="cQty" type="number" min="0" value="2" oninput="updateLiveSpecial()" />
            </div>
            <div>
              <label class="field-label">Unit Rate (₹)</label>
              <input class="input mono" id="cRate" type="number" min="0" value="1500" oninput="updateLiveSpecial()" />
            </div>
          </div>
          <div>
            <label class="field-label">GST Rate (%)</label>
            <input class="input mono" id="cGst" type="number" min="0" value="18" oninput="updateLiveSpecial()" />
          </div>
          <div class="calc-screen" style="margin:4px 0 0;padding:15px;">
            <div class="calc-expr" id="liveGstMeta">Subtotal ₹3,000 + GST ₹540</div>
            <div class="calc-val" id="liveGstTotal" style="font-size:26px;">₹3,540</div>
          </div>
          <button class="btn btn-primary" onclick="saveSpecialCalc('gst')">Save to Running Tape</button>
        </div>
      </div>
    `;
  } else if (m === 'split') {
    modePanel = `
      <div class="card">
        <div class="eyebrow" style="color:var(--primary);margin-bottom:10px;">Apartment / Society Expense Split</div>
        <div style="display:grid;gap:12px;">
          <div class="spec-grid">
            <div>
              <label class="field-label">Total Bill (₹)</label>
              <input class="input mono" id="cSplitTotal" type="number" min="0" value="12000" oninput="updateLiveSpecial()" />
            </div>
            <div>
              <label class="field-label">Flats / People</label>
              <input class="input mono" id="cSplitPeople" type="number" min="1" value="4" oninput="updateLiveSpecial()" />
            </div>
          </div>
          <div class="calc-screen" style="margin:4px 0 0;padding:15px;">
            <div class="calc-expr">Per Share Contribution</div>
            <div class="calc-val" id="liveSplitTotal" style="font-size:26px;">₹3,000</div>
          </div>
          <button class="btn btn-primary" onclick="saveSpecialCalc('split')">Save to Running Tape</button>
        </div>
      </div>
    `;
  } else {
    modePanel = `
      <div class="card">
        <div class="eyebrow" style="color:var(--primary);margin-bottom:10px;">Profit &amp; Margin Calculator</div>
        <div style="display:grid;gap:12px;">
          <div class="spec-grid">
            <div>
              <label class="field-label">Cost Price (₹)</label>
              <input class="input mono" id="cCost" type="number" min="0" value="4800" oninput="updateLiveSpecial()" />
            </div>
            <div>
              <label class="field-label">Selling / Quote (₹)</label>
              <input class="input mono" id="cSell" type="number" min="0" value="6500" oninput="updateLiveSpecial()" />
            </div>
          </div>
          <div class="calc-screen" style="margin:4px 0 0;padding:15px;">
            <div class="calc-expr" id="liveMarginMeta">Margin: 26.2%</div>
            <div class="calc-val" id="liveMarginTotal" style="font-size:26px;">₹1,700</div>
          </div>
          <button class="btn btn-primary" onclick="saveSpecialCalc('margin')">Save to Running Tape</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="page-view">
      <div class="page-header">
        <div class="page-eyebrow">Smart Financial Utility</div>
        <h1 class="page-h1">Hisab-Kitab</h1>
        <p class="page-sub">Fast calculations for bills, GST estimates, shared society splits, and running expense tape.</p>
      </div>

      <div class="segmented">
        <button class="seg-btn ${m === 'standard' ? 'active' : ''}" onclick="setCalcMode('standard')">Basic</button>
        <button class="seg-btn ${m === 'gst' ? 'active' : ''}" onclick="setCalcMode('gst')">GST Bill</button>
        <button class="seg-btn ${m === 'split' ? 'active' : ''}" onclick="setCalcMode('split')">Split</button>
        <button class="seg-btn ${m === 'margin' ? 'active' : ''}" onclick="setCalcMode('margin')">Margin</button>
      </div>

      <div class="calc-grid-shell">
        ${modePanel}

        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;">
            <div style="min-width:0;">
              <div class="eyebrow">Running Tape</div>
              <div class="mono" style="font-size:17px;font-weight:700;color:var(--primary);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Sum: ${formatINR(tapeSum)}</div>
            </div>
            ${state.tape.length ? `<button class="btn btn-outline btn-sm" onclick="clearTape()">Clear</button>` : ''}
          </div>

          ${state.tape.length === 0 ? `
            <div style="padding:24px 10px;text-align:center;color:var(--ink-tertiary);font-size:13px;">
              Your saved calculations will appear here. Tap any item to recall it.
            </div>
          ` : state.tape.map(t => `
            <div class="tape-item">
              <button style="text-align:left;flex:1;min-width:0;" onclick="recallTape(${t.result})">
                <div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(t.label)}</div>
                <div class="mono" style="font-size:11px;color:var(--ink-tertiary);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(t.expr)}</div>
              </button>
              <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                <span class="mono" style="font-size:13.5px;font-weight:700;color:var(--primary);">${formatINR(t.result)}</span>
                <button style="color:var(--ink-tertiary);padding:5px;" onclick="deleteTape('${t.id}')" aria-label="Delete">${ICONS.trash}</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function updateLiveSpecial() {
  if (state.calcMode === 'gst') {
    const q = Math.max(0, parseFloat(document.getElementById('cQty')?.value) || 0);
    const r = Math.max(0, parseFloat(document.getElementById('cRate')?.value) || 0);
    const g = Math.max(0, parseFloat(document.getElementById('cGst')?.value) || 0);
    const sub = q * r;
    const tax = sub * g / 100;
    document.getElementById('liveGstMeta').textContent = `Subtotal ${formatINR(sub)} + GST ${formatINR(tax)}`;
    document.getElementById('liveGstTotal').textContent = formatINR(sub + tax);
  } else if (state.calcMode === 'split') {
    const tot = Math.max(0, parseFloat(document.getElementById('cSplitTotal')?.value) || 0);
    const ppl = Math.max(1, parseInt(document.getElementById('cSplitPeople')?.value, 10) || 1);
    document.getElementById('liveSplitTotal').textContent = formatINR(tot / ppl);
  } else if (state.calcMode === 'margin') {
    const c = Math.max(0, parseFloat(document.getElementById('cCost')?.value) || 0);
    const s = Math.max(0, parseFloat(document.getElementById('cSell')?.value) || 0);
    const profit = s - c;
    const pct = s > 0 ? ((profit / s) * 100).toFixed(1) : '0.0';
    document.getElementById('liveMarginMeta').textContent = `Margin: ${pct}%`;
    document.getElementById('liveMarginTotal').textContent = formatINR(profit);
  }
}

/* =========================================================================
   PAGE 5: NOTEPAD & AUTO-SYNC (FOCUS-SAFE LIVE SEARCH)
   ========================================================================= */
function toggleSyncOption(key) {
  state.sync[key] = !state.sync[key];
  state.sync.lastSynced = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  saveState();
  render();
  showToast(key === 'gmailSync'
    ? (state.sync.gmailSync ? 'Gmail Sync enabled' : 'Gmail Sync paused')
    : (state.sync.driveAutoSave ? 'Google Drive Auto-Save enabled' : 'Google Drive Auto-Save paused'));
}

function updateSyncEmail(val) {
  state.customer.email = val.trim();
  saveState();
}

function triggerManualSync() {
  state.sync.lastSynced = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  saveState();
  render();
  showToast(`Synced ${state.notes.length} notes with ${state.customer.email}`);
}

function setDraftField(field, val) {
  state.noteDraft[field] = val;
  saveState();
  const indicator = document.getElementById('draftStatus');
  if (indicator) indicator.textContent = 'Draft auto-saved';
}

function setDraftTag(tag) {
  state.noteDraft.tag = tag;
  saveState();
  render();
}

function saveNote(e) {
  e.preventDefault();
  const title = state.noteDraft.title.trim();
  const body = state.noteDraft.body.trim();
  if (!title && !body) {
    showToast('Write a title or note first');
    return;
  }
  state.notes.unshift({
    id: 'n' + Date.now(),
    title: title || 'Untitled Note',
    tag: state.noteDraft.tag || 'General',
    body,
    pinned: false,
    updatedAt: formatDate(shiftDays(0))
  });
  state.noteDraft = { title: '', tag: state.noteDraft.tag, body: '' };
  state.sync.lastSynced = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  saveState();
  render();
  showToast(state.sync.driveAutoSave ? 'Note saved & queued for Drive backup' : 'Note saved');
}

function togglePinNote(id) {
  const n = state.notes.find(x => x.id === id);
  if (n) n.pinned = !n.pinned;
  saveState();
  updateNotesList();
}

function deleteNote(id) {
  state.notes = state.notes.filter(x => x.id !== id);
  saveState();
  updateNotesList();
  showToast('Note deleted');
}

function emailNote(id) {
  const n = state.notes.find(x => x.id === id);
  if (!n) return;
  const subject = encodeURIComponent(`[AquaVault Note] ${n.title}`);
  const body = encodeURIComponent(`${n.body}\n\nCategory: ${n.tag}\nSaved via AquaVault Customer App`);
  window.location.href = `mailto:${encodeURIComponent(state.customer.email)}?subject=${subject}&body=${body}`;
}

function exportNoteDrive(id) {
  const n = state.notes.find(x => x.id === id);
  if (!n) return;
  const content = `${n.title}\nTag: ${n.tag}\nUpdated: ${n.updatedAt}\n\n${n.body}\n`;
  triggerDownload(`AquaVault-Note-${n.id}.txt`, content, 'text/plain');
  showToast('Note exported for Google Drive');
}

function buildNotesListMarkup() {
  const q = (state.noteSearch || '').toLowerCase();
  const filtered = state.notes
    .filter(n => state.noteFilter === 'All' || n.tag === state.noteFilter)
    .filter(n => !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));

  if (filtered.length === 0) {
    return `<div class="card" style="text-align:center;color:var(--ink-tertiary);padding:26px;">No matching notes found.</div>`;
  }

  return filtered.map(n => `
    <div class="note-card ${n.pinned ? 'pinned' : ''}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
        <div style="min-width:0;">
          <span class="badge badge-violet" style="padding:2px 9px;font-size:10.5px;margin-bottom:6px;">${escapeHtml(n.tag)}${n.pinned ? ' &middot; Pinned' : ''}</span>
          <div style="font-size:15px;font-weight:700;">${escapeHtml(n.title)}</div>
        </div>
        <div style="display:flex;gap:4px;flex-shrink:0;">
          <button class="icon-circle-btn" style="width:34px;height:34px;${n.pinned ? 'color:var(--primary);border-color:var(--primary);' : ''}" onclick="togglePinNote('${n.id}')" aria-label="Pin Note">${ICONS.bookmark}</button>
          <button class="icon-circle-btn" style="width:34px;height:34px;" onclick="deleteNote('${n.id}')" aria-label="Delete Note">${ICONS.trash}</button>
        </div>
      </div>
      <p style="font-size:13.5px;color:var(--ink-secondary);margin:8px 0 12px;white-space:pre-wrap;">${escapeHtml(n.body)}</p>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:10px;border-top:1px solid var(--border);flex-wrap:wrap;">
        <span class="mono" style="font-size:11px;color:var(--ink-tertiary);">${escapeHtml(n.updatedAt)}</span>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-outline btn-sm" onclick="emailNote('${n.id}')">${ICONS.mail} <span>Gmail</span></button>
          <button class="btn btn-soft btn-sm" onclick="exportNoteDrive('${n.id}')">${ICONS.download} <span>Drive</span></button>
        </div>
      </div>
    </div>
  `).join('');
}

function handleNoteSearch(val) {
  state.noteSearch = val;
  updateNotesList();
}

function setNoteFilter(tag) {
  state.noteFilter = tag;
  render();
}

function updateNotesList() {
  const box = document.getElementById('notesListContainer');
  if (box) box.innerHTML = buildNotesListMarkup();
}

function renderNotes() {
  const tags = ['General', 'Maintenance', 'Warranty', 'Expense'];
  const filterTags = ['All', ...tags];

  return `
    <div class="page-view">
      <div class="page-header">
        <div class="page-eyebrow">Personal Vault</div>
        <h1 class="page-h1">Notepad &amp; Auto-Sync</h1>
        <p class="page-sub">Capture maintenance logs, tank reminders, and bills with Gmail &amp; Google Drive backup.</p>
      </div>

      <div class="card sync-card">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="icon-badge">${ICONS.cloud}</span>
            <div>
              <div style="font-size:14px;font-weight:700;">Google Account Sync</div>
              <div style="font-size:12px;color:var(--emerald);font-weight:600;">Last synced ${escapeHtml(state.sync.lastSynced)}</div>
            </div>
          </div>
          <button class="btn btn-soft btn-sm" onclick="triggerManualSync()">
            ${ICONS.refresh} <span>Sync Now</span>
          </button>
        </div>

        <div>
          <label class="field-label" for="syncEmailInput">Linked Gmail Address</label>
          <input class="input" id="syncEmailInput" type="email" value="${escapeHtml(state.customer.email)}" onchange="updateSyncEmail(this.value)" />
        </div>

        <div class="sync-row">
          <div>
            <div style="font-size:13.5px;font-weight:700;">Gmail Note Sync</div>
            <div style="font-size:12px;color:var(--ink-secondary);">Enable 1-click email backup to your inbox</div>
          </div>
          <button class="switch ${state.sync.gmailSync ? 'on' : ''}" onclick="toggleSyncOption('gmailSync')" aria-label="Toggle Gmail Sync"></button>
        </div>

        <div class="sync-row">
          <div>
            <div style="font-size:13.5px;font-weight:700;">Google Drive Auto-Save</div>
            <div style="font-size:12px;color:var(--ink-secondary);">Auto-prepare Drive backup files on save</div>
          </div>
          <button class="switch ${state.sync.driveAutoSave ? 'on' : ''}" onclick="toggleSyncOption('driveAutoSave')" aria-label="Toggle Google Drive Auto-Save"></button>
        </div>
      </div>

      <div class="card" style="margin-bottom:18px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <span class="eyebrow" style="color:var(--primary);">New Note</span>
          <span id="draftStatus" style="font-size:11.5px;color:var(--ink-tertiary);">Auto-save active</span>
        </div>
        <form onsubmit="saveNote(event)">
          <input class="input" style="margin-bottom:10px;" placeholder="Note title..." value="${escapeHtml(state.noteDraft.title)}" oninput="setDraftField('title', this.value)" />
          <div class="tag-row" style="margin-bottom:10px;">
            ${tags.map(t => `<button type="button" class="chip-btn ${state.noteDraft.tag === t ? 'active' : ''}" onclick="setDraftTag('${t}')">${t}</button>`).join('')}
          </div>
          <textarea class="textarea" style="margin-bottom:12px;" placeholder="Write tank settings, technician notes, or expense memos..." oninput="setDraftField('body', this.value)">${escapeHtml(state.noteDraft.body)}</textarea>
          <button type="submit" class="btn btn-primary" style="width:100%;">
            ${ICONS.check} <span>Save &amp; Sync Note</span>
          </button>
        </form>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px;">
        <div style="position:relative;">
          <span style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--ink-tertiary);pointer-events:none;">${ICONS.search}</span>
          <input class="input" style="padding-left:40px;" placeholder="Search saved notes..." value="${escapeHtml(state.noteSearch)}" oninput="handleNoteSearch(this.value)" />
        </div>
        <div class="tag-row">
          ${filterTags.map(t => `<button class="chip-btn ${state.noteFilter === t ? 'active' : ''}" onclick="setNoteFilter('${t}')">${t}</button>`).join('')}
        </div>
      </div>

      <div id="notesListContainer">${buildNotesListMarkup()}</div>
    </div>
  `;
}

/* =========================================================================
   PAGE 6: NEW TAB — FUTURE APPS & WEBSITES HUB
   ========================================================================= */
function renderHub() {
  const cats = ['All', 'New App', 'Website', 'Tool'];
  const remoteCfg = getRemoteConfig();
  const sourceApps = (remoteCfg && Array.isArray(remoteCfg.hubApps))
    ? remoteCfg.hubApps.filter(a => a.enabled !== false && /^https:\/\//i.test(String(a.url || '')))
    : HUB_APPS;
  const items = state.hubFilter === 'All' ? sourceApps : sourceApps.filter(a => a.category === state.hubFilter);

  return `
    <div class="page-view">
      <div class="hub-banner">
        <img src="assets/crystal-water.jpg" alt="" />
        <div class="hub-banner-scrim"></div>
        <div class="hub-banner-content">
          <div class="eyebrow" style="color:#DDD6FE;margin-bottom:4px;">New Tab &middot; Launchpad</div>
          <h1 class="serif" style="font-size:34px;line-height:1.08;color:#FFFFFF;margin:0 0 6px;">AquaVault Ecosystem</h1>
          <p style="font-size:13.5px;color:rgba(243,239,253,0.82);margin:0;max-width:460px;">
            One-click gateway to upcoming AquaVault companion apps, official web portals, and water engineering utilities.
          </p>
        </div>
      </div>

      <div class="segmented" style="margin-bottom:16px;">
        ${cats.map(c => `<button class="seg-btn ${state.hubFilter === c ? 'active' : ''}" onclick="state.hubFilter='${c}';render();">${c}</button>`).join('')}
      </div>

      <div class="hub-grid">
        ${items.map(app => `
          <a class="hub-card" href="${app.url}" target="_blank" rel="noopener noreferrer">
            <div class="hub-icon">${ICONS[app.icon]}</div>
            <div class="hub-body">
              <div class="hub-name-row">
                <span class="hub-name">${escapeHtml(app.name)}</span>
                <span class="hub-tag">${escapeHtml(app.category)}</span>
              </div>
              <div class="hub-desc">${escapeHtml(app.desc)}</div>
            </div>
            <div class="hub-arrow" aria-hidden="true">${ICONS.arrowUpRight}</div>
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

/* =========================================================================
   PAGE 7: PRIVACY, DPDP ACT & SETTINGS
   ========================================================================= */
function toggleDpdpConsent() {
  state.dpdp.consentGranted = !state.dpdp.consentGranted;
  state.dpdp.auditTrail.unshift({
    time: `${formatDate(shiftDays(0))} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
    event: state.dpdp.consentGranted ? 'DPDP Act Consent Granted' : 'DPDP Act Consent Withdrawn'
  });
  saveState();
  render();
  showToast(state.dpdp.consentGranted ? 'Consent recorded' : 'Consent withdrawn');
}

function exportAllData() {
  const payload = JSON.stringify({
    exportedAt: new Date().toISOString(),
    compliance: 'Digital Personal Data Protection Act, 2023 (India)',
    customer: state.customer,
    units: state.units,
    serviceTickets: state.tickets,
    calculatorTape: state.tape,
    notes: state.notes,
    consentAudit: state.dpdp
  }, null, 2);
  triggerDownload(`AquaVault-Data-${state.customer.accountId}.json`, payload, 'application/json');
  showToast('Personal data exported as JSON');
}

function openConfirmModal() {
  pushModalState('confirm');
  document.getElementById('confirmModal').classList.add('open');
}

function closeConfirmModal() {
  const modal = document.getElementById('confirmModal');
  if (modal && modal.classList.contains('open')) {
    modal.classList.remove('open');
    if (history.state && history.state.modal === 'confirm') history.back();
  }
}

function executeEraseData() {
  localStorage.removeItem(STORAGE_KEY);
  state = buildInitialState();
  state.tape = [];
  state.notes = [];
  state.tickets = [];
  state.dpdp.consentGranted = false;
  state.dpdp.auditTrail = [{ time: formatDate(shiftDays(0)), event: 'Local Personal Data Erased (DPDP Right to Erasure)' }];
  saveState();
  closeConfirmModal();
  applyTheme();
  render();
  showToast('All personal workspace data erased');
}

function renderPrivacy() {
  const installed = isStandalonePWA();
  return `
    <div class="page-view">
      <div class="page-header">
        <div class="page-eyebrow">Trust, App &amp; Appearance</div>
        <h1 class="page-h1">Privacy &amp; Settings</h1>
        <p class="page-sub">Install the AquaVault PWA app, switch Day &amp; Night themes, and manage your DPDP Act rights.</p>
      </div>

      <div class="card" style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:12px;min-width:0;flex:1;">
          <span class="icon-badge">${ICONS.smartphone}</span>
          <div style="min-width:0;">
            <div style="font-size:15px;font-weight:700;">AquaVault PWA App</div>
            <div style="font-size:12.5px;color:var(--ink-secondary);">
              ${installed ? 'Installed on this device with offline access.' : 'Install to your home screen for full-screen app experience.'}
            </div>
          </div>
        </div>
        ${installed
          ? `<span class="badge badge-emerald"><span class="badge-dot"></span> Installed</span>`
          : `<button class="btn btn-primary btn-sm" onclick="triggerPWAInstall()">${ICONS.download} <span>Install App</span></button>`}
      </div>

      <div class="card" style="margin-bottom:16px;">
        <div class="eyebrow" style="color:var(--primary);">Signature Theme</div>
        <h2 style="font-size:17px;font-weight:700;margin:4px 0 2px;">Day &amp; Night Appearance</h2>
        <p style="font-size:12.5px;color:var(--ink-secondary);margin:0;">Instant 1-click transition between Porcelain White + Royal Purple and Obsidian Black + Luminous Violet.</p>

        <div class="theme-preview-grid">
          <button class="theme-option day ${state.theme === 'light' ? 'selected' : ''}" onclick="setThemeDirect('light')">
            <div class="theme-swatch-row">
              <span class="swatch-dot" style="background:#FFFFFF;border:1px solid #D5C9EE;"></span>
              <span class="swatch-dot" style="background:#6D28D9;"></span>
              <span class="swatch-dot" style="background:#EDE9FE;"></span>
            </div>
            <div style="font-size:13.5px;font-weight:700;display:flex;align-items:center;gap:6px;">
              ${ICONS.sun} <span>Day Mode</span>
            </div>
            <div style="font-size:11px;color:#5B5578;margin-top:3px;">White &amp; Purple</div>
          </button>

          <button class="theme-option night ${state.theme === 'dark' ? 'selected' : ''}" onclick="setThemeDirect('dark')">
            <div class="theme-swatch-row">
              <span class="swatch-dot" style="background:#06060A;border:1px solid #3B3060;"></span>
              <span class="swatch-dot" style="background:#A78BFA;"></span>
              <span class="swatch-dot" style="background:#1B172A;"></span>
            </div>
            <div style="font-size:13.5px;font-weight:700;display:flex;align-items:center;gap:6px;">
              ${ICONS.moon} <span>Night Mode</span>
            </div>
            <div style="font-size:11px;color:#A8A1C4;margin-top:3px;">Obsidian &amp; Violet</div>
          </button>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;">
          <div>
            <div class="eyebrow" style="color:var(--emerald);">DPDP Act 2023 (India)</div>
            <h2 style="font-size:17px;font-weight:700;margin:4px 0 2px;">Data Principal Consent</h2>
          </div>
          <button class="switch ${state.dpdp.consentGranted ? 'on' : ''}" onclick="toggleDpdpConsent()" aria-label="Toggle DPDP Consent"></button>
        </div>

        <p style="font-size:13px;color:var(--ink-secondary);margin:0 0 14px;line-height:1.55;">
          Your data is used exclusively to compute live warranty countdowns, store official GST bills, dispatch service technicians, and save your personal notes. We never sell data or run ad trackers.
        </p>

        <div class="dual-actions">
          <button class="btn btn-outline" onclick="exportAllData()">
            ${ICONS.download} <span>Export JSON</span>
          </button>
          <button class="btn btn-danger-outline" onclick="openConfirmModal()">
            ${ICONS.trash} <span>Erase Data</span>
          </button>
        </div>
      </div>

      <div class="card">
        <div class="eyebrow" style="margin-bottom:10px;">Consent Audit Trail</div>
        ${state.dpdp.auditTrail.map(a => `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);font-size:12.5px;">
            <span style="font-weight:600;">${escapeHtml(a.event)}</span>
            <span class="mono" style="font-size:11px;color:var(--ink-tertiary);flex-shrink:0;">${escapeHtml(a.time)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/* =========================================================================
   UTILITIES & BOOT
   ========================================================================= */
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function triggerDownload(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function render() {
  const main = document.getElementById('appMain');
  if (!main) return;
  const cfg = getRemoteConfig();

  if (cfg && cfg.maintenanceMode) {
    main.innerHTML = `
      <div class="page-view">
        <div class="card" style="max-width:560px;margin:28px auto;text-align:center;padding:34px 24px;">
          <div class="eyebrow" style="color:var(--primary);margin-bottom:8px;">Scheduled System Upgrade</div>
          <h1 class="serif" style="font-size:34px;margin:0 0 10px;line-height:1.08;">AquaVault Calibration in Progress</h1>
          <p style="font-size:14px;color:var(--ink-secondary);margin:0;">${escapeHtml(cfg.maintenanceMessage || 'We are upgrading AquaVault services. Please check back shortly.')}</p>
        </div>
      </div>
    `;
    return;
  }

  const bannerHtml = (cfg && cfg.announcementActive && cfg.announcementText)
    ? `<div class="card" style="margin-bottom:14px;padding:12px 16px;background:var(--primary-soft);border-color:var(--border-strong);display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;color:var(--ink);"><span style="color:var(--primary);flex-shrink:0;">${ICONS.bolt}</span><span>${escapeHtml(cfg.announcementText)}</span></div>`
    : '';

  if (!isFeatureEnabled(CURRENT_PAGE)) {
    main.innerHTML = `${bannerHtml}<div class="page-view"><div class="card" style="text-align:center;padding:32px 20px;"><h2 class="serif" style="font-size:28px;margin:0 0 8px;">Section Temporarily Unavailable</h2><p style="font-size:13.5px;color:var(--ink-secondary);margin:0 0 16px;">This module is currently paused. Return to Home to manage your AquaVault devices.</p><a href="index.html" class="btn btn-primary btn-sm">Back to Home</a></div></div>`;
    return;
  }

  switch (CURRENT_PAGE) {
    case 'warranty':
      main.innerHTML = bannerHtml + renderWarranty();
      bindChartInteraction();
      break;
    case 'devices':
      main.innerHTML = bannerHtml + renderDevices();
      break;
    case 'calculator':
      main.innerHTML = bannerHtml + renderCalculator();
      break;
    case 'invoice':
      main.innerHTML = bannerHtml + (typeof renderInvoicePage === 'function' ? renderInvoicePage() : renderHome());
      break;
    case 'notes':
      main.innerHTML = bannerHtml + renderNotes();
      break;
    case 'hub':
      main.innerHTML = bannerHtml + renderHub();
      break;
    case 'privacy':
      main.innerHTML = bannerHtml + renderPrivacy();
      break;
    case 'home':
    default:
      main.innerHTML = bannerHtml + renderHome();
      break;
  }
}

mountShell();
applyTheme();
render();
initPWA();
