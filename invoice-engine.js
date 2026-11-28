/* =========================================================================
   AQUAVAULT — ADMIN-ONLY MANUAL BILL GENERATOR & AUTOMATIC GOOGLE DRIVE VAULT
   - Strict Admin-UID Guard: Only authenticated Admin (UID: Y8zmDKBgubWIVvhufftRPPjG7HC3)
     can open invoice.html; non-admin visitors are automatically redirected to index.html
   - Auto-Fill from `private_customers` OR Manual Entry of Customer Name,
     Mobile Number, Place/Address, Model, Quantity, Price, Discount, and GST
   - 6 Luxury Color Palettes + 2 Frame Styles (Colorful Executive & Classic Double-Border)
   - "Generate & Save Bill" permanently saves the bill to Firestore (`private_invoices`)
     AND automatically pushes the full bill + printable HTML to Admin's Google Drive
     (`AquaVault_Permanent_Bills` folder) & Google Sheets via Google Apps Script (`Code.gs`)
   - High-Resolution PNG Image Download, Print-Ready PDF Export & CSV Export
   ========================================================================= */

(function () {
  const ADMIN_CONFIG_KEY = 'aquavault_admin_config_v1';
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
  let cloudLoadedForAdmin = false;
  let redirectTimer = null;
  let savingBillBusy = false;

  function todayIso(offsetDays = 0) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return new Date(d.getTime() + offsetDays * 86400000).toISOString().slice(0, 10);
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

  function loadCachedPrivateCustomers() {
    try {
      const raw = localStorage.getItem(PRIVATE_CUSTOMERS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch {}
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
        installDate: todayIso(-125),
        expiryDate: todayIso(240),
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
        installDate: todayIso(-180),
        expiryDate: todayIso(185),
        warrantyDays: 365,
        basePrice: 6800,
        gstRate: 18,
        invoiceNo: 'INV-AQV-2026-1189'
      }
    ];
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
    return {
      palette: adm.palette || 'violet',
      frameStyle: adm.frameStyle === 'classic' ? 'classic' : 'colorful',
      selectedCustomerId: '',
      invoiceNo: 'INV-AQV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      invoiceDate: todayIso(0),
      dueDate: todayIso(14),
      status: 'PAID',
      businessName: adm.businessName || 'AquaVault Smart Systems Pvt. Ltd.',
      businessTagline: 'Precision Water Level Controllers & Motorized Brass Stoppers',
      businessAddress: adm.businessAddress || 'Tower B, Indiranagar Tech Park, Bengaluru 560038',
      businessPhone: adm.businessPhone || '+91 80 4120 8899',
      businessEmail: adm.businessEmail || 'billing@aquavault.in',
      businessGstin: '29AABCA8419K1Z5',
      clientName: 'Rajesh Verma',
      clientPhone: '+91 98450 11223',
      clientAddress: '42 Park View Residency, Indiranagar, Bengaluru 560038',
      hardwareType: 'Water Level Controller',
      paymentMethod: 'UPI / NEFT Bank Transfer',
      paymentDetails: adm.paymentDetails || 'HDFC Bank • A/C: 50200084192011 • IFSC: HDFC0000184 • UPI: aquavault@hdfcbank',
      discountPct: 5,
      taxPct: typeof adm.gstPercent === 'number' ? adm.gstPercent : 18,
      notes: '1-Year Comprehensive On-Site Warranty on Controller PCB & Brass Valve Motor.',
      signatory: 'Ritik Raj • Authorized Signatory',
      googleSheetWebhook: adm.googleSheetWebhook || '',
      items: [
        { id: 'i1', desc: 'AquaVault Pro-X7 Dual Tank Controller', unit: 'Unit', qty: 1, price: 8450 }
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

    try {
      const custSnap = await cs.fbSdk.getDocs(cs.fbSdk.collection(cs.db, 'private_customers'));
      if (!custSnap.empty) {
        const list = [];
        custSnap.forEach(s => list.push({ id: s.id, ...s.data() }));
        privateCustomers = list;
        try { localStorage.setItem(PRIVATE_CUSTOMERS_CACHE_KEY, JSON.stringify(list)); } catch {}
      }
    } catch (err) {
      console.warn('private_customers load note:', err?.message || err);
    }

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
    const primaryModel = items.map(i => `${i.desc} (x${i.qty})`).join(' + ') || 'AquaVault Controller';
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
     SELECT EXISTING CUSTOMER FROM PRIVATE_CUSTOMERS TO AUTO-FILL BILL
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
    if (cust.invoiceNo) {
      draft.invoiceNo = sanitizeInput(cust.invoiceNo, 60);
    }
    draft.items = [
      {
        id: 'i_' + Date.now().toString(36),
        desc: sanitizeInput(cust.modelName || 'AquaVault Pro-X7 Controller', 140),
        unit: 'Unit',
        qty: Math.max(1, parseInt(cust.quantity, 10) || 1),
        price: Math.max(0, Number(cust.basePrice) || 8450)
      }
    ];
    refreshInvoiceDom();
    window.showToast(`Auto-filled ${cust.customerName} (${cust.mobileNumber})`);
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
        <div style="font-size:12px;opacity:0.9;">Phone: ${esc(inv.businessPhone)} &bull; GSTIN: ${esc(inv.businessGstin)}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:16px;font-weight:800;">${esc(inv.invoiceNo)}</div>
        <div style="font-size:12px;margin-top:4px;">Invoice Date: ${esc(inv.invoiceDate)}</div>
        <div style="font-size:12px;">Due Date: ${esc(inv.dueDate)}</div>
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
        <span>AquaVault Permanent Google Drive Bill Record</span>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  /* =========================================================================
     1-CLICK "GENERATE & SAVE BILL" -> FIRESTORE (`private_invoices`) + GOOGLE DRIVE
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

    let driveSaved = false;

    // 1. Automatically push bill to Google Drive (`Code.gs` Web App URL) if configured
    if (webhookUrl && /^https:\/\/script\.google\.com\//i.test(webhookUrl)) {
      try {
        const drivePayload = {
          invoiceNo: draft.invoiceNo,
          invoiceDate: draft.invoiceDate,
          dueDate: draft.dueDate,
          status: draft.status,
          customerName: draft.clientName,
          mobileNumber: draft.clientPhone || '',
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
          signatory: draft.signatory,
          items: calc.items,
          invoiceHtml: printableHtml
        };
        await fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(drivePayload)
        });
        driveSaved = true;
      } catch (err) {
        console.warn('Google Drive Apps Script webhook warning:', err?.message || err);
      }
    }

    // 2. Save permanently to Firestore `private_invoices`
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
      driveSaved: Boolean(driveSaved)
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

    // 3. Update local Admin cache & persist webhook URL into Admin Config
    const localRecord = {
      id: invoiceId,
      ...firestoreRecord,
      items: calc.items,
      paymentMethod: draft.paymentMethod,
      notes: draft.notes
    };
    privateInvoices = [localRecord, ...privateInvoices.filter(x => x.invoiceNo !== localRecord.invoiceNo)].slice(0, 100);
    saveCachedPrivateInvoices(privateInvoices);

    if (webhookUrl) {
      try {
        const rawCfg = localStorage.getItem(ADMIN_CONFIG_KEY);
        const cfg = rawCfg ? JSON.parse(rawCfg) : {};
        cfg.invoiceDefaults = { ...(cfg.invoiceDefaults || {}), googleSheetWebhook: webhookUrl };
        localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(cfg));
      } catch {}
    }

    savingBillBusy = false;
    refreshInvoiceDom();

    if (driveSaved) {
      window.showToast(`Bill ${draft.invoiceNo} saved to Firestore & Google Drive ("AquaVault_Permanent_Bills")!`);
    } else if (webhookUrl) {
      window.showToast(`Bill ${draft.invoiceNo} saved to Firestore! Check your Apps Script Web App URL.`);
    } else {
      window.showToast(`Bill ${draft.invoiceNo} saved to Firestore! Paste your Code.gs URL below for auto-Google Drive backup.`);
    }
  }

  /* =========================================================================
     GOOGLE SHEETS CSV EXPORT, PNG IMAGE EXPORT & PDF DOWNLOAD
     ========================================================================= */
  function buildCsvRows(invoicesList) {
    const headers = [
      'Invoice Number', 'Invoice Date', 'Due Date', 'Payment Status',
      'Customer Name', 'Customer Mobile', 'Customer Place / Address',
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
        inv.driveSaved ? 'YES (Google Drive)' : 'Firestore Saved'
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
    window.showToast(`Downloaded ${draft.invoiceNo}.csv for Google Sheets`);
  }

  function exportAllSavedInvoicesCsv() {
    const list = privateInvoices.length ? privateInvoices : [draft];
    const csvContent = buildCsvRows(list);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AquaVault-Admin-Bills-Ledger-${todayIso(0)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    window.showToast(`Exported ${list.length} bill(s) to Google Sheets CSV`);
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
      ctx.fillText(`${draft.businessPhone}  •  ${draft.businessEmail}`, W - 76, 150);
      ctx.fillText(`GSTIN: ${draft.businessGstin}`, W - 76, 176);
      ctx.textAlign = 'left';
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 32px Plus Jakarta Sans, sans-serif';
      ctx.fillText(draft.businessName, 64, 78);
      ctx.fillStyle = 'rgba(255,255,255,0.86)';
      ctx.font = '500 16px Plus Jakarta Sans, sans-serif';
      ctx.fillText(draft.businessTagline, 64, 108);
      ctx.fillText(draft.businessAddress, 64, 138);
      ctx.fillText(`${draft.businessPhone}  •  ${draft.businessEmail}  •  GSTIN: ${draft.businessGstin}`, 64, 166);

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
    ctx.fillText(`Hardware Category: ${draft.hardwareType || 'Water Level Controller'}`, 80, boxY + 149);

    ctx.fillStyle = pal.softBg;
    ctx.fillRect(626, boxY, 550, 175);
    ctx.strokeRect(626, boxY, 550, 175);
    ctx.fillStyle = pal.primary;
    ctx.fillRect(626, boxY, 550, 34);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 13px Plus Jakarta Sans, sans-serif';
    ctx.fillText('INVOICE & PAYMENT DETAILS', 642, boxY + 22);

    ctx.fillStyle = '#111827';
    ctx.font = '700 16px JetBrains Mono, monospace';
    ctx.fillText(`Invoice No: ${draft.invoiceNo}`, 642, boxY + 66);
    ctx.font = '600 15px Plus Jakarta Sans, sans-serif';
    ctx.fillText(`Status: ${draft.status}   •   Mode: ${draft.paymentMethod}`, 642, boxY + 96);
    ctx.fillStyle = '#4B5563';
    ctx.font = '500 14px Plus Jakarta Sans, sans-serif';
    ctx.fillText(draft.paymentDetails.slice(0, 62), 642, boxY + 126);
    if (draft.paymentDetails.length > 62) {
      ctx.fillText(draft.paymentDetails.slice(62, 124), 642, boxY + 148);
    }

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
    ctx.font = 'italic 700 24px Georgia, serif';
    ctx.fillText(draft.signatory, 84, sumY + 142);
    ctx.fillStyle = '#6B7280';
    ctx.font = '600 12px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Prepared & Verified by AquaVault Admin', 84, sumY + 166);

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
    } else if (field === 'googleSheetWebhook') {
      draft[field] = String(val ?? '').trim().slice(0, 500);
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
    draft.items.push({
      id: 'i_' + Date.now().toString(36),
      desc: 'AquaVault HydroSeal Brass Water Stopper Valve',
      unit: 'Unit',
      qty: 1,
      price: 4950
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
        : [{ id: 'i1', desc: found.modelName || 'AquaVault Controller', unit: 'Unit', qty: found.quantity || 1, price: found.unitPrice || found.grandTotal || 0 }]
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
          window.showToast('Copied Code.gs (Auto-Google Drive Bill Saver) to clipboard!');
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
              <div>${esc(draft.businessPhone)} &bull; ${esc(draft.businessEmail)}</div>
              <div class="mono" style="font-weight:700;margin-top:2px;">GSTIN: ${esc(draft.businessGstin)}</div>
            </div>
          </div>
        ` : `
          <div class="inv-color-head">
            <div class="inv-color-biz">
              <div class="inv-eyebrow-chip">AQUAVAULT EXECUTIVE BILLING STUDIO</div>
              <div class="inv-biz-title-light">${esc(draft.businessName)}</div>
              <div class="inv-biz-sub-light">${esc(draft.businessTagline)}</div>
              <div class="inv-biz-meta-light">${esc(draft.businessAddress)}</div>
              <div class="inv-biz-meta-light">${esc(draft.businessPhone)} &bull; ${esc(draft.businessEmail)} &bull; GSTIN: ${esc(draft.businessGstin)}</div>
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
            <div class="inv-box-bar">PAYMENT &amp; BANK INFORMATION</div>
            <div class="inv-box-body">
              <div><strong>Payment Method:</strong> ${esc(draft.paymentMethod)}</div>
              <div><strong>Invoice Date:</strong> <span class="mono">${esc(draft.invoiceDate)}</span> &bull; <strong>Due:</strong> <span class="mono">${esc(draft.dueDate)}</span></div>
              <div style="margin-top:4px;line-height:1.45;">${esc(draft.paymentDetails)}</div>
            </div>
          </div>
        </div>

        <div class="inv-table-wrap">
          <table class="inv-table">
            <thead>
              <tr>
                <th style="width:46px;text-align:center;">No.</th>
                <th>Product Model / Description</th>
                <th style="width:68px;text-align:center;">Qty</th>
                <th style="width:82px;text-align:center;">Unit</th>
                <th style="width:125px;text-align:right;">Unit Price</th>
                <th style="width:135px;text-align:right;">Line Total</th>
              </tr>
            </thead>
            <tbody>
              ${displayRows.map((it, idx) => it ? `
                <tr>
                  <td class="mono" style="text-align:center;font-weight:700;">${idx + 1}</td>
                  <td style="font-weight:700;color:#111827;">${esc(it.desc)}</td>
                  <td class="mono" style="text-align:center;font-weight:700;">${it.qty}</td>
                  <td style="text-align:center;color:#4B5563;">${esc(it.unit)}</td>
                  <td class="mono" style="text-align:right;">${fmtMoney(it.price)}</td>
                  <td class="mono" style="text-align:right;font-weight:800;color:var(--inv-primary);">${fmtMoney(it.lineTotal)}</td>
                </tr>
              ` : `
                <tr class="inv-empty-row">
                  <td style="text-align:center;color:#9CA3AF;">${idx + 1}</td>
                  <td></td><td></td><td></td><td></td><td></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="inv-bottom-grid">
          <div class="inv-comments-box">
            <div class="inv-box-bar">COMMENTS, WARRANTY TERMS &amp; SIGNATURE</div>
            <div class="inv-comments-body">
              <p>${esc(draft.notes)}</p>
              <div class="inv-signature-row">
                <div>
                  <div class="inv-sig-script serif">${esc(draft.signatory)}</div>
                  <div class="inv-sig-label">Prepared &amp; Approved By</div>
                </div>
                <div class="inv-thank-badge">Thank You For Your Business!</div>
              </div>
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
          <p class="page-desc" style="margin:8px auto 0;">Invoice Generator is restricted exclusively to verified Admin UID <code>${AUTHORIZED_ADMIN_UID}</code>.</p>
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
            The Manual Bill Generator &amp; Google Drive Archive is locked strictly to the verified AquaVault Admin account (UID: <code>${AUTHORIZED_ADMIN_UID}</code>). Redirecting you to the public warranty landing page...
          </p>
          <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">
            <a href="admin/" class="btn btn-primary" style="text-decoration:none;">${ic('lock')} Sign In at Admin Console</a>
            <a href="index.html" class="btn btn-outline" style="text-decoration:none;">Return to Landing Page</a>
          </div>
        </div>
      `;
    }

    // Load private customers & invoices once Admin is verified
    loadPrivateAdminVaultFromFirestore();

    return `
      <!-- Top Header & 1-Click Actions -->
      <div class="page-header no-print">
        <div>
          <div class="page-eyebrow">${ic('shield')} Admin-Only Billing Studio &bull; Auto-Google Drive Archive</div>
          <h1 class="page-title serif">Manual GST Bill Generator &amp; Drive Vault</h1>
          <p class="page-desc">Select an existing customer from <code>private_customers</code> or manually enter details. Clicking <strong>Generate &amp; Save Bill</strong> permanently saves to Firestore and your Google Drive folder.</p>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
          <button class="btn btn-primary" onclick="generateAndSaveAdminBill()" ${savingBillBusy ? 'disabled' : ''}>
            ${ic('cloud')} ${savingBillBusy ? 'Saving to Firestore & Drive...' : 'Generate & Save Bill (Firestore + Drive)'}
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

      <!-- Theme Palette Bar & Auto-Fill Existing Customer Selector -->
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

          <div style="min-width:250px;flex:1;max-width:360px;">
            <div style="font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--primary);margin-bottom:6px;">
              3. Auto-Fill from Private Customer Record (Or Type Manually)
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

      <!-- Main Split Workspace: Left Manual Editor / Right Live Printable Invoice -->
      <div class="inv-studio-grid">
        <div class="inv-editor-col no-print">
          <!-- Customer Name, Mobile Number, Place/Address, Hardware Type -->
          <div class="card" style="margin-bottom:16px;">
            <div class="card-header" style="margin-bottom:12px;">
              <div>
                <h2 class="card-title">Customer &amp; Bill Details</h2>
                <p class="card-subtitle">Stored strictly in private Admin collections &amp; Google Drive</p>
              </div>
              <span id="invKpiGrandTotal" class="badge badge-purple mono" style="font-size:13px;">${fmtMoney(calc.grandTotal)}</span>
            </div>

            <div class="grid-2" style="gap:10px;">
              <div class="form-group">
                <label class="form-label">Customer Full Name</label>
                <input class="input" value="${esc(draft.clientName)}" placeholder="e.g. Rajesh Verma" oninput="updateInvoiceField('clientName', this.value)" />
              </div>
              <div class="form-group">
                <label class="form-label">Customer Mobile Number</label>
                <input class="input mono" value="${esc(draft.clientPhone)}" placeholder="+91 98765 43210" oninput="updateInvoiceField('clientPhone', this.value)" />
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
                <label class="form-label">Payment Status</label>
                <select class="select" onchange="updateInvoiceField('status', this.value)">
                  <option value="PAID" ${draft.status === 'PAID' ? 'selected' : ''}>PAID</option>
                  <option value="PENDING" ${draft.status === 'PENDING' ? 'selected' : ''}>PENDING</option>
                  <option value="OVERDUE" ${draft.status === 'OVERDUE' ? 'selected' : ''}>OVERDUE</option>
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
          </div>

          <!-- Line Items, Quantity, Price, Discount & GST -->
          <div class="card" style="margin-bottom:16px;">
            <div class="card-header" style="margin-bottom:12px;">
              <div>
                <h2 class="card-title">Models, Quantity, Price, Discount &amp; GST</h2>
                <p class="card-subtitle">Live automatic subtotal, discount &amp; GST calculation</p>
              </div>
              <button type="button" class="btn btn-sm btn-primary" onclick="addInvoiceLineItem()">
                ${ic('plus')} Add Model Row
              </button>
            </div>

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
                    <input class="input" placeholder="Product Model (e.g. AquaVault Pro-X7 Controller)" value="${esc(it.desc)}" oninput="updateInvoiceLineItem(${idx}, 'desc', this.value)" />
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

          <!-- Automatic Google Drive Archive & Sheets Webhook Card -->
          <div class="card">
            <div class="card-header" style="margin-bottom:10px;">
              <div>
                <h2 class="card-title">Automatic Google Drive Permanent Backup</h2>
                <p class="card-subtitle">Every generated bill is saved as a PDF in your Google Drive folder <code>AquaVault_Permanent_Bills</code></p>
              </div>
              <span class="badge badge-emerald">Drive + Firestore</span>
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

            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;">
              <button type="button" class="btn btn-sm btn-soft" onclick="copyAppsScriptCodeToClipboard()">
                ${ic('check')} Copy Ready-to-Paste Code.gs
              </button>
              <button type="button" class="btn btn-sm btn-outline" onclick="exportCurrentInvoiceCsv()">
                ${ic('download')} Current Bill (.CSV)
              </button>
              <button type="button" class="btn btn-sm btn-outline" onclick="exportAllSavedInvoicesCsv()">
                ${ic('download')} All Bills Ledger (.CSV)
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

        <!-- Right Column: Live High-Contrast Printable Invoice Sheet -->
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
    updateInvoiceField,
    setInvoicePalette,
    setInvoiceFrameStyle,
    updateInvoiceLineItem,
    addInvoiceLineItem,
    removeInvoiceLineItem,
    generateAndSaveAdminBill,
    loadSavedInvoiceIntoEditor,
    deleteSavedInvoice,
    exportCurrentInvoiceCsv,
    exportAllSavedInvoicesCsv,
    downloadInvoiceImagePng,
    downloadInvoicePdf,
    copyAppsScriptCodeToClipboard
  });
})();
