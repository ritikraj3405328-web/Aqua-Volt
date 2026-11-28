const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const { test, before, after, beforeEach } = require("node:test");
const fs = require("node:fs");

let testEnv;
const PROJECT_ID = process.env.GCP_PROJECT || "demo-no-project";
const ALICE_UID = "alice_customer_101";
const BOB_UID = "bob_customer_202";
const ADMIN_UID = "Y8zmDKBgubWIVvhufftRPPjG7HC3";
const OTHER_UID = "other_user_666";
const ADMIN_EMAIL = "admin@aquavault.in";

const [emulatorHost, emulatorPortStr] = (
  process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085"
).split(":");
const emulatorPort = parseInt(emulatorPortStr, 10);

const pastDate = (msAgo = 5000) => new Date(Date.now() - msAgo);
const futureDate = () => new Date(Date.now() + 60000);

before(async () => {
  const rules = fs.readFileSync("./firestore.rules", "utf8");
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: emulatorHost,
      port: emulatorPort,
    },
  });
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

// 1. Public Trust Directory vs. Private Customer & Invoice Vaults
test("Public vs Private Separation: public_units is public read-only and blocks phone/address fields; private_customers & private_invoices are strictly Admin-UID only", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: "alice@example.com", email_verified: true }).firestore();
  const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
  const now = pastDate(5000);

  const validPublicUnit = {
    customerName: "Rajesh Verma",
    maskedPhone: "98XXXXXX10",
    modelName: "AgniVolt Pro-X7 Dual Tank Controller",
    hardwareType: "Water Level Controller",
    quantity: 2,
    installDate: "2026-04-01",
    expiryDate: "2027-04-01",
    status: "ACTIVE",
    updatedAt: now,
  };

  // Unauth and normal users CANNOT write to public_units
  await assertFails(unauthDb.collection("public_units").doc("cust_1").set(validPublicUnit));
  await assertFails(aliceDb.collection("public_units").doc("cust_1").set(validPublicUnit));

  // Admin CAN write to public_units with maskedPhone
  await assertSucceeds(adminDb.collection("public_units").doc("cust_1").set(validPublicUnit));

  // Even Admin CANNOT accidentally write unmasked digits into maskedPhone or mobileNumber/address into public_units
  await assertFails(
    adminDb.collection("public_units").doc("cust_raw_phone").set({
      ...validPublicUnit,
      maskedPhone: "9876543210",
    })
  );
  await assertFails(
    adminDb.collection("public_units").doc("cust_leak").set({
      ...validPublicUnit,
      mobileNumber: "+91 9876543210",
    })
  );

  // Public visitors (unauthenticated) CAN read & list public_units
  await assertSucceeds(unauthDb.collection("public_units").doc("cust_1").get());
  await assertSucceeds(unauthDb.collection("public_units").get());

  // Private Customers Vault: stores mobileNumber & address, strictly Admin-UID only
  const validPrivateCustomer = {
    customerName: "Rajesh Verma",
    mobileNumber: "+91 98765 43210",
    address: "Indiranagar, Bengaluru",
    modelName: "AgniVolt Pro-X7 Dual Tank Controller",
    hardwareType: "Water Level Controller",
    quantity: 2,
    serialNumber: "AV-WLC-88412",
    installDate: "2026-04-01",
    expiryDate: "2027-04-01",
    warrantyDays: 365,
    basePrice: 8450,
    gstRate: 18,
    invoiceNo: "INV-AV-2026-1104",
    createdAt: now,
    updatedAt: now,
  };

  await assertFails(unauthDb.collection("private_customers").doc("cust_1").set(validPrivateCustomer));
  await assertFails(aliceDb.collection("private_customers").doc("cust_1").set(validPrivateCustomer));
  await assertSucceeds(adminDb.collection("private_customers").doc("cust_1").set(validPrivateCustomer));

  // Unauthenticated & non-admin users CANNOT read or list private_customers
  await assertFails(unauthDb.collection("private_customers").doc("cust_1").get());
  await assertFails(unauthDb.collection("private_customers").get());
  await assertFails(aliceDb.collection("private_customers").doc("cust_1").get());
  await assertSucceeds(adminDb.collection("private_customers").doc("cust_1").get());

  // Private Invoices Vault: strictly Admin-UID only
  const validPrivateInvoice = {
    invoiceNo: "INV-AV-2026-1104",
    customerId: "cust_1",
    customerName: "Rajesh Verma",
    mobileNumber: "+91 98765 43210",
    address: "Indiranagar, Bengaluru",
    modelName: "AgniVolt Pro-X7 Dual Tank Controller",
    hardwareType: "Water Level Controller",
    quantity: 2,
    unitPrice: 8450,
    discountPct: 5,
    taxPct: 18,
    grandTotal: 18944.9,
    status: "PAID",
    palette: "violet",
    invoiceDate: "2026-11-27",
    dueDate: "2026-12-11",
    warrantyStartDate: "2026-11-27",
    warrantyExpiryDate: "2027-11-27",
    syncToCustomerLive: true,
    driveSaved: true,
    createdAt: now,
    updatedAt: now,
  };

  await assertFails(unauthDb.collection("private_invoices").doc("inv_1").set(validPrivateInvoice));
  await assertFails(aliceDb.collection("private_invoices").doc("inv_1").set(validPrivateInvoice));
  await assertSucceeds(adminDb.collection("private_invoices").doc("inv_1").set(validPrivateInvoice));
  await assertFails(unauthDb.collection("private_invoices").doc("inv_1").get());
  await assertFails(aliceDb.collection("private_invoices").get());
  await assertSucceeds(adminDb.collection("private_invoices").get());
});

