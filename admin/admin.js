/* =========================================================================
   AQUAVAULT ADMIN COMMAND CENTER — CRASH-PROOF & SERVER-SIDE FIREBASE AUTH
   - Zero blank screens: Renders UI synchronously before any network/SDK call
   - Strict Admin UID Lock: Exclusively authorized for UID Y8zmDKBgubWIVvhufftRPPjG7HC3
   - Dual-Vault Customer & Warranty Sync:
     * Writes ONLY non-sensitive fields (customerName, modelName, hardwareType,
       quantity, installDate, expiryDate, status, updatedAt) to `public_units`
     * Writes sensitive fields (mobileNumber, address, serialNumber, warrantyDays,
       basePrice, gstRate, invoiceNo) strictly to `private_customers`
   - Removed toggle switches for deleted pages (Calculator, Notepad, separate Warranty page)
   - Automatic 30-Minute Inactivity Session Logout (1,800,000 ms watchdog)
   ========================================================================= */

const ADMIN_CONFIG_KEY = 'aquavault_admin_config_v1';
const CUSTOMER_STATE_KEY = 'aquavault_luxury_state_v2';
const PUBLIC_UNITS_CACHE_KEY = 'aquavault_public_units_cache_v9';
const PRIVATE_CUSTOMERS_CACHE_KEY = 'aquavault_private_customers_v9';
const PRIVATE_INVOICES_CACHE_KEY = 'aquavault_private_invoices_v9';
const ADMIN_THEME_KEY = 'aquavault_admin_theme_v1';
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes automatic logout
const AUTHORIZED_ADMIN_UID = 'Y8zmDKBgubWIVvhufftRPPjG7HC3';

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyC-yKE9dRoZBu5yROBD2afoB0vQjoG_1Gs",
  authDomain: "aqua-vault.firebaseapp.com",
  projectId: "aqua-vault",
  storageBucket: "aqua-vault.firebasestorage.app",
  messagingSenderId: "35562578382",
  appId: "1:35562578382:web:766ed7d52adea3293b8b9f"
};

let runtimeFirebaseConfig = { ...DEFAULT_FIREBASE_CONFIG };
let runtimeFirestoreDbId = '(default)';

const ICONS = {
  shield: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 3l7.5 3v5.5c0 4.8-3.2 8.9-7.5 10.5-4.3-1.6-7.5-5.7-7.5-10.5V6L12 3z"/><path d="M9 12l2 2 4-4"/></svg>`,
  lock: `<svg class="icon" viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/><circle cx="12" cy="16" r="1"/></svg>`,
  dashboard: `<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7.5" height="9" rx="2"/><rect x="13.5" y="3" width="7.5" height="5.5" rx="2"/><rect x="13.5" y="11.5" width="7.5" height="9.5" rx="2"/><rect x="3" y="15" width="7.5" height="6" rx="2"/></svg>`,
  sliders: `<svg class="icon" viewBox="0 0 24 24"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.5"/><circle cx="15" cy="17" r="2.5"/></svg>`,
  devices: `<svg class="icon" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h6v6H9z"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/></svg>`,
  wrench: `<svg class="icon" viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.3-2.3 1.6-3z"/></svg>`,
  receipt: `<svg class="icon" viewBox="0 0 24 24"><path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>`,
  hub: `<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>`,
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
  { id: 'devices', label: 'Units & Customers', icon: 'devices', dock: true },
  { id: 'invoices', label: 'Invoices & Drive', icon: 'receipt', dock: true },
  { id: 'hub', label: 'Apps Hub', icon: 'hub', dock: true },
  { id: 'features', label: 'Features', icon: 'sliders', dock: false },
  { id: 'tickets', label: 'Tickets', icon: 'wrench', dock: false },
  { id: 'security', label: 'Security', icon: 'shield', dock: true }
];

const session = {
  authenticated: false,
  checkingAuth: false,
  firebaseReady: false,
  firebaseConfigLoaded: true,
  firebaseInitError: '',
  user: null,
  authView: 'login',
  authBusy: false,
  authError: '',
  authNotice: '',
  activeTab: 'dashboard',
  editingCustomerId: '',
  mathQuiz: { a: 3, b: 4, op: '+', answer: 7 },
  ticketFilter: 'All',
  auditLogs: [],
  privateCustomers: [],
  privateInvoices: [],
  cloudSyncedAt: null,
  lastActivityAt: Date.now(),
  inactivityInterval: null,
  toastTimer: null
};

let fbApp = null;
let auth = null;
let db = null;
let fbSdk = null;

function isConfigObjectValid(cfg) {
  try {
    return Boolean(
      cfg &&
      typeof cfg === 'object' &&
      cfg.apiKey &&
      cfg.projectId &&
      !String(cfg.apiKey).startsWith('YOUR_') &&
      !String(cfg.projectId).startsWith('YOUR_')
    );
  } catch {
    return false;
  }
}

function isFirebaseConfigured() {
  return isConfigObjectValid(runtimeFirebaseConfig);
}

function parseFirebaseConfigFromRawText(rawText) {
  try {
    const src = String(rawText || '');
    const pick = (key) => {
      const m = src.match(new RegExp(key + '\\s*:\\s*["\']([^"\']+)["\']'));
      return m ? m[1].trim() : '';
    };
    const extracted = {
      apiKey: pick('apiKey'),
      authDomain: pick('authDomain'),
      projectId: pick('projectId'),
      storageBucket: pick('storageBucket'),
      messagingSenderId: pick('messagingSenderId'),
      appId: pick('appId')
    };
    return isConfigObjectValid(extracted) ? extracted : null;
  } catch {
    return null;
  }
}

async function resolveFirebaseConfigSafely() {
  if (isConfigObjectValid(runtimeFirebaseConfig)) return runtimeFirebaseConfig;

  try {
    const mod = await import('../firebase-config.js?v=10');
    const candidate = mod?.firebaseConfig || mod?.default || globalThis.__AQUAVAULT_FIREBASE_CONFIG__;
    if (mod?.firestoreDatabaseId) {
      runtimeFirestoreDbId = mod.firestoreDatabaseId;
    }
    if (isConfigObjectValid(candidate)) {
      runtimeFirebaseConfig = candidate;
      return runtimeFirebaseConfig;
    }
  } catch {}

  try {
    const res = await fetch('../firebase-config.js?v=' + Date.now(), { cache: 'no-store' });
    if (res.ok) {
      const txt = await res.text();
      const parsed = parseFirebaseConfigFromRawText(txt);
      if (parsed) {
        runtimeFirebaseConfig = parsed;
        return runtimeFirebaseConfig;
      }
    }
  } catch {}

  if (isConfigObjectValid(DEFAULT_FIREBASE_CONFIG)) {
    runtimeFirebaseConfig = { ...DEFAULT_FIREBASE_CONFIG };
    return runtimeFirebaseConfig;
  }
  return null;
}

async function initFirebaseSafely() {
  const cfg = await resolveFirebaseConfigSafely();
  if (!isConfigObjectValid(cfg)) {
    session.firebaseReady = false;
    session.firebaseConfigLoaded = false;
    session.checkingAuth = false;
    render();
    return false;
  }
  session.firebaseConfigLoaded = true;
  if (fbSdk && auth && db) return true;

  try {
    const [appMod, authMod, fsMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js')
    ]);
    fbSdk = { ...appMod, ...authMod, ...fsMod };
    fbApp = appMod.getApps().length ? appMod.getApp() : fbSdk.initializeApp(cfg);
    auth = fbSdk.getAuth(fbApp);
    try {
      db = runtimeFirestoreDbId && runtimeFirestoreDbId !== '(default)'
        ? fbSdk.getFirestore(fbApp, runtimeFirestoreDbId)
        : fbSdk.getFirestore(fbApp);
    } catch {
      db = fbSdk.getFirestore(fbApp);
    }
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
      const verifyResult = await verifyAndLoadAdminSession(user);
      if (!verifyResult.allowed) {
        try { await fbSdk.signOut(auth); } catch {}
        session.authenticated = false;
        session.user = null;
        session.authError = verifyResult.reason || `Access Denied: Account "${sanitizeText(user.email || 'unknown', 120)}" is not authorized as AquaVault Admin.`;
      } else {
        session.authenticated = true;
        session.user = user;
        session.lastActivityAt = Date.now();
        session.authError = '';
      }
      session.checkingAuth = false;
      render();
    });
    render();
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
   SINGLE-DIGIT MATH QUIZ GENERATOR
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
   ADMIN CONFIG, PRIVATE CUSTOMERS & PUBLIC UNITS STATE HELPERS
   ========================================================================= */
