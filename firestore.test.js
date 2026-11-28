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
    modelName: "AquaVault Pro-X7 Dual Tank Controller",
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

  // Admin CAN write to public_units
  await assertSucceeds(adminDb.collection("public_units").doc("cust_1").set(validPublicUnit));

  // Even Admin CANNOT accidentally write mobileNumber or address into public_units
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
    modelName: "AquaVault Pro-X7 Dual Tank Controller",
    hardwareType: "Water Level Controller",
    quantity: 2,
    serialNumber: "AV-WLC-88412",
    installDate: "2026-04-01",
    expiryDate: "2027-04-01",
    warrantyDays: 365,
    basePrice: 8450,
    gstRate: 18,
    invoiceNo: "INV-AQV-2026-1104",
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
    invoiceNo: "INV-AQV-2026-1104",
    customerId: "cust_1",
    customerName: "Rajesh Verma",
    mobileNumber: "+91 98765 43210",
    address: "Indiranagar, Bengaluru",
    modelName: "AquaVault Pro-X7 Dual Tank Controller",
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
    displayName: "Ritik Raj",
    email: "alice@example.com",
    customerCode: "AQV-2026-8419",
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
    name: "SellGst-Pro Billing Suite", category: "New App", desc: "Instant GST billing and inventory suite", url: "https://ritikraj3405328-web.github.io/SellGst-Pro/", icon: "bolt", enabled: true, sortOrder: 1, createdAt: now, updatedAt: now
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
