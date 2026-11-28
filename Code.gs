/**
 * ============================================================================
 * AQUAVAULT — AUTOMATIC GOOGLE DRIVE PERMANENT BILL VAULT & GOOGLE SHEETS SYNC
 * ============================================================================
 * HOW TO DEPLOY (2 MINUTES):
 * 1. Open https://script.google.com and create a New Project (or open from your Google Sheet: Extensions -> Apps Script).
 * 2. Paste this entire Code.gs file and click Save (Ctrl+S).
 * 3. Click "Deploy" -> "New deployment" -> Type: "Web app".
 * 4. Set "Execute as": "Me"
 *    Set "Who has access": "Anyone"
 * 5. Click "Deploy", authorize Google Drive & Sheets permissions, and copy the Web App URL (ends with /exec).
 * 6. Paste the /exec URL inside AquaVault Admin -> Invoices -> Google Drive & Sheets Webhook URL (or on invoice.html).
 *
 * WHAT HAPPENS WHEN ADMIN CLICKS "GENERATE & SAVE BILL":
 * 1. Automatically creates (or reuses) a dedicated folder in your Google Drive named:
 *    "AquaVault_Permanent_Bills"
 * 2. Automatically generates a permanent PDF invoice file (plus HTML backup if needed) inside
 *    that Google Drive folder named: "INV-AQV-XXXX_CustomerName_Date.pdf"
 * 3. Appends a complete ledger row into your Google Sheet ("AquaVault_Bills_Ledger") with the
 *    direct Google Drive File link so zero bills are ever lost.
 * ============================================================================
 */

