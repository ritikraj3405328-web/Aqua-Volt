/* =========================================================================
   AGNI VOLT ELECTRONIC — AUTOMATED WATER LEVEL CONTROLLER PWA
   - Exact Day/Night Theme & UI Design Preserved
   - Strict Public vs Private Separation:
     * Reads public `businessConfig/main`, `public_units` (maskedPhone only),
       `public_reviews` (4★ & 5★ only, zero phone numbers), `appConfig/global`, `hubApps`
     * Writes ALL reviews (1–5★ + phone) to Admin-only `private_reviews`
     * Writes 4★ & 5★ reviews (zero phone) to `public_reviews`
     * Writes visitor service requests to Admin-only `private_service_requests`
   - Admin-Only Guard on invoice.html (UID: Y8zmDKBgubWIVvhufftRPPjG7HC3)
   ========================================================================= */

const STORAGE_KEY = 'aquavault_luxury_state_v2';
const ADMIN_CONFIG_KEY = 'aquavault_admin_config_v1';
const BUSINESS_CONFIG_CACHE_KEY = 'agnivolt_business_config_cache_v11';
const PUBLIC_UNITS_CACHE_KEY = 'aquavault_public_units_cache_v11';
const PUBLIC_REVIEWS_CACHE_KEY = 'agnivolt_public_reviews_cache_v11';
const PWA_POPUP_SEEN_KEY = 'aquavault_pwa_popup_seen_v3';
const AUTHORIZED_ADMIN_UID = 'Y8zmDKBgubWIVvhufftRPPjG7HC3';

const ROUTES = [
  { id: 'home', href: 'index.html', label: 'Agni Volt Home', shortLabel: 'Home', icon: 'home', dock: true },
  { id: 'devices', href: 'devices.html', label: 'Products & Service', shortLabel: 'Products', icon: 'cpu', dock: true },
  { id: 'hub', href: 'hub.html', label: 'Apps Hub', shortLabel: 'Apps Hub', icon: 'grid', dock: true },
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
  gauge: `<svg class="icon" viewBox="0 0 24 24"><path d="M4.5 16.5a8 8 0 1 1 15 0"/><path d="M12 12l4-4"/><circle cx="12" cy="13" r="1.5"/></svg>`,
  star: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8l-5.8 3.1 1.1-6.5L2.6 9.8l6.5-.9L12 3z"/></svg>`,
  phone: `<svg class="icon" viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 1.9z"/></svg>`,
  mapPin: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 1 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.2"/></svg>`,
  message: `<svg class="icon" viewBox="0 0 24 24"><path d="M21 12a8.5 8.5 0 0 1-8.5 8.5c-1.4 0-2.8-.3-4-.9L3 21l1.4-4.5A8.5 8.5 0 1 1 21 12z"/></svg>`
};

/* =========================================================================
   XSS, SANITIZATION & MASKING HELPERS
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

function safeHttpsUrl(url) {
  const s = String(url || '').trim();
  return /^https:\/\//i.test(s) ? s.slice(0, 500) : '';
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

function formatINR(num) {
  return '₹' + Math.abs(Number(num) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

/* =========================================================================
   DYNAMIC BUSINESS CONFIG & PRODUCT CATALOG (SYNCED WITH ADMIN SETTINGS)
   ========================================================================= */
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

function saveBusinessConfigCache(cfg) {
  try {
    localStorage.setItem(BUSINESS_CONFIG_CACHE_KEY, JSON.stringify(cfg));
  } catch {}
}

/* =========================================================================
   HUB APPS & ADMIN OVERRIDES
   ========================================================================= */
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
      name: 'AGNI VOLT Customer Live Portal',
      category: 'Website',
      desc: 'Live active customer warranty showcase for AGNI VOLT ELECTRONIC Water Level Controllers & Stoppers.',
      url: 'https://ritikraj3405328-web.github.io/Aqua-Volt/',
      icon: 'globe',
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
      businessName: 'AGNI VOLT ELECTRONIC',
      businessAddress: '',
      businessPhone: '',
      businessEmail: '',
      paymentDetails: '',
      gstPercent: 18,
      palette: 'violet',
      frameStyle: 'colorful'
    },
    hubApps: getDefaultHubApps()
  };
  try {
    const raw = localStorage.getItem(ADMIN_CONFIG_KEY);
    if (!raw) return def;
    const parsed = JSON.parse(raw);
    const mergedHub = Array.isArray(parsed.hubApps) && parsed.hubApps.length ? parsed.hubApps : def.hubApps;
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
   PUBLIC UNITS (CUSTOMER LIVE — MASKED PHONE ONLY, ZERO SENSITIVE PII)
   ========================================================================= */
function sanitizePublicUnitRecord(raw, idx = 0) {
  const hwRaw = String(raw?.hardwareType || raw?.type || 'Water Level Controller');
  const isStopper = hwRaw.toLowerCase().includes('stopper');
  const expiryDate = sanitizeText(raw?.expiryDate || shiftDaysIso(365), 20);
  const installDate = sanitizeText(raw?.installDate || shiftDaysIso(0), 20);
  return {
    id: sanitizeId(raw?.id || ('pub_' + idx)),
    customerName: sanitizeText(raw?.customerName || raw?.clientName || 'Verified Customer', 120),
    maskedPhone: maskPhoneDisplay(raw?.maskedPhone || ''),
    modelName: sanitizeText(raw?.modelName || raw?.model || 'AgniVolt Water Level Controller', 140),
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
      if (Array.isArray(parsed)) {
        return parsed.map((u, i) => sanitizePublicUnitRecord(u, i));
      }
    }
  } catch {}
  return [];
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
   PUBLIC REVIEWS CACHE (STRICTLY 4★ & 5★, ZERO PHONE NUMBERS)
   ========================================================================= */
function sanitizePublicReview(raw, idx = 0) {
  const rating = Math.max(1, Math.min(5, parseInt(raw?.rating, 10) || 5));
  return {
    id: sanitizeId(raw?.id || ('rev_' + idx)),
    customerName: sanitizeText(raw?.customerName || 'Customer', 100),
    rating,
    message: sanitizeText(raw?.message || '', 1000),
    productName: sanitizeText(raw?.productName || 'Water Level Controller', 140),
    verified: Boolean(raw?.verified),
    createdAtMs: Number(raw?.createdAtMs) || Date.now()
  };
}

function loadCachedPublicReviews() {
  try {
    const raw = localStorage.getItem(PUBLIC_REVIEWS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((r, i) => sanitizePublicReview(r, i)).filter(r => r.rating >= 4);
      }
    }
  } catch {}
  return [];
}

function saveCachedPublicReviews(list) {
  try {
    const clean = (list || [])
      .map((r, i) => sanitizePublicReview(r, i))
      .filter(r => r.rating >= 4);
    localStorage.setItem(PUBLIC_REVIEWS_CACHE_KEY, JSON.stringify(clean));
  } catch {}
}

/* =========================================================================
   LOCAL UI STATE & FIREBASE PUBLIC SYNC
   ========================================================================= */
function getInitialState() {
  return {
    theme: 'light',
    selectedUnitId: '',
    publicSearchQuery: '',
    // Default to ACTIVE so expired warranties are auto-hidden on the public Customer Live list
    publicFilterType: 'ACTIVE', // 'ACTIVE' | 'CONTROLLER' | 'STOPPER' | 'EXPIRED' | 'ALL'
    deviceFilter: 'all',
    hubCategory: 'All',
    hubSearch: '',
    reviewRating: 5,
    reviewNotice: '',
    reviewBusy: false,
    dpdp: {
      consentGranted: true,
      consentTimestamp: 'DPDP 2023 Compliant',
      telemetryConsent: true,
      warrantyAlertConsent: true
    },
    businessConfig: loadBusinessConfig(),
    publicUnits: loadCachedPublicUnits(),
    publicReviews: loadCachedPublicReviews(),
    mySubmittedTickets: []
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
      selectedUnitId: parsed.selectedUnitId || '',
      dpdp: { ...fallback.dpdp, ...(parsed.dpdp || {}) },
      mySubmittedTickets: Array.isArray(parsed.mySubmittedTickets) ? parsed.mySubmittedTickets : []
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
  liveUnitsSynced: false,
  reviewsSynced: false
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
      mySubmittedTickets: state.mySubmittedTickets.slice(0, 10)
    }));
  } catch {}
}

