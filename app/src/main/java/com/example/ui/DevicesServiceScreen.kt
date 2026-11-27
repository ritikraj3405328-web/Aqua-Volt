package com.example.ui

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
import androidx.compose.material.icons.rounded.Build
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material.icons.rounded.LocationOn
import androidx.compose.material.icons.rounded.Memory
import androidx.compose.material.icons.rounded.ReceiptLong
import androidx.compose.material.icons.rounded.SupportAgent
import androidx.compose.material.icons.rounded.WaterDrop
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.DeviceCategory
import com.example.data.ServiceRequest
import com.example.data.UnitHealthStatus
import com.example.data.WarrantyUnit
import com.example.data.currentUtcEpochDay
import com.example.data.formatInr
import com.example.data.formatTimestamp
import com.example.ui.theme.JetBrainsMonoFamily
import com.example.ui.theme.LocalAquaVaultColors

private val ISSUE_CATEGORIES = listOf(
    "Sensor Calibration",
    "Valve Check",
    "Pump Auto-Cut",
    "Routine Inspection",
    "Wiring / Power",
)

private val VISIT_SLOTS = listOf(
    "Morning (9 AM - 12 PM)",
    "Afternoon (12 PM - 4 PM)",
    "Evening (4 PM - 7 PM)",
)

