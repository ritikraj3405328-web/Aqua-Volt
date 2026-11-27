/* =========================================================================
   AQUAVAULT ADMIN COMMAND CENTER — CRASH-PROOF & SERVER-SIDE FIREBASE AUTH
   - Zero blank screens: Renders UI synchronously before any network/SDK call
   - All Firebase initialization wrapped in defensive try/catch blocks
   - Non-blocking status banner when firebase-config.js is not configured yet
   - Firebase Authentication (signInWithEmailAndPassword + sendPasswordResetEmail)
   - Single-Digit Anti-Bot Math Quiz (rollMathQuiz) before Firebase login
   - Automatic 30-Minute Inactivity Session Logout (1,800,000 ms watchdog)
   - Clear non-admin email rejection & server-side Firestore Rules verification
   ========================================================================= */

import { firebaseConfig, firestoreDatabaseId } from '../firebase-config.js';

const ADMIN_CONFIG_KEY = 'aquavault_admin_config_v1';
const CUSTOMER_STATE_KEY = 'aquavault_luxury_state_v2';
const ADMIN_THEME_KEY = 'aquavault_admin_theme_v1';
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes automatic logout

const ICONS = {
  shield: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 3l7.5 3v5.5c0 4.8-3.2 8.9-7.5 10.5-4.3-1.6-7.5-5.7-7.5-10.5V6L12 3z"/><path d="M9 12l2 2 4-4"/></svg>`,
  lock: `<svg class="icon" viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/><circle cx="12" cy="16" r="1"/></svg>`,
  dashboard: `<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7.5" height="9" rx="2"/><rect x="13.5" y="3" width="7.5" height="5.5" rx="2"/><rect x="13.5" y="11.5" width="7.5" height="9.5" rx="2"/><rect x="3" y="15" width="7.5" height="6" rx="2"/></svg>`,
  sliders: `<svg class="icon" viewBox="0 0 24 24"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.5"/><circle cx="15" cy="17" r="2.5"/></svg>`,
  devices: `<svg class="icon" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h6v6H9z"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/></svg>`,
  wrench: `<svg class="icon" viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.3-2.3 1.6-3z"/></svg>`,
  receipt: `<svg class="icon" viewBox="0 0 24 24"><path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>`,
  hub: `<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>`,
  users: `<svg class="icon" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M3 19.5c0-3 2.7-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.5c2.2.3 4 1.8 4.5 4.5"/></svg>`,
  key: `<svg class="icon" viewBox="0 0 24 24"><circle cx="8" cy="14" r="4"/><path d="M11 11l9-9M17 5l3 3M14 8l2 2"/></svg>`,
  sun: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>`,
  moon: `<svg class="icon" viewBox="0 0 24 24"><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a6.5 6.5 0 0 0 11 11z"/></svg>`,
  refresh: `<svg class="icon" viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2 5.3"/><path d="M20 4v7h-7"/></svg>`,
  mail: `<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>`,
  plus: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`,
  trash: `<svg class="icon" viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/></svg>`,
  download: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 4v11"/><path d="M8 11l4 4 4-4"/><path d="M4 19h16"/></svg>`,
  check: `<svg class="icon" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>`,
  alert: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 3l9.5 17h-19L12 3z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".8"/></svg>`,
  logout: `<svg class="icon" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>`
};

const ADMIN_TABS = [
  { id: 'dashboard', label: 'Overview', icon: 'dashboard', dock: true },
  { id: 'features', label: 'Features', icon: 'sliders', dock: true },
  { id: 'devices', label: 'Units', icon: 'devices', dock: true },
  { id: 'tickets', label: 'Tickets', icon: 'wrench', dock: true },
  { id: 'invoices', label: 'Invoices', icon: 'receipt', dock: false },
  { id: 'hub', label: 'Apps Hub', icon: 'hub', dock: false },
  { id: 'customers', label: 'Customer', icon: 'users', dock: false },
  { id: 'security', label: 'Security', icon: 'shield', dock: true }
];

/* =========================================================================
   IN-MEMORY RUNTIME STATE & CRASH-PROOF FIREBASE INITIALIZATION
   ========================================================================= */
const session = {
  authenticated: false,
  checkingAuth: false,
  firebaseReady: false,
  firebaseInitError: '',
  user: null,
  authView: 'login', // 'login' | 'forgot'
  authBusy: false,
  authError: '',
  authNotice: '',
  activeTab: 'dashboard',
  mathQuiz: { a: 3, b: 4, op: '+', answer: 7 },
  ticketFilter: 'All',
  auditLogs: [],
  cloudSyncedAt: null,
  lastActivityAt: Date.now(),
  inactivityInterval: null,
  toastTimer: null
};

let fbApp = null;
let auth = null;
let db = null;
let fbSdk = null;

function isFirebaseConfigured() {
  try {
    return Boolean(
      firebaseConfig &&
      typeof firebaseConfig === 'object' &&
      firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      !String(firebaseConfig.apiKey).startsWith('YOUR_') &&
      !String(firebaseConfig.projectId).startsWith('YOUR_')
    );
  } catch {
    return false;
  }
}

async function initFirebaseSafely() {
  if (!isFirebaseConfigured()) {
    session.firebaseReady = false;
    session.checkingAuth = false;
    render();
    return false;
  }
  if (fbSdk && auth && db) return true;

  try {
    const [appMod, authMod, fsMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js')
    ]);
    fbSdk = { ...appMod, ...authMod, ...fsMod };
    fbApp = fbSdk.initializeApp(firebaseConfig);
    auth = fbSdk.getAuth(fbApp);
    db = firestoreDatabaseId && firestoreDatabaseId !== '(default)'
      ? fbSdk.getFirestore(fbApp, firestoreDatabaseId)
      : fbSdk.getFirestore(fbApp);
    session.firebaseReady = true;
    session.firebaseInitError = '';

    fbSdk.onAuthStateChanged(auth, async (user) => {
      if (!user) {
        session.authenticated = false;
        session.user = null;
        session.checkingAuth = false;
        render();
        return;
      }

      session.checkingAuth = true;
      render();
      const allowed = await verifyAndLoadAdminSession(user);
      if (!allowed) {
        try { await fbSdk.signOut(auth); } catch {}
        session.authenticated = false;
        session.user = null;
        session.authError = `Access Denied: The account "${sanitizeText(user.email || 'unknown', 120)}" is not authorized as an AquaVault Admin. Only the designated admin email in firestore.rules can access this console.`;
      } else {
        session.authenticated = true;
        session.user = user;
        session.lastActivityAt = Date.now();
        session.authError = '';
      }
      session.checkingAuth = false;
      render();
    });
    return true;
  } catch (err) {
    console.warn('Firebase initialization skipped or failed safely:', err);
    session.firebaseReady = false;
    session.checkingAuth = false;
    session.firebaseInitError = err?.message || 'Firebase SDK unavailable';
    render();
    return false;
  }
}

/* =========================================================================
   XSS & INPUT SANITIZATION HELPERS
   ========================================================================= */
function esc(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeText(val, maxLen = 250) {
  return String(val ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<\s*\/?\s*script\b[^>]*>/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
    .trim()
    .slice(0, maxLen);
}

function sanitizeId(id) {
  return String(id ?? '').replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 80);
}

function ic(name) {
  return ICONS[name] || '';
}

function isValidHttpsUrl(url) {
  try {
    const parsed = new URL(String(url || '').trim());
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/* =========================================================================
   30-MINUTE AUTOMATIC INACTIVITY LOGOUT WATCHDOG
   ========================================================================= */
function recordAdminActivity() {
  session.lastActivityAt = Date.now();
}

function getRemainingSessionMinutes() {
  const elapsed = Date.now() - session.lastActivityAt;
  const remMs = Math.max(0, INACTIVITY_TIMEOUT_MS - elapsed);
  return Math.max(1, Math.ceil(remMs / 60000));
}

function startInactivityWatchdog() {
  const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
  events.forEach((evt) => {
    window.addEventListener(evt, recordAdminActivity, { passive: true });
  });

  if (session.inactivityInterval) clearInterval(session.inactivityInterval);
  session.inactivityInterval = setInterval(async () => {
    if (!session.authenticated) return;
    const idleMs = Date.now() - session.lastActivityAt;
    const badgeEl = document.getElementById('idleTimerBadge');
    if (badgeEl) {
      badgeEl.textContent = `Auto-Logout: ${getRemainingSessionMinutes()}m`;
    }
    if (idleMs >= INACTIVITY_TIMEOUT_MS) {
      await handleInactivityTimeout();
    }
  }, 15000);
}

async function handleInactivityTimeout() {
  if (auth && fbSdk) {
    try { await fbSdk.signOut(auth); } catch {}
  }
  session.authenticated = false;
  session.user = null;
  session.authView = 'login';
  session.authNotice = '';
  session.authError = 'Session timed out after 30 minutes of inactivity for your security. Please sign in again.';
  rollMathQuiz();
  render();
  showToast('Logged out automatically after 30 minutes of inactivity');
}

/* =========================================================================
   SINGLE-DIGIT MATH QUIZ GENERATOR (FRESH RANDOM ON EVERY REFRESH)
   ========================================================================= */
function rollMathQuiz() {
  let prevSig = '';
  try { prevSig = sessionStorage.getItem('aquavault_last_math_quiz') || ''; } catch {}
  const arr = new Uint8Array(3);
  let next = null;
  for (let attempt = 0; attempt < 12; attempt++) {
    crypto.getRandomValues(arr);
    const useSub = (arr[0] % 3) === 2;
    let a = 1 + (arr[1] % 9);
    let b = 1 + (arr[2] % 9);
    if (useSub) {
      if (b > a) { const tmp = a; a = b; b = tmp; }
      next = { a, b, op: '-', answer: a - b };
    } else {
      next = { a, b, op: '+', answer: a + b };
    }
    const sig = `${next.a}${next.op}${next.b}`;
    if (sig !== prevSig) {
      try { sessionStorage.setItem('aquavault_last_math_quiz', sig); } catch {}
      break;
    }
  }
  session.mathQuiz = next || { a: 4, b: 3, op: '+', answer: 7 };
  return session.mathQuiz;
}

function refreshMathQuizUI() {
  rollMathQuiz();
  const eq = document.getElementById('mathQuizEquation');
  const inp = document.getElementById('mathQuizAnswer');
  if (eq) eq.textContent = `${session.mathQuiz.a} ${session.mathQuiz.op} ${session.mathQuiz.b} = ?`;
  if (inp) { inp.value = ''; inp.focus(); }
}

/* =========================================================================
   SHARED CUSTOMER CONFIG & STATE HELPERS
   ========================================================================= */
function getDefaultAdminConfig() {
  return {
    features: {
      warranty: true,
      devices: true,
      calculator: true,
      invoice: true,
      notes: true,
      hub: true,
      privacy: true,
      pwaPopup: true
    },
    maintenanceMode: false,
    maintenanceMessage: 'AquaVault is undergoing a scheduled calibration upgrade. Your warranty data is completely safe and will be back shortly.',
    announcementActive: false,
    announcementText: 'Monsoon Tank Sensor Checkup Active — Book your complimentary inspection inside Devices & Service.',
    defaultTheme: 'light',
    invoiceDefaults: {
      businessName: 'AquaVault Smart Systems Pvt. Ltd.',
      businessAddress: 'Tower B, Indiranagar Tech Park, Bengaluru 560038',
      businessPhone: '+91 80 4120 8899',
      businessEmail: 'billing@aquavault.in',
      paymentDetails: 'HDFC Bank • A/C: 50200084192011 • IFSC: HDFC0000184 • UPI: aquavault@hdfcbank',
      gstPercent: 18,
      palette: 'violet',
      frameStyle: 'colorful',
      googleSheetWebhook: ''
    },
    hubApps: [
      { id: 'h1', name: 'AquaVault Official Store', category: 'Website', desc: 'Explore flagship dual-tank controllers, brass stoppers, and genuine spare sensors.', url: 'https://www.google.com/search?q=smart+water+level+controller', icon: 'globe', enabled: true },
      { id: 'h2', name: 'HydroSense IoT Companion', category: 'New App', desc: 'Live Wi-Fi tank telemetry, motor runtime alerts, and water savings analytics.', url: 'https://www.google.com/search?q=smart+water+tank+monitor+app', icon: 'activity', enabled: true },
      { id: 'h3', name: 'Tank Volume & Flow Estimator', category: 'Tool', desc: 'Calculate cylindrical & rectangular overhead tank capacity in liters and refill time.', url: 'https://www.google.com/search?q=water+tank+volume+calculator+liters', icon: 'gauge', enabled: true },
      { id: 'h4', name: 'AquaCare Express Service Portal', category: 'Website', desc: 'Locate certified installation engineers, warranty policies, and wiring manuals.', url: 'https://www.google.com/search?q=water+level+controller+wiring+manual', icon: 'wrench', enabled: true },
      { id: 'h5', name: 'Solar Pump Auto-Sync', category: 'New App', desc: 'Smart daylight pump scheduling for rooftop solar and borewell setups.', url: 'https://www.google.com/search?q=solar+water+pump+controller', icon: 'bolt', enabled: true },
      { id: 'h6', name: 'Rainwater Harvest Planner', category: 'Tool', desc: 'Estimate rooftop monsoon water capture and sump storage sizing.', url: 'https://www.google.com/search?q=rainwater+harvesting+calculator', icon: 'droplet', enabled: true }
    ],
    updatedAt: new Date().toISOString()
  };
}

function loadAdminConfig() {
  const def = getDefaultAdminConfig();
  try {
    const raw = localStorage.getItem(ADMIN_CONFIG_KEY);
    if (!raw) return def;
    const parsed = JSON.parse(raw);
    return {
      ...def,
      ...parsed,
      features: { ...def.features, ...(parsed.features || {}) },
      invoiceDefaults: { ...def.invoiceDefaults, ...(parsed.invoiceDefaults || {}) },
      hubApps: Array.isArray(parsed.hubApps) ? parsed.hubApps : def.hubApps
    };
  } catch {
    return def;
  }
}

function saveAdminConfig(cfg) {
  cfg.updatedAt = new Date().toISOString();
  try { localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(cfg)); } catch {}
  syncCloudConfig(cfg);
}

function shiftDaysIso(delta) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return new Date(d.getTime() + delta * 86400000).toISOString().slice(0, 10);
}

function loadCustomerState() {
  const fallback = {
    theme: 'light',
    customer: {
      name: 'Valued Customer',
      accountId: 'AQV-2026-0001',
      email: 'customer@example.com',
      city: 'Bengaluru, India'
    },
    sync: { gmailSync: true, driveAutoSave: true, lastSynced: 'Just now' },
    dpdp: { consentGranted: true, auditTrail: [] },
    units: [
      { id: 'u1', type: 'controller', model: 'AquaVault Pro-X7 Dual Tank Controller', serial: 'AV-WLC-88412', location: 'Overhead Tank (Terrace)', installDate: shiftDaysIso(-489), expiryDate: shiftDaysIso(241), invoiceNo: 'INV-AQV-2025-1104', basePrice: 8450, gstRate: 18 },
      { id: 'u2', type: 'controller', model: 'AquaVault SumpGuard S4 Controller', serial: 'AV-WLC-88905', location: 'Underground Sump', installDate: shiftDaysIso(-330), expiryDate: shiftDaysIso(35), invoiceNo: 'INV-AQV-2025-2218', basePrice: 6800, gstRate: 18 },
      { id: 'u3', type: 'stopper', model: 'AquaVault HydroSeal Brass Stopper', serial: 'AV-WST-55210', location: 'Main Terrace Inlet Valve', installDate: shiftDaysIso(-185), expiryDate: shiftDaysIso(545), invoiceNo: 'INV-AQV-2026-0412', basePrice: 4950, gstRate: 18 },
      { id: 'u4', type: 'stopper', model: 'AquaVault SmartCutoff Valve V2', serial: 'AV-WST-51084', location: 'Garden Line & Utility', installDate: shiftDaysIso(-400), expiryDate: shiftDaysIso(-35), invoiceNo: 'INV-AQV-2024-8910', basePrice: 3600, gstRate: 18 }
    ],
    tickets: [
      { id: 'SRV-9402', unitId: 'u2', unitName: 'AquaVault SumpGuard S4 Controller', issue: 'Annual Sensor Calibration', notes: 'Routine ultrasonic level calibration before monsoon.', status: 'Scheduled', date: shiftDaysIso(-2) },
      { id: 'SRV-8817', unitId: 'u1', unitName: 'AquaVault Pro-X7 Dual Tank Controller', issue: 'Initial Commissioning Check', notes: 'Verified zero-overflow cutoff and dry-run protection.', status: 'Resolved', date: shiftDaysIso(-64) }
    ],
    notes: [],
    invoices: []
  };
  try {
    const raw = localStorage.getItem(CUSTOMER_STATE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      ...fallback,
      ...parsed,
      customer: { ...fallback.customer, ...(parsed.customer || {}) },
      sync: { ...fallback.sync, ...(parsed.sync || {}) },
      dpdp: { ...fallback.dpdp, ...(parsed.dpdp || {}) },
      units: Array.isArray(parsed.units) ? parsed.units : fallback.units,
      tickets: Array.isArray(parsed.tickets) ? parsed.tickets : fallback.tickets,
      notes: Array.isArray(parsed.notes) ? parsed.notes : fallback.notes,
      invoices: Array.isArray(parsed.invoices) ? parsed.invoices : fallback.invoices
    };
  } catch {
    return fallback;
  }
}

function saveCustomerState(cs) {
  try { localStorage.setItem(CUSTOMER_STATE_KEY, JSON.stringify(cs)); } catch {}
}

function getDaysRemaining(expiryIso) {
  const [y, m, d] = String(expiryIso || '').split('-').map(Number);
  if (!y || !m || !d) return 0;
  const end = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((end - today) / 86400000));
}

function formatINR(num) {
  return '₹' + Math.abs(Number(num) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

/* =========================================================================
   THEME & TOAST
   ========================================================================= */
function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function toggleAdminTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem(ADMIN_THEME_KEY, next); } catch {}
  const meta = document.getElementById('admin-meta-theme');
  if (meta) meta.setAttribute('content', next === 'dark' ? '#06060A' : '#FFFFFF');
  render();
}

function showToast(msg) {
  let el = document.getElementById('adminToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'adminToast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = String(msg ?? '');
  el.classList.add('show');
  clearTimeout(session.toastTimer);
  session.toastTimer = setTimeout(() => el.classList.remove('show'), 3400);
}

/* =========================================================================
   FIRESTORE SERVER-SIDE ADMIN VERIFICATION & LIVE SYNC
   ========================================================================= */
async function appendCloudAudit(eventType, summary, severity = 'INFO') {
  const cleanSummary = sanitizeText(summary, 480);
  const entry = {
    id: 'AUD-' + Date.now().toString(36).toUpperCase(),
    eventType,
    summary: cleanSummary,
    severity,
    time: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
  session.auditLogs.unshift(entry);
  session.auditLogs = session.auditLogs.slice(0, 60);

  if (!db || !fbSdk || !session.user || !session.authenticated) return;
  try {
    await fbSdk.addDoc(fbSdk.collection(db, 'adminAuditLogs'), {
      actorUid: session.user.uid,
      actorEmail: session.user.email || '',
      eventType,
      summary: cleanSummary,
      severity,
      createdAt: fbSdk.serverTimestamp()
    });
  } catch (err) {
    console.warn('Audit log write skipped:', err?.message || err);
  }
}

async function syncCloudConfig(cfg) {
  if (!db || !fbSdk || !session.user || !session.authenticated) return;
  try {
    const configRef = fbSdk.doc(db, 'appConfig', 'global');
    const existing = await fbSdk.getDoc(configRef);
    const payload = {
      featureWarranty: Boolean(cfg.features.warranty),
      featureDevices: Boolean(cfg.features.devices),
      featureCalculator: Boolean(cfg.features.calculator),
      featureInvoice: Boolean(cfg.features.invoice),
      featureNotes: Boolean(cfg.features.notes),
      featureHub: Boolean(cfg.features.hub),
      featurePrivacy: Boolean(cfg.features.privacy),
      featurePwaPopup: Boolean(cfg.features.pwaPopup),
      maintenanceMode: Boolean(cfg.maintenanceMode),
      maintenanceMessage: sanitizeText(cfg.maintenanceMessage || '', 300),
      announcementActive: Boolean(cfg.announcementActive),
      announcementText: sanitizeText(cfg.announcementText || '', 300),
      defaultGstPercent: Math.max(0, Math.min(50, Number(cfg.invoiceDefaults.gstPercent || 18))),
      defaultInvoicePalette: String(cfg.invoiceDefaults.palette || 'violet'),
      defaultTheme: cfg.defaultTheme === 'dark' ? 'dark' : 'light',
      updatedByUid: session.user.uid,
      updatedAt: fbSdk.serverTimestamp()
    };

    if (existing.exists()) {
      await fbSdk.setDoc(configRef, payload, { merge: true });
    } else {
      await fbSdk.setDoc(configRef, { ...payload, createdAt: fbSdk.serverTimestamp() });
    }

    for (let i = 0; i < cfg.hubApps.length; i++) {
      const app = cfg.hubApps[i];
      if (!isValidHttpsUrl(app.url)) continue;
      const appRef = fbSdk.doc(db, 'hubApps', sanitizeId(app.id));
      const appSnap = await fbSdk.getDoc(appRef);
      const appPayload = {
        name: sanitizeText(app.name, 100),
        category: ['Website', 'New App', 'Tool'].includes(app.category) ? app.category : 'Website',
        desc: sanitizeText(app.desc, 300),
        url: String(app.url).trim().slice(0, 500),
        icon: sanitizeText(app.icon || 'globe', 40),
        enabled: app.enabled !== false,
        sortOrder: i,
        updatedAt: fbSdk.serverTimestamp()
      };
      if (appSnap.exists()) {
        await fbSdk.setDoc(appRef, appPayload, { merge: true });
      } else {
        await fbSdk.setDoc(appRef, { ...appPayload, createdAt: fbSdk.serverTimestamp() });
      }
    }

    session.cloudSyncedAt = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch (err) {
    console.warn('Firestore sync error:', err?.message || err);
  }
}

async function verifyAndLoadAdminSession(user) {
  if (!db || !fbSdk || !user) return false;
  try {
    const adminRef = fbSdk.doc(db, 'admins', user.uid);
    const adminSnap = await fbSdk.getDoc(adminRef);

    if (!adminSnap.exists()) {
      await fbSdk.setDoc(adminRef, {
        uid: user.uid,
        email: user.email || '',
        role: 'SUPER_ADMIN',
        active: true,
        createdAt: fbSdk.serverTimestamp(),
        updatedAt: fbSdk.serverTimestamp()
      });
    }

    const cfgRef = fbSdk.doc(db, 'appConfig', 'global');
    const cfgSnap = await fbSdk.getDoc(cfgRef);
    const localCfg = loadAdminConfig();

    if (cfgSnap.exists()) {
      const d = cfgSnap.data();
      const merged = {
        ...localCfg,
        features: {
          warranty: d.featureWarranty !== false,
          devices: d.featureDevices !== false,
          calculator: d.featureCalculator !== false,
          invoice: d.featureInvoice !== false,
          notes: d.featureNotes !== false,
          hub: d.featureHub !== false,
          privacy: d.featurePrivacy !== false,
          pwaPopup: d.featurePwaPopup !== false
        },
        maintenanceMode: Boolean(d.maintenanceMode),
        maintenanceMessage: d.maintenanceMessage || localCfg.maintenanceMessage,
        announcementActive: Boolean(d.announcementActive),
        announcementText: d.announcementText || localCfg.announcementText,
        defaultTheme: d.defaultTheme === 'dark' ? 'dark' : 'light',
        invoiceDefaults: {
          ...localCfg.invoiceDefaults,
          gstPercent: typeof d.defaultGstPercent === 'number' ? d.defaultGstPercent : localCfg.invoiceDefaults.gstPercent,
          palette: d.defaultInvoicePalette || localCfg.invoiceDefaults.palette
        }
      };

      const hubSnap = await fbSdk.getDocs(fbSdk.collection(db, 'hubApps'));
      if (!hubSnap.empty) {
        const cloudHub = [];
        hubSnap.forEach(s => cloudHub.push({ id: s.id, ...s.data() }));
        cloudHub.sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
        merged.hubApps = cloudHub;
      }

      try { localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(merged)); } catch {}
    } else {
      session.authenticated = true;
      session.user = user;
      await syncCloudConfig(localCfg);
    }

    try {
      const logQ = fbSdk.query(fbSdk.collection(db, 'adminAuditLogs'), fbSdk.orderBy('createdAt', 'desc'), fbSdk.limit(25));
      const logSnap = await fbSdk.getDocs(logQ);
      const logs = [];
      logSnap.forEach(s => {
        const d = s.data();
        const ts = d.createdAt?.toDate ? d.createdAt.toDate() : new Date();
        logs.push({
          id: s.id,
          eventType: d.eventType || 'INFO',
          summary: d.summary || '',
          severity: d.severity || 'INFO',
          time: ts.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        });
      });
      session.auditLogs = logs;
    } catch {
      session.auditLogs = [];
    }

    session.cloudSyncedAt = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return true;
  } catch (err) {
    console.error('Admin verification rejected by Firestore Security Rules:', err);
    return false;
  }
}

/* =========================================================================
   FIREBASE AUTH HANDLERS (LOGIN + MATH QUIZ + FORGOT PASSWORD)
   ========================================================================= */
async function handleAdminLoginSubmit(e) {
  e.preventDefault();
  session.authError = '';
  session.authNotice = '';

  const email = sanitizeText(document.getElementById('loginEmail')?.value || '', 200);
  const password = document.getElementById('loginPassword')?.value || '';
  const mathAns = (document.getElementById('mathQuizAnswer')?.value || '').trim();

  if (mathAns === '' || Number(mathAns) !== session.mathQuiz.answer) {
    rollMathQuiz();
    session.authError = 'Incorrect Math Quiz answer. Solve the new single-digit equation.';
    render();
    return;
  }

  if (!isFirebaseConfigured()) {
    session.authError = 'Firebase is not connected yet. Paste your Firebase Web App config into firebase-config.js.';
    render();
    return;
  }

  if (!email || !password) {
    session.authError = 'Enter both your Admin Email and Password.';
    render();
    return;
  }

  session.authBusy = true;
  render();

  const ready = await initFirebaseSafely();
  if (!ready || !auth || !fbSdk) {
    session.authBusy = false;
    session.authError = 'Could not initialize Firebase Authentication. Check firebase-config.js and network connectivity.';
    render();
    return;
  }

  try {
    const cred = await fbSdk.signInWithEmailAndPassword(auth, email, password);
    const allowed = await verifyAndLoadAdminSession(cred.user);
    if (!allowed) {
      await fbSdk.signOut(auth);
      rollMathQuiz();
      session.authenticated = false;
      session.user = null;
      session.authError = `Unauthorized Account: "${email}" is not the designated AquaVault Admin in firestore.rules. Non-admin access is strictly blocked.`;
      session.authBusy = false;
      render();
      return;
    }

    session.authenticated = true;
    session.user = cred.user;
    session.lastActivityAt = Date.now();
    session.authBusy = false;
    await appendCloudAudit('LOGIN_VERIFIED', `Firebase Admin signed in (${cred.user.email})`, 'INFO');
    render();
    showToast(`Signed in as ${cred.user.email}`);
  } catch (err) {
    rollMathQuiz();
    session.authBusy = false;
    const code = err?.code || '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      session.authError = 'Invalid Admin email or password.';
    } else if (code === 'auth/too-many-requests') {
      session.authError = 'Too many failed attempts. Please wait a few minutes or reset your password.';
    } else {
      session.authError = err?.message || 'Firebase sign-in failed.';
    }
    render();
  }
}

function openForgotPasswordView() {
  session.authView = 'forgot';
  session.authError = '';
  session.authNotice = '';
  rollMathQuiz();
  render();
}

function backToLoginView() {
  session.authView = 'login';
  session.authError = '';
  session.authNotice = '';
  rollMathQuiz();
  render();
}

async function handleForgotPasswordSubmit(e) {
  e.preventDefault();
  session.authError = '';
  session.authNotice = '';

  const email = sanitizeText(document.getElementById('resetEmail')?.value || '', 200);
  const mathAns = (document.getElementById('mathQuizAnswer')?.value || '').trim();

  if (mathAns === '' || Number(mathAns) !== session.mathQuiz.answer) {
    rollMathQuiz();
    session.authError = 'Incorrect Math Quiz answer. Solve the new equation to send reset link.';
    render();
    return;
  }

  if (!isFirebaseConfigured()) {
    session.authError = 'Firebase is not connected yet. Paste your Firebase Web App config in firebase-config.js.';
    render();
    return;
  }

  if (!email) {
    session.authError = 'Enter your Admin email address.';
    render();
    return;
  }

  session.authBusy = true;
  render();

  const ready = await initFirebaseSafely();
  if (!ready || !auth || !fbSdk) {
    session.authBusy = false;
    session.authError = 'Could not initialize Firebase Authentication.';
    render();
    return;
  }

  try {
    await fbSdk.sendPasswordResetEmail(auth, email);
    session.authBusy = false;
    session.authNotice = `Firebase password reset email sent to ${email}. Check your inbox and spam folder.`;
    rollMathQuiz();
    render();
    showToast(`Password reset email sent to ${email}`);
  } catch (err) {
    session.authBusy = false;
    rollMathQuiz();
    session.authError = err?.message || 'Could not send Firebase password reset email.';
    render();
  }
}

async function handleAdminSignOut() {
  if (auth && fbSdk) {
    try { await fbSdk.signOut(auth); } catch {}
  }
  session.authenticated = false;
  session.user = null;
  session.authView = 'login';
  session.authError = '';
  session.authNotice = 'Signed out securely.';
  rollMathQuiz();
  render();
  showToast('Signed out of AquaVault Admin');
}

async function handleSendResetFromSecurityPanel() {
  if (!auth || !fbSdk || !session.user?.email) return showToast('Not connected to Firebase Auth');
  try {
    await fbSdk.sendPasswordResetEmail(auth, session.user.email);
    await appendCloudAudit('PASSWORD_RESET', `Password reset email dispatched to ${session.user.email}`, 'INFO');
    render();
    showToast(`Firebase password reset email sent to ${session.user.email}`);
  } catch (err) {
    showToast(`Reset failed: ${err.message}`);
  }
}

async function handleChangeFirebasePassword(e) {
  e.preventDefault();
  if (!auth || !fbSdk || !session.user) return showToast('Sign in to Firebase first');
  const nextPass = document.getElementById('secNewFbPass')?.value || '';
  const confirmPass = document.getElementById('secConfirmFbPass')?.value || '';
  if (nextPass.length < 8) return showToast('New password must be at least 8 characters');
  if (nextPass !== confirmPass) return showToast('Passwords do not match');
  try {
    await fbSdk.updatePassword(session.user, nextPass);
    await appendCloudAudit('PASSWORD_RESET', 'Admin password updated via Firebase Auth', 'WARNING');
    render();
    showToast('Firebase Admin password updated successfully');
  } catch (err) {
    if (err?.code === 'auth/requires-recent-login') {
      showToast('For security, sign out and sign back in—or use "Send Password Reset Email".');
    } else {
      showToast(`Password update failed: ${err.message}`);
    }
  }
}

async function handleManualCloudSync() {
  const cfg = loadAdminConfig();
  await syncCloudConfig(cfg);
  await appendCloudAudit('CONFIG_UPDATED', 'Manual full Firestore config & hub sync triggered', 'INFO');
  render();
  showToast('Synced configuration & Hub Apps to Firestore');
}

/* =========================================================================
   ADMIN FEATURE CONTROL ACTIONS
   ========================================================================= */
function setTab(tabId) {
  session.activeTab = tabId;
  recordAdminActivity();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleFeatureFlag(key) {
  const cfg = loadAdminConfig();
  cfg.features[key] = !cfg.features[key];
  saveAdminConfig(cfg);
  appendCloudAudit('CONFIG_UPDATED', `Feature "${key}" turned ${cfg.features[key] ? 'ON' : 'OFF'}`, 'INFO');
  render();
  showToast(`${key.toUpperCase()} is now ${cfg.features[key] ? 'ENABLED' : 'DISABLED'} in Customer App`);
}

function toggleMaintenanceMode() {
  const cfg = loadAdminConfig();
  cfg.maintenanceMode = !cfg.maintenanceMode;
  saveAdminConfig(cfg);
  appendCloudAudit('CONFIG_UPDATED', `Maintenance Mode switched ${cfg.maintenanceMode ? 'ON' : 'OFF'}`, 'WARNING');
  render();
  showToast(cfg.maintenanceMode ? 'Maintenance Mode ACTIVE on Customer App' : 'Customer App is LIVE');
}

function toggleAnnouncementActive() {
  const cfg = loadAdminConfig();
  cfg.announcementActive = !cfg.announcementActive;
  saveAdminConfig(cfg);
  appendCloudAudit('CONFIG_UPDATED', `Broadcast Banner ${cfg.announcementActive ? 'ENABLED' : 'HIDDEN'}`, 'INFO');
  render();
  showToast(cfg.announcementActive ? 'Broadcast Banner published to Customer App' : 'Broadcast Banner hidden');
}

function saveBroadcastAndBranding(e) {
  e.preventDefault();
  const cfg = loadAdminConfig();
  cfg.announcementText = sanitizeText(document.getElementById('cfgAnnouncementText')?.value || '', 300);
  cfg.maintenanceMessage = sanitizeText(document.getElementById('cfgMaintenanceMsg')?.value || '', 300);
  cfg.defaultTheme = document.getElementById('cfgDefaultTheme')?.value === 'dark' ? 'dark' : 'light';
  saveAdminConfig(cfg);
  appendCloudAudit('CONFIG_UPDATED', 'Updated broadcast banner, maintenance message & default theme', 'INFO');
  showToast('Customer App branding & broadcast saved');
  render();
}

/* Units & Warranties CRUD */
function extendUnitWarranty(unitId, extraDays) {
  const cs = loadCustomerState();
  const unit = cs.units.find(u => u.id === unitId);
  if (!unit) return;
  const [y, m, d] = unit.expiryDate.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const startFrom = base < today ? today : base;
  const next = new Date(startFrom.getTime() + extraDays * 86400000);
  unit.expiryDate = next.toISOString().slice(0, 10);
  saveCustomerState(cs);
  appendCloudAudit('WARRANTY_MODIFIED', `Extended warranty for ${unit.model} (${unit.serial}) by +${extraDays} days`, 'INFO');
  render();
  showToast(`Warranty extended +${extraDays} days (until ${unit.expiryDate})`);
}

function deleteUnit(unitId) {
  const cs = loadCustomerState();
  const found = cs.units.find(u => u.id === unitId);
  cs.units = cs.units.filter(u => u.id !== unitId);
  saveCustomerState(cs);
  appendCloudAudit('WARRANTY_MODIFIED', `Removed hardware unit ${found ? found.serial : unitId}`, 'WARNING');
  render();
  showToast('Device removed from Customer Vault');
}

function addHardwareUnit(e) {
  e.preventDefault();
  const model = sanitizeText(document.getElementById('newUnitModel')?.value || '', 120);
  const type = document.getElementById('newUnitType')?.value === 'stopper' ? 'stopper' : 'controller';
  const serial = sanitizeText(document.getElementById('newUnitSerial')?.value || '', 80).toUpperCase();
  const location = sanitizeText(document.getElementById('newUnitLocation')?.value || '', 80);
  const days = Math.max(30, Math.min(3650, Number(document.getElementById('newUnitDays')?.value || 365)));
  const price = Math.max(0, Math.min(10000000, Number(document.getElementById('newUnitPrice')?.value || 6500)));
  if (!model || !serial || !location) return showToast('Fill Model, Serial Number, and Location');

  const cs = loadCustomerState();
  const today = shiftDaysIso(0);
  const expiry = shiftDaysIso(days);
  cs.units.unshift({
    id: 'u_' + Date.now().toString(36),
    type,
    model,
    serial,
    location,
    installDate: today,
    expiryDate: expiry,
    invoiceNo: 'INV-AQV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
    basePrice: price,
    gstRate: 18
  });
  saveCustomerState(cs);
  appendCloudAudit('WARRANTY_MODIFIED', `Added new ${type}: ${model} (${serial}) with ${days}d warranty`, 'INFO');
  render();
  showToast(`Added ${model} to Customer App`);
}

/* Service Tickets Control */
function setTicketFilter(f) {
  session.ticketFilter = f;
  render();
}

function updateTicketStatus(ticketId, nextStatus) {
  const cs = loadCustomerState();
  const t = cs.tickets.find(x => x.id === ticketId);
  if (!t) return;
  t.status = nextStatus;
  saveCustomerState(cs);
  appendCloudAudit('TICKET_UPDATED', `Ticket ${ticketId} status changed to ${nextStatus}`, 'INFO');
  render();
  showToast(`Ticket ${ticketId} marked ${nextStatus}`);
}

function deleteTicket(ticketId) {
  const cs = loadCustomerState();
  cs.tickets = cs.tickets.filter(x => x.id !== ticketId);
  saveCustomerState(cs);
  appendCloudAudit('TICKET_UPDATED', `Deleted service ticket ${ticketId}`, 'WARNING');
  render();
  showToast(`Ticket ${ticketId} deleted`);
}

/* Invoices & Billing Control */
function saveInvoiceDefaults(e) {
  e.preventDefault();
  const cfg = loadAdminConfig();
  cfg.invoiceDefaults = {
    businessName: sanitizeText(document.getElementById('invDefBizName')?.value || '', 120) || 'AquaVault Smart Systems Pvt. Ltd.',
    businessAddress: sanitizeText(document.getElementById('invDefBizAddr')?.value || '', 240),
    businessPhone: sanitizeText(document.getElementById('invDefBizPhone')?.value || '', 40),
    businessEmail: sanitizeText(document.getElementById('invDefBizEmail')?.value || '', 150),
    paymentDetails: sanitizeText(document.getElementById('invDefPay')?.value || '', 240),
    gstPercent: Math.max(0, Math.min(50, Number(document.getElementById('invDefGst')?.value || 18))),
    palette: document.getElementById('invDefPalette')?.value || 'violet',
    frameStyle: document.getElementById('invDefFrame')?.value === 'classic' ? 'classic' : 'colorful',
    googleSheetWebhook: (document.getElementById('invDefSheetUrl')?.value || '').trim().slice(0, 500)
  };
  if (cfg.invoiceDefaults.googleSheetWebhook && !isValidHttpsUrl(cfg.invoiceDefaults.googleSheetWebhook)) {
    return showToast('Google Sheet Webhook URL must start with https://');
  }
  saveAdminConfig(cfg);
  appendCloudAudit('CONFIG_UPDATED', `Updated Invoice Studio defaults (GST ${cfg.invoiceDefaults.gstPercent}%, Theme ${cfg.invoiceDefaults.palette})`, 'INFO');
  render();
  showToast('Invoice Studio defaults synced');
}

function updateSavedInvoiceStatus(invId, status) {
  const cs = loadCustomerState();
  const inv = (cs.invoices || []).find(x => x.id === invId);
  if (!inv) return;
  inv.status = status;
  saveCustomerState(cs);
  appendCloudAudit('CONFIG_UPDATED', `Invoice ${inv.invoiceNo} marked ${status}`, 'INFO');
  render();
  showToast(`Invoice ${inv.invoiceNo} updated to ${status}`);
}

function exportMasterInvoicesCsv() {
  const cs = loadCustomerState();
  const list = cs.invoices || [];
  if (!list.length) return showToast('No saved customer invoices yet');
  const cell = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const headers = ['Invoice No', 'Date', 'Due Date', 'Status', 'Customer', 'Phone', 'Email', 'Tax %', 'Discount %', 'Payment'];
  const rows = list.map(i => [
    i.invoiceNo, i.invoiceDate, i.dueDate, i.status, i.clientName, i.clientPhone, i.clientEmail, i.taxPct, i.discountPct, i.paymentMethod
  ].map(cell).join(','));
  const csv = '\uFEFF' + [headers.map(cell).join(','), ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `AquaVault-Admin-Invoices-${shiftDaysIso(0)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast(`Exported ${list.length} invoice(s) to Google Sheets CSV`);
}

/* New Tab Apps Hub Control */
function addHubApp(e) {
  e.preventDefault();
  const name = sanitizeText(document.getElementById('hubName')?.value || '', 100);
  const category = document.getElementById('hubCat')?.value || 'Website';
  const url = (document.getElementById('hubUrl')?.value || '').trim().slice(0, 500);
  const desc = sanitizeText(document.getElementById('hubDesc')?.value || '', 300);
  if (!name || !desc) return showToast('Enter App Name and Description');
  if (!isValidHttpsUrl(url)) return showToast('URL must be a valid https:// address');

  const cfg = loadAdminConfig();
  cfg.hubApps.unshift({
    id: 'h_' + Date.now().toString(36),
    name,
    category,
    desc,
    url,
    icon: category === 'Tool' ? 'gauge' : category === 'New App' ? 'bolt' : 'globe',
    enabled: true
  });
  saveAdminConfig(cfg);
  appendCloudAudit('HUB_UPDATED', `Published Hub App "${name}" (${category})`, 'INFO');
  render();
  showToast(`Added "${name}" to Customer Apps Hub`);
}

function toggleHubApp(appId) {
  const cfg = loadAdminConfig();
  const item = cfg.hubApps.find(x => x.id === appId);
  if (!item) return;
  item.enabled = !item.enabled;
  saveAdminConfig(cfg);
  appendCloudAudit('HUB_UPDATED', `Hub App "${item.name}" ${item.enabled ? 'shown' : 'hidden'}`, 'INFO');
  render();
  showToast(`${item.name} is now ${item.enabled ? 'visible' : 'hidden'}`);
}

async function deleteHubApp(appId) {
  const cfg = loadAdminConfig();
  const found = cfg.hubApps.find(x => x.id === appId);
  cfg.hubApps = cfg.hubApps.filter(x => x.id !== appId);
  saveAdminConfig(cfg);
  if (db && fbSdk && session.authenticated) {
    try { await fbSdk.deleteDoc(fbSdk.doc(db, 'hubApps', sanitizeId(appId))); } catch {}
  }
  appendCloudAudit('HUB_UPDATED', `Deleted Hub App "${found ? found.name : appId}"`, 'WARNING');
  render();
  showToast('App removed from New Tab Hub');
}

/* Customer Profile, Sync & Notes Control */
function saveCustomerControl(e) {
  e.preventDefault();
  const cs = loadCustomerState();
  cs.customer = {
    name: sanitizeText(document.getElementById('custName')?.value || '', 100) || 'Customer',
    accountId: sanitizeText(document.getElementById('custCode')?.value || '', 40) || 'AQV-2026-8419',
    email: sanitizeText(document.getElementById('custEmail')?.value || '', 150),
    city: sanitizeText(document.getElementById('custCity')?.value || '', 120)
  };
  saveCustomerState(cs);
  appendCloudAudit('CONFIG_UPDATED', `Updated customer profile for ${cs.customer.name} (${cs.customer.accountId})`, 'INFO');
  render();
  showToast('Customer profile updated');
}

function toggleCustomerPolicy(field) {
  const cs = loadCustomerState();
  if (field === 'gmailSync' || field === 'driveAutoSave') {
    cs.sync[field] = !cs.sync[field];
  } else if (field === 'dpdp') {
    cs.dpdp.consentGranted = !cs.dpdp.consentGranted;
  }
  saveCustomerState(cs);
  appendCloudAudit('CONFIG_UPDATED', `Toggled customer policy "${field}"`, 'INFO');
  render();
  showToast('Customer sync / privacy policy updated');
}

/* =========================================================================
   AUTH VIEWPORT (CLEAN ADMIN LOGIN + MATH QUIZ + FIREBASE FORGOT PASSWORD)
   ========================================================================= */
function renderNonBlockingFirebaseBanner() {
  if (isFirebaseConfigured()) return '';
  return `
    <div style="width:100%;max-width:470px;margin:0 auto 12px;padding:10px 14px;border-radius:14px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.35);display:flex;align-items:center;gap:10px;font-size:12px;color:var(--ink);">
      <span style="color:var(--amber);flex-shrink:0;">${ic('alert')}</span>
      <span><strong>Firebase Standby Mode:</strong> Paste your Firebase Web App config into <code>firebase-config.js</code> to activate live cloud authentication.</span>
    </div>
  `;
}

function renderMathQuizBlock() {
  const q = session.mathQuiz;
  return `
    <div class="math-quiz-box">
      <div class="math-quiz-head">
        <span class="badge badge-purple">${ic('shield')} Anti-Bot Math Quiz (Single Digit)</span>
        <button type="button" class="btn btn-sm btn-outline" onclick="refreshMathQuizUI()">
          ${ic('refresh')} New Quiz
        </button>
      </div>
      <div class="math-quiz-row">
        <div id="mathQuizEquation" class="math-equation-pill mono">${q.a} ${q.op} ${q.b} = ?</div>
        <input id="mathQuizAnswer" class="math-answer-input mono" type="number" inputmode="numeric" placeholder="Ans" autocomplete="off" required />
      </div>
    </div>
  `;
}

function renderAuthViewport() {
  const isDark = getTheme() === 'dark';

  let bodyHtml = '';

  if (session.checkingAuth) {
    bodyHtml = `
      <div style="text-align:center;padding:28px 12px;">
        <div class="security-shield-row" style="justify-content:center;">
          <span class="shield-chip">${ic('shield')} Verifying Firebase Session</span>
        </div>
        <h1 class="auth-title serif" style="font-size:28px;">Connecting to Firebase</h1>
        <p class="auth-sub" style="margin-bottom:0;">Checking server-side Admin privileges...</p>
      </div>
    `;
  } else if (session.authView === 'forgot') {
    bodyHtml = `
      <div class="security-shield-row">
        <span class="shield-chip amber">${ic('key')} Firebase Password Recovery</span>
        <span class="shield-chip emerald">Server-Side Reset</span>
      </div>
      <h1 class="auth-title serif">Forgot Password</h1>
      <p class="auth-sub">Enter your authorized Firebase Admin email and solve the single-digit Math Quiz to receive an official Firebase password reset link.</p>
      ${session.authError ? `<div class="lockout-box">${ic('alert')} <span>${esc(session.authError)}</span></div>` : ''}
      ${session.authNotice ? `<div class="otp-banner"><strong style="color:var(--emerald);">Reset Link Sent</strong><br/>${esc(session.authNotice)}</div>` : ''}
      <form onsubmit="handleForgotPasswordSubmit(event)">
        <div class="field">
          <label>Authorized Admin Email</label>
          <input id="resetEmail" class="input" type="email" placeholder="admin@yourcompany.com" autocomplete="email" required />
        </div>
        ${renderMathQuizBlock()}
        <button type="submit" class="btn btn-primary btn-full" ${session.authBusy ? 'disabled' : ''}>
          ${ic('mail')} ${session.authBusy ? 'Sending Reset Email...' : 'Send Reset Email'}
        </button>
      </form>
      <button type="button" class="btn btn-outline btn-full" style="margin-top:10px;" onclick="backToLoginView()">
        Back to Admin Login
      </button>
    `;
  } else {
    bodyHtml = `
      <div class="security-shield-row">
        <span class="shield-chip">${ic('shield')} Firebase Auth Gate</span>
        <span class="shield-chip emerald">30m Auto-Logout Guard</span>
      </div>
      <h1 class="auth-title serif">Admin Login</h1>
      <p class="auth-sub">Sign in with your authorized Firebase Admin email and password. Non-admin accounts are automatically rejected by server-side Firestore Security Rules.</p>
      ${session.authError ? `<div class="lockout-box">${ic('alert')} <span>${esc(session.authError)}</span></div>` : ''}
      ${session.authNotice ? `<div class="otp-banner">${esc(session.authNotice)}</div>` : ''}
      <form onsubmit="handleAdminLoginSubmit(event)">
        <div class="field">
          <label>Admin Email</label>
          <input id="loginEmail" class="input" type="email" placeholder="admin@yourcompany.com" autocomplete="email" required />
        </div>
        <div class="field">
          <label>Password</label>
          <input id="loginPassword" class="input" type="password" placeholder="Enter your Firebase password" autocomplete="current-password" required />
        </div>
        ${renderMathQuizBlock()}
        <button type="submit" class="btn btn-primary btn-full" ${session.authBusy ? 'disabled' : ''}>
          ${ic('lock')} ${session.authBusy ? 'Verifying with Firebase...' : 'Sign In to Admin'}
        </button>
      </form>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid var(--border);flex-wrap:wrap;">
        <span style="font-size:11.5px;color:var(--ink-tertiary);">Need to recover access?</span>
        <button type="button" class="btn btn-sm btn-soft" onclick="openForgotPasswordView()">
          ${ic('key')} Forgot Password
        </button>
      </div>
    `;
  }

  return `
    <div class="auth-viewport">
      <div class="auth-top-bar">
        <div class="auth-brand">
          <div class="auth-emblem"><img src="../assets/app-icon.jpg" alt="AquaVault Admin" /></div>
          <div>
            <div style="font-size:15px;font-weight:800;letter-spacing:-0.02em;">AquaVault Admin</div>
            <div style="font-size:10.5px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--primary);">Firebase Protected Console</div>
          </div>
        </div>
        <button type="button" class="pill-btn" onclick="toggleAdminTheme()">
          ${isDark ? ic('sun') : ic('moon')} ${isDark ? 'Day' : 'Night'}
        </button>
      </div>
      ${renderNonBlockingFirebaseBanner()}
      <div class="auth-card">${bodyHtml}</div>
      <div style="margin-top:14px;font-size:11px;color:var(--ink-tertiary);text-align:center;max-width:460px;">
        Authenticated via Firebase Authentication &bull; 30-Minute Inactivity Auto-Logout &bull; Enforced Server-Side by Firestore Rules.
      </div>
    </div>
  `;
}

/* =========================================================================
   AUTHENTICATED ADMIN COMMAND CENTER PANELS
   ========================================================================= */
function renderDashboardPanel(cfg, cs, logs) {
  const enabledCount = Object.values(cfg.features).filter(Boolean).length;
  const activeUnits = cs.units.filter(u => getDaysRemaining(u.expiryDate) > 0).length;
  const openTickets = cs.tickets.filter(t => t.status !== 'Resolved').length;
  const savedInvCount = (cs.invoices || []).length;

  return `
    <div class="page-head">
      <div class="eyebrow">Executive Command Center</div>
      <h1 class="page-title serif">AquaVault Master Control</h1>
      <p class="page-desc">Real-time control over every Customer App module, warranty timeline, service ticket, invoice studio, apps hub, and Firebase security policy.</p>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Active Modules</div>
        <div class="kpi-value mono">${enabledCount}/8</div>
        <div class="kpi-foot">${cfg.maintenanceMode ? '<span style="color:var(--rose);font-weight:700;">Maintenance ON</span>' : '<span style="color:var(--emerald);font-weight:700;">Customer App Live</span>'}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Protected Units</div>
        <div class="kpi-value mono">${activeUnits}/${cs.units.length}</div>
        <div class="kpi-foot">Controllers &amp; Stoppers</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Open Tickets</div>
        <div class="kpi-value mono">${openTickets}</div>
        <div class="kpi-foot">${cs.tickets.length} total requests</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Saved Invoices</div>
        <div class="kpi-value mono">${savedInvCount}</div>
        <div class="kpi-foot">GST Default: ${cfg.invoiceDefaults.gstPercent}%</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head">
          <div>
            <h2 class="card-title">Instant Emergency Switches</h2>
            <p class="card-sub">Synced with Firestore &amp; Customer App</p>
          </div>
          <span class="badge ${cfg.maintenanceMode ? 'badge-rose' : 'badge-emerald'}">${cfg.maintenanceMode ? 'Paused' : 'Operational'}</span>
        </div>
        <div class="toggle-row">
          <div class="toggle-meta">
            <div class="toggle-name">Customer App Maintenance Mode</div>
            <div class="toggle-desc">Shows luxury maintenance notice on all customer pages</div>
          </div>
          <button class="switch danger ${cfg.maintenanceMode ? 'on' : ''}" onclick="toggleMaintenanceMode()" aria-label="Toggle Maintenance Mode"></button>
        </div>
        <div class="toggle-row">
          <div class="toggle-meta">
            <div class="toggle-name">Top Customer Broadcast Banner</div>
            <div class="toggle-desc">Display urgent offers or monsoon alerts at the top of Customer App</div>
          </div>
          <button class="switch ${cfg.announcementActive ? 'on' : ''}" onclick="toggleAnnouncementActive()" aria-label="Toggle Broadcast Banner"></button>
        </div>
        <div class="toggle-row">
          <div class="toggle-meta">
            <div class="toggle-name">7-Second PWA Install Popup</div>
            <div class="toggle-desc">Auto-hiding app install banner at top of mobile browser</div>
          </div>
          <button class="switch ${cfg.features.pwaPopup ? 'on' : ''}" onclick="toggleFeatureFlag('pwaPopup')" aria-label="Toggle PWA Popup"></button>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <h2 class="card-title">Firestore Audit Trail</h2>
            <p class="card-sub">Append-only server security events</p>
          </div>
          <button class="btn btn-sm btn-soft" onclick="setTab('security')">Full Log</button>
        </div>
        ${logs.slice(0, 4).map(l => `
          <div class="item-row" style="padding:10px 12px;">
            <div class="item-top">
              <span class="badge ${l.severity === 'CRITICAL' ? 'badge-rose' : l.severity === 'WARNING' ? 'badge-amber' : 'badge-purple'}">${esc(l.eventType)}</span>
              <span class="mono" style="font-size:11px;color:var(--ink-tertiary);">${esc(l.time)}</span>
            </div>
            <div style="font-size:12.5px;margin-top:5px;color:var(--ink);">${esc(l.summary)}</div>
          </div>
        `).join('') || '<div style="font-size:12.5px;color:var(--ink-tertiary);">No server audit events yet.</div>'}
      </div>
    </div>
  `;
}

function renderFeaturesPanel(cfg) {
  const featureRows = [
    ['warranty', 'Warranty Countdown & Interactive Gauge', 'Controls visibility of warranty.html and live remaining-day ring'],
    ['devices', 'Devices, Digital Bills & Service Requests', 'Controls visibility of devices.html, bills, and service booking'],
    ['calculator', 'Hisab-Kitab Calculator (Basic / GST / Split / Margin)', 'Controls visibility of calculator.html financial utility'],
    ['invoice', 'Colorful Invoice Generator (PDF, PNG & Google Sheets)', 'Controls visibility of invoice.html and Home/Devices invoice banners'],
    ['notes', 'Personal Notepad with Gmail & Drive Auto-Sync', 'Controls visibility of notes.html personal maintenance notebook'],
    ['hub', 'New Tab (Apps Hub)', 'Controls visibility of hub.html external apps & tools directory'],
    ['privacy', 'DPDP Privacy & Data Controls', 'Controls visibility of privacy.html consent & export controls'],
    ['pwaPopup', '7-Second Auto-Hiding PWA Install Popup', 'Controls the top mobile install prompt popup']
  ];

  return `
    <div class="page-head">
      <div class="eyebrow">Master Feature Matrix</div>
      <h1 class="page-title serif">Feature Switches &amp; Branding</h1>
      <p class="page-desc">Enable or disable any Customer App page or module with 1 click, configure maintenance messages, and broadcast announcements.</p>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head">
          <div>
            <h2 class="card-title">Customer App Module Kill-Switches</h2>
            <p class="card-sub">Disabled modules are cleanly hidden from customer navigation</p>
          </div>
        </div>
        ${featureRows.map(([k, title, desc]) => `
          <div class="toggle-row">
            <div class="toggle-meta">
              <div class="toggle-name">${title}</div>
              <div class="toggle-desc">${desc}</div>
            </div>
            <button class="switch ${cfg.features[k] ? 'on' : ''}" onclick="toggleFeatureFlag('${k}')" aria-label="Toggle ${title}"></button>
          </div>
        `).join('')}
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <h2 class="card-title">Broadcast Banner &amp; Maintenance Copy</h2>
            <p class="card-sub">Push announcements or maintenance notices live</p>
          </div>
        </div>
        <form onsubmit="saveBroadcastAndBranding(event)">
          <div class="field">
            <label>Customer Broadcast Announcement Text</label>
            <textarea id="cfgAnnouncementText" class="textarea" maxlength="300">${esc(cfg.announcementText)}</textarea>
          </div>
          <div class="field">
            <label>Maintenance Mode Notice Message</label>
            <textarea id="cfgMaintenanceMsg" class="textarea" maxlength="300">${esc(cfg.maintenanceMessage)}</textarea>
          </div>
          <div class="field">
            <label>Default Customer Theme</label>
            <select id="cfgDefaultTheme" class="select">
              <option value="light" ${cfg.defaultTheme === 'light' ? 'selected' : ''}>Day Mode (Porcelain White + Imperial Purple)</option>
              <option value="dark" ${cfg.defaultTheme === 'dark' ? 'selected' : ''}>Night Mode (Obsidian Black + Luminous Violet)</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary btn-full">${ic('check')} Save &amp; Publish to Firestore</button>
        </form>
      </div>
    </div>
  `;
}

function renderDevicesPanel(cs) {
  return `
    <div class="page-head">
      <div class="eyebrow">Hardware &amp; Warranty Fleet</div>
      <h1 class="page-title serif">Units &amp; Warranty Control</h1>
      <p class="page-desc">Add Water Level Controllers or Water Stoppers, extend customer warranty timelines (+90d / +180d / +365d), or remove units.</p>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <h2 class="card-title">Register New Hardware Unit</h2>
          <p class="card-sub">Immediately appears in Customer Warranty &amp; Devices Vault</p>
        </div>
      </div>
      <form onsubmit="addHardwareUnit(event)">
        <div class="grid-2">
          <div class="field">
            <label>Product Model Name</label>
            <input id="newUnitModel" class="input" maxlength="120" placeholder="e.g. AquaVault Titan-X9 Controller" required />
          </div>
          <div class="field">
            <label>Hardware Category</label>
            <select id="newUnitType" class="select">
              <option value="controller">Water Level Controller</option>
              <option value="stopper">Water Stopper Valve</option>
            </select>
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <label>Serial Number</label>
            <input id="newUnitSerial" class="input mono" maxlength="80" placeholder="AV-WLC-99201" required />
          </div>
          <div class="field">
            <label>Installation Location Tag</label>
            <input id="newUnitLocation" class="input" maxlength="80" placeholder="e.g. Rooftop Overhead Tank" required />
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <label>Warranty Coverage (Days)</label>
            <input id="newUnitDays" class="input mono" type="number" value="365" min="30" max="3650" required />
          </div>
          <div class="field">
            <label>Base Price (INR)</label>
            <input id="newUnitPrice" class="input mono" type="number" value="7950" min="0" max="10000000" required />
          </div>
        </div>
        <button type="submit" class="btn btn-primary">${ic('plus')} Add Device &amp; Activate Warranty</button>
      </form>
    </div>

    <div class="card">
      <div class="card-head">
        <h2 class="card-title">Registered Customer Units (${cs.units.length})</h2>
      </div>
      ${cs.units.map(u => {
        const rem = getDaysRemaining(u.expiryDate);
        const badge = rem === 0 ? 'badge-rose' : rem <= 45 ? 'badge-amber' : 'badge-emerald';
        const label = rem === 0 ? 'Expired' : `${rem}d Left`;
        const safeId = sanitizeId(u.id);
        return `
          <div class="item-row">
            <div class="item-top">
              <div>
                <div style="font-size:14px;font-weight:800;">${esc(u.model)}</div>
                <div class="mono" style="font-size:11.5px;color:var(--ink-secondary);margin-top:2px;">
                  ${esc(u.serial)} &middot; ${esc(u.location)} &middot; ${formatINR(u.basePrice)} + ${u.gstRate}% GST
                </div>
                <div style="font-size:11.5px;color:var(--ink-tertiary);margin-top:2px;">
                  Installed: <span class="mono">${esc(u.installDate)}</span> &middot; Expires: <span class="mono">${esc(u.expiryDate)}</span>
                </div>
              </div>
              <span class="badge ${badge}">${label}</span>
            </div>
            <div class="item-actions">
              <button class="btn btn-sm btn-emerald" onclick="extendUnitWarranty('${safeId}', 90)">+90d Warranty</button>
              <button class="btn btn-sm btn-soft" onclick="extendUnitWarranty('${safeId}', 180)">+180d</button>
              <button class="btn btn-sm btn-soft" onclick="extendUnitWarranty('${safeId}', 365)">+1 Year</button>
              <button class="btn btn-sm btn-danger" onclick="deleteUnit('${safeId}')">${ic('trash')} Remove</button>
            </div>
          </div>
        `;
      }).join('') || '<div style="font-size:13px;color:var(--ink-tertiary);">No devices registered.</div>'}
    </div>
  `;
}

function renderTicketsPanel(cs) {
  const filters = ['All', 'Logged', 'Scheduled', 'Resolved'];
  const list = cs.tickets.filter(t => session.ticketFilter === 'All' || t.status === session.ticketFilter);

  return `
    <div class="page-head">
      <div class="eyebrow">Service Operations</div>
      <h1 class="page-title serif">Service Tickets Control</h1>
      <p class="page-desc">Review customer inspection &amp; repair tickets, schedule technician visits, or mark tickets resolved (with admin override).</p>
    </div>

    <div class="card">
      <div class="card-head">
        <h2 class="card-title">Tickets Queue (${list.length})</h2>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${filters.map(f => `<button class="btn btn-sm ${session.ticketFilter === f ? 'btn-primary' : 'btn-outline'}" onclick="setTicketFilter('${f}')">${f}</button>`).join('')}
        </div>
      </div>

      ${list.map(t => {
        const badge = t.status === 'Resolved' ? 'badge-emerald' : t.status === 'Scheduled' ? 'badge-purple' : 'badge-amber';
        const safeId = sanitizeId(t.id);
        return `
          <div class="item-row">
            <div class="item-top">
              <div>
                <div style="font-size:14px;font-weight:800;"><span class="mono" style="color:var(--primary);">${esc(t.id)}</span> &middot; ${esc(t.issue)}</div>
                <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">${esc(t.unitName)} &middot; ${esc(t.date)}</div>
                <div style="font-size:12.5px;color:var(--ink);margin-top:5px;">${esc(t.notes)}</div>
              </div>
              <span class="badge ${badge}">${esc(t.status)}</span>
            </div>
            <div class="item-actions">
              <button class="btn btn-sm btn-outline" onclick="updateTicketStatus('${safeId}', 'Logged')">Mark Logged</button>
              <button class="btn btn-sm btn-soft" onclick="updateTicketStatus('${safeId}', 'Scheduled')">Schedule Visit</button>
              <button class="btn btn-sm btn-emerald" onclick="updateTicketStatus('${safeId}', 'Resolved')">${ic('check')} Resolve</button>
              <button class="btn btn-sm btn-danger" onclick="deleteTicket('${safeId}')">${ic('trash')}</button>
            </div>
          </div>
        `;
      }).join('') || '<div style="font-size:13px;color:var(--ink-tertiary);">No tickets in this queue.</div>'}
    </div>
  `;
}

function renderInvoicesPanel(cfg, cs) {
  const d = cfg.invoiceDefaults;
  const saved = cs.invoices || [];
  return `
    <div class="page-head">
      <div class="eyebrow">Billing &amp; Revenue Studio</div>
      <h1 class="page-title serif">Invoice Studio Control</h1>
      <p class="page-desc">Configure default company letterhead, GST rate, color theme, and Google Sheets Webhook for Customer Invoice Generator, and manage all saved invoices.</p>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <h2 class="card-title">Global Invoice Studio Defaults</h2>
          <p class="card-sub">Automatically pre-fills new colorful invoices</p>
        </div>
      </div>
      <form onsubmit="saveInvoiceDefaults(event)">
        <div class="grid-2">
          <div class="field">
            <label>Default Business Name</label>
            <input id="invDefBizName" class="input" maxlength="120" value="${esc(d.businessName)}" required />
          </div>
          <div class="field">
            <label>Default Billing Phone</label>
            <input id="invDefBizPhone" class="input" maxlength="40" value="${esc(d.businessPhone)}" />
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <label>Default Billing Email</label>
            <input id="invDefBizEmail" class="input" maxlength="150" value="${esc(d.businessEmail)}" />
          </div>
          <div class="field">
            <label>Default GST / Tax %</label>
            <input id="invDefGst" class="input mono" type="number" step="0.5" min="0" max="50" value="${esc(d.gstPercent)}" />
          </div>
        </div>
        <div class="field">
          <label>Default Business Address</label>
          <input id="invDefBizAddr" class="input" maxlength="240" value="${esc(d.businessAddress)}" />
        </div>
        <div class="field">
          <label>Default Bank / UPI Payment Instructions</label>
          <input id="invDefPay" class="input" maxlength="240" value="${esc(d.paymentDetails)}" />
        </div>
        <div class="grid-2">
          <div class="field">
            <label>Default Color Palette</label>
            <select id="invDefPalette" class="select">
              ${['violet', 'sapphire', 'emerald', 'crimson', 'gold', 'obsidian'].map(p => `<option value="${p}" ${d.palette === p ? 'selected' : ''}>${p.toUpperCase()}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Default Frame Style</label>
            <select id="invDefFrame" class="select">
              <option value="colorful" ${d.frameStyle === 'colorful' ? 'selected' : ''}>Colorful Executive Gradient</option>
              <option value="classic" ${d.frameStyle === 'classic' ? 'selected' : ''}>Classic Double-Border Frame</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label>Default Google Sheets Apps Script Webhook (Optional HTTPS)</label>
          <input id="invDefSheetUrl" class="input mono" type="url" maxlength="500" value="${esc(d.googleSheetWebhook || '')}" placeholder="https://script.google.com/macros/s/.../exec" />
        </div>
        <button type="submit" class="btn btn-primary">${ic('check')} Save Invoice Studio Defaults</button>
      </form>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <h2 class="card-title">Customer Saved Invoices (${saved.length})</h2>
          <p class="card-sub">Update payment status or download master Google Sheets CSV</p>
        </div>
        <button class="btn btn-sm btn-emerald" onclick="exportMasterInvoicesCsv()">${ic('download')} Export Master CSV</button>
      </div>
      ${saved.map(inv => {
        const safeId = sanitizeId(inv.id);
        return `
        <div class="item-row">
          <div class="item-top">
            <div>
              <div class="mono" style="font-size:13.5px;font-weight:800;color:var(--primary);">${esc(inv.invoiceNo)}</div>
              <div style="font-size:12.5px;font-weight:700;margin-top:2px;">${esc(inv.clientName)} &middot; <span class="mono">${esc(inv.invoiceDate)}</span></div>
            </div>
            <span class="badge ${inv.status === 'PAID' ? 'badge-emerald' : inv.status === 'OVERDUE' ? 'badge-rose' : 'badge-amber'}">${esc(inv.status)}</span>
          </div>
          <div class="item-actions">
            <button class="btn btn-sm btn-emerald" onclick="updateSavedInvoiceStatus('${safeId}', 'PAID')">Mark PAID</button>
            <button class="btn btn-sm btn-outline" onclick="updateSavedInvoiceStatus('${safeId}', 'PENDING')">Pending</button>
            <button class="btn btn-sm btn-danger" onclick="updateSavedInvoiceStatus('${safeId}', 'OVERDUE')">Overdue</button>
          </div>
        </div>
      `;
      }).join('') || '<div style="font-size:13px;color:var(--ink-tertiary);">No invoices saved in Customer Invoice Vault yet.</div>'}
    </div>
  `;
}

function renderHubPanel(cfg) {
  return `
    <div class="page-head">
      <div class="eyebrow">Ecosystem Directory</div>
      <h1 class="page-title serif">New Tab Apps Hub Control</h1>
      <p class="page-desc">Add, hide, or remove external websites, companion apps, and water tools shown inside the Customer New Tab Hub (strict HTTPS-only URL guard).</p>
    </div>

    <div class="card">
      <div class="card-head"><h2 class="card-title">Publish New App / Website Card</h2></div>
      <form onsubmit="addHubApp(event)">
        <div class="grid-2">
          <div class="field">
            <label>App / Website Title</label>
            <input id="hubName" class="input" maxlength="100" placeholder="e.g. AquaVault Dealer Locator" required />
          </div>
          <div class="field">
            <label>Category</label>
            <select id="hubCat" class="select">
              <option value="Website">Website</option>
              <option value="New App">New App</option>
              <option value="Tool">Tool</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label>Destination URL (Strict https:// only)</label>
          <input id="hubUrl" class="input mono" type="url" maxlength="500" placeholder="https://example.com" required />
        </div>
        <div class="field">
          <label>Short Description</label>
          <input id="hubDesc" class="input" maxlength="300" placeholder="One-line value summary for customers" required />
        </div>
        <button type="submit" class="btn btn-primary">${ic('plus')} Publish to Customer Hub</button>
      </form>
    </div>

    <div class="card">
      <div class="card-head"><h2 class="card-title">Live Hub Directory (${cfg.hubApps.length})</h2></div>
      ${cfg.hubApps.map(app => {
        const safeId = sanitizeId(app.id);
        return `
        <div class="item-row">
          <div class="item-top">
            <div style="min-width:0;flex:1;">
              <div style="font-size:14px;font-weight:800;">${esc(app.name)} <span class="badge badge-purple" style="margin-left:5px;">${esc(app.category)}</span></div>
              <div style="font-size:12px;color:var(--ink-secondary);margin-top:3px;">${esc(app.desc)}</div>
              <div class="mono" style="font-size:11px;color:var(--ink-tertiary);margin-top:3px;word-break:break-all;">${esc(app.url)}</div>
            </div>
            <span class="badge ${app.enabled ? 'badge-emerald' : 'badge-rose'}">${app.enabled ? 'Visible' : 'Hidden'}</span>
          </div>
          <div class="item-actions">
            <button class="btn btn-sm btn-soft" onclick="toggleHubApp('${safeId}')">${app.enabled ? 'Hide Card' : 'Show Card'}</button>
            <button class="btn btn-sm btn-danger" onclick="deleteHubApp('${safeId}')">${ic('trash')} Delete</button>
          </div>
        </div>
      `;
      }).join('')}
    </div>
  `;
}

function renderCustomersPanel(cs) {
  const c = cs.customer || {};
  return `
    <div class="page-head">
      <div class="eyebrow">Customer Governance &amp; DPDP</div>
      <h1 class="page-title serif">Customer, Notes &amp; DPDP</h1>
      <p class="page-desc">Manage customer identity metadata, default Gmail/Google Drive Note Sync policies, and DPDP Act compliance status.</p>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head"><h2 class="card-title">Customer Profile Record</h2></div>
        <form onsubmit="saveCustomerControl(event)">
          <div class="field">
            <label>Customer Full Name</label>
            <input id="custName" class="input" maxlength="100" value="${esc(c.name)}" required />
          </div>
          <div class="field">
            <label>AquaVault Customer ID</label>
            <input id="custCode" class="input mono" maxlength="40" value="${esc(c.accountId)}" required />
          </div>
          <div class="field">
            <label>Customer Email</label>
            <input id="custEmail" class="input" type="email" maxlength="150" value="${esc(c.email)}" />
          </div>
          <div class="field">
            <label>City / Region</label>
            <input id="custCity" class="input" maxlength="120" value="${esc(c.city)}" />
          </div>
          <button type="submit" class="btn btn-primary btn-full">${ic('check')} Update Customer Record</button>
        </form>
      </div>

      <div class="card">
        <div class="card-head"><h2 class="card-title">Cloud Sync &amp; DPDP Compliance</h2></div>
        <div class="toggle-row">
          <div class="toggle-meta">
            <div class="toggle-name">Notepad Gmail Auto-Sync</div>
            <div class="toggle-desc">Default Gmail backup status for customer notes</div>
          </div>
          <button class="switch ${cs.sync?.gmailSync ? 'on' : ''}" onclick="toggleCustomerPolicy('gmailSync')"></button>
        </div>
        <div class="toggle-row">
          <div class="toggle-meta">
            <div class="toggle-name">Google Drive Auto-Save</div>
            <div class="toggle-desc">Default Drive backup toggle for customer notes</div>
          </div>
          <button class="switch ${cs.sync?.driveAutoSave ? 'on' : ''}" onclick="toggleCustomerPolicy('driveAutoSave')"></button>
        </div>
        <div class="toggle-row">
          <div class="toggle-meta">
            <div class="toggle-name">DPDP Act 2023 Consent Active</div>
            <div class="toggle-desc">Current customer digital privacy consent status</div>
          </div>
          <button class="switch ${cs.dpdp?.consentGranted ? 'on' : ''}" onclick="toggleCustomerPolicy('dpdp')"></button>
        </div>
        <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);font-size:12px;color:var(--ink-secondary);">
          Stored Customer Notes: <strong class="mono">${(cs.notes || []).length}</strong> &middot;
          DPDP Audit Entries: <strong class="mono">${(cs.dpdp?.auditTrail || []).length}</strong>
        </div>
      </div>
    </div>
  `;
}

function renderSecurityPanel(logs) {
  const user = session.user || {};
  return `
    <div class="page-head">
      <div class="eyebrow">Server-Side Firebase Security</div>
      <h1 class="page-title serif">Firebase Security &amp; Audit</h1>
      <p class="page-desc">Admin authentication and permissions are enforced exclusively by Firebase Authentication, a 30-minute inactivity auto-logout timer, and Firestore Security Rules.</p>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head">
          <div>
            <h2 class="card-title">Active Firebase Admin Session</h2>
            <p class="card-sub">Verified server-side by Firestore Security Rules</p>
          </div>
          <span class="badge badge-emerald">${ic('check')} Authenticated</span>
        </div>
        <div class="item-row">
          <div style="font-size:12px;color:var(--ink-tertiary);">Signed-In Email</div>
          <div class="mono" style="font-size:13.5px;font-weight:700;margin-top:2px;">${esc(user.email || 'Unknown')}</div>
          <div style="font-size:12px;color:var(--ink-tertiary);margin-top:10px;">Firebase UID</div>
          <div class="mono" style="font-size:12px;color:var(--ink-secondary);margin-top:2px;word-break:break-all;">${esc(user.uid || '')}</div>
          <div style="font-size:12px;color:var(--ink-tertiary);margin-top:10px;">Inactivity Auto-Logout Protection</div>
          <div class="mono" style="font-size:12px;color:var(--primary);margin-top:2px;">Active (${getRemainingSessionMinutes()} min remaining before auto-logout)</div>
          <div style="font-size:12px;color:var(--ink-tertiary);margin-top:10px;">Last Firestore Sync</div>
          <div class="mono" style="font-size:12px;color:var(--emerald);margin-top:2px;">${esc(session.cloudSyncedAt || 'Synced')}</div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;">
          <button type="button" class="btn btn-primary" onclick="handleManualCloudSync()">${ic('refresh')} Sync Config to Firestore</button>
          <button type="button" class="btn btn-soft" onclick="handleSendResetFromSecurityPanel()">${ic('mail')} Send Password Reset Email</button>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <h2 class="card-title">Update Admin Password</h2>
            <p class="card-sub">Updates your password directly in Firebase Authentication</p>
          </div>
        </div>
        <form onsubmit="handleChangeFirebasePassword(event)">
          <div class="field">
            <label>New Firebase Password (8+ chars)</label>
            <input id="secNewFbPass" class="input" type="password" placeholder="Strong new password" autocomplete="new-password" required />
          </div>
          <div class="field">
            <label>Confirm New Password</label>
            <input id="secConfirmFbPass" class="input" type="password" placeholder="Re-enter new password" autocomplete="new-password" required />
          </div>
          <button type="submit" class="btn btn-primary btn-full">${ic('key')} Update Firebase Password</button>
        </form>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <h2 class="card-title">Strict Server-Side Firestore Rules</h2>
          <p class="card-sub">Enforced on Google Firebase servers — unauthenticated &amp; non-admin requests are rejected</p>
        </div>
        <span class="badge badge-emerald">${ic('shield')} Default Deny Active</span>
      </div>
      <div class="security-shield-row" style="margin-bottom:0;">
        <span class="shield-chip emerald">Zero Local Admin Storage</span>
        <span class="shield-chip emerald">30-Min Inactivity Logout</span>
        <span class="shield-chip emerald">Strict Admin Email Rules</span>
        <span class="shield-chip emerald">Per-User UID Isolation</span>
        <span class="shield-chip emerald">Root User Listing Blocked</span>
        <span class="shield-chip emerald">30-Key Payload Cap</span>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <h2 class="card-title">Server Audit Log (${logs.length})</h2>
      </div>
      ${logs.slice(0, 20).map(l => `
        <div class="item-row" style="padding:10px 12px;">
          <div class="item-top">
            <span class="badge ${l.severity === 'CRITICAL' ? 'badge-rose' : l.severity === 'WARNING' ? 'badge-amber' : 'badge-purple'}">${esc(l.eventType)}</span>
            <span class="mono" style="font-size:11px;color:var(--ink-tertiary);">${esc(l.time)}</span>
          </div>
          <div style="font-size:12.5px;margin-top:4px;">${esc(l.summary)}</div>
        </div>
      `).join('') || '<div style="font-size:12.5px;color:var(--ink-tertiary);">No logs recorded yet.</div>'}
    </div>
  `;
}

/* =========================================================================
   MAIN SHELL & RENDER LOOP
   ========================================================================= */
function renderAdminShell() {
  const cfg = loadAdminConfig();
  const cs = loadCustomerState();
  const logs = session.auditLogs;
  const user = session.user || {};
  const isDark = getTheme() === 'dark';

  let contentHtml = '';
  switch (session.activeTab) {
    case 'features': contentHtml = renderFeaturesPanel(cfg); break;
    case 'devices': contentHtml = renderDevicesPanel(cs); break;
    case 'tickets': contentHtml = renderTicketsPanel(cs); break;
    case 'invoices': contentHtml = renderInvoicesPanel(cfg, cs); break;
    case 'hub': contentHtml = renderHubPanel(cfg); break;
    case 'customers': contentHtml = renderCustomersPanel(cs); break;
    case 'security': contentHtml = renderSecurityPanel(logs); break;
    default: contentHtml = renderDashboardPanel(cfg, cs, logs); break;
  }

  return `
    <div class="admin-shell">
      <aside class="admin-sidebar">
        <div class="auth-brand" style="padding:2px 8px 16px;border-bottom:1px solid var(--border);">
          <div class="auth-emblem"><img src="../assets/app-icon.jpg" alt="AquaVault Admin" /></div>
          <div style="min-width:0;">
            <div style="font-size:15.5px;font-weight:800;letter-spacing:-0.02em;">AquaVault Admin</div>
            <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--primary);">Command Center</div>
          </div>
        </div>
        <nav class="admin-nav">
          ${ADMIN_TABS.map(t => `
            <button class="nav-item-btn ${session.activeTab === t.id ? 'active' : ''}" onclick="setTab('${t.id}')">
              ${ic(t.icon)} <span>${t.label}</span>
            </button>
          `).join('')}
        </nav>
        <div style="padding-top:12px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:8px;">
          <div style="font-size:11.5px;color:var(--ink-secondary);padding:0 6px;overflow:hidden;text-overflow:ellipsis;">
            Signed in as <strong style="color:var(--ink);">${esc(user.email || 'Admin')}</strong>
          </div>
          <button class="btn btn-sm btn-danger btn-full" onclick="handleAdminSignOut()">
            ${ic('logout')} Sign Out
          </button>
        </div>
      </aside>

      <div class="admin-main">
        <header class="admin-topbar">
          <div class="topbar-left">
            <div class="auth-emblem" style="width:34px;height:34px;border-radius:10px;"><img src="../assets/app-icon.jpg" alt="Admin" /></div>
            <div class="topbar-titles">
              <div class="topbar-brand">AquaVault Admin</div>
              <div class="topbar-sub">Firebase Verified &middot; ${esc(user.email || 'Owner')}</div>
            </div>
          </div>
          <div class="topbar-actions">
            <span id="idleTimerBadge" class="badge badge-purple mono" style="font-size:10.5px;">Auto-Logout: ${getRemainingSessionMinutes()}m</span>
            <button class="pill-btn" onclick="toggleAdminTheme()">
              ${isDark ? ic('sun') : ic('moon')} ${isDark ? 'Day' : 'Night'}
            </button>
            <button class="btn btn-sm btn-danger" onclick="handleAdminSignOut()">
              ${ic('logout')} Sign Out
            </button>
          </div>
        </header>

        <main class="admin-content">
          <div class="mobile-pill-nav">
            ${ADMIN_TABS.map(t => `
              <button class="mobile-pill ${session.activeTab === t.id ? 'active' : ''}" onclick="setTab('${t.id}')">
                ${ic(t.icon)} ${t.label}
              </button>
            `).join('')}
          </div>
          ${contentHtml}
        </main>

        <nav class="mobile-dock">
          ${ADMIN_TABS.filter(t => t.dock).map(t => `
            <button class="dock-btn ${session.activeTab === t.id ? 'active' : ''}" onclick="setTab('${t.id}')">
              ${ic(t.icon)}
              <span>${t.label}</span>
            </button>
          `).join('')}
        </nav>
      </div>
    </div>
  `;
}

function render() {
  try {
    const root = document.getElementById('adminRoot');
    if (!root) return;
    root.innerHTML = session.authenticated ? renderAdminShell() : renderAuthViewport();
  } catch (err) {
    console.error('Admin render fallback triggered:', err);
  }
}

/* =========================================================================
   EXPOSE GLOBAL HANDLERS FOR INLINE TEMPLATE EVENTS & BOOTSTRAP
   ========================================================================= */
Object.assign(window, {
  toggleAdminTheme,
  refreshMathQuizUI,
  handleAdminLoginSubmit,
  openForgotPasswordView,
  backToLoginView,
  handleForgotPasswordSubmit,
  handleAdminSignOut,
  handleSendResetFromSecurityPanel,
  handleChangeFirebasePassword,
  handleManualCloudSync,
  setTab,
  toggleFeatureFlag,
  toggleMaintenanceMode,
  toggleAnnouncementActive,
  saveBroadcastAndBranding,
  extendUnitWarranty,
  deleteUnit,
  addHardwareUnit,
  setTicketFilter,
  updateTicketStatus,
  deleteTicket,
  saveInvoiceDefaults,
  updateSavedInvoiceStatus,
  exportMasterInvoicesCsv,
  addHubApp,
  toggleHubApp,
  deleteHubApp,
  saveCustomerControl,
  toggleCustomerPolicy
});

(function initAdminApp() {
  try {
    localStorage.removeItem('aquavault_admin_vault_v1');
    localStorage.removeItem('aquavault_admin_fb_meta_v1');
    localStorage.removeItem('aquavault_admin_audit_v1');
  } catch {}

  rollMathQuiz();
  startInactivityWatchdog();

  // Always render immediately so a blank screen can NEVER occur
  render();

  // Asynchronously initialize Firebase SDK inside try/catch if configured
  initFirebaseSafely();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
})();