async function initPublicFirebaseSafely() {
  if (fbSdk && db) return true;
  let cfg = null;
  let dbId = '(default)';
  try {
    const mod = await import('./firebase-config.js?v=11');
    if (mod?.firebaseConfig && mod.firebaseConfig.apiKey) {
      cfg = mod.firebaseConfig;
    }
    if (mod?.firestoreDatabaseId) {
      dbId = mod.firestoreDatabaseId;
    }
  } catch {}

  if (!cfg || !cfg.apiKey) {
    cloud.checkingInvoiceAuth = false;
    if (getCurrentPage() === 'invoice') renderApp();
    return false;
  }

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

    fbSdk.onAuthStateChanged(auth, (user) => {
      cloud.user = user || null;
      cloud.isAdmin = Boolean(user && user.uid === AUTHORIZED_ADMIN_UID);
      cloud.checkingInvoiceAuth = false;
      if (getCurrentPage() === 'invoice') {
        renderApp();
      }
    });

    await fetchPublicDataFromFirestore();
    return true;
  } catch (err) {
    console.warn('Public Firebase sync running in offline cache mode:', err?.message || err);
    cloud.checkingInvoiceAuth = false;
    if (getCurrentPage() === 'invoice') renderApp();
    return false;
  }
}

async function fetchPublicDataFromFirestore() {
  if (!db || !fbSdk) return;

  // 1. Dynamic Business & App Settings (`businessConfig/main`)
  try {
    const bizSnap = await fbSdk.getDoc(fbSdk.doc(db, 'businessConfig', 'main'));
    if (bizSnap.exists()) {
      const def = getDefaultBusinessConfig();
      const d = bizSnap.data();
      const mergedBiz = {
        ...def,
        ...d,
        products: Array.isArray(d.products) && d.products.length ? d.products : def.products
      };
      state.businessConfig = mergedBiz;
      saveBusinessConfigCache(mergedBiz);
    }
  } catch (err) {
    console.warn('businessConfig fetch fallback:', err?.message || err);
  }

  // 2. Live Public Units (`public_units` — contains ONLY maskedPhone, no raw phones/addresses/bills)
  try {
    const snap = await fbSdk.getDocs(fbSdk.collection(db, 'public_units'));
    const list = [];
    snap.forEach((docSnap) => {
      list.push(sanitizePublicUnitRecord({ id: docSnap.id, ...docSnap.data() }, list.length));
    });
    list.sort((a, b) => {
      const remA = getPublicUnitMetrics(a).remainingDays;
      const remB = getPublicUnitMetrics(b).remainingDays;
      if (remA > 0 && remB === 0) return -1;
      if (remA === 0 && remB > 0) return 1;
      return b.installDate.localeCompare(a.installDate) || a.customerName.localeCompare(b.customerName);
    });
    state.publicUnits = list;
    saveCachedPublicUnits(list);
    const activeFirst = list.find(u => getPublicUnitMetrics(u).remainingDays > 0) || list[0];
    if (!state.publicUnits.some(u => u.id === state.selectedUnitId)) {
      state.selectedUnitId = activeFirst ? activeFirst.id : '';
    }
    cloud.liveUnitsSynced = true;
  } catch (err) {
    console.warn('public_units fetch fallback:', err?.message || err);
  }

  // 3. Public 4★ & 5★ Reviews (`public_reviews`, filtered server-side by rating >= 4)
  try {
    const revQ = fbSdk.query(
      fbSdk.collection(db, 'public_reviews'),
      fbSdk.where('rating', '>=', 4)
    );
    const revSnap = await fbSdk.getDocs(revQ);
    const reviews = [];
    revSnap.forEach((s) => {
      const d = s.data();
      const ms = d.createdAt?.toMillis ? d.createdAt.toMillis() : Date.now();
      reviews.push(sanitizePublicReview({ id: s.id, ...d, createdAtMs: ms }, reviews.length));
    });
    reviews.sort((a, b) => b.createdAtMs - a.createdAtMs);
    state.publicReviews = reviews.filter(r => r.rating >= 4);
    saveCachedPublicReviews(state.publicReviews);
    cloud.reviewsSynced = true;
  } catch (err) {
    console.warn('public_reviews fetch fallback:', err?.message || err);
  }

  // 4. Public Hub Apps (`hubApps`)
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

  // 5. Public App Config (`appConfig/global`)
  try {
    const cfgSnap = await fbSdk.getDoc(fbSdk.doc(db, 'appConfig', 'global'));
    if (cfgSnap.exists()) {
      const d = cfgSnap.data();
      const cfg = loadAdminOverrides();
      cfg.features = {
        warranty: d.featureWarranty !== false,
        devices: d.featureDevices !== false,
        invoice: d.featureInvoice !== false,
        hub: d.featureHub !== false,
        privacy: d.featurePrivacy !== false,
        pwaPopup: d.featurePwaPopup !== false
      };
      cfg.maintenanceMode = Boolean(d.maintenanceMode);
      cfg.maintenanceMessage = d.maintenanceMessage || cfg.maintenanceMessage;
      cfg.announcementActive = Boolean(d.announcementActive);
      cfg.announcementText = d.announcementText || cfg.announcementText;
      localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(cfg));
    }
  } catch {}

  renderApp();
}

/* =========================================================================
   THEME, SHARE & TOAST HELPERS
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
  showToast(state.theme === 'dark' ? 'Night Mode Activated' : 'Day Mode Activated');
}

async function shareLandingPage() {
  const biz = state.businessConfig || getDefaultBusinessConfig();
  const shareUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, 'index.html');
  const shareData = {
    title: `${biz.businessName} — Automated Water Level Controller & Customer Live`,
    text: `Explore Automated Water Level Controllers, live active customer warranties, and verified 4★–5★ reviews by ${biz.businessName}:`,
    url: shareUrl
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      showToast('Page link shared!');
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
    }
  }

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard!');
      return;
    }
  } catch {}

  const tempInput = document.createElement('input');
  tempInput.value = shareUrl;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  tempInput.remove();
  showToast('Link copied to clipboard!');
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
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3400);
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
  showToast('Tap Browser Menu → "Add to Home Screen" to install AGNI VOLT ELECTRONIC');
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
  const biz = state.businessConfig || getDefaultBusinessConfig();
  return `
    <div id="pwaInstallToast" class="pwa-install-toast" role="status" aria-live="polite">
      <div class="pwa-toast-icon">
        <img src="assets/app-icon.jpg" alt="${esc(biz.businessName)}" width="38" height="38" />
      </div>
      <div class="pwa-toast-copy">
        <div class="pwa-toast-title">Install ${esc(biz.businessName)}</div>
        <div class="pwa-toast-sub">Automated Water Level Controller &amp; Customer Live App</div>
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
   SHARED APP SHELL
   ========================================================================= */