var DRIVE_FOLDER_NAME = 'AquaVault_Permanent_Bills';
var SHEET_TAB_NAME = 'AquaVault_Bills_Ledger';

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var payload = JSON.parse(raw);

    // 1. Get or create permanent Google Drive Folder
    var folder = getOrCreateDriveFolder_(DRIVE_FOLDER_NAME);

    // 2. Build clean printable HTML invoice for permanent Google Drive PDF creation
    var invoiceNo = String(payload.invoiceNo || ('INV-AQV-' + new Date().getTime())).trim();
    var customerName = String(payload.customerName || payload.clientName || 'Customer').trim();
    var safeCustomerSlug = customerName.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_');
    var invoiceDate = String(payload.invoiceDate || new Date().toISOString().slice(0, 10));
    var fileBaseName = invoiceNo + '_' + safeCustomerSlug + '_' + invoiceDate;

    var htmlContent = payload.invoiceHtml || buildFallbackInvoiceHtml_(payload);
    var htmlBlob = Utilities.newBlob(htmlContent, 'text/html', fileBaseName + '.html');

    var driveFile;
    var driveFileUrl = '';
    try {
      var pdfBlob = htmlBlob.getAs('application/pdf').setName(fileBaseName + '.pdf');
      driveFile = folder.createFile(pdfBlob);
      driveFileUrl = driveFile.getUrl();
    } catch (pdfErr) {
      // Fallback to permanent HTML document in Google Drive if PDF conversion is unavailable
      driveFile = folder.createFile(htmlBlob);
      driveFileUrl = driveFile.getUrl();
    }

    // 3. Log permanent ledger row in Google Sheets (creates a standalone Sheet inside the Drive folder if not bound)
    var sheetUrl = appendInvoiceRowToSheet_(folder, payload, driveFileUrl);

    return ContentService
      .createTextOutput(JSON.stringify({
        ok: true,
        status: 'SAVED_TO_GOOGLE_DRIVE',
        invoiceNo: invoiceNo,
        driveFolder: DRIVE_FOLDER_NAME,
        driveFileUrl: driveFileUrl,
        sheetUrl: sheetUrl,
        savedAt: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({
        ok: false,
        error: String(err && err.message ? err.message : err)
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      service: 'AquaVault Permanent Google Drive Bill Vault',
      folder: DRIVE_FOLDER_NAME
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateDriveFolder_(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

function appendInvoiceRowToSheet_(folder, p, driveFileUrl) {
  var ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (_) {}

  if (!ss) {
    var existingFiles = folder.getFilesByName('AquaVault_Master_Bills_Register');
    if (existingFiles.hasNext()) {
      ss = SpreadsheetApp.open(existingFiles.next());
    } else {
      ss = SpreadsheetApp.create('AquaVault_Master_Bills_Register');
      var ssFile = DriveApp.getFileById(ss.getId());
      folder.addFile(ssFile);
    }
  }

  var sheet = ss.getSheetByName(SHEET_TAB_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_TAB_NAME);
    sheet.appendRow([
      'Timestamp (IST)',
      'Invoice No',
      'Invoice Date',
      'Due Date',
      'Status',
      'Customer Name',
      'Mobile Number',
      'Location / Address',
      'Product Model(s)',
      'Hardware Type',
      'Quantity',
      'Unit Price (INR)',
      'Discount %',
      'GST %',
      'Grand Total (INR)',
      'Payment Method',
      'Google Drive Permanent Bill Link'
    ]);
    sheet.getRange(1, 1, 1, 17).setFontWeight('bold');
  }

  sheet.appendRow([
    new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    p.invoiceNo || '',
    p.invoiceDate || '',
    p.dueDate || '',
    p.status || 'PAID',
    p.customerName || p.clientName || '',
    p.mobileNumber || p.clientPhone || '',
    p.address || p.clientAddress || '',
    p.modelName || p.itemsSummary || '',
    p.hardwareType || 'Water Level Controller',
    Number(p.quantity || 1),
    Number(p.unitPrice || p.subtotal || 0),
    Number(p.discountPct || 0),
    Number(p.taxPct || 18),
    Number(p.grandTotal || 0),
    p.paymentMethod || 'UPI / Bank Transfer',
    driveFileUrl || ''
  ]);

  return ss.getUrl();
}

function buildFallbackInvoiceHtml_(p) {
  var itemsRows = '';
  if (Array.isArray(p.items) && p.items.length > 0) {
    for (var i = 0; i < p.items.length; i++) {
      var it = p.items[i];
      var q = Number(it.qty || 1);
      var pr = Number(it.price || 0);
      itemsRows += '<tr>' +
        '<td style="padding:10px;border:1px solid #cbd5e1;text-align:center;">' + (i + 1) + '</td>' +
        '<td style="padding:10px;border:1px solid #cbd5e1;font-weight:bold;">' + escapeHtml_(it.desc || '') + '</td>' +
        '<td style="padding:10px;border:1px solid #cbd5e1;text-align:center;">' + q + '</td>' +
        '<td style="padding:10px;border:1px solid #cbd5e1;text-align:right;">INR ' + pr.toFixed(2) + '</td>' +
        '<td style="padding:10px;border:1px solid #cbd5e1;text-align:right;font-weight:bold;">INR ' + (q * pr).toFixed(2) + '</td>' +
      '</tr>';
    }
  } else {
    var qty = Number(p.quantity || 1);
    var price = Number(p.unitPrice || 0);
    itemsRows = '<tr>' +
      '<td style="padding:10px;border:1px solid #cbd5e1;text-align:center;">1</td>' +
      '<td style="padding:10px;border:1px solid #cbd5e1;font-weight:bold;">' + escapeHtml_(p.modelName || 'AquaVault Controller') + '</td>' +
      '<td style="padding:10px;border:1px solid #cbd5e1;text-align:center;">' + qty + '</td>' +
      '<td style="padding:10px;border:1px solid #cbd5e1;text-align:right;">INR ' + price.toFixed(2) + '</td>' +
      '<td style="padding:10px;border:1px solid #cbd5e1;text-align:right;font-weight:bold;">INR ' + (qty * price).toFixed(2) + '</td>' +
    '</tr>';
  }

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice ' + escapeHtml_(p.invoiceNo || '') + '</title></head>' +
    '<body style="font-family:Arial,sans-serif;color:#0f172a;padding:32px;max-width:800px;margin:0 auto;">' +
    '<div style="border:2px solid #5B21B6;border-radius:14px;padding:28px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #5B21B6;padding-bottom:18px;margin-bottom:20px;">' +
        '<div>' +
          '<h1 style="margin:0;color:#5B21B6;font-size:28px;letter-spacing:1px;">TAX INVOICE</h1>' +
          '<p style="margin:6px 0 0;font-size:13px;color:#475569;"><strong>' + escapeHtml_(p.businessName || 'AquaVault Smart Systems') + '</strong><br/>' +
          escapeHtml_(p.businessAddress || '') + '<br/>Phone: ' + escapeHtml_(p.businessPhone || '') + '</p>' +
        '</div>' +
        '<div style="text-align:right;">' +
          '<div style="font-size:15px;font-weight:bold;color:#5B21B6;">Invoice No: ' + escapeHtml_(p.invoiceNo || '') + '</div>' +
          '<div style="font-size:12px;color:#475569;margin-top:4px;">Date: ' + escapeHtml_(p.invoiceDate || '') + '</div>' +
          '<div style="font-size:12px;color:#475569;">Status: <strong>' + escapeHtml_(p.status || 'PAID') + '</strong></div>' +
        '</div>' +
      '</div>' +
      '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:20px;">' +
        '<div style="font-size:11px;font-weight:bold;color:#5B21B6;text-transform:uppercase;">Billed To Customer</div>' +
        '<div style="font-size:16px;font-weight:bold;margin-top:4px;">' + escapeHtml_(p.customerName || p.clientName || '') + '</div>' +
        '<div style="font-size:13px;color:#334155;margin-top:2px;">Mobile: ' + escapeHtml_(p.mobileNumber || p.clientPhone || '') + '</div>' +
        '<div style="font-size:13px;color:#334155;">Place / Address: ' + escapeHtml_(p.address || p.clientAddress || '') + '</div>' +
      '</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">' +
        '<thead><tr style="background:#5B21B6;color:#ffffff;">' +
          '<th style="padding:10px;border:1px solid #5B21B6;">#</th>' +
          '<th style="padding:10px;border:1px solid #5B21B6;text-align:left;">Model / Description</th>' +
          '<th style="padding:10px;border:1px solid #5B21B6;">Qty</th>' +
          '<th style="padding:10px;border:1px solid #5B21B6;text-align:right;">Unit Price</th>' +
          '<th style="padding:10px;border:1px solid #5B21B6;text-align:right;">Total</th>' +
        '</tr></thead>' +
        '<tbody>' + itemsRows + '</tbody>' +
      '</table>' +
      '<div style="text-align:right;font-size:14px;line-height:1.7;">' +
        '<div>Subtotal: <strong>INR ' + Number(p.subtotal || (Number(p.quantity || 1) * Number(p.unitPrice || 0))).toFixed(2) + '</strong></div>' +
        '<div>Discount (' + Number(p.discountPct || 0) + '%): <strong>- INR ' + Number(p.discountAmt || 0).toFixed(2) + '</strong></div>' +
        '<div>GST (' + Number(p.taxPct || 18) + '%): <strong>+ INR ' + Number(p.taxAmt || 0).toFixed(2) + '</strong></div>' +
        '<div style="font-size:18px;color:#5B21B6;margin-top:6px;">Grand Total: <strong>INR ' + Number(p.grandTotal || 0).toFixed(2) + '</strong></div>' +
      '</div>' +
      '<div style="margin-top:24px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;display:flex;justify-content:space-between;">' +
        '<span>Authorized Signatory: <strong>' + escapeHtml_(p.signatory || 'AquaVault Admin') + '</strong></span>' +
        '<span>Saved permanently in Google Drive (' + DRIVE_FOLDER_NAME + ')</span>' +
      '</div>' +
    '</div></body></html>';
}

function escapeHtml_(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
