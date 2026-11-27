/* =========================================================================
   AQUAVAULT — LUXURY COLORFUL INVOICE STUDIO ENGINE (v5)
   Features:
   - 6 Curated Colorful Designer Palettes + 2 Frame Styles (Colorful Banner / Classic Double-Border)
   - Live Focus-Safe Editor & Instant Visual A4 Preview
   - 2x Retina Canvas Renderer -> HD Colorful PNG Image Download
   - Zero-Dependency Real Binary A4 Colorful PDF Download + Print
   - Persistent Invoice Ledger -> Google Sheets CSV Export + Real Google Sheets Apps Script Sync
   ========================================================================= */

const INVOICE_PALETTES = {
  violet: {
    id: 'violet',
    name: 'Imperial Violet',
    primary: '#5B21B6',
    secondary: '#7C3AED',
    accent: '#C084FC',
    tint: '#F5F3FF',
    tintStrong: '#EDE9FE',
    border: '#DDD6FE',
    ink: '#1E1B4B'
  },
  sapphire: {
    id: 'sapphire',
    name: 'Sapphire Executive',
    primary: '#1E3A8A',
    secondary: '#2563EB',
    accent: '#60A5FA',
    tint: '#EFF6FF',
    tintStrong: '#DBEAFE',
    border: '#BFDBFE',
    ink: '#0F172A'
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Luxe',
    primary: '#065F46',
    secondary: '#059669',
    accent: '#34D399',
    tint: '#ECFDF5',
    tintStrong: '#D1FAE5',
    border: '#A7F3D0',
    ink: '#064E3B'
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson Velvet',
    primary: '#9F1239',
    secondary: '#E11D48',
    accent: '#FB7185',
    tint: '#FFF1F2',
    tintStrong: '#FFE4E6',
    border: '#FECDD3',
    ink: '#4C0519'
  },
  amber: {
    id: 'amber',
    name: 'Royal Gold',
    primary: '#92400E',
    secondary: '#D97706',
    accent: '#FBBF24',
    tint: '#FFFBEB',
    tintStrong: '#FEF3C7',
    border: '#FDE68A',
    ink: '#451A03'
  },
  obsidian: {
    id: 'obsidian',
    name: 'Classic Obsidian',
    primary: '#111827',
    secondary: '#374151',
    accent: '#9CA3AF',
    tint: '#F9FAFB',
    tintStrong: '#F3F4F6',
    border: '#D1D5DB',
    ink: '#111827'
  }
};

function createDefaultInvoiceDraft() {
  const today = new Date();
  const due = new Date(today.getTime() + 14 * 86400000);
  const iso = (d) => d.toISOString().slice(0, 10);
  const seq = 101 + ((typeof state !== 'undefined' && state.invoices) ? state.invoices.length : 0);
  let def = {};
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('aquavault_admin_config_v1') : null;
    if (raw) def = (JSON.parse(raw).invoiceDefaults) || {};
  } catch {}

  return {
    palette: def.palette || 'violet',
    frameStyle: def.frameStyle === 'classic' ? 'classic' : 'colorful',
    invoiceNo: `INV-AQV-2026-0${seq}`,
    invoiceDate: iso(today),
    dueDate: iso(due),
    status: 'Paid',
    businessName: def.businessName || 'AquaVault Water Systems',
    businessAddress: def.businessAddress || '42 Royal Tech Park, Indiranagar, Bengaluru 560038',
    businessPhone: def.businessPhone || '+91 98765 43210',
    businessEmail: def.businessEmail || 'billing@aquavault.in',
    businessWebsite: 'GSTIN: 29AABCA8419F1Z5',
    clientName: 'Aarav Sharma',
    clientAddress: '18 Palm Grove Residency, Whitefield, Bengaluru',
    clientPhone: '+91 98112 44019',
    clientEmail: 'aarav.sharma@gmail.com',
    paymentMethod: 'UPI / Bank Transfer',
    paymentDetails: def.paymentDetails || 'HDFC Bank • A/C: 50200084192011 • UPI: aquavault@okhdfcbank',
    discountPct: 5,
    taxPct: typeof def.gstPercent === 'number' ? def.gstPercent : 18,
    terms: 'Payment due within 14 days. Includes 2-year AquaVault Shield hardware warranty & priority engineer support.',
    approvedBy: 'Authorized Signatory',
    items: [
      { id: 'i1', desc: 'AquaVault Pro-X7 Dual Tank Controller', qty: 1, unit: 'Unit', price: 8450 },
      { id: 'i2', desc: 'AquaVault HydroSeal Brass Water Stopper', qty: 1, unit: 'Unit', price: 4950 },
      { id: 'i3', desc: 'Precision Installation & Float Calibration', qty: 1, unit: 'Service', price: 1200 }
    ]
  };
}

function ensureInvoiceState() {
  if (!state.invoiceDraft) {
    state.invoiceDraft = createDefaultInvoiceDraft();
  }
  if (!Array.isArray(state.invoices)) {
    state.invoices = [
      {
        id: 'inv_seed_1',
        savedAt: formatDate(shiftDays(-5)),
        ...createDefaultInvoiceDraft(),
        invoiceNo: 'INV-AQV-2026-0100'
      }
    ];
  }
  if (typeof state.googleSheetWebhook !== 'string' || !state.googleSheetWebhook) {
    let hook = '';
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('aquavault_admin_config_v1') : null;
      hook = raw ? (JSON.parse(raw).invoiceDefaults?.googleSheetWebhook || '') : '';
    } catch {}
    state.googleSheetWebhook = hook || '';
  }
  if (!state.invoiceTab) {
    state.invoiceTab = 'studio'; // 'studio' | 'ledger'
  }
}

function computeInvoiceTotals(inv) {
  const items = Array.isArray(inv.items) ? inv.items : [];
  const subtotal = items.reduce((sum, it) => sum + (Math.max(0, Number(it.qty) || 0) * Math.max(0, Number(it.price) || 0)), 0);
  const discountPct = Math.max(0, Math.min(100, Number(inv.discountPct) || 0));
  const taxPct = Math.max(0, Math.min(100, Number(inv.taxPct) || 0));
  const discountAmt = Math.round(subtotal * (discountPct / 100) * 100) / 100;
  const taxable = Math.max(0, subtotal - discountAmt);
  const taxAmt = Math.round(taxable * (taxPct / 100) * 100) / 100;
  const grandTotal = Math.round((taxable + taxAmt) * 100) / 100;
  return { subtotal, discountPct, discountAmt, taxable, taxPct, taxAmt, grandTotal };
}

function getPalette(id) {
  return INVOICE_PALETTES[id] || INVOICE_PALETTES.violet;
}

/* =========================================================================
   INVOICE STUDIO UI RENDERER
   ========================================================================= */
