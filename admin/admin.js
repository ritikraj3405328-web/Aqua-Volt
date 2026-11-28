/* =========================================================================
   AGNI VOLT ELECTRONIC — ADMIN COMMAND CENTER
   - Zero blank screens: Renders UI synchronously before any network/SDK call
   - Strict Admin UID Lock: Exclusively authorized for UID Y8zmDKBgubWIVvhufftRPPjG7HC3
   - Zero Hardcoded Secrets or Fake PII: Resolves Firebase web config from ../firebase-config.js
     and stores Drive webhook/secret exclusively in Admin-only `adminSecrets/driveVault`
   - Dynamic Business & App Settings (`businessConfig/main`):
     * Product names, descriptions, prices, MRPs, warranty labels & features
     * Business/personal phone, WhatsApp, Google Maps, Google Rating & social links
   - Dual-Vault Customer Live Sync:
     * Writes masked phone (`98XXXXXX45`) & warranty dates to `public_units`
     * Writes full private phone/address/serial/invoice to `private_customers`
   - Smart Customer Reviews Moderation (`private_reviews` 1★–5★ vs `public_reviews` 4★–5★)
   - Automatic 30-Minute Inactivity Session Logout (1,800,000 ms watchdog)
   ========================================================================= */

const ADMIN_CONFIG_KEY = 'aquavault_admin_config_v1';
const BUSINESS_CONFIG_CACHE_KEY = 'agnivolt_business_config_cache_v11';
const PUBLIC_UNITS_CACHE_KEY = 'aquavault_public_units_cache_v11';
const PRIVATE_CUSTOMERS_CACHE_KEY = 'aquavault_private_customers_v9';
const PRIVATE_INVOICES_CACHE_KEY = 'aquavault_private_invoices_v9';
const ADMIN_THEME_KEY = 'aquavault_admin_theme_v1';
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const AUTHORIZED_ADMIN_UID = 'Y8zmDKBgubWIVvhufftRPPjG7HC3';

let runtimeFirebaseConfig = null;
let runtimeFirestoreDbId = '(default)';

const ICONS = {
  shield: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 3l7.5 3v5.5c0 4.8-3.2 8.9-7.5 10.5-4.3-1.6-7.5-5.7-7.5-10.5V6L12 3z"/><path d="M9 12l2 2 4-4"/></svg>`,
  lock: `<svg class="icon" viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/><circle cx="12" cy="16" r="1"/></svg>`,
  dashboard: `<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7.5" height="9" rx="2"/><rect x="13.5" y="3" width="7.5" height="5.5" rx="2"/><rect x="13.5" y="11.5" width="7.5" height="9.5" rx="2"/><rect x="3" y="15" width="7.5" height="6" rx="2"/></svg>`,
  settings: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  sliders: `<svg class="icon" viewBox="0 0 24 24"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.5"/><circle cx="15" cy="17" r="2.5"/></svg>`,
  devices: `<svg class="icon" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h6v6H9z"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/></svg>`,
  wrench: `<svg class="icon" viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.3-2.3 1.6-3z"/></svg>`,
  receipt: `<svg class="icon" viewBox="0 0 24 24"><path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>`,
  hub: `<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>`,
  star: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8l-5.8 3.1 1.1-6.5L2.6 9.8l6.5-.9L12 3z"/></svg>`,
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
  cloud: `<svg class="icon" viewBox="0 0 24 24"><path d="M17.5 19H7a4.5 4.5 0 0 1-.8-8.9A6 6 0 0 1 18 11a3.8 3.8 0 0 1-.5 8z"/></svg>`,
  logout: `<svg class="icon" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>`
};

const ADMIN_TABS = [
  { id: 'dashboard', label: 'Overview', icon: 'dashboard', dock: true },
  { id: 'settings', label: 'Business Settings', icon: 'settings', dock: true },
  { id: 'devices', label: 'Customer Live', icon: 'devices', dock: true },
  { id: 'invoices', label: 'Bills & Drive', icon: 'receipt', dock: true },
  { id: 'reviews', label: 'Reviews (1-5★)', icon: 'star', dock: false },
  { id: 'tickets', label: 'Service Tickets', icon: 'wrench', dock: false },
  { id: 'hub', label: 'Apps Hub', icon: 'hub', dock: false },
  { id: 'features', label: 'Features', icon: 'sliders', dock: false },
  { id: 'security', label: 'Security', icon: 'shield', dock: true }
];