function renderShell(activePage, mainContentHtml) {
  const isDark = state.theme === 'dark';
  const adminCfg = loadAdminOverrides();
  const biz = state.businessConfig || getDefaultBusinessConfig();
  const activeCount = (state.publicUnits || []).filter(u => getPublicUnitMetrics(u).remainingDays > 0).length;

  const visibleRoutes = ROUTES.filter(r => {
    if (r.id === 'devices' && !adminCfg.features.devices) return false;
    if (r.id === 'hub' && !adminCfg.features.hub) return false;
    if (r.id === 'privacy' && !adminCfg.features.privacy) return false;
    return true;
  });
  const dockRoutes = visibleRoutes.filter(r => r.dock);

  const announcementBannerHtml = adminCfg.announcementActive && adminCfg.announcementText ? `
    <div style="background:linear-gradient(135deg, var(--primary), #4C1D95);color:#FFFFFF;padding:10px 16px;border-radius:14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12.5px;font-weight:600;box-shadow:var(--shadow-purple);">
      <div style="display:flex;align-items:center;gap:8px;min-width:0;">
        <span style="background:rgba(255,255,255,0.2);padding:3px 8px;border-radius:999px;font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;flex-shrink:0;">Live Update</span>
        <span>${esc(adminCfg.announcementText)}</span>
      </div>
    </div>
  ` : '';

  const maintenanceScreenHtml = adminCfg.maintenanceMode ? `
    <div class="card" style="text-align:center;padding:38px 22px;margin:18px 0;border:1.5px solid var(--primary);">
      <div class="badge badge-purple" style="margin-bottom:12px;">${ic('shield')} Scheduled Maintenance</div>
      <h1 class="page-title serif" style="margin-bottom:10px;">${esc(biz.businessName)} Upgrade in Progress</h1>
      <p style="font-size:14px;color:var(--ink-secondary);max-width:520px;margin:0 auto 18px;line-height:1.6;">
        ${esc(adminCfg.maintenanceMessage || 'System upgrade in progress. Please check back shortly.')}
      </p>
    </div>
  ` : '';

  return `
    ${renderPwaInstallPopup()}
    <div class="app-shell">
      <aside class="sidebar" aria-label="Primary Navigation">
        <a href="index.html" class="brand-lockup">
          <div class="brand-emblem">
            <img src="assets/app-icon.jpg" alt="${esc(biz.businessName)}" width="40" height="40" />
          </div>
          <div class="brand-titles">
            <span class="brand-name">${esc(biz.businessName)}</span>
            <span class="brand-tag">Water Level Controller</span>
          </div>
        </a>

        <div class="nav-section-label">Navigation</div>
        <nav class="sidebar-nav">
          ${visibleRoutes.map(r => `
            <a href="${r.href}" class="nav-link ${activePage === r.id ? 'active' : ''}">
              ${ic(r.icon)}
              <span>${r.label}</span>
            </a>
          `).join('')}
          ${activePage === 'home' ? `
            <a href="#productsCatalogSection" class="nav-link">${ic('bolt')}<span>Controllers &amp; Prices</span></a>
            <a href="#customerLiveSection" class="nav-link">${ic('shield')}<span>Customer Live (${activeCount})</span></a>
            <a href="#customerReviewsSection" class="nav-link">${ic('star')}<span>Reviews (${biz.googleRating}★)</span></a>
            <a href="#contactMapsSection" class="nav-link">${ic('mapPin')}<span>Contact &amp; Maps</span></a>
          ` : ''}
        </nav>

        <div class="sidebar-footer">
          <div class="customer-mini-card">
            <div class="mini-label">Customer Live Trust</div>
            <div class="mini-name">${esc(biz.businessName)}</div>
            <div class="mini-id" style="color:var(--emerald);">${activeCount} Active Warranties &bull; ${esc(biz.googleRating)}★</div>
            <div style="margin-top:10px;display:flex;flex-direction:column;gap:7px;">
              <button type="button" class="btn btn-sm btn-primary" style="width:100%;" onclick="shareLandingPage()">
                ${ic('share')} Share Business App
              </button>
              <a href="admin/" class="btn btn-sm btn-outline" style="width:100%;text-decoration:none;">
                ${ic('lock')} Admin Console
              </a>
            </div>
          </div>
        </div>
      </aside>

      <div class="main-column">
        <header class="topbar">
          <div class="topbar-inner">
            <div class="topbar-left">
              <a href="index.html" class="mobile-brand-chip" aria-label="${esc(biz.businessName)} Home">
                <img src="assets/app-icon.jpg" alt="${esc(biz.businessName)}" width="36" height="36" />
              </a>
              <div class="status-pill">
                <span class="status-dot"></span>
                <span>${esc(biz.businessName)} &bull; Water Level Controller</span>
              </div>
            </div>
            <div class="topbar-actions">
              <button type="button" class="btn btn-sm btn-primary" onclick="shareLandingPage()" title="Share this page">
                ${ic('share')} <span class="btn-label-hide-xs">Share</span>
              </button>
              <button class="theme-toggle-btn" onclick="toggleTheme()" aria-label="Toggle Day/Night Mode">
                ${isDark ? ic('sun') : ic('moon')}
                <span>${isDark ? 'Day' : 'Night'}</span>
              </button>
            </div>
          </div>
        </header>

        <main class="page-container">
          <nav class="mobile-feature-strip" aria-label="Quick Sections">
            ${visibleRoutes.map(r => `
              <a href="${r.href}" class="feature-strip-pill ${activePage === r.id ? 'active' : ''}">
                ${ic(r.icon)}
                <span>${r.shortLabel}</span>
              </a>
            `).join('')}
            ${activePage === 'home' ? `
              <a href="#customerLiveSection" class="feature-strip-pill">${ic('shield')} <span>Customer Live</span></a>
              <a href="#customerReviewsSection" class="feature-strip-pill">${ic('star')} <span>Reviews</span></a>
            ` : ''}
            <button type="button" class="feature-strip-pill" onclick="shareLandingPage()" style="border:1px solid var(--border-strong);background:var(--primary-soft);color:var(--primary);font-weight:700;">
              ${ic('share')}
              <span>Share</span>
            </button>
          </nav>

          ${announcementBannerHtml}
          ${adminCfg.maintenanceMode ? maintenanceScreenHtml : mainContentHtml}
        </main>
      </div>

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
   CONTACT LINK HELPERS
   ========================================================================= */
function buildWhatsappEnquiryLink(biz, productName = '') {
  const digits = String(biz.whatsappNumber || biz.businessPhone || '').replace(/\D/g, '');
  if (!digits || digits.length < 10) return '';
  const withCountry = digits.length === 10 ? ('91' + digits) : digits;
  const text = encodeURIComponent(
    productName
      ? `Hello ${biz.businessName}, I would like pricing and installation details for: ${productName}.`
      : `Hello ${biz.businessName}, I am interested in your Automated Water Level Controller.`
  );
  return `https://wa.me/${withCountry}?text=${text}`;
}

function buildTelLink(phoneStr) {
  const clean = String(phoneStr || '').replace(/[^\d+]/g, '');
  return clean.length >= 6 ? `tel:${clean}` : '';
}

/* =========================================================================
   PAGE 1: AGNI VOLT ELECTRONIC FRONT PAGE (index.html)
   ========================================================================= */
