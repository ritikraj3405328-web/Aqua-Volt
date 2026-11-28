/* =========================================================================
   AQUAVAULT — NO-LOGIN PUBLIC TRUST LANDING PAGE, WARRANTY DIRECTORY & HUB
   - Zero blank screens: Renders UI immediately before any async Firebase call
   - Strict Public vs. Private Separation: Public pages read ONLY non-sensitive
     `public_units`, `appConfig`, and `hubApps` from Firestore (NEVER loads or
     displays customer phone numbers, addresses, or private bills)
   - Live Public Customer Warranty Directory with Search, Hardware Filter,
     Quantity badge, and exact "X Days Left" or red "Expired" ("This person's
     warranty has expired") status without ever deleting expired records
   - Merged Live Decreasing Warranty Trajectory & Interactive Ring on index.html
   - Embedded AquaVault Ecosystem / Apps Hub (including SellGst-Pro) on index.html
     and synced with hub.html
   - 1-Click "Share Page" button at top using Web Share API + Clipboard fallback
   - Admin-Only Guard on invoice.html (UID: Y8zmDKBgubWIVvhufftRPPjG7HC3)
   ========================================================================= */

const STORAGE_KEY = 'aquavault_luxury_state_v2';
const ADMIN_CONFIG_KEY = 'aquavault_admin_config_v1';
const PUBLIC_UNITS_CACHE_KEY = 'aquavault_public_units_cache_v9';
const PWA_POPUP_SEEN_KEY = 'aquavault_pwa_popup_seen_v3';
const AUTHORIZED_ADMIN_UID = 'Y8zmDKBgubWIVvhufftRPPjG7HC3';

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyC-yKE9dRoZBu5yROBD2afoB0vQjoG_1Gs",
  authDomain: "aqua-vault.firebaseapp.com",
  projectId: "aqua-vault",
  storageBucket: "aqua-vault.firebasestorage.app",
  messagingSenderId: "35562578382",
  appId: "1:35562578382:web:766ed7d52adea3293b8b9f"
};

/* Clean Navigation Routes — ZERO references to deleted calculator.html, notes.html, or warranty.html */
const ROUTES = [
  { id: 'home', href: 'index.html', label: 'Warranty & Trust', shortLabel: 'Home', icon: 'home', dock: true },
  { id: 'hub', href: 'hub.html', label: 'Apps Hub', shortLabel: 'Apps Hub', icon: 'grid', dock: true },
  { id: 'devices', href: 'devices.html', label: 'Models & Service', shortLabel: 'Models', icon: 'cpu', dock: true },
  { id: 'privacy', href: 'privacy.html', label: 'DPDP Privacy', shortLabel: 'Privacy', icon: 'lock', dock: true }
];

const ICONS = {
  home: `<svg class="icon" viewBox="0 0 24 24"><path d="M3 10.5L12 3l9 7.5"/><path d="M5.5 9v11h13V9"/><path d="M9.5 20v-6h5v6"/></svg>`,
  shield: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 3l7.5 3v5.5c0 4.8-3.2 8.9-7.5 10.5-4.3-1.6-7.5-5.7-7.5-10.5V6L12 3z"/><path d="M9 12l2 2 4-4"/></svg>`,
  cpu: `<svg class="icon" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h6v6H9z"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/></svg>`,
  receipt: `<svg class="icon" viewBox="0 0 24 24"><path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>`,
  grid: `<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>`,
  lock: `<svg class="icon" viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/><circle cx="12" cy="16" r="1"/></svg>`,
  sun: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>`,
  moon: `<svg class="icon" viewBox="0 0 24 24"><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a6.5 6.5 0 0 0 11 11z"/></svg>`,
  droplet: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 2.8c3.6 4.4 6.5 8.1 6.5 11.7a6.5 6.5 0 1 1-13 0c0-3.6 2.9-7.3 6.5-11.7z"/></svg>`,
  wrench: `<svg class="icon" viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.3-2.3 1.6-3z"/></svg>`,
  download: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 4v11"/><path d="M8 11l4 4 4-4"/><path d="M4 19h16"/></svg>`,
  external: `<svg class="icon" viewBox="0 0 24 24"><path d="M14 4h6v6"/><path d="M10 14L20 4"/><path d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/></svg>`,
  share: `<svg class="icon" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>`,
  check: `<svg class="icon" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>`,
  plus: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`,
  trash: `<svg class="icon" viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/></svg>`,
  search: `<svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>`,
  cloud: `<svg class="icon" viewBox="0 0 24 24"><path d="M17.5 19H7a4.5 4.5 0 0 1-.8-8.9A6 6 0 0 1 18 11a3.8 3.8 0 0 1-.5 8z"/></svg>`,
  globe: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/></svg>`,
  bolt: `<svg class="icon" viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>`,
  activity: `<svg class="icon" viewBox="0 0 24 24"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>`,
  gauge: `<svg class="icon" viewBox="0 0 24 24"><path d="M4.5 16.5a8 8 0 1 1 15 0"/><path d="M12 12l4-4"/><circle cx="12" cy="13" r="1.5"/></svg>`
};

function getDefaultHubApps() {
  return [
    {
      id: 'sellgst_pro',
      name: 'SellGst-Pro Billing & GST Suite',
      category: 'New App',
      desc: 'Instant GST invoice maker, smart inventory ledger, and business billing companion.',
      url: 'https://ritikraj3405328-web.github.io/SellGst-Pro/',
      icon: 'bolt',
      enabled: true
    },
    {
      id: 'aquavault_portal',
      name: 'AquaVault Smart Trust Portal',
      category: 'Website',
      desc: 'Live public customer warranty tracker for Smart Water Level Controllers & Water Stoppers.',
      url: 'https://ritikraj3405328-web.github.io/Aqua-Volt/',
      icon: 'globe',
      enabled: true
    },
    {
      id: 'h1',
      name: 'AquaVault Hardware Catalog',
      category: 'Website',
      desc: 'Explore flagship dual-tank controllers, brass motorized water stoppers, and stainless probe kits.',
      url: 'https://www.google.com/search?q=smart+water+level+controller+india',
      icon: 'cpu',
      enabled: true
    },
    {
      id: 'h2',
      name: 'Tank Volume & Flow Estimator',
      category: 'Tool',
      desc: 'Calculate cylindrical & rectangular overhead tank capacity in liters and pump refill time.',
      url: 'https://www.google.com/search?q=water+tank+volume+calculator+liters',
      icon: 'gauge',
      enabled: true
    },
    {
      id: 'h3',
      name: 'Solar Pump Auto-Sync Guide',
      category: 'Tool',
      desc: 'Smart daylight pump scheduling reference for rooftop solar and borewell setups.',
      url: 'https://www.google.com/search?q=solar+water+pump+controller',
      icon: 'activity',
      enabled: true
    },
    {
      id: 'h4',
      name: 'Rainwater Harvest Planner',
      category: 'Tool',
      desc: 'Estimate rooftop monsoon water capture and underground sump storage sizing.',
      url: 'https://www.google.com/search?q=rainwater+harvesting+calculator',
      icon: 'droplet',
      enabled: true
    }
  ];
}

function loadAdminOverrides() {
  const def = {
    features: {
      warranty: true,
      devices: true,
      invoice: true,
      hub: true,
      privacy: true,
      pwaPopup: true
    },
    maintenanceMode: false,
    maintenanceMessage: '',
    announcementActive: false,
    announcementText: '',
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
    hubApps: getDefaultHubApps()
  };
  try {
    const raw = localStorage.getItem(ADMIN_CONFIG_KEY);
    if (!raw) return def;
    const parsed = JSON.parse(raw);
    const mergedHub = Array.isArray(parsed.hubApps) && parsed.hubApps.length ? parsed.hubApps : def.hubApps;
    // Guarantee SellGst-Pro is always present unless explicitly deleted
    if (!mergedHub.some(a => String(a.name || '').toLowerCase().includes('sellgst'))) {
      mergedHub.unshift(def.hubApps[0]);
    }
    return {
      ...def,
      ...parsed,
      features: { ...def.features, ...(parsed.features || {}) },
      invoiceDefaults: { ...def.invoiceDefaults, ...(parsed.invoiceDefaults || {}) },
      hubApps: mergedHub
    };
  } catch {
    return def;
  }
}

