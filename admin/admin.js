/* =========================================================================
   AQUAVAULT ADMIN COMMAND CENTER — ANTI-HACKER 4-FACTOR VAULT & LIVE CONTROL
   - Zero hardcoded credentials (first-run PBKDF2-SHA256 salted vault claim)
   - 4-Factor Login: Username + Email + Master Password + Single-Digit Math Quiz
   - Step-2 Cryptographic 6-Digit Email OTP (3-min TTL, 3-attempt limit)
   - Hardened Password Reset Button & OTP Reset Flow
   - Brute-force 5-attempt lockout + In-memory session token (15-min idle lock)
   - Full Control over EVERY feature of the AquaVault Customer App
   ========================================================================= */

const VAULT_STORAGE_KEY = 'aquavault_admin_vault_v1';
const ADMIN_CONFIG_KEY = 'aquavault_admin_config_v1';
const CUSTOMER_STATE_KEY = 'aquavault_luxury_state_v2';
const ADMIN_THEME_KEY = 'aquavault_admin_theme_v1';
const ADMIN_AUDIT_KEY = 'aquavault_admin_audit_v1';
const FB_META_KEY = 'aquavault_admin_fb_meta_v1'; // Stores ONLY non-secret Firebase endpoint metadata entered by Admin at runtime; NEVER committed in source code

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
   IN-MEMORY SESSION & RUNTIME STATE (NEVER STORED IN LOCALSTORAGE)
   ========================================================================= */
const session = {
  authenticated: false,
  token: null,
  fbIdToken: null, // In-memory only Firebase Auth ID token (never stored in localStorage)
  fbUid: null,
  fbEmailVerified: false,
  lastActivity: Date.now(),
  activeTab: 'dashboard',
  authView: 'login', // 'setup' | 'login' | 'otp' | 'reset_req' | 'reset_otp'
  pendingOtp: null,  // { codeHash, salt, expiresAt, attemptsLeft, purpose: 'login'|'reset', previewCode, deliveryMode }
  mathQuiz: { a: 2, b: 3, op: '+', answer: 5 },
  ticketFilter: 'All',
  toastTimer: null
};

function esc(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
   CRYPTOGRAPHY HELPERS (Web Crypto PBKDF2-SHA256 + CSPRNG OTP)
   ========================================================================= */
function toHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex) {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return arr;
}

function randomHex(lenBytes = 16) {
  const b = new Uint8Array(lenBytes);
  crypto.getRandomValues(b);
  return toHex(b);
}

function generateSecureOtp() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(100000 + (arr[0] % 900000));
}

async function deriveHash(secret, saltHex, iterations = 120000) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(String(secret)),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: fromHex(saltHex), iterations, hash: 'SHA-256' },
    baseKey,
    256
  );
  return toHex(new Uint8Array(bits));
}

function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/* =========================================================================
   SINGLE-DIGIT ANTI-BOT MATH QUIZ GENERATOR (FRESH RANDOM ON EVERY REFRESH)
   ========================================================================= */
function rollMathQuiz() {
  let prevSig = '';
  try { prevSig = sessionStorage.getItem('aquavault_last_math_quiz') || ''; } catch {}
  const arr = new Uint8Array(3);
  let next = null;
  for (let attempt = 0; attempt < 12; attempt++) {
    crypto.getRandomValues(arr);
    const useSub = (arr[0] % 3) === 2;
    let a = 1 + (arr[1] % 9); // 1..9 single digit
    let b = 1 + (arr[2] % 9); // 1..9 single digit
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
  session.mathQuiz = next;
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
   VAULT, AUDIT LOG, ADMIN CONFIG & SHARED CUSTOMER DATA LOADERS
   ========================================================================= */
function loadVault() {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveVault(vault) {
  localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
}

function loadAuditLogs() {
  try {
    const raw = localStorage.getItem(ADMIN_AUDIT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function appendAudit(eventType, summary, severity = 'INFO') {
  const logs = loadAuditLogs();
  logs.unshift({
    id: 'AUD-' + Date.now().toString(36).toUpperCase(),
    eventType,
    summary,
    severity,
    time: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  });
  localStorage.setItem(ADMIN_AUDIT_KEY, JSON.stringify(logs.slice(0, 80)));
}

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
  localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(cfg));
  syncCloudIfConnected(cfg);
}

function shiftDaysIso(delta) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return new Date(d.getTime() + delta * 86400000).toISOString().slice(0, 10);
}

function loadCustomerState() {
  try {
    const raw = localStorage.getItem(CUSTOMER_STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
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
}

function saveCustomerState(cs) {
  localStorage.setItem(CUSTOMER_STATE_KEY, JSON.stringify(cs));
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
   THEME, TOAST & IDLE AUTO-LOCK
   ========================================================================= */
function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function toggleAdminTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(ADMIN_THEME_KEY, next);
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
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(session.toastTimer);
  session.toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

function touchActivity() {
  session.lastActivity = Date.now();
}

setInterval(() => {
  if (session.authenticated && Date.now() - session.lastActivity > 15 * 60 * 1000) {
    lockVault('Auto-locked after 15 minutes of inactivity');
  }
}, 20000);

['click', 'keydown', 'pointerdown'].forEach(ev => window.addEventListener(ev, touchActivity, { passive: true }));

function lockVault(reason = 'Admin Vault Locked') {
  session.authenticated = false;
  session.token = null;
  session.fbIdToken = null;
  session.fbUid = null;
  session.pendingOtp = null;
  session.authView = loadVault() ? 'login' : 'setup';
  rollMathQuiz();
  appendAudit('SECURITY_ALERT', reason, 'INFO');
  render();
  showToast(reason);
}

/* =========================================================================
   FIREBASE AUTH & FIRESTORE AUTO-SETUP (ZERO SECRETS HARDCODED IN SOURCE)
   ========================================================================= */
function loadFbMeta() {
  try {
    const raw = localStorage.getItem(FB_META_KEY);
    return raw ? JSON.parse(raw) : { apiKey: '', projectId: '', databaseId: '(default)', adminEmail: '' };
  } catch {
    return { apiKey: '', projectId: '', databaseId: '(default)', adminEmail: '' };
  }
}

function saveFbMeta(meta) {
  localStorage.setItem(FB_META_KEY, JSON.stringify({
    apiKey: String(meta.apiKey || '').trim(),
    projectId: String(meta.projectId || '').trim(),
    databaseId: String(meta.databaseId || '(default)').trim() || '(default)',
    adminEmail: String(meta.adminEmail || '').trim().toLowerCase()
  }));
}

function safePastServerTimestamp() {
  // 8s buffer avoids client-clock-ahead rejection against Firestore `ts <= request.time`
  return new Date(Date.now() - 8000).toISOString();
}

function toFsValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (v && v.__serverTimestamp) return { timestampValue: safePastServerTimestamp() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFsValue) } };
  if (typeof v === 'object') {
    const fields = {};
    Object.entries(v).forEach(([k, val]) => { fields[k] = toFsValue(val); });
    return { mapValue: { fields } };
  }
  return { stringValue: String(v) };
}

async function firestoreRestSet(meta, idToken, docPath, payload, immutableCreate = false) {
  const dbId = encodeURIComponent(meta.databaseId || '(default)');
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(meta.projectId)}/databases/${dbId}/documents/${docPath}`;

  let exists = false;
  if (!immutableCreate) {
    const checkRes = await fetch(baseUrl, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${idToken}` }
    });
    exists = checkRes.ok;
  }

  let writePayload = { ...payload };
  let url = baseUrl;
  if (exists) {
    // Preserve original createdAt on update to satisfy `incoming().createdAt == existing().createdAt`
    delete writePayload.createdAt;
    const maskParams = Object.keys(writePayload)
      .map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
      .join('&');
    if (maskParams) url += `?${maskParams}`;
  }

  const fields = {};
  Object.entries(writePayload).forEach(([k, val]) => { fields[k] = toFsValue(val); });
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({ fields })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Firestore error (${res.status})`);
  }
  return data;
}

async function fbAuthRequest(apiKey, endpoint, body) {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Firebase Auth failed (${res.status})`);
  }
  return data;
}