function setInvoiceSubTab(tab) {
  ensureInvoiceState();
  state.invoiceTab = tab;
  saveState();
  render();
}

function setInvoicePalette(paletteId) {
  ensureInvoiceState();
  state.invoiceDraft.palette = paletteId;
  saveState();
  render();
}

function setInvoiceFrameStyle(style) {
  ensureInvoiceState();
  state.invoiceDraft.frameStyle = style;
  saveState();
  render();
}

function updateInvoiceField(field, value) {
  ensureInvoiceState();
  if (field === 'discountPct' || field === 'taxPct') {
    state.invoiceDraft[field] = value === '' ? 0 : Number(value);
  } else {
    state.invoiceDraft[field] = value;
  }
  saveState();
  refreshInvoicePreviewOnly();
}

function updateInvoiceItem(index, field, value) {
  ensureInvoiceState();
  const item = state.invoiceDraft.items[index];
  if (!item) return;
  if (field === 'qty' || field === 'price') {
    item[field] = value === '' ? 0 : Math.max(0, Number(value));
  } else {
    item[field] = value;
  }
  saveState();
  const rowTotalEl = document.getElementById(`invRowTotal_${index}`);
  if (rowTotalEl) {
    rowTotalEl.textContent = formatINR((Number(item.qty) || 0) * (Number(item.price) || 0));
  }
  refreshInvoicePreviewOnly();
}

function addInvoiceItem() {
  ensureInvoiceState();
  state.invoiceDraft.items.push({
    id: 'i' + Date.now(),
    desc: '',
    qty: 1,
    unit: 'Unit',
    price: 0
  });
  saveState();
  render();
}

function removeInvoiceItem(index) {
  ensureInvoiceState();
  if (state.invoiceDraft.items.length <= 1) {
    showToast('Keep at least one line item');
    return;
  }
  state.invoiceDraft.items.splice(index, 1);
  saveState();
  render();
}

function resetInvoiceDraft() {
  ensureInvoiceState();
  state.invoiceDraft = createDefaultInvoiceDraft();
  saveState();
  render();
  showToast('New blank invoice prepared');
}

function loadSavedInvoiceIntoEditor(id) {
  ensureInvoiceState();
  const found = state.invoices.find(x => x.id === id);
  if (!found) return;
  state.invoiceDraft = JSON.parse(JSON.stringify(found));
  delete state.invoiceDraft.id;
  delete state.invoiceDraft.savedAt;
  state.invoiceTab = 'studio';
  saveState();
  render();
  showToast(`Loaded ${found.invoiceNo} into studio`);
}

function deleteSavedInvoice(id) {
  ensureInvoiceState();
  state.invoices = state.invoices.filter(x => x.id !== id);
  saveState();
  render();
  showToast('Invoice removed from ledger');
}

function saveCurrentInvoiceToLedger(silent = false) {
  ensureInvoiceState();
  const inv = JSON.parse(JSON.stringify(state.invoiceDraft));
  const existingIdx = state.invoices.findIndex(x => x.invoiceNo === inv.invoiceNo);
  const record = {
    id: existingIdx >= 0 ? state.invoices[existingIdx].id : ('inv_' + Date.now()),
    savedAt: formatDate(shiftDays(0)),
    ...inv
  };
  if (existingIdx >= 0) {
    state.invoices[existingIdx] = record;
  } else {
    state.invoices.unshift(record);
  }
  saveState();
  if (!silent) {
    render();
    showToast(`Saved ${inv.invoiceNo} to Ledger & CSV Vault`);
  }
  return record;
}