/* =========================================================================
   XSS & INPUT SANITIZATION
   ========================================================================= */
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeText(str, maxLen = 250) {
  return String(str ?? '')
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

function shiftDaysIso(deltaDays) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const target = new Date(d.getTime() + deltaDays * 86400000);
  return target.toISOString().slice(0, 10);
}

function formatDateDisplay(isoStr) {
  if (!isoStr) return '—';
  const [y, m, d] = String(isoStr).split('-').map(Number);
  if (!y || !m || !d) return esc(isoStr);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* =========================================================================
   PUBLIC CUSTOMER UNITS (STRICTLY NON-SENSITIVE FIELDS ONLY)
   - Only stores/renders: id, customerName, modelName, hardwareType,
     quantity, installDate, expiryDate, status
   - NEVER includes mobileNumber, address, or private bills
   ========================================================================= */
function getDefaultPublicUnits() {
  return [
    {
      id: 'pub_u1',
      customerName: 'Rajesh Verma',
      modelName: 'AquaVault Pro-X7 Dual Tank Controller',
      hardwareType: 'Water Level Controller',
      quantity: 1,
      installDate: shiftDaysIso(-125),
      expiryDate: shiftDaysIso(240),
      status: 'ACTIVE'
    },
    {
      id: 'pub_u2',
      customerName: 'Sandeep Kulkarni',
      modelName: 'AquaVault HydroSeal Brass Stopper + Pro-X7',
      hardwareType: 'Water Stopper',
      quantity: 2,
      installDate: shiftDaysIso(-180),
      expiryDate: shiftDaysIso(185),
      status: 'ACTIVE'
    },
    {
      id: 'pub_u3',
      customerName: 'Meera Nair',
      modelName: 'AquaVault SumpGuard S4 Controller',
      hardwareType: 'Water Level Controller',
      quantity: 1,
      installDate: shiftDaysIso(-320),
      expiryDate: shiftDaysIso(45),
      status: 'ACTIVE'
    },
    {
      id: 'pub_u4',
      customerName: 'Vikramaditya Singh',
      modelName: 'AquaVault SmartCutoff Valve V2',
      hardwareType: 'Water Stopper',
      quantity: 1,
      installDate: shiftDaysIso(-410),
      expiryDate: shiftDaysIso(-45),
      status: 'EXPIRED'
    }
  ];
}

function sanitizePublicUnitRecord(raw, idx = 0) {
  // Explicitly strip any sensitive keys (mobileNumber, address, phone, invoice, etc.)
  const hwRaw = String(raw?.hardwareType || raw?.type || 'Water Level Controller');
  const isStopper = hwRaw.toLowerCase().includes('stopper');
  const expiryDate = sanitizeText(raw?.expiryDate || shiftDaysIso(365), 20);
  const installDate = sanitizeText(raw?.installDate || shiftDaysIso(0), 20);
  return {
    id: sanitizeId(raw?.id || ('pub_' + idx)),
    customerName: sanitizeText(raw?.customerName || raw?.clientName || 'Registered Customer', 120),
    modelName: sanitizeText(raw?.modelName || raw?.model || 'AquaVault Pro-X7 Controller', 140),
    hardwareType: isStopper ? 'Water Stopper' : 'Water Level Controller',
    quantity: Math.max(1, Math.min(1000, parseInt(raw?.quantity, 10) || 1)),
    installDate,
    expiryDate,
    status: getPublicUnitMetrics({ installDate, expiryDate }).remainingDays === 0 ? 'EXPIRED' : 'ACTIVE'
  };
}

function loadCachedPublicUnits() {
  try {
    const raw = localStorage.getItem(PUBLIC_UNITS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map((u, i) => sanitizePublicUnitRecord(u, i));
      }
    }
  } catch {}
  return getDefaultPublicUnits();
}

function saveCachedPublicUnits(units) {
  try {
    const clean = (units || []).map((u, i) => sanitizePublicUnitRecord(u, i));
    localStorage.setItem(PUBLIC_UNITS_CACHE_KEY, JSON.stringify(clean));
  } catch {}
}

function getPublicUnitMetrics(unit) {
  const parseLocal = (s) => {
    const [y, m, d] = String(s || '').split('-').map(Number);
    if (!y || !m || !d) return new Date();
    return new Date(y, m - 1, d);
  };
  const start = parseLocal(unit.installDate);
  const end = parseLocal(unit.expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const msPerDay = 86400000;
  const totalDays = Math.max(1, Math.round((end - start) / msPerDay));
  const rawRemaining = Math.round((end - today) / msPerDay);
  const remainingDays = Math.max(0, rawRemaining);
  const elapsedDays = Math.min(totalDays, Math.max(0, totalDays - remainingDays));
  const pctRemaining = Math.max(0, Math.min(100, Math.round((remainingDays / totalDays) * 100)));

  let statusLabel = 'Active Warranty';
  let statusBadge = 'badge-emerald';
  let strokeColor = 'var(--emerald)';

  if (remainingDays === 0) {
    statusLabel = 'Expired';
    statusBadge = 'badge-rose';
    strokeColor = 'var(--rose)';
  } else if (remainingDays <= 45) {
    statusLabel = 'Expiring Soon';
    statusBadge = 'badge-amber';
    strokeColor = 'var(--amber)';
  }

  return {
    totalDays,
    remainingDays,
    elapsedDays,
    pctRemaining,
    statusLabel,
    statusBadge,
    strokeColor
  };
}

/* =========================================================================
   LOCAL UI STATE & PUBLIC CLOUD SYNC
   ========================================================================= */
function getInitialState() {
  return {
    theme: 'light',
    selectedUnitId: 'pub_u1',
    publicSearchQuery: '',
    publicFilterType: 'ALL', // 'ALL' | 'CONTROLLER' | 'STOPPER' | 'ACTIVE' | 'EXPIRED'
    deviceFilter: 'all',
    hubCategory: 'All',
    hubSearch: '',
    dpdp: {
      consentGranted: true,
      consentTimestamp: '14 Jan 2026, 10:18 IST',
      telemetryConsent: true,
      warrantyAlertConsent: true,
      deletionRequested: false,
      auditTrail: [
        { id: 'AUD-101', action: 'DPDP Digital Privacy Notice Ready', time: '2026.1 Standard' }
      ]
    },
    publicUnits: loadCachedPublicUnits(),
    tickets: [
      {
        id: 'SRV-9402',
        unitId: 'pub_u1',
        unitName: 'AquaVault Pro-X7 Dual Tank Controller',
        issue: 'Annual Sensor Calibration',
        notes: 'Routine ultrasonic level calibration before monsoon.',
        status: 'Scheduled',
        date: shiftDaysIso(-2)
      }
    ]
  };
}

function loadState() {
  const fallback = getInitialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      ...fallback,
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      selectedUnitId: parsed.selectedUnitId || fallback.selectedUnitId,
      dpdp: { ...fallback.dpdp, ...(parsed.dpdp || {}) },
      publicUnits: loadCachedPublicUnits(),
      tickets: Array.isArray(parsed.tickets) ? parsed.tickets : fallback.tickets
    };
  } catch {
    return fallback;
  }
}

let state = loadState();
let toastTimer = null;
let pwaInstallBannerDismissed = false;
let pwaAutoHideStarted = false;