async function runFirebaseAutoSetup(apiKey, projectId, databaseId, email, fbPassword, username) {
  if (!apiKey || !projectId || !email || !fbPassword) {
    throw new Error('Enter Firebase Web API Key, Project ID, Admin Email & Firebase Password');
  }
  if (fbPassword.length < 8) {
    throw new Error('Firebase Admin Password must be at least 8 characters');
  }

  saveFbMeta({ apiKey, projectId, databaseId, adminEmail: email });

  let authRes;
  let createdNew = false;
  try {
    authRes = await fbAuthRequest(apiKey, 'accounts:signInWithPassword', {
      email,
      password: fbPassword,
      returnSecureToken: true
    });
  } catch (err) {
    const code = String(err.message || '');
    if (code.includes('EMAIL_NOT_FOUND') || code.includes('INVALID_LOGIN_CREDENTIALS')) {
      try {
        authRes = await fbAuthRequest(apiKey, 'accounts:signUp', {
          email,
          password: fbPassword,
          returnSecureToken: true
        });
        createdNew = true;
      } catch (signUpErr) {
        throw new Error(signUpErr.message === 'EMAIL_EXISTS' ? 'Wrong Firebase password for this email — use Reset Firebase Password below' : signUpErr.message);
      }
    } else {
      throw err;
    }
  }

  const idToken = authRes.idToken;
  const uid = authRes.localId;
  session.fbIdToken = idToken;
  session.fbUid = uid;

  // Check verification state & send email link automatically if unverified
  const lookup = await fbAuthRequest(apiKey, 'accounts:lookup', { idToken });
  const userInfo = lookup?.users?.[0] || {};
  session.fbEmailVerified = Boolean(userInfo.emailVerified);

  if (!session.fbEmailVerified) {
    await fbAuthRequest(apiKey, 'accounts:sendOobCode', { requestType: 'VERIFY_EMAIL', idToken });
    appendAudit('SECURITY_ALERT', `Firebase user ${createdNew ? 'created' : 'signed in'}; verification email sent to ${email}`, 'WARNING');
    return {
      status: 'verification_sent',
      uid,
      createdNew
    };
  }

  const meta = loadFbMeta();
  const cfg = loadAdminConfig();
  await syncCloudCollections(meta, idToken, uid, username || 'aquavault_admin', email, cfg);
  appendAudit('CONFIG_UPDATED', `Firebase Admin (${uid}) & Firestore Global Config auto-synced`, 'INFO');
  return { status: 'synced', uid, createdNew };
}

async function syncCloudCollections(meta, idToken, uid, username, email, cfg) {
  const nowTs = { __serverTimestamp: true };

  await firestoreRestSet(meta, idToken, `admins/${uid}`, {
    uid,
    email,
    username: username || 'aquavault_admin',
    role: 'SUPER_ADMIN',
    active: true,
    createdAt: nowTs,
    updatedAt: nowTs
  });

  await firestoreRestSet(meta, idToken, 'appConfig/global', {
    featureWarranty: Boolean(cfg.features.warranty),
    featureDevices: Boolean(cfg.features.devices),
    featureCalculator: Boolean(cfg.features.calculator),
    featureInvoice: Boolean(cfg.features.invoice),
    featureNotes: Boolean(cfg.features.notes),
    featureHub: Boolean(cfg.features.hub),
    featurePrivacy: Boolean(cfg.features.privacy),
    featurePwaPopup: Boolean(cfg.features.pwaPopup),
    maintenanceMode: Boolean(cfg.maintenanceMode),
    maintenanceMessage: String(cfg.maintenanceMessage || ''),
    announcementActive: Boolean(cfg.announcementActive),
    announcementText: String(cfg.announcementText || ''),
    defaultGstPercent: Number(cfg.invoiceDefaults.gstPercent || 18),
    defaultInvoicePalette: String(cfg.invoiceDefaults.palette || 'violet'),
    defaultTheme: String(cfg.defaultTheme || 'light'),
    updatedByUid: uid,
    createdAt: nowTs,
    updatedAt: nowTs
  });

  for (let i = 0; i < cfg.hubApps.length; i++) {
    const app = cfg.hubApps[i];
    if (!isValidHttpsUrl(app.url)) continue;
    await firestoreRestSet(meta, idToken, `hubApps/${app.id}`, {
      name: app.name,
      category: app.category,
      desc: app.desc,
      url: app.url,
      icon: app.icon || 'globe',
      enabled: app.enabled !== false,
      sortOrder: i,
      createdAt: nowTs,
      updatedAt: nowTs
    });
  }
}

async function syncCloudIfConnected(cfg) {
  if (!session.fbIdToken || !session.fbEmailVerified || !session.fbUid) return;
  const meta = loadFbMeta();
  if (!meta.projectId) return;
  const vault = loadVault();
  try {
    await syncCloudCollections(meta, session.fbIdToken, session.fbUid, vault?.username, meta.adminEmail || vault?.email || '', cfg);
  } catch {}
}

async function handleFirebaseAutoSetupSubmit(e) {
  e.preventDefault();
  const vault = loadVault();
  const apiKey = (document.getElementById('fbApiKey')?.value || '').trim();
  const projectId = (document.getElementById('fbProjectId')?.value || '').trim();
  const databaseId = (document.getElementById('fbDatabaseId')?.value || '(default)').trim();
  const email = (document.getElementById('fbAdminEmail')?.value || vault?.email || '').trim().toLowerCase();
  const fbPass = document.getElementById('fbPassword')?.value || '';

  try {
    showToast('Connecting to Firebase & syncing strict rules collections...');
    const res = await runFirebaseAutoSetup(apiKey, projectId, databaseId, email, fbPass, vault?.username);
    render();
    if (res.status === 'verification_sent') {
      showToast('Firebase account ready! Verification link sent to your email — click it, then tap Sync.');
    } else {
      showToast('Firebase Admin, App Config & Hub Apps automatically synced!');
    }
  } catch (err) {
    showToast(`Firebase Error: ${err.message}`);
  }
}

async function handleFirebasePasswordChange() {
  const meta = loadFbMeta();
  const newPass = document.getElementById('fbNewPassword')?.value || '';
  if (!session.fbIdToken) return showToast('Sign in to Firebase above first, then set new password');
  if (newPass.length < 8) return showToast('New Firebase Password must be at least 8 characters');
  try {
    const updated = await fbAuthRequest(meta.apiKey, 'accounts:update', {
      idToken: session.fbIdToken,
      password: newPass,
      returnSecureToken: true
    });
    session.fbIdToken = updated.idToken;
    appendAudit('PASSWORD_RESET', 'Firebase Admin password updated via Auth REST API', 'WARNING');
    showToast('Firebase Admin password changed successfully!');
  } catch (err) {
    showToast(`Firebase Password Update Failed: ${err.message}`);
  }
}

async function handleFirebaseResetEmail() {
  const apiKey = (document.getElementById('fbApiKey')?.value || loadFbMeta().apiKey || '').trim();
  const email = (document.getElementById('fbAdminEmail')?.value || loadFbMeta().adminEmail || loadVault()?.email || '').trim().toLowerCase();
  if (!apiKey || !email) return showToast('Enter Firebase Web API Key and Admin Email first');
  try {
    await fbAuthRequest(apiKey, 'accounts:sendOobCode', {
      requestType: 'PASSWORD_RESET',
      email
    });
    appendAudit('PASSWORD_RESET', `Official Firebase password reset email sent to ${email}`, 'INFO');
    showToast(`Official Firebase password reset link sent to ${email}`);
  } catch (err) {
    showToast(`Firebase Reset Error: ${err.message}`);
  }
}

/* =========================================================================
   EMAIL OTP DISPATCH (GOOGLE APPS SCRIPT GMAIL RELAY OR SETUP PREVIEW)
   ========================================================================= */
async function dispatchEmailOtp(email, username, purpose) {
  const vault = loadVault();
  const code = generateSecureOtp();
  const salt = randomHex(12);
  const codeHash = await deriveHash(code, salt, 60000);
  const expiresAt = Date.now() + 180 * 1000; // 3 minutes

  let deliveryMode = 'local_setup_preview';
  let previewCode = code;

  const relayUrl = vault && vault.otpRelayUrl ? vault.otpRelayUrl.trim() : '';
  if (relayUrl && isValidHttpsUrl(relayUrl)) {
    try {
      await fetch(relayUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          username,
          otp: code,
          purpose: purpose === 'reset' ? 'Admin Password Reset' : 'Admin Sign-In Verification',
          brand: 'AquaVault Admin Security Vault',
          expiresInMinutes: 3
        })
      });
      deliveryMode = 'gmail_relay_sent';
      previewCode = null; // Hide code on screen when real Gmail OTP relay is active!
    } catch {
      deliveryMode = 'relay_fallback_preview';
    }
  }

  session.pendingOtp = {
    codeHash,
    salt,
    expiresAt,
    attemptsLeft: 3,
    purpose,
    email,
    previewCode,
    deliveryMode
  };

  appendAudit(
    purpose === 'reset' ? 'PASSWORD_RESET' : 'SECURITY_ALERT',
    `6-digit ${purpose.toUpperCase()} OTP issued for ${email} (${deliveryMode})`,
    'INFO'
  );
  return session.pendingOtp;
}

