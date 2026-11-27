package com.example.ui

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.AddToDrive
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.CloudDone
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.Email
import androidx.compose.material.icons.rounded.PushPin
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Sync
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.data.CustomerProfile
import com.example.data.DefaultCloudNoteSyncGateway
import com.example.data.PersonalNote
import com.example.data.formatTimestamp
import com.example.ui.theme.LocalAquaVaultColors

private val NOTE_TAGS = listOf("All", "Pinned", "Maintenance", "Hisab", "Personal", "Plumbing")
private val EDITOR_TAGS = listOf("Personal", "Maintenance", "Hisab", "Plumbing", "Warranty")

@Composable
fun NotepadScreen(
    profile: CustomerProfile?,
    notes: List<PersonalNote>,
    isBusy: Boolean,
    onUpdateSyncPrefs: (Boolean, Boolean) -> Unit,
    onSaveNote: (String?, String, String, String, Boolean, Boolean, Boolean, (String) -> Unit) -> Unit,
    onTogglePin: (PersonalNote) -> Unit,
    onDeleteNote: (String) -> Unit,
    onFeedback: (String) -> Unit,
) {
    val colors = LocalAquaVaultColors.current
    val context = LocalContext.current
    val syncGateway = remember { DefaultCloudNoteSyncGateway() }

    val gmailEnabled = profile?.gmailSyncEnabled ?: true
    val driveEnabled = profile?.driveAutoSaveEnabled ?: true
    val userEmail = profile?.email?.ifBlank { "Google Account" } ?: "Google Account"

    var searchQuery by remember { mutableStateOf("") }
    var activeFilter by remember { mutableStateOf("All") }
    var editingNote by remember { mutableStateOf<PersonalNote?>(null) }
    var showEditor by remember { mutableStateOf(false) }

    // Pending note export via Android Storage Access Framework (Google Drive / Files)
    var notePendingDriveExport by remember { mutableStateOf<PersonalNote?>(null) }
    val driveExportLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.CreateDocument("text/plain")
    ) { uri: Uri? ->
        val noteToSave = notePendingDriveExport
        notePendingDriveExport = null
        if (uri != null && noteToSave != null) {
            try {
                val payload = syncGateway.buildDriveDocumentBody(noteToSave, userEmail)
                context.contentResolver.openOutputStream(uri)?.use { stream ->
                    stream.write(payload.toByteArray(Charsets.UTF_8))
                }
                onFeedback("Saved \"${noteToSave.title}\" to Google Drive / Files.")
            } catch (e: Exception) {
                onFeedback("Could not write file: ${e.localizedMessage ?: "Storage error"}")
            }
        }
    }

    val filteredNotes = remember(notes, searchQuery, activeFilter) {
        notes.filter { note ->
            val matchesFilter = when (activeFilter) {
                "All" -> true
                "Pinned" -> note.pinned
                else -> note.tag.equals(activeFilter, ignoreCase = true)
            }
            val q = searchQuery.trim()
            val matchesQuery = q.isEmpty() ||
                note.title.contains(q, ignoreCase = true) ||
                note.content.contains(q, ignoreCase = true) ||
                note.tag.contains(q, ignoreCase = true)
            matchesFilter && matchesQuery
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .testTag("notepad_screen"),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        // Cloud, Gmail Sync & Google Drive Auto-Save Hub Card
        item(key = "sync_hub_card") {
            AquaCard(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.weight(1f),
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(colors.statusActiveBg),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.CloudDone,
                                contentDescription = "Cloud Sync Active",
                                tint = colors.statusActive,
                                modifier = Modifier.size(22.dp),
                            )
                        }
                        Column {
                            Text(
                                text = "Google Cloud Auto-Sync",
                                style = MaterialTheme.typography.titleMedium,
                                color = colors.textPrimary,
                            )
                            Text(
                                text = userEmail,
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.textSecondary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                    }
                    StatusPill(
                        label = "Synced Now",
                        textColor = colors.statusActive,
                        backgroundColor = colors.statusActiveBg,
                    )
                }

                Spacer(Modifier.height(14.dp))

                // Gmail Sync Toggle Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.weight(1f),
                    ) {
                        Icon(Icons.Rounded.Email, contentDescription = null, tint = colors.brandPrimary, modifier = Modifier.size(18.dp))
                        Column {
                            Text("Gmail Sync & Instant Backup", style = MaterialTheme.typography.titleSmall, color = colors.textPrimary)
                            Text(
                                text = if (gmailEnabled) "Synced with Gmail • 1-tap mail backup ready" else "Paused — notes stay in private cloud & offline",
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.textSecondary,
                            )
                        }
                    }
                    Switch(
                        checked = gmailEnabled,
                        onCheckedChange = { onUpdateSyncPrefs(it, driveEnabled) },
                        modifier = Modifier.testTag("toggle_gmail_sync"),
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color.White,
                            checkedTrackColor = colors.brandPrimary,
                        ),
                    )
                }

                Spacer(Modifier.height(8.dp))

                // Google Drive Auto-Save Toggle Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.weight(1f),
                    ) {
                        Icon(Icons.Rounded.AddToDrive, contentDescription = null, tint = colors.brandPrimary, modifier = Modifier.size(18.dp))
                        Column {
                            Text("Google Drive Auto-Save", style = MaterialTheme.typography.titleSmall, color = colors.textPrimary)
                            Text(
                                text = if (driveEnabled) "Auto-Saved to Cloud + 1-tap Drive export" else "Offline-first local persistence active",
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.textSecondary,
                            )
                        }
                    }
                    Switch(
                        checked = driveEnabled,
                        onCheckedChange = { onUpdateSyncPrefs(gmailEnabled, it) },
                        modifier = Modifier.testTag("toggle_drive_autosave"),
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color.White,
                            checkedTrackColor = colors.brandPrimary,
                        ),
                    )
                }
            }
        }

        // New Note Button + Search Field
        item(key = "note_actions") {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search notes, tags...") },
                    leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null, tint = colors.textSecondary) },
                    singleLine = true,
                    modifier = Modifier
                        .weight(1f)
                        .testTag("notepad_search_input"),
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = colors.brandPrimary,
                        unfocusedBorderColor = colors.cardBorder,
                        focusedTextColor = colors.textPrimary,
                        unfocusedTextColor = colors.textPrimary,
                    ),
                )
                Button(
                    onClick = {
                        editingNote = null
                        showEditor = true
                    },
                    modifier = Modifier
                        .height(54.dp)
                        .testTag("notepad_new_note_button"),
                    colors = ButtonDefaults.buttonColors(containerColor = colors.brandPrimary),
                    shape = RoundedCornerShape(14.dp),
                    contentPadding = PaddingValues(horizontal = 14.dp),
                ) {
                    Icon(Icons.Rounded.Add, contentDescription = "Create new note", modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("New")
                }
            }
        }

        // Filter Chips
        item(key = "note_filters") {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(NOTE_TAGS) { tag ->
                    val selected = activeFilter == tag
                    FilterChip(
                        selected = selected,
                        onClick = { activeFilter = tag },
                        label = { Text(tag) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = colors.brandPrimary,
                            selectedLabelColor = Color.White,
                            containerColor = colors.elevatedSurface,
                            labelColor = colors.textPrimary,
                        ),
                    )
                }
            }
        }

        // Notes List
        if (filteredNotes.isEmpty()) {
            item(key = "notes_empty") {
                AquaCard(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = if (notes.isEmpty()) "Start your personal synced notepad" else "No matching notes found",
                        style = MaterialTheme.typography.titleMedium,
                        color = colors.textPrimary,
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "Write maintenance logs, plumber contacts, or daily reminders. Every draft auto-saves to your cloud account and remains accessible offline.",
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.textSecondary,
                    )
                }
            }
        } else {
            items(filteredNotes, key = { it.id }) { note ->
                AquaCard(
                    onClick = {
                        editingNote = note
                        showEditor = true
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("note_card_${note.id}"),
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.weight(1f),
                        ) {
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = colors.brandTint,
                            ) {
                                Text(
                                    text = note.tag,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = colors.brandPrimary,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                )
                            }
                            Text(
                                text = note.lastSyncedLabel.ifBlank { "Auto-Saved" },
                                style = MaterialTheme.typography.labelSmall,
                                color = colors.statusActive,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                        Row {
                            IconButton(onClick = { onTogglePin(note) }) {
                                Icon(
                                    imageVector = Icons.Rounded.PushPin,
                                    contentDescription = if (note.pinned) "Unpin note" else "Pin note",
                                    tint = if (note.pinned) colors.brandPrimary else colors.textSecondary,
                                    modifier = Modifier.size(19.dp),
                                )
                            }
                            IconButton(onClick = { onDeleteNote(note.id) }) {
                                Icon(
                                    imageVector = Icons.Rounded.DeleteOutline,
                                    contentDescription = "Delete note",
                                    tint = colors.textSecondary,
                                    modifier = Modifier.size(19.dp),
                                )
                            }
                        }
                    }

                    Text(
                        text = note.title,
                        style = MaterialTheme.typography.titleMedium,
                        color = colors.textPrimary,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                    if (note.content.isNotBlank()) {
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = note.content,
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.textSecondary,
                            maxLines = 3,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }

                    Spacer(Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = formatTimestamp(note.updatedAt ?: note.createdAt),
                            style = MaterialTheme.typography.labelSmall,
                            color = colors.textSecondary,
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Surface(
                                onClick = {
                                    sendNoteToGmail(context, note, userEmail, syncGateway, onFeedback)
                                },
                                shape = RoundedCornerShape(10.dp),
                                color = colors.subtleSurface,
                                border = BorderStroke(1.dp, colors.cardBorder),
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                                ) {
                                    Icon(Icons.Rounded.Email, contentDescription = null, tint = colors.brandPrimary, modifier = Modifier.size(14.dp))
                                    Text("Gmail", style = MaterialTheme.typography.labelSmall, color = colors.textPrimary)
                                }
                            }
                            Surface(
                                onClick = {
                                    notePendingDriveExport = note
                                    val safeFile = note.title.replace(Regex("[^a-zA-Z0-9_\\-]"), "_").take(36)
                                    driveExportLauncher.launch("${safeFile.ifBlank { "AquaVault_Note" }}.txt")
                                },
                                shape = RoundedCornerShape(10.dp),
                                color = colors.subtleSurface,
                                border = BorderStroke(1.dp, colors.cardBorder),
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                                ) {
                                    Icon(Icons.Rounded.AddToDrive, contentDescription = null, tint = colors.brandPrimary, modifier = Modifier.size(14.dp))
                                    Text("Drive", style = MaterialTheme.typography.labelSmall, color = colors.textPrimary)
                                }
                            }
                        }
                    }
                }
            }
        }

        item { Spacer(Modifier.height(12.dp)) }
    }

    if (showEditor) {
        NoteEditorDialog(
            initial = editingNote,
            gmailEnabled = gmailEnabled,
            driveEnabled = driveEnabled,
            isBusy = isBusy,
            onDismiss = { showEditor = false },
            onSave = { title, content, tag, pinned ->
                onSaveNote(
                    editingNote?.id,
                    title,
                    content,
                    tag,
                    pinned,
                    gmailEnabled,
                    driveEnabled,
                ) {
                    showEditor = false
                }
            },
        )
    }
}

