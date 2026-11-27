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
const ADMIN_UID = "admin_primary_999";
const OTHER_UID = "other_user_666";
const ADMIN_EMAIL = "YOUR_ADMIN_EMAIL@gmail.com";

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

// 1. Customer Profile Rules
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
  await assertFails(aliceDb.collection("users").get()); // list on /users denied
  await assertFails(unauthDb.collection("users").get()); // list on /users denied for unauth
  const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
  await assertFails(adminDb.collection("users").get()); // root /users listing blocked globally (allow list: if false)

  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).update({
      darkModeEnabled: true,
      gmailSyncEnabled: false,
      updatedAt: pastDate(1000),
    })
  );

  // Reject ghost field / shadow update
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).update({
      isAdmin: true,
      updatedAt: pastDate(500),
    })
  );

  // Reject immutable createdAt mutation
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).update({
      createdAt: pastDate(500),
      updatedAt: pastDate(500),
    })
  );

  // Reject future timestamp
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).update({
      darkModeEnabled: false,
      updatedAt: futureDate(),
    })
  );
});

// 2. WarrantyUnit Rules (Owner + Verified Admin)
test("WarrantyUnit: owner CRUD succeeds; cross-user denied; verified admin can extend warranty", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: "alice@example.com", email_verified: true }).firestore();
  const bobDb = testEnv.authenticatedContext(BOB_UID, { email: "bob@example.com", email_verified: true }).firestore();
  const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
  const created = pastDate(10000);

  const validWarranty = {
    userId: ALICE_UID,
    deviceType: "WATER_LEVEL_CONTROLLER",
    productName: "AquaVault Pro-X7 Controller",
    modelCode: "AV-WLC-X7",
    serialNumber: "AV26-WLC-009481",
    locationTag: "Overhead Tank",
    installEpochDay: 20500,
    warrantyTotalDays: 365,
    unitStatus: "ONLINE",
    invoiceNumber: "INV-AQV-2026-4412",
    purchaseAmountInr: 14500,
    gstAmountInr: 2610,
    dealerName: "AquaVault Flagship India",
    createdAt: created,
    updatedAt: created,
  };

  await assertSucceeds(aliceDb.collection("users").doc(ALICE_UID).collection("warranties").get());
  await assertSucceeds(aliceDb.collection("users").doc(ALICE_UID).collection("warranties").doc("unit_1").set(validWarranty));

  // Reject @DocumentId "id" key and invalid enum
  await assertFails(aliceDb.collection("users").doc(ALICE_UID).collection("warranties").doc("unit_bad_id").set({ ...validWarranty, id: "unit_bad_id" }));
  await assertFails(aliceDb.collection("users").doc(ALICE_UID).collection("warranties").doc("unit_bad_enum").set({ ...validWarranty, deviceType: "PUMP_UNKNOWN" }));

  // Cross-user read & write denied
  await assertFails(bobDb.collection("users").doc(ALICE_UID).collection("warranties").get());
  await assertFails(bobDb.collection("users").doc(ALICE_UID).collection("warranties").doc("unit_1").get());
  await assertFails(bobDb.collection("users").doc(ALICE_UID).collection("warranties").doc("unit_1").update({ locationTag: "Hijacked", updatedAt: pastDate(1000) }));

  // Customer cannot extend own warrantyTotalDays (only locationTag/unitStatus)
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).collection("warranties").doc("unit_1").update({
      warrantyTotalDays: 730,
      updatedAt: pastDate(1000),
    })
  );

  // Verified Admin CAN extend warrantyTotalDays
  await assertSucceeds(
    adminDb.collection("users").doc(ALICE_UID).collection("warranties").doc("unit_1").update({
      warrantyTotalDays: 730,
      updatedAt: pastDate(1000),
    })
  );
});