/* =========================================================================
   AUTH FLOW HANDLERS (SETUP, 4-FACTOR LOGIN, EMAIL OTP, PASSWORD RESET)
   ========================================================================= */
function isLockedOut(vault) {
  if (!vault || !vault.lockoutUntil) return false;
  return Date.now() < vault.lockoutUntil;
}

function registerFailedAttempt(vault, reason) {
  if (!vault) return;
  vault.failedAttempts = (vault.failedAttempts || 0) + 1;
  if (vault.failedAttempts >= 5) {
    vault.lockoutUntil = Date.now() + 5 * 60 * 1000; // 5-minute anti-brute-force lockout
    vault.failedAttempts = 0;
    appendAudit('SECURITY_ALERT', `BRUTE-FORCE LOCKOUT (5m): ${reason}`, 'CRITICAL');
  } else {
    appendAudit('SECURITY_ALERT', `Failed auth (${vault.failedAttempts}/5): ${reason}`, 'WARNING');
  }
  saveVault(vault);
}

async function handleVaultSetupSubmit(e) {
  e.preventDefault();
  const email = (document.getElementById('setupEmail')?.value || '').trim().toLowerCase();
  const username = (document.getElementById('setupUsername')?.value || '').trim();
  const password = document.getElementById('setupPassword')?.value || '';
  const confirm = document.getElementById('setupConfirm')?.value || '';
  const relayUrl = (document.getElementById('setupRelayUrl')?.value || '').trim();
  const fbApiKey = (document.getElementById('setupFbApiKey')?.value || '').trim();
  const fbProjectId = (document.getElementById('setupFbProjectId')?.value || '').trim();
  const fbDatabaseId = (document.getElementById('setupFbDatabaseId')?.value || '(default)').trim();
  const fbPassword = document.getElementById('setupFbPassword')?.value || '';
  const mathAns = (document.getElementById('mathQuizAnswer')?.value || '').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showToast('Enter a valid Admin email address');
  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) return showToast('Username must be 3-32 letters, numbers, or _.-');
  if (password.length < 8) return showToast('Master Password must be at least 8 characters');
  if (password !== confirm) return showToast('Passwords do not match');
  if (relayUrl && !isValidHttpsUrl(relayUrl)) return showToast('Gmail OTP Relay URL must start with https://');
  if (Number(mathAns) !== session.mathQuiz.answer || mathAns === '') {
    rollMathQuiz();
    render();
    return showToast('Incorrect Math Quiz answer — new quiz generated');
  }

  const salt = randomHex(16);
  const passwordHash = await deriveHash(password, salt);
  const vault = {
    email,
    username,
    salt,
    passwordHash,
    otpRelayUrl: relayUrl,
    failedAttempts: 0,
    lockoutUntil: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  saveVault(vault);
  appendAudit('LOGIN_VERIFIED', `Admin Security Vault claimed by ${username}`, 'INFO');

  // Optional immediate Firebase Password & Cloud Auto-Setup during Vault Claim
  if (fbApiKey && fbProjectId && fbPassword) {
    try {
      await runFirebaseAutoSetup(fbApiKey, fbProjectId, fbDatabaseId, email, fbPassword, username);
    } catch (fbErr) {
      showToast(`Vault saved; Firebase note: ${fbErr.message}`);
    }
  } else if (fbApiKey || fbProjectId) {
    saveFbMeta({ apiKey: fbApiKey, projectId: fbProjectId, databaseId: fbDatabaseId, adminEmail: email });
  }

  await dispatchEmailOtp(email, username, 'login');
  session.authView = 'otp';
  render();
  showToast('Admin Vault initialized — verify 6-digit Email OTP to enter');
}

async function handleLoginStep1Submit(e) {
  e.preventDefault();
  const vault = loadVault();
  if (!vault) { session.authView = 'setup'; render(); return; }
  if (isLockedOut(vault)) { render(); return showToast('Vault temporarily locked after repeated failures'); }

  const username = (document.getElementById('loginUsername')?.value || '').trim();
  const email = (document.getElementById('loginEmail')?.value || '').trim().toLowerCase();
  const password = document.getElementById('loginPassword')?.value || '';
  const mathAns = (document.getElementById('mathQuizAnswer')?.value || '').trim();

  if (mathAns === '' || Number(mathAns) !== session.mathQuiz.answer) {
    registerFailedAttempt(vault, 'Wrong single-digit math quiz');
    rollMathQuiz();
    render();
    return showToast('Wrong Math Quiz answer! Hacker shield rotated quiz.');
  }

  const candidateHash = await deriveHash(password, vault.salt);
  const okUser = constantTimeEqual(username.toLowerCase(), vault.username.toLowerCase());
  const okEmail = constantTimeEqual(email, vault.email.toLowerCase());
  const okPass = constantTimeEqual(candidateHash, vault.passwordHash);

  if (!okUser || !okEmail || !okPass) {
    registerFailedAttempt(vault, `Invalid credentials attempt for "${username || 'blank'}"`);
    rollMathQuiz();
    render();
    return showToast('Invalid Username, Email, or Master Password');
  }

  vault.failedAttempts = 0;
  vault.lockoutUntil = 0;
  saveVault(vault);

  await dispatchEmailOtp(vault.email, vault.username, 'login');
  session.authView = 'otp';
  render();
  showToast('Credentials & Math Quiz verified — 6-digit Email OTP dispatched');
}

async function handleVerifyLoginOtp(e) {
  e.preventDefault();
  const vault = loadVault();
  const otp = session.pendingOtp;
  if (!vault || !otp) { session.authView = 'login'; render(); return; }

  if (Date.now() > otp.expiresAt) {
    session.pendingOtp = null;
    session.authView = 'login';
    rollMathQuiz();
    render();
    return showToast('Email OTP expired — please sign in again');
  }

  const entered = (document.getElementById('otpCodeInput')?.value || '').trim();
  if (!/^\d{6}$/.test(entered)) return showToast('Enter the 6-digit Email OTP');

  const enteredHash = await deriveHash(entered, otp.salt, 60000);
  if (!constantTimeEqual(enteredHash, otp.codeHash)) {
    otp.attemptsLeft -= 1;
    registerFailedAttempt(vault, 'Invalid 6-digit Email OTP');
    if (otp.attemptsLeft <= 0) {
      session.pendingOtp = null;
      session.authView = 'login';
      rollMathQuiz();
      render();
      return showToast('OTP invalidated after 3 wrong tries');
    }
    render();
    return showToast(`Wrong OTP — ${otp.attemptsLeft} attempt(s) left`);
  }

  // ALL 4 ANTI-HACKER LAYERS PASSED! Mint in-memory session token
  session.pendingOtp = null;
  session.authenticated = true;
  session.token = randomHex(24);
  session.lastActivity = Date.now();
  appendAudit('LOGIN_VERIFIED', `4-Factor Admin Login verified (${vault.username})`, 'INFO');
  render();
  showToast(`Welcome back, ${vault.username}`);
}

async function handleResendOtp() {
  const vault = loadVault();
  if (!vault || !session.pendingOtp) return;
  await dispatchEmailOtp(vault.email, vault.username, session.pendingOtp.purpose);
  render();
  showToast('Fresh 6-digit Email OTP sent');
}

function openPasswordResetFlow() {
  session.authView = 'reset_req';
  session.pendingOtp = null;
  rollMathQuiz();
  render();
}

function backToLoginView() {
  session.authView = loadVault() ? 'login' : 'setup';
  session.pendingOtp = null;
  rollMathQuiz();
  render();
}

async function handleResetRequestSubmit(e) {
  e.preventDefault();
  const vault = loadVault();
  if (!vault) { session.authView = 'setup'; render(); return; }
  if (isLockedOut(vault)) { render(); return showToast('Vault temporarily locked'); }

  const email = (document.getElementById('resetEmail')?.value || '').trim().toLowerCase();
  const username = (document.getElementById('resetUsername')?.value || '').trim();
  const mathAns = (document.getElementById('mathQuizAnswer')?.value || '').trim();

  if (mathAns === '' || Number(mathAns) !== session.mathQuiz.answer) {
    registerFailedAttempt(vault, 'Wrong math quiz during password reset');
    rollMathQuiz();
    render();
    return showToast('Wrong Math Quiz answer — new quiz generated');
  }

  if (!constantTimeEqual(email, vault.email.toLowerCase()) || !constantTimeEqual(username.toLowerCase(), vault.username.toLowerCase())) {
    registerFailedAttempt(vault, 'Mismatched email/username on password reset');
    rollMathQuiz();
    render();
    return showToast('Email or Username does not match registered Admin Vault');
  }

  await dispatchEmailOtp(vault.email, vault.username, 'reset');
  session.authView = 'reset_otp';
  render();
  showToast('6-digit Password Reset OTP dispatched to your Admin Email');
}