function buildLiveInvoicePreviewMarkup(inv) {
  const p = getPalette(inv.palette);
  const t = computeInvoiceTotals(inv);
  const isClassic = inv.frameStyle === 'classic';
  const items = inv.items || [];

  const rowsHtml = items.map((it, idx) => {
    const lineTotal = (Number(it.qty) || 0) * (Number(it.price) || 0);
    const rowBg = idx % 2 === 1 ? p.tint : '#FFFFFF';
    return `
      <tr style="background:${rowBg};">
        <td style="text-align:center;color:#64748B;font-family:'JetBrains Mono',monospace;">${idx + 1}</td>
        <td style="font-weight:600;color:${p.ink};">${escapeHtml(it.desc || 'Line Item')}</td>
        <td style="text-align:center;font-family:'JetBrains Mono',monospace;">${Number(it.qty) || 0}</td>
        <td style="text-align:center;color:#475569;">${escapeHtml(it.unit || 'Unit')}</td>
        <td style="text-align:right;font-family:'JetBrains Mono',monospace;">${formatINR(it.price)}</td>
        <td style="text-align:right;font-weight:700;font-family:'JetBrains Mono',monospace;color:${p.ink};">${formatINR(lineTotal)}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="inv-paper ${isClassic ? 'inv-paper-classic' : ''}" style="--inv-primary:${p.primary};--inv-secondary:${p.secondary};--inv-accent:${p.accent};--inv-tint:${p.tint};--inv-tint-strong:${p.tintStrong};--inv-border:${p.border};--inv-ink:${p.ink};">
      ${isClassic ? `
        <div class="inv-classic-head">
          <div>
            <div class="inv-classic-title serif">INVOICE</div>
            <div class="inv-meta-chip mono">${escapeHtml(inv.invoiceNo)} &middot; ${escapeHtml(inv.status)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:15px;font-weight:800;color:${p.primary};">${escapeHtml(inv.businessName)}</div>
            <div class="inv-small-line">${escapeHtml(inv.businessAddress)}</div>
            <div class="inv-small-line">${escapeHtml(inv.businessPhone)} &middot; ${escapeHtml(inv.businessEmail)}</div>
            <div class="inv-small-line mono">${escapeHtml(inv.businessWebsite)}</div>
          </div>
        </div>
      ` : `
        <div class="inv-colorful-banner" style="background:linear-gradient(135deg, ${p.primary} 0%, ${p.secondary} 100%);">
          <div style="display:flex;align-items:center;gap:11px;min-width:0;">
            <img src="assets/icon-192.png" alt="Logo" class="inv-logo-img" />
            <div style="min-width:0;">
              <div style="font-size:16px;font-weight:800;color:#FFFFFF;letter-spacing:-0.02em;">${escapeHtml(inv.businessName)}</div>
              <div style="font-size:10.5px;color:rgba(255,255,255,0.84);margin-top:2px;">${escapeHtml(inv.businessAddress)}</div>
              <div style="font-size:10px;color:rgba(255,255,255,0.78);margin-top:1px;">${escapeHtml(inv.businessPhone)} &middot; ${escapeHtml(inv.businessEmail)}</div>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div class="serif" style="font-size:30px;line-height:1;color:#FFFFFF;letter-spacing:0.04em;">INVOICE</div>
            <div class="mono" style="font-size:11px;font-weight:700;color:#FFFFFF;background:rgba(255,255,255,0.18);padding:3px 9px;border-radius:999px;display:inline-block;margin-top:5px;">${escapeHtml(inv.invoiceNo)}</div>
          </div>
        </div>
      `}

      <div class="inv-paper-body">
        <div class="inv-info-grid">
          <div class="inv-box">
            <div class="inv-box-bar" style="background:${p.tintStrong};color:${p.primary};">BILL TO</div>
            <div class="inv-box-content">
              <div style="font-size:13px;font-weight:800;color:${p.ink};">${escapeHtml(inv.clientName)}</div>
              <div class="inv-small-line">${escapeHtml(inv.clientAddress)}</div>
              <div class="inv-small-line">${escapeHtml(inv.clientPhone)}</div>
              <div class="inv-small-line">${escapeHtml(inv.clientEmail)}</div>
            </div>
          </div>

          <div class="inv-box">
            <div class="inv-box-bar" style="background:${p.tintStrong};color:${p.primary};">INVOICE &amp; PAYMENT</div>
            <div class="inv-box-content">
              <div class="inv-kv"><span>Invoice Date</span><strong class="mono">${formatDate(inv.invoiceDate)}</strong></div>
              <div class="inv-kv"><span>Due Date</span><strong class="mono">${formatDate(inv.dueDate)}</strong></div>
              <div class="inv-kv"><span>Method</span><strong>${escapeHtml(inv.paymentMethod)}</strong></div>
              <div class="inv-small-line" style="margin-top:5px;padding-top:5px;border-top:1px dashed ${p.border};">${escapeHtml(inv.paymentDetails)}</div>
            </div>
          </div>
        </div>

        <div class="inv-table-scroll">
          <table class="inv-items-table">
            <thead>
              <tr style="background:${p.primary};color:#FFFFFF;">
                <th style="width:32px;text-align:center;">No.</th>
                <th>Description</th>
                <th style="width:42px;text-align:center;">Qty</th>
                <th style="width:58px;text-align:center;">Unit</th>
                <th style="width:82px;text-align:right;">Price</th>
                <th style="width:88px;text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>

        <div class="inv-bottom-grid">
          <div class="inv-box">
            <div class="inv-box-bar" style="background:${p.tintStrong};color:${p.primary};">TERMS &amp; COMMENTS</div>
            <div class="inv-box-content">
              <div class="inv-small-line" style="line-height:1.5;">${escapeHtml(inv.terms)}</div>
              <div style="margin-top:12px;padding-top:8px;border-top:1px solid ${p.border};display:flex;align-items:baseline;justify-content:space-between;gap:8px;">
                <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#64748B;">Approved By</span>
                <span class="serif" style="font-style:italic;font-size:20px;color:${p.primary};">${escapeHtml(inv.approvedBy)}</span>
              </div>
            </div>
          </div>

          <div class="inv-totals-box" style="border:1px solid ${p.border};background:${p.tint};">
            <div class="inv-tot-row"><span>Subtotal</span><strong class="mono">${formatINR(t.subtotal)}</strong></div>
            <div class="inv-tot-row"><span>Discount (${t.discountPct}%)</span><strong class="mono">-${formatINR(t.discountAmt)}</strong></div>
            <div class="inv-tot-row"><span>GST / Tax (${t.taxPct}%)</span><strong class="mono">+${formatINR(t.taxAmt)}</strong></div>
            <div class="inv-tot-grand" style="background:${p.primary};color:#FFFFFF;">
              <span>GRAND TOTAL</span>
              <span class="mono">${formatINR(t.grandTotal)}</span>
            </div>
          </div>
        </div>

        <div class="inv-thankyou" style="border-top:1px solid ${p.border};color:${p.primary};">
          Thank you for your business! &middot; ${escapeHtml(inv.businessWebsite)}
        </div>
      </div>
    </div>
  `;
}

function refreshInvoicePreviewOnly() {
  const host = document.getElementById('liveInvoicePreviewHost');
  if (host) {
    host.innerHTML = buildLiveInvoicePreviewMarkup(state.invoiceDraft);
  }
  const summaryTotal = document.getElementById('editorGrandTotalBadge');
  if (summaryTotal) {
    summaryTotal.textContent = formatINR(computeInvoiceTotals(state.invoiceDraft).grandTotal);
  }
}

/* =========================================================================
   2X RETINA A4 COLORFUL CANVAS RENDERER (PNG + REAL BINARY A4 PDF)
   ========================================================================= */
function loadImageSafe(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function wrapCanvasLines(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function renderInvoiceToA4Canvas(inv) {
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch {}
  }

  const W = 1240;
  const H = 1754;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const p = getPalette(inv.palette);
  const t = computeInvoiceTotals(inv);
  const isClassic = inv.frameStyle === 'classic';
  const logoImg = await loadImageSafe('assets/icon-192.png');

  // Pure white A4 sheet background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  const M = 64;
  let y = M;

  if (isClassic) {
    // Classic Double-Frame Luxury Border (Reference 2 inspired)
    ctx.strokeStyle = p.primary;
    ctx.lineWidth = 5;
    ctx.strokeRect(32, 32, W - 64, H - 64);
    ctx.lineWidth = 1.8;
    ctx.strokeRect(44, 44, W - 88, H - 88);

    // Subtle colored top ribbon inside frame
    ctx.fillStyle = p.tint;
    ctx.fillRect(46, 46, W - 92, 224);

    ctx.fillStyle = p.primary;
    ctx.font = '400 92px "Instrument Serif", Georgia, serif';
    ctx.fillText('INVOICE', M + 16, y + 102);

    // Invoice pill
    drawRoundedRect(ctx, M + 16, y + 124, 320, 44, 22);
    ctx.fillStyle = p.primary;
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 20px "JetBrains Mono", monospace';
    ctx.fillText(`${inv.invoiceNo} • ${inv.status}`, M + 36, y + 153);

    // Right business info
    ctx.textAlign = 'right';
    ctx.fillStyle = p.primary;
    ctx.font = '800 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(inv.businessName, W - M - 16, y + 58);

    ctx.fillStyle = '#334155';
    ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
    const bAddr = wrapCanvasLines(ctx, inv.businessAddress, 480);
    bAddr.slice(0, 2).forEach((ln, i) => ctx.fillText(ln, W - M - 16, y + 92 + i * 28));
    ctx.fillText(`${inv.businessPhone}  •  ${inv.businessEmail}`, W - M - 16, y + 156);
    ctx.font = '600 18px "JetBrains Mono", monospace';
    ctx.fillStyle = p.secondary;
    ctx.fillText(inv.businessWebsite, W - M - 16, y + 188);
    ctx.textAlign = 'left';

    y = 310;
  } else {
    // Colorful Luxury Gradient Banner Header
    const grad = ctx.createLinearGradient(0, 0, W, 270);
    grad.addColorStop(0, p.primary);
    grad.addColorStop(1, p.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 278);

    // Subtle geometric accent arc
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath();
    ctx.arc(W - 110, 40, 240, 0, Math.PI * 2);
    ctx.fill();

    // Accent strip under banner
    ctx.fillStyle = p.accent;
    ctx.fillRect(0, 278, W, 8);

    // Logo squircle
    if (logoImg) {
      ctx.save();
      drawRoundedRect(ctx, M, 66, 108, 108, 24);
      ctx.clip();
      ctx.drawImage(logoImg, M, 66, 108, 108);
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, M, 66, 108, 108, 24);
      ctx.stroke();
    }

    const tx = logoImg ? M + 132 : M;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(inv.businessName, tx, 104);

    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
    const bLines = wrapCanvasLines(ctx, inv.businessAddress, 560);
    bLines.slice(0, 2).forEach((ln, i) => ctx.fillText(ln, tx, 140 + i * 28));
    ctx.fillText(`${inv.businessPhone}  •  ${inv.businessEmail}`, tx, 206);
    ctx.font = '600 18px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.fillText(inv.businessWebsite, tx, 238);

    // Right INVOICE title & badge
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '400 84px "Instrument Serif", Georgia, serif';
    ctx.fillText('INVOICE', W - M, 128);

    drawRoundedRect(ctx, W - M - 270, 152, 270, 44, 22);
    ctx.fillStyle = 'rgba(255,255,255,0.20)';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 20px "JetBrains Mono", monospace';
    ctx.fillText(inv.invoiceNo, W - M - 24, 181);

    ctx.font = '700 17px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.fillText(`STATUS: ${String(inv.status || 'PAID').toUpperCase()}`, W - M, 232);
    ctx.textAlign = 'left';

    y = 330;
  }

  // BILL TO + INVOICE META BOXES (Side by side)
  const colGap = 28;
  const colW = (W - M * 2 - colGap) / 2;
  const boxH = 230;

  // Left: Bill To
  drawRoundedRect(ctx, M, y, colW, boxH, 18);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = p.border;
  ctx.lineWidth = 2;
  ctx.stroke();

  drawRoundedRect(ctx, M, y, colW, 46, 16);
  ctx.fillStyle = p.tintStrong;
  ctx.fill();
  ctx.fillRect(M, y + 30, colW, 16);
  ctx.fillStyle = p.primary;
  ctx.font = '800 17px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('BILL TO', M + 22, y + 30);

  ctx.fillStyle = p.ink;
  ctx.font = '800 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(inv.clientName || 'Customer', M + 22, y + 88);

  ctx.fillStyle = '#475569';
  ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
  const cAddr = wrapCanvasLines(ctx, inv.clientAddress, colW - 44);
  cAddr.slice(0, 2).forEach((ln, i) => ctx.fillText(ln, M + 22, y + 122 + i * 28));
  ctx.fillText(inv.clientPhone || '', M + 22, y + 184);
  ctx.fillText(inv.clientEmail || '', M + 22, y + 212);

  // Right: Invoice & Payment Details
  const rx = M + colW + colGap;
  drawRoundedRect(ctx, rx, y, colW, boxH, 18);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = p.border;
  ctx.lineWidth = 2;
  ctx.stroke();

  drawRoundedRect(ctx, rx, y, colW, 46, 16);
  ctx.fillStyle = p.tintStrong;
  ctx.fill();
  ctx.fillRect(rx, y + 30, colW, 16);
  ctx.fillStyle = p.primary;
  ctx.font = '800 17px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('INVOICE & PAYMENT INFO', rx + 22, y + 30);

  const metaRows = [
    ['Invoice Date', formatDate(inv.invoiceDate)],
    ['Due Date', formatDate(inv.dueDate)],
    ['Payment Method', inv.paymentMethod || 'UPI / Bank']
  ];
  metaRows.forEach(([k, v], i) => {
    const ry = y + 84 + i * 32;
    ctx.fillStyle = '#64748B';
    ctx.font = '600 19px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(k, rx + 22, ry);
    ctx.textAlign = 'right';
    ctx.fillStyle = p.ink;
    ctx.font = '700 19px "JetBrains Mono", monospace';
    ctx.fillText(v, rx + colW - 22, ry);
    ctx.textAlign = 'left';
  });

  ctx.strokeStyle = p.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rx + 22, y + 166);
  ctx.lineTo(rx + colW - 22, y + 166);
  ctx.stroke();

  ctx.fillStyle = '#475569';
  ctx.font = '500 17px "Plus Jakarta Sans", sans-serif';
  const payLines = wrapCanvasLines(ctx, inv.paymentDetails, colW - 44);
  payLines.slice(0, 2).forEach((ln, i) => ctx.fillText(ln, rx + 22, y + 194 + i * 24));

  y += boxH + 34;

  // LINE ITEMS TABLE
  const tableW = W - M * 2;
  const colPos = [M, M + 66, M + 630, M + 720, M + 840, M + 995, M + tableW];
  const headerH = 54;

  drawRoundedRect(ctx, M, y, tableW, headerH, 14);
  ctx.fillStyle = p.primary;
  ctx.fill();
  ctx.fillRect(M, y + 36, tableW, 18);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NO.', (colPos[0] + colPos[1]) / 2, y + 34);
  ctx.textAlign = 'left';
  ctx.fillText('DESCRIPTION', colPos[1] + 14, y + 34);
  ctx.textAlign = 'center';
  ctx.fillText('QTY', (colPos[2] + colPos[3]) / 2, y + 34);
  ctx.fillText('UNIT', (colPos[3] + colPos[4]) / 2, y + 34);
  ctx.textAlign = 'right';
  ctx.fillText('UNIT PRICE', colPos[5] - 14, y + 34);
  ctx.fillText('LINE TOTAL', colPos[6] - 18, y + 34);
  ctx.textAlign = 'left';

  y += headerH;

  const items = inv.items || [];
  const rowH = 62;
  const displayRows = Math.max(items.length, 6);

  for (let i = 0; i < displayRows; i++) {
    const it = items[i];
    ctx.fillStyle = i % 2 === 1 ? p.tint : '#FFFFFF';
    ctx.fillRect(M, y, tableW, rowH);

    ctx.strokeStyle = p.border;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(M, y, tableW, rowH);

    if (it) {
      const lineTotal = (Number(it.qty) || 0) * (Number(it.price) || 0);
      ctx.fillStyle = '#64748B';
      ctx.font = '600 19px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(i + 1), (colPos[0] + colPos[1]) / 2, y + 38);

      ctx.textAlign = 'left';
      ctx.fillStyle = p.ink;
      ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
      const descTxt = String(it.desc || 'Item').slice(0, 48);
      ctx.fillText(descTxt, colPos[1] + 14, y + 38);

      ctx.textAlign = 'center';
      ctx.font = '600 19px "JetBrains Mono", monospace';
      ctx.fillText(String(Number(it.qty) || 0), (colPos[2] + colPos[3]) / 2, y + 38);

      ctx.fillStyle = '#475569';
      ctx.font = '500 19px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(String(it.unit || 'Unit'), (colPos[3] + colPos[4]) / 2, y + 38);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#334155';
      ctx.font = '600 19px "JetBrains Mono", monospace';
      ctx.fillText(formatINR(it.price), colPos[5] - 14, y + 38);

      ctx.fillStyle = p.ink;
      ctx.font = '700 20px "JetBrains Mono", monospace';
      ctx.fillText(formatINR(lineTotal), colPos[6] - 18, y + 38);
      ctx.textAlign = 'left';
    }
    y += rowH;
    if (y > 1240) break;
  }

  y += 32;

  // BOTTOM GRID: TERMS + SIGNATURE (LEFT) & TOTALS BOX (RIGHT)
  const leftW = 630;
  const rightW = tableW - leftW - 28;
  const rightX = M + leftW + 28;
  const footH = 266;

  // Left: Terms & Signature
  drawRoundedRect(ctx, M, y, leftW, footH, 18);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = p.border;
  ctx.lineWidth = 2;
  ctx.stroke();

  drawRoundedRect(ctx, M, y, leftW, 44, 16);
  ctx.fillStyle = p.tintStrong;
  ctx.fill();
  ctx.fillRect(M, y + 28, leftW, 16);
  ctx.fillStyle = p.primary;
  ctx.font = '800 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('TERMS, WARRANTY & COMMENTS', M + 22, y + 29);

  ctx.fillStyle = '#475569';
  ctx.font = '500 19px "Plus Jakarta Sans", sans-serif';
  const termLines = wrapCanvasLines(ctx, inv.terms, leftW - 44);
  termLines.slice(0, 4).forEach((ln, i) => ctx.fillText(ln, M + 22, y + 82 + i * 28));

  ctx.strokeStyle = p.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(M + 22, y + 196);
  ctx.lineTo(M + leftW - 22, y + 196);
  ctx.stroke();

  ctx.fillStyle = '#64748B';
  ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('PREPARED & APPROVED BY', M + 22, y + 236);

  ctx.textAlign = 'right';
  ctx.fillStyle = p.primary;
  ctx.font = 'italic 400 40px "Instrument Serif", Georgia, serif';
  ctx.fillText(inv.approvedBy || 'Authorized Signatory', M + leftW - 22, y + 240);
  ctx.textAlign = 'left';

  // Right: Totals Card
  drawRoundedRect(ctx, rightX, y, rightW, footH, 18);
  ctx.fillStyle = p.tint;
  ctx.fill();
  ctx.strokeStyle = p.border;
  ctx.lineWidth = 2;
  ctx.stroke();

  const totRows = [
    ['Subtotal', formatINR(t.subtotal)],
    [`Discount (${t.discountPct}%)`, `-${formatINR(t.discountAmt)}`],
    [`GST / Tax (${t.taxPct}%)`, `+${formatINR(t.taxAmt)}`]
  ];
  totRows.forEach(([k, v], i) => {
    const ty = y + 48 + i * 44;
    ctx.fillStyle = '#475569';
    ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(k, rightX + 24, ty);
    ctx.textAlign = 'right';
    ctx.fillStyle = p.ink;
    ctx.font = '700 21px "JetBrains Mono", monospace';
    ctx.fillText(v, rightX + rightW - 24, ty);
    ctx.textAlign = 'left';
  });

  // Grand Total colored block
  drawRoundedRect(ctx, rightX + 14, y + 178, rightW - 28, 72, 14);
  ctx.fillStyle = p.primary;
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('GRAND TOTAL', rightX + 34, y + 222);
  ctx.textAlign = 'right';
  ctx.font = '700 28px "JetBrains Mono", monospace';
  ctx.fillText(formatINR(t.grandTotal), rightX + rightW - 34, y + 224);
  ctx.textAlign = 'left';

  // FOOTER THANK YOU
  const footY = H - 88;
  ctx.strokeStyle = p.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(M, footY - 34);
  ctx.lineTo(W - M, footY - 34);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = p.primary;
  ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Thank you for your business!', W / 2, footY + 4);
  ctx.fillStyle = '#64748B';
  ctx.font = '500 17px "JetBrains Mono", monospace';
  ctx.fillText(`${inv.businessName}  •  ${inv.businessPhone}  •  ${inv.businessEmail}`, W / 2, footY + 34);
  ctx.textAlign = 'left';

  return canvas;
}

/* Zero-Dependency Spec-Compliant Binary A4 PDF Generator from Canvas JPEG */
function canvasToA4PdfBlob(canvas) {
  const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
  const base64 = dataUrl.split(',')[1];
  const binStr = atob(base64);
  const jpegBytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) jpegBytes[i] = binStr.charCodeAt(i);

  const enc = new TextEncoder();
  const chunks = [];
  const offsets = [0];
  let byteLen = 0;

  const pushStr = (s) => {
    const b = enc.encode(s);
    chunks.push(b);
    byteLen += b.length;
  };
  const pushBytes = (b) => {
    chunks.push(b);
    byteLen += b.length;
  };

  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  offsets.push(byteLen);
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  offsets.push(byteLen);
  pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  offsets.push(byteLen);
  pushStr('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n');

  offsets.push(byteLen);
  pushStr(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
  pushBytes(jpegBytes);
  pushStr('\nendstream\nendobj\n');

  const contentStream = 'q 595.28 0 0 841.89 0 0 cm /Im0 Do Q';
  offsets.push(byteLen);
  pushStr(`5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`);

  const xrefPos = byteLen;
  pushStr(`xref\n0 ${offsets.length}\n`);
  pushStr('0000000000 65535 f \n');
  for (let i = 1; i < offsets.length; i++) {
    pushStr(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
  }

  pushStr(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`);
  return new Blob(chunks, { type: 'application/pdf' });
}

function triggerBlobDownload(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function downloadInvoicePNG(savedId = null) {
  ensureInvoiceState();
  const inv = savedId ? (state.invoices.find(x => x.id === savedId) || state.invoiceDraft) : state.invoiceDraft;
  showToast('Rendering HD colorful PNG image...');
  const canvas = await renderInvoiceToA4Canvas(inv);
  canvas.toBlob((blob) => {
    if (blob) {
      triggerBlobDownload(`${inv.invoiceNo || 'AquaVault-Invoice'}.png`, blob);
      showToast(`Downloaded ${inv.invoiceNo}.png`);
    }
  }, 'image/png');
}

async function downloadInvoicePDF(savedId = null) {
  ensureInvoiceState();
  const inv = savedId ? (state.invoices.find(x => x.id === savedId) || state.invoiceDraft) : state.invoiceDraft;
  showToast('Generating colorful A4 PDF...');
  const canvas = await renderInvoiceToA4Canvas(inv);
  const pdfBlob = canvasToA4PdfBlob(canvas);
  triggerBlobDownload(`${inv.invoiceNo || 'AquaVault-Invoice'}.pdf`, pdfBlob);
  showToast(`Downloaded ${inv.invoiceNo}.pdf`);
}

/* =========================================================================
   GOOGLE SHEETS CSV EXPORT & LIVE APPS SCRIPT SYNC
   ========================================================================= */
function csvCell(val) {
  const s = String(val ?? '').replace(/"/g, '""');
  return `"${s}"`;
}

function buildGoogleSheetsCsv(records) {
  const headers = [
    'Invoice Number',
    'Invoice Date',
    'Due Date',
    'Status',
    'Business Name',
    'Customer Name',
    'Customer Phone',
    'Customer Email',
    'Items Summary',
    'Subtotal (INR)',
    'Discount %',
    'Discount Amount',
    'GST / Tax %',
    'Tax Amount',
    'Grand Total (INR)',
    'Payment Method',
    'Payment Details',
    'Color Theme'
  ];

  const rows = records.map(inv => {
    const t = computeInvoiceTotals(inv);
    const itemsSummary = (inv.items || [])
      .map(it => `${it.desc} (${it.qty} ${it.unit} x ${it.price})`)
      .join(' | ');
    return [
      inv.invoiceNo,
      inv.invoiceDate,
      inv.dueDate,
      inv.status,
      inv.businessName,
      inv.clientName,
      inv.clientPhone,
      inv.clientEmail,
      itemsSummary,
      t.subtotal,
      t.discountPct,
      t.discountAmt,
      t.taxPct,
      t.taxAmt,
      t.grandTotal,
      inv.paymentMethod,
      inv.paymentDetails,
      getPalette(inv.palette).name
    ].map(csvCell).join(',');
  });

  // UTF-8 BOM ensures Excel & Google Sheets open ₹ and Unicode cleanly
  return '\uFEFF' + [headers.map(csvCell).join(','), ...rows].join('\r\n');
}

function exportInvoicesGoogleSheetsCSV(includeDraft = true) {
  ensureInvoiceState();
  if (includeDraft) saveCurrentInvoiceToLedger(true);
  const records = state.invoices.length ? state.invoices : [state.invoiceDraft];
  const csv = buildGoogleSheetsCsv(records);
  triggerBlobDownload(`AquaVault-GoogleSheets-Invoices.csv`, new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  showToast(`Exported ${records.length} invoice(s) to Google Sheets CSV`);
}

function updateGoogleSheetUrl(url) {
  ensureInvoiceState();
  state.googleSheetWebhook = url.trim();
  saveState();
}

async function syncInvoiceToGoogleSheet() {
  ensureInvoiceState();
  const record = saveCurrentInvoiceToLedger(true);
  const url = (state.googleSheetWebhook || '').trim();
  if (!url) {
    exportInvoicesGoogleSheetsCSV(false);
    showToast('CSV downloaded — paste Apps Script URL below for direct cloud push');
    return;
  }

  const t = computeInvoiceTotals(record);
  const payload = {
    invoiceNo: record.invoiceNo,
    invoiceDate: record.invoiceDate,
    dueDate: record.dueDate,
    status: record.status,
    businessName: record.businessName,
    clientName: record.clientName,
    clientPhone: record.clientPhone,
    clientEmail: record.clientEmail,
    items: (record.items || []).map(i => `${i.desc} (${i.qty} x ${i.price})`).join(' | '),
    subtotal: t.subtotal,
    discountPct: t.discountPct,
    taxPct: t.taxPct,
    grandTotal: t.grandTotal,
    paymentMethod: record.paymentMethod
  };

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    showToast(`Pushed ${record.invoiceNo} directly to Google Sheet`);
  } catch {
    showToast('Could not reach Google Sheet URL — exporting CSV backup');
    exportInvoicesGoogleSheetsCSV(false);
  }
}

function copyAppsScriptSnippet() {
  const code = `function doPost(e) {\n  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();\n  var d = JSON.parse(e.postData.contents);\n  if (sheet.getLastRow() === 0) {\n    sheet.appendRow(["Invoice No","Date","Due Date","Status","Business","Customer","Phone","Email","Items","Subtotal","Discount %","GST %","Grand Total","Payment"]);\n  }\n  sheet.appendRow([d.invoiceNo,d.invoiceDate,d.dueDate,d.status,d.businessName,d.clientName,d.clientPhone,d.clientEmail,d.items,d.subtotal,d.discountPct,d.taxPct,d.grandTotal,d.paymentMethod]);\n  return ContentService.createTextOutput("OK");\n}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(() => showToast('Google Apps Script copied to clipboard')).catch(() => showToast('Copy script manually from box'));
  } else {
    showToast('Copy script from the setup guide');
  }
}

/* =========================================================================
   MAIN PAGE RENDERER: renderInvoicePage()
   ========================================================================= */
function renderInvoicePage() {
  ensureInvoiceState();
  const inv = state.invoiceDraft;
  const tab = state.invoiceTab || 'studio';
  const totals = computeInvoiceTotals(inv);

  const studioHtml = `
    <!-- THEME & FRAME DESIGNER STRIP -->
    <div class="card" style="margin-bottom:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
        <div>
          <div class="eyebrow" style="color:var(--primary);">Designer Palette</div>
          <div style="font-size:15px;font-weight:700;margin-top:2px;">Colorful Luxury Invoice Themes</div>
        </div>
        <div class="segmented" style="margin:0;width:auto;min-width:190px;">
          <button class="seg-btn ${inv.frameStyle === 'colorful' ? 'active' : ''}" onclick="setInvoiceFrameStyle('colorful')">Colorful</button>
          <button class="seg-btn ${inv.frameStyle === 'classic' ? 'active' : ''}" onclick="setInvoiceFrameStyle('classic')">Classic Frame</button>
        </div>
      </div>

      <div class="palette-strip">
        ${Object.values(INVOICE_PALETTES).map(p => `
          <button class="palette-pill ${inv.palette === p.id ? 'active' : ''}" onclick="setInvoicePalette('${p.id}')">
            <span class="palette-dot" style="background:linear-gradient(135deg, ${p.primary}, ${p.secondary});"></span>
            <span>${p.name}</span>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- LIVE COLORFUL INVOICE PREVIEW + 1-CLICK EXPORTS -->
    <div class="card" style="margin-bottom:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
        <div>
          <div class="eyebrow" style="color:var(--primary);">Live A4 Sheet Preview</div>
          <div style="font-size:15px;font-weight:700;margin-top:2px;">Instant Download &amp; Google Sheets</div>
        </div>
        <span class="badge badge-violet mono" id="editorGrandTotalBadge">${formatINR(totals.grandTotal)}</span>
      </div>

      <div id="liveInvoicePreviewHost" class="inv-preview-stage">
        ${buildLiveInvoicePreviewMarkup(inv)}
      </div>

      <div class="export-action-grid" style="margin-top:14px;">
        <button class="btn btn-primary" onclick="downloadInvoicePDF()">
          ${ICONS.receipt} <span>Download PDF</span>
        </button>
        <button class="btn btn-outline" onclick="downloadInvoicePNG()">
          ${ICONS.download} <span>Download Image</span>
        </button>
        <button class="btn btn-soft" onclick="exportInvoicesGoogleSheetsCSV(true)">
          ${ICONS.cloud} <span>Google Sheets CSV</span>
        </button>
        <button class="btn btn-outline" onclick="saveCurrentInvoiceToLedger(false)">
          ${ICONS.check} <span>Save to Vault</span>
        </button>
      </div>
    </div>

    <!-- EDITABLE FORM: BUSINESS & META -->
    <div class="card" style="margin-bottom:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;">
        <div class="eyebrow" style="color:var(--primary);">1. Business &amp; Invoice Details</div>
        <button class="btn btn-outline btn-sm" onclick="resetInvoiceDraft()">New Invoice</button>
      </div>

      <div class="spec-grid" style="margin-bottom:10px;">
        <div>
          <label class="field-label">Invoice Number</label>
          <input class="input mono" value="${escapeHtml(inv.invoiceNo)}" oninput="updateInvoiceField('invoiceNo', this.value)" />
        </div>
        <div>
          <label class="field-label">Status</label>
          <select class="select" onchange="updateInvoiceField('status', this.value)">
            ${['Paid', 'Pending', 'Partial', 'Proforma'].map(s => `<option ${inv.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="spec-grid" style="margin-bottom:10px;">
        <div>
          <label class="field-label">Invoice Date</label>
          <input class="input mono" type="date" value="${escapeHtml(inv.invoiceDate)}" onchange="updateInvoiceField('invoiceDate', this.value)" />
        </div>
        <div>
          <label class="field-label">Due Date</label>
          <input class="input mono" type="date" value="${escapeHtml(inv.dueDate)}" onchange="updateInvoiceField('dueDate', this.value)" />
        </div>
      </div>

      <div style="display:grid;gap:10px;">
        <div>
          <label class="field-label">Your Business Name</label>
          <input class="input" value="${escapeHtml(inv.businessName)}" oninput="updateInvoiceField('businessName', this.value)" />
        </div>
        <div>
          <label class="field-label">Business Address</label>
          <input class="input" value="${escapeHtml(inv.businessAddress)}" oninput="updateInvoiceField('businessAddress', this.value)" />
        </div>
        <div class="spec-grid">
          <div>
            <label class="field-label">Business Phone</label>
            <input class="input" value="${escapeHtml(inv.businessPhone)}" oninput="updateInvoiceField('businessPhone', this.value)" />
          </div>
          <div>
            <label class="field-label">Business Email</label>
            <input class="input" value="${escapeHtml(inv.businessEmail)}" oninput="updateInvoiceField('businessEmail', this.value)" />
          </div>
        </div>
        <div>
          <label class="field-label">GSTIN / Website</label>
          <input class="input mono" value="${escapeHtml(inv.businessWebsite)}" oninput="updateInvoiceField('businessWebsite', this.value)" />
        </div>
      </div>
    </div>

    <!-- EDITABLE FORM: BILL TO & PAYMENT -->
    <div class="card" style="margin-bottom:14px;">
      <div class="eyebrow" style="color:var(--primary);margin-bottom:12px;">2. Bill To (Customer) &amp; Payment</div>
      <div style="display:grid;gap:10px;">
        <div class="spec-grid">
          <div>
            <label class="field-label">Customer Name</label>
            <input class="input" value="${escapeHtml(inv.clientName)}" oninput="updateInvoiceField('clientName', this.value)" />
          </div>
          <div>
            <label class="field-label">Customer Phone</label>
            <input class="input" value="${escapeHtml(inv.clientPhone)}" oninput="updateInvoiceField('clientPhone', this.value)" />
          </div>
        </div>
        <div>
          <label class="field-label">Customer Address</label>
          <input class="input" value="${escapeHtml(inv.clientAddress)}" oninput="updateInvoiceField('clientAddress', this.value)" />
        </div>
        <div class="spec-grid">
          <div>
            <label class="field-label">Customer Email</label>
            <input class="input" value="${escapeHtml(inv.clientEmail)}" oninput="updateInvoiceField('clientEmail', this.value)" />
          </div>
          <div>
            <label class="field-label">Payment Method</label>
            <input class="input" value="${escapeHtml(inv.paymentMethod)}" oninput="updateInvoiceField('paymentMethod', this.value)" />
          </div>
        </div>
        <div>
          <label class="field-label">Bank / UPI Information</label>
          <input class="input" value="${escapeHtml(inv.paymentDetails)}" oninput="updateInvoiceField('paymentDetails', this.value)" />
        </div>
      </div>
    </div>

    <!-- EDITABLE FORM: LINE ITEMS -->
    <div class="card" style="margin-bottom:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;">
        <div class="eyebrow" style="color:var(--primary);">3. Line Items &amp; Auto Calculations</div>
        <button class="btn btn-soft btn-sm" onclick="addInvoiceItem()">+ Add Item</button>
      </div>

      ${(inv.items || []).map((it, idx) => `
        <div class="inv-item-editor">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
            <span class="mono" style="font-size:11.5px;font-weight:700;color:var(--primary);">Item #${idx + 1}</span>
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="mono" id="invRowTotal_${idx}" style="font-size:13px;font-weight:700;">${formatINR((Number(it.qty) || 0) * (Number(it.price) || 0))}</span>
              <button style="color:var(--ink-tertiary);padding:4px;" onclick="removeInvoiceItem(${idx})" aria-label="Remove item">${ICONS.trash}</button>
            </div>
          </div>
          <input class="input" style="margin-bottom:8px;" placeholder="Product or service description..." value="${escapeHtml(it.desc)}" oninput="updateInvoiceItem(${idx}, 'desc', this.value)" />
          <div class="inv-item-nums">
            <div>
              <label class="field-label">Qty</label>
              <input class="input mono" type="number" min="0" value="${it.qty}" oninput="updateInvoiceItem(${idx}, 'qty', this.value)" />
            </div>
            <div>
              <label class="field-label">Unit</label>
              <input class="input" value="${escapeHtml(it.unit)}" oninput="updateInvoiceItem(${idx}, 'unit', this.value)" />
            </div>
            <div>
              <label class="field-label">Rate (₹)</label>
              <input class="input mono" type="number" min="0" value="${it.price}" oninput="updateInvoiceItem(${idx}, 'price', this.value)" />
            </div>
          </div>
        </div>
      `).join('')}

      <div class="spec-grid" style="margin-top:12px;">
        <div>
          <label class="field-label">Discount (%)</label>
          <input class="input mono" type="number" min="0" max="100" value="${inv.discountPct}" oninput="updateInvoiceField('discountPct', this.value)" />
        </div>
        <div>
          <label class="field-label">GST / Tax (%)</label>
          <input class="input mono" type="number" min="0" max="100" value="${inv.taxPct}" oninput="updateInvoiceField('taxPct', this.value)" />
        </div>
      </div>

      <div style="margin-top:10px;">
        <label class="field-label">Terms &amp; Comments</label>
        <textarea class="textarea" style="min-height:74px;" oninput="updateInvoiceField('terms', this.value)">${escapeHtml(inv.terms)}</textarea>
      </div>
      <div style="margin-top:10px;">
        <label class="field-label">Prepared &amp; Approved By (Signature)</label>
        <input class="input" value="${escapeHtml(inv.approvedBy)}" oninput="updateInvoiceField('approvedBy', this.value)" />
      </div>
    </div>

    <!-- GOOGLE SHEETS LIVE CLOUD SYNC -->
    <div class="card">
      <div class="eyebrow" style="color:var(--emerald);margin-bottom:4px;">Google Sheets Integration</div>
      <h3 style="font-size:16.5px;font-weight:700;margin:0 0 6px;">Store Directly in Your Google Sheet / CSV</h3>
      <p style="font-size:12.5px;color:var(--ink-secondary);margin:0 0 12px;">
        Export all invoices as a Google Sheets ready CSV anytime, or paste your Google Apps Script Web App URL below to push rows live into your Google Sheet.
      </p>
      <div style="margin-bottom:10px;">
        <label class="field-label">Google Apps Script Web App URL (Optional for 1-Click Cloud Push)</label>
        <input class="input" placeholder="https://script.google.com/macros/s/.../exec" value="${escapeHtml(state.googleSheetWebhook)}" onchange="updateGoogleSheetUrl(this.value)" />
      </div>
      <div class="dual-actions">
        <button class="btn btn-primary btn-sm" onclick="syncInvoiceToGoogleSheet()">
          ${ICONS.cloud} <span>Push to Sheet</span>
        </button>
        <button class="btn btn-outline btn-sm" onclick="copyAppsScriptSnippet()">
          ${ICONS.receipt} <span>Copy Sheet Script</span>
        </button>
      </div>
      <details style="margin-top:12px;background:var(--surface-subtle);border:1px solid var(--border);border-radius:12px;padding:10px 12px;">
        <summary style="cursor:pointer;font-size:12px;font-weight:700;color:var(--primary);">View Google Sheets Apps Script Code (Extensions &rarr; Apps Script)</summary>
        <pre class="mono" style="margin:8px 0 0;padding:10px;border-radius:10px;background:#0B0914;color:#E2DCFA;font-size:11px;overflow-x:auto;white-space:pre;">function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var d = JSON.parse(e.postData.contents);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Invoice No","Date","Due Date","Status","Business","Customer","Phone","Email","Items","Subtotal","Discount %","GST %","Grand Total","Payment"]);
  }
  sheet.appendRow([d.invoiceNo,d.invoiceDate,d.dueDate,d.status,d.businessName,d.clientName,d.clientPhone,d.clientEmail,d.items,d.subtotal,d.discountPct,d.taxPct,d.grandTotal,d.paymentMethod]);
  return ContentService.createTextOutput("OK");
}</pre>
      </details>
    </div>
  `;

  const ledgerHtml = `
    <div class="card" style="margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
      <div>
        <div class="eyebrow" style="color:var(--primary);">Google Sheets Ready Vault</div>
        <div style="font-size:16px;font-weight:700;margin-top:2px;">${state.invoices.length} Saved Invoice(s)</div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="exportInvoicesGoogleSheetsCSV(false)">
        ${ICONS.download} <span>Export All CSV</span>
      </button>
    </div>

    ${state.invoices.length === 0 ? `
      <div class="card" style="text-align:center;color:var(--ink-tertiary);padding:28px;">
        No invoices saved yet. Design one in Invoice Studio and tap Save to Vault.
      </div>
    ` : state.invoices.map(item => {
      const itTot = computeInvoiceTotals(item);
      const pal = getPalette(item.palette);
      return `
        <div class="card" style="padding:16px;margin-bottom:10px;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px;">
            <div style="display:flex;align-items:center;gap:10px;min-width:0;">
              <span class="palette-dot" style="width:16px;height:16px;background:linear-gradient(135deg, ${pal.primary}, ${pal.secondary});"></span>
              <div style="min-width:0;">
                <div style="font-size:14.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(item.clientName)}</div>
                <div class="mono" style="font-size:11.5px;color:var(--ink-tertiary);">${escapeHtml(item.invoiceNo)} &middot; ${formatDate(item.invoiceDate)}</div>
              </div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div class="mono" style="font-size:15px;font-weight:800;color:var(--primary);">${formatINR(itTot.grandTotal)}</div>
              <span class="badge badge-violet" style="padding:2px 8px;font-size:10px;margin-top:3px;">${escapeHtml(item.status)}</span>
            </div>
          </div>

          <div class="export-action-grid">
            <button class="btn btn-primary btn-sm" onclick="downloadInvoicePDF('${item.id}')">${ICONS.receipt} <span>PDF</span></button>
            <button class="btn btn-outline btn-sm" onclick="downloadInvoicePNG('${item.id}')">${ICONS.download} <span>Image</span></button>
            <button class="btn btn-soft btn-sm" onclick="loadSavedInvoiceIntoEditor('${item.id}')">${ICONS.notes} <span>Edit</span></button>
            <button class="btn btn-danger-outline btn-sm" onclick="deleteSavedInvoice('${item.id}')">${ICONS.trash} <span>Delete</span></button>
          </div>
        </div>
      `;
    }).join('')}
  `;

  return `
    <div class="page-view">
      <div class="page-header">
        <div class="page-eyebrow">Flagship Billing Studio</div>
        <h1 class="page-h1">Invoice Generator</h1>
        <p class="page-sub">Design colorful luxury invoices, export instant PDF &amp; HD PNG images, and store directly in Google Sheets CSV.</p>
      </div>

      <div class="segmented" role="tablist">
        <button class="seg-btn ${tab === 'studio' ? 'active' : ''}" onclick="setInvoiceSubTab('studio')">Invoice Studio</button>
        <button class="seg-btn ${tab === 'ledger' ? 'active' : ''}" onclick="setInvoiceSubTab('ledger')">Saved &amp; CSV (${state.invoices.length})</button>
      </div>

      ${tab === 'studio' ? studioHtml : ledgerHtml}
    </div>
  `;
}