// 3. ServiceRequest Rules (Terminal State Locking + Verified Admin Override)
test("ServiceRequest: terminal RESOLVED locks customer edits, verified admin can reopen/update", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: "alice@example.com", email_verified: true }).firestore();
  const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
  const created = pastDate(10000);

  const validRequest = {
    userId: ALICE_UID,
    ticketNumber: "SRV-84920",
    warrantyId: "unit_1",
    deviceLabel: "AquaVault Pro-X7 (Overhead Tank)",
    issueCategory: "Sensor Calibration",
    issueNote: "Tank full alert chimes slightly early at 92%.",
    preferredSlot: "Morning (9 AM - 12 PM)",
    status: "LOGGED",
    createdAt: created,
    updatedAt: created,
  };

  await assertFails(aliceDb.collection("users").doc(ALICE_UID).collection("serviceRequests").doc("req_bad").set({ ...validRequest, status: "RESOLVED" }));
  await assertSucceeds(aliceDb.collection("users").doc(ALICE_UID).collection("serviceRequests").doc("req_1").set(validRequest));
  await assertSucceeds(aliceDb.collection("users").doc(ALICE_UID).collection("serviceRequests").doc("req_1").update({ status: "RESOLVED", updatedAt: pastDate(2000) }));

  // Customer cannot edit after RESOLVED
  await assertFails(aliceDb.collection("users").doc(ALICE_UID).collection("serviceRequests").doc("req_1").update({ status: "LOGGED", updatedAt: pastDate(500) }));

  // Verified Admin CAN override terminal state if needed
  await assertSucceeds(adminDb.collection("users").doc(ALICE_UID).collection("serviceRequests").doc("req_1").update({ status: "SCHEDULED", updatedAt: pastDate(400) }));
});

// 4. Strict Admin Email RBAC: Admin Collections (/admins, /appConfig, /hubApps, /adminAuditLogs)
test("Strict Anti-Hacker Rules: blocks non-admin read/write on admin collections, javascript URLs, and audit log tampering", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: "alice@example.com", email_verified: true }).firestore();
  const otherDb = testEnv.authenticatedContext(OTHER_UID, { email: "hacker@example.com", email_verified: true }).firestore();
  const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
  const now = pastDate(5000);

  const validConfig = {
    featureWarranty: true,
    featureDevices: true,
    featureCalculator: true,
    featureInvoice: true,
    featureNotes: true,
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

  // Unauthenticated and non-admin users must fail on /appConfig create/write
  await assertFails(unauthDb.collection("appConfig").doc("global").set({ ...validConfig, updatedByUid: "anon" }));
  await assertFails(aliceDb.collection("appConfig").doc("global").set({ ...validConfig, updatedByUid: ALICE_UID }));
  await assertFails(otherDb.collection("appConfig").doc("global").set({ ...validConfig, updatedByUid: OTHER_UID }));

  // Admin succeeds on /appConfig create, read & update
  await assertSucceeds(adminDb.collection("appConfig").doc("global").set(validConfig));
  await assertSucceeds(adminDb.collection("appConfig").doc("global").get());
  await assertSucceeds(adminDb.collection("appConfig").doc("global").update({ maintenanceMode: true, updatedAt: pastDate(1000) }));

  // Unauthenticated & non-admin users CANNOT read or list /appConfig
  await assertFails(unauthDb.collection("appConfig").doc("global").get());
  await assertFails(aliceDb.collection("appConfig").doc("global").get());
  await assertFails(aliceDb.collection("appConfig").get());

  // Self-promotion to /admins/{uid} strictly denied for customers & non-admins
  await assertFails(aliceDb.collection("admins").doc(ALICE_UID).set({
    uid: ALICE_UID, email: "alice@example.com", role: "SUPER_ADMIN", active: true, createdAt: now, updatedAt: now
  }));
  await assertFails(otherDb.collection("admins").doc(OTHER_UID).set({
    uid: OTHER_UID, email: "hacker@example.com", role: "SUPER_ADMIN", active: true, createdAt: now, updatedAt: now
  }));
  await assertSucceeds(adminDb.collection("admins").doc(ADMIN_UID).set({
    uid: ADMIN_UID, email: ADMIN_EMAIL, role: "SUPER_ADMIN", active: true, createdAt: now, updatedAt: now
  }));

  // HubApps: blocks javascript: XSS URL even from admin; only admin email can read & write
  await assertFails(adminDb.collection("hubApps").doc("xss_app").set({
    name: "Bad Link", category: "Website", desc: "XSS test", url: "javascript:alert(1)", icon: "globe", enabled: true, sortOrder: 1, createdAt: now, updatedAt: now
  }));
  await assertSucceeds(adminDb.collection("hubApps").doc("store_1").set({
    name: "AquaVault Store", category: "Website", desc: "Official hardware store", url: "https://aquavault.in", icon: "globe", enabled: true, sortOrder: 1, createdAt: now, updatedAt: now
  }));
  await assertSucceeds(adminDb.collection("hubApps").get());
  await assertFails(unauthDb.collection("hubApps").get());
  await assertFails(aliceDb.collection("hubApps").get());
  await assertFails(aliceDb.collection("hubApps").doc("store_1").delete());

  // AdminAuditLogs: admin can append/read, NOBODY can update or delete, customers cannot read
  await assertSucceeds(adminDb.collection("adminAuditLogs").doc("log_1").set({
    actorUid: ADMIN_UID, actorEmail: ADMIN_EMAIL, eventType: "LOGIN_VERIFIED", summary: "Firebase Admin login passed", severity: "INFO", createdAt: now
  }));
  await assertFails(unauthDb.collection("adminAuditLogs").doc("log_1").get());
  await assertFails(aliceDb.collection("adminAuditLogs").doc("log_1").get());
  await assertFails(adminDb.collection("adminAuditLogs").doc("log_1").update({ summary: "Tampered" }));
  await assertFails(adminDb.collection("adminAuditLogs").doc("log_1").delete());
});