function renderHome() {
  const biz = state.businessConfig || getDefaultBusinessConfig();
  const units = state.publicUnits || [];
  const activeUnits = units.filter(u => getPublicUnitMetrics(u).remainingDays > 0);
  const expiredUnits = units.filter(u => getPublicUnitMetrics(u).remainingDays === 0);
  const totalActiveQty = activeUnits.reduce((acc, u) => acc + (Number(u.quantity) || 1), 0);

  const products = (biz.products || []).filter(p => p && p.enabled !== false);
  const publicReviews = (state.publicReviews || []).filter(r => r.rating >= 4);

  const selectedUnit = activeUnits.find(u => u.id === state.selectedUnitId)
    || units.find(u => u.id === state.selectedUnitId)
    || activeUnits[0]
    || units[0];
  const selMetrics = selectedUnit ? getPublicUnitMetrics(selectedUnit) : null;

  // Customer Live filtering (defaults to ACTIVE so expired units stay auto-hidden)
  const q = (state.publicSearchQuery || '').trim().toLowerCase();
  const filteredUnits = units.filter(u => {
    const m = getPublicUnitMetrics(u);
    if (state.publicFilterType === 'ACTIVE' && m.remainingDays === 0) return false;
    if (state.publicFilterType === 'CONTROLLER' && (m.remainingDays === 0 || !u.hardwareType.toLowerCase().includes('controller'))) return false;
    if (state.publicFilterType === 'STOPPER' && (m.remainingDays === 0 || !u.hardwareType.toLowerCase().includes('stopper'))) return false;
    if (state.publicFilterType === 'EXPIRED' && m.remainingDays > 0) return false;
    if (!q) return true;
    return (
      u.customerName.toLowerCase().includes(q) ||
      u.modelName.toLowerCase().includes(q) ||
      u.hardwareType.toLowerCase().includes(q) ||
      (u.maskedPhone || '').toLowerCase().includes(q)
    );
  });

  const radius = 84;
  const circumference = +(2 * Math.PI * radius).toFixed(2);
  const dashOffset = selMetrics
    ? +(circumference - (selMetrics.pctRemaining / 100) * circumference).toFixed(2)
    : circumference;

  const adminCfg = loadAdminOverrides();
  const hubApps = (adminCfg.hubApps || getDefaultHubApps()).filter(a => a.enabled !== false);
  const waHref = buildWhatsappEnquiryLink(biz);
  const callHref = buildTelLink(biz.businessPhone || biz.personalPhone);
  const mapsHref = safeHttpsUrl(biz.googleMapsUrl);
  const googleRevHref = safeHttpsUrl(biz.googleReviewLink || biz.googleMapsUrl);

  return `
    <!-- 1. HERO SHOWCASE: INSTANTLY CLEAR AUTOMATED WATER LEVEL CONTROLLER BY AGNI VOLT ELECTRONIC -->
    <section class="hero-banner">
      <div class="hero-grid">
        <div>
          <div class="hero-pill">
            ${ic('bolt')}
            <span>${esc(biz.businessName)} &bull; Automated Water Level Controller</span>
          </div>
          <h1 class="hero-title serif">
            Automated Water Level Controllers &amp; <em>Smart Pump Protection.</em>
          </h1>
          <p class="hero-subtitle">
            ${esc(biz.aboutText)}
          </p>
          <div class="hero-actions">
            <a href="#customerLiveSection" class="btn btn-white">
              ${ic('shield')} Customer Live (${activeUnits.length})
            </a>
            <a href="#productsCatalogSection" class="btn btn-glass">
              ${ic('cpu')} View Models &amp; Prices
            </a>
            ${waHref ? `
              <a href="${esc(waHref)}" target="_blank" rel="noopener noreferrer" class="btn btn-glass">
                ${ic('message')} WhatsApp Enquiry
              </a>
            ` : callHref ? `
              <a href="${esc(callHref)}" class="btn btn-glass">
                ${ic('phone')} Call Now
              </a>
            ` : `
              <button type="button" class="btn btn-glass" onclick="shareLandingPage()">
                ${ic('share')} Share Page
              </button>
            `}
          </div>
        </div>
        <div class="hero-visual-card">
          <img src="assets/hero-controller.jpg" alt="${esc(biz.businessName)} Automated Water Level Controller" />
          <div class="hero-overlay-caption">
            <div>
              <div style="font-size:11px;font-weight:700;opacity:0.8;text-transform:uppercase;letter-spacing:0.08em;">Customer Live Social Proof</div>
              <div style="font-size:14px;font-weight:800;">${activeUnits.length} Active Warranties &bull; ${esc(biz.googleRating)}★ Google Rating</div>
            </div>
            <span class="badge badge-emerald">Privacy Masked</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. KPI SUMMARY ROW -->
    <section class="stats-grid" aria-label="Business & Customer Live Metrics">
      <div class="stat-card">
        <div class="stat-label">Google Rating</div>
        <div class="stat-value mono">${esc(biz.googleRating)} ★</div>
        <div class="stat-foot">
          <span class="badge badge-amber">${esc(biz.googleReviewCount || 'Verified Rating')}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Customer Live</div>
        <div class="stat-value mono">${activeUnits.length} Active</div>
        <div class="stat-foot">
          <span class="badge badge-emerald">${totalActiveQty} Live Units</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Product Models</div>
        <div class="stat-value mono">${products.length} Models</div>
        <div class="stat-foot">
          <span class="badge badge-purple">Auto Cut-Off</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Phone Privacy</div>
        <div class="stat-value">Masked</div>
        <div class="stat-foot">
          <span class="badge badge-emerald">Anti-Scraping Lock</span>
        </div>
      </div>
    </section>

    <!-- 3. DYNAMIC PRODUCT CATALOG & PRICING -->
    <section id="productsCatalogSection" class="card" style="margin-bottom:22px;">
      <div class="card-header">
        <div>
          <div class="page-eyebrow">${ic('cpu')} Official Product Lineup</div>
          <h2 class="card-title" style="font-size:20px;">Automated Water Level Controllers &amp; Stoppers</h2>
          <p class="card-subtitle">Live catalog managed by ${esc(biz.businessName)} with official warranty protection</p>
        </div>
        <a href="devices.html" class="btn btn-sm btn-soft">Service &amp; Specs ${ic('external')}</a>
      </div>

      <div class="products-grid">
        ${products.map(prod => {
          const prodWa = buildWhatsappEnquiryLink(biz, prod.name);
          const features = Array.isArray(prod.features) ? prod.features : [];
          return `
            <div class="product-card">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
                <span class="badge ${(prod.hardwareType || '').toLowerCase().includes('stopper') ? 'badge-amber' : 'badge-purple'}">
                  ${esc(prod.hardwareType || 'Water Level Controller')}
                </span>
                ${prod.badge ? `<span class="badge badge-emerald">${esc(prod.badge)}</span>` : ''}
              </div>
              <div>
                <h3 style="margin:0;font-size:16px;font-weight:800;color:var(--ink);line-height:1.25;">${esc(prod.name)}</h3>
                <p style="margin:5px 0 0;font-size:12.5px;color:var(--ink-secondary);line-height:1.45;">${esc(prod.description || '')}</p>
              </div>
              <div class="product-price-row">
                <span class="product-price mono">${formatINR(prod.price || 0)}</span>
                ${Number(prod.mrp) > Number(prod.price) ? `<span class="product-mrp mono">${formatINR(prod.mrp)}</span>` : ''}
                ${prod.warranty ? `<span class="badge badge-neutral">${esc(prod.warranty)}</span>` : ''}
              </div>
              ${features.length ? `
                <ul class="product-feature-list">
                  ${features.map(f => `<li>${ic('check')} <span>${esc(f)}</span></li>`).join('')}
                </ul>
              ` : ''}
              <div style="margin-top:auto;padding-top:6px;display:flex;gap:8px;flex-wrap:wrap;">
                ${prodWa ? `
                  <a href="${esc(prodWa)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary" style="flex:1;">
                    ${ic('message')} Order / Enquire
                  </a>
                ` : callHref ? `
                  <a href="${esc(callHref)}" class="btn btn-sm btn-primary" style="flex:1;">
                    ${ic('phone')} Call to Order
                  </a>
                ` : `
                  <a href="#contactMapsSection" class="btn btn-sm btn-soft" style="flex:1;">
                    ${ic('mapPin')} Contact Dealer
                  </a>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </section>

    <!-- 4. KEY TECHNICAL FEATURES -->
    <section class="card" style="margin-bottom:22px;">
      <div class="card-header">
        <div>
          <div class="page-eyebrow">${ic('bolt')} Why Choose ${esc(biz.businessName)}</div>
          <h2 class="card-title" style="font-size:20px;">Engineered for Zero Overflow &amp; Pump Safety</h2>
        </div>
      </div>
      <div class="features-grid">
        <div class="feature-card">
          <div class="device-type-icon">${ic('droplet')}</div>
          <div class="hub-app-title">Auto ON / OFF Tank Control</div>
          <p class="hub-app-desc">Automatically starts your motor when the tank goes low and cuts off power the instant it is full.</p>
        </div>
        <div class="feature-card">
          <div class="device-type-icon">${ic('bolt')}</div>
          <div class="hub-app-title">Dry-Run &amp; Surge Guard</div>
          <p class="hub-app-desc">Protects expensive submersible and monoblock pumps against dry sump pipes and voltage spikes.</p>
        </div>
        <div class="feature-card">
          <div class="device-type-icon">${ic('cpu')}</div>
          <div class="hub-app-title">SS 316 Rust-Proof Probes</div>
          <p class="hub-app-desc">Heavy-duty stainless steel and magnetic sensors built for hard water and zero scale buildup.</p>
        </div>
        <div class="feature-card">
          <div class="device-type-icon">${ic('shield')}</div>
          <div class="hub-app-title">Live Digital Warranty</div>
          <p class="hub-app-desc">Every invoice automatically activates a verifiable Customer Live warranty and permanent Drive bill record.</p>
        </div>
      </div>
    </section>

    <!-- 5. CUSTOMER LIVE TAB (ACTIVE WARRANTIES + MASKED PHONES + AUTO-HIDE EXPIRED) -->
    ${adminCfg.features.warranty !== false ? `
      <section id="customerLiveSection" class="card" style="margin-bottom:22px;">
        <div class="card-header">
          <div>
            <div class="page-eyebrow">${ic('shield')} Customer Live &bull; Active Warranties</div>
            <h2 class="card-title" style="font-size:20px;">Live Active Customers &amp; Warranty Tracker</h2>
            <p class="card-subtitle">
              Auto-synced from official ${esc(biz.businessName)} bills. Expired warranties auto-hide from the Active Live view; phone numbers are masked for privacy.
            </p>
          </div>
          <div class="rating-summary-pill">
            <span>★ ${esc(biz.googleRating)} / 5</span>
            <span>&bull;</span>
            <span>${esc(biz.googleReviewCount || 'Google Verified')}</span>
          </div>
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <div style="position:relative;flex:1;min-width:220px;">
            <input
              id="publicCustomerSearchInput"
              type="search"
              class="input"
              placeholder="Search customer name, masked phone, or model..."
              value="${esc(state.publicSearchQuery)}"
              oninput="updatePublicCustomerSearch(this.value)"
              style="padding-left:38px;"
            />
            <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--ink-tertiary);pointer-events:none;">
              ${ic('search')}
            </span>
          </div>
          <div class="pill-tabs" role="tablist" aria-label="Customer Live Filter">
            ${[
              ['ACTIVE', `Active Live (${activeUnits.length})`],
              ['CONTROLLER', 'Controllers'],
              ['STOPPER', 'Water Stoppers'],
              ['EXPIRED', `Expired (${expiredUnits.length})`],
              ['ALL', `All (${units.length})`]
            ].map(([key, label]) => `
              <button type="button" class="pill-tab ${state.publicFilterType === key ? 'active' : ''}" onclick="setPublicFilterType('${key}')">
                ${label}
              </button>
            `).join('')}
          </div>
        </div>

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
                style="cursor:pointer;flex-direction:column;justify-content:space-between;gap:12px;border:${isSelected ? '2px solid var(--primary)' : isExpired ? '1.5px solid rgba(225,29,72,0.35)' : '1px solid var(--border)'};"
              >
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;width:100%;">
                  <div style="min-width:0;">
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:5px;">
                      <span class="badge ${u.hardwareType.toLowerCase().includes('stopper') ? 'badge-amber' : 'badge-purple'}">
                        ${esc(u.hardwareType)}
                      </span>
                      <span class="badge badge-neutral mono">Qty: ${Number(u.quantity) || 1}</span>
                      ${u.maskedPhone && u.maskedPhone !== 'Hidden' ? `<span class="badge badge-neutral mono">${esc(u.maskedPhone)}</span>` : ''}
                    </div>
                    <div style="font-size:15.5px;font-weight:800;color:var(--ink);">
                      ${esc(u.customerName)}
                    </div>
                    <div style="font-size:12.5px;font-weight:600;color:var(--ink-secondary);margin-top:2px;">
                      ${esc(u.modelName)}
                    </div>
                  </div>

                  <div style="text-align:right;flex-shrink:0;">
                    ${isExpired ? `
                      <span class="badge badge-rose" style="font-weight:800;">Expired</span>
                    ` : `
                      <span class="badge ${m.statusBadge} mono" style="font-weight:800;">${m.remainingDays} Days Left</span>
                    `}
                  </div>
                </div>

                <div style="width:100%;">
                  <div class="progress-bar-track" style="height:7px;margin-bottom:8px;">
                    <div class="progress-bar-fill" style="width:${m.pctRemaining}%;background:${m.strokeColor};"></div>
                  </div>
                  <div style="display:flex;align-items:center;justify-content:space-between;font-size:11.5px;color:var(--ink-tertiary);gap:8px;flex-wrap:wrap;">
                    <span>Start: <strong class="mono">${formatDateDisplay(u.installDate)}</strong></span>
                    <span>Expiry: <strong class="mono">${formatDateDisplay(u.expiryDate)}</strong></span>
                  </div>
                </div>
              </div>
            `;
          }).join('') || `
            <div style="grid-column:1/-1;text-align:center;padding:28px 16px;color:var(--ink-secondary);font-size:13.5px;background:var(--surface-subtle);border-radius:16px;border:1px dashed var(--border-strong);">
              ${units.length === 0
                ? 'Active warranties appear here automatically as soon as AGNI VOLT ELECTRONIC issues a customer invoice with warranty dates.'
                : `No ${state.publicFilterType.toLowerCase()} records match "${esc(state.publicSearchQuery)}".`}
            </div>
          `}
        </div>
      </section>

      ${selectedUnit && selMetrics ? `
        <section class="grid-2" style="margin-bottom:22px;">
          <div class="card">
            <div class="card-header">
              <div>
                <h2 class="card-title">Warranty Ring &mdash; ${esc(selectedUnit.customerName)}</h2>
                <p class="card-subtitle">${esc(selectedUnit.modelName)} &bull; ${esc(selectedUnit.maskedPhone || 'Privacy Masked')}</p>
              </div>
              <span class="badge ${selMetrics.statusBadge}">${selMetrics.statusLabel}</span>
            </div>
            <div class="warranty-gauge-wrap">
              <div class="gauge-svg-box">
                <svg viewBox="0 0 210 210" width="210" height="210">
                  <circle class="gauge-track" cx="105" cy="105" r="${radius}"></circle>
                  <circle
                    class="gauge-progress"
                    cx="105"
                    cy="105"
                    r="${radius}"
                    stroke="${selMetrics.strokeColor}"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${dashOffset}"
                  ></circle>
                </svg>
                <div class="gauge-center">
                  <div class="gauge-days-num mono">${selMetrics.remainingDays}</div>
                  <div class="gauge-days-unit">${selMetrics.remainingDays === 0 ? 'Expired' : 'Days Left'}</div>
                  <div class="gauge-days-pct mono">${selMetrics.pctRemaining}% Active</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div>
                <h2 class="card-title">Warranty Timeline Trajectory</h2>
                <p class="card-subtitle">Automated day-by-day countdown until expiry</p>
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
                    <text x="${Math.min(405, Math.max(45, cx - 35))}" y="${Math.max(15, cy - 12)}" fill="var(--ink)" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700">${selMetrics.remainingDays === 0 ? 'EXPIRED (0d)' : `TODAY: ${selMetrics.remainingDays}d`}</text>
                  `;
                })()}
                <text x="36" y="148" fill="var(--ink-tertiary)" font-size="10" font-family="JetBrains Mono, monospace">START</text>
                <text x="412" y="148" fill="var(--ink-tertiary)" font-size="10" font-family="JetBrains Mono, monospace">EXPIRY (0d)</text>
              </svg>
            </div>

            <div class="warranty-meta-grid" style="margin-top:14px;">
              <div class="meta-tile">
                <div class="meta-tile-label">Warranty Start</div>
                <div class="meta-tile-val mono">${formatDateDisplay(selectedUnit.installDate)}</div>
              </div>
              <div class="meta-tile">
                <div class="meta-tile-label">Elapsed</div>
                <div class="meta-tile-val mono">${selMetrics.elapsedDays} Days</div>
              </div>
              <div class="meta-tile">
                <div class="meta-tile-label">Warranty Expiry</div>
                <div class="meta-tile-val mono">${formatDateDisplay(selectedUnit.expiryDate)}</div>
              </div>
            </div>
          </div>
        </section>
      ` : ''}
    ` : ''}

    <!-- 6. SMART CUSTOMER REVIEW SYSTEM (PUBLIC SHOWS ONLY 4★ & 5★; 1★–3★ PRIVATE TO ADMIN) -->
    <section id="customerReviewsSection" class="card" style="margin-bottom:22px;">
      <div class="card-header">
        <div>
          <div class="page-eyebrow">${ic('star')} Verified Customer Experiences</div>
          <h2 class="card-title" style="font-size:20px;">Customer Reviews &amp; Google Rating</h2>
          <p class="card-subtitle">Real customer feedback on ${esc(biz.businessName)} Water Level Controllers</p>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <div class="rating-summary-pill">
            <span>★ ${esc(biz.googleRating)}</span>
            <span>(${esc(biz.googleReviewCount || `${publicReviews.length} Reviews`)})</span>
          </div>
          ${googleRevHref ? `
            <a href="${esc(googleRevHref)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">
              Review on Google ${ic('external')}
            </a>
          ` : ''}
        </div>
      </div>

      <div class="grid-12" style="align-items:start;">
        <!-- Public 4★ & 5★ Reviews Feed -->
        <div>
          <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-tertiary);margin-bottom:10px;">
            Featured 4★ &amp; 5★ Customer Reviews (${publicReviews.length})
          </div>
          <div class="device-list">
            ${publicReviews.slice(0, 8).map(r => `
              <div class="review-card">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
                  <div>
                    <div style="font-size:14.5px;font-weight:800;color:var(--ink);">${esc(r.customerName)}</div>
                    <div style="font-size:11.5px;color:var(--ink-tertiary);">${esc(r.productName || 'Water Level Controller')}</div>
                  </div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span class="star-row" aria-label="${r.rating} out of 5 stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                    ${r.verified ? `<span class="badge badge-emerald">Verified</span>` : ''}
                  </div>
                </div>
                <p style="margin:0;font-size:13px;color:var(--ink-secondary);line-height:1.5;">
                  "${esc(r.message)}"
                </p>
              </div>
            `).join('') || `
              <div class="review-card" style="text-align:center;color:var(--ink-secondary);padding:24px;">
                Be the first to share your experience with ${esc(biz.businessName)}!
              </div>
            `}
          </div>
        </div>

        <!-- Write a Review Form -->
        <div class="card" style="background:var(--surface-subtle);">
          <div class="card-header" style="margin-bottom:12px;">
            <div>
              <h3 class="card-title" style="font-size:16px;">Share Your Product Review</h3>
              <p class="card-subtitle">Your phone number is stored privately for customer support and is never shown publicly.</p>
            </div>
          </div>

          ${state.reviewNotice ? `
            <div style="background:var(--emerald-soft);border:1px solid var(--emerald-border);color:var(--emerald);padding:10px 12px;border-radius:12px;font-size:12.5px;font-weight:700;margin-bottom:12px;">
              ${esc(state.reviewNotice)}
            </div>
          ` : ''}

          <form onsubmit="submitCustomerReview(event)">
            <div class="form-group">
              <label class="form-label" for="revName">Customer Name</label>
              <input id="revName" class="input" maxlength="100" placeholder="Enter your full name" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="revPhone">Phone Number (Private — Admin Support Only)</label>
              <input id="revPhone" class="input mono" type="tel" maxlength="25" placeholder="e.g. 98XXXXXXXX" required />
            </div>

            <div class="form-group">
              <label class="form-label">Star Rating (1 to 5 Stars)</label>
              <div class="star-picker" role="radiogroup" aria-label="Star rating">
                ${[1, 2, 3, 4, 5].map(st => `
                  <button
                    type="button"
                    class="star-pick-btn ${state.reviewRating === st ? 'active' : ''}"
                    onclick="setReviewRating(${st})"
                    aria-label="${st} Star"
                  >
                    <span>${st}</span><span>★</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="revProduct">Product Model</label>
              <select id="revProduct" class="select">
                ${products.map(p => `<option value="${esc(p.name)}">${esc(p.name)}</option>`).join('')}
                <option value="Custom Installation / Service">Custom Installation / Service</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="revMessage">Review Message</label>
              <textarea id="revMessage" class="textarea" maxlength="1000" placeholder="Tell us about product performance, overflow cut-off, or service..." required></textarea>
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%;" ${state.reviewBusy ? 'disabled' : ''}>
              ${ic('star')} ${state.reviewBusy ? 'Submitting Review...' : 'Submit Customer Review'}
            </button>
          </form>
        </div>
      </div>
    </section>

    <!-- 7. DYNAMIC CONTACT, GOOGLE MAPS & SOCIAL LINKS -->
    <section id="contactMapsSection" class="card" style="margin-bottom:22px;">
      <div class="card-header">
        <div>
          <div class="page-eyebrow">${ic('mapPin')} Direct Support &amp; Location</div>
          <h2 class="card-title" style="font-size:20px;">Connect with ${esc(biz.businessName)}</h2>
          <p class="card-subtitle">All phone numbers, maps location, and links update dynamically from Admin Settings</p>
        </div>
        ${mapsHref ? `
          <a href="${esc(mapsHref)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary">
            ${ic('mapPin')} Open Google Maps ${ic('external')}
          </a>
        ` : ''}
      </div>

      <div class="contact-tiles-grid" style="margin-bottom:14px;">
        <div class="contact-tile">
          <div class="meta-tile-label">Workshop / Business Address</div>
          <div style="font-size:13.5px;font-weight:700;color:var(--ink);margin-top:4px;">${esc(biz.address || 'Configure address in Admin Settings')}</div>
          ${biz.gstin ? `<div class="mono" style="font-size:11.5px;color:var(--ink-secondary);margin-top:4px;">GSTIN: ${esc(biz.gstin)}</div>` : ''}
        </div>

        <div class="contact-tile">
          <div class="meta-tile-label">Phone &amp; WhatsApp Desk</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;">
            ${biz.businessPhone ? `<a href="${esc(buildTelLink(biz.businessPhone))}" class="btn btn-sm btn-outline">${ic('phone')} ${esc(biz.businessPhone)}</a>` : ''}
            ${biz.personalPhone ? `<a href="${esc(buildTelLink(biz.personalPhone))}" class="btn btn-sm btn-outline">${ic('phone')} ${esc(biz.personalPhone)}</a>` : ''}
            ${waHref ? `<a href="${esc(waHref)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-soft">${ic('message')} WhatsApp Chat</a>` : ''}
            ${!biz.businessPhone && !biz.personalPhone && !waHref ? `<span style="font-size:12.5px;color:var(--ink-secondary);">Add phone &amp; WhatsApp numbers in Admin Settings.</span>` : ''}
          </div>
          ${biz.email ? `<div style="font-size:12px;color:var(--ink-secondary);margin-top:6px;">Email: <strong>${esc(biz.email)}</strong></div>` : ''}
        </div>
      </div>

      ${(() => {
        const socials = [
          ['Official Website', safeHttpsUrl(biz.websiteUrl), 'globe'],
          ['Google Maps', mapsHref, 'mapPin'],
          ['Google Reviews', googleRevHref, 'star'],
          ['Instagram', safeHttpsUrl(biz.instagramUrl), 'external'],
          ['Facebook', safeHttpsUrl(biz.facebookUrl), 'external'],
          ['YouTube', safeHttpsUrl(biz.youtubeUrl), 'external']
        ].filter(([, url]) => Boolean(url));
        if (!socials.length) return '';
        return `
          <div class="social-links-row">
            ${socials.map(([label, url, iconName]) => `
              <a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">
                ${ic(iconName)} <span>${esc(label)}</span>
              </a>
            `).join('')}
          </div>
        `;
      })()}
    </section>

    <!-- 8. CONNECTED ECOSYSTEM / APPS HUB -->
    ${adminCfg.features.hub !== false ? `
      <section id="ecosystemHubSection" class="card">
        <div class="card-header">
          <div>
            <div class="page-eyebrow">${ic('grid')} Connected Ecosystem</div>
            <h2 class="card-title" style="font-size:20px;">${esc(biz.businessName)} Apps Hub</h2>
            <p class="card-subtitle">Launch billing companions and water utility tools in 1 click</p>
          </div>
          <a href="hub.html" class="btn btn-sm btn-soft">Open Full Apps Hub ${ic('external')}</a>
        </div>

        <div class="hub-grid">
          ${hubApps.map(item => {
            const badgeClass = item.category === 'Website' ? 'badge-purple' : item.category === 'New App' ? 'badge-emerald' : 'badge-amber';
            const safeUrl = safeHttpsUrl(item.url) || 'https://www.google.com';
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
    ` : ''}
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