@Composable
private fun NoteEditorDialog(
    initial: PersonalNote?,
    gmailEnabled: Boolean,
    driveEnabled: Boolean,
    isBusy: Boolean,
    onDismiss: () -> Unit,
    onSave: (String, String, String, Boolean) -> Unit,
) {
    val colors = LocalAquaVaultColors.current
    var title by remember(initial) { mutableStateOf(initial?.title ?: "") }
    var content by remember(initial) { mutableStateOf(initial?.content ?: "") }
    var selectedTag by remember(initial) { mutableStateOf(initial?.tag?.ifBlank { "Personal" } ?: "Personal") }
    var pinned by remember(initial) { mutableStateOf(initial?.pinned ?: false) }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false),
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.94f)
                .padding(vertical = 20.dp),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = colors.elevatedSurface),
            border = BorderStroke(1.dp, colors.cardBorder),
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Rounded.Sync, contentDescription = null, tint = colors.brandPrimary, modifier = Modifier.size(20.dp))
                        Text(
                            text = if (initial == null) "New Synced Note" else "Edit Note",
                            style = MaterialTheme.typography.titleLarge,
                            color = colors.textPrimary,
                        )
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Rounded.Close, contentDescription = "Close editor", tint = colors.textSecondary)
                    }
                }

                OutlinedTextField(
                    value = title,
                    onValueChange = { if (it.length <= 150) title = it },
                    label = { Text("Note Title") },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("note_editor_title"),
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = colors.brandPrimary,
                        unfocusedBorderColor = colors.cardBorder,
                        focusedTextColor = colors.textPrimary,
                        unfocusedTextColor = colors.textPrimary,
                    ),
                )

                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(EDITOR_TAGS) { tag ->
                        FilterChip(
                            selected = selectedTag == tag,
                            onClick = { selectedTag = tag },
                            label = { Text(tag) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = colors.brandPrimary,
                                selectedLabelColor = Color.White,
                                containerColor = colors.subtleSurface,
                                labelColor = colors.textPrimary,
                            ),
                        )
                    }
                }

                OutlinedTextField(
                    value = content,
                    onValueChange = { if (it.length <= 20000) content = it },
                    label = { Text("Write freely...") },
                    minLines = 6,
                    maxLines = 10,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("note_editor_content"),
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = colors.brandPrimary,
                        unfocusedBorderColor = colors.cardBorder,
                        focusedTextColor = colors.textPrimary,
                        unfocusedTextColor = colors.textPrimary,
                    ),
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = if (gmailEnabled && driveEnabled) "Auto-syncs to Cloud, Gmail & Drive" else "Saves securely with offline fallback",
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.statusActive,
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Pin", style = MaterialTheme.typography.labelLarge, color = colors.textPrimary)
                        Spacer(Modifier.width(6.dp))
                        Switch(
                            checked = pinned,
                            onCheckedChange = { pinned = it },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color.White,
                                checkedTrackColor = colors.brandPrimary,
                            ),
                        )
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(14.dp),
                        border = BorderStroke(1.dp, colors.cardBorder),
                    ) {
                        Text("Cancel", color = colors.textPrimary)
                    }
                    Button(
                        onClick = {
                            if (title.trim().isNotEmpty()) {
                                onSave(title.trim(), content, selectedTag, pinned)
                            }
                        },
                        enabled = !isBusy && title.trim().isNotEmpty(),
                        modifier = Modifier
                            .weight(1f)
                            .testTag("note_editor_save_btn"),
                        colors = ButtonDefaults.buttonColors(containerColor = colors.brandPrimary),
                        shape = RoundedCornerShape(14.dp),
                    ) {
                        Text(if (isBusy) "Saving..." else "Save & Sync")
                    }
                }
            }
        }
    }
}

private fun sendNoteToGmail(
    context: Context,
    note: PersonalNote,
    userEmail: String,
    gateway: DefaultCloudNoteSyncGateway,
    onFeedback: (String) -> Unit,
) {
    try {
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            if (userEmail.contains("@")) {
                putExtra(Intent.EXTRA_EMAIL, arrayOf(userEmail))
            }
            putExtra(Intent.EXTRA_SUBJECT, gateway.buildGmailSubject(note))
            putExtra(Intent.EXTRA_TEXT, gateway.buildDriveDocumentBody(note, userEmail))
        }
        context.startActivity(Intent.createChooser(intent, "Sync / Send Note via Gmail"))
    } catch (_: Exception) {
        onFeedback("No email app found to launch Gmail sync.")
    }
}
