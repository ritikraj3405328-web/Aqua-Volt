package com.example.ui

import android.content.Intent
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.Logout
import androidx.compose.material.icons.rounded.DarkMode
import androidx.compose.material.icons.rounded.DeleteForever
import androidx.compose.material.icons.rounded.Download
import androidx.compose.material.icons.rounded.GppGood
import androidx.compose.material.icons.rounded.LightMode
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.VerifiedUser
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.unit.dp
import com.example.data.CalcEntry
import com.example.data.CustomerProfile
import com.example.data.PersonalNote
import com.example.data.PrivacyAuditLog
import com.example.data.ServiceRequest
import com.example.data.WarrantyUnit
import com.example.data.formatTimestamp
import com.example.ui.theme.LocalAquaVaultColors
import org.json.JSONArray
import org.json.JSONObject

@Composable
fun PrivacySettingsScreen(
    profile: CustomerProfile?,
    warranties: List<WarrantyUnit>,
    serviceRequests: List<ServiceRequest>,
    calcEntries: List<CalcEntry>,
    notes: List<PersonalNote>,
    privacyLogs: List<PrivacyAuditLog>,
    isDark: Boolean,
    isBusy: Boolean,
    onToggleDarkMode: () -> Unit,
    onSetDpdpConsent: (Boolean) -> Unit,
    onRecordExport: () -> Unit,
    onRequestDeletion: () -> Unit,
    onSignOut: () -> Unit,
) {
    val colors = LocalAquaVaultColors.current
    val context = LocalContext.current
    var showDeletionDialog by remember { mutableStateOf(false) }

    val consentAccepted = profile?.dpdpConsentAccepted ?: false

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .testTag("privacy_settings_screen"),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        // 1-Click Day / Night Theme Switcher Card
        item(key = "theme_card") {
            AquaCard(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.weight(1f),
                    ) {
                        Box(
                            modifier = Modifier
                                .size(42.dp)
                                .clip(CircleShape)
                                .background(colors.brandTint),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(
                                imageVector = if (isDark) Icons.Rounded.DarkMode else Icons.Rounded.LightMode,
                                contentDescription = "Theme Mode",
                                tint = colors.brandPrimary,
                            )
                        }
                        Column {
                            Text(
                                text = if (isDark) "Black + Purple Night Mode" else "White + Purple Day Mode",
                                style = MaterialTheme.typography.titleMedium,
                                color = colors.textPrimary,
                            )
                            Text(
                                text = "1-click switch saved across your account",
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.textSecondary,
                            )
                        }
                    }
                    Switch(
                        checked = isDark,
                        onCheckedChange = { onToggleDarkMode() },
                        modifier = Modifier.testTag("settings_dark_mode_switch"),
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color.White,
                            checkedTrackColor = colors.brandPrimary,
                        ),
                    )
                }
            }
        }

        // DPDP Act 2023 Compliance & Consent Center
        item(key = "dpdp_main_card") {
            AquaCard(modifier = Modifier.fillMaxWidth()) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(colors.brandTint),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Rounded.GppGood, contentDescription = null, tint = colors.brandPrimary)
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "DPDP Act (2023) Privacy Notice",
                            style = MaterialTheme.typography.titleLarge,
                            color = colors.textPrimary,
                        )
                        Text(
                            text = "Digital Personal Data Protection Act • India",
                            style = MaterialTheme.typography.labelSmall,
                            color = colors.brandPrimary,
                        )
                    }
                }

                Spacer(Modifier.height(14.dp))

                PrivacyPurposeItem(
                    title = "1. Purpose of Data Collection",
                    body = "Your Google email, hardware serial numbers, service requests, Hisab-Kitab tape, and personal notes are processed solely to deliver warranty countdown tracking, technician support, and cross-device cloud sync.",
                )
                Spacer(Modifier.height(10.dp))
                PrivacyPurposeItem(
                    title = "2. Transparent Storage & Isolation",
                    body = "Data is isolated strictly under your signed-in Google UID in Google Cloud Firestore with offline caching on your device. No third-party ad brokers or unauthorized users can read your records.",
                )
                Spacer(Modifier.height(10.dp))
                PrivacyPurposeItem(
                    title = "3. Your Rights (Access, Correction & Erasure)",
                    body = "Under the DPDP Act, you may toggle consent at any time, export a portable JSON copy of your account data, or request erasure of your personal records.",
                )

                Spacer(Modifier.height(14.dp))

                // Consent Toggle Strip
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = if (consentAccepted) colors.statusActiveBg else colors.statusWarningBg,
                    border = BorderStroke(
                        1.dp,
                        (if (consentAccepted) colors.statusActive else colors.statusWarning).copy(alpha = 0.35f),
                    ),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 14.dp, vertical = 10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = if (consentAccepted) "DPDP Consent Granted" else "DPDP Consent Pending / Withdrawn",
                                style = MaterialTheme.typography.titleSmall,
                                color = if (consentAccepted) colors.statusActive else colors.statusWarning,
                            )
                            Text(
                                text = "Toggle anytime to grant or withdraw processing consent",
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.textSecondary,
                            )
                        }
                        Switch(
                            checked = consentAccepted,
                            enabled = !isBusy,
                            onCheckedChange = onSetDpdpConsent,
                            modifier = Modifier.testTag("dpdp_consent_switch"),
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color.White,
                                checkedTrackColor = colors.statusActive,
                            ),
                        )
                    }
                }

                Spacer(Modifier.height(14.dp))

                // Export & Erasure Rights Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    OutlinedButton(
                        onClick = {
                            exportUserDataJson(context, profile, warranties, serviceRequests, calcEntries, notes)
                            onRecordExport()
                        },
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                            .testTag("dpdp_export_data_button"),
                        shape = RoundedCornerShape(14.dp),
                        border = BorderStroke(1.dp, colors.cardBorder),
                    ) {
                        Icon(Icons.Rounded.Download, contentDescription = null, tint = colors.brandPrimary, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Export Data", color = colors.textPrimary, maxLines = 1)
                    }

                    OutlinedButton(
                        onClick = { showDeletionDialog = true },
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                            .testTag("dpdp_request_deletion_button"),
                        shape = RoundedCornerShape(14.dp),
                        border = BorderStroke(1.dp, colors.statusExpired.copy(alpha = 0.5f)),
                    ) {
                        Icon(Icons.Rounded.DeleteForever, contentDescription = null, tint = colors.statusExpired, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Erase Data", color = colors.statusExpired, maxLines = 1)
                    }
                }
            }
        }

        // Connected Google Account & Sign Out
        item(key = "account_signout_card") {
            AquaCard(modifier = Modifier.fillMaxWidth()) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(colors.brandTint),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Rounded.VerifiedUser, contentDescription = null, tint = colors.brandPrimary)
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = profile?.displayName?.ifBlank { "Google Account" } ?: "Google Account",
                            style = MaterialTheme.typography.titleMedium,
                            color = colors.textPrimary,
                        )
                        Text(
                            text = profile?.email ?: "",
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.textSecondary,
                        )
                    }
                }
                Spacer(Modifier.height(14.dp))
                Button(
                    onClick = onSignOut,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("sign_out_button"),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colors.brandTint,
                        contentColor = colors.brandPrimary,
                    ),
                    shape = RoundedCornerShape(14.dp),
                ) {
                    Icon(Icons.AutoMirrored.Rounded.Logout, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Sign Out Safely", fontWeight = FontWeight.SemiBold)
                }
            }
        }

        // Transparent DPDP Audit Trail
        item(key = "audit_header") {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Icon(Icons.Rounded.Lock, contentDescription = null, tint = colors.brandPrimary, modifier = Modifier.size(18.dp))
                Text(
                    text = "Privacy Activity Log (${privacyLogs.size})",
                    style = MaterialTheme.typography.titleMedium,
                    color = colors.textPrimary,
                )
            }
        }

        if (privacyLogs.isEmpty()) {
            item(key = "audit_empty") {
                AquaCard(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "No privacy actions recorded yet",
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.textSecondary,
                    )
                }
            }
        } else {
            items(privacyLogs.take(10), key = { it.id }) { log ->
                AquaCard(contentPadding = PaddingValues(14.dp), modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = log.actionType.replace("_", " "),
                            style = MaterialTheme.typography.labelLarge,
                            color = colors.brandPrimary,
                        )
                        Text(
                            text = formatTimestamp(log.createdAt),
                            style = MaterialTheme.typography.labelSmall,
                            color = colors.textSecondary,
                        )
                    }
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = log.details,
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.textSecondary,
                    )
                }
            }
        }

        item { Spacer(Modifier.height(12.dp)) }
    }

    if (showDeletionDialog) {
        AlertDialog(
            onDismissRequest = { showDeletionDialog = false },
            containerColor = colors.elevatedSurface,
            title = {
                Text("Confirm DPDP Data Erasure", color = colors.textPrimary)
            },
            text = {
                Text(
                    text = "This will immediately erase your synced personal notes and Hisab-Kitab calculator tape, and record a formal DPDP Act Right-to-Erasure log on your account. Continue?",
                    color = colors.textSecondary,
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showDeletionDialog = false
                        onRequestDeletion()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = colors.statusExpired),
                ) {
                    Text("Erase & Log Request")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeletionDialog = false }) {
                    Text("Cancel", color = colors.textPrimary)
                }
            },
        )
    }
}