const cloud = {
  ready: false,
  user: null,
  isAdmin: false,
  checkingInvoiceAuth: true,
  liveUnitsSynced: false
};

let fbApp = null;
let auth = null;
let db = null;
let fbSdk = null;

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      theme: state.theme,
      selectedUnitId: state.selectedUnitId,
      dpdp: state.dpdp,
      tickets: state.tickets
    }));
  } catch {}
}

async function initPublicFirebaseSafely() {
  if (fbSdk && db) return true;
  let cfg = { ...DEFAULT_FIREBASE_CONFIG };
  let dbId = '(default)';
  try {
    const mod = await import('./firebase-config.js?v=10');
    if (mod?.firebaseConfig && mod.firebaseConfig.apiKey) {
      cfg = mod.firebaseConfig;
    }
    if (mod?.firestoreDatabaseId) {
      dbId = mod.firestoreDatabaseId;
    }
  } catch {}

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
      db = dbId && dbId !== '(default)'
        ? fbSdk.getFirestore(fbApp, dbId)
        : fbSdk.getFirestore(fbApp);
    } catch {
      db = fbSdk.getFirestore(fbApp);
    }
    cloud.ready = true;

    // 1. Check Auth State (used strictly to guard Admin-only invoice.html)
    fbSdk.onAuthStateChanged(auth, (user) => {
      cloud.user = user || null;
      cloud.isAdmin = Boolean(user && user.uid === AUTHORIZED_ADMIN_UID);
      cloud.checkingInvoiceAuth = false;
      if (getCurrentPage() === 'invoice') {
        renderApp();
      }
    });

    // 2. Load Public Non-Sensitive Units from `public_units` collection
    await fetchPublicUnitsFromFirestore();
    return true;
  } catch (err) {
    console.warn('Public Firebase sync running in offline cache mode:', err?.message || err);
    cloud.checkingInvoiceAuth = false;
    if (getCurrentPage() === 'invoice') renderApp();
    return false;
  }
}

async function fetchPublicUnitsFromFirestore() {
  if (!db || !fbSdk) return;
  try {
    // Load public_units (contains ONLY non-sensitive customerName, modelName, hardwareType, quantity, installDate, expiryDate, status)
    const snap = await fbSdk.getDocs(fbSdk.collection(db, 'public_units'));
    if (!snap.empty) {
      const list = [];
      snap.forEach((docSnap) => {
        list.push(sanitizePublicUnitRecord({ id: docSnap.id, ...docSnap.data() }, list.length));
      });
      // Sort active first, then by customerName
      list.sort((a, b) => {
        const remA = getPublicUnitMetrics(a).remainingDays;
        const remB = getPublicUnitMetrics(b).remainingDays;
        if (remA > 0 && remB === 0) return -1;
        if (remA === 0 && remB > 0) return 1;
        return a.customerName.localeCompare(b.customerName);
      });
      state.publicUnits = list;
      saveCachedPublicUnits(list);
      if (!state.publicUnits.some(u => u.id === state.selectedUnitId)) {
        state.selectedUnitId = state.publicUnits[0]?.id || '';
      }
      cloud.liveUnitsSynced = true;
    }

    // Load public hubApps if available
    try {
      const hubSnap = await fbSdk.getDocs(fbSdk.collection(db, 'hubApps'));
      if (!hubSnap.empty) {
        const cloudHub = [];
        hubSnap.forEach(s => cloudHub.push({ id: s.id, ...s.data() }));
        cloudHub.sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
        const cfg = loadAdminOverrides();
        cfg.hubApps = cloudHub;
        localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(cfg));
      }
    } catch {}

    // Load public appConfig if available
    try {
      const cfgSnap = await fbSdk.getDoc(fbSdk.doc(db, 'appConfig', 'global'));
      if (cfgSnap.exists()) {
        const d = cfgSnap.data();
        const cfg = loadAdminOverrides();
        cfg.maintenanceMode = Boolean(d.maintenanceMode);
        cfg.maintenanceMessage = d.maintenanceMessage || cfg.maintenanceMessage;
        cfg.announcementActive = Boolean(d.announcementActive);
        cfg.announcementText = d.announcementText || cfg.announcementText;
        localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(cfg));
      }
    } catch {}

    renderApp();
  } catch (err) {
    console.warn('Public units fetch fallback to local cache:', err?.message || err);
  }
}

/* =========================================================================
   THEME & 1-CLICK SHARE PAGE HANDLER
   ========================================================================= */
function applyTheme(theme) {
  state.theme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', state.theme);
  const metaTheme = document.getElementById('meta-theme-color');
  if (metaTheme) {
    metaTheme.setAttribute('content', state.theme === 'dark' ? '#06060A' : '#FFFFFF');
  }
  saveState();
}

function toggleTheme() {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  renderApp();
  showToast(state.theme === 'dark' ? 'Night Mode Activated — Luminous Violet' : 'Day Mode Activated — Royal Purple');
}

async function shareLandingPage() {
  const shareUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, 'index.html');
  const shareData = {
    title: 'AquaVault — Smart Water Level Controller & Customer Warranty Directory',
    text: 'Check live customer warranty status for AquaVault Smart Water Level Controllers & Water Stoppers, plus explore our Apps Hub:',
    url: shareUrl
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      showToast('Shared AquaVault Customer Trust Page!');
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
    }
  }

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Landing page link copied to clipboard!');
      return;
    }
  } catch {}

  const tempInput = document.createElement('input');
  tempInput.value = shareUrl;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  tempInput.remove();
  showToast('Landing page link copied to clipboard!');
}