@Composable
fun DevicesServiceScreen(
    warranties: List<WarrantyUnit>,
    serviceRequests: List<ServiceRequest>,
    isBusy: Boolean,
    onOpenDigitalBill: (WarrantyUnit) -> Unit,
    onSubmitService: (WarrantyUnit, String, String, String, (String) -> Unit) -> Unit,
    onResolveService: (String) -> Unit,
) {
    val colors = LocalAquaVaultColors.current
    val today = remember { currentUtcEpochDay() }
    var activeSegment by remember { mutableIntStateOf(0) } // 0=Units, 1=Bills, 2=Service

    val controllersCount = remember(warranties) {
        warranties.count { it.category == DeviceCategory.WATER_LEVEL_CONTROLLER }
    }
    val stoppersCount = remember(warranties) {
        warranties.count { it.category == DeviceCategory.WATER_STOPPER }
    }

    // Service Form State
    var selectedUnitId by remember(warranties) { mutableStateOf(warranties.firstOrNull()?.id ?: "") }
    var selectedCategory by remember { mutableStateOf(ISSUE_CATEGORIES.first()) }
    var selectedSlot by remember { mutableStateOf(VISIT_SLOTS.first()) }
    var issueNote by remember { mutableStateOf("") }
    var lastConfirmedTicket by remember { mutableStateOf<String?>(null) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .testTag("devices_service_screen"),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        // Installed Units Summary Banner
        item(key = "units_counter_summary") {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                AquaCard(
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(15.dp),
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Icon(Icons.Rounded.Memory, contentDescription = null, tint = colors.brandPrimary, modifier = Modifier.size(20.dp))
                        Text(
                            text = "$controllersCount",
                            fontFamily = JetBrainsMonoFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 24.sp,
                            color = colors.brandPrimary,
                        )
                    }
                    Spacer(Modifier.height(4.dp))
                    Text("Water Level Controllers", style = MaterialTheme.typography.titleSmall, color = colors.textPrimary)
                    Text("Installed & tracked", style = MaterialTheme.typography.bodySmall, color = colors.textSecondary)
                }

                AquaCard(
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(15.dp),
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Icon(Icons.Rounded.WaterDrop, contentDescription = null, tint = colors.brandAccent, modifier = Modifier.size(20.dp))
                        Text(
                            text = "$stoppersCount",
                            fontFamily = JetBrainsMonoFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 24.sp,
                            color = colors.brandAccent,
                        )
                    }
                    Spacer(Modifier.height(4.dp))
                    Text("Water Stoppers", style = MaterialTheme.typography.titleSmall, color = colors.textPrimary)
                    Text("Auto cutoff valves", style = MaterialTheme.typography.bodySmall, color = colors.textSecondary)
                }
            }
        }

        // Clean Segmented Switcher
        item(key = "segment_tabs") {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                listOf("Installed Units", "Digital Bills", "Service Desk").forEachIndexed { idx, label ->
                    val selected = activeSegment == idx
                    Surface(
                        onClick = { activeSegment = idx },
                        modifier = Modifier
                            .weight(1f)
                            .height(44.dp)
                            .testTag("devices_segment_$idx"),
                        shape = RoundedCornerShape(14.dp),
                        color = if (selected) colors.brandPrimary else colors.elevatedSurface,
                        border = BorderStroke(1.dp, if (selected) colors.brandPrimary else colors.cardBorder),
                    ) {
                        Box(contentAlignment = Alignment.Center, modifier = Modifier.padding(horizontal = 6.dp)) {
                            Text(
                                text = label,
                                style = MaterialTheme.typography.labelLarge,
                                color = if (selected) Color.White else colors.textPrimary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                    }
                }
            }
        }

        when (activeSegment) {
            // TAB 0: INSTALLED UNITS TRACKER
            0 -> {
                items(warranties, key = { "unit_${it.id}" }) { unit ->
                    val (statusFg, statusBg) = when (unit.healthStatus) {
                        UnitHealthStatus.ONLINE -> colors.statusActive to colors.statusActiveBg
                        UnitHealthStatus.STANDBY -> colors.brandPrimary to colors.brandTint
                        UnitHealthStatus.ATTENTION -> colors.statusWarning to colors.statusWarningBg
                    }
                    AquaCard(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top,
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = unit.category.displayLabel.uppercase(),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = colors.brandPrimary,
                                )
                                Text(
                                    text = unit.productName,
                                    style = MaterialTheme.typography.titleMedium,
                                    color = colors.textPrimary,
                                )
                            }
                            Spacer(Modifier.width(8.dp))
                            StatusPill(
                                label = unit.healthStatus.displayLabel,
                                textColor = statusFg,
                                backgroundColor = statusBg,
                            )
                        }
                        Spacer(Modifier.height(10.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.LocationOn,
                                contentDescription = "Location tag",
                                tint = colors.brandPrimary,
                                modifier = Modifier.size(16.dp),
                            )
                            Text(
                                text = unit.locationTag,
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium,
                                color = colors.textPrimary,
                            )
                            Text(
                                text = "• S/N ${unit.serialNumber}",
                                fontFamily = JetBrainsMonoFamily,
                                fontSize = 11.5.sp,
                                color = colors.textSecondary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                        Spacer(Modifier.height(12.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            OutlinedButton(
                                onClick = { onOpenDigitalBill(unit) },
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("unit_bill_btn_${unit.id}"),
                                border = BorderStroke(1.dp, colors.cardBorder),
                                shape = RoundedCornerShape(12.dp),
                            ) {
                                Icon(Icons.Rounded.Description, contentDescription = null, tint = colors.brandPrimary, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("Bill & Card", color = colors.textPrimary, maxLines = 1)
                            }
                            Button(
                                onClick = {
                                    selectedUnitId = unit.id
                                    activeSegment = 2
                                },
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("unit_service_btn_${unit.id}"),
                                colors = ButtonDefaults.buttonColors(containerColor = colors.brandPrimary),
                                shape = RoundedCornerShape(12.dp),
                            ) {
                                Icon(Icons.Rounded.Build, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("Book Service", maxLines = 1)
                            }
                        }
                    }
                }
            }

            // TAB 1: DIGITAL BILLS & WARRANTY CARDS
            1 -> {
                items(warranties, key = { "bill_${it.id}" }) { unit ->
                    AquaCard(
                        onClick = { onOpenDigitalBill(unit) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("bill_card_${unit.id}"),
                    ) {
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
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(colors.brandTint),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    Icon(Icons.Rounded.ReceiptLong, contentDescription = null, tint = colors.brandPrimary)
                                }
                                Column {
                                    Text(
                                        text = unit.invoiceNumber,
                                        fontFamily = JetBrainsMonoFamily,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        color = colors.textPrimary,
                                    )
                                    Text(
                                        text = unit.productName,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = colors.textSecondary,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                    )
                                }
                            }
                            Text(
                                text = formatInr(unit.grandTotalInr),
                                fontFamily = JetBrainsMonoFamily,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = colors.brandPrimary,
                            )
                        }
                        Spacer(Modifier.height(10.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = "Installed ${unit.installDateFormatted()} • ${unit.daysRemaining(today)}d left",
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.textSecondary,
                            )
                            Text(
                                text = "View / Print →",
                                style = MaterialTheme.typography.labelLarge,
                                color = colors.brandPrimary,
                            )
                        }
                    }
                }
            }

            // TAB 2: ONE-CLICK SERVICE & SUPPORT REQUEST
            else -> {
                if (lastConfirmedTicket != null) {
                    item(key = "service_confirmation") {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("service_confirmation_banner"),
                            shape = RoundedCornerShape(18.dp),
                            color = colors.statusActiveBg,
                            border = BorderStroke(1.dp, colors.statusActive.copy(alpha = 0.45f)),
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.CheckCircle,
                                    contentDescription = "Confirmed",
                                    tint = colors.statusActive,
                                    modifier = Modifier.size(28.dp),
                                )
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "Service Request Confirmed!",
                                        style = MaterialTheme.typography.titleMedium,
                                        color = colors.statusActive,
                                    )
                                    Text(
                                        text = "Ticket $lastConfirmedTicket has been logged for priority technician assignment.",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = colors.textPrimary,
                                    )
                                }
                            }
                        }
                    }
                }

                item(key = "service_form") {
                    val chosenUnit = warranties.firstOrNull { it.id == selectedUnitId } ?: warranties.firstOrNull()
                    AquaCard(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(CircleShape)
                                    .background(colors.brandTint),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(Icons.Rounded.SupportAgent, contentDescription = null, tint = colors.brandPrimary)
                            }
                            Column {
                                Text("One-Click Service & Support", style = MaterialTheme.typography.titleLarge, color = colors.textPrimary)
                                Text("Select your unit and log an inspection visit", style = MaterialTheme.typography.bodySmall, color = colors.textSecondary)
                            }
                        }

                        Spacer(Modifier.height(14.dp))
                        Text("1. Choose Installed Unit", style = MaterialTheme.typography.labelLarge, color = colors.textPrimary)
                        Spacer(Modifier.height(6.dp))
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            items(warranties, key = { "srv_unit_${it.id}" }) { unit ->
                                val isSel = unit.id == chosenUnit?.id
                                FilterChip(
                                    selected = isSel,
                                    onClick = { selectedUnitId = unit.id },
                                    label = { Text(unit.locationTag, maxLines = 1) },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = colors.brandPrimary,
                                        selectedLabelColor = Color.White,
                                        containerColor = colors.subtleSurface,
                                        labelColor = colors.textPrimary,
                                    ),
                                )
                            }
                        }

                        Spacer(Modifier.height(12.dp))
                        Text("2. Issue Category", style = MaterialTheme.typography.labelLarge, color = colors.textPrimary)
                        Spacer(Modifier.height(6.dp))
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            items(ISSUE_CATEGORIES) { cat ->
                                val isSel = cat == selectedCategory
                                FilterChip(
                                    selected = isSel,
                                    onClick = { selectedCategory = cat },
                                    label = { Text(cat) },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = colors.brandPrimary,
                                        selectedLabelColor = Color.White,
                                        containerColor = colors.subtleSurface,
                                        labelColor = colors.textPrimary,
                                    ),
                                )
                            }
                        }

                        Spacer(Modifier.height(12.dp))
                        Text("3. Preferred Visit Slot", style = MaterialTheme.typography.labelLarge, color = colors.textPrimary)
                        Spacer(Modifier.height(6.dp))
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            items(VISIT_SLOTS) { slot ->
                                val isSel = slot == selectedSlot
                                FilterChip(
                                    selected = isSel,
                                    onClick = { selectedSlot = slot },
                                    label = { Text(slot) },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = colors.brandPrimary,
                                        selectedLabelColor = Color.White,
                                        containerColor = colors.subtleSurface,
                                        labelColor = colors.textPrimary,
                                    ),
                                )
                            }
                        }

                        Spacer(Modifier.height(12.dp))
                        OutlinedTextField(
                            value = issueNote,
                            onValueChange = { if (it.length <= 1000) issueNote = it },
                            label = { Text("Describe the issue or inspection note") },
                            placeholder = { Text("e.g., Auto cutoff alarm triggers slightly early...") },
                            minLines = 3,
                            maxLines = 5,
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("service_issue_note_input"),
                            shape = RoundedCornerShape(14.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = colors.brandPrimary,
                                unfocusedBorderColor = colors.cardBorder,
                                focusedTextColor = colors.textPrimary,
                                unfocusedTextColor = colors.textPrimary,
                            ),
                        )

                        Spacer(Modifier.height(14.dp))
                        Button(
                            onClick = {
                                if (chosenUnit != null) {
                                    onSubmitService(
                                        chosenUnit,
                                        selectedCategory,
                                        issueNote.ifBlank { "Routine check requested for ${chosenUnit.locationTag}" },
                                        selectedSlot,
                                    ) { ticket ->
                                        lastConfirmedTicket = ticket
                                        issueNote = ""
                                    }
                                }
                            },
                            enabled = !isBusy && chosenUnit != null,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp)
                                .testTag("submit_service_request_button"),
                            colors = ButtonDefaults.buttonColors(containerColor = colors.brandPrimary),
                            shape = RoundedCornerShape(14.dp),
                        ) {
                            Icon(Icons.Rounded.Build, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text(if (isBusy) "Logging Request..." else "Log Service Request")
                        }
                    }
                }

                item(key = "tickets_header") {
                    Text(
                        text = "Your Service Tickets (${serviceRequests.size})",
                        style = MaterialTheme.typography.titleMedium,
                        color = colors.textPrimary,
                    )
                }

                if (serviceRequests.isEmpty()) {
                    item(key = "tickets_empty") {
                        AquaCard(modifier = Modifier.fillMaxWidth()) {
                            Text(
                                text = "No service requests yet",
                                style = MaterialTheme.typography.titleSmall,
                                color = colors.textPrimary,
                            )
                            Text(
                                text = "All your installed units are running smoothly. Use the form above anytime you need an engineer.",
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.textSecondary,
                            )
                        }
                    }
                } else {
                    items(serviceRequests, key = { it.id }) { req ->
                        val isResolved = req.status == "RESOLVED"
                        AquaCard(modifier = Modifier.fillMaxWidth()) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text(
                                    text = req.ticketNumber,
                                    fontFamily = JetBrainsMonoFamily,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    color = colors.brandPrimary,
                                )
                                StatusPill(
                                    label = req.status,
                                    textColor = if (isResolved) colors.statusActive else colors.statusWarning,
                                    backgroundColor = if (isResolved) colors.statusActiveBg else colors.statusWarningBg,
                                )
                            }
                            Spacer(Modifier.height(6.dp))
                            Text(req.deviceLabel, style = MaterialTheme.typography.titleSmall, color = colors.textPrimary)
                            Text("${req.issueCategory} • ${req.preferredSlot}", style = MaterialTheme.typography.bodySmall, color = colors.brandPrimary)
                            Spacer(Modifier.height(4.dp))
                            Text(req.issueNote, style = MaterialTheme.typography.bodySmall, color = colors.textSecondary)
                            Spacer(Modifier.height(8.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text(
                                    text = formatTimestamp(req.createdAt),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = colors.textSecondary,
                                )
                                if (!isResolved) {
                                    TextButton(onClick = { onResolveService(req.id) }) {
                                        Text("Mark Resolved", color = colors.statusActive)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        item { Spacer(Modifier.height(12.dp)) }
    }
}