// 2. Customer Profile Rules
test("CustomerProfile: owner create/read/update succeeds; unauth, cross-user, ghost fields, and future timestamps fail", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: "alice@example.com", email_verified: true }).firestore();
  const bobDb = testEnv.authenticatedContext(BOB_UID, { email: "bob@example.com", email_verified: true }).firestore();
  const created = pastDate(10000);

  const validProfile = {
    userId: ALICE_UID,
    displayName: "Customer Name",
    email: "alice@example.com",
    customerCode: "AV-2026-8419",
    phone: "+91 98765 43210",
    address: "42 Park Avenue, Bengaluru",
    darkModeEnabled: false,
    dpdpConsentAccepted: true,
    dpdpConsentVersion: "2026.1",
    gmailSyncEnabled: true,
    driveAutoSaveEnabled: true,
    createdAt: created,
    updatedAt: created,
  };

  await assertFails(unauthDb.collection("users").doc(ALICE_UID).set(validProfile));
  await assertSucceeds(aliceDb.collection("users").doc(ALICE_UID).set(validProfile));
  await assertSucceeds(aliceDb.collection("users").doc(ALICE_UID).get());
  await assertFails(bobDb.collection("users").doc(ALICE_UID).get());
  await assertFails(aliceDb.collection("users").get());
  await assertFails(unauthDb.collection("users").get());

  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).update({
      darkModeEnabled: true,
      gmailSyncEnabled: false,
      updatedAt: pastDate(1000),
    })
  );

  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).update({
      isAdmin: true,
      updatedAt: pastDate(500),
    })
  );

  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).update({
      darkModeEnabled: false,
      updatedAt: futureDate(),
    })
  );
});

