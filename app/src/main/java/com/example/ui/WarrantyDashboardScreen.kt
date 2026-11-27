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
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material.icons.rounded.EventAvailable
import androidx.compose.material.icons.rounded.HourglassBottom
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.Timeline
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.CustomerProfile
import com.example.data.WarrantyHealth
import com.example.data.WarrantyUnit
import com.example.data.currentUtcEpochDay
import com.example.ui.theme.JetBrainsMonoFamily
import com.example.ui.theme.LocalAquaVaultColors

@Composable
fun WarrantyDashboardScreen(
    profile: CustomerProfile?,
    warranties: List<WarrantyUnit>,
    selectedWarrantyId: String?,
    onSelectWarranty: (String) -> Unit,
    onOpenDigitalBill: (WarrantyUnit) -> Unit,
) {
    val colors = LocalAquaVaultColors.current
    val today = remember { currentUtcEpochDay() }
    val activeUnit = remember(warranties, selectedWarrantyId) {
        warranties.firstOrNull { it.id == selectedWarrantyId } ?: warranties.firstOrNull()
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .testTag("warranty_dashboard_screen"),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        // Customer Account Summary Card
        item(key = "account_card") {
            AquaCard(modifier = Modifier.fillMaxWidth()) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(colors.brandTint),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Person,
                            contentDescription = "Customer Profile",
                            tint = colors.brandPrimary,
                            modifier = Modifier.size(26.dp),
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = profile?.displayName?.ifBlank { "AquaVault Member" } ?: "AquaVault Member",
                            style = MaterialTheme.typography.titleLarge,
                            color = colors.textPrimary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Text(
                            text = profile?.email?.ifBlank { "Verified Google Account" } ?: "Verified Google Account",
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.textSecondary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = colors.brandTint,
                    ) {
                        Text(
                            text = profile?.customerCode?.ifBlank { "AQV" } ?: "AQV",
                            fontFamily = JetBrainsMonoFamily,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = colors.brandPrimary,
                            modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp),
                        )
                    }
                }
            }
        }

        // Switchable Device Selector Pills
        if (warranties.isNotEmpty()) {
            item(key = "unit_selector") {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "Select Installed Unit (${warranties.size})",
                        style = MaterialTheme.typography.titleMedium,
                        color = colors.textPrimary,
                    )
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        items(warranties, key = { it.id }) { unit ->
                            val selected = unit.id == activeUnit?.id
                            FilterChip(
                                selected = selected,
                                onClick = { onSelectWarranty(unit.id) },
                                modifier = Modifier.testTag("warranty_chip_${unit.id}"),
                                label = {
                                    Text(
                                        text = "${unit.locationTag} (${unit.daysRemaining(today)}d)",
                                        maxLines = 1,
                                    )
                                },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = colors.brandPrimary,
                                    selectedLabelColor = Color.White,
                                    containerColor = colors.elevatedSurface,
                                    labelColor = colors.textPrimary,
                                ),
                                border = FilterChipDefaults.filterChipBorder(
                                    enabled = true,
                                    selected = selected,
                                    borderColor = colors.cardBorder,
                                    selectedBorderColor = colors.brandPrimary,
                                ),
                            )
                        }
                    }
                }
            }
        }

        if (activeUnit != null) {
            val remainingDays = activeUnit.daysRemaining(today)
            val elapsedDays = activeUnit.daysElapsed(today)
            val totalDays = activeUnit.warrantyTotalDays.coerceAtLeast(1L)
            val remainingFraction = (remainingDays.toFloat() / totalDays.toFloat()).coerceIn(0f, 1f)
            val health = activeUnit.warrantyHealth(today)

            // Selected Unit Live Countdown Hero & 4-Stat Grid
            item(key = "countdown_metrics") {
                AquaCard(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = activeUnit.category.displayLabel.uppercase(),
                                style = MaterialTheme.typography.labelSmall,
                                color = colors.brandPrimary,
                            )
                            Spacer(Modifier.height(3.dp))
                            Text(
                                text = activeUnit.productName,
                                style = MaterialTheme.typography.headlineSmall,
                                color = colors.textPrimary,
                            )
                            Text(
                                text = "${activeUnit.locationTag} • S/N ${activeUnit.serialNumber}",
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.textSecondary,
                            )
                        }
                        Spacer(Modifier.width(8.dp))
                        WarrantyStatusPill(health = health)
                    }

                    Spacer(Modifier.height(16.dp))

                    // Big Remaining Countdown Bar
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Bottom,
                    ) {
                        Column {
                            Text(
                                text = "DAYS REMAINING",
                                style = MaterialTheme.typography.labelSmall,
                                color = colors.textSecondary,
                            )
                            Text(
                                text = "$remainingDays Days",
                                fontFamily = JetBrainsMonoFamily,
                                fontWeight = FontWeight.Bold,
                                fontSize = 32.sp,
                                color = when (health) {
                                    WarrantyHealth.ACTIVE -> colors.brandPrimary
                                    WarrantyHealth.EXPIRING_SOON -> colors.statusWarning
                                    WarrantyHealth.EXPIRED -> colors.statusExpired
                                },
                            )
                        }
                        Text(
                            text = "${(remainingFraction * 100).toInt()}% left",
                            fontFamily = JetBrainsMonoFamily,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp,
                            color = colors.textSecondary,
                        )
                    }

                    Spacer(Modifier.height(8.dp))
                    LinearProgressIndicator(
                        progress = { remainingFraction },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(10.dp)
                            .clip(RoundedCornerShape(50)),
                        color = when (health) {
                            WarrantyHealth.ACTIVE -> colors.brandPrimary
                            WarrantyHealth.EXPIRING_SOON -> colors.statusWarning
                            WarrantyHealth.EXPIRED -> colors.statusExpired
                        },
                        trackColor = colors.brandTint,
                        strokeCap = StrokeCap.Round,
                    )

                    Spacer(Modifier.height(16.dp))

                    // 2x2 Detailed Warranty Grid
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        WarrantyStatBox(
                            icon = Icons.Rounded.CalendarMonth,
                            label = "Installation Date",
                            value = activeUnit.installDateFormatted(),
                            modifier = Modifier.weight(1f),
                        )
                        WarrantyStatBox(
                            icon = Icons.Rounded.EventAvailable,
                            label = "Expiry Date",
                            value = activeUnit.expiryDateFormatted(),
                            modifier = Modifier.weight(1f),
                        )
                    }
                    Spacer(Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        WarrantyStatBox(
                            icon = Icons.Rounded.Timeline,
                            label = "Total Warranty",
                            value = "${activeUnit.warrantyTotalDays} Days",
                            modifier = Modifier.weight(1f),
                        )
                        WarrantyStatBox(
                            icon = Icons.Rounded.HourglassBottom,
                            label = "Days Elapsed",
                            value = "$elapsedDays Days",
                            modifier = Modifier.weight(1f),
                        )
                    }
                }
            }

            // Interactive Day-by-Day Decreasing Countdown Graph Card
            item(key = "decreasing_graph") {
                AquaCard(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Day-by-Day Decreasing Graph",
                                style = MaterialTheme.typography.titleLarge,
                                color = colors.textPrimary,
                            )
                            Text(
                                text = "Tap or slide across the curve to inspect exact remaining warranty days",
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.textSecondary,
                            )
                        }
                    }
                    Spacer(Modifier.height(14.dp))
                    WarrantyCountdownChart(unit = activeUnit)
                    Spacer(Modifier.height(16.dp))
                    Button(
                        onClick = { onOpenDigitalBill(activeUnit) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                            .testTag("warranty_view_certificate_btn"),
                        colors = ButtonDefaults.buttonColors(containerColor = colors.brandPrimary),
                        shape = RoundedCornerShape(14.dp),
                    ) {
                        Icon(Icons.Rounded.Description, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("View Digital Warranty Card & Bill")
                    }
                }
            }
        } else {
            item(key = "empty_warranty") {
                AquaCard(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "Loading your warranty shield records...",
                        style = MaterialTheme.typography.titleMedium,
                        color = colors.textPrimary,
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "Your Water Level Controller & Water Stopper timelines will appear here momentarily.",
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.textSecondary,
                    )
                }
            }
        }

        item { Spacer(Modifier.height(12.dp)) }
    }
}

@Composable
private fun WarrantyStatBox(
    icon: ImageVector,
    label: String,
    value: String,
    modifier: Modifier = Modifier,
) {
    val colors = LocalAquaVaultColors.current
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(14.dp),
        color = colors.subtleSurface,
        border = BorderStroke(1.dp, colors.cardBorder),
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(5.dp),
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = colors.brandPrimary,
                    modifier = Modifier.size(15.dp),
                )
                Text(
                    text = label,
                    style = MaterialTheme.typography.labelSmall,
                    color = colors.textSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            Spacer(Modifier.height(5.dp))
            Text(
                text = value,
                fontFamily = JetBrainsMonoFamily,
                fontWeight = FontWeight.SemiBold,
                fontSize = 14.sp,
                color = colors.textPrimary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}
