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
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const bobDb = testEnv.authenticatedContext(BOB_UID).firestore();
  const created = pastDate(10000);

  const validProfile = {
    userId: ALICE_UID,
    displayName: "Ritik Raj",
    email: "ritik@example.com",
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
  await assertFails(aliceDb.collection("users").get()); // list on /users is strictly denied

  // Valid partial update (Day/Night toggle + DPDP consent)
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

// 2. WarrantyUnit Rules
test("WarrantyUnit: owner CRUD & list succeed; cross-user, extra id key, and invalid enums fail", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const bobDb = testEnv.authenticatedContext(BOB_UID).firestore();
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

  // Empty subcollection list must succeed for owner
  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("warranties").get()
  );

  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("warranties").doc("unit_1").set(validWarranty)
  );

  // Reject @DocumentId "id" key inside payload
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).collection("warranties").doc("unit_bad_id").set({
      ...validWarranty,
      id: "unit_bad_id",
    })
  );

  // Reject invalid deviceType enum
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).collection("warranties").doc("unit_bad_enum").set({
      ...validWarranty,
      deviceType: "PUMP_UNKNOWN",
    })
  );

  // Cross-user read & write denied
  await assertFails(
    bobDb.collection("users").doc(ALICE_UID).collection("warranties").get()
  );
  await assertFails(
    bobDb.collection("users").doc(ALICE_UID).collection("warranties").doc("unit_1").get()
  );
  await assertFails(
    bobDb.collection("users").doc(ALICE_UID).collection("warranties").doc("unit_1").update({
      locationTag: "Hijacked",
      updatedAt: pastDate(1000),
    })
  );

  // Allowed partial update
  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("warranties").doc("unit_1").update({
      locationTag: "Terrace Main Overhead Tank",
      unitStatus: "STANDBY",
      updatedAt: pastDate(1000),
    })
  );
});

// 3. ServiceRequest Rules (including Terminal State Locking)
test("ServiceRequest: owner create with LOGGED status succeeds; terminal RESOLVED state locks further edits", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
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

  // Creating directly as RESOLVED must fail
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).collection("serviceRequests").doc("req_bad").set({
      ...validRequest,
      status: "RESOLVED",
    })
  );

  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("serviceRequests").doc("req_1").set(validRequest)
  );

  // Transition to RESOLVED succeeds
  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("serviceRequests").doc("req_1").update({
      status: "RESOLVED",
      updatedAt: pastDate(2000),
    })
  );

  // Updating after RESOLVED must fail (Terminal State Locking)
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).collection("serviceRequests").doc("req_1").update({
      issueNote: "Trying to reopen",
      status: "LOGGED",
      updatedAt: pastDate(500),
    })
  );
});

// 4. CalcEntry (Hisab-Kitab) & PersonalNote & PrivacyAuditLog Rules
test("CalcEntry, PersonalNote, and PrivacyAuditLog: strict schema & ownership enforced", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const bobDb = testEnv.authenticatedContext(BOB_UID).firestore();
  const created = pastDate(10000);

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
  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("calcEntries").get()
  );
  await assertFails(
    bobDb.collection("users").doc(ALICE_UID).collection("calcEntries").get()
  );

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
  await assertFails(
    bobDb.collection("users").doc(ALICE_UID).collection("notes").doc("note_1").get()
  );

  // PrivacyAuditLog (append-only: updates denied)
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