function setReviewRating(stars) {
  const n = Math.max(1, Math.min(5, parseInt(stars, 10) || 5));
  state.reviewRating = n;
  renderApp();
}

async function submitCustomerReview(e) {
  e.preventDefault();
  if (state.reviewBusy) return;

  const customerName = sanitizeText(document.getElementById('revName')?.value || '', 100);
  const phoneNumber = sanitizeText(document.getElementById('revPhone')?.value || '', 25);
  const rating = Math.max(1, Math.min(5, parseInt(state.reviewRating, 10) || 5));
  const productName = sanitizeText(document.getElementById('revProduct')?.value || 'Water Level Controller', 140);
  const message = sanitizeText(document.getElementById('revMessage')?.value || '', 1000);

  if (!customerName || phoneNumber.replace(/\D/g, '').length < 6 || message.length < 3) {
    showToast('Please enter your name, valid phone number, and review message (min 3 chars).');
    return;
  }

  state.reviewBusy = true;
  state.reviewNotice = '';
  renderApp();

  const reviewId = sanitizeId('rev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6));

  try {
    if (!db || !fbSdk) {
      await initPublicFirebaseSafely();
    }

    if (db && fbSdk) {
      // 1. Save ALL 1–5★ reviews + private phoneNumber into Admin-only `private_reviews`
      await fbSdk.setDoc(fbSdk.doc(db, 'private_reviews', reviewId), {
        customerName,
        phoneNumber,
        rating,
        message,
        productName,
        status: 'SUBMITTED',
        createdAt: fbSdk.serverTimestamp()
      });

      // 2. Smart Visibility Filter: ONLY publish 4★ & 5★ reviews (WITHOUT phoneNumber) to `public_reviews`
      if (rating >= 4) {
        await fbSdk.setDoc(fbSdk.doc(db, 'public_reviews', reviewId), {
          customerName,
          rating,
          message,
          productName,
          verified: false,
          createdAt: fbSdk.serverTimestamp()
        });
      }
    }

    if (rating >= 4) {
      const publicEntry = sanitizePublicReview({
        id: reviewId,
        customerName,
        rating,
        message,
        productName,
        verified: false,
        createdAtMs: Date.now()
      });
      state.publicReviews = [publicEntry, ...(state.publicReviews || []).filter(r => r.id !== reviewId)];
      saveCachedPublicReviews(state.publicReviews);
      state.reviewNotice = 'Thank you for your 4★/5★ review! It is now published on our website.';
      showToast('Thank you! Your review is live.');
    } else {
      state.reviewNotice = 'Thank you for your feedback! Our AGNI VOLT ELECTRONIC support team has received it privately and will contact you shortly.';
      showToast('Thank you! Our team received your private feedback.');
    }
  } catch (err) {
    console.warn('Review submission error:', err?.message || err);
    showToast('Could not submit review right now. Please check your connection and try again.');
  } finally {
    state.reviewBusy = false;
    renderApp();
  }
}

/* =========================================================================
   PAGE 2: PRODUCTS, HARDWARE FLEET & SERVICE BOOKING (devices.html)
   ========================================================================= */
function renderDevices() {
  const biz = state.businessConfig || getDefaultBusinessConfig();
  const products = (biz.products || []).filter(p => p && p.enabled !== false);
  const activeUnits = (state.publicUnits || []).filter(u => getPublicUnitMetrics(u).remainingDays > 0);
  const filtered = activeUnits.filter(u => {
    if (state.deviceFilter === 'controller') return u.hardwareType.toLowerCase().includes('controller');
    if (state.deviceFilter === 'stopper') return u.hardwareType.toLowerCase().includes('stopper');
    return true;
  });

  return `
    <div class="page-header">
      <div>
        <div class="page-eyebrow">${ic('cpu')} ${esc(biz.businessName)} Hardware &amp; Service</div>
        <h1 class="page-title serif">Water Level Controllers &amp; Technician Service</h1>
        <p class="page-desc">Browse our official models, check active installations, or submit a service inspection request.</p>
      </div>
      <div class="pill-tabs">
        <button class="pill-tab ${state.deviceFilter === 'all' ? 'active' : ''}" onclick="setDeviceFilter('all')">Active (${activeUnits.length})</button>
        <button class="pill-tab ${state.deviceFilter === 'controller' ? 'active' : ''}" onclick="setDeviceFilter('controller')">Controllers</button>
        <button class="pill-tab ${state.deviceFilter === 'stopper' ? 'active' : ''}" onclick="setDeviceFilter('stopper')">Water Stoppers</button>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:22px;">
      ${filtered.map(u => {
        const m = getPublicUnitMetrics(u);
        const isController = u.hardwareType.toLowerCase().includes('controller');
        const thumb = isController ? 'assets/hero-controller.jpg' : 'assets/crystal-water.jpg';
        return `
          <div class="card" style="display:flex;flex-direction:column;justify-content:space-between;gap:14px;">
            <div>
              <div style="display:flex;gap:14px;align-items:center;margin-bottom:14px;">
                <img src="${thumb}" alt="${esc(u.modelName)}" style="width:68px;height:68px;border-radius:14px;object-fit:cover;border:1px solid var(--border);flex-shrink:0;" />
                <div style="flex:1;min-width:0;">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;margin-bottom:4px;">
                    <span class="badge ${isController ? 'badge-purple' : 'badge-amber'}">${esc(u.hardwareType)}</span>
                    <span class="badge ${m.statusBadge} mono">${m.remainingDays} Days Left</span>
                  </div>
                  <h2 style="font-size:16px;font-weight:800;line-height:1.25;margin:0;">${esc(u.modelName)}</h2>
                  <div style="font-size:12.5px;color:var(--ink-secondary);margin-top:3px;">
                    ${esc(u.customerName)} ${u.maskedPhone && u.maskedPhone !== 'Hidden' ? `&bull; <span class="mono">${esc(u.maskedPhone)}</span>` : ''} &bull; <span class="mono">Qty: ${Number(u.quantity) || 1}</span>
                  </div>
                </div>
              </div>

              <div class="progress-bar-track" style="margin-bottom:10px;">
                <div class="progress-bar-fill" style="width:${m.pctRemaining}%;background:${m.strokeColor};"></div>
              </div>

              <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;background:var(--bg-elevated);padding:10px 12px;border-radius:10px;border:1px solid var(--border);font-size:12px;">
                <div>
                  <span style="color:var(--ink-tertiary);display:block;font-size:10px;font-weight:700;text-transform:uppercase;">Start Date</span>
                  <strong class="mono">${formatDateDisplay(u.installDate)}</strong>
                </div>
                <div>
                  <span style="color:var(--ink-tertiary);display:block;font-size:10px;font-weight:700;text-transform:uppercase;">Warranty Expiry</span>
                  <strong class="mono">${formatDateDisplay(u.expiryDate)}</strong>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('') || `
        <div class="card" style="grid-column:1/-1;text-align:center;color:var(--ink-secondary);padding:24px;">
          No active units registered yet. Explore our products below or book an installation service.
        </div>
      `}
    </div>

    <div class="grid-12">
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Book Technician Service / Installation</h2>
            <p class="card-subtitle">Sent securely to ${esc(biz.businessName)} Admin desk (write-only privacy)</p>
          </div>
        </div>
        <form onsubmit="submitServiceTicket(event)">
          <div class="form-group">
            <label class="form-label" for="srvUnit">Customer / Product Model</label>
            <select id="srvUnit" class="select" required>
              ${activeUnits.map(u => `<option value="${esc(u.id)}">${esc(u.customerName)} — ${esc(u.modelName)}</option>`).join('')}
              ${products.map(p => `<option value="prod_${esc(p.id)}">New Enquiry — ${esc(p.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="srvPhone">Contact Phone (Private — Admin Only)</label>
            <input id="srvPhone" class="input mono" type="tel" maxlength="25" placeholder="Your mobile number for technician callback" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="srvIssue">Service Type</label>
            <select id="srvIssue" class="select" required>
              <option value="New Controller Installation">New Controller Installation</option>
              <option value="Sensor Cleaning & Calibration">Sensor Cleaning &amp; Calibration</option>
              <option value="Motor Relay / Dry-Run Cutoff Check">Motor Relay / Dry-Run Cutoff Check</option>
              <option value="Motorized Water Stopper Valve Check">Motorized Water Stopper Valve Check</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="srvNotes">Additional Notes</label>
            <textarea id="srvNotes" class="textarea" maxlength="500" placeholder="Describe tank setup, issue, or preferred visit time..." required></textarea>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;">
            ${ic('wrench')} Submit Service Request
          </button>
        </form>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Your Submitted Requests</h2>
            <p class="card-subtitle">Stored locally for your confirmation; managed privately by Admin</p>
          </div>
          <span class="badge badge-purple">${state.mySubmittedTickets.length} Submitted</span>
        </div>
        <div class="device-list">
          ${state.mySubmittedTickets.map(t => `
            <div class="device-item-card" style="cursor:default;">
              <div class="device-item-left">
                <div class="device-type-icon">${ic('wrench')}</div>
                <div style="min-width:0;">
                  <div class="device-name">${esc(t.issue)}</div>
                  <div class="device-meta">${esc(t.unitName)} &bull; <span class="mono">${esc(t.id)}</span></div>
                  <div style="font-size:12px;color:var(--ink-secondary);margin-top:4px;">${esc(t.notes)}</div>
                </div>
              </div>
              <div class="device-item-right">
                <span class="badge badge-amber">${esc(t.status)}</span>
                <div style="font-size:11px;color:var(--ink-tertiary);margin-top:4px;">${formatDateDisplay(t.date)}</div>
              </div>
            </div>
          `).join('') || `
            <div style="text-align:center;padding:24px;color:var(--ink-tertiary);font-size:13px;">
              No service requests submitted from this device yet.
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

function setDeviceFilter(filter) {
  state.deviceFilter = filter;
  renderApp();
}

async function submitServiceTicket(e) {
  e.preventDefault();
  const unitSel = document.getElementById('srvUnit');
  const unitId = sanitizeId(unitSel?.value || 'enquiry');
  const unitLabel = sanitizeText(unitSel?.options?.[unitSel.selectedIndex]?.text || 'Water Level Controller', 150);
  const contactPhone = sanitizeText(document.getElementById('srvPhone')?.value || '', 25);
  const issue = sanitizeText(document.getElementById('srvIssue')?.value || '', 120);
  const notes = sanitizeText(document.getElementById('srvNotes')?.value || '', 500);
  if (!notes || contactPhone.replace(/\D/g, '').length < 6) {
    showToast('Enter a valid phone number and service notes');
    return;
  }

  const ticketNumber = 'SRV-' + Math.floor(1000 + Math.random() * 9000);
  const reqId = sanitizeId('srv_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6));

  try {
    if (!db || !fbSdk) await initPublicFirebaseSafely();
    if (db && fbSdk) {
      await fbSdk.setDoc(fbSdk.doc(db, 'private_service_requests', reqId), {
        ticketNumber,
        unitId: unitId || 'enquiry',
        unitName: unitLabel,
        issue,
        notes,
        contactPhone,
        status: 'Logged',
        createdAt: fbSdk.serverTimestamp()
      });
    }
  } catch (err) {
    console.warn('Service request write warning:', err?.message || err);
  }

  const newTicket = {
    id: ticketNumber,
    unitId,
    unitName: unitLabel,
    issue,
    notes,
    status: 'Logged',
    date: shiftDaysIso(0)
  };
  state.mySubmittedTickets.unshift(newTicket);
  saveState();
  renderApp();
  showToast(`Service request ${ticketNumber} sent to Admin`);
}

/* =========================================================================
   PAGE 3: APPS HUB (hub.html)
   ========================================================================= */
function renderHub() {
  const adminCfg = loadAdminOverrides();
  const biz = state.businessConfig || getDefaultBusinessConfig();
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
        <h1 class="page-title serif">${esc(biz.businessName)} Apps Hub</h1>
        <p class="page-desc">Launch billing companions and water utility tools in 1 click.</p>
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
          placeholder="Search apps, websites, or tools..."
          value="${esc(state.hubSearch)}"
          oninput="updateHubSearch(this.value)"
        />
      </div>
    </div>

    <div class="hub-grid">
      ${filtered.map(item => {
        const badgeClass = item.category === 'Website' ? 'badge-purple' : item.category === 'New App' ? 'badge-emerald' : 'badge-amber';
        const safeUrl = safeHttpsUrl(item.url) || 'https://www.google.com';
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
   PAGE 4: DPDP PRIVACY & ANTI-SCRAPING ISOLATION (privacy.html)
   ========================================================================= */
function renderPrivacy() {
  const d = state.dpdp;
  const biz = state.businessConfig || getDefaultBusinessConfig();
  return `
    <div class="page-header">
      <div>
        <div class="page-eyebrow">${ic('lock')} Digital Personal Data Protection Act (India)</div>
        <h1 class="page-title serif">Anti-Scraping &amp; Privacy Guard</h1>
        <p class="page-desc">${esc(biz.businessName)} separates public social-proof warranties from private customer phone numbers, reviews, and invoices.</p>
      </div>
      <span class="badge badge-emerald">${ic('check')} Masked Phone &amp; UID Lock</span>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Server-Enforced Data Isolation</h2>
            <p class="card-subtitle">Protected by Firebase Firestore Security Rules</p>
          </div>
        </div>

        <div class="consent-row">
          <div>
            <div style="font-weight:700;font-size:13.5px;">Customer Live (<code>public_units</code>)</div>
            <div style="font-size:12px;color:var(--ink-secondary);">Shows masked phone numbers (e.g. 98XXXXXX45) &amp; warranty status only.</div>
          </div>
          <span class="badge badge-emerald">Masked Only</span>
        </div>

        <div class="consent-row">
          <div>
            <div style="font-weight:700;font-size:13.5px;">Private Reviews &amp; Contacts</div>
            <div style="font-size:12px;color:var(--ink-secondary);">Full phone numbers and 1★–3★ reviews are strictly locked to Admin UID.</div>
          </div>
          <span class="badge badge-purple">Admin UID Locked</span>
        </div>

        <div class="consent-row">
          <div>
            <div style="font-weight:700;font-size:13.5px;">Invoices &amp; Google Drive Backup</div>
            <div style="font-size:12px;color:var(--ink-secondary);">Bills and Apps Script keys are accessible only to the verified Admin.</div>
          </div>
          <span class="badge badge-purple">Admin UID Locked</span>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Browser Preferences</h2>
            <p class="card-subtitle">Theme &amp; local display controls</p>
          </div>
        </div>

        <div class="consent-row">
          <div>
            <div style="font-weight:700;font-size:13.5px;">Warranty Countdown Alerts</div>
            <div style="font-size:12px;color:var(--ink-secondary);">Highlight warranties dropping below 45 days</div>
          </div>
          <button class="switch ${d.warrantyAlertConsent ? 'on' : ''}" onclick="toggleDpdpSwitch('warrantyAlertConsent')" aria-label="Toggle Warranty Alerts"></button>
        </div>

        <div class="consent-row">
          <div>
            <div style="font-weight:700;font-size:13.5px;">Appearance Theme</div>
            <div style="font-size:12px;color:var(--ink-secondary);">Current: ${state.theme === 'dark' ? 'Night Mode' : 'Day Mode'}</div>
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

Object.assign(window, {
  toggleTheme,
  shareLandingPage,
  updatePublicCustomerSearch,
  setPublicFilterType,
  selectPublicUnitForGauge,
  setReviewRating,
  submitCustomerReview,
  setDeviceFilter,
  submitServiceTicket,
  setHubCategory,
  updateHubSearch,
  toggleDpdpSwitch,
  dismissPwaInstallBanner,
  triggerPwaInstallAction,
  showToast,
  formatDateDisplay,
  maskPhoneDisplay,
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
    navigator.serviceWorker.register('sw.js?v=11').catch(() => {});
  }
});
