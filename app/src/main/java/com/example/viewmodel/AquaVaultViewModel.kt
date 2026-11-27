package com.example.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.AquaVaultRepository
import com.example.data.CalcEntry
import com.example.data.CalcMode
import com.example.data.CustomerProfile
import com.example.data.PersonalNote
import com.example.data.PrivacyAuditLog
import com.example.data.ServiceRequest
import com.example.data.WarrantyUnit
import com.google.firebase.firestore.FirebaseFirestoreException
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed interface UiState<out T> {
    data object Loading : UiState<Nothing>
    data class Success<T>(val data: T) : UiState<T>
    data class Error(val message: String) : UiState<Nothing>
}

class AquaVaultViewModel(
    private val repository: AquaVaultRepository,
    val currentUserId: String,
    val userDisplayName: String,
    val userEmail: String,
) : ViewModel() {

    private val _selectedWarrantyId = MutableStateFlow<String?>(null)
    val selectedWarrantyId: StateFlow<String?> = _selectedWarrantyId.asStateFlow()

    private val _snackbarMessage = MutableStateFlow<String?>(null)
    val snackbarMessage: StateFlow<String?> = _snackbarMessage.asStateFlow()

    private val _dpdpBannerDismissed = MutableStateFlow(false)
    val dpdpBannerDismissed: StateFlow<Boolean> = _dpdpBannerDismissed.asStateFlow()

    private val _isBusy = MutableStateFlow(false)
    val isBusy: StateFlow<Boolean> = _isBusy.asStateFlow()

    private val _localDarkOverride = MutableStateFlow<Boolean?>(null)
    val localDarkOverride: StateFlow<Boolean?> = _localDarkOverride.asStateFlow()

    val profileState: StateFlow<UiState<CustomerProfile?>> =
        repository.observeProfile(currentUserId).toUiState("profile")

    val warrantiesState: StateFlow<UiState<List<WarrantyUnit>>> =
        repository.observeWarranties(currentUserId).toUiState("warranties")

    val serviceRequestsState: StateFlow<UiState<List<ServiceRequest>>> =
        repository.observeServiceRequests(currentUserId).toUiState("service requests")

    val calcEntriesState: StateFlow<UiState<List<CalcEntry>>> =
        repository.observeCalcEntries(currentUserId).toUiState("calculator entries")

    val notesState: StateFlow<UiState<List<PersonalNote>>> =
        repository.observeNotes(currentUserId).toUiState("personal notes")

    val privacyLogsState: StateFlow<UiState<List<PrivacyAuditLog>>> =
        repository.observePrivacyLogs(currentUserId).toUiState("privacy logs")

    init {
        viewModelScope.launch {
            val result = repository.ensureCustomerInitialized(
                displayName = userDisplayName,
                email = userEmail,
            )
            result.onFailure { err ->
                _snackbarMessage.value = "Sync note: ${err.localizedMessage ?: "Offline cache active"}"
            }
        }
    }

    private fun <T> Flow<T>.toUiState(label: String): StateFlow<UiState<T>> =
        this.map<T, UiState<T>> { UiState.Success(it) }
            .catch { error ->
                val firestoreError = generateSequence(error) { it.cause }
                    .filterIsInstance<FirebaseFirestoreException>()
                    .firstOrNull()
                if (firestoreError == null && error is CancellationException) throw error
                val rootError = firestoreError ?: error
                Log.w(TAG, "Error observing $label", rootError)
                emit(UiState.Error(rootError.localizedMessage ?: "Failed to load $label"))
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MS),
                initialValue = UiState.Loading,
            )

    fun selectWarranty(id: String) {
        _selectedWarrantyId.value = id
    }

    fun dismissDpdpBannerForSession() {
        _dpdpBannerDismissed.value = true
    }

    fun clearSnackbar() {
        _snackbarMessage.value = null
    }

    fun showMessage(message: String) {
        _snackbarMessage.value = message
    }

    fun toggleDarkMode(currentlyDark: Boolean) {
        val next = !currentlyDark
        _localDarkOverride.value = next
        viewModelScope.launch {
            repository.updateThemeMode(next).onFailure {
                _snackbarMessage.value = "Theme changed locally (cloud sync pending)"
            }
        }
    }

    fun setDpdpConsent(accepted: Boolean) {
        viewModelScope.launch {
            _isBusy.value = true
            repository.updateDpdpConsent(accepted)
                .onSuccess {
                    _dpdpBannerDismissed.value = true
                    _snackbarMessage.value = if (accepted) {
                        "DPDP Act consent recorded transparently."
                    } else {
                        "DPDP consent withdrawn and logged."
                    }
                }
                .onFailure {
                    _snackbarMessage.value = it.localizedMessage ?: "Could not update DPDP consent."
                }
            _isBusy.value = false
        }
    }

    fun updateNoteSyncPreferences(gmailEnabled: Boolean, driveEnabled: Boolean) {
        viewModelScope.launch {
            repository.updateNoteSyncPreferences(gmailEnabled, driveEnabled)
                .onSuccess {
                    _snackbarMessage.value = "Cloud sync preferences updated."
                }
                .onFailure {
                    _snackbarMessage.value = it.localizedMessage ?: "Failed to update sync preferences."
                }
        }
    }

    fun submitServiceRequest(
        warranty: WarrantyUnit,
        category: String,
        note: String,
        preferredSlot: String,
        onTicketCreated: (String) -> Unit,
    ) {
        viewModelScope.launch {
            _isBusy.value = true
            repository.submitServiceRequest(warranty, category, note, preferredSlot)
                .onSuccess { ticket ->
                    onTicketCreated(ticket)
                    _snackbarMessage.value = "Service Ticket $ticket logged."
                }
                .onFailure {
                    _snackbarMessage.value = it.localizedMessage ?: "Could not log service request."
                }
            _isBusy.value = false
        }
    }

    fun markServiceResolved(requestId: String) {
        viewModelScope.launch {
            repository.resolveServiceRequest(requestId)
                .onSuccess { _snackbarMessage.value = "Service request marked as Resolved." }
                .onFailure { _snackbarMessage.value = it.localizedMessage ?: "Unable to update ticket." }
        }
    }

    fun saveCalcEntry(
        label: String,
        expression: String,
        resultValue: Double,
        resultFormatted: String,
        mode: CalcMode,
    ) {
        viewModelScope.launch {
            repository.addCalcEntry(label, expression, resultValue, resultFormatted, mode)
                .onSuccess { _snackbarMessage.value = "Saved to Hisab-Kitab tape." }
                .onFailure { _snackbarMessage.value = it.localizedMessage ?: "Could not save calculation." }
        }
    }

    fun deleteCalcEntry(entryId: String) {
        viewModelScope.launch {
            repository.deleteCalcEntry(entryId)
                .onFailure { _snackbarMessage.value = it.localizedMessage ?: "Could not delete entry." }
        }
    }

    fun saveNote(
        existingId: String?,
        title: String,
        content: String,
        tag: String,
        pinned: Boolean,
        gmailEnabled: Boolean,
        driveEnabled: Boolean,
        onSaved: (String) -> Unit = {},
    ) {
        viewModelScope.launch {
            _isBusy.value = true
            repository.saveNote(
                existingId = existingId,
                title = title,
                content = content,
                tag = tag,
                pinned = pinned,
                gmailEnabled = gmailEnabled,
                driveEnabled = driveEnabled,
            ).onSuccess { savedId ->
                onSaved(savedId)
                _snackbarMessage.value = if (driveEnabled) {
                    "Note auto-saved & synced."
                } else {
                    "Note saved to your account."
                }
            }.onFailure {
                _snackbarMessage.value = it.localizedMessage ?: "Could not save note."
            }
            _isBusy.value = false
        }
    }

    fun togglePinNote(note: PersonalNote) {
        viewModelScope.launch {
            repository.togglePinNote(note.id, !note.pinned)
                .onFailure { _snackbarMessage.value = it.localizedMessage ?: "Could not update pin." }
        }
    }

    fun deleteNote(noteId: String) {
        viewModelScope.launch {
            repository.deleteNote(noteId)
                .onSuccess { _snackbarMessage.value = "Note deleted." }
                .onFailure { _snackbarMessage.value = it.localizedMessage ?: "Could not delete note." }
        }
    }

    fun recordDataExport() {
        viewModelScope.launch {
            repository.logPrivacyAction(
                actionType = "DATA_EXPORT",
                details = "Customer exported portable JSON copy of account data under DPDP Act.",
            )
        }
    }

    fun requestDataErasure() {
        viewModelScope.launch {
            _isBusy.value = true
            repository.requestAccountDataErasure()
                .onSuccess {
                    _snackbarMessage.value = "DPDP erasure request logged & personal notes/tape cleared."
                }
                .onFailure {
                    _snackbarMessage.value = it.localizedMessage ?: "Erasure request failed."
                }
            _isBusy.value = false
        }
    }

    private companion object {
        const val TAG = "AquaVaultVM"
        const val STOP_TIMEOUT_MS = 5000L
    }
}