@Composable
private fun PrivacyPurposeItem(title: String, body: String) {
    val colors = LocalAquaVaultColors.current
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(text = title, style = MaterialTheme.typography.titleSmall, color = colors.textPrimary)
        Text(text = body, style = MaterialTheme.typography.bodySmall, color = colors.textSecondary)
    }
}

private fun exportUserDataJson(
    context: android.content.Context,
    profile: CustomerProfile?,
    warranties: List<WarrantyUnit>,
    serviceRequests: List<ServiceRequest>,
    calcEntries: List<CalcEntry>,
    notes: List<PersonalNote>,
) {
    val root = JSONObject().apply {
        put("exportStandard", "DPDP Act 2023 Portable Customer Record")
        put("customerCode", profile?.customerCode ?: "")
        put("displayName", profile?.displayName ?: "")
        put("email", profile?.email ?: "")
        put("dpdpConsentAccepted", profile?.dpdpConsentAccepted ?: false)
        put(
            "installedUnits",
            JSONArray(
                warranties.map { u ->
                    JSONObject().apply {
                        put("productName", u.productName)
                        put("category", u.deviceType)
                        put("serialNumber", u.serialNumber)
                        put("locationTag", u.locationTag)
                        put("invoiceNumber", u.invoiceNumber)
                        put("installDate", u.installDateFormatted())
                        put("expiryDate", u.expiryDateFormatted())
                    }
                }
            ),
        )
        put("serviceTicketCount", serviceRequests.size)
        put("calculatorEntriesCount", calcEntries.size)
        put("personalNotesCount", notes.size)
    }

    val intent = Intent(Intent.ACTION_SEND).apply {
        type = "application/json"
        putExtra(Intent.EXTRA_SUBJECT, "AquaVault DPDP Personal Data Export")
        putExtra(Intent.EXTRA_TEXT, root.toString(2))
    }
    context.startActivity(Intent.createChooser(intent, "Export AquaVault Data"))
}