const session = {
  authenticated: false,
  checkingAuth: false,
  firebaseReady: false,
  firebaseConfigLoaded: false,
  firebaseInitError: '',
  user: null,
  authView: 'login',
  authBusy: false,
  authError: '',
  authNotice: '',
  activeTab: 'dashboard',
  editingCustomerId: '',
  editingProductId: '',
  mathQuiz: { a: 3, b: 4, op: '+', answer: 7 },
  ticketFilter: 'All',
  reviewFilter: 'All',
  driveTestBusy: false,
  auditLogs: [],
  privateCustomers: [],
  privateInvoices: [],
  privateReviews: [],
  publicReviewsMap: {},
  serviceTickets: [],
  driveSecrets: {
    googleSheetWebhook: '',
    driveSyncSecret: ''
  },
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
    const mod = await import('../firebase-config.js?v=11');
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
        session.authError = verifyResult.reason || `Access Denied: Account "${sanitizeText(user.email || 'unknown', 120)}" is not authorized as AGNI VOLT ELECTRONIC Admin.`;
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
   XSS, SANITIZATION & PHONE MASKING HELPERS
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

function maskPhoneDisplay(phone) {
  const raw = String(phone || '').trim();
  if (/^([0-9]{2}X{4,10}[0-9]{2}|X{6,12}|Hidden)$/.test(raw)) return raw;
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 6) return 'Hidden';
  const maskLen = Math.min(10, Math.max(4, digits.length - 4));
  return digits.slice(0, 2) + 'X'.repeat(maskLen) + digits.slice(-2);
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

function normalizeOptionalHttpsUrl(url) {
  const trimmed = String(url || '').trim().slice(0, 500);
  if (!trimmed) return '';
  return /^https:\/\//i.test(trimmed) ? trimmed : '';
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
   DATE, BUSINESS CONFIG, ADMIN CONFIG & PRIVATE DATA HELPERS
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

function getDefaultBusinessConfig() {
  return {
    businessName: 'AGNI VOLT ELECTRONIC',
    tagline: 'Automated Water Level Controller & Smart Pump Protection',
    aboutText: 'Automated Water Level Controllers and Motorized Water Stoppers engineered by AGNI VOLT ELECTRONIC for zero tank overflow, dry-run motor safety, and long-life reliability.',
    address: 'Service & Manufacturing Unit — Configure Address in Admin Settings',
    email: '',
    gstin: '',
    businessPhone: '',
    personalPhone: '',
    whatsappNumber: '',
    googleMapsUrl: '',
    googleRating: 4.9,
    googleReviewCount: 'Verified Google Reviews',
    googleReviewLink: '',
    websiteUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    youtubeUrl: '',
    products: [
      {
        id: 'av_pro_x7',
        name: 'AgniVolt Pro-X7 Dual Tank Controller',
        hardwareType: 'Water Level Controller',
        price: 3499,
        mrp: 4499,
        warranty: '1 Year On-Site Warranty',
        badge: 'Best Seller',
        enabled: true,
        description: 'Fully automatic sump-to-overhead tank water level controller with dry-run pump cutoff and surge protection.',
        features: [
          'Automatic Motor ON at Low Tank & OFF at Full',
          'Dry-Run & High/Low Voltage Protection',
          'Corrosion-Free SS 316 Sensor Probes'
        ]
      },
      {
        id: 'av_single_s4',
        name: 'AgniVolt Smart Single-Tank Controller',
        hardwareType: 'Water Level Controller',
        price: 2299,
        mrp: 2999,
        warranty: '1 Year Warranty',
        badge: 'Home Choice',
        enabled: true,
        description: 'Compact automated water level controller built for residential overhead tanks, borewells, and submersible pumps.',
        features: [
          'Eliminates Rooftop Water Overflow Completely',
          'Auto/Manual Bypass Switch Included',
          'Supports Up to 2HP Motors'
        ]
      },
      {
        id: 'av_stopper_v2',
        name: 'AgniVolt HydroSeal Motorized Water Stopper',
        hardwareType: 'Water Stopper',
        price: 4950,
        mrp: 5999,
        warranty: '1 Year Warranty',
        badge: 'Zero Wastage',
        enabled: true,
        description: 'Heavy-duty motorized brass water stopper valve that automatically closes main supply lines when the tank fills.',
        features: [
          'Precision Motorized Brass Valve',
          'Zero Municipal Water Overflow',
          'Works Standalone or With Controller'
        ]
      }
    ]
  };
}

function loadBusinessConfig() {
  const def = getDefaultBusinessConfig();
  try {
    const raw = localStorage.getItem(BUSINESS_CONFIG_CACHE_KEY);
    if (!raw) return def;
    const parsed = JSON.parse(raw);
    const products = Array.isArray(parsed.products) && parsed.products.length ? parsed.products : def.products;
    return {
      ...def,
      ...parsed,
      googleRating: Number(parsed.googleRating) >= 1 && Number(parsed.googleRating) <= 5 ? Number(parsed.googleRating) : def.googleRating,
      products
    };
  } catch {
    return def;
  }
}

async function saveBusinessConfig(biz) {
  try {
    localStorage.setItem(BUSINESS_CONFIG_CACHE_KEY, JSON.stringify(biz));
  } catch {}

  if (!db || !fbSdk || !session.user || !session.authenticated) return false;

  const cleanProducts = (biz.products || []).slice(0, 30).map((p, idx) => ({
    id: sanitizeId(p.id || ('prod_' + idx)),
    name: sanitizeText(p.name || 'Water Level Controller', 120),
    hardwareType: p.hardwareType === 'Water Stopper' ? 'Water Stopper' : 'Water Level Controller',
    price: Math.max(0, Number(p.price) || 0),
    mrp: Math.max(0, Number(p.mrp) || 0),
    warranty: sanitizeText(p.warranty || '', 80),
    badge: sanitizeText(p.badge || '', 40),
    enabled: p.enabled !== false,
    description: sanitizeText(p.description || '', 400),
    features: Array.isArray(p.features)
      ? p.features.slice(0, 8).map(f => sanitizeText(f, 120)).filter(Boolean)
      : []
  }));

  const payload = {
    businessName: sanitizeText(biz.businessName || 'AGNI VOLT ELECTRONIC', 120),
    tagline: sanitizeText(biz.tagline || '', 200),
    aboutText: sanitizeText(biz.aboutText || '', 1200),
    address: sanitizeText(biz.address || '', 300),
    email: sanitizeText(biz.email || '', 150),
    gstin: sanitizeText(biz.gstin || '', 40),
    businessPhone: sanitizeText(biz.businessPhone || '', 30),
    personalPhone: sanitizeText(biz.personalPhone || '', 30),
    whatsappNumber: sanitizeText(biz.whatsappNumber || '', 30),
    googleMapsUrl: normalizeOptionalHttpsUrl(biz.googleMapsUrl),
    googleRating: Math.max(1, Math.min(5, Number(biz.googleRating) || 4.9)),
    googleReviewCount: sanitizeText(biz.googleReviewCount || 'Verified Google Reviews', 40),
    googleReviewLink: normalizeOptionalHttpsUrl(biz.googleReviewLink),
    websiteUrl: normalizeOptionalHttpsUrl(biz.websiteUrl),
    instagramUrl: normalizeOptionalHttpsUrl(biz.instagramUrl),
    facebookUrl: normalizeOptionalHttpsUrl(biz.facebookUrl),
    youtubeUrl: normalizeOptionalHttpsUrl(biz.youtubeUrl),
    products: cleanProducts,
    updatedByUid: session.user.uid,
    updatedAt: fbSdk.serverTimestamp()
  };

  try {
    const ref = fbSdk.doc(db, 'businessConfig', 'main');
    const snap = await fbSdk.getDoc(ref);
    if (snap.exists()) {
      await fbSdk.setDoc(ref, payload, { merge: true });
    } else {
      await fbSdk.setDoc(ref, { ...payload, createdAt: fbSdk.serverTimestamp() });
    }
    session.cloudSyncedAt = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return true;
  } catch (err) {
    console.warn('businessConfig save warning:', err?.message || err);
    return false;
  }
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
    maintenanceMessage: 'AGNI VOLT ELECTRONIC is undergoing a scheduled upgrade. Please check back shortly.',
    announcementActive: false,
    announcementText: 'Automated Water Level Controllers & Motorized Stoppers — Official Warranty & Installation Active.',
    defaultTheme: 'light',
    invoiceDefaults: {
      businessName: 'AGNI VOLT ELECTRONIC',
      businessAddress: '',
      businessPhone: '',
      businessEmail: '',
      paymentDetails: '',
      gstPercent: 18,
      palette: 'violet',
      frameStyle: 'colorful'
    },
    hubApps: [
      { id: 'sellgst_pro', name: 'SellGst-Pro Billing & GST Suite', category: 'New App', desc: 'Instant GST invoice maker, smart inventory ledger, and business billing companion.', url: 'https://ritikraj3405328-web.github.io/SellGst-Pro/', icon: 'bolt', enabled: true },
      { id: 'aquavault_portal', name: 'AGNI VOLT Customer Live Portal', category: 'Website', desc: 'Live active customer warranty showcase for AGNI VOLT ELECTRONIC Water Level Controllers.', url: 'https://ritikraj3405328-web.github.io/Aqua-Volt/', icon: 'globe', enabled: true },
      { id: 'h2', name: 'Tank Volume & Flow Estimator', category: 'Tool', desc: 'Calculate cylindrical & rectangular overhead tank capacity in liters and refill time.', url: 'https://www.google.com/search?q=water+tank+volume+calculator+liters', icon: 'gauge', enabled: true }
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

function loadPrivateCustomersList() {
  if (session.privateCustomers && session.privateCustomers.length) {
    return session.privateCustomers;
  }
  try {
    const raw = localStorage.getItem(PRIVATE_CUSTOMERS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        session.privateCustomers = parsed;
        return parsed;
      }
    }
  } catch {}
  session.privateCustomers = [];
  return session.privateCustomers;
}

function savePrivateCustomersAndSyncPublicCache(list) {
  session.privateCustomers = list;
  try {
    localStorage.setItem(PRIVATE_CUSTOMERS_CACHE_KEY, JSON.stringify(list));
    // Strictly non-sensitive public cache with maskedPhone ONLY
    const publicOnly = list.map(c => ({
      id: sanitizeId(c.id),
      customerName: sanitizeText(c.customerName, 120),
      maskedPhone: maskPhoneDisplay(c.mobileNumber),
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

  // 1. Write ONLY non-sensitive fields + maskedPhone to `public_units/{docId}`
  const publicPayload = {
    customerName: sanitizeText(record.customerName, 120),
    maskedPhone: maskPhoneDisplay(record.mobileNumber),
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
    mobileNumber: sanitizeText(record.mobileNumber || 'Not Provided', 30),
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
    invoiceNo: sanitizeText(record.invoiceNo || ('INV-AV-' + new Date().getFullYear()), 60),
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
      reason: `Access Denied: Account "${emailLabel}" (UID: ${sanitizeText(user.uid, 60)}) is not authorized. Only verified Admin UID can access AGNI VOLT ELECTRONIC Admin.`
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

    // 1. Load businessConfig/main
    try {
      const bizRef = fbSdk.doc(db, 'businessConfig', 'main');
      const bizSnap = await fbSdk.getDoc(bizRef);
      if (bizSnap.exists()) {
        const mergedBiz = { ...getDefaultBusinessConfig(), ...bizSnap.data() };
        try { localStorage.setItem(BUSINESS_CONFIG_CACHE_KEY, JSON.stringify(mergedBiz)); } catch {}
      } else {
        session.authenticated = true;
        session.user = user;
        await saveBusinessConfig(loadBusinessConfig());
      }
    } catch {}

    // 2. Load Admin-only Google Drive secrets (`adminSecrets/driveVault`)
    try {
      const secSnap = await fbSdk.getDoc(fbSdk.doc(db, 'adminSecrets', 'driveVault'));
      if (secSnap.exists()) {
        const s = secSnap.data();
        session.driveSecrets = {
          googleSheetWebhook: String(s.googleSheetWebhook || '').trim(),
          driveSyncSecret: String(s.driveSyncSecret || '').trim()
        };
      }
    } catch {}

    // 3. Load private_customers
    try {
      const custSnap = await fbSdk.getDocs(fbSdk.collection(db, 'private_customers'));
      const list = [];
      custSnap.forEach(s => list.push({ id: s.id, ...s.data() }));
      savePrivateCustomersAndSyncPublicCache(list);
    } catch {}

    // 4. Load private_invoices
    try {
      const invSnap = await fbSdk.getDocs(fbSdk.collection(db, 'private_invoices'));
      const invList = [];
      invSnap.forEach(s => invList.push({ id: s.id, ...s.data() }));
      invList.sort((a, b) => String(b.invoiceDate || '').localeCompare(String(a.invoiceDate || '')));
      session.privateInvoices = invList;
      try { localStorage.setItem(PRIVATE_INVOICES_CACHE_KEY, JSON.stringify(invList)); } catch {}
    } catch {}

    // 5. Load private_reviews (all 1–5★ + phone) & public_reviews (4–5★)
    try {
      const [privRevSnap, pubRevSnap] = await Promise.all([
        fbSdk.getDocs(fbSdk.collection(db, 'private_reviews')),
        fbSdk.getDocs(fbSdk.collection(db, 'public_reviews'))
      ]);
      const revList = [];
      privRevSnap.forEach(s => {
        const d = s.data();
        const ms = d.createdAt?.toMillis ? d.createdAt.toMillis() : Date.now();
        revList.push({ id: s.id, ...d, createdAtMs: ms });
      });
      revList.sort((a, b) => b.createdAtMs - a.createdAtMs);
      session.privateReviews = revList;

      const pubMap = {};
      pubRevSnap.forEach(s => { pubMap[s.id] = s.data(); });
      session.publicReviewsMap = pubMap;
    } catch {}

    // 6. Load private_service_requests
    try {
      const srvSnap = await fbSdk.getDocs(fbSdk.collection(db, 'private_service_requests'));
      const srvList = [];
      srvSnap.forEach(s => {
        const d = s.data();
        const ms = d.createdAt?.toMillis ? d.createdAt.toMillis() : Date.now();
        srvList.push({ id: s.id, ...d, createdAtMs: ms });
      });
      srvList.sort((a, b) => b.createdAtMs - a.createdAtMs);
      session.serviceTickets = srvList;
    } catch {}

    // 7. Load appConfig & hubApps
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
    console.warn('Firestore session load warning:', err?.message || err);
    session.cloudSyncedAt = 'UID Verified';
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
    session.authError = 'Firebase configuration missing in ../firebase-config.js.';
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
      session.authError = verifyResult.reason || `Unauthorized Account: "${email}" is not the designated Admin in firestore.rules.`;
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
      session.authError = 'Too many failed attempts. Wait a few minutes or reset your password.';
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
  showToast('Signed out of AGNI VOLT ELECTRONIC Admin');
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
  await saveBusinessConfig(loadBusinessConfig());
  await appendCloudAudit('CONFIG_UPDATED', 'Manual full Firestore sync triggered (businessConfig, appConfig, public_units, private_customers)', 'INFO');
  render();
  showToast('Synced Business Settings, Customer Live & Config to Firestore');
}

/* =========================================================================
   BUSINESS & APP SETTINGS HANDLERS (NO HARDCODING)
   ========================================================================= */
async function saveBusinessProfileSettings(e) {
  e.preventDefault();
  if (!session.authenticated || !session.user || session.user.uid !== AUTHORIZED_ADMIN_UID) {
    return showToast('Unauthorized: Verified Admin only');
  }

  const biz = loadBusinessConfig();
  biz.businessName = sanitizeText(document.getElementById('bizName')?.value || 'AGNI VOLT ELECTRONIC', 120) || 'AGNI VOLT ELECTRONIC';
  biz.tagline = sanitizeText(document.getElementById('bizTagline')?.value || '', 200);
  biz.aboutText = sanitizeText(document.getElementById('bizAbout')?.value || '', 1200);
  biz.address = sanitizeText(document.getElementById('bizAddress')?.value || '', 300);
  biz.email = sanitizeText(document.getElementById('bizEmail')?.value || '', 150);
  biz.gstin = sanitizeText(document.getElementById('bizGstin')?.value || '', 40);
  biz.businessPhone = sanitizeText(document.getElementById('bizPhone')?.value || '', 30);
  biz.personalPhone = sanitizeText(document.getElementById('bizPersonalPhone')?.value || '', 30);
  biz.whatsappNumber = sanitizeText(document.getElementById('bizWhatsapp')?.value || '', 30);
  biz.googleMapsUrl = normalizeOptionalHttpsUrl(document.getElementById('bizMapsUrl')?.value || '');
  biz.googleRating = Math.max(1, Math.min(5, Number(document.getElementById('bizGoogleRating')?.value || 4.9)));
  biz.googleReviewCount = sanitizeText(document.getElementById('bizReviewCount')?.value || 'Verified Google Reviews', 40);
  biz.googleReviewLink = normalizeOptionalHttpsUrl(document.getElementById('bizReviewLink')?.value || '');
  biz.websiteUrl = normalizeOptionalHttpsUrl(document.getElementById('bizWebsiteUrl')?.value || '');
  biz.instagramUrl = normalizeOptionalHttpsUrl(document.getElementById('bizInstagramUrl')?.value || '');
  biz.facebookUrl = normalizeOptionalHttpsUrl(document.getElementById('bizFacebookUrl')?.value || '');
  biz.youtubeUrl = normalizeOptionalHttpsUrl(document.getElementById('bizYoutubeUrl')?.value || '');

  const ok = await saveBusinessConfig(biz);
  await appendCloudAudit('SETTINGS_UPDATED', `Updated AGNI VOLT business details, phones, Google Maps & rating (${biz.googleRating}★)`, 'INFO');
  render();
  showToast(ok ? 'Business Settings published live to website!' : 'Saved locally (check Firestore connection)');
}

async function saveBusinessProduct(e) {
  e.preventDefault();
  if (!session.authenticated || !session.user || session.user.uid !== AUTHORIZED_ADMIN_UID) {
    return showToast('Unauthorized');
  }

  const name = sanitizeText(document.getElementById('prodName')?.value || '', 120);
  const hardwareType = document.getElementById('prodType')?.value === 'Water Stopper'
    ? 'Water Stopper'
    : 'Water Level Controller';
  const price = Math.max(0, Number(document.getElementById('prodPrice')?.value || 0));
  const mrp = Math.max(0, Number(document.getElementById('prodMrp')?.value || 0));
  const warranty = sanitizeText(document.getElementById('prodWarranty')?.value || '', 80);
  const badge = sanitizeText(document.getElementById('prodBadge')?.value || '', 40);
  const description = sanitizeText(document.getElementById('prodDesc')?.value || '', 400);
  const featuresRaw = String(document.getElementById('prodFeatures')?.value || '');
  const features = featuresRaw
    .split(/\r?\n|,/)
    .map(s => sanitizeText(s, 120))
    .filter(Boolean)
    .slice(0, 8);

  if (!name) return showToast('Enter Product Name');

  const biz = loadBusinessConfig();
  const list = Array.isArray(biz.products) ? [...biz.products] : [];

  if (session.editingProductId) {
    const idx = list.findIndex(p => p.id === session.editingProductId);
    const updated = {
      id: session.editingProductId,
      name,
      hardwareType,
      price,
      mrp,
      warranty,
      badge,
      enabled: idx >= 0 ? list[idx].enabled !== false : true,
      description,
      features
    };
    if (idx >= 0) list[idx] = updated;
    else list.unshift(updated);
    session.editingProductId = '';
  } else {
    list.push({
      id: 'prod_' + Date.now().toString(36),
      name,
      hardwareType,
      price,
      mrp,
      warranty,
      badge,
      enabled: true,
      description,
      features
    });
  }

  biz.products = list;
  await saveBusinessConfig(biz);
  await appendCloudAudit('SETTINGS_UPDATED', `Saved product "${name}" (${formatINR(price)})`, 'INFO');
  render();
  showToast(`Product "${name}" updated on website!`);
}

function editBusinessProduct(prodId) {
  session.editingProductId = sanitizeId(prodId);
  render();
  document.getElementById('productEditorCard')?.scrollIntoView({ behavior: 'smooth' });
}

function cancelEditBusinessProduct() {
  session.editingProductId = '';
  render();
}

async function toggleBusinessProduct(prodId) {
  const biz = loadBusinessConfig();
  const prod = (biz.products || []).find(p => p.id === prodId);
  if (!prod) return;
  prod.enabled = prod.enabled === false;
  await saveBusinessConfig(biz);
  await appendCloudAudit('SETTINGS_UPDATED', `Product "${prod.name}" ${prod.enabled ? 'shown' : 'hidden'}`, 'INFO');
  render();
  showToast(`${prod.name} is now ${prod.enabled ? 'visible' : 'hidden'}`);
}

async function deleteBusinessProduct(prodId) {
  const biz = loadBusinessConfig();
  const found = (biz.products || []).find(p => p.id === prodId);
  biz.products = (biz.products || []).filter(p => p.id !== prodId);
  await saveBusinessConfig(biz);
  await appendCloudAudit('SETTINGS_UPDATED', `Deleted product "${found ? found.name : prodId}"`, 'WARNING');
  render();
  showToast('Product removed from catalog');
}

/* =========================================================================
   ADMIN FEATURE CONTROL & DUAL-VAULT CUSTOMER LIVE CRUD
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
  const basePrice = Math.max(0, Math.min(100000000, Number(document.getElementById('newUnitPrice')?.value || 3499)));
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
      invoiceNo: (idx >= 0 && list[idx].invoiceNo) ? list[idx].invoiceNo : ('INV-AV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000))
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
      invoiceNo: 'INV-AV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000)
    };
    list.unshift(record);
  }

  savePrivateCustomersAndSyncPublicCache(list);
  await syncSingleCustomerToDualFirestoreCollections(record);
  await appendCloudAudit('WARRANTY_MODIFIED', `Synced ${customerName} (${modelName} x${quantity}, masked phone ${maskPhoneDisplay(mobileNumber)}) to Customer Live & Private Vault`, 'INFO');
  render();
  showToast(`Saved ${customerName} — Synced to Customer Live (Phone Masked)!`);
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
  showToast(extraDays === 0 ? `Marked ${unit.customerName}'s warranty Expired (auto-hidden from Active Customer Live)` : `Extended ${unit.customerName}'s warranty by +${extraDays} days`);
}

async function deleteUnit(customerId) {
  const list = [...loadPrivateCustomersList()];
  const found = list.find(u => u.id === customerId);
  const nextList = list.filter(u => u.id !== customerId);
  savePrivateCustomersAndSyncPublicCache(nextList);
  await deleteCustomerFromDualFirestoreCollections(customerId);
  await appendCloudAudit('WARRANTY_MODIFIED', `Deleted customer record ${found ? found.customerName : customerId}`, 'WARNING');
  render();
  showToast('Customer record deleted from Customer Live & Private Vault');
}

/* =========================================================================
   SMART REVIEWS MODERATION (1–5★ PRIVATE vs 4–5★ PUBLIC)
   ========================================================================= */
function setReviewFilter(f) {
  session.reviewFilter = f;
  render();
}

async function updatePrivateReviewStatus(reviewId, nextStatus) {
  const rev = session.privateReviews.find(r => r.id === reviewId);
  if (!rev) return;
  rev.status = nextStatus;
  if (db && fbSdk && session.authenticated) {
    try {
      await fbSdk.setDoc(fbSdk.doc(db, 'private_reviews', sanitizeId(reviewId)), {
        status: nextStatus
      }, { merge: true });

      if (nextStatus === 'HIDDEN' && session.publicReviewsMap[reviewId]) {
        await fbSdk.deleteDoc(fbSdk.doc(db, 'public_reviews', sanitizeId(reviewId)));
        delete session.publicReviewsMap[reviewId];
      }
    } catch (err) {
      console.warn('Review status update warning:', err?.message || err);
    }
  }
  await appendCloudAudit('REVIEW_MODERATED', `Review ${reviewId} (${rev.rating}★ by ${rev.customerName}) marked ${nextStatus}`, 'INFO');
  render();
  showToast(`Review marked ${nextStatus}`);
}

async function toggleVerifyPublicReview(reviewId) {
  const rev = session.privateReviews.find(r => r.id === reviewId);
  if (!rev || Number(rev.rating) < 4) {
    return showToast('Only 4★ and 5★ reviews can be published publicly.');
  }
  if (!db || !fbSdk || !session.authenticated) return;

  const existingPub = session.publicReviewsMap[reviewId];
  const nextVerified = existingPub ? !existingPub.verified : true;

  try {
    const pubPayload = {
      customerName: sanitizeText(rev.customerName, 100),
      rating: Number(rev.rating),
      message: sanitizeText(rev.message, 1000),
      productName: sanitizeText(rev.productName || 'Water Level Controller', 140),
      verified: nextVerified,
      createdAt: rev.createdAt || fbSdk.serverTimestamp()
    };
    await fbSdk.setDoc(fbSdk.doc(db, 'public_reviews', sanitizeId(reviewId)), pubPayload);
    session.publicReviewsMap[reviewId] = pubPayload;
    rev.status = 'REVIEWED';
    await fbSdk.setDoc(fbSdk.doc(db, 'private_reviews', sanitizeId(reviewId)), { status: 'REVIEWED' }, { merge: true });
    await appendCloudAudit('REVIEW_MODERATED', `Public 4★/5★ review ${reviewId} ${nextVerified ? 'Verified' : 'Unverified'}`, 'INFO');
    render();
    showToast(nextVerified ? 'Review marked Verified on public website!' : 'Verified badge removed');
  } catch (err) {
    showToast(`Could not update public review: ${err?.message || err}`);
  }
}

async function deleteReviewRecord(reviewId) {
  session.privateReviews = session.privateReviews.filter(r => r.id !== reviewId);
  delete session.publicReviewsMap[reviewId];
  if (db && fbSdk && session.authenticated) {
    try {
      await Promise.all([
        fbSdk.deleteDoc(fbSdk.doc(db, 'private_reviews', sanitizeId(reviewId))),
        fbSdk.deleteDoc(fbSdk.doc(db, 'public_reviews', sanitizeId(reviewId)))
      ]);
    } catch {}
  }
  await appendCloudAudit('REVIEW_MODERATED', `Deleted review ${reviewId}`, 'WARNING');
  render();
  showToast('Review deleted');
}

/* =========================================================================
   SERVICE TICKETS CONTROL (`private_service_requests`)
   ========================================================================= */
function setTicketFilter(f) {
  session.ticketFilter = f;
  render();
}

async function updateTicketStatus(ticketId, nextStatus) {
  const t = session.serviceTickets.find(x => x.id === ticketId);
  if (!t) return;
  t.status = nextStatus;
  if (db && fbSdk && session.authenticated) {
    try {
      await fbSdk.setDoc(fbSdk.doc(db, 'private_service_requests', sanitizeId(ticketId)), {
        status: nextStatus
      }, { merge: true });
    } catch (err) {
      console.warn('Ticket status update warning:', err?.message || err);
    }
  }
  await appendCloudAudit('TICKET_UPDATED', `Ticket ${t.ticketNumber || ticketId} changed to ${nextStatus}`, 'INFO');
  render();
  showToast(`Ticket ${t.ticketNumber || ticketId} marked ${nextStatus}`);
}

async function deleteTicket(ticketId) {
  const found = session.serviceTickets.find(x => x.id === ticketId);
  session.serviceTickets = session.serviceTickets.filter(x => x.id !== ticketId);
  if (db && fbSdk && session.authenticated) {
    try {
      await fbSdk.deleteDoc(fbSdk.doc(db, 'private_service_requests', sanitizeId(ticketId)));
    } catch {}
  }
  await appendCloudAudit('TICKET_UPDATED', `Deleted service ticket ${found?.ticketNumber || ticketId}`, 'WARNING');
  render();
  showToast('Service ticket deleted');
}

/* =========================================================================
   INVOICES & PERMANENT GOOGLE DRIVE SECRETS CONTROL
   ========================================================================= */
async function saveInvoiceDefaults(e) {
  e.preventDefault();
  const cfg = loadAdminConfig();
  cfg.invoiceDefaults = {
    businessName: sanitizeText(document.getElementById('invDefBizName')?.value || '', 120) || 'AGNI VOLT ELECTRONIC',
    businessAddress: sanitizeText(document.getElementById('invDefBizAddr')?.value || '', 240),
    businessPhone: sanitizeText(document.getElementById('invDefBizPhone')?.value || '', 40),
    businessEmail: sanitizeText(document.getElementById('invDefBizEmail')?.value || '', 150),
    paymentDetails: sanitizeText(document.getElementById('invDefPay')?.value || '', 240),
    gstPercent: Math.max(0, Math.min(50, Number(document.getElementById('invDefGst')?.value || 18))),
    palette: document.getElementById('invDefPalette')?.value || 'violet',
    frameStyle: document.getElementById('invDefFrame')?.value === 'classic' ? 'classic' : 'colorful'
  };

  const webhookUrl = (document.getElementById('invDefSheetUrl')?.value || '').trim().slice(0, 500);
  const syncSecret = (document.getElementById('invDefSyncSecret')?.value || '').trim().slice(0, 200);

  if (webhookUrl && !isValidHttpsUrl(webhookUrl)) {
    return showToast('Google Drive Apps Script Webhook URL must start with https://');
  }

  session.driveSecrets = {
    googleSheetWebhook: webhookUrl,
    driveSyncSecret: syncSecret
  };

  if (db && fbSdk && session.authenticated) {
    try {
      await fbSdk.setDoc(fbSdk.doc(db, 'adminSecrets', 'driveVault'), {
        googleSheetWebhook: webhookUrl,
        driveSyncSecret: syncSecret,
        updatedAt: fbSdk.serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn('adminSecrets write warning:', err?.message || err);
    }
  }

  saveAdminConfig(cfg);
  await appendCloudAudit('CONFIG_UPDATED', `Updated Invoice Studio & Admin-only Drive Vault settings (GST ${cfg.invoiceDefaults.gstPercent}%)`, 'INFO');
  render();
  showToast('Invoice defaults & Google Drive Vault saved securely!');
}

async function testGoogleDriveConnectionFromAdmin() {
  if (session.driveTestBusy) return;
  const webhookUrl = (document.getElementById('invDefSheetUrl')?.value || session.driveSecrets.googleSheetWebhook || '').trim();
  const syncSecret = (document.getElementById('invDefSyncSecret')?.value || session.driveSecrets.driveSyncSecret || '').trim();
  if (!webhookUrl || !/^https:\/\/script\.google\.com\//i.test(webhookUrl)) {
    return showToast('Enter a valid https://script.google.com/.../exec URL first');
  }
  session.driveTestBusy = true;
  render();
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'ping', syncSecret })
    });
    const json = await res.json().catch(() => null);
    if (json && json.ok) {
      showToast(`Google Drive connected! Folder: ${json.driveFolder || 'AGNI_VOLT_Permanent_Bills'}`);
    } else if (json && json.error) {
      showToast(`Drive script responded: ${json.error}`);
    } else {
      showToast('Drive script reachable! Ready for automatic PDF backups.');
    }
  } catch {
    showToast('Ping sent. Verify "Execute as: Me" & "Who has access: Anyone" on your Apps Script.');
  } finally {
    session.driveTestBusy = false;
    render();
  }
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
  const headers = ['Invoice No', 'Date', 'Due Date', 'Warranty Start', 'Warranty Expiry', 'Status', 'Customer Name', 'Mobile Number', 'Place / Address', 'Model(s)', 'Qty', 'Unit Price', 'Discount %', 'GST %', 'Grand Total', 'Google Drive Saved'];
  const rows = list.map(i => [
    i.invoiceNo, i.invoiceDate, i.dueDate, i.warrantyStartDate || '', i.warrantyExpiryDate || '', i.status, i.customerName || i.clientName, i.mobileNumber || i.clientPhone, i.address || i.clientAddress, i.modelName || '', i.quantity || 1, i.unitPrice || 0, i.discountPct || 0, i.taxPct || 18, i.grandTotal || 0, i.driveSaved ? (i.driveFileUrl || 'YES') : 'Firestore'
  ].map(cell).join(','));
  const csv = '\uFEFF' + [headers.map(cell).join(','), ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `AgniVolt-Admin-Invoices-${shiftDaysIso(0)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast(`Exported ${list.length} bill(s) to CSV`);
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
   AUTH VIEWPORT (ADMIN LOGIN + MATH QUIZ + FIREBASE FORGOT PASSWORD)
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
        <span class="shield-chip emerald">Strict Admin Lock</span>
      </div>
      <h1 class="auth-title serif">AGNI VOLT Admin Login</h1>
      <p class="auth-sub">Sign in with your verified Firebase Admin email and password. Non-admin accounts are blocked server-side by Firestore Security Rules.</p>
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
        <a href="../index.html" style="font-size:11.5px;color:var(--ink-secondary);text-decoration:none;font-weight:700;">&larr; Public Website</a>
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
          <div class="auth-emblem"><img src="../assets/app-icon.jpg" alt="AGNI VOLT ELECTRONIC" width="40" height="40" /></div>
          <div>
            <div style="font-size:15px;font-weight:800;letter-spacing:-0.02em;">AGNI VOLT ELECTRONIC</div>
            <div style="font-size:10.5px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--primary);">Admin Command Center</div>
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
function renderDashboardPanel(cfg, biz, customers, invoices, reviews, tickets, logs) {
  const activeUnits = customers.filter(u => getDaysRemaining(u.expiryDate) > 0).length;
  const lowRatingCount = reviews.filter(r => Number(r.rating) <= 3).length;
  const openTickets = tickets.filter(t => t.status !== 'Resolved').length;

  return `
    <div class="page-head" style="display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px;">
      <div>
        <div class="eyebrow">AGNI VOLT ELECTRONIC &bull; Command Center</div>
        <h1 class="page-title serif">Master Business Control</h1>
        <p class="page-desc">Manage Business &amp; Product Settings, Customer Live warranties (auto-synced with Bills), 1–5★ Customer Reviews, and Permanent Google Drive Billing.</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <a href="../invoice.html" class="btn btn-primary" style="text-decoration:none;">
          ${ic('receipt')} Generate Bill (+ Customer Live)
        </a>
        <button class="btn btn-soft" onclick="setTab('settings')">
          ${ic('settings')} Business Settings
        </button>
        <a href="../index.html" target="_blank" class="btn btn-outline" style="text-decoration:none;">
          View Live Website
        </a>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Customer Live</div>
        <div class="kpi-value mono">${activeUnits} Active</div>
        <div class="kpi-foot"><span style="color:var(--emerald);font-weight:700;">${customers.length} Total</span> &bull; Phones Masked</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Saved Bills &amp; Drive</div>
        <div class="kpi-value mono">${invoices.length}</div>
        <div class="kpi-foot">${session.driveSecrets.googleSheetWebhook ? '<span style="color:var(--emerald);font-weight:700;">Drive Connected</span>' : 'Configure Drive URL'}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Customer Reviews</div>
        <div class="kpi-value mono">${reviews.length}</div>
        <div class="kpi-foot">${lowRatingCount} Private (1–3★) &bull; ${biz.googleRating}★</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Service Tickets</div>
        <div class="kpi-value mono">${openTickets} Open</div>
        <div class="kpi-foot">${tickets.length} total requests</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head">
          <div>
            <h2 class="card-title">Instant Website Controls</h2>
            <p class="card-sub">Synced live with Firestore &amp; Public Website</p>
          </div>
          <span class="badge ${cfg.maintenanceMode ? 'badge-rose' : 'badge-emerald'}">${cfg.maintenanceMode ? 'Paused' : 'Live'}</span>
        </div>
        <div class="toggle-row">
          <div class="toggle-meta">
            <div class="toggle-name">Public Website Maintenance Mode</div>
            <div class="toggle-desc">Shows maintenance notice on public pages</div>
          </div>
          <button class="switch ${cfg.maintenanceMode ? 'on' : ''}" onclick="toggleMaintenanceMode()" aria-label="Toggle Maintenance Mode"></button>
        </div>
        <div class="toggle-row">
          <div class="toggle-meta">
            <div class="toggle-name">Top Broadcast Banner</div>
            <div class="toggle-desc">Display offers or announcements at top of website</div>
          </div>
          <button class="switch ${cfg.announcementActive ? 'on' : ''}" onclick="toggleAnnouncementActive()" aria-label="Toggle Broadcast Banner"></button>
        </div>
        <div class="toggle-row">
          <div class="toggle-meta">
            <div class="toggle-name">7-Second PWA Install Popup</div>
            <div class="toggle-desc">Auto-hiding app install prompt on mobile</div>
          </div>
          <button class="switch ${cfg.features.pwaPopup ? 'on' : ''}" onclick="toggleFeatureFlag('pwaPopup')" aria-label="Toggle PWA Popup"></button>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <h2 class="card-title">Security Audit Trail</h2>
            <p class="card-sub">Append-only Admin events</p>
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

function renderBusinessSettingsPanel(biz) {
  const products = Array.isArray(biz.products) ? biz.products : [];
  const editingProd = session.editingProductId
    ? products.find(p => p.id === session.editingProductId)
    : null;

  return `
    <div class="page-head">
      <div class="eyebrow">Dynamic Website &amp; Catalog Control (Zero Hardcoding)</div>
      <h1 class="page-title serif">Business &amp; App Settings</h1>
      <p class="page-desc">Edit your product names, descriptions, prices, phone/WhatsApp numbers, Google Maps location, Google Rating, and social links anytime. Changes publish directly to the live website and invoice studio.</p>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <h2 class="card-title">Business Identity, Contact Numbers, Google Maps &amp; Rating</h2>
          <p class="card-sub">Stored in <code>businessConfig/main</code> (Public Read, Admin-Only Write)</p>
        </div>
      </div>
      <form onsubmit="saveBusinessProfileSettings(event)">
        <div class="grid-2">
          <div class="field">
            <label>Business Name</label>
            <input id="bizName" class="input" maxlength="120" value="${esc(biz.businessName)}" required />
          </div>
          <div class="field">
            <label>Tagline</label>
            <input id="bizTagline" class="input" maxlength="200" value="${esc(biz.tagline)}" />
          </div>
        </div>

        <div class="field">
          <label>About / Hero Description</label>
          <textarea id="bizAbout" class="textarea" maxlength="1200">${esc(biz.aboutText)}</textarea>
        </div>

        <div class="grid-2">
          <div class="field">
            <label>Workshop / Office Address</label>
            <input id="bizAddress" class="input" maxlength="300" value="${esc(biz.address)}" />
          </div>
          <div class="field">
            <label>Support Email &amp; GSTIN</label>
            <div class="grid-2" style="gap:8px;">
              <input id="bizEmail" class="input" type="email" maxlength="150" value="${esc(biz.email)}" placeholder="Email" />
              <input id="bizGstin" class="input mono" maxlength="40" value="${esc(biz.gstin)}" placeholder="GSTIN" />
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label>Business Phone Number</label>
            <input id="bizPhone" class="input mono" maxlength="30" value="${esc(biz.businessPhone)}" placeholder="+91 XXXXXXXXXX" />
          </div>
          <div class="field">
            <label>Personal / Direct Phone Number</label>
            <input id="bizPersonalPhone" class="input mono" maxlength="30" value="${esc(biz.personalPhone)}" placeholder="+91 XXXXXXXXXX" />
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label>WhatsApp Number (for Order &amp; Enquiry Buttons)</label>
            <input id="bizWhatsapp" class="input mono" maxlength="30" value="${esc(biz.whatsappNumber)}" placeholder="e.g. 9198XXXXXXXX" />
          </div>
          <div class="field">
            <label>Google Maps Location Link (<code>https://...</code>)</label>
            <input id="bizMapsUrl" class="input mono" type="url" maxlength="500" value="${esc(biz.googleMapsUrl)}" placeholder="https://maps.google.com/..." />
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label>Google Star Rating (1.0 – 5.0)</label>
            <input id="bizGoogleRating" class="input mono" type="number" step="0.1" min="1" max="5" value="${esc(biz.googleRating)}" />
          </div>
          <div class="field">
            <label>Google Review Count Label</label>
            <input id="bizReviewCount" class="input" maxlength="40" value="${esc(biz.googleReviewCount)}" placeholder="e.g. 180+ Google Reviews" />
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label>Google Review Link (<code>https://...</code>)</label>
            <input id="bizReviewLink" class="input mono" type="url" maxlength="500" value="${esc(biz.googleReviewLink)}" placeholder="https://g.page/r/..." />
          </div>
          <div class="field">
            <label>Official Website Link (<code>https://...</code>)</label>
            <input id="bizWebsiteUrl" class="input mono" type="url" maxlength="500" value="${esc(biz.websiteUrl)}" placeholder="https://..." />
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label>Instagram Link (<code>https://...</code>)</label>
            <input id="bizInstagramUrl" class="input mono" type="url" maxlength="500" value="${esc(biz.instagramUrl)}" placeholder="https://instagram.com/..." />
          </div>
          <div class="field">
            <label>Facebook / YouTube Links (<code>https://...</code>)</label>
            <div class="grid-2" style="gap:8px;">
              <input id="bizFacebookUrl" class="input mono" type="url" maxlength="500" value="${esc(biz.facebookUrl)}" placeholder="Facebook URL" />
              <input id="bizYoutubeUrl" class="input mono" type="url" maxlength="500" value="${esc(biz.youtubeUrl)}" placeholder="YouTube URL" />
            </div>
          </div>
        </div>

        <button type="submit" class="btn btn-primary">${ic('check')} Save &amp; Publish Business Settings</button>
      </form>
    </div>

    <div id="productEditorCard" class="card">
      <div class="card-head">
        <div>
          <h2 class="card-title">${editingProd ? `Edit Product: ${esc(editingProd.name)}` : 'Add / Edit Product Catalog'}</h2>
          <p class="card-sub">Products appear dynamically on the homepage, Products page, and Invoice quick-pick</p>
        </div>
        ${editingProd ? `<button type="button" class="btn btn-sm btn-outline" onclick="cancelEditBusinessProduct()">Cancel Edit</button>` : ''}
      </div>

      <form onsubmit="saveBusinessProduct(event)">
        <div class="grid-2">
          <div class="field">
            <label>Product Name</label>
            <input id="prodName" class="input" maxlength="120" value="${esc(editingProd ? editingProd.name : '')}" placeholder="e.g. AgniVolt Pro-X7 Dual Tank Controller" required />
          </div>
          <div class="field">
            <label>Category</label>
            <select id="prodType" class="select">
              <option value="Water Level Controller" ${editingProd && editingProd.hardwareType === 'Water Level Controller' ? 'selected' : ''}>Water Level Controller</option>
              <option value="Water Stopper" ${editingProd && editingProd.hardwareType === 'Water Stopper' ? 'selected' : ''}>Water Stopper</option>
            </select>
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label>Selling Price (INR)</label>
            <input id="prodPrice" class="input mono" type="number" min="0" value="${editingProd ? editingProd.price : 3499}" required />
          </div>
          <div class="field">
            <label>MRP (INR — Optional Strikethrough)</label>
            <input id="prodMrp" class="input mono" type="number" min="0" value="${editingProd ? editingProd.mrp : 4499}" />
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label>Warranty Label</label>
            <input id="prodWarranty" class="input" maxlength="80" value="${esc(editingProd ? editingProd.warranty : '1 Year Warranty')}" placeholder="e.g. 1 Year On-Site Warranty" />
          </div>
          <div class="field">
            <label>Highlight Badge</label>
            <input id="prodBadge" class="input" maxlength="40" value="${esc(editingProd ? editingProd.badge : '')}" placeholder="e.g. Best Seller" />
          </div>
        </div>

        <div class="field">
          <label>Product Description</label>
          <textarea id="prodDesc" class="textarea" maxlength="400" placeholder="Short description of features and compatibility">${esc(editingProd ? editingProd.description : '')}</textarea>
        </div>

        <div class="field">
          <label>Key Bullet Features (one per line or comma-separated)</label>
          <textarea id="prodFeatures" class="textarea" placeholder="Auto Motor ON/OFF&#10;Dry-Run Protection&#10;SS 316 Sensor Probes">${esc(editingProd && Array.isArray(editingProd.features) ? editingProd.features.join('\n') : '')}</textarea>
        </div>

        <button type="submit" class="btn btn-primary">${ic('plus')} ${editingProd ? 'Update Product' : 'Add Product to Live Catalog'}</button>
      </form>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <h2 class="card-title">Live Product Catalog (${products.length})</h2>
          <p class="card-sub">Edit prices, hide models, or add new controllers anytime</p>
        </div>
      </div>
      ${products.map(p => {
        const safeId = sanitizeId(p.id);
        return `
          <div class="item-row">
            <div class="item-top">
              <div>
                <div style="font-size:15px;font-weight:800;">
                  ${esc(p.name)}
                  <span class="badge badge-purple" style="margin-left:6px;">${esc(p.hardwareType || 'Water Level Controller')}</span>
                  ${p.badge ? `<span class="badge badge-emerald" style="margin-left:4px;">${esc(p.badge)}</span>` : ''}
                </div>
                <div style="font-size:13px;font-weight:700;color:var(--ink-secondary);margin-top:3px;">
                  <span class="mono">${formatINR(p.price || 0)}</span>
                  ${Number(p.mrp) > Number(p.price) ? `<span class="mono" style="text-decoration:line-through;opacity:0.65;margin-left:6px;">${formatINR(p.mrp)}</span>` : ''}
                  ${p.warranty ? ` &middot; ${esc(p.warranty)}` : ''}
                </div>
                <div style="font-size:12px;color:var(--ink-tertiary);margin-top:3px;">${esc(p.description || '')}</div>
              </div>
              <span class="badge ${p.enabled !== false ? 'badge-emerald' : 'badge-rose'}">${p.enabled !== false ? 'Visible' : 'Hidden'}</span>
            </div>
            <div class="item-actions">
              <button class="btn btn-sm btn-soft" onclick="editBusinessProduct('${safeId}')">Edit Price &amp; Info</button>
              <button class="btn btn-sm btn-outline" onclick="toggleBusinessProduct('${safeId}')">${p.enabled !== false ? 'Hide' : 'Show'}</button>
              <button class="btn btn-sm btn-danger" onclick="deleteBusinessProduct('${safeId}')">${ic('trash')} Delete</button>
            </div>
          </div>
        `;
      }).join('') || '<div style="font-size:13px;color:var(--ink-tertiary);">No products added yet.</div>'}
    </div>
  `;
}

function renderFeaturesPanel(cfg) {
  const featureRows = [
    ['warranty', 'Public Customer Live Warranty Directory', 'Controls live active warranty showcase on index.html'],
    ['hub', 'Apps Hub Ecosystem Cards', 'Controls visibility of hub.html and embedded Apps Hub'],
    ['devices', 'Products & Service Booking Page', 'Controls visibility of devices.html and service request form'],
    ['invoice', 'Admin-Only Bill Generator & Drive Sync', 'Controls invoice.html Admin billing studio'],
    ['privacy', 'DPDP Privacy & Anti-Scraping Notice', 'Controls visibility of privacy.html'],
    ['pwaPopup', '7-Second Auto-Hiding PWA Install Popup', 'Controls the top mobile install prompt popup']
  ];

  return `
    <div class="page-head">
      <div class="eyebrow">Master Feature Matrix</div>
      <h1 class="page-title serif">Feature Switches &amp; Broadcast</h1>
      <p class="page-desc">Enable or disable modules, configure maintenance notices, and broadcast top announcements.</p>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head">
          <div>
            <h2 class="card-title">Module Switches</h2>
            <p class="card-sub">Instant cloud-synced visibility controls</p>
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
      <div class="eyebrow">Dual-Vault Customer Live Control</div>
      <h1 class="page-title serif">Customer Live &amp; Warranty Vault</h1>
      <p class="page-desc">
        Customers added here (or auto-synced when you generate a Bill) appear in public <strong>Customer Live</strong> with masked phone numbers (e.g. <code>98XXXXXX45</code>) and auto-hide once expired. Full numbers &amp; addresses stay strictly inside Admin-only <code>private_customers</code>.
      </p>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <h2 class="card-title">${editing ? `Edit Customer: ${esc(editing.customerName)}` : 'Register Customer & Activate Customer Live'}</h2>
          <p class="card-sub">Automatically masks phone in <code>public_units</code> and locks full contact in <code>private_customers</code></p>
        </div>
        ${editing ? `<button type="button" class="btn btn-sm btn-outline" onclick="cancelEditCustomerRecord()">Cancel Edit</button>` : ''}
      </div>
      <form onsubmit="saveCustomerWarrantyRecord(event)">
        <div class="grid-2">
          <div class="field">
            <label>Customer Full Name</label>
            <input id="newCustName" class="input" maxlength="120" value="${esc(editing ? editing.customerName : '')}" placeholder="Customer full name" required />
          </div>
          <div class="field">
            <label>Customer Mobile Number (Masked publicly, Full in Admin only)</label>
            <input id="newCustMobile" class="input mono" maxlength="30" value="${esc(editing ? editing.mobileNumber : '')}" placeholder="+91 98XXXXXXXX" required />
          </div>
        </div>

        <div class="field">
          <label>Customer Location / Place / Address (Private — Admin Only)</label>
          <input id="newCustAddress" class="input" maxlength="250" value="${esc(editing ? editing.address : '')}" placeholder="Area, City, PIN" required />
        </div>

        <div class="grid-2">
          <div class="field">
            <label>Product Model Name</label>
            <input id="newUnitModel" class="input" maxlength="140" value="${esc(editing ? editing.modelName : '')}" placeholder="e.g. AgniVolt Pro-X7 Dual Tank Controller" required />
          </div>
          <div class="field">
            <label>Hardware Type</label>
            <select id="newUnitType" class="select">
              <option value="Water Level Controller" ${editing && editing.hardwareType === 'Water Level Controller' ? 'selected' : ''}>Water Level Controller</option>
              <option value="Water Stopper" ${editing && editing.hardwareType === 'Water Stopper' ? 'selected' : ''}>Water Stopper</option>
            </select>
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label>Quantity Installed</label>
            <input id="newUnitQty" class="input mono" type="number" min="1" max="1000" value="${editing ? (editing.quantity || 1) : 1}" required />
          </div>
          <div class="field">
            <label>Warranty Start Date</label>
            <input id="newUnitInstallDate" class="input mono" type="date" value="${esc(editing ? editing.installDate : shiftDaysIso(0))}" required />
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label>Warranty Coverage (Days — 0 Marks Expired)</label>
            <input id="newUnitDays" class="input mono" type="number" value="${editing ? editing.warrantyDays : 365}" min="0" max="3650" required />
          </div>
          <div class="field">
            <label>Unit Price (INR — Private Only)</label>
            <input id="newUnitPrice" class="input mono" type="number" value="${editing ? editing.basePrice : 3499}" min="0" max="100000000" required />
          </div>
        </div>

        <div class="field">
          <label>Hardware Serial Number (Private Only)</label>
          <input id="newUnitSerial" class="input mono" maxlength="80" value="${esc(editing ? editing.serialNumber : '')}" placeholder="Auto-generated if left blank" />
        </div>

        <button type="submit" class="btn btn-primary">
          ${ic('check')} ${editing ? 'Update Customer & Sync Vaults' : 'Add Customer & Activate Live Warranty'}
        </button>
      </form>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <h2 class="card-title">Registered Customers (${customers.length})</h2>
          <p class="card-sub">Active warranties show in public Customer Live; expired warranties auto-hide from Active view</p>
        </div>
        <a href="../invoice.html" class="btn btn-sm btn-primary" style="text-decoration:none;">
          ${ic('receipt')} Create New Bill
        </a>
      </div>
      ${customers.map(u => {
        const rem = getDaysRemaining(u.expiryDate);
        const badge = rem === 0 ? 'badge-rose' : rem <= 45 ? 'badge-amber' : 'badge-emerald';
        const label = rem === 0 ? 'Expired (Auto-Hidden)' : `${rem} Days Left`;
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
                  [PRIVATE] ${esc(u.mobileNumber)} (Public: ${esc(maskPhoneDisplay(u.mobileNumber))}) &middot; ${esc(u.address)}
                </div>
                <div style="font-size:11.5px;color:var(--ink-tertiary);margin-top:3px;">
                  Start: <span class="mono">${esc(u.installDate)}</span> &middot; Expiry: <span class="mono">${esc(u.expiryDate)}</span> &middot; Bill: <span class="mono">${esc(u.invoiceNo || '—')}</span>
                </div>
              </div>
              <span class="badge ${badge}">${label}</span>
            </div>
            <div class="item-actions">
              <a href="../invoice.html?customerId=${safeId}" class="btn btn-sm btn-primary" style="text-decoration:none;">${ic('receipt')} Generate Bill</a>
              <button class="btn btn-sm btn-soft" onclick="editCustomerRecord('${safeId}')">Edit</button>
              <button class="btn btn-sm btn-emerald" onclick="extendUnitWarranty('${safeId}', 365)">+1 Year</button>
              <button class="btn btn-sm btn-outline" onclick="extendUnitWarranty('${safeId}', 0)">Mark Expired</button>
              <button class="btn btn-sm btn-danger" onclick="deleteUnit('${safeId}')">${ic('trash')} Delete</button>
            </div>
          </div>
        `;
      }).join('') || '<div style="font-size:13px;color:var(--ink-tertiary);">No customers registered yet. Generate a Bill or add a customer above to populate Customer Live.</div>'}
    </div>
  `;
}

function renderReviewsPanel(reviews) {
  const filters = [
    ['All', `All (${reviews.length})`],
    ['Private', `1★–3★ Private (${reviews.filter(r => Number(r.rating) <= 3).length})`],
    ['Public', `4★–5★ Public (${reviews.filter(r => Number(r.rating) >= 4).length})`]
  ];

  const filtered = reviews.filter(r => {
    const rating = Number(r.rating) || 0;
    if (session.reviewFilter === 'Private') return rating <= 3;
    if (session.reviewFilter === 'Public') return rating >= 4;
    return true;
  });

  return `
    <div class="page-head">
      <div class="eyebrow">Smart 4★ &amp; 5★ Review Filter</div>
      <h1 class="page-title serif">Customer Reviews &amp; Private Feedback</h1>
      <p class="page-desc">All submitted reviews (1★ to 5★) with customer phone numbers are saved in Admin-only <code>private_reviews</code>. Only 4★ &amp; 5★ reviews appear publicly on the website.</p>
    </div>

    <div class="card">
      <div class="card-head">
        <h2 class="card-title">All Customer Submissions (${filtered.length})</h2>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${filters.map(([key, label]) => `
            <button class="btn btn-sm ${session.reviewFilter === key ? 'btn-primary' : 'btn-outline'}" onclick="setReviewFilter('${key}')">${label}</button>
          `).join('')}
        </div>
      </div>

      ${filtered.map(r => {
        const rating = Number(r.rating) || 0;
        const isHigh = rating >= 4;
        const pubData = session.publicReviewsMap[r.id];
        const isVerified = Boolean(pubData && pubData.verified);
        const safeId = sanitizeId(r.id);
        return `
          <div class="item-row">
            <div class="item-top">
              <div>
                <div style="font-size:15px;font-weight:800;">
                  ${esc(r.customerName)}
                  <span class="badge ${isHigh ? 'badge-emerald' : 'badge-amber'} mono" style="margin-left:6px;">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5)</span>
                  <span class="badge ${isHigh && pubData ? 'badge-purple' : 'badge-rose'}" style="margin-left:4px;">
                    ${isHigh && pubData ? (isVerified ? 'Public & Verified' : 'Public (4★/5★)') : 'Private Admin Only'}
                  </span>
                </div>
                <div class="mono" style="font-size:12px;color:var(--primary);margin-top:3px;">
                  [PRIVATE PHONE] ${esc(r.phoneNumber || '—')} &middot; Model: ${esc(r.productName || 'Water Level Controller')}
                </div>
                <div style="font-size:13px;color:var(--ink);margin-top:6px;line-height:1.45;">
                  "${esc(r.message)}"
                </div>
              </div>
              <span class="badge badge-purple">${esc(r.status || 'SUBMITTED')}</span>
            </div>
            <div class="item-actions">
              ${isHigh ? `
                <button class="btn btn-sm btn-emerald" onclick="toggleVerifyPublicReview('${safeId}')">
                  ${ic('check')} ${isVerified ? 'Unverify' : (pubData ? 'Verify Public Review' : 'Publish to Website')}
                </button>
                <button class="btn btn-sm btn-outline" onclick="updatePrivateReviewStatus('${safeId}', 'HIDDEN')">Hide from Public</button>
              ` : `
                <button class="btn btn-sm btn-soft" onclick="updatePrivateReviewStatus('${safeId}', 'REVIEWED')">Mark Reviewed</button>
                <button class="btn btn-sm btn-emerald" onclick="updatePrivateReviewStatus('${safeId}', 'RESOLVED')">${ic('check')} Mark Resolved</button>
              `}
              <button class="btn btn-sm btn-danger" onclick="deleteReviewRecord('${safeId}')">${ic('trash')} Delete</button>
            </div>
          </div>
        `;
      }).join('') || '<div style="font-size:13px;color:var(--ink-tertiary);">No customer reviews submitted yet.</div>'}
    </div>
  `;
}

function renderTicketsPanel(tickets) {
  const filters = ['All', 'Logged', 'Scheduled', 'Resolved'];
  const list = tickets.filter(t => session.ticketFilter === 'All' || t.status === session.ticketFilter);

  return `
    <div class="page-head">
      <div class="eyebrow">Service Operations</div>
      <h1 class="page-title serif">Service Tickets Control</h1>
      <p class="page-desc">Review customer installation &amp; inspection requests from <code>private_service_requests</code> (Admin-only read).</p>
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
                <div style="font-size:14px;font-weight:800;"><span class="mono" style="color:var(--primary);">${esc(t.ticketNumber || t.id)}</span> &middot; ${esc(t.issue)}</div>
                <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">${esc(t.unitName)}</div>
                ${t.contactPhone ? `<div class="mono" style="font-size:11.5px;color:var(--primary);margin-top:2px;">[PRIVATE PHONE] ${esc(t.contactPhone)}</div>` : ''}
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
      }).join('') || '<div style="font-size:13px;color:var(--ink-tertiary);">No service tickets in this queue.</div>'}
    </div>
  `;
}

function renderInvoicesPanel(cfg, biz, savedInvoices) {
  const d = cfg.invoiceDefaults;
  return `
    <div class="page-head" style="display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px;">
      <div>
        <div class="eyebrow">Admin-Only Billing &amp; Permanent Google Drive Vault</div>
        <h1 class="page-title serif">Invoice Studio &amp; Google Drive Backup</h1>
        <p class="page-desc">Configure your <code>Code.gs</code> Google Drive Web App URL (stored strictly in Admin-only <code>adminSecrets/driveVault</code>) so every generated bill permanently saves to your Google Drive folder <code>AGNI_VOLT_Permanent_Bills</code>.</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <a href="../invoice.html" class="btn btn-primary" style="text-decoration:none;">
          ${ic('receipt')} Open Bill Generator
        </a>
        <button type="button" class="btn btn-soft" onclick="copyGoogleDriveAppsScript()">
          ${ic('check')} Copy Code.gs
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <h2 class="card-title">Permanent Google Drive Backup &amp; Invoice Defaults</h2>
          <p class="card-sub">Webhook URL &amp; secret are encrypted in transit and locked to your Admin UID in <code>adminSecrets/driveVault</code></p>
        </div>
        <span class="badge badge-emerald">Admin-Only Secret Vault</span>
      </div>
      <form onsubmit="saveInvoiceDefaults(event)">
        <div class="grid-2">
          <div class="field">
            <label>Billing Business Name</label>
            <input id="invDefBizName" class="input" maxlength="120" value="${esc(d.businessName || biz.businessName)}" required />
          </div>
          <div class="field">
            <label>Billing Phone</label>
            <input id="invDefBizPhone" class="input" maxlength="40" value="${esc(d.businessPhone || biz.businessPhone)}" />
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <label>Billing Email</label>
            <input id="invDefBizEmail" class="input" maxlength="150" value="${esc(d.businessEmail || biz.email)}" />
          </div>
          <div class="field">
            <label>Default GST / Tax %</label>
            <input id="invDefGst" class="input mono" type="number" step="0.5" min="0" max="50" value="${esc(d.gstPercent)}" />
          </div>
        </div>
        <div class="field">
          <label>Billing Address</label>
          <input id="invDefBizAddr" class="input" maxlength="240" value="${esc(d.businessAddress || biz.address)}" />
        </div>
        <div class="field">
          <label>Bank / UPI Payment Instructions</label>
          <input id="invDefPay" class="input" maxlength="240" value="${esc(d.paymentDetails)}" placeholder="UPI ID / Bank Account / IFSC" />
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
        <div class="grid-2">
          <div class="field">
            <label>Google Apps Script Web App URL (<code>Code.gs</code> /exec URL)</label>
            <input id="invDefSheetUrl" class="input mono" type="url" maxlength="500" value="${esc(session.driveSecrets.googleSheetWebhook || '')}" placeholder="https://script.google.com/macros/s/.../exec" />
          </div>
          <div class="field">
            <label>Optional Drive Sync Secret (Matches <code>DRIVE_SYNC_SECRET</code>)</label>
            <input id="invDefSyncSecret" class="input mono" type="password" maxlength="200" value="${esc(session.driveSecrets.driveSyncSecret || '')}" placeholder="Optional private passphrase" />
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          <button type="submit" class="btn btn-primary">${ic('check')} Save Drive Vault &amp; Defaults</button>
          <button type="button" class="btn btn-soft" onclick="testGoogleDriveConnectionFromAdmin()" ${session.driveTestBusy ? 'disabled' : ''}>
            ${ic('cloud')} ${session.driveTestBusy ? 'Testing Drive...' : 'Test Google Drive Connection'}
          </button>
        </div>
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
        const driveHref = isValidHttpsUrl(inv.driveFileUrl) ? inv.driveFileUrl : '';
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
                Model: ${esc(inv.modelName || 'AgniVolt Controller')} (Qty: ${inv.quantity || 1}) &middot; Date: <span class="mono">${esc(inv.invoiceDate)}</span>
                ${inv.warrantyExpiryDate ? ` &middot; Warranty Until: <span class="mono">${esc(inv.warrantyExpiryDate)}</span>` : ''}
              </div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
              <span class="badge ${inv.status === 'PAID' ? 'badge-emerald' : inv.status === 'OVERDUE' ? 'badge-rose' : 'badge-amber'}">${esc(inv.status)}</span>
              <span class="badge badge-purple" style="font-size:10px;">${inv.driveSaved ? 'Google Drive Saved' : 'Firestore Vault'}</span>
            </div>
          </div>
          <div class="item-actions">
            ${driveHref ? `<a href="${esc(driveHref)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-soft" style="text-decoration:none;">Open Drive PDF</a>` : ''}
            <button class="btn btn-sm btn-emerald" onclick="updateSavedInvoiceStatus('${safeId}', 'PAID')">Mark PAID</button>
            <button class="btn btn-sm btn-outline" onclick="updateSavedInvoiceStatus('${safeId}', 'PENDING')">Pending</button>
            <button class="btn btn-sm btn-danger" onclick="updateSavedInvoiceStatus('${safeId}', 'OVERDUE')">Overdue</button>
          </div>
        </div>
      `;
      }).join('') || '<div style="font-size:13px;color:var(--ink-tertiary);">No bills generated yet. Click "Open Bill Generator" above to create &amp; archive your first bill.</div>'}
    </div>
  `;
}

function renderHubPanel(cfg) {
  return `
    <div class="page-head">
      <div class="eyebrow">Ecosystem Directory</div>
      <h1 class="page-title serif">Apps Hub Control</h1>
      <p class="page-desc">Add, hide, or remove companion websites, apps, and tools shown on <code>index.html</code> and <code>hub.html</code> (strict HTTPS-only URL guard).</p>
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
        <button type="submit" class="btn btn-primary">${ic('plus')} Publish to Website &amp; Apps Hub</button>
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
      <div class="eyebrow">Zero-Trust Firebase Security</div>
      <h1 class="page-title serif">Firebase Security &amp; Audit</h1>
      <p class="page-desc">All Admin writes and private collections (<code>private_customers</code>, <code>private_invoices</code>, <code>private_reviews</code>, <code>private_service_requests</code>, <code>adminSecrets</code>) are locked exclusively to verified Admin UID <code>${AUTHORIZED_ADMIN_UID}</code>.</p>
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
          <h2 class="card-title">Anti-Scraping Firestore Rules &amp; Google Drive Script</h2>
          <p class="card-sub">Copy <code>firestore.rules</code> or <code>Code.gs</code> in 1 click</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn btn-sm btn-emerald" onclick="copyFirestoreRulesToClipboard()">${ic('check')} Copy firestore.rules</button>
          <button type="button" class="btn btn-sm btn-soft" onclick="copyGoogleDriveAppsScript()">${ic('check')} Copy Code.gs (Drive Saver)</button>
        </div>
      </div>
      <div class="security-shield-row" style="margin-bottom:0;">
        <span class="shield-chip emerald">Admin UID Locked</span>
        <span class="shield-chip emerald">public_units: Masked Phones Only</span>
        <span class="shield-chip emerald">public_reviews: 4★ &amp; 5★ Only</span>
        <span class="shield-chip emerald">adminSecrets: Admin-Only</span>
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
  const biz = loadBusinessConfig();
  const customers = loadPrivateCustomersList();
  const invoices = loadPrivateInvoicesList();
  const reviews = session.privateReviews || [];
  const tickets = session.serviceTickets || [];
  const logs = session.auditLogs;
  const user = session.user || {};
  const isDark = getTheme() === 'dark';

  let contentHtml = '';
  switch (session.activeTab) {
    case 'settings': contentHtml = renderBusinessSettingsPanel(biz); break;
    case 'features': contentHtml = renderFeaturesPanel(cfg); break;
    case 'devices': contentHtml = renderDevicesPanel(customers); break;
    case 'reviews': contentHtml = renderReviewsPanel(reviews); break;
    case 'tickets': contentHtml = renderTicketsPanel(tickets); break;
    case 'invoices': contentHtml = renderInvoicesPanel(cfg, biz, invoices); break;
    case 'hub': contentHtml = renderHubPanel(cfg); break;
    case 'security': contentHtml = renderSecurityPanel(logs); break;
    default: contentHtml = renderDashboardPanel(cfg, biz, customers, invoices, reviews, tickets, logs); break;
  }

  return `
    <div class="admin-shell">
      <aside class="admin-sidebar">
        <div class="auth-brand" style="padding:2px 8px 16px;border-bottom:1px solid var(--border);">
          <div class="auth-emblem"><img src="../assets/app-icon.jpg" alt="AGNI VOLT ELECTRONIC" width="40" height="40" /></div>
          <div style="min-width:0;">
            <div style="font-size:15px;font-weight:800;letter-spacing:-0.02em;">AGNI VOLT Admin</div>
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
            ${ic('receipt')} <span>Bill Studio (+Live)</span>
          </a>
          <a href="../index.html" class="nav-item-btn" style="text-decoration:none;color:var(--ink-secondary);">
            ${ic('shield')} <span>Live Website</span>
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
              <div class="topbar-brand">AGNI VOLT Admin</div>
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
      showToast('Copied firestore.rules to clipboard!');
      return;
    }
  } catch {}
  showToast('Open firestore.rules in project root');
}

async function copyGoogleDriveAppsScript() {
  try {
    const res = await fetch('../Code.gs?v=' + Date.now(), { cache: 'no-store' });
    const txt = res.ok ? await res.text() : '';
    if (txt && navigator.clipboard) {
      await navigator.clipboard.writeText(txt);
      showToast('Copied Code.gs (AGNI_VOLT_Permanent_Bills) to clipboard!');
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
  saveBusinessProfileSettings,
  saveBusinessProduct,
  editBusinessProduct,
  cancelEditBusinessProduct,
  toggleBusinessProduct,
  deleteBusinessProduct,
  saveCustomerWarrantyRecord,
  editCustomerRecord,
  cancelEditCustomerRecord,
  extendUnitWarranty,
  deleteUnit,
  setReviewFilter,
  updatePrivateReviewStatus,
  toggleVerifyPublicReview,
  deleteReviewRecord,
  setTicketFilter,
  updateTicketStatus,
  deleteTicket,
  saveInvoiceDefaults,
  testGoogleDriveConnectionFromAdmin,
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
      navigator.serviceWorker.register('./sw.js?v=11').catch(() => {});
    });
  }
})();