// 3. Strict Admin UID RBAC: Admin Collections (/admins, /appConfig, /hubApps, /adminAuditLogs)
test("Strict Anti-Hacker Rules: blocks non-admin write on appConfig/hubApps, allows public read on appConfig/hubApps, and locks adminAuditLogs to Admin UID", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: "alice@example.com", email_verified: true }).firestore();
  const otherDb = testEnv.authenticatedContext(OTHER_UID, { email: "hacker@example.com", email_verified: true }).firestore();
  const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
  const now = pastDate(5000);

  const validConfig = {
    featureWarranty: true,
    featureDevices: true,
    featureInvoice: true,
    featureHub: true,
    featurePrivacy: true,
    featurePwaPopup: true,
    maintenanceMode: false,
    maintenanceMessage: "",
    announcementActive: true,
    announcementText: "Monsoon sensor checkup live!",
    defaultGstPercent: 18,
    defaultInvoicePalette: "violet",
    defaultTheme: "light",
    updatedByUid: ADMIN_UID,
    createdAt: now,
    updatedAt: now,
  };

  await assertFails(unauthDb.collection("appConfig").doc("global").set({ ...validConfig, updatedByUid: "anon" }));
  await assertFails(aliceDb.collection("appConfig").doc("global").set({ ...validConfig, updatedByUid: ALICE_UID }));
  await assertSucceeds(adminDb.collection("appConfig").doc("global").set(validConfig));
  await assertSucceeds(unauthDb.collection("appConfig").doc("global").get());

  // HubApps: blocks javascript: XSS URL even from admin; public can read, only Admin UID can write
  await assertFails(adminDb.collection("hubApps").doc("xss_app").set({
    name: "Bad Link", category: "Website", desc: "XSS test", url: "javascript:alert(1)", icon: "globe", enabled: true, sortOrder: 1, createdAt: now, updatedAt: now
  }));
  await assertSucceeds(adminDb.collection("hubApps").doc("sellgst_pro").set({
    name: "AgniVolt Billing Suite", category: "New App", desc: "Instant GST billing and inventory suite", url: "https://agnivoltelectronic.example/billing", icon: "bolt", enabled: true, sortOrder: 1, createdAt: now, updatedAt: now
  }));
  await assertSucceeds(unauthDb.collection("hubApps").get());
  await assertFails(aliceDb.collection("hubApps").doc("sellgst_pro").delete());

  // AdminAuditLogs: admin can append/read, NOBODY can update or delete, public cannot read
  await assertSucceeds(adminDb.collection("adminAuditLogs").doc("log_1").set({
    actorUid: ADMIN_UID, actorEmail: ADMIN_EMAIL, eventType: "INVOICE_GENERATED", summary: "Bill INV-2026-1104 saved to Drive", severity: "INFO", createdAt: now
  }));
  await assertFails(unauthDb.collection("adminAuditLogs").doc("log_1").get());
  await assertFails(otherDb.collection("adminAuditLogs").doc("log_1").get());
  await assertFails(adminDb.collection("adminAuditLogs").doc("log_1").update({ summary: "Tampered" }));
  await assertFails(adminDb.collection("adminAuditLogs").doc("log_1").delete());
});

// 4. Smart Customer Reviews (1-5★ in Admin-only private_reviews; strictly 4-5★ zero-phone in public_reviews)
test("Smart Reviews: visitors can submit 1-5★ to private_reviews (Admin-only read) and ONLY 4-5★ without phone to public_reviews", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: "alice@example.com", email_verified: true }).firestore();
  const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
  const now = pastDate(5000);

  // Low rating (2★) allowed in private_reviews for Admin follow-up, but CANNOT be read publicly
  await assertSucceeds(unauthDb.collection("private_reviews").doc("rev_low").set({
    customerName: "Suresh",
    phoneNumber: "9876543210",
    rating: 2,
    message: "Need sensor wire check",
    productName: "AgniVolt Pro Controller",
    status: "SUBMITTED",
    createdAt: now,
  }));

  await assertFails(unauthDb.collection("private_reviews").doc("rev_low").get());
  await assertFails(unauthDb.collection("private_reviews").get());
  await assertFails(aliceDb.collection("private_reviews").get());
  await assertSucceeds(adminDb.collection("private_reviews").get());

  // Public reviews REJECT rating < 4 and REJECT any phoneNumber field
  await assertFails(unauthDb.collection("public_reviews").doc("rev_low").set({
    customerName: "Suresh",
    rating: 3,
    message: "Average experience",
    productName: "AgniVolt Pro Controller",
    verified: false,
    createdAt: now,
  }));
  await assertFails(unauthDb.collection("public_reviews").doc("rev_phone_leak").set({
    customerName: "Anita",
    phoneNumber: "9876543210",
    rating: 5,
    message: "Great product!",
    verified: false,
    createdAt: now,
  }));

  // 5★ review without phoneNumber succeeds publicly and can be queried with rating >= 4
  await assertSucceeds(unauthDb.collection("public_reviews").doc("rev_5star").set({
    customerName: "Anita",
    rating: 5,
    message: "Automatic motor cut-off works flawlessly.",
    productName: "AgniVolt Pro Controller",
    verified: false,
    createdAt: now,
  }));
  await assertSucceeds(unauthDb.collection("public_reviews").where("rating", ">=", 4).get());
  await assertFails(unauthDb.collection("public_reviews").doc("rev_5star").delete());
  await assertSucceeds(adminDb.collection("public_reviews").doc("rev_5star").update({
    customerName: "Anita",
    rating: 5,
    message: "Automatic motor cut-off works flawlessly.",
    productName: "AgniVolt Pro Controller",
    verified: true,
    createdAt: now,
  }));
});