function shiftDaysIso(delta, fromIso = null) {
  let d = new Date();
  if (fromIso) {
    const [y, m, day] = String(fromIso).split('-').map(Number);
    if (y && m && day) d = new Date(y, m - 1, day);
  }
  d.setHours(0, 0, 0, 0);
  return new Date(d.getTime() + delta * 86400000).toISOString().slice(0, 10);
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

function getDefaultAdminConfig() {
  return {
    features: {
      warranty: true,
      devices: true,
      invoice: true,
      hub: true,
      privacy: true,
      pwaPopup: true
    },
    maintenanceMode: false,
    maintenanceMessage: 'AquaVault is undergoing a scheduled calibration upgrade. Your warranty data is completely safe and will be back shortly.',
    announcementActive: false,
    announcementText: 'Monsoon Tank Sensor Checkup Active — Book your complimentary inspection inside Models & Service.',
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
      { id: 'sellgst_pro', name: 'SellGst-Pro Billing & GST Suite', category: 'New App', desc: 'Instant GST invoice maker, smart inventory ledger, and business billing companion.', url: 'https://ritikraj3405328-web.github.io/SellGst-Pro/', icon: 'bolt', enabled: true },
      { id: 'aquavault_portal', name: 'AquaVault Smart Trust Portal', category: 'Website', desc: 'Live public customer warranty tracker for Smart Water Level Controllers & Water Stoppers.', url: 'https://ritikraj3405328-web.github.io/Aqua-Volt/', icon: 'globe', enabled: true },
      { id: 'h1', name: 'AquaVault Hardware Catalog', category: 'Website', desc: 'Explore flagship dual-tank controllers, brass motorized stoppers, and genuine spare sensors.', url: 'https://www.google.com/search?q=smart+water+level+controller', icon: 'globe', enabled: true },
      { id: 'h2', name: 'Tank Volume & Flow Estimator', category: 'Tool', desc: 'Calculate cylindrical & rectangular overhead tank capacity in liters and refill time.', url: 'https://www.google.com/search?q=water+tank+volume+calculator+liters', icon: 'gauge', enabled: true },
      { id: 'h3', name: 'Solar Pump Auto-Sync', category: 'New App', desc: 'Smart daylight pump scheduling for rooftop solar and borewell setups.', url: 'https://www.google.com/search?q=solar+water+pump+controller', icon: 'bolt', enabled: true },
      { id: 'h4', name: 'Rainwater Harvest Planner', category: 'Tool', desc: 'Estimate rooftop monsoon water capture and sump storage sizing.', url: 'https://www.google.com/search?q=rainwater+harvesting+calculator', icon: 'droplet', enabled: true }
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
    const hubApps = Array.isArray(parsed.hubApps) && parsed.hubApps.length ? parsed.hubApps : def.hubApps;
    if (!hubApps.some(a => String(a.name || '').toLowerCase().includes('sellgst'))) {
      hubApps.unshift(def.hubApps[0]);
    }
    return {
      ...def,
      ...parsed,
      features: { ...def.features, ...(parsed.features || {}) },
      invoiceDefaults: { ...def.invoiceDefaults, ...(parsed.invoiceDefaults || {}) },
      hubApps
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

function getDefaultPrivateCustomers() {
  return [
    {
      id: 'pub_u1',
      customerName: 'Rajesh Verma',
      mobileNumber: '+91 98450 11223',
      address: '42 Park View Residency, Indiranagar, Bengaluru 560038',
      modelName: 'AquaVault Pro-X7 Dual Tank Controller',
      hardwareType: 'Water Level Controller',
      quantity: 1,
      serialNumber: 'AV-WLC-88412',
      installDate: shiftDaysIso(-125),
      expiryDate: shiftDaysIso(240),
      warrantyDays: 365,
      basePrice: 8450,
      gstRate: 18,
      invoiceNo: 'INV-AQV-2026-1104'
    },
    {
      id: 'pub_u2',
      customerName: 'Sandeep Kulkarni',
      mobileNumber: '+91 98801 44556',
      address: '18 Palm Grove Villa, Whitefield, Bengaluru 560066',
      modelName: 'AquaVault HydroSeal Brass Stopper + Pro-X7',
      hardwareType: 'Water Stopper',
      quantity: 2,
      serialNumber: 'AV-WST-55210',
      installDate: shiftDaysIso(-180),
      expiryDate: shiftDaysIso(185),
      warrantyDays: 365,
      basePrice: 6800,
      gstRate: 18,
      invoiceNo: 'INV-AQV-2026-1189'
    },
    {
      id: 'pub_u3',
      customerName: 'Meera Nair',
      mobileNumber: '+91 97412 33890',
      address: '9A Skyline Apartments, Koramangala, Bengaluru 560034',
      modelName: 'AquaVault SumpGuard S4 Controller',
      hardwareType: 'Water Level Controller',
      quantity: 1,
      serialNumber: 'AV-WLC-88905',
      installDate: shiftDaysIso(-320),
      expiryDate: shiftDaysIso(45),
      warrantyDays: 365,
      basePrice: 6800,
      gstRate: 18,
      invoiceNo: 'INV-AQV-2026-1240'
    },
    {
      id: 'pub_u4',
      customerName: 'Vikramaditya Singh',
      mobileNumber: '+91 99002 77881',
      address: '77 Green Glen Layout, HSR Sector 2, Bengaluru 560102',
      modelName: 'AquaVault SmartCutoff Valve V2',
      hardwareType: 'Water Stopper',
      quantity: 1,
      serialNumber: 'AV-WST-51084',
      installDate: shiftDaysIso(-410),
      expiryDate: shiftDaysIso(-45),
      warrantyDays: 365,
      basePrice: 4950,
      gstRate: 18,
      invoiceNo: 'INV-AQV-2025-8910'
    }
  ];
}

function loadPrivateCustomersList() {
  if (session.privateCustomers && session.privateCustomers.length) {
    return session.privateCustomers;
  }
  try {
    const raw = localStorage.getItem(PRIVATE_CUSTOMERS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        session.privateCustomers = parsed;
        return parsed;
      }
    }
  } catch {}
  session.privateCustomers = getDefaultPrivateCustomers();
  return session.privateCustomers;
}

function savePrivateCustomersAndSyncPublicCache(list) {
  session.privateCustomers = list;
  try {
    localStorage.setItem(PRIVATE_CUSTOMERS_CACHE_KEY, JSON.stringify(list));
    // Build strictly non-sensitive public cache (NEVER includes mobileNumber, address, or invoiceNo)
    const publicOnly = list.map(c => ({
      id: sanitizeId(c.id),
      customerName: sanitizeText(c.customerName, 120),
      modelName: sanitizeText(c.modelName, 140),
      hardwareType: c.hardwareType === 'Water Stopper' ? 'Water Stopper' : 'Water Level Controller',
      quantity: Math.max(1, parseInt(c.quantity, 10) || 1),
      installDate: c.installDate,
      expiryDate: c.expiryDate,
      status: getDaysRemaining(c.expiryDate) === 0 ? 'EXPIRED' : 'ACTIVE'
    }));
    localStorage.setItem(PUBLIC_UNITS_CACHE_KEY, JSON.stringify(publicOnly));
  } catch {}
}

function loadPrivateInvoicesList() {
  if (session.privateInvoices && session.privateInvoices.length) {
    return session.privateInvoices;
  }
  try {
    const raw = localStorage.getItem(PRIVATE_INVOICES_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        session.privateInvoices = parsed;
        return parsed;
      }
    }
  } catch {}
  return [];
}

function loadCustomerTicketsState() {
  const fallback = {
    tickets: [
      { id: 'SRV-9402', unitId: 'pub_u2', unitName: 'Sandeep Kulkarni (AquaVault HydroSeal Brass Stopper)', issue: 'Annual Sensor Calibration', notes: 'Routine ultrasonic level calibration before monsoon.', status: 'Scheduled', date: shiftDaysIso(-2) },
      { id: 'SRV-8817', unitId: 'pub_u1', unitName: 'Rajesh Verma (AquaVault Pro-X7 Controller)', issue: 'Initial Commissioning Check', notes: 'Verified zero-overflow cutoff and dry-run protection.', status: 'Resolved', date: shiftDaysIso(-64) }
    ]
  };
  try {
    const raw = localStorage.getItem(CUSTOMER_STATE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      tickets: Array.isArray(parsed.tickets) ? parsed.tickets : fallback.tickets
    };
  } catch {
    return fallback;
  }
}

function saveCustomerTicketsState(cs) {
  try { localStorage.setItem(CUSTOMER_STATE_KEY, JSON.stringify(cs)); } catch {}
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
   FIRESTORE SERVER-SIDE ADMIN VERIFICATION & DUAL-VAULT SYNC
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

async function syncSingleCustomerToDualFirestoreCollections(record) {
  if (!db || !fbSdk || !session.user || !session.authenticated) return;
  const docId = sanitizeId(record.id);
  const remDays = getDaysRemaining(record.expiryDate);

  // 1. Write ONLY non-sensitive fields to `public_units/{docId}` (Zero phone, zero address, zero bill)
  const publicPayload = {
    customerName: sanitizeText(record.customerName, 120),
    modelName: sanitizeText(record.modelName, 140),
    hardwareType: record.hardwareType === 'Water Stopper' ? 'Water Stopper' : 'Water Level Controller',
    quantity: Math.max(1, Math.min(1000, parseInt(record.quantity, 10) || 1)),
    installDate: sanitizeText(record.installDate, 20),
    expiryDate: sanitizeText(record.expiryDate, 20),
    status: remDays === 0 ? 'EXPIRED' : 'ACTIVE',
    updatedAt: fbSdk.serverTimestamp()
  };

  // 2. Write full sensitive record to `private_customers/{docId}` (Admin-UID only)
  const privateRef = fbSdk.doc(db, 'private_customers', docId);
  const privateSnap = await fbSdk.getDoc(privateRef);
  const privatePayload = {
    customerName: sanitizeText(record.customerName, 120),
    mobileNumber: sanitizeText(record.mobileNumber || '+91 00000 00000', 30),
    address: sanitizeText(record.address || 'India', 250),
    modelName: sanitizeText(record.modelName, 140),
    hardwareType: record.hardwareType === 'Water Stopper' ? 'Water Stopper' : 'Water Level Controller',
    quantity: Math.max(1, Math.min(1000, parseInt(record.quantity, 10) || 1)),
    serialNumber: sanitizeText(record.serialNumber || ('AV-' + docId.toUpperCase()), 80),
    installDate: sanitizeText(record.installDate, 20),
    expiryDate: sanitizeText(record.expiryDate, 20),
    warrantyDays: Math.max(0, Math.min(3650, parseInt(record.warrantyDays, 10) || 365)),
    basePrice: Math.max(0, Number(record.basePrice) || 0),
    gstRate: Math.max(0, Math.min(50, Number(record.gstRate) || 18)),
    invoiceNo: sanitizeText(record.invoiceNo || ('INV-AQV-' + new Date().getFullYear()), 60),
    updatedAt: fbSdk.serverTimestamp()
  };

  try {
    await fbSdk.setDoc(fbSdk.doc(db, 'public_units', docId), publicPayload);
    if (privateSnap.exists()) {
      await fbSdk.setDoc(privateRef, privatePayload, { merge: true });
    } else {
      await fbSdk.setDoc(privateRef, { ...privatePayload, createdAt: fbSdk.serverTimestamp() });
    }
  } catch (err) {
    console.warn('Dual-collection Firestore sync warning:', err?.message || err);
  }
}

async function deleteCustomerFromDualFirestoreCollections(customerId) {
  if (!db || !fbSdk || !session.user || !session.authenticated) return;
  const docId = sanitizeId(customerId);
  try {
    await Promise.all([
      fbSdk.deleteDoc(fbSdk.doc(db, 'public_units', docId)),
      fbSdk.deleteDoc(fbSdk.doc(db, 'private_customers', docId))
    ]);
  } catch (err) {
    console.warn('Dual-collection delete warning:', err?.message || err);
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
      featureInvoice: Boolean(cfg.features.invoice),
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

    // Also sync all private customers to public_units & private_customers
    const custList = loadPrivateCustomersList();
    for (const c of custList) {
      await syncSingleCustomerToDualFirestoreCollections(c);
    }

    session.cloudSyncedAt = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch (err) {
    console.warn('Firestore sync error:', err?.message || err);
  }
}

async function verifyAndLoadAdminSession(user) {
  if (!user) {
    return { allowed: false, reason: 'No authenticated Firebase user.' };
  }

  const isAuthorizedUid = user.uid === AUTHORIZED_ADMIN_UID;
  if (!isAuthorizedUid) {
    const emailLabel = sanitizeText(user.email || 'unknown', 120);
    return {
      allowed: false,
      reason: `Access Denied: Account "${emailLabel}" (UID: ${sanitizeText(user.uid, 60)}) is not authorized. Only Admin UID "${AUTHORIZED_ADMIN_UID}" can sign in to AquaVault Admin.`
    };
  }

  if (!db || !fbSdk) {
    session.cloudSyncedAt = 'Auth Verified (UID Matched)';
    return { allowed: true };
  }

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

    // Load private_customers from Firestore (or seed default customers on first run)
    try {
      const custSnap = await fbSdk.getDocs(fbSdk.collection(db, 'private_customers'));
      if (!custSnap.empty) {
        const list = [];
        custSnap.forEach(s => list.push({ id: s.id, ...s.data() }));
        savePrivateCustomersAndSyncPublicCache(list);
      } else {
        const initialCustomers = loadPrivateCustomersList();
        savePrivateCustomersAndSyncPublicCache(initialCustomers);
        for (const c of initialCustomers) {
          await syncSingleCustomerToDualFirestoreCollections(c);
        }
      }
    } catch {}

    // Load private_invoices from Firestore
    try {
      const invSnap = await fbSdk.getDocs(fbSdk.collection(db, 'private_invoices'));
      if (!invSnap.empty) {
        const invList = [];
        invSnap.forEach(s => invList.push({ id: s.id, ...s.data() }));
        invList.sort((a, b) => String(b.invoiceDate || '').localeCompare(String(a.invoiceDate || '')));
        session.privateInvoices = invList;
        try { localStorage.setItem(PRIVATE_INVOICES_CACHE_KEY, JSON.stringify(invList)); } catch {}
      }
    } catch {}

    // Load appConfig & hubApps
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
          invoice: d.featureInvoice !== false,
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
    return { allowed: true };
  } catch (err) {
    console.warn('Firestore rules not published in Firebase Console yet; continuing because Admin UID matched:', err?.message || err);
    session.cloudSyncedAt = 'UID Verified (Publish firestore.rules in Console for Cloud Sync)';
    return { allowed: true };
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

  if (!email || !password) {
    session.authError = 'Enter both your Admin Email and Password.';
    render();
    return;
  }

  session.authBusy = true;
  render();

  await resolveFirebaseConfigSafely();
  if (!isFirebaseConfigured()) {
    session.authBusy = false;
    session.authError = 'Firebase is not connected yet. Paste your Firebase Web App config into firebase-config.js.';
    render();
    return;
  }

  const ready = await initFirebaseSafely();
  if (!ready || !auth || !fbSdk) {
    session.authBusy = false;
    session.authError = 'Could not initialize Firebase Authentication. Check firebase-config.js and network connectivity.';
    render();
    return;
  }

  try {
    const cred = await fbSdk.signInWithEmailAndPassword(auth, email, password);
    const verifyResult = await verifyAndLoadAdminSession(cred.user);
    if (!verifyResult.allowed) {
      await fbSdk.signOut(auth);
      rollMathQuiz();
      session.authenticated = false;
      session.user = null;
      session.authError = verifyResult.reason || `Unauthorized Account: "${email}" is not the designated AquaVault Admin in firestore.rules.`;
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

  await resolveFirebaseConfigSafely();
  if (!isFirebaseConfigured()) {
    session.authError = 'Firebase is not connected yet.';
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
  await appendCloudAudit('CONFIG_UPDATED', 'Manual full Firestore config, public_units & private_customers sync triggered', 'INFO');
  render();
  showToast('Synced all Customer Units, Config & Hub Apps to Firestore');
}

/* =========================================================================
   ADMIN FEATURE CONTROL & DUAL-VAULT CUSTOMER/WARRANTY CRUD
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
  showToast(`${key.toUpperCase()} is now ${cfg.features[key] ? 'ENABLED' : 'DISABLED'}`);
}

function toggleMaintenanceMode() {
  const cfg = loadAdminConfig();
  cfg.maintenanceMode = !cfg.maintenanceMode;
  saveAdminConfig(cfg);
  appendCloudAudit('CONFIG_UPDATED', `Maintenance Mode switched ${cfg.maintenanceMode ? 'ON' : 'OFF'}`, 'WARNING');
  render();
  showToast(cfg.maintenanceMode ? 'Maintenance Mode ACTIVE on Landing Page' : 'Landing Page is LIVE');
}

function toggleAnnouncementActive() {
  const cfg = loadAdminConfig();
  cfg.announcementActive = !cfg.announcementActive;
  saveAdminConfig(cfg);
  appendCloudAudit('CONFIG_UPDATED', `Broadcast Banner ${cfg.announcementActive ? 'ENABLED' : 'HIDDEN'}`, 'INFO');
  render();
  showToast(cfg.announcementActive ? 'Broadcast Banner published to Landing Page' : 'Broadcast Banner hidden');
}

function saveBroadcastAndBranding(e) {
  e.preventDefault();
  const cfg = loadAdminConfig();
  cfg.announcementText = sanitizeText(document.getElementById('cfgAnnouncementText')?.value || '', 300);
  cfg.maintenanceMessage = sanitizeText(document.getElementById('cfgMaintenanceMsg')?.value || '', 300);
  cfg.defaultTheme = document.getElementById('cfgDefaultTheme')?.value === 'dark' ? 'dark' : 'light';
  saveAdminConfig(cfg);
  appendCloudAudit('CONFIG_UPDATED', 'Updated broadcast banner, maintenance message & default theme', 'INFO');
  showToast('Public Landing Page branding & broadcast saved');
  render();
}

/* Units & Customer Warranty Dual-Vault CRUD */
async function saveCustomerWarrantyRecord(e) {
  e.preventDefault();
  if (!session.authenticated || !session.user || session.user.uid !== AUTHORIZED_ADMIN_UID) {
    return showToast('Unauthorized: Only verified Admin UID can modify customer units');
  }

  const customerName = sanitizeText(document.getElementById('newCustName')?.value || '', 120);
  const mobileNumber = sanitizeText(document.getElementById('newCustMobile')?.value || '', 30);
  const address = sanitizeText(document.getElementById('newCustAddress')?.value || '', 250);
  const modelName = sanitizeText(document.getElementById('newUnitModel')?.value || '', 140);
  const hardwareType = document.getElementById('newUnitType')?.value === 'Water Stopper'
    ? 'Water Stopper'
    : 'Water Level Controller';
  const quantity = Math.max(1, Math.min(1000, parseInt(document.getElementById('newUnitQty')?.value, 10) || 1));
  const installDate = sanitizeText(document.getElementById('newUnitInstallDate')?.value || shiftDaysIso(0), 20);
  const warrantyDays = Math.max(0, Math.min(3650, parseInt(document.getElementById('newUnitDays')?.value, 10) || 365));
  const basePrice = Math.max(0, Math.min(100000000, Number(document.getElementById('newUnitPrice')?.value || 8450)));
  const serialNumber = sanitizeText(document.getElementById('newUnitSerial')?.value || ('AV-' + Date.now().toString(36).toUpperCase()), 80).toUpperCase();

  if (!customerName || !mobileNumber || !address || !modelName) {
    return showToast('Fill Customer Name, Mobile Number, Location/Place, and Product Model');
  }

  const expiryDate = shiftDaysIso(warrantyDays, installDate);
  const list = [...loadPrivateCustomersList()];

  let record;
  if (session.editingCustomerId) {
    const idx = list.findIndex(c => c.id === session.editingCustomerId);
    record = {
      ...(idx >= 0 ? list[idx] : {}),
      id: session.editingCustomerId,
      customerName,
      mobileNumber,
      address,
      modelName,
      hardwareType,
      quantity,
      serialNumber,
      installDate,
      expiryDate,
      warrantyDays,
      basePrice,
      gstRate: 18,
      invoiceNo: (idx >= 0 && list[idx].invoiceNo) ? list[idx].invoiceNo : ('INV-AQV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000))
    };
    if (idx >= 0) list[idx] = record;
    else list.unshift(record);
    session.editingCustomerId = '';
  } else {
    record = {
      id: 'cust_' + Date.now().toString(36),
      customerName,
      mobileNumber,
      address,
      modelName,
      hardwareType,
      quantity,
      serialNumber,
      installDate,
      expiryDate,
      warrantyDays,
      basePrice,
      gstRate: 18,
      invoiceNo: 'INV-AQV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000)
    };
    list.unshift(record);
  }

  savePrivateCustomersAndSyncPublicCache(list);
  await syncSingleCustomerToDualFirestoreCollections(record);
  await appendCloudAudit('WARRANTY_MODIFIED', `Synced ${customerName} (${modelName} x${quantity}, ${warrantyDays}d warranty) to public_units & private_customers`, 'INFO');
  render();
  showToast(`Saved ${customerName} — Public Warranty & Private Contact Vault synced!`);
}

function editCustomerRecord(customerId) {
  session.editingCustomerId = sanitizeId(customerId);
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEditCustomerRecord() {
  session.editingCustomerId = '';
  render();
}

async function extendUnitWarranty(customerId, extraDays) {
  const list = [...loadPrivateCustomersList()];
  const unit = list.find(u => u.id === customerId);
  if (!unit) return;

  if (extraDays === 0) {
    // Mark expired immediately (0 days remaining) without deleting record
    unit.expiryDate = shiftDaysIso(-1);
    unit.warrantyDays = 0;
  } else {
    const [y, m, d] = String(unit.expiryDate || shiftDaysIso(0)).split('-').map(Number);
    const base = (y && m && d) ? new Date(y, m - 1, d) : new Date();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const startFrom = base < today ? today : base;
    const next = new Date(startFrom.getTime() + extraDays * 86400000);
    unit.expiryDate = next.toISOString().slice(0, 10);
    unit.warrantyDays = getDaysRemaining(unit.expiryDate);
  }

  savePrivateCustomersAndSyncPublicCache(list);
  await syncSingleCustomerToDualFirestoreCollections(unit);
  await appendCloudAudit('WARRANTY_MODIFIED', `Updated warranty for ${unit.customerName} (${unit.modelName}) -> expires ${unit.expiryDate}`, 'INFO');
  render();
  showToast(extraDays === 0 ? `Marked ${unit.customerName}'s warranty as Expired (stays visible on public list)` : `Extended ${unit.customerName}'s warranty by +${extraDays} days`);
}

async function deleteUnit(customerId) {
  const list = [...loadPrivateCustomersList()];
  const found = list.find(u => u.id === customerId);
  const nextList = list.filter(u => u.id !== customerId);
  savePrivateCustomersAndSyncPublicCache(nextList);
  await deleteCustomerFromDualFirestoreCollections(customerId);
  await appendCloudAudit('WARRANTY_MODIFIED', `Deleted customer record ${found ? found.customerName : customerId}`, 'WARNING');
  render();
  showToast('Customer record deleted from public_units & private_customers');
}

/* Service Tickets Control */
function setTicketFilter(f) {
  session.ticketFilter = f;
  render();
}

function updateTicketStatus(ticketId, nextStatus) {
  const cs = loadCustomerTicketsState();
  const t = cs.tickets.find(x => x.id === ticketId);
  if (!t) return;
  t.status = nextStatus;
  saveCustomerTicketsState(cs);
  appendCloudAudit('TICKET_UPDATED', `Ticket ${ticketId} status changed to ${nextStatus}`, 'INFO');
  render();
  showToast(`Ticket ${ticketId} marked ${nextStatus}`);
}

function deleteTicket(ticketId) {
  const cs = loadCustomerTicketsState();
  cs.tickets = cs.tickets.filter(x => x.id !== ticketId);
  saveCustomerTicketsState(cs);
  appendCloudAudit('TICKET_UPDATED', `Deleted service ticket ${ticketId}`, 'WARNING');
  render();
  showToast(`Ticket ${ticketId} deleted`);
}

/* Invoices & Google Drive Billing Control */
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
    return showToast('Google Drive Apps Script Webhook URL must start with https://');
  }
  saveAdminConfig(cfg);
  appendCloudAudit('CONFIG_UPDATED', `Updated Invoice Studio & Google Drive Webhook defaults (GST ${cfg.invoiceDefaults.gstPercent}%)`, 'INFO');
  render();
  showToast('Invoice Studio & Google Drive Webhook defaults saved');
}

async function updateSavedInvoiceStatus(invId, status) {
  const list = [...loadPrivateInvoicesList()];
  const inv = list.find(x => x.id === invId);
  if (!inv) return;
  inv.status = status;
  session.privateInvoices = list;
  try { localStorage.setItem(PRIVATE_INVOICES_CACHE_KEY, JSON.stringify(list)); } catch {}
  if (db && fbSdk && session.authenticated) {
    try {
      await fbSdk.setDoc(fbSdk.doc(db, 'private_invoices', sanitizeId(invId)), {
        status,
        updatedAt: fbSdk.serverTimestamp()
      }, { merge: true });
    } catch {}
  }
  appendCloudAudit('CONFIG_UPDATED', `Invoice ${inv.invoiceNo} marked ${status}`, 'INFO');
  render();
  showToast(`Invoice ${inv.invoiceNo} updated to ${status}`);
}

function exportMasterInvoicesCsv() {
  const list = loadPrivateInvoicesList();
  if (!list.length) return showToast('No saved bills in private_invoices yet');
  const cell = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const headers = ['Invoice No', 'Date', 'Due Date', 'Status', 'Customer Name', 'Mobile Number', 'Place / Address', 'Model(s)', 'Qty', 'Unit Price', 'Discount %', 'GST %', 'Grand Total', 'Google Drive Saved'];
  const rows = list.map(i => [
    i.invoiceNo, i.invoiceDate, i.dueDate, i.status, i.customerName || i.clientName, i.mobileNumber || i.clientPhone, i.address || i.clientAddress, i.modelName || '', i.quantity || 1, i.unitPrice || 0, i.discountPct || 0, i.taxPct || 18, i.grandTotal || 0, i.driveSaved ? 'YES' : 'Firestore'
  ].map(cell).join(','));
  const csv = '\uFEFF' + [headers.map(cell).join(','), ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `AquaVault-Admin-Invoices-${shiftDaysIso(0)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast(`Exported ${list.length} bill(s) to Google Sheets CSV`);
}

/* Apps Hub Control */
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
  showToast(`Added "${name}" to Public Apps Hub`);
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
  showToast('App removed from Ecosystem Hub');
}

/* =========================================================================
   AUTH VIEWPORT (CLEAN ADMIN LOGIN + MATH QUIZ + FIREBASE FORGOT PASSWORD)
   ========================================================================= */
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
        <p class="auth-sub" style="margin-bottom:0;">Checking server-side Admin UID privileges...</p>
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
        <span class="shield-chip emerald">UID: ${AUTHORIZED_ADMIN_UID.slice(0, 8)}...</span>
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
        <a href="../index.html" style="font-size:11.5px;color:var(--ink-secondary);text-decoration:none;font-weight:700;">&larr; Public Landing Page</a>
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
          <div class="auth-emblem"><img src="../assets/app-icon.jpg" alt="AquaVault Admin" width="40" height="40" /></div>
          <div>
            <div style="font-size:15px;font-weight:800;letter-spacing:-0.02em;">AquaVault Admin</div>
            <div style="font-size:10.5px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--primary);">Firebase Protected Console</div>
          </div>
        </div>
        <button type="button" class="pill-btn" onclick="toggleAdminTheme()">
          ${isDark ? ic('sun') : ic('moon')} ${isDark ? 'Day' : 'Night'}
        </button>
      </div>
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
function renderDashboardPanel(cfg, customers, invoices, ticketsState, logs) {
  const enabledCount = Object.values(cfg.features).filter(Boolean).length;
  const activeUnits = customers.filter(u => getDaysRemaining(u.expiryDate) > 0).length;
  const openTickets = (ticketsState.tickets || []).filter(t => t.status !== 'Resolved').length;

  return `
    <div class="page-head" style="display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px;">
      <div>
        <div class="eyebrow">Executive Command Center</div>
        <h1 class="page-title serif">AquaVault Master Control</h1>
        <p class="page-desc">Manage public customer warranty countdowns, private customer phone/address records, manual GST bills with automatic Google Drive backup, and the Ecosystem Apps Hub.</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <a href="../invoice.html" class="btn btn-primary" style="text-decoration:none;">
          ${ic('receipt')} Open Manual Bill Generator
        </a>
        <a href="../index.html" target="_blank" class="btn btn-outline" style="text-decoration:none;">
          View Public Landing Page
        </a>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Registered Customers</div>
        <div class="kpi-value mono">${customers.length}</div>
        <div class="kpi-foot"><span style="color:var(--emerald);font-weight:700;">${activeUnits} Active</span> &bull; ${customers.length - activeUnits} Expired</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Private Bills &amp; Drive</div>
        <div class="kpi-value mono">${invoices.length}</div>
        <div class="kpi-foot">GST Default: ${cfg.invoiceDefaults.gstPercent}%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Active Modules</div>
        <div class="kpi-value mono">${enabledCount}/6</div>
        <div class="kpi-foot">${cfg.maintenanceMode ? '<span style="color:var(--rose);font-weight:700;">Maintenance ON</span>' : '<span style="color:var(--emerald);font-weight:700;">Public Page Live</span>'}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Open Service Tickets</div>
        <div class="kpi-value mono">${openTickets}</div>
        <div class="kpi-foot">${(ticketsState.tickets || []).length} total requests</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head">
          <div>
            <h2 class="card-title">Instant Emergency Switches</h2>
            <p class="card-sub">Synced with Firestore &amp; Public Landing Page</p>
          </div>
          <span class="badge ${cfg.maintenanceMode ? 'badge-rose' : 'badge-emerald'}">${cfg.maintenanceMode ? 'Paused' : 'Operational'}</span>
        </div>
        <div class="toggle-row">
          <div class="toggle-meta">
            <div class="toggle-name">Public Page Maintenance Mode</div>
            <div class="toggle-desc">Shows luxury maintenance notice on public pages</div>
          </div>
          <button class="switch danger ${cfg.maintenanceMode ? 'on' : ''}" onclick="toggleMaintenanceMode()" aria-label="Toggle Maintenance Mode"></button>
        </div>
        <div class="toggle-row">
          <div class="toggle-meta">
            <div class="toggle-name">Top Broadcast Banner</div>
            <div class="toggle-desc">Display urgent offers or monsoon alerts at the top of index.html</div>
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
  // Clean feature switches — removed deleted Calculator, Notepad, and separate Warranty page switches
  const featureRows = [
    ['warranty', 'Public Customer Warranty Directory & Countdown Ring', 'Controls live warranty countdown directory on index.html'],
    ['hub', 'AquaVault Ecosystem / Apps Hub (SellGst-Pro & Tools)', 'Controls visibility of hub.html and embedded Apps Hub on index.html'],
    ['devices', 'Hardware Models & Technician Service Booking', 'Controls visibility of devices.html and service request form'],
    ['invoice', 'Admin-Only Manual Bill Generator & Google Drive Sync', 'Controls invoice.html Admin billing studio'],
    ['privacy', 'DPDP Privacy & Public/Private Isolation Notice', 'Controls visibility of privacy.html'],
    ['pwaPopup', '7-Second Auto-Hiding PWA Install Popup', 'Controls the top mobile install prompt popup']
  ];

  return `
    <div class="page-head">
      <div class="eyebrow">Master Feature Matrix</div>
      <h1 class="page-title serif">Feature Switches &amp; Branding</h1>
      <p class="page-desc">Enable or disable active AquaVault modules, configure maintenance messages, and broadcast announcements.</p>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head">
          <div>
            <h2 class="card-title">Active Module Switches</h2>
            <p class="card-sub">Deleted pages (Calculator, Notepad, separate Warranty page) have been permanently removed</p>
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
            <label>Public Broadcast Announcement Text</label>
            <textarea id="cfgAnnouncementText" class="textarea" maxlength="300">${esc(cfg.announcementText)}</textarea>
          </div>
          <div class="field">
            <label>Maintenance Mode Notice Message</label>
            <textarea id="cfgMaintenanceMsg" class="textarea" maxlength="300">${esc(cfg.maintenanceMessage)}</textarea>
          </div>
          <div class="field">
            <label>Default Public Theme</label>
            <select id="cfgDefaultTheme" class="select">
              <option value="light" ${cfg.defaultTheme === 'light' ? 'selected' : ''}>Day Mode (Porcelain White + Royal Purple)</option>
              <option value="dark" ${cfg.defaultTheme === 'dark' ? 'selected' : ''}>Night Mode (Obsidian Black + Luminous Violet)</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary btn-full">${ic('check')} Save &amp; Publish to Firestore</button>
        </form>
      </div>
    </div>
  `;
}

function renderDevicesPanel(customers) {
  const editing = session.editingCustomerId
    ? customers.find(c => c.id === session.editingCustomerId)
    : null;

  return `
    <div class="page-head">
      <div class="eyebrow">Dual-Vault Customer &amp; Warranty Control</div>
      <h1 class="page-title serif">Units &amp; Customer Warranty Control</h1>
      <p class="page-desc">
        Add or edit customers manually. <strong>Customer Name, Model, Quantity &amp; Warranty Countdown</strong> sync automatically to <code>public_units</code> (shown on <code>index.html</code>), while <strong>Mobile Number &amp; Place/Address</strong> are locked strictly inside <code>private_customers</code> (Admin-only).
      </p>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <h2 class="card-title">${editing ? `Edit Customer: ${esc(editing.customerName)}` : 'Register New Customer & Hardware Unit'}</h2>
          <p class="card-sub">Automatically splits public display fields from private contact details</p>
        </div>
        ${editing ? `<button type="button" class="btn btn-sm btn-outline" onclick="cancelEditCustomerRecord()">Cancel Edit</button>` : ''}
      </div>
      <form onsubmit="saveCustomerWarrantyRecord(event)">
        <div class="grid-2">
          <div class="field">
            <label>Customer Full Name (Public + Private)</label>
            <input id="newCustName" class="input" maxlength="120" value="${esc(editing ? editing.customerName : '')}" placeholder="e.g. Rajesh Verma" required />
          </div>
          <div class="field">
            <label>Customer Mobile Number ( strictly Private — Admin Only )</label>
            <input id="newCustMobile" class="input mono" maxlength="30" value="${esc(editing ? editing.mobileNumber : '')}" placeholder="e.g. +91 98450 11223" required />
          </div>
        </div>

        <div class="field">
          <label>Customer Location / Place / Address ( strictly Private — Admin Only )</label>
          <input id="newCustAddress" class="input" maxlength="250" value="${esc(editing ? editing.address : '')}" placeholder="e.g. 42 Park View Residency, Indiranagar, Bengaluru" required />
        </div>

        <div class="grid-2">
          <div class="field">
            <label>Product Model Name (Public + Private)</label>
            <input id="newUnitModel" class="input" maxlength="140" value="${esc(editing ? editing.modelName : '')}" placeholder="e.g. AquaVault Pro-X7 Dual Tank Controller" required />
          </div>
          <div class="field">
            <label>Hardware Type (Public + Private)</label>
            <select id="newUnitType" class="select">
              <option value="Water Level Controller" ${editing && editing.hardwareType === 'Water Level Controller' ? 'selected' : ''}>Water Level Controller</option>
              <option value="Water Stopper" ${editing && editing.hardwareType === 'Water Stopper' ? 'selected' : ''}>Water Stopper</option>
            </select>
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label>Quantity Installed (Public + Private)</label>
            <input id="newUnitQty" class="input mono" type="number" min="1" max="1000" value="${editing ? (editing.quantity || 1) : 1}" required />
          </div>
          <div class="field">
            <label>Installation Date (Public + Private)</label>
            <input id="newUnitInstallDate" class="input mono" type="date" value="${esc(editing ? editing.installDate : shiftDaysIso(0))}" required />
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label>Warranty Coverage (Days — Set 0 for Expired)</label>
            <input id="newUnitDays" class="input mono" type="number" value="${editing ? editing.warrantyDays : 365}" min="0" max="3650" required />
          </div>
          <div class="field">
            <label>Unit Price (INR — Private Only)</label>
            <input id="newUnitPrice" class="input mono" type="number" value="${editing ? editing.basePrice : 8450}" min="0" max="100000000" required />
          </div>
        </div>

        <div class="field">
          <label>Hardware Serial Number (Private Only)</label>
          <input id="newUnitSerial" class="input mono" maxlength="80" value="${esc(editing ? editing.serialNumber : '')}" placeholder="Auto-generated if left blank (e.g. AV-WLC-88412)" />
        </div>

        <button type="submit" class="btn btn-primary">
          ${ic('check')} ${editing ? 'Update Customer & Sync Public/Private Vaults' : 'Add Customer & Activate Live Public Warranty'}
        </button>
      </form>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <h2 class="card-title">Registered Customers (${customers.length})</h2>
          <p class="card-sub">Expired units stay visible on the public landing page with a red "Expired" badge until you delete or renew them</p>
        </div>
        <a href="../invoice.html" class="btn btn-sm btn-primary" style="text-decoration:none;">
          ${ic('receipt')} Generate Bill for Customer
        </a>
      </div>
      ${customers.map(u => {
        const rem = getDaysRemaining(u.expiryDate);
        const badge = rem === 0 ? 'badge-rose' : rem <= 45 ? 'badge-amber' : 'badge-emerald';
        const label = rem === 0 ? 'Expired (0d)' : `${rem} Days Left`;
        const safeId = sanitizeId(u.id);
        return `
          <div class="item-row">
            <div class="item-top">
              <div>
                <div style="font-size:15px;font-weight:800;">
                  ${esc(u.customerName)}
                  <span class="badge badge-purple" style="margin-left:6px;">${esc(u.hardwareType)}</span>
                  <span class="badge badge-amber mono" style="margin-left:4px;">Qty: ${Number(u.quantity) || 1}</span>
                </div>
                <div style="font-size:13px;font-weight:700;color:var(--ink-secondary);margin-top:3px;">
                  ${esc(u.modelName)} &middot; <span class="mono">${formatINR(u.basePrice)}</span>
                </div>
                <div class="mono" style="font-size:11.5px;color:var(--primary);margin-top:3px;">
                  [PRIVATE] Mobile: ${esc(u.mobileNumber)} &middot; Place: ${esc(u.address)} &middot; Serial: ${esc(u.serialNumber)}
                </div>
                <div style="font-size:11.5px;color:var(--ink-tertiary);margin-top:3px;">
                  Installed: <span class="mono">${esc(u.installDate)}</span> &middot; Expires: <span class="mono">${esc(u.expiryDate)}</span>
                </div>
              </div>
              <span class="badge ${badge}">${label}</span>
            </div>
            <div class="item-actions">
              <button class="btn btn-sm btn-soft" onclick="editCustomerRecord('${safeId}')">Edit Details</button>
              <button class="btn btn-sm btn-emerald" onclick="extendUnitWarranty('${safeId}', 90)">+90d Warranty</button>
              <button class="btn btn-sm btn-soft" onclick="extendUnitWarranty('${safeId}', 180)">+180d</button>
              <button class="btn btn-sm btn-soft" onclick="extendUnitWarranty('${safeId}', 365)">+1 Year</button>
              <button class="btn btn-sm btn-outline" onclick="extendUnitWarranty('${safeId}', 0)">Mark Expired</button>
              <button class="btn btn-sm btn-danger" onclick="deleteUnit('${safeId}')">${ic('trash')} Delete</button>
            </div>
          </div>
        `;
      }).join('') || '<div style="font-size:13px;color:var(--ink-tertiary);">No customer records registered yet.</div>'}
    </div>
  `;
}

function renderTicketsPanel(cs) {
  const filters = ['All', 'Logged', 'Scheduled', 'Resolved'];
  const list = (cs.tickets || []).filter(t => session.ticketFilter === 'All' || t.status === session.ticketFilter);

  return `
    <div class="page-head">
      <div class="eyebrow">Service Operations</div>
      <h1 class="page-title serif">Service Tickets Control</h1>
      <p class="page-desc">Review customer inspection &amp; repair tickets, schedule technician visits, or mark tickets resolved.</p>
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

function renderInvoicesPanel(cfg, savedInvoices) {
  const d = cfg.invoiceDefaults;
  return `
    <div class="page-head" style="display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px;">
      <div>
        <div class="eyebrow">Admin-Only Billing &amp; Google Drive Vault</div>
        <h1 class="page-title serif">Invoice Studio &amp; Google Drive Sync</h1>
        <p class="page-desc">Configure default company letterhead, GST rate, color theme, and your Google Apps Script Web App URL (<code>Code.gs</code>) for automatic permanent Google Drive bill archiving.</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <a href="../invoice.html" class="btn btn-primary" style="text-decoration:none;">
          ${ic('receipt')} Open Manual Bill Generator
        </a>
        <button type="button" class="btn btn-soft" onclick="copyGoogleDriveAppsScript()">
          ${ic('check')} Copy Code.gs (Drive Saver)
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <h2 class="card-title">Global Invoice Studio &amp; Google Drive Webhook Defaults</h2>
          <p class="card-sub">Automatically pre-fills new bills and pushes every saved bill to your Google Drive folder <code>AquaVault_Permanent_Bills</code></p>
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
          <label>Google Apps Script Web App URL (<code>Code.gs</code> /exec URL for Automatic Google Drive Save)</label>
          <input id="invDefSheetUrl" class="input mono" type="url" maxlength="500" value="${esc(d.googleSheetWebhook || '')}" placeholder="https://script.google.com/macros/s/.../exec" />
        </div>
        <button type="submit" class="btn btn-primary">${ic('check')} Save Invoice &amp; Google Drive Defaults</button>
      </form>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <h2 class="card-title">Private Generated Bills Vault (${savedInvoices.length})</h2>
          <p class="card-sub">Stored in <code>private_invoices</code> (Admin-UID only) &amp; archived in Google Drive</p>
        </div>
        <button class="btn btn-sm btn-emerald" onclick="exportMasterInvoicesCsv()">${ic('download')} Export Master CSV</button>
      </div>
      ${savedInvoices.map(inv => {
        const safeId = sanitizeId(inv.id);
        return `
        <div class="item-row">
          <div class="item-top">
            <div>
              <div class="mono" style="font-size:13.5px;font-weight:800;color:var(--primary);">${esc(inv.invoiceNo)}</div>
              <div style="font-size:13px;font-weight:700;margin-top:2px;">
                ${esc(inv.customerName || inv.clientName)} &middot; <span class="mono">${formatINR(inv.grandTotal || 0)}</span>
              </div>
              <div class="mono" style="font-size:11.5px;color:var(--ink-secondary);margin-top:2px;">
                Mobile: ${esc(inv.mobileNumber || inv.clientPhone || '—')} &middot; Place: ${esc(inv.address || inv.clientAddress || '—')}
              </div>
              <div style="font-size:11.5px;color:var(--ink-tertiary);margin-top:2px;">
                Model: ${esc(inv.modelName || 'AquaVault Controller')} (Qty: ${inv.quantity || 1}) &middot; Date: <span class="mono">${esc(inv.invoiceDate)}</span>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
              <span class="badge ${inv.status === 'PAID' ? 'badge-emerald' : inv.status === 'OVERDUE' ? 'badge-rose' : 'badge-amber'}">${esc(inv.status)}</span>
              <span class="badge badge-purple" style="font-size:10px;">${inv.driveSaved ? 'Google Drive Saved' : 'Firestore Vault'}</span>
            </div>
          </div>
          <div class="item-actions">
            <button class="btn btn-sm btn-emerald" onclick="updateSavedInvoiceStatus('${safeId}', 'PAID')">Mark PAID</button>
            <button class="btn btn-sm btn-outline" onclick="updateSavedInvoiceStatus('${safeId}', 'PENDING')">Pending</button>
            <button class="btn btn-sm btn-danger" onclick="updateSavedInvoiceStatus('${safeId}', 'OVERDUE')">Overdue</button>
          </div>
        </div>
      `;
      }).join('') || '<div style="font-size:13px;color:var(--ink-tertiary);">No bills generated yet. Click "Open Manual Bill Generator" above to create &amp; archive your first bill.</div>'}
    </div>
  `;
}

function renderHubPanel(cfg) {
  return `
    <div class="page-head">
      <div class="eyebrow">Ecosystem Directory</div>
      <h1 class="page-title serif">AquaVault Ecosystem &amp; Apps Hub Control</h1>
      <p class="page-desc">Add, hide, or remove websites, apps (such as SellGst-Pro), and water tools shown directly on <code>index.html</code> and <code>hub.html</code> (strict HTTPS-only URL guard).</p>
    </div>

    <div class="card">
      <div class="card-head"><h2 class="card-title">Publish New App / Website Card</h2></div>
      <form onsubmit="addHubApp(event)">
        <div class="grid-2">
          <div class="field">
            <label>App / Website Title</label>
            <input id="hubName" class="input" maxlength="100" placeholder="e.g. SellGst-Pro Billing Suite" required />
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
          <input id="hubDesc" class="input" maxlength="300" placeholder="One-line value summary for visitors" required />
        </div>
        <button type="submit" class="btn btn-primary">${ic('plus')} Publish to Landing Page &amp; Apps Hub</button>
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

function renderSecurityPanel(logs) {
  const user = session.user || {};
  return `
    <div class="page-head">
      <div class="eyebrow">Server-Side Firebase Security</div>
      <h1 class="page-title serif">Firebase Security &amp; Audit</h1>
      <p class="page-desc">All Admin write operations and private collections (<code>private_customers</code>, <code>private_invoices</code>) are locked exclusively to Firebase Admin UID <code>${AUTHORIZED_ADMIN_UID}</code>.</p>
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
          <div style="font-size:12px;color:var(--ink-tertiary);margin-top:10px;">Verified Admin Firebase UID</div>
          <div class="mono" style="font-size:12px;color:var(--ink-secondary);margin-top:2px;word-break:break-all;">${esc(user.uid || '')}</div>
          <div style="font-size:12px;color:var(--ink-tertiary);margin-top:10px;">Inactivity Auto-Logout Protection</div>
          <div class="mono" style="font-size:12px;color:var(--primary);margin-top:2px;">Active (${getRemainingSessionMinutes()} min remaining before auto-logout)</div>
          <div style="font-size:12px;color:var(--ink-tertiary);margin-top:10px;">Last Firestore Sync</div>
          <div class="mono" style="font-size:12px;color:var(--emerald);margin-top:2px;">${esc(session.cloudSyncedAt || 'Synced')}</div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;">
          <button type="button" class="btn btn-primary" onclick="handleManualCloudSync()">${ic('refresh')} Sync All Data to Firestore</button>
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
          <h2 class="card-title">Strict Anti-Hacker Firestore Rules &amp; Google Drive Script</h2>
          <p class="card-sub">Copy <code>firestore.rules</code> or <code>Code.gs</code> in 1 click</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn btn-sm btn-emerald" onclick="copyFirestoreRulesToClipboard()">${ic('check')} Copy firestore.rules</button>
          <button type="button" class="btn btn-sm btn-soft" onclick="copyGoogleDriveAppsScript()">${ic('check')} Copy Code.gs (Drive Saver)</button>
        </div>
      </div>
      <div class="security-shield-row" style="margin-bottom:0;">
        <span class="shield-chip emerald">Admin UID: ${AUTHORIZED_ADMIN_UID}</span>
        <span class="shield-chip emerald">public_units: Zero Phone/Bill Leak</span>
        <span class="shield-chip emerald">private_customers: Admin-Only</span>
        <span class="shield-chip emerald">private_invoices: Admin-Only + Drive</span>
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
  const customers = loadPrivateCustomersList();
  const invoices = loadPrivateInvoicesList();
  const ticketsState = loadCustomerTicketsState();
  const logs = session.auditLogs;
  const user = session.user || {};
  const isDark = getTheme() === 'dark';

  let contentHtml = '';
  switch (session.activeTab) {
    case 'features': contentHtml = renderFeaturesPanel(cfg); break;
    case 'devices': contentHtml = renderDevicesPanel(customers); break;
    case 'tickets': contentHtml = renderTicketsPanel(ticketsState); break;
    case 'invoices': contentHtml = renderInvoicesPanel(cfg, invoices); break;
    case 'hub': contentHtml = renderHubPanel(cfg); break;
    case 'security': contentHtml = renderSecurityPanel(logs); break;
    default: contentHtml = renderDashboardPanel(cfg, customers, invoices, ticketsState, logs); break;
  }

  return `
    <div class="admin-shell">
      <aside class="admin-sidebar">
        <div class="auth-brand" style="padding:2px 8px 16px;border-bottom:1px solid var(--border);">
          <div class="auth-emblem"><img src="../assets/app-icon.jpg" alt="AquaVault Admin" width="40" height="40" /></div>
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
          <a href="../invoice.html" class="nav-item-btn" style="text-decoration:none;margin-top:4px;color:var(--primary);font-weight:800;">
            ${ic('receipt')} <span>Manual Bill Studio</span>
          </a>
          <a href="../index.html" class="nav-item-btn" style="text-decoration:none;color:var(--ink-secondary);">
            ${ic('shield')} <span>Public Trust Page</span>
          </a>
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
            <div class="auth-emblem" style="width:34px;height:34px;border-radius:10px;"><img src="../assets/app-icon.jpg" alt="Admin" width="34" height="34" /></div>
            <div class="topbar-titles">
              <div class="topbar-brand">AquaVault Admin</div>
              <div class="topbar-sub">Firebase Verified &middot; ${esc(user.email || 'Owner')}</div>
            </div>
          </div>
          <div class="topbar-actions">
            <a href="../invoice.html" class="btn btn-sm btn-primary" style="text-decoration:none;">
              ${ic('receipt')} Create Bill
            </a>
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
            <a href="../invoice.html" class="mobile-pill" style="text-decoration:none;color:var(--primary);font-weight:800;">
              ${ic('receipt')} Bill Generator
            </a>
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

async function copyFirestoreRulesToClipboard() {
  try {
    const res = await fetch('../firestore.rules?v=' + Date.now(), { cache: 'no-store' });
    const txt = res.ok ? await res.text() : '';
    if (txt && navigator.clipboard) {
      await navigator.clipboard.writeText(txt);
      showToast(`Copied firestore.rules (UID: ${AUTHORIZED_ADMIN_UID}) to clipboard!`);
      return;
    }
  } catch {}
  showToast(`Open firestore.rules — Admin UID ${AUTHORIZED_ADMIN_UID} is active`);
}

async function copyGoogleDriveAppsScript() {
  try {
    const res = await fetch('../Code.gs?v=' + Date.now(), { cache: 'no-store' });
    const txt = res.ok ? await res.text() : '';
    if (txt && navigator.clipboard) {
      await navigator.clipboard.writeText(txt);
      showToast('Copied Code.gs (Auto-Google Drive Bill Saver) to clipboard!');
      return;
    }
  } catch {}
  showToast('Open Code.gs in project root to copy the Google Drive script');
}

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
  copyFirestoreRulesToClipboard,
  copyGoogleDriveAppsScript,
  setTab,
  toggleFeatureFlag,
  toggleMaintenanceMode,
  toggleAnnouncementActive,
  saveBroadcastAndBranding,
  saveCustomerWarrantyRecord,
  editCustomerRecord,
  cancelEditCustomerRecord,
  extendUnitWarranty,
  deleteUnit,
  setTicketFilter,
  updateTicketStatus,
  deleteTicket,
  saveInvoiceDefaults,
  updateSavedInvoiceStatus,
  exportMasterInvoicesCsv,
  addHubApp,
  toggleHubApp,
  deleteHubApp
});

(function initAdminApp() {
  try {
    window.__AQUAVAULT_ADMIN_BOOTED__ = true;
    localStorage.removeItem('aquavault_admin_vault_v1');
    localStorage.removeItem('aquavault_admin_fb_meta_v1');
    localStorage.removeItem('aquavault_admin_audit_v1');
  } catch {}

  rollMathQuiz();
  startInactivityWatchdog();
  render();
  initFirebaseSafely();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js?v=10').catch(() => {});
    });
  }
})();