async function handleResetConfirmSubmit(e) {
  e.preventDefault();
  const vault = loadVault();
  const otp = session.pendingOtp;
  if (!vault || !otp || otp.purpose !== 'reset') { backToLoginView(); return; }

  if (Date.now() > otp.expiresAt) {
    session.pendingOtp = null;
    session.authView = 'reset_req';
    rollMathQuiz();
    render();
    return showToast('Reset OTP expired — request a new one');
  }

  const entered = (document.getElementById('resetOtpInput')?.value || '').trim();
  const newPass = document.getElementById('resetNewPass')?.value || '';
  const confirmPass = document.getElementById('resetConfirmPass')?.value || '';

  if (!/^\d{6}$/.test(entered)) return showToast('Enter the 6-digit Reset OTP');
  if (newPass.length < 8) return showToast('New password must be at least 8 characters');
  if (newPass !== confirmPass) return showToast('New passwords do not match');

  const enteredHash = await deriveHash(entered, otp.salt, 60000);
  if (!constantTimeEqual(enteredHash, otp.codeHash)) {
    otp.attemptsLeft -= 1;
    registerFailedAttempt(vault, 'Invalid Password Reset OTP');
    if (otp.attemptsLeft <= 0) { backToLoginView(); return showToast('Reset cancelled after 3 wrong OTPs'); }
    render();
    return showToast(`Wrong Reset OTP — ${otp.attemptsLeft} attempt(s) left`);
  }

  const newSalt = randomHex(16);
  vault.salt = newSalt;
  vault.passwordHash = await deriveHash(newPass, newSalt);
  vault.failedAttempts = 0;
  vault.lockoutUntil = 0;
  vault.updatedAt = new Date().toISOString();
  saveVault(vault);

  session.pendingOtp = null;
  session.authView = 'login';
  rollMathQuiz();
  appendAudit('PASSWORD_RESET', 'Master Password successfully reset via Email OTP', 'WARNING');
  render();
  showToast('Master Password updated! Sign in with your new password.');
}

/* =========================================================================
   ADMIN FEATURE CONTROL ACTIONS (LIVE SYNC TO CUSTOMER APP)
   ========================================================================= */
function setTab(tabId) {
  session.activeTab = tabId;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleFeatureFlag(key) {
  const cfg = loadAdminConfig();
  cfg.features[key] = !cfg.features[key];
  saveAdminConfig(cfg);
  appendAudit('CONFIG_UPDATED', `Feature "${key}" turned ${cfg.features[key] ? 'ON' : 'OFF'}`, 'INFO');
  render();
  showToast(`${key.toUpperCase()} is now ${cfg.features[key] ? 'ENABLED' : 'DISABLED'} in Customer App`);
}

function toggleMaintenanceMode() {
  const cfg = loadAdminConfig();
  cfg.maintenanceMode = !cfg.maintenanceMode;
  saveAdminConfig(cfg);
  appendAudit('CONFIG_UPDATED', `Maintenance Mode switched ${cfg.maintenanceMode ? 'ON' : 'OFF'}`, 'WARNING');
  render();
  showToast(cfg.maintenanceMode ? 'Maintenance Mode ACTIVE on Customer App' : 'Customer App is LIVE');
}

function toggleAnnouncementActive() {
  const cfg = loadAdminConfig();
  cfg.announcementActive = !cfg.announcementActive;
  saveAdminConfig(cfg);
  appendAudit('CONFIG_UPDATED', `Broadcast Banner ${cfg.announcementActive ? 'ENABLED' : 'HIDDEN'}`, 'INFO');
  render();
  showToast(cfg.announcementActive ? 'Broadcast Banner published to Customer App' : 'Broadcast Banner hidden');
}

function saveBroadcastAndBranding(e) {
  e.preventDefault();
  const cfg = loadAdminConfig();
  cfg.announcementText = (document.getElementById('cfgAnnouncementText')?.value || '').trim().slice(0, 300);
  cfg.maintenanceMessage = (document.getElementById('cfgMaintenanceMsg')?.value || '').trim().slice(0, 300);
  cfg.defaultTheme = document.getElementById('cfgDefaultTheme')?.value === 'dark' ? 'dark' : 'light';
  saveAdminConfig(cfg);
  appendAudit('CONFIG_UPDATED', 'Updated broadcast banner, maintenance message & default theme', 'INFO');
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
  appendAudit('WARRANTY_MODIFIED', `Extended warranty for ${unit.model} (${unit.serial}) by +${extraDays} days`, 'INFO');
  render();
  showToast(`Warranty extended +${extraDays} days (until ${unit.expiryDate})`);
}

function deleteUnit(unitId) {
  const cs = loadCustomerState();
  const found = cs.units.find(u => u.id === unitId);
  cs.units = cs.units.filter(u => u.id !== unitId);
  saveCustomerState(cs);
  appendAudit('WARRANTY_MODIFIED', `Removed hardware unit ${found ? found.serial : unitId}`, 'WARNING');
  render();
  showToast('Device removed from Customer Vault');
}

function addHardwareUnit(e) {
  e.preventDefault();
  const model = (document.getElementById('newUnitModel')?.value || '').trim();
  const type = document.getElementById('newUnitType')?.value === 'stopper' ? 'stopper' : 'controller';
  const serial = (document.getElementById('newUnitSerial')?.value || '').trim().toUpperCase();
  const location = (document.getElementById('newUnitLocation')?.value || '').trim();
  const days = Math.max(30, Math.min(3650, Number(document.getElementById('newUnitDays')?.value || 365)));
  const price = Math.max(0, Number(document.getElementById('newUnitPrice')?.value || 6500));
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
  appendAudit('WARRANTY_MODIFIED', `Added new ${type}: ${model} (${serial}) with ${days}d warranty`, 'INFO');
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
  appendAudit('TICKET_UPDATED', `Ticket ${ticketId} status changed to ${nextStatus}`, 'INFO');
  render();
  showToast(`Ticket ${ticketId} marked ${nextStatus}`);
}

function deleteTicket(ticketId) {
  const cs = loadCustomerState();
  cs.tickets = cs.tickets.filter(x => x.id !== ticketId);
  saveCustomerState(cs);
  appendAudit('TICKET_UPDATED', `Deleted service ticket ${ticketId}`, 'WARNING');
  render();
  showToast(`Ticket ${ticketId} deleted`);
}

/* Invoices & Billing Control */
function saveInvoiceDefaults(e) {
  e.preventDefault();
  const cfg = loadAdminConfig();
  cfg.invoiceDefaults = {
    businessName: (document.getElementById('invDefBizName')?.value || '').trim() || 'AquaVault Smart Systems Pvt. Ltd.',
    businessAddress: (document.getElementById('invDefBizAddr')?.value || '').trim(),
    businessPhone: (document.getElementById('invDefBizPhone')?.value || '').trim(),
    businessEmail: (document.getElementById('invDefBizEmail')?.value || '').trim(),
    paymentDetails: (document.getElementById('invDefPay')?.value || '').trim(),
    gstPercent: Math.max(0, Math.min(50, Number(document.getElementById('invDefGst')?.value || 18))),
    palette: document.getElementById('invDefPalette')?.value || 'violet',
    frameStyle: document.getElementById('invDefFrame')?.value === 'classic' ? 'classic' : 'colorful',
    googleSheetWebhook: (document.getElementById('invDefSheetUrl')?.value || '').trim()
  };
  if (cfg.invoiceDefaults.googleSheetWebhook && !isValidHttpsUrl(cfg.invoiceDefaults.googleSheetWebhook)) {
    return showToast('Google Sheet Webhook URL must start with https://');
  }
  saveAdminConfig(cfg);
  appendAudit('CONFIG_UPDATED', `Updated Invoice Studio defaults (GST ${cfg.invoiceDefaults.gstPercent}%, Theme ${cfg.invoiceDefaults.palette})`, 'INFO');
  render();
  showToast('Invoice Studio defaults synced to Customer App');
}

function updateSavedInvoiceStatus(invId, status) {
  const cs = loadCustomerState();
  const inv = (cs.invoices || []).find(x => x.id === invId);
  if (!inv) return;
  inv.status = status;
  saveCustomerState(cs);
  appendAudit('CONFIG_UPDATED', `Invoice ${inv.invoiceNo} marked ${status}`, 'INFO');
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
  const name = (document.getElementById('hubName')?.value || '').trim();
  const category = document.getElementById('hubCat')?.value || 'Website';
  const url = (document.getElementById('hubUrl')?.value || '').trim();
  const desc = (document.getElementById('hubDesc')?.value || '').trim();
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
  appendAudit('HUB_UPDATED', `Published Hub App "${name}" (${category})`, 'INFO');
  render();
  showToast(`Added "${name}" to Customer Apps Hub`);
}

function toggleHubApp(appId) {
  const cfg = loadAdminConfig();
  const item = cfg.hubApps.find(x => x.id === appId);
  if (!item) return;
  item.enabled = !item.enabled;
  saveAdminConfig(cfg);
  appendAudit('HUB_UPDATED', `Hub App "${item.name}" ${item.enabled ? 'shown' : 'hidden'}`, 'INFO');
  render();
  showToast(`${item.name} is now ${item.enabled ? 'visible' : 'hidden'}`);
}

function deleteHubApp(appId) {
  const cfg = loadAdminConfig();
  const found = cfg.hubApps.find(x => x.id === appId);
  cfg.hubApps = cfg.hubApps.filter(x => x.id !== appId);
  saveAdminConfig(cfg);
  appendAudit('HUB_UPDATED', `Deleted Hub App "${found ? found.name : appId}"`, 'WARNING');
  render();
  showToast('App removed from New Tab Hub');
}

/* Customer Profile, Sync & Notes Control */
function saveCustomerControl(e) {
  e.preventDefault();
  const cs = loadCustomerState();
  cs.customer = {
    name: (document.getElementById('custName')?.value || '').trim() || 'Customer',
    accountId: (document.getElementById('custCode')?.value || '').trim() || 'AQV-2026-8419',
    email: (document.getElementById('custEmail')?.value || '').trim(),
    city: (document.getElementById('custCity')?.value || '').trim()
  };
  saveCustomerState(cs);
  appendAudit('CONFIG_UPDATED', `Updated customer profile for ${cs.customer.name} (${cs.customer.accountId})`, 'INFO');
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
  appendAudit('CONFIG_UPDATED', `Toggled customer policy "${field}"`, 'INFO');
  render();
  showToast('Customer sync / privacy policy updated');
}

/* Security Settings & Gmail OTP Relay */
async function saveSecuritySettings(e) {
  e.preventDefault();
  const vault = loadVault();
  if (!vault) return;

  const newUsername = (document.getElementById('secUsername')?.value || '').trim();
  const newEmail = (document.getElementById('secEmail')?.value || '').trim().toLowerCase();
  const relayUrl = (document.getElementById('secRelayUrl')?.value || '').trim();
  const curPass = document.getElementById('secCurPass')?.value || '';
  const newPass = document.getElementById('secNewPass')?.value || '';

  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(newUsername)) return showToast('Username must be 3-32 valid characters');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return showToast('Enter a valid Admin email');
  if (relayUrl && !isValidHttpsUrl(relayUrl)) return showToast('Gmail OTP Relay URL must start with https://');

  if (newPass) {
    if (!curPass) return showToast('Enter your Current Master Password to change password');
    const curHash = await deriveHash(curPass, vault.salt);
    if (!constantTimeEqual(curHash, vault.passwordHash)) return showToast('Current Master Password is incorrect');
    if (newPass.length < 8) return showToast('New Master Password must be at least 8 characters');
    vault.salt = randomHex(16);
    vault.passwordHash = await deriveHash(newPass, vault.salt);
    appendAudit('PASSWORD_RESET', 'Master Password rotated inside Security Vault', 'WARNING');
  }

  vault.username = newUsername;
  vault.email = newEmail;
  vault.otpRelayUrl = relayUrl;
  vault.updatedAt = new Date().toISOString();
  saveVault(vault);
  appendAudit('CONFIG_UPDATED', `Updated Admin identity (${newUsername}) & Email OTP Relay`, 'INFO');
  render();
  showToast('Admin Security Settings saved');
}

