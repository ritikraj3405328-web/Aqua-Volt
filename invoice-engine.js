/* =========================================================================
   AGNI VOLT ELECTRONIC — ADMIN-ONLY BILL GENERATOR & GOOGLE DRIVE VAULT
   - Strict Admin-UID Guard: Only authenticated Admin (UID: Y8zmDKBgubWIVvhufftRPPjG7HC3)
     can open invoice.html; non-admin visitors are automatically redirected to index.html
   - Dynamic Business Letterhead & Product Catalog from `businessConfig/main`
   - Auto-Sync with Customer Live (`public_units` with maskedPhone + `private_customers`)
     whenever a bill is generated with Warranty Start & Expiry dates
   - Permanent Google Drive PDF & Sheets Backup via `Code.gs` Web App (`adminSecrets/driveVault`)
   ========================================================================= */

(function () {
  const ADMIN_CONFIG_KEY = 'aquavault_admin_config_v1';
  const BUSINESS_CONFIG_CACHE_KEY = 'agnivolt_business_config_cache_v11';
  const PUBLIC_UNITS_CACHE_KEY = 'aquavault_public_units_cache_v11';
  const PRIVATE_CUSTOMERS_CACHE_KEY = 'aquavault_private_customers_v9';
  const PRIVATE_INVOICES_CACHE_KEY = 'aquavault_private_invoices_v9';
  const AUTHORIZED_ADMIN_UID = 'Y8zmDKBgubWIVvhufftRPPjG7HC3';

  const PALETTES = {
    violet: {
      id: 'violet',
      name: 'Royal Violet',
      primary: '#5B21B6',
      secondary: '#7C3AED',
      accent: '#DDD6FE',
      softBg: '#F5F3FF',
      border: '#C4B5FD',
      headerGrad: 'linear-gradient(135deg, #2E1065 0%, #5B21B6 55%, #7C3AED 100%)',
      badgeBg: '#EDE9FE',
      badgeInk: '#5B21B6'
    },
    sapphire: {
      id: 'sapphire',
      name: 'Executive Sapphire',
      primary: '#0F4C81',
      secondary: '#1D70B8',
      accent: '#BAE6FD',
      softBg: '#F0F9FF',
      border: '#93C5FD',
      headerGrad: 'linear-gradient(135deg, #0A2E52 0%, #0F4C81 55%, #1D70B8 100%)',
      badgeBg: '#E0F2FE',
      badgeInk: '#0F4C81'
    },
    emerald: {
      id: 'emerald',
      name: 'Emerald Mint',
      primary: '#047857',
      secondary: '#059669',
      accent: '#A7F3D0',
      softBg: '#ECFDF5',
      border: '#6EE7B7',
      headerGrad: 'linear-gradient(135deg, #064E3B 0%, #047857 55%, #10B981 100%)',
      badgeBg: '#D1FAE5',
      badgeInk: '#065F46'
    },
    crimson: {
      id: 'crimson',
      name: 'Ruby Rose',
      primary: '#9F1239',
      secondary: '#E11D48',
      accent: '#FECDD3',
      softBg: '#FFF1F2',
      border: '#FDA4AF',
      headerGrad: 'linear-gradient(135deg, #4C0519 0%, #9F1239 55%, #E11D48 100%)',
      badgeBg: '#FFE4E6',
      badgeInk: '#9F1239'
    },
    gold: {
      id: 'gold',
      name: 'Sovereign Gold',
      primary: '#92400E',
      secondary: '#D97706',
      accent: '#FDE68A',
      softBg: '#FFFBEB',
      border: '#FCD34D',
      headerGrad: 'linear-gradient(135deg, #451A03 0%, #92400E 55%, #D97706 100%)',
      badgeBg: '#FEF3C7',
      badgeInk: '#92400E'
    },
    obsidian: {
      id: 'obsidian',
      name: 'Classic Monochrome',
      primary: '#111827',
      secondary: '#374151',
      accent: '#E5E7EB',
      softBg: '#F9FAFB',
      border: '#9CA3AF',
      headerGrad: 'linear-gradient(135deg, #030712 0%, #1F2937 60%, #374151 100%)',
      badgeBg: '#F3F4F6',
      badgeInk: '#111827'
    }
  };

  let privateCustomers = [];
  let privateInvoices = [];
  let businessProducts = [];
  let cloudLoadedForAdmin = false;
  let redirectTimer = null;
  let savingBillBusy = false;
  let driveTestBusy = false;
  let queryPrefillApplied = false;

  function todayIso(offsetDays = 0) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return new Date(d.getTime() + offsetDays * 86400000).toISOString().slice(0, 10);
  }

  function shiftFromIso(baseIso, offsetDays = 0) {
    const [y, m, d] = String(baseIso || '').split('-').map(Number);
    const dt = (y && m && d) ? new Date(y, m - 1, d) : new Date();
    dt.setHours(0, 0, 0, 0);
    return new Date(dt.getTime() + offsetDays * 86400000).toISOString().slice(0, 10);
  }

  function getDaysRemaining(expiryIso) {
    const [y, m, d] = String(expiryIso || '').split('-').map(Number);
    if (!y || !m || !d) return 0;
    const end = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((end - today) / 86400000));
  }

  function getWarrantyTermDays(startIso, expiryIso) {
    const [y1, m1, d1] = String(startIso || '').split('-').map(Number);
    const [y2, m2, d2] = String(expiryIso || '').split('-').map(Number);
    if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return 365;
    const s = new Date(y1, m1 - 1, d1);
    const e = new Date(y2, m2 - 1, d2);
    return Math.max(0, Math.min(3650, Math.round((e - s) / 86400000)));
  }

  function sanitizeInput(val, maxLen = 250) {
    return String(val ?? '')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .replace(/<\s*\/?\s*script\b[^>]*>/gi, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/data\s*:\s*text\/html/gi, '')
      .slice(0, maxLen);
  }

  function sanitizeId(id) {
    return String(id ?? '').replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 80);
  }

  function maskPhone(phone) {
    if (typeof window.maskPhoneDisplay === 'function') {
      return window.maskPhoneDisplay(phone);
    }
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.length < 6) return 'Hidden';
    const maskLen = Math.min(10, Math.max(4, digits.length - 4));
    return digits.slice(0, 2) + 'X'.repeat(maskLen) + digits.slice(-2);
  }

  function loadAdminDefaults() {
    try {
      const raw = localStorage.getItem(ADMIN_CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.invoiceDefaults) return parsed.invoiceDefaults;
      }
    } catch {}
    return {};
  }

  function loadBusinessSettingsCache() {
    try {
      const raw = localStorage.getItem(BUSINESS_CONFIG_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return {};
  }

  function loadCachedPrivateCustomers() {
    try {
      const raw = localStorage.getItem(PRIVATE_CUSTOMERS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  function saveCachedPrivateCustomers(list) {
    try {
      localStorage.setItem(PRIVATE_CUSTOMERS_CACHE_KEY, JSON.stringify(list));
    } catch {}
  }

  function loadCachedPrivateInvoices() {
    try {
      const raw = localStorage.getItem(PRIVATE_INVOICES_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  function saveCachedPrivateInvoices(list) {
    try {
      localStorage.setItem(PRIVATE_INVOICES_CACHE_KEY, JSON.stringify(list));
    } catch {}
  }

  function getDefaultDraft() {
    const adm = loadAdminDefaults();
    const biz = loadBusinessSettingsCache();
    businessProducts = Array.isArray(biz.products) ? biz.products : [];
    const firstProd = businessProducts.find(p => p && p.enabled !== false) || {
      name: 'AgniVolt Pro-X7 Dual Tank Controller',
      hardwareType: 'Water Level Controller',
      price: 3499
    };

    return {
      palette: adm.palette || 'violet',
      frameStyle: adm.frameStyle === 'classic' ? 'classic' : 'colorful',
      selectedCustomerId: '',
      invoiceNo: 'INV-AV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      invoiceDate: todayIso(0),
      dueDate: todayIso(7),
      warrantyStartDate: todayIso(0),
      warrantyExpiryDate: todayIso(365),
      syncToCustomerLive: true,
      status: 'PAID',
      businessName: biz.businessName || adm.businessName || 'AGNI VOLT ELECTRONIC',
      businessTagline: biz.tagline || 'Automated Water Level Controller & Smart Pump Protection',
      businessAddress: biz.address || adm.businessAddress || '',
      businessPhone: biz.businessPhone || adm.businessPhone || '',
      businessEmail: biz.email || adm.businessEmail || '',
      businessGstin: biz.gstin || adm.businessGstin || '',
      clientName: '',
      clientPhone: '',
      clientAddress: '',
      hardwareType: firstProd.hardwareType || 'Water Level Controller',
      paymentMethod: 'UPI / Cash / Bank Transfer',
      paymentDetails: adm.paymentDetails || '',
      discountPct: 0,
      taxPct: typeof adm.gstPercent === 'number' ? adm.gstPercent : 18,
      notes: 'Official AGNI VOLT ELECTRONIC Warranty — Covers manufacturing defects & controller PCB as per warranty dates.',
      signatory: 'AGNI VOLT ELECTRONIC • Authorized Signatory',
      googleSheetWebhook: '',
      driveSyncSecret: '',
      items: [
        {
          id: 'i1',
          desc: firstProd.name || 'AgniVolt Pro-X7 Dual Tank Controller',
          unit: 'Unit',
          qty: 1,
          price: Number(firstProd.price) || 3499
        }
      ]
    };
  }

  let draft = getDefaultDraft();
  privateCustomers = loadCachedPrivateCustomers();
  privateInvoices = loadCachedPrivateInvoices();

  async function loadPrivateAdminVaultFromFirestore() {
    if (cloudLoadedForAdmin) return;
    const cs = typeof window.getCloudState === 'function' ? window.getCloudState() : null;
    if (!cs || !cs.isAdmin || !cs.db || !cs.fbSdk) return;
    cloudLoadedForAdmin = true;

    // 1. Load live Business Config (letterhead & products)
    try {
      const bizSnap = await cs.fbSdk.getDoc(cs.fbSdk.doc(cs.db, 'businessConfig', 'main'));
      if (bizSnap.exists()) {
        const b = bizSnap.data();
        if (b.businessName) draft.businessName = sanitizeInput(b.businessName, 120);
        if (b.tagline) draft.businessTagline = sanitizeInput(b.tagline, 200);
        if (b.address) draft.businessAddress = sanitizeInput(b.address, 300);
        if (b.businessPhone) draft.businessPhone = sanitizeInput(b.businessPhone, 30);
        if (b.email) draft.businessEmail = sanitizeInput(b.email, 150);
        if (b.gstin) draft.businessGstin = sanitizeInput(b.gstin, 40);
        if (Array.isArray(b.products)) {
          businessProducts = b.products;
        }
        try { localStorage.setItem(BUSINESS_CONFIG_CACHE_KEY, JSON.stringify(b)); } catch {}
      }
    } catch (err) {
      console.warn('businessConfig load note:', err?.message || err);
    }

    // 2. Load Google Drive Webhook & optional secret from Admin-Only `adminSecrets/driveVault`
    try {
      const secSnap = await cs.fbSdk.getDoc(cs.fbSdk.doc(cs.db, 'adminSecrets', 'driveVault'));
      if (secSnap.exists()) {
        const s = secSnap.data();
        if (s.googleSheetWebhook) draft.googleSheetWebhook = String(s.googleSheetWebhook).trim();
        if (s.driveSyncSecret) draft.driveSyncSecret = String(s.driveSyncSecret).trim();
      }
    } catch (err) {
      console.warn('adminSecrets load note:', err?.message || err);
    }

    // 3. Load private_customers
    try {
      const custSnap = await cs.fbSdk.getDocs(cs.fbSdk.collection(cs.db, 'private_customers'));
      if (!custSnap.empty) {
        const list = [];
        custSnap.forEach(s => list.push({ id: s.id, ...s.data() }));
        privateCustomers = list;
        saveCachedPrivateCustomers(list);
      }
    } catch (err) {
      console.warn('private_customers load note:', err?.message || err);
    }

    // 4. Load private_invoices
    try {
      const invSnap = await cs.fbSdk.getDocs(cs.fbSdk.collection(cs.db, 'private_invoices'));
      if (!invSnap.empty) {
        const list = [];
        invSnap.forEach(s => list.push({ id: s.id, ...s.data() }));
        list.sort((a, b) => String(b.invoiceDate || '').localeCompare(String(a.invoiceDate || '')));
        privateInvoices = list;
        saveCachedPrivateInvoices(list);
      }
    } catch (err) {
      console.warn('private_invoices load note:', err?.message || err);
    }

    // Check URL ?customerId= prefill once
    if (!queryPrefillApplied) {
      queryPrefillApplied = true;
      try {
        const params = new URLSearchParams(window.location.search);
        const cid = sanitizeId(params.get('customerId') || '');
        if (cid && privateCustomers.some(c => c.id === cid)) {
          selectExistingCustomerForBill(cid);
          return;
        }
      } catch {}
    }

    refreshInvoiceDom();
  }

  function calculateInvoiceTotals(inv) {
    const items = (inv.items || []).map(it => {
      const qty = Math.max(0, Number(it.qty) || 0);
      const price = Math.max(0, Number(it.price) || 0);
      const lineTotal = +(qty * price).toFixed(2);
      return { ...it, qty, price, lineTotal };
    });
    const subtotal = +items.reduce((acc, it) => acc + it.lineTotal, 0).toFixed(2);
    const discountPct = Math.max(0, Math.min(100, Number(inv.discountPct) || 0));
    const discountAmt = +((subtotal * discountPct) / 100).toFixed(2);
    const taxable = Math.max(0, +(subtotal - discountAmt).toFixed(2));
    const taxPct = Math.max(0, Math.min(50, Number(inv.taxPct) || 0));
    const taxAmt = +((taxable * taxPct) / 100).toFixed(2);
    const grandTotal = +(taxable + taxAmt).toFixed(2);
    const totalQty = items.reduce((acc, it) => acc + (parseInt(it.qty, 10) || 0), 0) || 1;
    const primaryModel = items.map(i => `${i.desc} (x${i.qty})`).join(' + ') || 'AgniVolt Water Level Controller';
    const primaryUnitPrice = items[0]?.price || subtotal;
    return {
      items,
      subtotal,
      discountPct,
      discountAmt,
      taxable,
      taxPct,
      taxAmt,
      grandTotal,
      totalQty,
      primaryModel,
      primaryUnitPrice
    };
  }

  function fmtMoney(n) {
    const val = Number(n) || 0;
    return '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* =========================================================================
     SELECT EXISTING CUSTOMER OR PRODUCT CATALOG QUICK-FILL
     ========================================================================= */
  function selectExistingCustomerForBill(customerId) {
    draft.selectedCustomerId = sanitizeId(customerId);
    if (!customerId) {
      refreshInvoiceDom();
      return;
    }
    const cust = privateCustomers.find(c => c.id === customerId);
    if (!cust) return;

    draft.clientName = sanitizeInput(cust.customerName || '', 120);
    draft.clientPhone = sanitizeInput(cust.mobileNumber || '', 30);
    draft.clientAddress = sanitizeInput(cust.address || '', 250);
    draft.hardwareType = cust.hardwareType || 'Water Level Controller';
    draft.taxPct = typeof cust.gstRate === 'number' ? cust.gstRate : draft.taxPct;
    if (cust.installDate) draft.warrantyStartDate = sanitizeInput(cust.installDate, 20);
    if (cust.expiryDate) draft.warrantyExpiryDate = sanitizeInput(cust.expiryDate, 20);
    draft.items = [
      {
        id: 'i_' + Date.now().toString(36),
        desc: sanitizeInput(cust.modelName || 'AgniVolt Pro-X7 Controller', 140),
        unit: 'Unit',
        qty: Math.max(1, parseInt(cust.quantity, 10) || 1),
        price: Math.max(0, Number(cust.basePrice) || 3499)
      }
    ];
    refreshInvoiceDom();
    window.showToast(`Auto-filled ${cust.customerName}`);
  }

  function quickAddCatalogProduct(prodId) {
    const prod = (businessProducts || []).find(p => p.id === prodId);
    if (!prod) return;
    draft.hardwareType = prod.hardwareType || 'Water Level Controller';
    const firstEmpty = draft.items.length === 1 && !draft.items[0].desc;
    const newItem = {
      id: 'i_' + Date.now().toString(36),
      desc: sanitizeInput(prod.name, 160),
      unit: 'Unit',
      qty: 1,
      price: Math.max(0, Number(prod.price) || 0)
    };
    if (firstEmpty) {
      draft.items[0] = newItem;
    } else {
      draft.items.push(newItem);
    }
    refreshInvoiceDom();
    window.showToast(`Added ${prod.name}`);
  }

  function applyWarrantyPreset(days) {
    const start = draft.warrantyStartDate || draft.invoiceDate || todayIso(0);
    draft.warrantyStartDate = start;
    if (days <= 0) {
      draft.warrantyExpiryDate = '';
      draft.syncToCustomerLive = false;
    } else {
      draft.warrantyExpiryDate = shiftFromIso(start, days);
      draft.syncToCustomerLive = true;
    }
    refreshInvoiceDom();
  }

  /* =========================================================================
     PRINTABLE HTML BUILDER FOR PERMANENT GOOGLE DRIVE PDF ARCHIVE
     ========================================================================= */
  function buildPrintableInvoiceHtml(inv, calc) {
    const pal = PALETTES[inv.palette] || PALETTES.violet;
    const esc = window.esc || ((s) => String(s ?? ''));
    const rowsHtml = calc.items.map((it, idx) => `
      <tr>
        <td style="padding:10px;border:1px solid ${pal.border};text-align:center;">${idx + 1}</td>
        <td style="padding:10px;border:1px solid ${pal.border};font-weight:700;">${esc(it.desc)}</td>
        <td style="padding:10px;border:1px solid ${pal.border};text-align:center;">${it.qty}</td>
        <td style="padding:10px;border:1px solid ${pal.border};text-align:center;">${esc(it.unit)}</td>
        <td style="padding:10px;border:1px solid ${pal.border};text-align:right;">${fmtMoney(it.price)}</td>
        <td style="padding:10px;border:1px solid ${pal.border};text-align:right;font-weight:700;">${fmtMoney(it.lineTotal)}</td>
      </tr>
    `).join('');

    const warrantyHtml = (inv.warrantyStartDate && inv.warrantyExpiryDate)
      ? `<div style="font-size:12px;margin-top:4px;">Warranty: <strong>${esc(inv.warrantyStartDate)}</strong> to <strong>${esc(inv.warrantyExpiryDate)}</strong></div>`
      : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${esc(inv.invoiceNo)} - ${esc(inv.clientName)}</title>
</head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#0F172A;padding:28px;max-width:820px;margin:0 auto;">
  <div style="border:2px solid ${pal.primary};border-radius:16px;overflow:hidden;">
    <div style="background:${pal.primary};color:#FFFFFF;padding:24px 28px;display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:0.85;">OFFICIAL GST TAX INVOICE</div>
        <h1 style="margin:6px 0 4px;font-size:28px;">${esc(inv.businessName)}</h1>
        <div style="font-size:12px;opacity:0.9;">${esc(inv.businessAddress)}</div>
        <div style="font-size:12px;opacity:0.9;">${inv.businessPhone ? `Phone: ${esc(inv.businessPhone)} &bull; ` : ''}${inv.businessGstin ? `GSTIN: ${esc(inv.businessGstin)}` : ''}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:16px;font-weight:800;">${esc(inv.invoiceNo)}</div>
        <div style="font-size:12px;margin-top:4px;">Invoice Date: ${esc(inv.invoiceDate)}</div>
        <div style="font-size:12px;">Due Date: ${esc(inv.dueDate)}</div>
        ${warrantyHtml}
        <div style="margin-top:6px;display:inline-block;background:#FFFFFF;color:${pal.primary};padding:3px 10px;border-radius:99px;font-size:11px;font-weight:800;">${esc(inv.status)}</div>
      </div>
    </div>

    <div style="padding:24px 28px;">
      <div style="background:${pal.softBg};border:1px solid ${pal.border};border-radius:12px;padding:16px;margin-bottom:20px;display:flex;justify-content:space-between;gap:16px;">
        <div>
          <div style="font-size:10px;font-weight:800;color:${pal.primary};text-transform:uppercase;letter-spacing:1px;">Billed To Customer</div>
          <div style="font-size:17px;font-weight:800;margin-top:4px;">${esc(inv.clientName)}</div>
          <div style="font-size:13px;color:#334155;margin-top:3px;"><strong>Mobile:</strong> ${esc(inv.clientPhone)}</div>
          <div style="font-size:13px;color:#334155;"><strong>Place / Address:</strong> ${esc(inv.clientAddress)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:10px;font-weight:800;color:${pal.primary};text-transform:uppercase;letter-spacing:1px;">Payment Mode</div>
          <div style="font-size:13px;font-weight:700;margin-top:4px;">${esc(inv.paymentMethod)}</div>
          <div style="font-size:11.5px;color:#475569;margin-top:4px;max-width:260px;">${esc(inv.paymentDetails)}</div>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
        <thead>
          <tr style="background:${pal.primary};color:#FFFFFF;">
            <th style="padding:10px;border:1px solid ${pal.primary};">#</th>
            <th style="padding:10px;border:1px solid ${pal.primary};text-align:left;">Product Model / Description</th>
            <th style="padding:10px;border:1px solid ${pal.primary};">Qty</th>
            <th style="padding:10px;border:1px solid ${pal.primary};">Unit</th>
            <th style="padding:10px;border:1px solid ${pal.primary};text-align:right;">Unit Price</th>
            <th style="padding:10px;border:1px solid ${pal.primary};text-align:right;">Line Total</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>

      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px;">
        <div style="flex:1;font-size:12px;color:#475569;">
          <strong style="color:${pal.primary};">Warranty &amp; Terms:</strong><br/>
          ${esc(inv.notes)}
        </div>
        <div style="width:270px;background:${pal.softBg};border:1.5px solid ${pal.border};border-radius:12px;padding:14px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
            <span>Subtotal</span><strong>${fmtMoney(calc.subtotal)}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
            <span>Discount (${calc.discountPct}%)</span><strong style="color:#E11D48;">- ${fmtMoney(calc.discountAmt)}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:10px;">
            <span>GST (${calc.taxPct}%)</span><strong>+ ${fmtMoney(calc.taxAmt)}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:${pal.primary};border-top:1.5px solid ${pal.border};padding-top:8px;">
            <span>Grand Total</span><span>${fmtMoney(calc.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div style="margin-top:24px;padding-top:14px;border-top:1px dashed ${pal.border};display:flex;justify-content:space-between;font-size:12px;color:#64748B;">
        <span>Authorized Signatory: <strong>${esc(inv.signatory)}</strong></span>
        <span>AGNI VOLT ELECTRONIC &bull; Permanent Drive Archive</span>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  /* =========================================================================
     TEST GOOGLE DRIVE APPS SCRIPT CONNECTION
     ========================================================================= */
  async function testDriveWebhookConnection() {
    if (driveTestBusy) return;
    const webhookUrl = (draft.googleSheetWebhook || '').trim();
    if (!webhookUrl || !/^https:\/\/script\.google\.com\//i.test(webhookUrl)) {
      window.showToast('Paste your deployed Google Apps Script Web App URL (https://script.google.com/...) first');
      return;
    }

    driveTestBusy = true;
    refreshInvoiceDom();
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'ping',
          syncSecret: draft.driveSyncSecret || ''
        })
      });
      const json = await res.json().catch(() => null);
      if (json && json.ok) {
        window.showToast(`Google Drive connected! Folder: ${json.driveFolder || 'AGNI_VOLT_Permanent_Bills'}`);
      } else if (json && json.error) {
        window.showToast(`Drive script responded: ${json.error}`);
      } else {
        window.showToast('Google Drive script reachable! Ready for permanent bill backup.');
      }
    } catch {
      window.showToast('Sent ping to Apps Script. Ensure "Execute as: Me" & "Anyone" access in deployment.');
    } finally {
      driveTestBusy = false;
      refreshInvoiceDom();
    }
  }

  /* =========================================================================
     1-CLICK "GENERATE & SAVE BILL" ->
       1. GOOGLE DRIVE (`Code.gs`)
       2. FIRESTORE `private_invoices`
       3. AUTO-SYNC CUSTOMER LIVE (`public_units` w/ maskedPhone + `private_customers`)
     ========================================================================= */
  async function generateAndSaveAdminBill() {
    if (savingBillBusy) return;
    const cs = typeof window.getCloudState === 'function' ? window.getCloudState() : null;
    if (!cs || !cs.isAdmin) {
      window.showToast('Access Denied: Only verified Admin UID can generate & save official bills.');
      return;
    }

    const calc = calculateInvoiceTotals(draft);
    if (!draft.clientName.trim()) {
      window.showToast('Enter Customer Full Name');
      return;
    }

    savingBillBusy = true;
    refreshInvoiceDom();

    const invoiceId = sanitizeId('inv_' + draft.invoiceNo.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now().toString(36));
    const webhookUrl = (draft.googleSheetWebhook || '').trim();
    const printableHtml = buildPrintableInvoiceHtml(draft, calc);
    const maskedPhone = maskPhone(draft.clientPhone);

    let driveSaved = false;
    let driveFileUrl = '';

    // 1. Automatically push bill to Google Drive (`Code.gs` Web App URL)
    if (webhookUrl && /^https:\/\/script\.google\.com\//i.test(webhookUrl)) {
      const drivePayload = {
        syncSecret: draft.driveSyncSecret || '',
        invoiceNo: draft.invoiceNo,
        invoiceDate: draft.invoiceDate,
        dueDate: draft.dueDate,
        warrantyStartDate: draft.warrantyStartDate || '',
        warrantyExpiryDate: draft.warrantyExpiryDate || '',
        status: draft.status,
        customerName: draft.clientName,
        mobileNumber: draft.clientPhone || '',
        maskedPhone,
        address: draft.clientAddress || '',
        modelName: calc.primaryModel,
        hardwareType: draft.hardwareType || 'Water Level Controller',
        quantity: calc.totalQty,
        unitPrice: calc.primaryUnitPrice,
        subtotal: calc.subtotal,
        discountPct: calc.discountPct,
        discountAmt: calc.discountAmt,
        taxPct: calc.taxPct,
        taxAmt: calc.taxAmt,
        grandTotal: calc.grandTotal,
        paymentMethod: draft.paymentMethod,
        businessName: draft.businessName,
        businessAddress: draft.businessAddress,
        businessPhone: draft.businessPhone,
        businessGstin: draft.businessGstin,
        signatory: draft.signatory,
        items: calc.items,
        invoiceHtml: printableHtml
      };

      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(drivePayload)
        });
        const json = await res.json().catch(() => null);
        if (json && json.ok) {
          driveSaved = true;
          driveFileUrl = sanitizeInput(json.driveFileUrl || '', 500);
        } else if (res.ok) {
          driveSaved = true;
        }
      } catch {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(drivePayload)
          });
          driveSaved = true;
        } catch (err2) {
          console.warn('Google Drive Apps Script webhook warning:', err2?.message || err2);
        }
      }
    }

    // 2. Save webhook & optional secret securely to Admin-Only `adminSecrets/driveVault`
    if (cs.db && cs.fbSdk && webhookUrl && /^https:\/\/script\.google\.com\//i.test(webhookUrl)) {
      try {
        await cs.fbSdk.setDoc(cs.fbSdk.doc(cs.db, 'adminSecrets', 'driveVault'), {
          googleSheetWebhook: webhookUrl.slice(0, 500),
          driveSyncSecret: String(draft.driveSyncSecret || '').slice(0, 200),
          updatedAt: cs.fbSdk.serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn('adminSecrets write note:', err?.message || err);
      }
    }

    // 3. Save permanently to Firestore `private_invoices`
    const hasWarrantyDates = Boolean(draft.warrantyStartDate && draft.warrantyExpiryDate);
    const shouldSyncCustomerLive = Boolean(draft.syncToCustomerLive && hasWarrantyDates);

    const firestoreRecord = {
      invoiceNo: sanitizeInput(draft.invoiceNo, 60),
      customerId: sanitizeId(draft.selectedCustomerId || 'manual'),
      customerName: sanitizeInput(draft.clientName, 120),
      mobileNumber: sanitizeInput(draft.clientPhone || '', 30),
      address: sanitizeInput(draft.clientAddress || '', 250),
      modelName: sanitizeInput(calc.primaryModel, 200),
      hardwareType: sanitizeInput(draft.hardwareType || 'Water Level Controller', 40),
      quantity: Math.max(1, Math.min(10000, calc.totalQty)),
      unitPrice: Math.max(0, Number(calc.primaryUnitPrice) || 0),
      discountPct: calc.discountPct,
      taxPct: calc.taxPct,
      grandTotal: calc.grandTotal,
      status: ['PAID', 'PENDING', 'OVERDUE'].includes(draft.status) ? draft.status : 'PAID',
      palette: PALETTES[draft.palette] ? draft.palette : 'violet',
      invoiceDate: sanitizeInput(draft.invoiceDate, 20),
      dueDate: sanitizeInput(draft.dueDate, 20),
      warrantyStartDate: sanitizeInput(draft.warrantyStartDate || '', 20),
      warrantyExpiryDate: sanitizeInput(draft.warrantyExpiryDate || '', 20),
      syncToCustomerLive: shouldSyncCustomerLive,
      driveSaved: Boolean(driveSaved),
      driveFileUrl: driveFileUrl
    };

    if (cs.db && cs.fbSdk) {
      try {
        await cs.fbSdk.setDoc(cs.fbSdk.doc(cs.db, 'private_invoices', invoiceId), {
          ...firestoreRecord,
          createdAt: cs.fbSdk.serverTimestamp(),
          updatedAt: cs.fbSdk.serverTimestamp()
        });
      } catch (err) {
        console.warn('Firestore private_invoices write warning:', err?.message || err);
      }
    }

    // 4. AUTO-SYNC WITH CUSTOMER LIVE (`public_units` w/ maskedPhone + `private_customers`)
    let customerLiveSynced = false;
    if (shouldSyncCustomerLive) {
      const unitDocId = sanitizeId(
        draft.selectedCustomerId ||
        ('cust_' + draft.invoiceNo.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase())
      );
      const remDays = getDaysRemaining(draft.warrantyExpiryDate);
      const warrantyDays = getWarrantyTermDays(draft.warrantyStartDate, draft.warrantyExpiryDate);
      const hwType = String(draft.hardwareType || '').toLowerCase().includes('stopper')
        ? 'Water Stopper'
        : 'Water Level Controller';

      const publicUnitPayload = {
        customerName: sanitizeInput(draft.clientName, 120),
        maskedPhone: maskedPhone,
        modelName: sanitizeInput(calc.primaryModel, 140),
        hardwareType: hwType,
        quantity: Math.max(1, Math.min(1000, calc.totalQty)),
        installDate: sanitizeInput(draft.warrantyStartDate, 20),
        expiryDate: sanitizeInput(draft.warrantyExpiryDate, 20),
        status: remDays === 0 ? 'EXPIRED' : 'ACTIVE'
      };

      const privateCustPayload = {
        customerName: sanitizeInput(draft.clientName, 120),
        mobileNumber: sanitizeInput(draft.clientPhone || 'Not Provided', 30),
        address: sanitizeInput(draft.clientAddress || 'India', 250),
        modelName: sanitizeInput(calc.primaryModel, 140),
        hardwareType: hwType,
        quantity: Math.max(1, Math.min(1000, calc.totalQty)),
        serialNumber: sanitizeInput('AV-' + draft.invoiceNo.replace(/[^a-zA-Z0-9]/g, '').slice(-10).toUpperCase(), 80),
        installDate: sanitizeInput(draft.warrantyStartDate, 20),
        expiryDate: sanitizeInput(draft.warrantyExpiryDate, 20),
        warrantyDays: warrantyDays,
        basePrice: Math.max(0, Number(calc.grandTotal) || 0),
        gstRate: calc.taxPct,
        invoiceNo: sanitizeInput(draft.invoiceNo, 60)
      };

      if (cs.db && cs.fbSdk) {
        try {
          await cs.fbSdk.setDoc(cs.fbSdk.doc(cs.db, 'public_units', unitDocId), {
            ...publicUnitPayload,
            updatedAt: cs.fbSdk.serverTimestamp()
          });

          const privRef = cs.fbSdk.doc(cs.db, 'private_customers', unitDocId);
          const privSnap = await cs.fbSdk.getDoc(privRef);
          if (privSnap.exists()) {
            await cs.fbSdk.setDoc(privRef, {
              ...privateCustPayload,
              updatedAt: cs.fbSdk.serverTimestamp()
            }, { merge: true });
          } else {
            await cs.fbSdk.setDoc(privRef, {
              ...privateCustPayload,
              createdAt: cs.fbSdk.serverTimestamp(),
              updatedAt: cs.fbSdk.serverTimestamp()
            });
          }
          customerLiveSynced = true;
        } catch (err) {
          console.warn('Customer Live auto-sync warning:', err?.message || err);
        }
      }

      // Sync local caches so Admin & Public Customer Live see it right away
      const updatedCust = { id: unitDocId, ...privateCustPayload };
      privateCustomers = [updatedCust, ...privateCustomers.filter(c => c.id !== unitDocId)];
      saveCachedPrivateCustomers(privateCustomers);

      try {
        const rawPub = localStorage.getItem(PUBLIC_UNITS_CACHE_KEY);
        const pubArr = rawPub ? JSON.parse(rawPub) : [];
        const cleanPub = [
          { id: unitDocId, ...publicUnitPayload },
          ...(Array.isArray(pubArr) ? pubArr.filter(u => u.id !== unitDocId) : [])
        ];
        localStorage.setItem(PUBLIC_UNITS_CACHE_KEY, JSON.stringify(cleanPub));
      } catch {}
    }

    // 5. Append Admin Audit Log
    if (cs.db && cs.fbSdk && cs.user) {
      try {
        await cs.fbSdk.addDoc(cs.fbSdk.collection(cs.db, 'adminAuditLogs'), {
          actorUid: cs.user.uid,
          actorEmail: cs.user.email || '',
          eventType: 'INVOICE_GENERATED',
          summary: `Bill ${draft.invoiceNo} (${fmtMoney(calc.grandTotal)}) saved${driveSaved ? ' + Google Drive' : ''}${customerLiveSynced ? ' + Customer Live' : ''}`,
          severity: 'INFO',
          createdAt: cs.fbSdk.serverTimestamp()
        });
      } catch {}
    }

    // 6. Update local Admin invoices cache
    const localRecord = {
      id: invoiceId,
      ...firestoreRecord,
      items: calc.items,
      paymentMethod: draft.paymentMethod,
      notes: draft.notes
    };
    privateInvoices = [localRecord, ...privateInvoices.filter(x => x.invoiceNo !== localRecord.invoiceNo)].slice(0, 120);
    saveCachedPrivateInvoices(privateInvoices);

    savingBillBusy = false;
    refreshInvoiceDom();

    if (driveSaved && customerLiveSynced) {
      window.showToast(`Bill ${draft.invoiceNo} saved to Firestore, Google Drive & Customer Live!`);
    } else if (driveSaved) {
      window.showToast(`Bill ${draft.invoiceNo} saved to Firestore & Google Drive!`);
    } else if (customerLiveSynced) {
      window.showToast(`Bill ${draft.invoiceNo} saved to Firestore & synced to Customer Live!`);
    } else {
      window.showToast(`Bill ${draft.invoiceNo} saved to Firestore! Configure Code.gs URL for auto-Google Drive backup.`);
    }
  }

  /* =========================================================================
     GOOGLE SHEETS CSV EXPORT, PNG IMAGE EXPORT & PDF DOWNLOAD
     ========================================================================= */
  function buildCsvRows(invoicesList) {
    const headers = [
      'Invoice Number', 'Invoice Date', 'Due Date', 'Warranty Start', 'Warranty Expiry',
      'Payment Status', 'Customer Name', 'Customer Mobile', 'Customer Place / Address',
      'Product Model(s)', 'Total Qty', 'Unit Price (INR)',
      'Discount %', 'GST %', 'Grand Total (INR)', 'Google Drive Archived'
    ];
    const escapeCsv = (val) => '"' + String(val ?? '').replace(/"/g, '""') + '"';
    const rows = invoicesList.map(inv => {
      const calc = inv.grandTotal !== undefined && !inv.items
        ? {
            primaryModel: inv.modelName || '',
            totalQty: inv.quantity || 1,
            primaryUnitPrice: inv.unitPrice || 0,
            discountPct: inv.discountPct || 0,
            taxPct: inv.taxPct || 18,
            grandTotal: inv.grandTotal || 0
          }
        : calculateInvoiceTotals(inv);
      return [
        inv.invoiceNo,
        inv.invoiceDate,
        inv.dueDate,
        inv.warrantyStartDate || '',
        inv.warrantyExpiryDate || '',
        inv.status,
        inv.customerName || inv.clientName || '',
        inv.mobileNumber || inv.clientPhone || '',
        inv.address || inv.clientAddress || '',
        calc.primaryModel,
        calc.totalQty,
        calc.primaryUnitPrice,
        calc.discountPct,
        calc.taxPct,
        calc.grandTotal,
        inv.driveSaved ? (inv.driveFileUrl || 'YES (Google Drive)') : 'Firestore Saved'
      ].map(escapeCsv).join(',');
    });
    return '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
  }

  function exportCurrentInvoiceCsv() {
    const csvContent = buildCsvRows([draft]);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draft.invoiceNo}-GoogleSheets.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    window.showToast(`Downloaded ${draft.invoiceNo}.csv`);
  }

  function exportAllSavedInvoicesCsv() {
    const list = privateInvoices.length ? privateInvoices : [draft];
    const csvContent = buildCsvRows(list);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AgniVolt-Admin-Bills-Ledger-${todayIso(0)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    window.showToast(`Exported ${list.length} bill(s) to CSV`);
  }

  function downloadInvoiceImagePng() {
    const pal = PALETTES[draft.palette] || PALETTES.violet;
    const calc = calculateInvoiceTotals(draft);
    const isClassic = draft.frameStyle === 'classic';

    const W = 1240;
    const baseH = 1260;
    const extraRows = Math.max(0, calc.items.length - 3);
    const H = baseH + extraRows * 68;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    if (isClassic) {
      ctx.strokeStyle = pal.primary;
      ctx.lineWidth = 6;
      ctx.strokeRect(28, 28, W - 56, H - 56);
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, W - 80, H - 80);
    } else {
      const grad = ctx.createLinearGradient(0, 0, W, 240);
      grad.addColorStop(0, pal.primary);
      grad.addColorStop(1, pal.secondary);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, 235);
    }

    if (isClassic) {
      ctx.fillStyle = pal.primary;
      ctx.font = '900 58px Georgia, serif';
      ctx.fillText('INVOICE', 76, 125);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#111827';
      ctx.font = '800 24px Plus Jakarta Sans, sans-serif';
      ctx.fillText(draft.businessName, W - 76, 95);
      ctx.fillStyle = '#4B5563';
      ctx.font = '500 16px Plus Jakarta Sans, sans-serif';
      ctx.fillText(draft.businessAddress, W - 76, 124);
      ctx.fillText(`${draft.businessPhone}${draft.businessEmail ? '  •  ' + draft.businessEmail : ''}`, W - 76, 150);
      if (draft.businessGstin) ctx.fillText(`GSTIN: ${draft.businessGstin}`, W - 76, 176);
      ctx.textAlign = 'left';
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 32px Plus Jakarta Sans, sans-serif';
      ctx.fillText(draft.businessName, 64, 78);
      ctx.fillStyle = 'rgba(255,255,255,0.86)';
      ctx.font = '500 16px Plus Jakarta Sans, sans-serif';
      ctx.fillText(draft.businessTagline, 64, 108);
      ctx.fillText(draft.businessAddress, 64, 138);
      ctx.fillText(
        [draft.businessPhone, draft.businessEmail, draft.businessGstin ? `GSTIN: ${draft.businessGstin}` : ''].filter(Boolean).join('  •  '),
        64,
        166
      );

      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 46px Georgia, serif';
      ctx.fillText('TAX INVOICE', W - 64, 88);
      ctx.font = '700 20px JetBrains Mono, monospace';
      ctx.fillText(`# ${draft.invoiceNo}`, W - 64, 126);
      ctx.font = '600 15px Plus Jakarta Sans, sans-serif';
      ctx.fillText(`Issued: ${draft.invoiceDate}   •   Due: ${draft.dueDate}`, W - 64, 158);
      ctx.textAlign = 'left';
    }

    const boxY = 265;
    ctx.fillStyle = pal.softBg;
    ctx.strokeStyle = pal.border;
    ctx.lineWidth = 2;
    ctx.fillRect(64, boxY, 530, 175);
    ctx.strokeRect(64, boxY, 530, 175);

    ctx.fillStyle = pal.primary;
    ctx.fillRect(64, boxY, 530, 34);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 13px Plus Jakarta Sans, sans-serif';
    ctx.fillText('BILL TO CUSTOMER', 80, boxY + 22);

    ctx.fillStyle = '#111827';
    ctx.font = '800 21px Plus Jakarta Sans, sans-serif';
    ctx.fillText(draft.clientName || 'Valued Customer', 80, boxY + 66);
    ctx.fillStyle = '#374151';
    ctx.font = '500 15px Plus Jakarta Sans, sans-serif';
    ctx.fillText(`Mobile: ${draft.clientPhone || '—'}`, 80, boxY + 95);
    ctx.fillText(`Place: ${draft.clientAddress || '—'}`, 80, boxY + 122);
    ctx.fillText(`Hardware: ${draft.hardwareType || 'Water Level Controller'}`, 80, boxY + 149);

    ctx.fillStyle = pal.softBg;
    ctx.fillRect(626, boxY, 550, 175);
    ctx.strokeRect(626, boxY, 550, 175);
    ctx.fillStyle = pal.primary;
    ctx.fillRect(626, boxY, 550, 34);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 13px Plus Jakarta Sans, sans-serif';
    ctx.fillText('INVOICE & WARRANTY DETAILS', 642, boxY + 22);

    ctx.fillStyle = '#111827';
    ctx.font = '700 16px JetBrains Mono, monospace';
    ctx.fillText(`Invoice No: ${draft.invoiceNo}`, 642, boxY + 66);
    ctx.font = '600 15px Plus Jakarta Sans, sans-serif';
    ctx.fillText(`Status: ${draft.status}   •   Mode: ${draft.paymentMethod}`, 642, boxY + 96);
    ctx.fillStyle = '#4B5563';
    ctx.font = '600 14px JetBrains Mono, monospace';
    if (draft.warrantyStartDate && draft.warrantyExpiryDate) {
      ctx.fillText(`Warranty: ${draft.warrantyStartDate} to ${draft.warrantyExpiryDate}`, 642, boxY + 126);
    } else {
      ctx.fillText(draft.paymentDetails.slice(0, 58), 642, boxY + 126);
    }
    ctx.font = '500 13px Plus Jakarta Sans, sans-serif';
    ctx.fillText(draft.paymentDetails.slice(0, 62), 642, boxY + 150);

    let tableY = 475;
    ctx.fillStyle = pal.primary;
    ctx.fillRect(64, tableY, W - 128, 46);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 14px Plus Jakarta Sans, sans-serif';
    ctx.fillText('#', 84, tableY + 29);
    ctx.fillText('MODEL / DESCRIPTION', 135, tableY + 29);
    ctx.fillText('QTY', 735, tableY + 29);
    ctx.fillText('UNIT', 815, tableY + 29);
    ctx.textAlign = 'right';
    ctx.fillText('UNIT PRICE', 1010, tableY + 29);
    ctx.fillText('LINE TOTAL', W - 84, tableY + 29);
    ctx.textAlign = 'left';

    tableY += 46;
    const minRows = Math.max(4, calc.items.length);
    for (let i = 0; i < minRows; i++) {
      const it = calc.items[i];
      const rowH = 56;
      ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : pal.softBg;
      ctx.fillRect(64, tableY, W - 128, rowH);
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(64, tableY, W - 128, rowH);

      if (it) {
        ctx.fillStyle = '#374151';
        ctx.font = '700 15px JetBrains Mono, monospace';
        ctx.fillText(String(i + 1), 84, tableY + 34);

        ctx.fillStyle = '#111827';
        ctx.font = '700 16px Plus Jakarta Sans, sans-serif';
        ctx.fillText(String(it.desc).slice(0, 52), 135, tableY + 34);

        ctx.font = '700 15px JetBrains Mono, monospace';
        ctx.fillText(String(it.qty), 740, tableY + 34);

        ctx.font = '600 14px Plus Jakarta Sans, sans-serif';
        ctx.fillText(String(it.unit || 'Unit'), 815, tableY + 34);

        ctx.textAlign = 'right';
        ctx.font = '600 15px JetBrains Mono, monospace';
        ctx.fillText(fmtMoney(it.price), 1010, tableY + 34);
        ctx.fillStyle = pal.primary;
        ctx.font = '800 16px JetBrains Mono, monospace';
        ctx.fillText(fmtMoney(it.lineTotal), W - 84, tableY + 34);
        ctx.textAlign = 'left';
      }
      tableY += rowH;
    }

    const sumY = tableY + 28;
    ctx.fillStyle = pal.softBg;
    ctx.strokeStyle = pal.border;
    ctx.lineWidth = 1.5;
    ctx.fillRect(64, sumY, 610, 185);
    ctx.strokeRect(64, sumY, 610, 185);

    ctx.fillStyle = pal.primary;
    ctx.font = '800 14px Plus Jakarta Sans, sans-serif';
    ctx.fillText('WARRANTY TERMS & AUTHORIZED SIGNATURE', 84, sumY + 32);
    ctx.fillStyle = '#374151';
    ctx.font = '500 14px Plus Jakarta Sans, sans-serif';
    ctx.fillText(draft.notes.slice(0, 74), 84, sumY + 62);
    if (draft.notes.length > 74) {
      ctx.fillText(draft.notes.slice(74, 148), 84, sumY + 84);
    }

    ctx.fillStyle = pal.primary;
    ctx.font = 'italic 700 22px Georgia, serif';
    ctx.fillText(draft.signatory, 84, sumY + 142);
    ctx.fillStyle = '#6B7280';
    ctx.font = '600 12px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Verified by AGNI VOLT ELECTRONIC Admin', 84, sumY + 166);

    const totX = 706;
    const totW = W - 64 - totX;
    ctx.fillStyle = pal.softBg;
    ctx.fillRect(totX, sumY, totW, 185);
    ctx.strokeRect(totX, sumY, totW, 185);

    const drawTotRow = (label, val, yOffset, bold = false) => {
      ctx.fillStyle = bold ? pal.primary : '#374151';
      ctx.font = bold ? '800 18px Plus Jakarta Sans, sans-serif' : '600 15px Plus Jakarta Sans, sans-serif';
      ctx.fillText(label, totX + 22, sumY + yOffset);
      ctx.textAlign = 'right';
      ctx.font = bold ? '900 22px JetBrains Mono, monospace' : '700 16px JetBrains Mono, monospace';
      ctx.fillText(val, totX + totW - 22, sumY + yOffset);
      ctx.textAlign = 'left';
    };

    drawTotRow('Subtotal', fmtMoney(calc.subtotal), 38);
    drawTotRow(`Discount (${calc.discountPct}%)`, '- ' + fmtMoney(calc.discountAmt), 72);
    drawTotRow(`GST / Tax (${calc.taxPct}%)`, '+ ' + fmtMoney(calc.taxAmt), 106);

    ctx.fillStyle = pal.primary;
    ctx.fillRect(totX, sumY + 128, totW, 57);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 17px Plus Jakarta Sans, sans-serif';
    ctx.fillText('GRAND TOTAL', totX + 22, sumY + 163);
    ctx.textAlign = 'right';
    ctx.font = '900 24px JetBrains Mono, monospace';
    ctx.fillText(fmtMoney(calc.grandTotal), totX + totW - 22, sumY + 164);
    ctx.textAlign = 'left';

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${draft.invoiceNo}-Invoice.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      window.showToast(`Downloaded High-Res Invoice Image (${draft.invoiceNo}.png)`);
    }, 'image/png');
  }

  function downloadInvoicePdf() {
    window.showToast('Opening Print / Save as PDF dialog...');
    setTimeout(() => {
      window.print();
    }, 220);
  }

  /* =========================================================================
     LIVE FORM HANDLERS
     ========================================================================= */
  function updateInvoiceField(field, val) {
    if (field === 'discountPct' || field === 'taxPct') {
      draft[field] = Math.max(0, Math.min(100, Number(val) || 0));
    } else if (field === 'syncToCustomerLive') {
      draft.syncToCustomerLive = Boolean(val);
    } else if (field === 'googleSheetWebhook') {
      draft[field] = String(val ?? '').trim().slice(0, 500);
    } else if (field === 'driveSyncSecret') {
      draft[field] = String(val ?? '').trim().slice(0, 200);
    } else {
      draft[field] = sanitizeInput(val, 250);
    }
    refreshInvoicePreviewOnly();
  }

  function setInvoicePalette(paletteId) {
    if (!PALETTES[paletteId]) return;
    draft.palette = paletteId;
    refreshInvoiceDom();
    window.showToast(`Theme switched to ${PALETTES[paletteId].name}`);
  }

  function setInvoiceFrameStyle(style) {
    draft.frameStyle = style === 'classic' ? 'classic' : 'colorful';
    refreshInvoiceDom();
    window.showToast(style === 'classic' ? 'Classic Double-Border Frame Activated' : 'Colorful Executive Frame Activated');
  }

  function updateInvoiceLineItem(idx, key, val) {
    const item = draft.items[idx];
    if (!item) return;
    if (key === 'qty') {
      item.qty = Math.max(1, Math.min(10000, Number(val) || 1));
    } else if (key === 'price') {
      item.price = Math.max(0, Math.min(100000000, Number(val) || 0));
    } else if (key === 'unit') {
      item.unit = sanitizeInput(val, 30);
    } else {
      item.desc = sanitizeInput(val, 160);
    }
    refreshInvoicePreviewOnly();
  }

  function addInvoiceLineItem() {
    const firstProd = (businessProducts || []).find(p => p && p.enabled !== false);
    draft.items.push({
      id: 'i_' + Date.now().toString(36),
      desc: firstProd ? firstProd.name : 'AgniVolt HydroSeal Brass Water Stopper Valve',
      unit: 'Unit',
      qty: 1,
      price: firstProd ? (Number(firstProd.price) || 3499) : 4950
    });
    refreshInvoiceDom();
  }

  function removeInvoiceLineItem(idx) {
    if (draft.items.length <= 1) {
      window.showToast('Invoice must have at least 1 line item');
      return;
    }
    draft.items.splice(idx, 1);
    refreshInvoiceDom();
  }

  function loadSavedInvoiceIntoEditor(invId) {
    const found = privateInvoices.find(x => x.id === invId);
    if (!found) return;
    draft = {
      ...draft,
      invoiceNo: found.invoiceNo || draft.invoiceNo,
      invoiceDate: found.invoiceDate || draft.invoiceDate,
      dueDate: found.dueDate || draft.dueDate,
      warrantyStartDate: found.warrantyStartDate || found.invoiceDate || draft.warrantyStartDate,
      warrantyExpiryDate: found.warrantyExpiryDate || draft.warrantyExpiryDate,
      syncToCustomerLive: found.syncToCustomerLive !== false,
      status: found.status || 'PAID',
      palette: found.palette || draft.palette,
      clientName: found.customerName || found.clientName || '',
      clientPhone: found.mobileNumber || found.clientPhone || '',
      clientAddress: found.address || found.clientAddress || '',
      hardwareType: found.hardwareType || 'Water Level Controller',
      discountPct: typeof found.discountPct === 'number' ? found.discountPct : 0,
      taxPct: typeof found.taxPct === 'number' ? found.taxPct : 18,
      items: Array.isArray(found.items) && found.items.length
        ? JSON.parse(JSON.stringify(found.items))
        : [{ id: 'i1', desc: found.modelName || 'AgniVolt Water Level Controller', unit: 'Unit', qty: found.quantity || 1, price: found.unitPrice || found.grandTotal || 0 }]
    };
    refreshInvoiceDom();
    window.showToast(`Loaded ${found.invoiceNo} into editor`);
  }

  function deleteSavedInvoice(invId) {
    const cs = typeof window.getCloudState === 'function' ? window.getCloudState() : null;
    privateInvoices = privateInvoices.filter(x => x.id !== invId);
    saveCachedPrivateInvoices(privateInvoices);
    if (cs && cs.isAdmin && cs.db && cs.fbSdk) {
      cs.fbSdk.deleteDoc(cs.fbSdk.doc(cs.db, 'private_invoices', sanitizeId(invId))).catch(() => {});
    }
    refreshInvoiceDom();
    window.showToast('Invoice removed from Firestore vault');
  }

  function copyAppsScriptCodeToClipboard() {
    fetch('Code.gs?v=' + Date.now(), { cache: 'no-store' })
      .then(r => r.text())
      .then(txt => {
        if (navigator.clipboard && txt) {
          navigator.clipboard.writeText(txt);
          window.showToast('Copied Code.gs (AGNI_VOLT_Permanent_Bills) to clipboard!');
        }
      })
      .catch(() => {
        window.showToast('Open Code.gs from project files to copy the Google Drive script');
      });
  }

  /* =========================================================================
     LIVE INVOICE SHEET PREVIEW HTML
     ========================================================================= */
  function renderLiveInvoicePaperHtml() {
    const pal = PALETTES[draft.palette] || PALETTES.violet;
    const calc = calculateInvoiceTotals(draft);
    const isClassic = draft.frameStyle === 'classic';
    const esc = window.esc;

    const minRows = Math.max(4, calc.items.length);
    const displayRows = [];
    for (let i = 0; i < minRows; i++) {
      displayRows.push(calc.items[i] || null);
    }

    return `
      <div
        id="printableInvoicePaper"
        class="inv-paper ${isClassic ? 'inv-paper-classic' : 'inv-paper-colorful'}"
        style="--inv-primary:${pal.primary};--inv-secondary:${pal.secondary};--inv-soft:${pal.softBg};--inv-border:${pal.border};--inv-grad:${pal.headerGrad};--inv-badge-bg:${pal.badgeBg};--inv-badge-ink:${pal.badgeInk};"
      >
        ${isClassic ? `
          <div class="inv-classic-head">
            <div>
              <div class="inv-classic-wordmark serif">INVOICE</div>
              <div class="inv-status-chip">${esc(draft.status)} &bull; #${esc(draft.invoiceNo)}</div>
            </div>
            <div class="inv-classic-biz">
              <div class="inv-biz-title">${esc(draft.businessName)}</div>
              <div>${esc(draft.businessAddress)}</div>
              <div>${[draft.businessPhone, draft.businessEmail].filter(Boolean).map(esc).join(' &bull; ')}</div>
              ${draft.businessGstin ? `<div class="mono" style="font-weight:700;margin-top:2px;">GSTIN: ${esc(draft.businessGstin)}</div>` : ''}
            </div>
          </div>
        ` : `
          <div class="inv-color-head">
            <div class="inv-color-biz">
              <div class="inv-eyebrow-chip">AGNI VOLT ELECTRONIC &bull; OFFICIAL BILL</div>
              <div class="inv-biz-title-light">${esc(draft.businessName)}</div>
              <div class="inv-biz-sub-light">${esc(draft.businessTagline)}</div>
              ${draft.businessAddress ? `<div class="inv-biz-meta-light">${esc(draft.businessAddress)}</div>` : ''}
              <div class="inv-biz-meta-light">${[draft.businessPhone, draft.businessEmail, draft.businessGstin ? `GSTIN: ${draft.businessGstin}` : ''].filter(Boolean).map(esc).join(' &bull; ')}</div>
            </div>
            <div class="inv-color-meta">
              <div class="inv-title-display serif">TAX INVOICE</div>
              <div class="inv-num-pill mono"># ${esc(draft.invoiceNo)}</div>
              <div class="inv-dates-light">
                <span>Issued: <strong>${esc(draft.invoiceDate)}</strong></span>
                <span>Due: <strong>${esc(draft.dueDate)}</strong></span>
              </div>
              <div class="inv-paid-stamp">${esc(draft.status)}</div>
            </div>
          </div>
        `}

        <div class="inv-info-grid">
          <div class="inv-info-box">
            <div class="inv-box-bar">BILL TO (CUSTOMER)</div>
            <div class="inv-box-body">
              <div class="inv-client-name">${esc(draft.clientName || 'Customer Name')}</div>
              <div><strong>Mobile:</strong> ${esc(draft.clientPhone || '—')}</div>
              <div><strong>Place / Address:</strong> ${esc(draft.clientAddress || '—')}</div>
              <div><strong>Hardware:</strong> ${esc(draft.hardwareType || 'Water Level Controller')}</div>
            </div>
          </div>

          <div class="inv-info-box">
            <div class="inv-box-bar">WARRANTY &amp; PAYMENT DETAILS</div>
            <div class="inv-box-body">
              <div><strong>Payment Mode:</strong> ${esc(draft.paymentMethod)}</div>
              <div><strong>Bill Date:</strong> <span class="mono">${esc(draft.invoiceDate)}</span> &bull; <strong>Due:</strong> <span class="mono">${esc(draft.dueDate)}</span></div>
              ${draft.warrantyStartDate && draft.warrantyExpiryDate ? `
                <div style="margin-top:4px;color:${pal.primary};font-weight:700;">
                  Warranty: <span class="mono">${esc(draft.warrantyStartDate)}</span> to <span class="mono">${esc(draft.warrantyExpiryDate)}</span>
                </div>
              ` : ''}
              ${draft.paymentDetails ? `<div style="margin-top:4px;font-size:11.5px;opacity:0.85;">${esc(draft.paymentDetails)}</div>` : ''}
            </div>
          </div>
        </div>

        <div class="inv-table-wrap">
          <table class="inv-table">
            <thead>
              <tr>
                <th style="width:42px;text-align:center;">#</th>
                <th>Model / Product Description</th>
                <th style="width:68px;text-align:center;">Qty</th>
                <th style="width:74px;text-align:center;">Unit</th>
                <th style="width:120px;text-align:right;">Unit Price</th>
                <th style="width:130px;text-align:right;">Line Total</th>
              </tr>
            </thead>
            <tbody>
              ${displayRows.map((it, idx) => it ? `
                <tr>
                  <td style="text-align:center;" class="mono">${idx + 1}</td>
                  <td style="font-weight:700;">${esc(it.desc)}</td>
                  <td style="text-align:center;" class="mono">${it.qty}</td>
                  <td style="text-align:center;">${esc(it.unit)}</td>
                  <td style="text-align:right;" class="mono">${fmtMoney(it.price)}</td>
                  <td style="text-align:right;font-weight:800;color:${pal.primary};" class="mono">${fmtMoney(it.lineTotal)}</td>
                </tr>
              ` : `
                <tr class="inv-empty-row">
                  <td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="inv-summary-grid">
          <div class="inv-notes-box">
            <div class="inv-notes-label">WARRANTY TERMS &amp; AUTHORIZED SIGNATURE</div>
            <p class="inv-notes-text">${esc(draft.notes)}</p>
            <div class="inv-signature-line">
              <div class="inv-sig-script">${esc(draft.signatory)}</div>
              <div class="inv-sig-caption">Authorized Signatory &bull; Permanent Drive Archive</div>
            </div>
          </div>

          <div class="inv-totals-box">
            <div class="inv-total-row">
              <span>Subtotal</span>
              <strong class="mono">${fmtMoney(calc.subtotal)}</strong>
            </div>
            <div class="inv-total-row">
              <span>Discount (${calc.discountPct}%)</span>
              <strong class="mono" style="color:#E11D48;">- ${fmtMoney(calc.discountAmt)}</strong>
            </div>
            <div class="inv-total-row">
              <span>Taxable Amount</span>
              <strong class="mono">${fmtMoney(calc.taxable)}</strong>
            </div>
            <div class="inv-total-row">
              <span>GST / Tax (${calc.taxPct}%)</span>
              <strong class="mono">+ ${fmtMoney(calc.taxAmt)}</strong>
            </div>
            <div class="inv-grand-row">
              <span>GRAND TOTAL</span>
              <strong class="mono">${fmtMoney(calc.grandTotal)}</strong>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function refreshInvoicePreviewOnly() {
    const previewContainer = document.getElementById('liveInvoicePreviewMount');
    if (previewContainer) {
      previewContainer.innerHTML = renderLiveInvoicePaperHtml();
    }
    const kpiTotal = document.getElementById('invKpiGrandTotal');
    if (kpiTotal) {
      kpiTotal.textContent = fmtMoney(calculateInvoiceTotals(draft).grandTotal);
    }
  }

  function refreshInvoiceDom() {
    const pageRoot = document.getElementById('invoiceStudioMount');
    if (pageRoot) {
      pageRoot.innerHTML = renderInvoiceStudioInner();
    }
  }

  function renderInvoiceStudioInner() {
    const esc = window.esc;
    const ic = window.ic;
    const calc = calculateInvoiceTotals(draft);
    const cs = typeof window.getCloudState === 'function' ? window.getCloudState() : { checkingInvoiceAuth: false, isAdmin: false };

    // 1. Strict Admin-Only Guard on invoice.html
    if (cs.checkingInvoiceAuth) {
      return `
        <div class="card" style="text-align:center;padding:42px 20px;margin:20px 0;">
          <span class="badge badge-purple" style="margin-bottom:10px;">${ic('shield')} Verifying Admin Session</span>
          <h1 class="page-title serif">Checking Firebase Admin Authorization...</h1>
          <p class="page-desc" style="margin:8px auto 0;">Invoice Generator is restricted exclusively to verified Admin UID.</p>
        </div>
      `;
    }

    if (!cs.isAdmin) {
      clearTimeout(redirectTimer);
      redirectTimer = setTimeout(() => {
        window.location.replace('index.html');
      }, 2200);

      return `
        <div class="card" style="text-align:center;padding:42px 24px;margin:24px auto;max-width:560px;border:2px solid var(--rose);">
          <span class="badge badge-rose" style="margin-bottom:12px;">${ic('lock')} Admin-Only Restricted Vault</span>
          <h1 class="page-title serif" style="margin-bottom:10px;">Admin Authentication Required</h1>
          <p style="font-size:14px;color:var(--ink-secondary);line-height:1.6;margin-bottom:18px;">
            The Manual Bill Generator &amp; Google Drive Archive is locked strictly to the verified AGNI VOLT ELECTRONIC Admin account. Redirecting to the public page...
          </p>
          <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">
            <a href="admin/" class="btn btn-primary" style="text-decoration:none;">${ic('lock')} Sign In at Admin Console</a>
            <a href="index.html" class="btn btn-outline" style="text-decoration:none;">Return to Landing Page</a>
          </div>
        </div>
      `;
    }

    loadPrivateAdminVaultFromFirestore();
    const enabledProds = (businessProducts || []).filter(p => p && p.enabled !== false);

    return `
      <div class="page-header no-print">
        <div>
          <div class="page-eyebrow">${ic('shield')} AGNI VOLT ELECTRONIC &bull; Admin Billing Studio</div>
          <h1 class="page-title serif">Bill Generator, Customer Live Sync &amp; Drive Backup</h1>
          <p class="page-desc">Every bill saved with warranty dates automatically syncs the customer (with masked phone) to <strong>Customer Live</strong> and backs up a permanent copy to your Google Drive.</p>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
          <button class="btn btn-primary" onclick="generateAndSaveAdminBill()" ${savingBillBusy ? 'disabled' : ''}>
            ${ic('cloud')} ${savingBillBusy ? 'Saving Bill, Live & Drive...' : 'Generate & Save Bill'}
          </button>
          <button class="btn btn-soft" onclick="downloadInvoiceImagePng()">
            ${ic('download')} Download PNG
          </button>
          <button class="btn btn-outline" onclick="downloadInvoicePdf()">
            ${ic('receipt')} Save PDF
          </button>
          <a href="admin/" class="btn btn-outline" style="text-decoration:none;">
            ${ic('lock')} Back to Admin
          </a>
        </div>
      </div>

      <div class="card no-print" style="margin-bottom:20px;padding:18px 20px;">
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;">
          <div>
            <div style="font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--primary);margin-bottom:8px;">
              1. Pick Luxury Color Theme
            </div>
            <div class="inv-palette-bar">
              ${Object.values(PALETTES).map(p => `
                <button
                  type="button"
                  class="inv-swatch-btn ${draft.palette === p.id ? 'active' : ''}"
                  onclick="setInvoicePalette('${p.id}')"
                >
                  <span class="inv-swatch-dot" style="background:${p.primary};"></span>
                  <span>${esc(p.name)}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div>
            <div style="font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--primary);margin-bottom:8px;">
              2. Template Frame
            </div>
            <div class="pill-tabs">
              <button class="pill-tab ${draft.frameStyle === 'colorful' ? 'active' : ''}" onclick="setInvoiceFrameStyle('colorful')">
                Colorful Executive
              </button>
              <button class="pill-tab ${draft.frameStyle === 'classic' ? 'active' : ''}" onclick="setInvoiceFrameStyle('classic')">
                Classic Double-Border
              </button>
            </div>
          </div>

          <div style="min-width:240px;flex:1;max-width:360px;">
            <div style="font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--primary);margin-bottom:6px;">
              3. Auto-Fill Existing Customer
            </div>
            <select class="select" onchange="selectExistingCustomerForBill(this.value)">
              <option value="">-- Manual Customer Entry --</option>
              ${privateCustomers.map(c => `
                <option value="${esc(c.id)}" ${draft.selectedCustomerId === c.id ? 'selected' : ''}>
                  ${esc(c.customerName)} (${esc(c.mobileNumber || 'No Phone')}) — ${esc(c.modelName)}
                </option>
              `).join('')}
            </select>
          </div>
        </div>
      </div>

      <div class="inv-studio-grid">
        <div class="inv-editor-col no-print">
          <div class="card" style="margin-bottom:16px;">
            <div class="card-header" style="margin-bottom:12px;">
              <div>
                <h2 class="card-title">Customer, Warranty &amp; Bill Details</h2>
                <p class="card-subtitle">Auto-syncs active warranty to Customer Live (phone masked)</p>
              </div>
              <span id="invKpiGrandTotal" class="badge badge-purple mono" style="font-size:13px;">${fmtMoney(calc.grandTotal)}</span>
            </div>

            <div class="grid-2" style="gap:10px;">
              <div class="form-group">
                <label class="form-label">Customer Full Name</label>
                <input class="input" value="${esc(draft.clientName)}" placeholder="Enter customer full name" oninput="updateInvoiceField('clientName', this.value)" />
              </div>
              <div class="form-group">
                <label class="form-label">Customer Mobile Number</label>
                <input class="input mono" value="${esc(draft.clientPhone)}" placeholder="+91 98XXXXXXXX" oninput="updateInvoiceField('clientPhone', this.value)" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Customer Place / Full Address</label>
              <input class="input" value="${esc(draft.clientAddress)}" placeholder="House/Flat, Area, City, PIN" oninput="updateInvoiceField('clientAddress', this.value)" />
            </div>

            <div class="grid-2" style="gap:10px;">
              <div class="form-group">
                <label class="form-label">Invoice Number</label>
                <input class="input mono" value="${esc(draft.invoiceNo)}" oninput="updateInvoiceField('invoiceNo', this.value)" />
              </div>
              <div class="form-group">
                <label class="form-label">Hardware Category</label>
                <select class="select" onchange="updateInvoiceField('hardwareType', this.value)">
                  <option value="Water Level Controller" ${draft.hardwareType === 'Water Level Controller' ? 'selected' : ''}>Water Level Controller</option>
                  <option value="Water Stopper" ${draft.hardwareType === 'Water Stopper' ? 'selected' : ''}>Water Stopper</option>
                </select>
              </div>
            </div>

            <div class="grid-2" style="gap:10px;">
              <div class="form-group">
                <label class="form-label">Invoice Date</label>
                <input type="date" class="input mono" value="${esc(draft.invoiceDate)}" oninput="updateInvoiceField('invoiceDate', this.value)" />
              </div>
              <div class="form-group">
                <label class="form-label">Due Date</label>
                <input type="date" class="input mono" value="${esc(draft.dueDate)}" oninput="updateInvoiceField('dueDate', this.value)" />
              </div>
            </div>

            <!-- Warranty Start & Expiry Dates + Customer Live Sync -->
            <div style="background:var(--surface-subtle);border:1px solid var(--border);border-radius:14px;padding:12px;margin-bottom:12px;">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:var(--primary);">
                  Customer Live Warranty Sync
                </span>
                <div style="display:flex;gap:4px;flex-wrap:wrap;">
                  <button type="button" class="btn btn-sm btn-soft" style="padding:3px 8px;font-size:11px;" onclick="applyWarrantyPreset(180)">+6M</button>
                  <button type="button" class="btn btn-sm btn-soft" style="padding:3px 8px;font-size:11px;" onclick="applyWarrantyPreset(365)">+1Y</button>
                  <button type="button" class="btn btn-sm btn-soft" style="padding:3px 8px;font-size:11px;" onclick="applyWarrantyPreset(730)">+2Y</button>
                  <button type="button" class="btn btn-sm btn-outline" style="padding:3px 8px;font-size:11px;" onclick="applyWarrantyPreset(0)">None</button>
                </div>
              </div>
              <div class="grid-2" style="gap:10px;">
                <div class="form-group" style="margin-bottom:6px;">
                  <label class="form-label">Warranty Start Date</label>
                  <input type="date" class="input mono" value="${esc(draft.warrantyStartDate)}" oninput="updateInvoiceField('warrantyStartDate', this.value)" />
                </div>
                <div class="form-group" style="margin-bottom:6px;">
                  <label class="form-label">Warranty Expiry Date</label>
                  <input type="date" class="input mono" value="${esc(draft.warrantyExpiryDate)}" oninput="updateInvoiceField('warrantyExpiryDate', this.value)" />
                </div>
              </div>
              <label style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--ink);cursor:pointer;margin-top:4px;">
                <input type="checkbox" ${draft.syncToCustomerLive ? 'checked' : ''} onchange="updateInvoiceField('syncToCustomerLive', this.checked)" />
                <span>Auto-add customer to public "Customer Live" list (Phone masked: <span class="mono">${esc(maskPhone(draft.clientPhone))}</span>)</span>
              </label>
            </div>

            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Payment Status</label>
              <select class="select" onchange="updateInvoiceField('status', this.value)">
                <option value="PAID" ${draft.status === 'PAID' ? 'selected' : ''}>PAID</option>
                <option value="PENDING" ${draft.status === 'PENDING' ? 'selected' : ''}>PENDING</option>
                <option value="OVERDUE" ${draft.status === 'OVERDUE' ? 'selected' : ''}>OVERDUE</option>
              </select>
            </div>
          </div>

          <div class="card" style="margin-bottom:16px;">
            <div class="card-header" style="margin-bottom:12px;">
              <div>
                <h2 class="card-title">Models, Quantity, Price, Discount &amp; GST</h2>
                <p class="card-subtitle">Quick-pick from your Admin catalog or enter custom items</p>
              </div>
              <button type="button" class="btn btn-sm btn-primary" onclick="addInvoiceLineItem()">
                ${ic('plus')} Add Row
              </button>
            </div>

            ${enabledProds.length ? `
              <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">
                ${enabledProds.map(p => `
                  <button type="button" class="btn btn-sm btn-outline" style="font-size:11px;padding:5px 10px;" onclick="quickAddCatalogProduct('${esc(p.id)}')">
                    + ${esc(p.name)} (₹${Number(p.price) || 0})
                  </button>
                `).join('')}
              </div>
            ` : ''}

            <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px;">
              ${draft.items.map((it, idx) => `
                <div class="inv-line-editor">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <span class="badge badge-purple mono">Item #${idx + 1}</span>
                    <button type="button" class="btn btn-sm btn-outline" style="padding:3px 8px;color:var(--rose);" onclick="removeInvoiceLineItem(${idx})">
                      ${ic('trash')} Remove
                    </button>
                  </div>
                  <div class="form-group" style="margin-bottom:8px;">
                    <input class="input" placeholder="Product Model" value="${esc(it.desc)}" oninput="updateInvoiceLineItem(${idx}, 'desc', this.value)" />
                  </div>
                  <div style="display:grid;grid-template-columns:1fr 1fr 1.3fr;gap:8px;">
                    <div>
                      <label class="form-label" style="font-size:10px;">Quantity</label>
                      <input type="number" min="1" step="1" class="input mono" value="${it.qty}" oninput="updateInvoiceLineItem(${idx}, 'qty', this.value)" />
                    </div>
                    <div>
                      <label class="form-label" style="font-size:10px;">Unit</label>
                      <input class="input" value="${esc(it.unit)}" oninput="updateInvoiceLineItem(${idx}, 'unit', this.value)" />
                    </div>
                    <div>
                      <label class="form-label" style="font-size:10px;">Unit Price (₹)</label>
                      <input type="number" min="0" step="50" class="input mono" value="${it.price}" oninput="updateInvoiceLineItem(${idx}, 'price', this.value)" />
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="grid-2" style="gap:10px;">
              <div class="form-group">
                <label class="form-label">Discount (%)</label>
                <input type="number" min="0" max="100" step="0.5" class="input mono" value="${draft.discountPct}" oninput="updateInvoiceField('discountPct', this.value)" />
              </div>
              <div class="form-group">
                <label class="form-label">GST / Tax Rate (%)</label>
                <input type="number" min="0" max="50" step="0.5" class="input mono" value="${draft.taxPct}" oninput="updateInvoiceField('taxPct', this.value)" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Authorized Signatory Name</label>
              <input class="input" value="${esc(draft.signatory)}" oninput="updateInvoiceField('signatory', this.value)" />
            </div>

            <button type="button" class="btn btn-primary" style="width:100%;" onclick="generateAndSaveAdminBill()" ${savingBillBusy ? 'disabled' : ''}>
              ${ic('check')} ${savingBillBusy ? 'Saving Bill...' : 'Generate & Save Bill Permanently'}
            </button>
          </div>

          <!-- Permanent Google Drive Backup Card -->
          <div class="card">
            <div class="card-header" style="margin-bottom:10px;">
              <div>
                <h2 class="card-title">Permanent Google Drive Bill Backup</h2>
                <p class="card-subtitle">Saves every bill PDF to Drive folder <code>AGNI_VOLT_Permanent_Bills</code> &amp; Sheets ledger</p>
              </div>
              <span class="badge badge-emerald">Admin Vault</span>
            </div>

            <div class="form-group">
              <label class="form-label">Google Apps Script Web App URL (<code>Code.gs</code> /exec URL)</label>
              <input
                class="input mono"
                placeholder="https://script.google.com/macros/s/.../exec"
                value="${esc(draft.googleSheetWebhook || '')}"
                oninput="updateInvoiceField('googleSheetWebhook', this.value)"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Optional Drive Sync Secret (Matches Script Property <code>DRIVE_SYNC_SECRET</code>)</label>
              <input
                type="password"
                class="input mono"
                placeholder="Leave blank if DRIVE_SYNC_SECRET is not set"
                value="${esc(draft.driveSyncSecret || '')}"
                oninput="updateInvoiceField('driveSyncSecret', this.value)"
              />
            </div>

            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;">
              <button type="button" class="btn btn-sm btn-primary" onclick="testDriveWebhookConnection()" ${driveTestBusy ? 'disabled' : ''}>
                ${ic('cloud')} ${driveTestBusy ? 'Testing...' : 'Test Drive Connection'}
              </button>
              <button type="button" class="btn btn-sm btn-soft" onclick="copyAppsScriptCodeToClipboard()">
                ${ic('check')} Copy Code.gs
              </button>
              <button type="button" class="btn btn-sm btn-outline" onclick="exportCurrentInvoiceCsv()">
                ${ic('download')} Current (.CSV)
              </button>
              <button type="button" class="btn btn-sm btn-outline" onclick="exportAllSavedInvoicesCsv()">
                ${ic('download')} All Bills (.CSV)
              </button>
            </div>

            <div style="border-top:1px solid var(--border);padding-top:12px;">
              <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-tertiary);margin-bottom:8px;">
                Saved Admin Bills Vault (${privateInvoices.length})
              </div>
              <div style="display:flex;flex-direction:column;gap:8px;max-height:220px;overflow-y:auto;">
                ${privateInvoices.map(inv => {
                  const safeId = sanitizeId(inv.id);
                  return `
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border-radius:10px;background:var(--bg-elevated);border:1px solid var(--border);">
                    <div style="min-width:0;cursor:pointer;" onclick="loadSavedInvoiceIntoEditor('${safeId}')">
                      <div class="mono" style="font-size:12px;font-weight:800;color:var(--primary);">${esc(inv.invoiceNo)}</div>
                      <div style="font-size:11.5px;color:var(--ink-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                        ${esc(inv.customerName || inv.clientName)} &bull; ${fmtMoney(inv.grandTotal || 0)} &bull; ${inv.driveSaved ? 'Drive Saved' : 'Firestore'}
                      </div>
                    </div>
                    <div style="display:flex;gap:4px;">
                      <button class="btn btn-sm btn-soft" style="padding:4px 8px;" onclick="loadSavedInvoiceIntoEditor('${safeId}')">Load</button>
                      <button class="btn btn-sm btn-outline" style="padding:4px 8px;color:var(--rose);" onclick="deleteSavedInvoice('${safeId}')">&times;</button>
                    </div>
                  </div>
                `;
                }).join('') || '<div style="font-size:12px;color:var(--ink-tertiary);">No saved bills yet. Click "Generate & Save Bill" above.</div>'}
              </div>
            </div>
          </div>
        </div>

        <div class="inv-preview-col">
          <div class="inv-preview-toolbar no-print">
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="status-dot"></span>
              <span style="font-size:12px;font-weight:700;">Live Printable A4 Invoice Preview</span>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="btn btn-sm btn-primary" onclick="generateAndSaveAdminBill()">${ic('cloud')} Generate &amp; Save Bill</button>
              <button class="btn btn-sm btn-soft" onclick="downloadInvoiceImagePng()">${ic('download')} PNG Image</button>
              <button class="btn btn-sm btn-outline" onclick="downloadInvoicePdf()">${ic('receipt')} Save PDF</button>
            </div>
          </div>

          <div id="liveInvoicePreviewMount">
            ${renderLiveInvoicePaperHtml()}
          </div>
        </div>
      </div>
    `;
  }

  function renderInvoiceGeneratorPage() {
    return `<div id="invoiceStudioMount">${renderInvoiceStudioInner()}</div>`;
  }

  Object.assign(window, {
    renderInvoiceGeneratorPage,
    selectExistingCustomerForBill,
    quickAddCatalogProduct,
    applyWarrantyPreset,
    updateInvoiceField,
    setInvoicePalette,
    setInvoiceFrameStyle,
    updateInvoiceLineItem,
    addInvoiceLineItem,
    removeInvoiceLineItem,
    generateAndSaveAdminBill,
    testDriveWebhookConnection,
    loadSavedInvoiceIntoEditor,
    deleteSavedInvoice,
    exportCurrentInvoiceCsv,
    exportAllSavedInvoicesCsv,
    downloadInvoiceImagePng,
    downloadInvoicePdf,
    copyAppsScriptCodeToClipboard
  });
})();