// 5. Invoices, CalcEntry, PersonalNote & PrivacyAuditLog Rules
test("Invoices, CalcEntry, PersonalNote, and PrivacyAuditLog: strict schema & ownership enforced", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: "alice@example.com", email_verified: true }).firestore();
  const bobDb = testEnv.authenticatedContext(BOB_UID, { email: "bob@example.com", email_verified: true }).firestore();
  const created = pastDate(10000);

  // InvoiceRecord
  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("invoices").doc("inv_101").set({
      userId: ALICE_UID,
      invoiceNo: "INV-AQV-2026-0101",
      clientName: "Aarav Sharma",
      grandTotal: 16366.6,
      status: "PAID",
      palette: "violet",
      invoiceDate: "2026-11-27",
      dueDate: "2026-12-11",
      createdAt: created,
      updatedAt: created,
    })
  );
  await assertFails(bobDb.collection("users").doc(ALICE_UID).collection("invoices").doc("inv_101").get());

  // CalcEntry
  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("calcEntries").doc("calc_1").set({
      userId: ALICE_UID,
      label: "Plumbing pipes 12x450",
      expression: "12 × 450",
      resultValue: 5400,
      resultFormatted: "₹5,400.00",
      mode: "QTY_RATE",
      createdAt: created,
      updatedAt: created,
    })
  );
  await assertSucceeds(aliceDb.collection("users").doc(ALICE_UID).collection("calcEntries").get());
  await assertFails(bobDb.collection("users").doc(ALICE_UID).collection("calcEntries").get());

  // PersonalNote
  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("notes").doc("note_1").set({
      userId: ALICE_UID,
      title: "Overhead Tank Cleaning Schedule",
      content: "Next UV flush scheduled for December 15.",
      tag: "Maintenance",
      pinned: true,
      gmailSyncState: "SYNCED",
      driveSyncState: "AUTO_SAVED",
      lastSyncedLabel: "Synced just now",
      createdAt: created,
      updatedAt: created,
    })
  );
  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("notes").doc("note_1").update({
      title: "Overhead Tank Cleaning Schedule (Updated)",
      pinned: false,
      updatedAt: pastDate(1000),
    })
  );
  await assertFails(bobDb.collection("users").doc(ALICE_UID).collection("notes").doc("note_1").get());

  // PrivacyAuditLog (append-only)
  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("privacyRequests").doc("priv_1").set({
      userId: ALICE_UID,
      actionType: "CONSENT_GRANTED",
      details: "Accepted DPDP Act Notice v2026.1",
      createdAt: created,
      updatedAt: created,
    })
  );
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).collection("privacyRequests").doc("priv_1").update({
      details: "Tampered log",
      updatedAt: pastDate(500),
    })
  );
});