function getGmailAppsScriptCode() {
  return `function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  // Uses the Gmail address of the account that deployed this script (zero email in public code)
  var ownerEmail = Session.getEffectiveUser().getEmail();
  if (!ownerEmail || String(data.to).toLowerCase() !== ownerEmail.toLowerCase()) {
    return ContentService.createTextOutput("FORBIDDEN");
  }
  MailApp.sendEmail({
    to: ownerEmail,
    subject: "[AquaVault Admin] Your 6-Digit OTP: " + data.otp,
    body: "AquaVault Zero-Trust Admin Verification\\n\\n"
      + "Purpose: " + data.purpose + "\\n"
      + "Username: " + data.username + "\\n"
      + "One-Time Password (OTP): " + data.otp + "\\n"
      + "Expires in: " + data.expiresInMinutes + " minutes\\n\\n"
      + "If you did not request this code, lock your vault immediately."
  });
  return ContentService.createTextOutput("OK");
}`;
}

function copyGmailOtpScript() {
  const snippet = getGmailAppsScriptCode();
  navigator.clipboard?.writeText(snippet).then(
    () => showToast('Google Apps Script copied! Paste at script.google.com, deploy as Web App, and paste URL.'),
    () => showToast('Copy blocked — select script box manually')
  );
}

/* =========================================================================
   AUTH SCREEN RENDERERS (SETUP / 4-FACTOR LOGIN / EMAIL OTP / RESET)
   ========================================================================= */
