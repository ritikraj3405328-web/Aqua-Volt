package com.example.data

import android.content.Context
import com.example.R
import com.google.firebase.Firebase
import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.auth
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreException
import com.google.firebase.firestore.snapshots
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await
import kotlin.math.abs

class AquaVaultRepository(
    private val db: FirebaseFirestore,
    private val auth: FirebaseAuth = Firebase.auth,
) {
    constructor(context: Context) : this(
        FirebaseFirestore.getInstance(
            context.applicationContext.getString(R.string.firestore_database_id)
        )
    )

    private val syncGateway: CloudNoteSyncGateway = DefaultCloudNoteSyncGateway()

    private fun requireUserId(): String {
        return auth.currentUser?.uid
            ?: throw IllegalStateException("User must be signed in with Google before accessing Firestore.")
    }

    private fun userDoc(uid: String) = db.collection("users").document(uid)

    fun observeProfile(userId: String): Flow<CustomerProfile?> = flow {
        val uid = requireUserId()
        check(uid == userId) { "Signed-in user mismatch." }
        val path = "users/$uid"
        emitAll(
            userDoc(uid)
                .snapshots()
                .map { snapshot ->
                    if (snapshot.exists()) {
                        snapshot.toObject(
                            CustomerProfile::class.java,
                            DocumentSnapshot.ServerTimestampBehavior.ESTIMATE,
                        )
                    } else {
                        null
                    }
                }
                .catch { error ->
                    logStreamErrorIfActive(error, OperationType.GET, path, uid)
                    throw error
                }
        )
    }

    fun observeWarranties(userId: String): Flow<List<WarrantyUnit>> = flow {
        val uid = requireUserId()
        check(uid == userId) { "Signed-in user mismatch." }
        val path = "users/$uid/warranties"
        emitAll(
            userDoc(uid).collection("warranties")
                .snapshots()
                .map { snap ->
                    snap.toObjects(
                        WarrantyUnit::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE,
                    ).sortedBy { it.installEpochDay }
                }
                .catch { error ->
                    logStreamErrorIfActive(error, OperationType.LIST, path, uid)
                    throw error
                }
        )
    }

    fun observeServiceRequests(userId: String): Flow<List<ServiceRequest>> = flow {
        val uid = requireUserId()
        check(uid == userId) { "Signed-in user mismatch." }
        val path = "users/$uid/serviceRequests"
        emitAll(
            userDoc(uid).collection("serviceRequests")
                .snapshots()
                .map { snap ->
                    snap.toObjects(
                        ServiceRequest::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE,
                    ).sortedByDescending { it.createdAt ?: Timestamp(0, 0) }
                }
                .catch { error ->
                    logStreamErrorIfActive(error, OperationType.LIST, path, uid)
                    throw error
                }
        )
    }

    fun observeCalcEntries(userId: String): Flow<List<CalcEntry>> = flow {
        val uid = requireUserId()
        check(uid == userId) { "Signed-in user mismatch." }
        val path = "users/$uid/calcEntries"
        emitAll(
            userDoc(uid).collection("calcEntries")
                .snapshots()
                .map { snap ->
                    snap.toObjects(
                        CalcEntry::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE,
                    ).sortedByDescending { it.createdAt ?: Timestamp(0, 0) }
                }
                .catch { error ->
                    logStreamErrorIfActive(error, OperationType.LIST, path, uid)
                    throw error
                }
        )
    }

    fun observeNotes(userId: String): Flow<List<PersonalNote>> = flow {
        val uid = requireUserId()
        check(uid == userId) { "Signed-in user mismatch." }
        val path = "users/$uid/notes"
        emitAll(
            userDoc(uid).collection("notes")
                .snapshots()
                .map { snap ->
                    snap.toObjects(
                        PersonalNote::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE,
                    ).sortedWith(
                        compareByDescending<PersonalNote> { it.pinned }
                            .thenByDescending { it.updatedAt ?: it.createdAt ?: Timestamp(0, 0) }
                    )
                }
                .catch { error ->
                    logStreamErrorIfActive(error, OperationType.LIST, path, uid)
                    throw error
                }
        )
    }

    fun observePrivacyLogs(userId: String): Flow<List<PrivacyAuditLog>> = flow {
        val uid = requireUserId()
        check(uid == userId) { "Signed-in user mismatch." }
        val path = "users/$uid/privacyRequests"
        emitAll(
            userDoc(uid).collection("privacyRequests")
                .snapshots()
                .map { snap ->
                    snap.toObjects(
                        PrivacyAuditLog::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE,
                    ).sortedByDescending { it.createdAt ?: Timestamp(0, 0) }
                }
                .catch { error ->
                    logStreamErrorIfActive(error, OperationType.LIST, path, uid)
                    throw error
                }
        )
    }

    private fun logStreamErrorIfActive(
        error: Throwable,
        operationType: OperationType,
        path: String,
        uid: String,
    ) {
        val firestoreError = generateSequence(error) { it.cause }
            .filterIsInstance<FirebaseFirestoreException>()
            .firstOrNull()
        if (firestoreError == null && error is CancellationException) return
        val toLog = firestoreError ?: (error as? Exception)
        if (toLog != null && auth.currentUser?.uid == uid) {
            handleFirestoreError(toLog, operationType, path)
        }
    }

    /**
     * Initializes customer profile and realistic starter Water Level Controller & Water Stopper
     * warranty records on first sign-in so the customer experience works immediately out of the box.
     */
    suspend fun ensureCustomerInitialized(
        displayName: String,
        email: String,
    ): Result<Unit> {
        var activePath = "users/unauthenticated"
        return try {
            val uid = requireUserId()
            activePath = "users/$uid"
            val profileRef = userDoc(uid)
            val profileSnap = profileRef.get().await()

            val safeName = displayName.trim().ifBlank { "AquaVault Customer" }.take(100)
            val safeEmail = email.trim().take(200)
            val codeSuffix = abs(uid.hashCode() % 9000) + 1000

            if (!profileSnap.exists()) {
                val profilePayload = mapOf(
                    "userId" to uid,
                    "displayName" to safeName,
                    "email" to safeEmail,
                    "customerCode" to "AQV-2026-$codeSuffix",
                    "phone" to "+91 98204 11890",
                    "address" to "Residency Heights, Sector 14, Bengaluru",
                    "darkModeEnabled" to false,
                    "dpdpConsentAccepted" to false,
                    "dpdpConsentVersion" to "2026.1",
                    "gmailSyncEnabled" to true,
                    "driveAutoSaveEnabled" to true,
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp(),
                )
                profileRef.set(profilePayload).await()
            }

            // Seed realistic demo customer warranty records if empty (2 Controllers + 2 Stoppers)
            activePath = "users/$uid/warranties"
            val existingWarranties = userDoc(uid).collection("warranties").get().await()
            if (existingWarranties.isEmpty) {
                val today = currentUtcEpochDay()
                val batch = db.batch()

                val unit1Ref = userDoc(uid).collection("warranties").document("unit_wlc_overhead")
                batch.set(
                    unit1Ref,
                    mapOf(
                        "userId" to uid,
                        "deviceType" to DeviceCategory.WATER_LEVEL_CONTROLLER.firestoreValue,
                        "productName" to "AquaVault Pro-X7 Dual Tank Controller",
                        "modelCode" to "AV-WLC-X7-PRO",
                        "serialNumber" to "AV26-WLC-009481",
                        "locationTag" to "Overhead Tank (Terrace)",
                        "installEpochDay" to (today - 124L),
                        "warrantyTotalDays" to 365L,
                        "unitStatus" to UnitHealthStatus.ONLINE.firestoreValue,
                        "invoiceNumber" to "INV-AQV-2026-4412",
                        "purchaseAmountInr" to 14500.0,
                        "gstAmountInr" to 2610.0,
                        "dealerName" to "AquaVault Flagship India Pvt. Ltd.",
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp(),
                    )
                )

                val unit2Ref = userDoc(uid).collection("warranties").document("unit_wlc_sump")
                batch.set(
                    unit2Ref,
                    mapOf(
                        "userId" to uid,
                        "deviceType" to DeviceCategory.WATER_LEVEL_CONTROLLER.firestoreValue,
                        "productName" to "AquaVault SumpGuard Dry-Run Controller",
                        "modelCode" to "AV-WLC-SG5",
                        "serialNumber" to "AV25-WLC-006319",
                        "locationTag" to "Underground Sump",
                        "installEpochDay" to (today - 332L),
                        "warrantyTotalDays" to 365L,
                        "unitStatus" to UnitHealthStatus.ONLINE.firestoreValue,
                        "invoiceNumber" to "INV-AQV-2025-8820",
                        "purchaseAmountInr" to 11200.0,
                        "gstAmountInr" to 2016.0,
                        "dealerName" to "AquaVault Flagship India Pvt. Ltd.",
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp(),
                    )
                )

                val unit3Ref = userDoc(uid).collection("warranties").document("unit_ws_mainline")
                batch.set(
                    unit3Ref,
                    mapOf(
                        "userId" to uid,
                        "deviceType" to DeviceCategory.WATER_STOPPER.firestoreValue,
                        "productName" to "AquaStop Brass Motorized Auto-Stopper",
                        "modelCode" to "AV-WS-BM2",
                        "serialNumber" to "AV26-WS-014209",
                        "locationTag" to "Main Pump Line",
                        "installEpochDay" to (today - 86L),
                        "warrantyTotalDays" to 730L,
                        "unitStatus" to UnitHealthStatus.STANDBY.firestoreValue,
                        "invoiceNumber" to "INV-AQV-2026-4413",
                        "purchaseAmountInr" to 9800.0,
                        "gstAmountInr" to 1764.0,
                        "dealerName" to "AquaVault Flagship India Pvt. Ltd.",
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp(),
                    )
                )

                val unit4Ref = userDoc(uid).collection("warranties").document("unit_ws_garden")
                batch.set(
                    unit4Ref,
                    mapOf(
                        "userId" to uid,
                        "deviceType" to DeviceCategory.WATER_STOPPER.firestoreValue,
                        "productName" to "AquaStop Zero-Overflow Cutoff Valve",
                        "modelCode" to "AV-WS-ZO1",
                        "serialNumber" to "AV25-WS-003812",
                        "locationTag" to "Utility Balcony Line",
                        "installEpochDay" to (today - 385L),
                        "warrantyTotalDays" to 365L,
                        "unitStatus" to UnitHealthStatus.ATTENTION.firestoreValue,
                        "invoiceNumber" to "INV-AQV-2025-1904",
                        "purchaseAmountInr" to 6400.0,
                        "gstAmountInr" to 1152.0,
                        "dealerName" to "AquaVault Authorized Partner",
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp(),
                    )
                )

                batch.commit().await()
            }

            // Seed one helpful starter note if empty
            activePath = "users/$uid/notes"
            val existingNotes = userDoc(uid).collection("notes").get().await()
            if (existingNotes.isEmpty) {
                userDoc(uid).collection("notes").document("note_welcome_log").set(
                    mapOf(
                        "userId" to uid,
                        "title" to "Tank Probe & Valve Care Log",
                        "content" to "Quarterly SS-316 probe wipe completed for Overhead Tank. Auto-cutoff verified at 100% full mark with zero overflow.",
                        "tag" to "Maintenance",
                        "pinned" to true,
                        "gmailSyncState" to "SYNCED",
                        "driveSyncState" to "AUTO_SAVED",
                        "lastSyncedLabel" to "Auto-saved to Cloud",
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp(),
                    )
                ).await()
            }

            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, activePath)
            Result.failure(e)
        }
    }

    suspend fun updateThemeMode(darkModeEnabled: Boolean): Result<Unit> {
        var path = "users/unauthenticated"
        return try {
            val uid = requireUserId()
            path = "users/$uid"
            userDoc(uid).update(
                mapOf(
                    "darkModeEnabled" to darkModeEnabled,
                    "updatedAt" to FieldValue.serverTimestamp(),
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    suspend fun updateDpdpConsent(accepted: Boolean): Result<Unit> {
        var path = "users/unauthenticated"
        return try {
            val uid = requireUserId()
            path = "users/$uid"
            userDoc(uid).update(
                mapOf(
                    "dpdpConsentAccepted" to accepted,
                    "dpdpConsentVersion" to "2026.1",
                    "updatedAt" to FieldValue.serverTimestamp(),
                )
            ).await()

            logPrivacyAction(
                actionType = if (accepted) "CONSENT_GRANTED" else "CONSENT_WITHDRAWN",
                details = if (accepted) {
                    "Customer granted DPDP Act 2023 processing consent (v2026.1)."
                } else {
                    "Customer withdrew optional DPDP processing consent."
                },
            )
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    suspend fun updateNoteSyncPreferences(
        gmailEnabled: Boolean,
        driveEnabled: Boolean,
    ): Result<Unit> {
        var path = "users/unauthenticated"
        return try {
            val uid = requireUserId()
            path = "users/$uid"
            userDoc(uid).update(
                mapOf(
                    "gmailSyncEnabled" to gmailEnabled,
                    "driveAutoSaveEnabled" to driveEnabled,
                    "updatedAt" to FieldValue.serverTimestamp(),
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    suspend fun submitServiceRequest(
        warranty: WarrantyUnit,
        issueCategory: String,
        issueNote: String,
        preferredSlot: String,
    ): Result<String> {
        var path = "users/unauthenticated/serviceRequests"
        return try {
            val uid = requireUserId()
            val cleanCategory = issueCategory.trim().take(60)
            val cleanNote = issueNote.trim().take(1000)
            val cleanSlot = preferredSlot.trim().take(60)
            require(warranty.id.isNotBlank()) { "Please select an installed unit." }
            require(cleanCategory.isNotEmpty()) { "Issue category is required." }
            require(cleanNote.isNotEmpty()) { "Please add a brief note about the issue." }

            val ticketNumber = "SRV-${(10000..99999).random()}"
            val docRef = userDoc(uid).collection("serviceRequests").document()
            path = docRef.path

            val payload = mapOf(
                "userId" to uid,
                "ticketNumber" to ticketNumber,
                "warrantyId" to warranty.id,
                "deviceLabel" to "${warranty.productName} (${warranty.locationTag})".take(150),
                "issueCategory" to cleanCategory,
                "issueNote" to cleanNote,
                "preferredSlot" to cleanSlot.ifEmpty { "Morning (9 AM - 12 PM)" },
                "status" to "LOGGED",
                "createdAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp(),
            )
            docRef.set(payload).await()
            Result.success(ticketNumber)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    suspend fun resolveServiceRequest(requestId: String): Result<Unit> {
        var path = "users/unauthenticated/serviceRequests/$requestId"
        return try {
            val uid = requireUserId()
            require(requestId.isNotBlank()) { "Request ID cannot be blank." }
            val docRef = userDoc(uid).collection("serviceRequests").document(requestId)
            path = docRef.path
            docRef.update(
                mapOf(
                    "status" to "RESOLVED",
                    "updatedAt" to FieldValue.serverTimestamp(),
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    suspend fun addCalcEntry(
        label: String,
        expression: String,
        resultValue: Double,
        resultFormatted: String,
        mode: CalcMode,
    ): Result<Unit> {
        var path = "users/unauthenticated/calcEntries"
        return try {
            val uid = requireUserId()
            val cleanExpr = expression.trim().take(200)
            val cleanFmt = resultFormatted.trim().take(60)
            require(cleanExpr.isNotEmpty() && cleanFmt.isNotEmpty()) { "Invalid calculation entry." }
            require(resultValue.isFinite() && abs(resultValue) <= 1_000_000_000_000.0) {
                "Calculation out of valid bounds."
            }

            val docRef = userDoc(uid).collection("calcEntries").document()
            path = docRef.path
            docRef.set(
                mapOf(
                    "userId" to uid,
                    "label" to label.trim().take(120),
                    "expression" to cleanExpr,
                    "resultValue" to resultValue,
                    "resultFormatted" to cleanFmt,
                    "mode" to mode.firestoreValue,
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp(),
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    suspend fun deleteCalcEntry(entryId: String): Result<Unit> {
        var path = "users/unauthenticated/calcEntries/$entryId"
        return try {
            val uid = requireUserId()
            require(entryId.isNotBlank())
            val docRef = userDoc(uid).collection("calcEntries").document(entryId)
            path = docRef.path
            docRef.delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, path)
            Result.failure(e)
        }
    }

    suspend fun saveNote(
        existingId: String?,
        title: String,
        content: String,
        tag: String,
        pinned: Boolean,
        gmailEnabled: Boolean,
        driveEnabled: Boolean,
    ): Result<String> {
        var path = "users/unauthenticated/notes"
        return try {
            val uid = requireUserId()
            val cleanTitle = title.trim().take(150)
            val cleanContent = content.take(20000)
            val cleanTag = tag.trim().ifEmpty { "Personal" }.take(40)
            require(cleanTitle.isNotEmpty()) { "Note title cannot be empty." }

            val (gmailState, driveState) = syncGateway.computeSyncState(gmailEnabled, driveEnabled)
            val syncLabel = when {
                gmailEnabled && driveEnabled -> "Synced with Gmail & Drive"
                driveEnabled -> "Auto-Saved to Drive Cloud"
                gmailEnabled -> "Synced with Gmail"
                else -> "Saved Locally & Cloud"
            }

            val notesCol = userDoc(uid).collection("notes")
            if (existingId.isNullOrBlank()) {
                val docRef = notesCol.document()
                path = docRef.path
                docRef.set(
                    mapOf(
                        "userId" to uid,
                        "title" to cleanTitle,
                        "content" to cleanContent,
                        "tag" to cleanTag,
                        "pinned" to pinned,
                        "gmailSyncState" to gmailState,
                        "driveSyncState" to driveState,
                        "lastSyncedLabel" to syncLabel,
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp(),
                    )
                ).await()
                Result.success(docRef.id)
            } else {
                val docRef = notesCol.document(existingId)
                path = docRef.path
                docRef.update(
                    mapOf(
                        "title" to cleanTitle,
                        "content" to cleanContent,
                        "tag" to cleanTag,
                        "pinned" to pinned,
                        "gmailSyncState" to gmailState,
                        "driveSyncState" to driveState,
                        "lastSyncedLabel" to syncLabel,
                        "updatedAt" to FieldValue.serverTimestamp(),
                    )
                ).await()
                Result.success(existingId)
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, if (existingId.isNullOrBlank()) OperationType.CREATE else OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    suspend fun togglePinNote(noteId: String, newPinned: Boolean): Result<Unit> {
        var path = "users/unauthenticated/notes/$noteId"
        return try {
            val uid = requireUserId()
            require(noteId.isNotBlank())
            val docRef = userDoc(uid).collection("notes").document(noteId)
            path = docRef.path
            docRef.update(
                mapOf(
                    "pinned" to newPinned,
                    "updatedAt" to FieldValue.serverTimestamp(),
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    suspend fun deleteNote(noteId: String): Result<Unit> {
        var path = "users/unauthenticated/notes/$noteId"
        return try {
            val uid = requireUserId()
            require(noteId.isNotBlank())
            val docRef = userDoc(uid).collection("notes").document(noteId)
            path = docRef.path
            docRef.delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, path)
            Result.failure(e)
        }
    }

    suspend fun logPrivacyAction(actionType: String, details: String): Result<Unit> {
        var path = "users/unauthenticated/privacyRequests"
        return try {
            val uid = requireUserId()
            val docRef = userDoc(uid).collection("privacyRequests").document()
            path = docRef.path
            docRef.set(
                mapOf(
                    "userId" to uid,
                    "actionType" to actionType,
                    "details" to details.trim().take(500),
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp(),
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    suspend fun requestAccountDataErasure(): Result<Unit> {
        var path = "users/unauthenticated"
        return try {
            val uid = requireUserId()
            path = "users/$uid/notes"
            val notes = userDoc(uid).collection("notes").get().await()
            val calcs = userDoc(uid).collection("calcEntries").get().await()
            val batch = db.batch()
            notes.documents.forEach { batch.delete(it.reference) }
            calcs.documents.forEach { batch.delete(it.reference) }
            batch.commit().await()

            logPrivacyAction(
                actionType = "DELETION_REQUESTED",
                details = "Customer exercised DPDP Right to Erasure: cleared personal notes & calculation tape and queued full account deletion.",
            )
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, path)
            Result.failure(e)
        }
    }
}