// 5. Dynamic Business Config, Admin Secrets & Write-Only Service Requests
test("BusinessConfig, AdminSecrets & ServiceRequests: public read on businessConfig, strict Admin lock on adminSecrets, write-only service requests", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: "alice@example.com", email_verified: true }).firestore();
  const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
  const now = pastDate(5000);

  const validBusinessConfig = {
    businessName: "AGNI VOLT ELECTRONIC",
    tagline: "Automated Water Level Controller & Smart Pump Protection",
    aboutText: "Precision water automation systems engineered for Indian homes and apartments.",
    address: "Industrial Area, Phase 2",
    email: "support@agnivoltelectronic.in",
    gstin: "",
    businessPhone: "+91 90000 00001",
    personalPhone: "+91 90000 00002",
    whatsappNumber: "919000000001",
    googleMapsUrl: "https://maps.google.com/?q=Agni+Volt+Electronic",
    googleRating: 4.9,
    googleReviewCount: "140+ Google Reviews",
    googleReviewLink: "https://maps.google.com/?q=Agni+Volt+Electronic",
    websiteUrl: "https://agnivoltelectronic.in",
    instagramUrl: "",
    facebookUrl: "",
    youtubeUrl: "",
    products: [{ id: "wlc_pro", name: "AgniVolt Pro Controller", price: 3499 }],
    updatedByUid: ADMIN_UID,
    updatedAt: now,
  };

  await assertFails(unauthDb.collection("businessConfig").doc("main").set({ ...validBusinessConfig, updatedByUid: "anon" }));
  await assertFails(aliceDb.collection("businessConfig").doc("main").set({ ...validBusinessConfig, updatedByUid: ALICE_UID }));
  await assertFails(adminDb.collection("businessConfig").doc("main").set({ ...validBusinessConfig, googleMapsUrl: "javascript:alert(1)" }));
  await assertSucceeds(adminDb.collection("businessConfig").doc("main").set(validBusinessConfig));
  await assertSucceeds(unauthDb.collection("businessConfig").doc("main").get());

  // AdminSecrets: strictly Admin-only read & write
  await assertFails(unauthDb.collection("adminSecrets").doc("googleDrive").set({ driveWebhookUrl: "https://script.google.com/macros/s/abc/exec" }));
  await assertFails(aliceDb.collection("adminSecrets").doc("googleDrive").set({ driveWebhookUrl: "https://script.google.com/macros/s/abc/exec" }));
  await assertSucceeds(adminDb.collection("adminSecrets").doc("googleDrive").set({ driveWebhookUrl: "https://script.google.com/macros/s/abc/exec", updatedAt: now }));
  await assertFails(unauthDb.collection("adminSecrets").doc("googleDrive").get());
  await assertFails(aliceDb.collection("adminSecrets").doc("googleDrive").get());
  await assertSucceeds(adminDb.collection("adminSecrets").doc("googleDrive").get());

  // Public Service Requests: write-only by visitors, read/manage Admin-only
  await assertSucceeds(unauthDb.collection("private_service_requests").doc("srv_1").set({
    ticketNumber: "SRV-AV-402",
    unitId: "cust_1",
    unitName: "AgniVolt Pro",
    issue: "Sensor Probe Check",
    notes: "Overhead tank high sensor checkup",
    contactPhone: "9876543210",
    status: "Logged",
    createdAt: now,
  }));
  await assertFails(unauthDb.collection("private_service_requests").get());
  await assertFails(aliceDb.collection("private_service_requests").get());
  await assertSucceeds(adminDb.collection("private_service_requests").get());
});