function renderMathQuizBlock() {
  const q = session.mathQuiz;
  return `
    <div class="math-quiz-box">
      <div class="math-quiz-head">
        <span class="badge badge-purple">${ic('shield')} Anti-Hacker Math Quiz (Single Digit)</span>
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
  const vault = loadVault();
  const isDark = getTheme() === 'dark';
  const locked = isLockedOut(vault);
  const lockMins = locked ? Math.ceil((vault.lockoutUntil - Date.now()) / 60000) : 0;

  let bodyHtml = '';

  if (session.authView === 'setup' || !vault) {
    const scriptCode = getGmailAppsScriptCode();
    bodyHtml = `
      <div class="security-shield-row">
        <span class="shield-chip">${ic('shield')} First-Run Vault Claim</span>
        <span class="shield-chip emerald">Zero Secrets in Source Code</span>
        <span class="shield-chip">Email OTP + Math Quiz</span>
      </div>
      <h1 class="auth-title serif">Claim Admin Vault</h1>
      <p class="auth-sub">Set your private Admin Username, Email &amp; Master Password. Nothing is stored in public code—credentials stay PBKDF2-SHA256 salted locally.</p>
      <form onsubmit="handleVaultSetupSubmit(event)">
        <div class="field">
          <label>Authorized Admin Email (Private — not saved in public code)</label>
          <input id="setupEmail" class="input" type="email" placeholder="admin@yourcompany.com" autocomplete="email" required />
        </div>
        <div class="field">
          <label>Admin Username</label>
          <input id="setupUsername" class="input" type="text" placeholder="e.g. aqua_owner" autocomplete="username" required />
        </div>
        <div class="grid-2">
          <div class="field">
            <label>Master Password (8+ chars)</label>
            <input id="setupPassword" class="input" type="password" placeholder="Strong password" autocomplete="new-password" required />
          </div>
          <div class="field">
            <label>Confirm Password</label>
            <input id="setupConfirm" class="input" type="password" placeholder="Re-enter password" autocomplete="new-password" required />
          </div>
        </div>

        <div class="field">
          <label>Gmail OTP Apps Script Web URL (Optional — paste after deploying script below)</label>
          <input id="setupRelayUrl" class="input mono" type="url" placeholder="https://script.google.com/macros/s/.../exec" />
        </div>

        <details class="setup-details" open>
          <summary>
            <span>${ic('mail')} Google Apps Script Code (Copy &amp; Deploy for Real Gmail OTP)</span>
            <span class="badge badge-purple">Step-by-Step</span>
          </summary>
          <ol style="margin:0 0 10px;padding-left:18px;font-size:12px;color:var(--ink-secondary);line-height:1.55;">
            <li>Open <strong>script.google.com</strong> &rarr; click <strong>New Project</strong>.</li>
            <li>Click <strong>Copy Script</strong> below and paste it into <code>Code.gs</code>.</li>
            <li>Click <strong>Deploy &rarr; New deployment &rarr; Web app</strong>, set <strong>Execute as: Me</strong>, <strong>Who has access: Anyone</strong>, authorize Gmail, and paste the <code>/exec</code> Web URL above.</li>
          </ol>
          <button type="button" class="btn btn-sm btn-soft btn-full" style="margin-bottom:8px;" onclick="copyGmailOtpScript()">
            ${ic('check')} 1-Click Copy Google Apps Script Code
          </button>
          <div class="code-block mono">${esc(scriptCode)}</div>
        </details>

        <details class="setup-details">
          <summary>
            <span>${ic('key')} Optional: Set Firebase Password &amp; Cloud Auto-Setup</span>
            <span class="badge badge-emerald">Strict Rules</span>
          </summary>
          <p style="margin:0 0 10px;font-size:11.5px;color:var(--ink-secondary);">
            Enter your Firebase Web API Key &amp; Password to automatically register Firebase Admin auth, verify email, and initialize strict Firestore collections. Zero keys live in public code.
          </p>
          <div class="field">
            <label>Firebase Web API Key</label>
            <input id="setupFbApiKey" class="input mono" type="password" placeholder="From Firebase Console -> Project Settings" autocomplete="off" />
          </div>
          <div class="grid-2">
            <div class="field">
              <label>Firebase Project ID</label>
              <input id="setupFbProjectId" class="input mono" placeholder="your-project-id" autocomplete="off" />
            </div>
            <div class="field">
              <label>Firestore Database ID</label>
              <input id="setupFbDatabaseId" class="input mono" value="(default)" autocomplete="off" />
            </div>
          </div>
          <div class="field" style="margin-bottom:0;">
            <label>Firebase Admin Password (8+ chars)</label>
            <input id="setupFbPassword" class="input" type="password" placeholder="Create or enter Firebase password" autocomplete="new-password" />
          </div>
        </details>

        ${renderMathQuizBlock()}
        <button type="submit" class="btn btn-primary btn-full">${ic('lock')} Create Secured Admin Vault</button>
      </form>
    `;
  } else if (session.authView === 'otp' && session.pendingOtp) {
    const otp = session.pendingOtp;
    const secs = Math.max(0, Math.round((otp.expiresAt - Date.now()) / 1000));
    bodyHtml = `
      <div class="security-shield-row">
        <span class="shield-chip emerald">${ic('check')} Step 1 Passed</span>
        <span class="shield-chip">${ic('mail')} Step 2: Email OTP</span>
        <span class="shield-chip amber">${otp.attemptsLeft} Tries Left</span>
      </div>
      <h1 class="auth-title serif">Email OTP Verification</h1>
      <p class="auth-sub">Enter the 6-digit one-time security code dispatched for <strong class="mono">${esc(otp.email)}</strong>. Valid for <strong class="mono">${secs}s</strong>.</p>
      ${otp.deliveryMode === 'gmail_relay_sent' ? `
        <div class="otp-banner">
          <strong style="color:var(--emerald);">OTP Sent to Gmail Inbox</strong><br/>
          Check <span class="mono">${esc(otp.email)}</span> for your 6-digit AquaVault Admin verification code.
        </div>
      ` : `
        <div class="otp-banner">
          <strong style="color:var(--amber);">Gmail OTP Relay Not Configured Yet</strong><br/>
          Use this one-time setup verification code now, then connect your free Gmail Apps Script Relay inside <strong>Security &amp; Firebase</strong>:<br/>
          <div class="mono" style="margin-top:8px;font-size:22px;font-weight:800;letter-spacing:0.24em;color:var(--primary);">${esc(otp.previewCode)}</div>
        </div>
      `}
      <form onsubmit="handleVerifyLoginOtp(event)">
        <div class="field">
          <label>6-Digit Email OTP Code</label>
          <input id="otpCodeInput" class="otp-code-input mono" type="text" inputmode="numeric" maxlength="6" placeholder="000000" autocomplete="one-time-code" required />
        </div>
        <button type="submit" class="btn btn-primary btn-full">${ic('shield')} Verify OTP &amp; Unlock Admin</button>
      </form>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button type="button" class="btn btn-outline btn-full" onclick="handleResendOtp()">${ic('refresh')} Resend OTP</button>
        <button type="button" class="btn btn-soft btn-full" onclick="backToLoginView()">Back</button>
      </div>
    `;
  } else if (session.authView === 'reset_req') {
    bodyHtml = `
      <div class="security-shield-row">
        <span class="shield-chip amber">${ic('key')} Password Recovery</span>
        <span class="shield-chip">Email OTP + Math Shield</span>
      </div>
      <h1 class="auth-title serif">Reset Master Password</h1>
      <p class="auth-sub">Verify your registered Admin Email, Username, and Single-Digit Math Quiz to receive a 6-digit Reset OTP.</p>
      ${locked ? `<div class="lockout-box">${ic('alert')} <span>Vault locked due to repeated failed attempts. Retry in ${lockMins} min.</span></div>` : ''}
      <form onsubmit="handleResetRequestSubmit(event)">
        <div class="field">
          <label>Registered Admin Email</label>
          <input id="resetEmail" class="input" type="email" placeholder="admin@yourcompany.com" required />
        </div>
        <div class="field">
          <label>Registered Admin Username</label>
          <input id="resetUsername" class="input" type="text" placeholder="Your admin username" required />
        </div>
        ${renderMathQuizBlock()}
        <button type="submit" class="btn btn-primary btn-full" ${locked ? 'disabled' : ''}>${ic('mail')} Send 6-Digit Reset OTP</button>
      </form>
      <button type="button" class="btn btn-outline btn-full" style="margin-top:10px;" onclick="backToLoginView()">Back to Admin Sign In</button>
    `;
  } else if (session.authView === 'reset_otp' && session.pendingOtp) {
    const otp = session.pendingOtp;
    bodyHtml = `
      <div class="security-shield-row">
        <span class="shield-chip amber">${ic('key')} Verify Reset OTP</span>
        <span class="shield-chip">${otp.attemptsLeft} Tries Left</span>
      </div>
      <h1 class="auth-title serif">Set New Password</h1>
      <p class="auth-sub">Enter the 6-digit Reset OTP for <strong class="mono">${esc(otp.email)}</strong> and choose a new Master Password.</p>
      ${otp.deliveryMode === 'gmail_relay_sent' ? `
        <div class="otp-banner"><strong style="color:var(--emerald);">Reset OTP Sent to Gmail</strong> — check ${esc(otp.email)}.</div>
      ` : `
        <div class="otp-banner">
          <strong style="color:var(--amber);">Setup Mode Reset OTP</strong><br/>
          <div class="mono" style="margin-top:6px;font-size:22px;font-weight:800;letter-spacing:0.24em;color:var(--primary);">${esc(otp.previewCode)}</div>
        </div>
      `}
      <form onsubmit="handleResetConfirmSubmit(event)">
        <div class="field">
          <label>6-Digit Reset OTP</label>
          <input id="resetOtpInput" class="otp-code-input mono" type="text" inputmode="numeric" maxlength="6" placeholder="000000" required />
        </div>
        <div class="field">
          <label>New Master Password (8+ chars)</label>
          <input id="resetNewPass" class="input" type="password" placeholder="Enter strong new password" autocomplete="new-password" required />
        </div>
        <div class="field">
          <label>Confirm New Password</label>
          <input id="resetConfirmPass" class="input" type="password" placeholder="Re-enter new password" autocomplete="new-password" required />
        </div>
        <button type="submit" class="btn btn-primary btn-full">${ic('check')} Verify OTP &amp; Reset Password</button>
      </form>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button type="button" class="btn btn-outline btn-full" onclick="handleResendOtp()">${ic('refresh')} Resend OTP</button>
        <button type="button" class="btn btn-soft btn-full" onclick="backToLoginView()">Cancel</button>
      </div>
    `;
  } else {
    bodyHtml = `
      <div class="security-shield-row">
        <span class="shield-chip">${ic('shield')} 4-Layer Anti-Hacker Gate</span>
        <span class="shield-chip emerald">Strict Firestore Rules</span>
      </div>
      <h1 class="auth-title serif">Admin Vault Sign In</h1>
      <p class="auth-sub">Enter Username, Authorized Email, Master Password, and solve the single-digit Math Quiz to trigger your 6-digit Email OTP.</p>
      ${locked ? `<div class="lockout-box">${ic('alert')} <span>Anti-Brute-Force Shield Active: Vault locked for ${lockMins} minute(s) after 5 failed attempts.</span></div>` : ''}
      <form onsubmit="handleLoginStep1Submit(event)">
        <div class="field">
          <label>Admin Username</label>
          <input id="loginUsername" class="input" type="text" placeholder="Enter your admin username" autocomplete="username" required />
        </div>
        <div class="field">
          <label>Authorized Admin Email</label>
          <input id="loginEmail" class="input" type="email" placeholder="admin@yourcompany.com" autocomplete="email" required />
        </div>
        <div class="field">
          <label>Master Password</label>
          <input id="loginPassword" class="input" type="password" placeholder="Enter master password" autocomplete="current-password" required />
        </div>
        ${renderMathQuizBlock()}
        <button type="submit" class="btn btn-primary btn-full" ${locked ? 'disabled' : ''}>${ic('mail')} Verify &amp; Send Email OTP</button>
      </form>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid var(--border);flex-wrap:wrap;">
        <span style="font-size:11.5px;color:var(--ink-tertiary);">Forgot credentials?</span>
        <button type="button" class="btn btn-sm btn-soft" onclick="openPasswordResetFlow()">
          ${ic('key')} Reset Password
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
            <div style="font-size:10.5px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--primary);">Zero-Trust Control Vault</div>
          </div>
        </div>
        <button type="button" class="pill-btn" onclick="toggleAdminTheme()">
          ${isDark ? ic('sun') : ic('moon')} ${isDark ? 'Day' : 'Night'}
        </button>
      </div>
      <div class="auth-card">${bodyHtml}</div>
      <div style="margin-top:14px;font-size:11px;color:var(--ink-tertiary);text-align:center;max-width:460px;">
        Protected by PBKDF2-SHA256, Single-Digit Math Quiz, 6-Digit Email OTP, 5-Fail Brute-Force Lockout &amp; Zero-Trust Firebase Rules.
      </div>
    </div>
  `;
}

/* =========================================================================
   AUTHENTICATED ADMIN COMMAND CENTER PANELS (ALL APP FEATURES CONTROLLED)
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
            <p class="card-sub">Takes effect immediately in the Customer App</p>
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
            <h2 class="card-title">Security &amp; Activity Audit Trail</h2>
            <p class="card-sub">Tamper-evident admin security events</p>
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
        `).join('') || '<div style="font-size:12.5px;color:var(--ink-tertiary);">No security events recorded yet.</div>'}
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
          <button type="submit" class="btn btn-primary btn-full">${ic('check')} Save &amp; Publish to Customer App</button>
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
            <input id="newUnitModel" class="input" placeholder="e.g. AquaVault Titan-X9 Controller" required />
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
            <input id="newUnitSerial" class="input mono" placeholder="AV-WLC-99201" required />
          </div>
          <div class="field">
            <label>Installation Location Tag</label>
            <input id="newUnitLocation" class="input" placeholder="e.g. Rooftop Overhead Tank" required />
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <label>Warranty Coverage (Days)</label>
            <input id="newUnitDays" class="input mono" type="number" value="365" min="30" max="3650" required />
          </div>
          <div class="field">
            <label>Base Price (INR)</label>
            <input id="newUnitPrice" class="input mono" type="number" value="7950" min="0" required />
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
              <button class="btn btn-sm btn-emerald" onclick="extendUnitWarranty('${esc(u.id)}', 90)">+90d Warranty</button>
              <button class="btn btn-sm btn-soft" onclick="extendUnitWarranty('${esc(u.id)}', 180)">+180d</button>
              <button class="btn btn-sm btn-soft" onclick="extendUnitWarranty('${esc(u.id)}', 365)">+1 Year</button>
              <button class="btn btn-sm btn-danger" onclick="deleteUnit('${esc(u.id)}')">${ic('trash')} Remove</button>
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
              <button class="btn btn-sm btn-outline" onclick="updateTicketStatus('${esc(t.id)}', 'Logged')">Mark Logged</button>
              <button class="btn btn-sm btn-soft" onclick="updateTicketStatus('${esc(t.id)}', 'Scheduled')">Schedule Visit</button>
              <button class="btn btn-sm btn-emerald" onclick="updateTicketStatus('${esc(t.id)}', 'Resolved')">${ic('check')} Resolve</button>
              <button class="btn btn-sm btn-danger" onclick="deleteTicket('${esc(t.id)}')">${ic('trash')}</button>
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
            <input id="invDefBizName" class="input" value="${esc(d.businessName)}" required />
          </div>
          <div class="field">
            <label>Default Billing Phone</label>
            <input id="invDefBizPhone" class="input" value="${esc(d.businessPhone)}" />
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <label>Default Billing Email</label>
            <input id="invDefBizEmail" class="input" value="${esc(d.businessEmail)}" />
          </div>
          <div class="field">
            <label>Default GST / Tax %</label>
            <input id="invDefGst" class="input mono" type="number" step="0.5" min="0" max="50" value="${esc(d.gstPercent)}" />
          </div>
        </div>
        <div class="field">
          <label>Default Business Address</label>
          <input id="invDefBizAddr" class="input" value="${esc(d.businessAddress)}" />
        </div>
        <div class="field">
          <label>Default Bank / UPI Payment Instructions</label>
          <input id="invDefPay" class="input" value="${esc(d.paymentDetails)}" />
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
          <input id="invDefSheetUrl" class="input mono" type="url" value="${esc(d.googleSheetWebhook || '')}" placeholder="https://script.google.com/macros/s/.../exec" />
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
      ${saved.map(inv => `
        <div class="item-row">
          <div class="item-top">
            <div>
              <div class="mono" style="font-size:13.5px;font-weight:800;color:var(--primary);">${esc(inv.invoiceNo)}</div>
              <div style="font-size:12.5px;font-weight:700;margin-top:2px;">${esc(inv.clientName)} &middot; <span class="mono">${esc(inv.invoiceDate)}</span></div>
            </div>
            <span class="badge ${inv.status === 'PAID' ? 'badge-emerald' : inv.status === 'OVERDUE' ? 'badge-rose' : 'badge-amber'}">${esc(inv.status)}</span>
          </div>
          <div class="item-actions">
            <button class="btn btn-sm btn-emerald" onclick="updateSavedInvoiceStatus('${esc(inv.id)}', 'PAID')">Mark PAID</button>
            <button class="btn btn-sm btn-outline" onclick="updateSavedInvoiceStatus('${esc(inv.id)}', 'PENDING')">Pending</button>
            <button class="btn btn-sm btn-danger" onclick="updateSavedInvoiceStatus('${esc(inv.id)}', 'OVERDUE')">Overdue</button>
          </div>
        </div>
      `).join('') || '<div style="font-size:13px;color:var(--ink-tertiary);">No invoices saved in Customer Invoice Vault yet.</div>'}
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
            <input id="hubName" class="input" placeholder="e.g. AquaVault Dealer Locator" required />
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
          <input id="hubUrl" class="input mono" type="url" placeholder="https://example.com" required />
        </div>
        <div class="field">
          <label>Short Description</label>
          <input id="hubDesc" class="input" placeholder="One-line value summary for customers" required />
        </div>
        <button type="submit" class="btn btn-primary">${ic('plus')} Publish to Customer Hub</button>
      </form>
    </div>

    <div class="card">
      <div class="card-head"><h2 class="card-title">Live Hub Directory (${cfg.hubApps.length})</h2></div>
      ${cfg.hubApps.map(app => `
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
            <button class="btn btn-sm btn-soft" onclick="toggleHubApp('${esc(app.id)}')">${app.enabled ? 'Hide Card' : 'Show Card'}</button>
            <button class="btn btn-sm btn-danger" onclick="deleteHubApp('${esc(app.id)}')">${ic('trash')} Delete</button>
          </div>
        </div>
      `).join('')}
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
            <input id="custName" class="input" value="${esc(c.name)}" required />
          </div>
          <div class="field">
            <label>AquaVault Customer ID</label>
            <input id="custCode" class="input mono" value="${esc(c.accountId)}" required />
          </div>
          <div class="field">
            <label>Customer Email</label>
            <input id="custEmail" class="input" type="email" value="${esc(c.email)}" />
          </div>
          <div class="field">
            <label>City / Region</label>
            <input id="custCity" class="input" value="${esc(c.city)}" />
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
  const vault = loadVault() || {};
  const fbMeta = loadFbMeta();
  const scriptCode = getGmailAppsScriptCode();
  return `
    <div class="page-head">
      <div class="eyebrow">Zero-Trust Defense &amp; Firebase Auto-Setup</div>
      <h1 class="page-title serif">Anti-Hacker Security &amp; Firebase</h1>
      <p class="page-desc">Configure real Gmail OTP delivery, set your Firebase Admin Password to auto-initialize Firestore collections, and inspect security logs. Zero secrets are stored in public source code.</p>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head">
          <div>
            <h2 class="card-title">Admin Vault &amp; Gmail OTP Relay</h2>
            <p class="card-sub">PBKDF2-SHA256 salted hashing (120,000 iterations)</p>
          </div>
          <span class="badge ${vault.otpRelayUrl ? 'badge-emerald' : 'badge-amber'}">${vault.otpRelayUrl ? 'Gmail OTP Live' : 'Setup Mode OTP'}</span>
        </div>
        <form onsubmit="saveSecuritySettings(event)">
          <div class="field">
            <label>Admin Username</label>
            <input id="secUsername" class="input" value="${esc(vault.username || '')}" required />
          </div>
          <div class="field">
            <label>Authorized Admin Email</label>
            <input id="secEmail" class="input" type="email" value="${esc(vault.email || '')}" required />
          </div>
          <div class="field">
            <label>Gmail Apps Script OTP Relay Web App URL (HTTPS)</label>
            <input id="secRelayUrl" class="input mono" type="url" value="${esc(vault.otpRelayUrl || '')}" placeholder="https://script.google.com/macros/s/.../exec" />
          </div>
          <div class="grid-2">
            <div class="field">
              <label>Current Password (only to change)</label>
              <input id="secCurPass" class="input" type="password" autocomplete="current-password" placeholder="Leave blank to keep" />
            </div>
            <div class="field">
              <label>New Master Password</label>
              <input id="secNewPass" class="input" type="password" autocomplete="new-password" placeholder="Min 8 chars" />
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-full">${ic('shield')} Save Security Configuration</button>
        </form>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <h2 class="card-title">1-Click Free Gmail OTP Script</h2>
            <p class="card-sub">Automatically sends OTP to the deployer's Gmail (zero email in code)</p>
          </div>
          <button class="btn btn-sm btn-soft" onclick="copyGmailOtpScript()">Copy Script</button>
        </div>
        <p style="font-size:12px;color:var(--ink-secondary);margin:0 0 10px;">
          Open <strong>script.google.com</strong> &rarr; New Project &rarr; Paste script &rarr; Deploy as <strong>Web App (Execute as: Me, Access: Anyone)</strong> &rarr; Paste the <code>/exec</code> URL on the left.
        </p>
        <div class="code-block mono">${esc(scriptCode)}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <h2 class="card-title">Firebase Password Setup &amp; Cloud Auto-Sync</h2>
          <p class="card-sub">Create/sign-in Firebase Admin Email+Password, verify email, and auto-create <code>/admins</code>, <code>/appConfig/global</code> &amp; <code>/hubApps</code> under Strict Rules</p>
        </div>
        <span class="badge ${session.fbIdToken ? (session.fbEmailVerified ? 'badge-emerald' : 'badge-amber') : 'badge-purple'}">
          ${session.fbIdToken ? (session.fbEmailVerified ? 'Firebase Synced' : 'Verify Email Inbox') : 'Zero-Secret Runtime'}
        </span>
      </div>
      <form onsubmit="handleFirebaseAutoSetupSubmit(event)">
        <div class="grid-2">
          <div class="field">
            <label>Firebase Web API Key (stored only in your browser)</label>
            <input id="fbApiKey" class="input mono" type="password" value="${esc(fbMeta.apiKey || '')}" placeholder="Paste Web API Key from Firebase Console" required />
          </div>
          <div class="field">
            <label>Firebase Project ID</label>
            <input id="fbProjectId" class="input mono" value="${esc(fbMeta.projectId || '')}" placeholder="your-firebase-project-id" required />
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <label>Firestore Database ID</label>
            <input id="fbDatabaseId" class="input mono" value="${esc(fbMeta.databaseId || '(default)')}" placeholder="(default) or named DB id" required />
          </div>
          <div class="field">
            <label>Firebase Admin Email</label>
            <input id="fbAdminEmail" class="input" type="email" value="${esc(fbMeta.adminEmail || vault.email || '')}" required />
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <label>Set / Enter Firebase Password (8+ chars)</label>
            <input id="fbPassword" class="input" type="password" placeholder="Creates account if new, or signs in & syncs all" autocomplete="new-password" required />
          </div>
          <div class="field">
            <label>Change Firebase Password (once connected)</label>
            <input id="fbNewPassword" class="input" type="password" placeholder="Optional new Firebase password" autocomplete="new-password" />
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          <button type="submit" class="btn btn-primary">${ic('check')} Auto-Setup Firebase &amp; Sync Everything</button>
          <button type="button" class="btn btn-soft" onclick="handleFirebasePasswordChange()">${ic('key')} Change Firebase Password</button>
          <button type="button" class="btn btn-outline" onclick="handleFirebaseResetEmail()">${ic('mail')} Reset Firebase Password via Email</button>
        </div>
      </form>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <h2 class="card-title">Deployed Strict Firebase Firestore Security Rules</h2>
          <p class="card-sub">Zero-trust rules enforced server-side on Firebase — safe even if public client code is inspected</p>
        </div>
        <span class="badge badge-emerald">${ic('check')} Zero-Trust Rules Active</span>
      </div>
      <div class="security-shield-row" style="margin-bottom:0;">
        <span class="shield-chip emerald">Zero Secrets in Public Source</span>
        <span class="shield-chip emerald">Default Deny Catch-All</span>
        <span class="shield-chip emerald">email_verified == true Anti-Spoof</span>
        <span class="shield-chip emerald">No Self-Admin Promotion</span>
        <span class="shield-chip emerald">HTTPS-Only Hub URLs</span>
        <span class="shield-chip emerald">Immutable Audit Logs</span>
        <span class="shield-chip emerald">Per-User UID Isolation</span>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <h2 class="card-title">Full Security Audit Log (${logs.length})</h2>
      </div>
      ${logs.slice(0, 20).map(l => `
        <div class="item-row" style="padding:10px 12px;">
          <div class="item-top">
            <span class="badge ${l.severity === 'CRITICAL' ? 'badge-rose' : l.severity === 'WARNING' ? 'badge-amber' : 'badge-purple'}">${esc(l.eventType)}</span>
            <span class="mono" style="font-size:11px;color:var(--ink-tertiary);">${esc(l.time)}</span>
          </div>
          <div style="font-size:12.5px;margin-top:4px;">${esc(l.summary)}</div>
        </div>
      `).join('') || '<div style="font-size:12.5px;color:var(--ink-tertiary);">No logs recorded.</div>'}
    </div>
  `;
}