function showToast(msg) {
  let toast = document.getElementById('aquaToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'aquaToast';
    toast.className = 'toast-container';
    document.body.appendChild(toast);
  }
  toast.textContent = String(msg ?? '');
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

/* =========================================================================
   7-SECOND AUTO-HIDING PWA INSTALL POPUP
   ========================================================================= */
function shouldShowPwaBanner() {
  const adminCfg = loadAdminOverrides();
  if (adminCfg.features && adminCfg.features.pwaPopup === false) return false;
  if (pwaInstallBannerDismissed) return false;
  try {
    if (sessionStorage.getItem(PWA_POPUP_SEEN_KEY) === '1') return false;
  } catch {}
  return true;
}

function dismissPwaInstallBanner() {
  pwaInstallBannerDismissed = true;
  try { sessionStorage.setItem(PWA_POPUP_SEEN_KEY, '1'); } catch {}
  const el = document.getElementById('pwaInstallToast');
  if (el) el.classList.add('hide');
}

function triggerPwaInstallAction() {
  dismissPwaInstallBanner();
  showToast('To install AquaVault: tap Browser Menu → "Add to Home Screen"');
}

function startPwaPopupTimerIfNeeded() {
  if (pwaAutoHideStarted || !shouldShowPwaBanner()) return;
  pwaAutoHideStarted = true;
  setTimeout(() => {
    dismissPwaInstallBanner();
  }, 7000);
}

function renderPwaInstallPopup() {
  if (!shouldShowPwaBanner()) return '';
  return `
    <div id="pwaInstallToast" class="pwa-install-toast" role="status" aria-live="polite">
      <div class="pwa-toast-icon">
        <img src="assets/app-icon.jpg" alt="AquaVault App" width="38" height="38" />
      </div>
      <div class="pwa-toast-copy">
        <div class="pwa-toast-title">Install AquaVault Trust App</div>
        <div class="pwa-toast-sub">Instant access to live customer warranty countdowns &amp; Apps Hub</div>
        <div class="pwa-timer-track"><div class="pwa-timer-bar"></div></div>
      </div>
      <div class="pwa-toast-actions">
        <button class="btn btn-sm btn-primary" onclick="triggerPwaInstallAction()">Install</button>
        <button class="pwa-close-btn" onclick="dismissPwaInstallBanner()" aria-label="Close popup">&times;</button>
      </div>
    </div>
  `;
}

function getCurrentPage() {
  return document.body.getAttribute('data-page') || 'home';
}

/* =========================================================================
   SHARED APP SHELL (NO DUMMY USER, CLEAN NAV, PROMINENT SHARE BUTTON)
   ========================================================================= */
function renderShell(activePage, mainContentHtml) {
  const isDark = state.theme === 'dark';
  const adminCfg = loadAdminOverrides();

  const visibleRoutes = ROUTES.filter(r => {
    if (r.id === 'devices' && !adminCfg.features.devices) return false;
    if (r.id === 'hub' && !adminCfg.features.hub) return false;
    if (r.id === 'privacy' && !adminCfg.features.privacy) return false;
    return true;
  });
  const dockRoutes = visibleRoutes.filter(r => r.dock);

  const announcementBannerHtml = adminCfg.announcementActive && adminCfg.announcementText ? `
    <div style="background:linear-gradient(135deg, var(--primary), #4C1D95);color:#FFFFFF;padding:10px 16px;border-radius:14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12.5px;font-weight:600;box-shadow:var(--shadow-purple);">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="background:rgba(255,255,255,0.2);padding:3px 8px;border-radius:999px;font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Live Update</span>
        <span>${esc(adminCfg.announcementText)}</span>
      </div>
    </div>
  ` : '';

  const maintenanceScreenHtml = adminCfg.maintenanceMode ? `
    <div class="card" style="text-align:center;padding:38px 22px;margin:18px 0;border:1.5px solid var(--primary);">
      <div class="badge badge-purple" style="margin-bottom:12px;">${ic('shield')} Scheduled Maintenance</div>
      <h1 class="page-title serif" style="margin-bottom:10px;">AquaVault Upgrade in Progress</h1>
      <p style="font-size:14px;color:var(--ink-secondary);max-width:520px;margin:0 auto 18px;line-height:1.6;">
        ${esc(adminCfg.maintenanceMessage || 'AquaVault is undergoing a scheduled upgrade. Please check back shortly.')}
      </p>
    </div>
  ` : '';

  return `
    ${renderPwaInstallPopup()}
    <div class="app-shell">
      <!-- Desktop Sidebar -->
      <aside class="sidebar" aria-label="Primary Navigation">
        <a href="index.html" class="brand-lockup">
          <div class="brand-emblem">
            <img src="assets/app-icon.jpg" alt="AquaVault Emblem" width="40" height="40" />
          </div>
          <div class="brand-titles">
            <span class="brand-name">AquaVault</span>
            <span class="brand-tag">Smart Water Trust</span>
          </div>
        </a>

        <div class="nav-section-label">Public Trust Portal</div>
        <nav class="sidebar-nav">
          ${visibleRoutes.map(r => `
            <a href="${r.href}" class="nav-link ${activePage === r.id ? 'active' : ''}">
              ${ic(r.icon)}
              <span>${r.label}</span>
            </a>
          `).join('')}
        </nav>

        <div class="sidebar-footer">
          <div class="customer-mini-card">
            <div class="mini-label">Public Trust Shield</div>
            <div class="mini-name">Verified Customer Directory</div>
            <div class="mini-id" style="color:var(--emerald);">${state.publicUnits.length} Registered Installations</div>
            <div style="margin-top:10px;display:flex;flex-direction:column;gap:7px;">
              <button type="button" class="btn btn-sm btn-primary" style="width:100%;" onclick="shareLandingPage()">
                ${ic('share')} Share Trust Page
              </button>
              <a href="admin/" class="btn btn-sm btn-outline" style="width:100%;text-decoration:none;">
                ${ic('lock')} Admin Console
              </a>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Column -->
      <div class="main-column">
        <header class="topbar">
          <div class="topbar-inner">
            <div class="topbar-left">
              <a href="index.html" class="mobile-brand-chip" aria-label="AquaVault Home">
                <img src="assets/app-icon.jpg" alt="AquaVault" width="36" height="36" />
              </a>
              <div class="status-pill">
                <span class="status-dot"></span>
                <span>Live Warranty Directory &bull; No Login Required</span>
              </div>
            </div>
            <div class="topbar-actions">
              <button type="button" class="btn btn-sm btn-primary" onclick="shareLandingPage()" title="Share this landing page">
                ${ic('share')} <span>Share Page</span>
              </button>
              <button class="theme-toggle-btn" onclick="toggleTheme()" aria-label="Toggle Day/Night Mode">
                ${isDark ? ic('sun') : ic('moon')}
                <span>${isDark ? 'Day Mode' : 'Night Mode'}</span>
              </button>
            </div>
          </div>
        </header>

        <main class="page-container">
          <!-- Mobile Horizontal Quick-Access Bar -->
          <nav class="mobile-feature-strip" aria-label="All Features">
            ${visibleRoutes.map(r => `
              <a href="${r.href}" class="feature-strip-pill ${activePage === r.id ? 'active' : ''}">
                ${ic(r.icon)}
                <span>${r.shortLabel}</span>
              </a>
            `).join('')}
            <button type="button" class="feature-strip-pill" onclick="shareLandingPage()" style="cursor:pointer;border:1px solid var(--border-strong);background:var(--primary-soft);color:var(--primary);font-weight:700;">
              ${ic('share')}
              <span>Share Link</span>
            </button>
          </nav>

          ${announcementBannerHtml}
          ${adminCfg.maintenanceMode ? maintenanceScreenHtml : mainContentHtml}
        </main>
      </div>

      <!-- Mobile Bottom Dock -->
      <nav class="bottom-dock" aria-label="Mobile Navigation">
        ${dockRoutes.map(r => `
          <a href="${r.href}" class="dock-item ${activePage === r.id ? 'active' : ''}">
            ${ic(r.icon)}
            <span>${r.shortLabel}</span>
          </a>
        `).join('')}
      </nav>
    </div>
  `;
}

/* =========================================================================
   PAGE 1: NO-LOGIN PUBLIC CUSTOMER TRUST LANDING PAGE (index.html)
   - Prominent 1-Click "Share Page" CTA
   - Live Searchable Public List of Registered Customers showing ONLY:
     * Customer Name
     * Installed Controller / Water Stopper Model(s) & Quantity
     * Live Warranty Countdown ("240 Days Left") OR Red Badge "Expired"
       ("This person's warranty has expired") when remaining days reach 0
   - Merged Live Decreasing Warranty Trajectory Graph & Countdown Ring
   - Embedded AquaVault Ecosystem / Apps Hub (including SellGst-Pro)
   - STRICT PRIVACY: Zero phone numbers, addresses, or private bills loaded
   ========================================================================= */
function renderHome() {
  const units = state.publicUnits || [];
  const activeUnits = units.filter(u => getPublicUnitMetrics(u).remainingDays > 0);
  const expiredUnits = units.filter(u => getPublicUnitMetrics(u).remainingDays === 0);
  const totalQty = units.reduce((acc, u) => acc + (Number(u.quantity) || 1), 0);

  const selectedUnit = units.find(u => u.id === state.selectedUnitId) || units[0];
  const selMetrics = selectedUnit ? getPublicUnitMetrics(selectedUnit) : null;

  // Filter public customer list by search query & hardware/status filter
  const q = (state.publicSearchQuery || '').trim().toLowerCase();
  const filteredUnits = units.filter(u => {
    const m = getPublicUnitMetrics(u);
    if (state.publicFilterType === 'CONTROLLER' && !u.hardwareType.toLowerCase().includes('controller')) return false;
    if (state.publicFilterType === 'STOPPER' && !u.hardwareType.toLowerCase().includes('stopper')) return false;
    if (state.publicFilterType === 'ACTIVE' && m.remainingDays === 0) return false;
    if (state.publicFilterType === 'EXPIRED' && m.remainingDays > 0) return false;
    if (!q) return true;
    return (
      u.customerName.toLowerCase().includes(q) ||
      u.modelName.toLowerCase().includes(q) ||
      u.hardwareType.toLowerCase().includes(q)
    );
  });

  // Ring geometry for selected customer unit
  const radius = 84;
  const circumference = +(2 * Math.PI * radius).toFixed(2);
  const dashOffset = selMetrics
    ? +(circumference - (selMetrics.pctRemaining / 100) * circumference).toFixed(2)
    : circumference;

  const adminCfg = loadAdminOverrides();
  const hubApps = (adminCfg.hubApps || getDefaultHubApps()).filter(a => a.enabled !== false);

  return `
    <!-- Hero Showcase with Prominent 1-Click Share Page Button -->
    <section class="hero-banner">
      <div class="hero-grid">
        <div>
          <div class="hero-pill">
            ${ic('shield')}
            <span>Official AquaVault Customer Trust Directory &bull; Live Warranty Tracker</span>
          </div>
          <h1 class="hero-title serif">
            Smart Water Level Controllers &amp; <em>Verified Warranty Vault.</em>
          </h1>
          <p class="hero-subtitle">
            Browse our live, transparent customer directory below to check real-time decreasing warranty days for every registered AquaVault Water Level Controller and Water Stopper—or launch our companion apps in 1 click.
          </p>
          <div class="hero-actions">
            <button type="button" class="btn btn-white" onclick="shareLandingPage()">
              ${ic('share')} Share Page Link
            </button>
            <a href="#publicCustomerDirectory" class="btn btn-glass">
              ${ic('search')} Search Customer Warranty
            </a>
            <a href="#ecosystemHubSection" class="btn btn-glass">
              ${ic('grid')} Explore Apps Hub
            </a>
          </div>
        </div>
        <div class="hero-visual-card">
          <img src="assets/hero-aquavault.jpg" alt="AquaVault Smart Water Controller" />
          <div class="hero-overlay-caption">
            <div>
              <div style="font-size:11px;font-weight:700;opacity:0.8;text-transform:uppercase;letter-spacing:0.08em;">Verified Public Directory</div>
              <div style="font-size:14px;font-weight:800;">${units.length} Customers &bull; ${totalQty} Installed Units</div>
            </div>
            <span class="badge badge-emerald">Privacy Protected</span>
          </div>
        </div>
      </div>
    </section>

    <!-- KPI Summary Row -->
    <section class="stats-grid" aria-label="Warranty Fleet Metrics">
      <div class="stat-card">
        <div class="stat-label">Registered Customers</div>
        <div class="stat-value mono">${units.length}</div>
        <div class="stat-foot">
          <span class="badge badge-purple">Verified Owners</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Installed Hardware Qty</div>
        <div class="stat-value mono">${totalQty} Units</div>
        <div class="stat-foot">
          <span class="badge badge-emerald">${activeUnits.length} Active</span>
          ${expiredUnits.length ? `<span class="badge badge-rose">${expiredUnits.length} Expired</span>` : ''}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Ecosystem Apps &amp; Tools</div>
        <div class="stat-value mono">${hubApps.length} Live</div>
        <div class="stat-foot">
          <span class="badge badge-purple">1-Click Launch</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Customer Privacy Guard</div>
        <div class="stat-value">100% Safe</div>
        <div class="stat-foot">
          <span class="badge badge-emerald">Zero Phone / Bill Exposure</span>
        </div>
      </div>
    </section>

    <!-- LIVE SEARCHABLE PUBLIC CUSTOMER TRUST & WARRANTY DIRECTORY -->
    <section id="publicCustomerDirectory" class="card" style="margin-bottom:24px;">
      <div class="card-header" style="flex-wrap:wrap;gap:12px;">
        <div>
          <div class="page-eyebrow">${ic('shield')} Public Customer Warranty Registry</div>
          <h2 class="card-title" style="font-size:20px;">Live Registered Customers &amp; Warranty Countdown</h2>
          <p class="card-subtitle">
            Search any registered customer name or model below. Phone numbers, home addresses, and private bills are strictly isolated and never loaded on this public page.
          </p>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn btn-sm btn-primary" onclick="shareLandingPage()">
            ${ic('share')} Share Directory
          </button>
        </div>
      </div>

      <!-- Search & Filter Controls -->
      <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:18px;">
        <div style="position:relative;flex:1;min-width:240px;">
          <input
            id="publicCustomerSearchInput"
            type="search"
            class="input"
            placeholder="Search customer name or controller / water stopper model..."
            value="${esc(state.publicSearchQuery)}"
            oninput="updatePublicCustomerSearch(this.value)"
            style="padding-left:38px;"
          />
          <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--ink-tertiary);pointer-events:none;">
            ${ic('search')}
          </span>
        </div>
        <div class="pill-tabs">
          ${[
            ['ALL', `All (${units.length})`],
            ['ACTIVE', `Active (${activeUnits.length})`],
            ['EXPIRED', `Expired (${expiredUnits.length})`],
            ['CONTROLLER', 'Controllers'],
            ['STOPPER', 'Water Stoppers']
          ].map(([key, label]) => `
            <button type="button" class="pill-tab ${state.publicFilterType === key ? 'active' : ''}" onclick="setPublicFilterType('${key}')">
              ${label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Public Customer List (Displays ONLY Customer Name, Model & Quantity, and Live Warranty Countdown / Expired Badge) -->
      <div class="public-customer-grid">
        ${filteredUnits.map(u => {
          const m = getPublicUnitMetrics(u);
          const isExpired = m.remainingDays === 0;
          const isSelected = selectedUnit && selectedUnit.id === u.id;
          const safeId = sanitizeId(u.id);
          return `
            <div
              class="device-item-card"
              onclick="selectPublicUnitForGauge('${safeId}')"
              style="cursor:pointer;flex-direction:column;justify-content:space-between;gap:12px;border:${isSelected ? '2px solid var(--primary)' : isExpired ? '1.5px solid rgba(225,29,72,0.35)' : '1px solid var(--border)'};transition:all 0.2s ease;"
            >
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
                <div style="min-width:0;">
                  <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">
                    <span class="badge ${u.hardwareType.toLowerCase().includes('stopper') ? 'badge-amber' : 'badge-purple'}">
                      ${esc(u.hardwareType)}
                    </span>
                    <span class="badge badge-neutral mono">Qty: ${Number(u.quantity) || 1}</span>
                  </div>
                  <div style="font-size:16px;font-weight:800;color:var(--ink);letter-spacing:-0.01em;">
                    ${esc(u.customerName)}
                  </div>
                  <div style="font-size:13px;font-weight:600;color:var(--ink-secondary);margin-top:3px;">
                    ${esc(u.modelName)}
                  </div>
                </div>

                <div style="text-align:right;flex-shrink:0;">
                  ${isExpired ? `
                    <span class="badge badge-rose" style="font-size:11.5px;padding:5px 10px;font-weight:800;">
                      Expired
                    </span>
                  ` : `
                    <span class="badge ${m.statusBadge} mono" style="font-size:12px;padding:5px 10px;font-weight:800;">
                      ${m.remainingDays} Days Left
                    </span>
                  `}
                </div>
              </div>

              <div>
                <div class="progress-bar-track" style="height:7px;margin-bottom:8px;">
                  <div class="progress-bar-fill" style="width:${m.pctRemaining}%;background:${m.strokeColor};"></div>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;font-size:11.5px;color:var(--ink-tertiary);gap:8px;flex-wrap:wrap;">
                  ${isExpired ? `
                    <span style="color:var(--rose);font-weight:700;">
                      This person's warranty has expired
                    </span>
                  ` : `
                    <span>Installed: <strong class="mono">${formatDateDisplay(u.installDate)}</strong></span>
                  `}
                  <span>Valid Thru: <strong class="mono">${formatDateDisplay(u.expiryDate)}</strong></span>
                </div>
              </div>
            </div>
          `;
        }).join('') || `
          <div style="grid-column:1/-1;text-align:center;padding:28px 16px;color:var(--ink-tertiary);font-size:13.5px;">
            No matching customer records found for "${esc(state.publicSearchQuery)}".
          </div>
        `}
      </div>
    </section>

    <!-- MERGED INTERACTIVE WARRANTY COUNTDOWN RING & DECREASING TRAJECTORY GRAPH -->
    ${selectedUnit && selMetrics ? `
      <section class="grid-2" style="margin-bottom:24px;">
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Live Warranty Countdown Ring</h2>
              <p class="card-subtitle">Click any customer card above to inspect its live daily countdown</p>
            </div>
            <span class="badge ${selMetrics.statusBadge}">
              ${selMetrics.remainingDays === 0 ? 'Expired' : `${selMetrics.remainingDays} Days Left`}
            </span>
          </div>

          <div class="warranty-gauge-wrap" style="padding:10px 0;">
            <div class="gauge-svg-box">
              <svg width="210" height="210" viewBox="0 0 210 210" aria-label="Warranty Remaining Days Ring">
                <circle class="gauge-track" cx="105" cy="105" r="${radius}" />
                <circle
                  class="gauge-progress"
                  cx="105"
                  cy="105"
                  r="${radius}"
                  stroke="${selMetrics.strokeColor}"
                  stroke-dasharray="${circumference}"
                  stroke-dashoffset="${dashOffset}"
                />
              </svg>
              <div class="gauge-center">
                <div class="gauge-days-num mono" style="${selMetrics.remainingDays === 0 ? 'color:var(--rose);font-size:28px;' : ''}">
                  ${selMetrics.remainingDays === 0 ? 'EXPIRED' : selMetrics.remainingDays}
                </div>
                <div class="gauge-days-unit">
                  ${selMetrics.remainingDays === 0 ? '0 Days Remaining' : 'Days Remaining'}
                </div>
                <div class="gauge-days-pct">${selMetrics.pctRemaining}% Coverage Left</div>
              </div>
            </div>

            <div style="text-align:center;max-width:440px;">
              <div style="font-size:16px;font-weight:800;color:var(--ink);">${esc(selectedUnit.customerName)}</div>
              <div style="font-size:13px;color:var(--ink-secondary);margin-top:2px;">
                ${esc(selectedUnit.modelName)} &bull; <span class="mono">Qty: ${Number(selectedUnit.quantity) || 1}</span>
              </div>
              ${selMetrics.remainingDays === 0 ? `
                <div style="margin-top:8px;padding:7px 12px;border-radius:10px;background:rgba(225,29,72,0.12);border:1px solid rgba(225,29,72,0.35);color:var(--rose);font-size:12px;font-weight:700;">
                  Expired — This person's warranty has expired (${formatDateDisplay(selectedUnit.expiryDate)})
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Decreasing Warranty Trajectory</h2>
              <p class="card-subtitle">Automated 24-hour remaining-day decrement timeline</p>
            </div>
            <span class="badge badge-purple mono">${selMetrics.totalDays}d Term</span>
          </div>

          <div class="decay-chart-box">
            <svg viewBox="0 0 500 155" width="100%" height="155" style="overflow:visible;">
              <defs>
                <linearGradient id="purpleDecayGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.32"/>
                  <stop offset="100%" stop-color="var(--primary)" stop-opacity="0.0"/>
                </linearGradient>
              </defs>
              <line x1="36" y1="20" x2="476" y2="20" stroke="var(--border)" stroke-dasharray="4 4"/>
              <line x1="36" y1="75" x2="476" y2="75" stroke="var(--border)" stroke-dasharray="4 4"/>
              <line x1="36" y1="130" x2="476" y2="130" stroke="var(--border)"/>
              <polygon points="36,20 476,130 36,130" fill="url(#purpleDecayGrad)"/>
              <line x1="36" y1="20" x2="476" y2="130" stroke="var(--primary)" stroke-width="3" stroke-linecap="round"/>
              ${(() => {
                const progressRatio = Math.min(1, Math.max(0, selMetrics.elapsedDays / selMetrics.totalDays));
                const cx = +(36 + progressRatio * 440).toFixed(1);
                const cy = +(20 + progressRatio * 110).toFixed(1);
                return `
                  <line x1="${cx}" y1="20" x2="${cx}" y2="130" stroke="${selMetrics.strokeColor}" stroke-width="1.5" stroke-dasharray="3 3"/>
                  <circle cx="${cx}" cy="${cy}" r="6" fill="${selMetrics.strokeColor}" stroke="var(--bg-surface)" stroke-width="2.5"/>
                  <text x="${Math.min(415, Math.max(45, cx - 35))}" y="${Math.max(15, cy - 12)}" fill="var(--ink)" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700">${selMetrics.remainingDays === 0 ? 'EXPIRED (0d)' : `TODAY: ${selMetrics.remainingDays}d`}</text>
                `;
              })()}
              <text x="36" y="148" fill="var(--ink-tertiary)" font-size="10" font-family="JetBrains Mono, monospace">INSTALL (${selMetrics.totalDays}d)</text>
              <text x="398" y="148" fill="var(--ink-tertiary)" font-size="10" font-family="JetBrains Mono, monospace">EXPIRY (0d)</text>
            </svg>
          </div>

          <div class="warranty-meta-grid" style="margin-top:14px;">
            <div class="meta-tile">
              <div class="meta-tile-label">Installed On</div>
              <div class="meta-tile-val mono">${formatDateDisplay(selectedUnit.installDate)}</div>
            </div>
            <div class="meta-tile">
              <div class="meta-tile-label">Elapsed Days</div>
              <div class="meta-tile-val mono">${selMetrics.elapsedDays} Days</div>
            </div>
            <div class="meta-tile">
              <div class="meta-tile-label">Valid Until</div>
              <div class="meta-tile-val mono">${formatDateDisplay(selectedUnit.expiryDate)}</div>
            </div>
          </div>
        </div>
      </section>
    ` : ''}

    <!-- EMBEDDED AQUAVAULT ECOSYSTEM / APPS HUB ON INDEX.HTML -->
    <section id="ecosystemHubSection" class="card">
      <div class="card-header" style="flex-wrap:wrap;gap:10px;">
        <div>
          <div class="page-eyebrow">${ic('grid')} AquaVault Ecosystem &amp; Apps Hub</div>
          <h2 class="card-title" style="font-size:20px;">Connected Websites, Apps &amp; Smart Tools</h2>
          <p class="card-subtitle">Open SellGst-Pro or any official AquaVault companion application in a new tab with 1 click</p>
        </div>
        <a href="hub.html" class="btn btn-sm btn-soft">Open Full Apps Hub ${ic('external')}</a>
      </div>

      <div class="hub-grid">
        ${hubApps.map(item => {
          const badgeClass = item.category === 'Website' ? 'badge-purple' : item.category === 'New App' ? 'badge-emerald' : 'badge-amber';
          const safeUrl = /^https:\/\//i.test(String(item.url || '').trim()) ? String(item.url).trim() : 'https://www.google.com';
          return `
            <div class="hub-app-card">
              <div class="hub-app-top">
                <div class="hub-icon-box">${ic(item.icon || 'globe')}</div>
                <span class="badge ${badgeClass}">${esc(item.category)}</span>
              </div>
              <div>
                <div class="hub-app-title">${esc(item.name)}</div>
                <p class="hub-app-desc" style="margin-top:4px;">${esc(item.desc)}</p>
              </div>
              <div style="margin-top:auto;padding-top:6px;">
                <a href="${esc(safeUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="width:100%;justify-content:space-between;">
                  <span>Open in New Tab</span>
                  ${ic('external')}
                </a>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function updatePublicCustomerSearch(val) {
  state.publicSearchQuery = sanitizeText(val, 100);
  renderApp();
  const inp = document.getElementById('publicCustomerSearchInput');
  if (inp) {
    inp.focus();
    try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch {}
  }
}

function setPublicFilterType(filterType) {
  state.publicFilterType = filterType;
  renderApp();
}

function selectPublicUnitForGauge(unitId) {
  state.selectedUnitId = sanitizeId(unitId);
  saveState();
  renderApp();
}

/* =========================================================================
   PAGE 2: MODELS & SERVICE SUPPORT (devices.html)
   - Displays public hardware models & lets visitors log a service inspection request
   - ZERO private customer phone numbers, addresses, or private bills exposed
   ========================================================================= */
function renderDevices() {
  const units = state.publicUnits || [];
  const filtered = units.filter(u => {
    if (state.deviceFilter === 'controller') return u.hardwareType.toLowerCase().includes('controller');
    if (state.deviceFilter === 'stopper') return u.hardwareType.toLowerCase().includes('stopper');
    return true;
  });

  return `
    <div class="page-header">
      <div>
        <div class="page-eyebrow">${ic('cpu')} Hardware Fleet &amp; Support</div>
        <h1 class="page-title serif">Water Controllers, Stoppers &amp; Service</h1>
        <p class="page-desc">Inspect registered AquaVault hardware models and book a technician inspection slot.</p>
      </div>
      <div class="pill-tabs">
        <button class="pill-tab ${state.deviceFilter === 'all' ? 'active' : ''}" onclick="setDeviceFilter('all')">All (${units.length})</button>
        <button class="pill-tab ${state.deviceFilter === 'controller' ? 'active' : ''}" onclick="setDeviceFilter('controller')">Controllers</button>
        <button class="pill-tab ${state.deviceFilter === 'stopper' ? 'active' : ''}" onclick="setDeviceFilter('stopper')">Water Stoppers</button>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:22px;">
      ${filtered.map(u => {
        const m = getPublicUnitMetrics(u);
        const isController = u.hardwareType.toLowerCase().includes('controller');
        const thumb = isController ? 'assets/device-controller.jpg' : 'assets/device-stopper.jpg';
        return `
          <div class="card" style="display:flex;flex-direction:column;justify-content:space-between;gap:14px;">
            <div>
              <div style="display:flex;gap:14px;align-items:center;margin-bottom:14px;">
                <img src="${thumb}" alt="${esc(u.modelName)}" style="width:68px;height:68px;border-radius:14px;object-fit:cover;border:1px solid var(--border);" />
                <div style="flex:1;min-width:0;">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px;">
                    <span class="badge ${isController ? 'badge-purple' : 'badge-amber'}">${esc(u.hardwareType)}</span>
                    <span class="badge ${m.statusBadge}">${m.remainingDays === 0 ? 'Expired' : `${m.remainingDays} Days Left`}</span>
                  </div>
                  <h2 style="font-size:16px;font-weight:800;line-height:1.25;">${esc(u.modelName)}</h2>
                  <div style="font-size:12.5px;color:var(--ink-secondary);margin-top:3px;">
                    Owner: <strong>${esc(u.customerName)}</strong> &bull; <span class="mono">Qty: ${Number(u.quantity) || 1}</span>
                  </div>
                </div>
              </div>

              <div class="progress-bar-track" style="margin-bottom:10px;">
                <div class="progress-bar-fill" style="width:${m.pctRemaining}%;background:${m.strokeColor};"></div>
              </div>

              <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;background:var(--bg-elevated);padding:10px 12px;border-radius:10px;border:1px solid var(--border);font-size:12px;">
                <div>
                  <span style="color:var(--ink-tertiary);display:block;font-size:10px;font-weight:700;text-transform:uppercase;">Installed Date</span>
                  <strong class="mono">${formatDateDisplay(u.installDate)}</strong>
                </div>
                <div>
                  <span style="color:var(--ink-tertiary);display:block;font-size:10px;font-weight:700;text-transform:uppercase;">Warranty Valid Thru</span>
                  <strong class="mono">${formatDateDisplay(u.expiryDate)}</strong>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Service Ticket Section -->
    <div class="grid-12">
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Book Technician Service / Calibration</h2>
            <p class="card-subtitle">Submit a sensor cleaning, valve check, or controller calibration ticket</p>
          </div>
        </div>
        <form onsubmit="submitServiceTicket(event)">
          <div class="form-group">
            <label class="form-label" for="srvUnit">Select Registered Unit</label>
            <select id="srvUnit" class="select" required>
              ${units.map(u => `<option value="${esc(u.id)}">${esc(u.customerName)} — ${esc(u.modelName)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="srvIssue">Service Type</label>
            <select id="srvIssue" class="select" required>
              <option value="Ultrasonic Sensor Cleaning & Calibration">Ultrasonic Sensor Cleaning &amp; Calibration</option>
              <option value="Motor Relay / Dry-Run Cutoff Inspection">Motor Relay / Dry-Run Cutoff Inspection</option>
              <option value="Motorized Brass Stopper Valve Check">Motorized Brass Stopper Valve Check</option>
              <option value="Warranty Extension Inspection">Warranty Extension Inspection</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="srvNotes">Additional Notes</label>
            <textarea id="srvNotes" class="textarea" maxlength="500" placeholder="Describe tank overflow behavior, valve timing, or preferred visit time..." required></textarea>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;">
            ${ic('wrench')} Submit Service Request
          </button>
        </form>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Recent Service Requests</h2>
            <p class="card-subtitle">Logged technician visits</p>
          </div>
          <span class="badge badge-purple">${state.tickets.length} Requests</span>
        </div>
        <div class="device-list">
          ${state.tickets.map(t => `
            <div class="device-item-card" style="cursor:default;">
              <div class="device-item-left">
                <div class="device-type-icon">${ic('wrench')}</div>
                <div>
                  <div class="device-name">${esc(t.issue)}</div>
                  <div class="device-meta">${esc(t.unitName)} &bull; <span class="mono">${esc(t.id)}</span></div>
                  <div style="font-size:12px;color:var(--ink-secondary);margin-top:4px;">${esc(t.notes)}</div>
                </div>
              </div>
              <div class="device-item-right">
                <span class="badge ${t.status === 'Resolved' ? 'badge-emerald' : 'badge-amber'}">${esc(t.status)}</span>
                <div style="font-size:11px;color:var(--ink-tertiary);margin-top:4px;">${formatDateDisplay(t.date)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function setDeviceFilter(filter) {
  state.deviceFilter = filter;
  renderApp();
}

function submitServiceTicket(e) {
  e.preventDefault();
  const unitId = sanitizeId(document.getElementById('srvUnit')?.value || '');
  const issue = sanitizeText(document.getElementById('srvIssue')?.value || '', 80);
  const notes = sanitizeText(document.getElementById('srvNotes')?.value || '', 500);
  const unit = (state.publicUnits || []).find(u => u.id === unitId);
  if (!unit || !notes) return;

  const newTicket = {
    id: 'SRV-' + Math.floor(1000 + Math.random() * 9000),
    unitId: unit.id,
    unitName: `${unit.customerName} (${unit.modelName})`,
    issue,
    notes,
    status: 'Scheduled',
    date: shiftDaysIso(0)
  };
  state.tickets.unshift(newTicket);
  saveState();
  renderApp();
  showToast(`Service request ${newTicket.id} logged`);
}

/* =========================================================================
   PAGE 3: AQUAVAULT ECOSYSTEM / APPS HUB (hub.html)
   - Synced with index.html Ecosystem Hub & Firestore `hubApps`
   ========================================================================= */
function renderHub() {
  const adminCfg = loadAdminOverrides();
  const items = (adminCfg.hubApps || getDefaultHubApps()).filter(a => a.enabled !== false);
  const categories = ['All', 'Website', 'New App', 'Tool'];
  const q = (state.hubSearch || '').trim().toLowerCase();

  const filtered = items.filter(item => {
    const catMatch = state.hubCategory === 'All' || item.category === state.hubCategory;
    const searchMatch = !q || item.name.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q);
    return catMatch && searchMatch;
  });

  return `
    <div class="page-header">
      <div>
        <div class="page-eyebrow">${ic('grid')} Connected Ecosystem</div>
        <h1 class="page-title serif">AquaVault Ecosystem &amp; Apps Hub</h1>
        <p class="page-desc">Launch SellGst-Pro, official AquaVault web portals, and water engineering utilities in 1 click.</p>
      </div>
      <div class="pill-tabs">
        ${categories.map(c => `
          <button class="pill-tab ${state.hubCategory === c ? 'active' : ''}" onclick="setHubCategory('${c}')">${c}</button>
        `).join('')}
      </div>
    </div>

    <div class="card" style="margin-bottom:18px;padding:14px 18px;">
      <div style="display:flex;gap:10px;align-items:center;">
        ${ic('search')}
        <input
          id="hubSearchInput"
          type="search"
          class="input"
          style="border:none;background:transparent;padding:4px;"
          placeholder="Search apps, websites, or tools (e.g., SellGst-Pro, Tank Volume, Solar)..."
          value="${esc(state.hubSearch)}"
          oninput="updateHubSearch(this.value)"
        />
      </div>
    </div>

    <div class="hub-grid">
      ${filtered.map(item => {
        const badgeClass = item.category === 'Website' ? 'badge-purple' : item.category === 'New App' ? 'badge-emerald' : 'badge-amber';
        const safeUrl = /^https:\/\//i.test(String(item.url || '').trim()) ? String(item.url).trim() : 'https://www.google.com';
        return `
          <div class="hub-app-card">
            <div class="hub-app-top">
              <div class="hub-icon-box">${ic(item.icon || 'globe')}</div>
              <span class="badge ${badgeClass}">${esc(item.category)}</span>
            </div>
            <div>
              <div class="hub-app-title">${esc(item.name)}</div>
              <p class="hub-app-desc" style="margin-top:4px;">${esc(item.desc)}</p>
            </div>
            <div style="margin-top:auto;padding-top:6px;">
              <a href="${esc(safeUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="width:100%;justify-content:space-between;">
                <span>Open in New Tab</span>
                ${ic('external')}
              </a>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function setHubCategory(cat) {
  state.hubCategory = cat;
  renderApp();
}

function updateHubSearch(val) {
  state.hubSearch = sanitizeText(val, 100);
  renderApp();
  const inp = document.getElementById('hubSearchInput');
  if (inp) {
    inp.focus();
    try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch {}
  }
}

/* =========================================================================
   PAGE 4: DPDP ACT 2023 PRIVACY & PUBLIC DATA SEPARATION (privacy.html)
   ========================================================================= */
function renderPrivacy() {
  const d = state.dpdp;
  return `
    <div class="page-header">
      <div>
        <div class="page-eyebrow">${ic('lock')} Digital Personal Data Protection Act (India)</div>
        <h1 class="page-title serif">Privacy &amp; Anti-Hacker Architecture</h1>
        <p class="page-desc">Strict separation between the public warranty directory and private Admin-only customer contacts &amp; bills.</p>
      </div>
      <span class="badge badge-emerald">${ic('check')} Zero Phone / Bill Leak</span>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Public vs. Private Data Isolation</h2>
            <p class="card-subtitle">Enforced server-side by Firebase Firestore Security Rules</p>
          </div>
        </div>

        <div class="consent-row">
          <div>
            <div style="font-weight:700;font-size:13.5px;">Public Directory (<code>public_units</code>)</div>
            <div style="font-size:12px;color:var(--ink-secondary);">Contains ONLY Customer Name, Model Name, Quantity, and Warranty Dates.</div>
          </div>
          <span class="badge badge-emerald">Public Read-Only</span>
        </div>

        <div class="consent-row">
          <div>
            <div style="font-weight:700;font-size:13.5px;">Customer Contacts (<code>private_customers</code>)</div>
            <div style="font-size:12px;color:var(--ink-secondary);">Mobile Numbers &amp; Home Addresses are locked strictly to verified Admin UID.</div>
          </div>
          <span class="badge badge-purple">Admin UID Locked</span>
        </div>

        <div class="consent-row">
          <div>
            <div style="font-weight:700;font-size:13.5px;">Generated Bills (<code>private_invoices</code> + Google Drive)</div>
            <div style="font-size:12px;color:var(--ink-secondary);">All GST bills are private to Admin and archived permanently in Google Drive.</div>
          </div>
          <span class="badge badge-purple">Admin UID Locked</span>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">DPDP Consent &amp; Preferences</h2>
            <p class="card-subtitle">Granular browser &amp; theme controls</p>
          </div>
        </div>

        <div class="consent-row">
          <div>
            <div style="font-weight:700;font-size:13.5px;">Warranty Countdown Alerts</div>
            <div style="font-size:12px;color:var(--ink-secondary);">Highlight units when remaining warranty drops below 45 days</div>
          </div>
          <button class="switch ${d.warrantyAlertConsent ? 'on' : ''}" onclick="toggleDpdpSwitch('warrantyAlertConsent')" aria-label="Toggle Warranty Alerts"></button>
        </div>

        <div class="consent-row">
          <div>
            <div style="font-weight:700;font-size:13.5px;">Appearance Theme</div>
            <div style="font-size:12px;color:var(--ink-secondary);">Current: ${state.theme === 'dark' ? 'Night Mode (Obsidian Black + Luminous Violet)' : 'Day Mode (Porcelain White + Royal Purple)'}</div>
          </div>
          <button class="btn btn-sm btn-soft" onclick="toggleTheme()">Switch Theme</button>
        </div>
      </div>
    </div>
  `;
}

function toggleDpdpSwitch(key) {
  state.dpdp[key] = !state.dpdp[key];
  saveState();
  renderApp();
  showToast('Privacy preference updated');
}

/* =========================================================================
   MAIN RENDER DISPATCHER
   ========================================================================= */
function renderApp() {
  const root = document.getElementById('appRoot');
  if (!root) return;

  const page = getCurrentPage();
  let content = '';
  switch (page) {
    case 'devices': content = renderDevices(); break;
    case 'invoice':
      content = typeof window.renderInvoiceGeneratorPage === 'function'
        ? window.renderInvoiceGeneratorPage()
        : '<div class="card">Loading Admin Invoice Studio...</div>';
      break;
    case 'hub': content = renderHub(); break;
    case 'privacy': content = renderPrivacy(); break;
    case 'home':
    default: content = renderHome(); break;
  }

  root.innerHTML = renderShell(page, content);
  startPwaPopupTimerIfNeeded();
}

/* Expose global handlers */
Object.assign(window, {
  toggleTheme,
  shareLandingPage,
  updatePublicCustomerSearch,
  setPublicFilterType,
  selectPublicUnitForGauge,
  setDeviceFilter,
  submitServiceTicket,
  setHubCategory,
  updateHubSearch,
  toggleDpdpSwitch,
  dismissPwaInstallBanner,
  triggerPwaInstallAction,
  showToast,
  formatDateDisplay,
  esc,
  ic,
  getAppState: () => state,
  saveAppState: saveState,
  getCloudState: () => ({ ...cloud, db, auth, fbSdk }),
  AUTHORIZED_ADMIN_UID
});

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(state.theme);
  renderApp();
  initPublicFirebaseSafely();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js?v=10').catch(() => {});
  }
});