/* =========================================================================
   MAIN SHELL & RENDER LOOP
   ========================================================================= */
function renderAdminShell() {
  const cfg = loadAdminConfig();
  const cs = loadCustomerState();
  const logs = loadAuditLogs();
  const vault = loadVault() || {};
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
          <div style="font-size:11.5px;color:var(--ink-secondary);padding:0 6px;">
            Signed in as <strong style="color:var(--ink);">${esc(vault.username || 'Admin')}</strong>
          </div>
          <button class="btn btn-sm btn-danger btn-full" onclick="lockVault('Admin locked vault manually')">
            ${ic('logout')} Lock Admin Vault
          </button>
        </div>
      </aside>

      <div class="admin-main">
        <header class="admin-topbar">
          <div class="topbar-left">
            <div class="auth-emblem" style="width:34px;height:34px;border-radius:10px;"><img src="../assets/app-icon.jpg" alt="Admin" /></div>
            <div class="topbar-titles">
              <div class="topbar-brand">AquaVault Admin</div>
              <div class="topbar-sub">4-Factor Verified &middot; ${esc(vault.username || 'Owner')}</div>
            </div>
          </div>
          <div class="topbar-actions">
            <button class="pill-btn" onclick="toggleAdminTheme()">
              ${isDark ? ic('sun') : ic('moon')} ${isDark ? 'Day' : 'Night'}
            </button>
            <button class="btn btn-sm btn-danger" onclick="lockVault('Admin locked vault')">
              ${ic('lock')} Lock
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
  const root = document.getElementById('adminRoot');
  if (!root) return;
  root.innerHTML = session.authenticated ? renderAdminShell() : renderAuthViewport();
}

/* =========================================================================
   BOOTSTRAP
   ========================================================================= */
(function initAdminApp() {
  const vault = loadVault();
  session.authView = vault ? 'login' : 'setup';
  rollMathQuiz(); // Generates a fresh random single-digit math quiz on EVERY page load / refresh
  render();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
})();
