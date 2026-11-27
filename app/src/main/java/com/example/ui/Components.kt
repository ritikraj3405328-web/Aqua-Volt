package com.example.ui

import android.content.Context
import android.content.Intent
import android.print.PrintAttributes
import android.print.PrintManager
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.DarkMode
import androidx.compose.material.icons.rounded.LightMode
import androidx.compose.material.icons.rounded.Print
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material.icons.rounded.Verified
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.R
import com.example.data.CountdownPoint
import com.example.data.CustomerProfile
import com.example.data.WarrantyHealth
import com.example.data.WarrantyUnit
import com.example.data.currentUtcEpochDay
import com.example.data.formatInr
import com.example.ui.theme.JetBrainsMonoFamily
import com.example.ui.theme.LocalAquaVaultColors
import kotlin.math.roundToInt

@Composable
fun AquaCard(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 20.dp,
    contentPadding: PaddingValues = PaddingValues(18.dp),
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val colors = LocalAquaVaultColors.current
    val shape = RoundedCornerShape(cornerRadius)
    val baseModifier = modifier
        .shadow(
            elevation = if (colors.isDark) 10.dp else 12.dp,
            shape = shape,
            ambientColor = colors.shadowGlow,
            spotColor = colors.shadowGlow,
        )
        .clip(shape)
        .background(colors.elevatedSurface)
        .border(BorderStroke(1.dp, colors.cardBorder), shape)
        .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)

    Column(
        modifier = baseModifier.padding(contentPadding),
        content = content,
    )
}

@Composable
fun StatusPill(
    label: String,
    textColor: Color,
    backgroundColor: Color,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(50),
        color = backgroundColor,
        border = BorderStroke(1.dp, textColor.copy(alpha = 0.25f)),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(5.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(7.dp)
                    .clip(CircleShape)
                    .background(textColor)
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = textColor,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
fun WarrantyStatusPill(health: WarrantyHealth, modifier: Modifier = Modifier) {
    val colors = LocalAquaVaultColors.current
    val (label, fg, bg) = when (health) {
        WarrantyHealth.ACTIVE -> Triple("Active Shield", colors.statusActive, colors.statusActiveBg)
        WarrantyHealth.EXPIRING_SOON -> Triple("Expiring Soon", colors.statusWarning, colors.statusWarningBg)
        WarrantyHealth.EXPIRED -> Triple("Expired", colors.statusExpired, colors.statusExpiredBg)
    }
    StatusPill(label = label, textColor = fg, backgroundColor = bg, modifier = modifier)
}

@Composable
fun DayNightToggleButton(
    isDark: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = LocalAquaVaultColors.current
    val pillBg by animateColorAsState(
        targetValue = if (isDark) colors.brandTint else colors.brandTint,
        label = "toggleBg",
    )
    Surface(
        modifier = modifier
            .testTag("day_night_toggle_button")
            .height(40.dp)
            .clip(RoundedCornerShape(50))
            .clickable(onClick = onToggle),
        shape = RoundedCornerShape(50),
        color = pillBg,
        border = BorderStroke(1.dp, colors.brandPrimary.copy(alpha = 0.35f)),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Icon(
                imageVector = if (isDark) Icons.Rounded.LightMode else Icons.Rounded.DarkMode,
                contentDescription = stringResource(R.string.cd_day_night_toggle),
                tint = colors.brandPrimary,
                modifier = Modifier.size(18.dp),
            )
            Text(
                text = if (isDark) stringResource(R.string.day_mode) else stringResource(R.string.night_mode),
                style = MaterialTheme.typography.labelLarge,
                color = colors.brandPrimary,
            )
        }
    }
}

@Composable
fun DpdpConsentBanner(
    onAccept: () -> Unit,
    onReviewPrivacy: () -> Unit,
    onDismiss: () -> Unit,
) {
    val colors = LocalAquaVaultColors.current
    AquaCard(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("dpdp_consent_banner"),
        cornerRadius = 18.dp,
        contentPadding = PaddingValues(16.dp),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(colors.brandTint),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = Icons.Rounded.Shield,
                    contentDescription = "DPDP Privacy Shield",
                    tint = colors.brandPrimary,
                    modifier = Modifier.size(20.dp),
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = stringResource(R.string.dpdp_title),
                    style = MaterialTheme.typography.titleMedium,
                    color = colors.textPrimary,
                )
                Text(
                    text = "Transparent control over your personal data",
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.textSecondary,
                )
            }
            IconButton(
                onClick = onDismiss,
                modifier = Modifier.testTag("dpdp_banner_dismiss"),
            ) {
                Icon(
                    imageVector = Icons.Rounded.Close,
                    contentDescription = "Dismiss DPDP banner",
                    tint = colors.textSecondary,
                )
            }
        }
        Spacer(Modifier.height(10.dp))
        Text(
            text = stringResource(R.string.dpdp_banner_body),
            style = MaterialTheme.typography.bodySmall,
            color = colors.textSecondary,
        )
        Spacer(Modifier.height(12.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Button(
                onClick = onAccept,
                modifier = Modifier
                    .weight(1f)
                    .testTag("dpdp_banner_accept"),
                colors = ButtonDefaults.buttonColors(containerColor = colors.brandPrimary),
                shape = RoundedCornerShape(12.dp),
            ) {
                Text("Accept Consent", maxLines = 1)
            }
            OutlinedButton(
                onClick = onReviewPrivacy,
                modifier = Modifier
                    .weight(1f)
                    .testTag("dpdp_banner_review"),
                border = BorderStroke(1.dp, colors.cardBorder),
                shape = RoundedCornerShape(12.dp),
            ) {
                Text("Privacy Controls", color = colors.textPrimary, maxLines = 1)
            }
        }
    }
}

/**
 * Interactive Day-by-Day Decreasing Warranty Countdown Graph with touch/drag inspection tooltips.
 */
@Composable
fun WarrantyCountdownChart(
    unit: WarrantyUnit,
    modifier: Modifier = Modifier,
) {
    val colors = LocalAquaVaultColors.current
    val today = remember { currentUtcEpochDay() }
    val points: List<CountdownPoint> = remember(unit.id, unit.installEpochDay, unit.warrantyTotalDays) {
        unit.buildCountdownCurve(today)
    }
    val todayIndex = remember(points, today) {
        points.indexOfLast { it.epochDay <= today }.coerceIn(0, points.lastIndex)
    }
    var selectedIdx by remember(unit.id) { mutableIntStateOf(todayIndex) }
    val inspected = points.getOrElse(selectedIdx) { points.last() }
    val health = unit.warrantyHealth(today)

    val lineAccent = when (health) {
        WarrantyHealth.ACTIVE -> colors.brandPrimary
        WarrantyHealth.EXPIRING_SOON -> colors.statusWarning
        WarrantyHealth.EXPIRED -> colors.statusExpired
    }

    Column(modifier = modifier.fillMaxWidth()) {
        // Interactive Inspector Header
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            color = colors.brandTint.copy(alpha = if (colors.isDark) 0.55f else 0.7f),
            border = BorderStroke(1.dp, lineAccent.copy(alpha = 0.25f)),
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column {
                    Text(
                        text = if (selectedIdx == todayIndex) "TODAY'S POSITION" else "INSPECTED DATE",
                        style = MaterialTheme.typography.labelSmall,
                        color = lineAccent,
                    )
                    Text(
                        text = inspected.fullDateLabel,
                        style = MaterialTheme.typography.titleMedium,
                        color = colors.textPrimary,
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "${inspected.remainingDays} days left",
                        fontFamily = JetBrainsMonoFamily,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = lineAccent,
                    )
                    Text(
                        text = "of ${unit.warrantyTotalDays} total days",
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.textSecondary,
                    )
                }
            }
        }

        Spacer(Modifier.height(14.dp))

        // Interactive Decreasing Area & Step-Curve Canvas
        val gridColor = colors.cardBorder
        val mutedTextColor = colors.textSecondary
        val surfaceBg = colors.elevatedSurface
        val emeraldColor = colors.statusActive

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(210.dp)
                .testTag("warranty_countdown_chart")
                .pointerInput(points) {
                    detectTapGestures { offset ->
                        val ratio = (offset.x / size.width.coerceAtLeast(1)).coerceIn(0f, 1f)
                        selectedIdx = (ratio * points.lastIndex).roundToInt().coerceIn(0, points.lastIndex)
                    }
                }
                .pointerInput(points) {
                    detectHorizontalDragGestures { change, _ ->
                        change.consume()
                        val ratio = (change.position.x / size.width.coerceAtLeast(1)).coerceIn(0f, 1f)
                        selectedIdx = (ratio * points.lastIndex).roundToInt().coerceIn(0, points.lastIndex)
                    }
                }
        ) {
            Canvas(modifier = Modifier.matchParentSize()) {
                val padLeft = 18.dp.toPx()
                val padRight = 18.dp.toPx()
                val padTop = 18.dp.toPx()
                val padBottom = 24.dp.toPx()
                val chartW = (size.width - padLeft - padRight).coerceAtLeast(1f)
                val chartH = (size.height - padTop - padBottom).coerceAtLeast(1f)
                val maxDays = unit.warrantyTotalDays.coerceAtLeast(1L).toFloat()

                // Horizontal reference grid lines (100%, 50%, 0%)
                listOf(0f, 0.5f, 1f).forEach { frac ->
                    val y = padTop + chartH * frac
                    drawLine(
                        color = gridColor,
                        start = Offset(padLeft, y),
                        end = Offset(padLeft + chartW, y),
                        strokeWidth = 1.dp.toPx(),
                        pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 10f)),
                    )
                }

                if (points.size >= 2) {
                    val coords = points.mapIndexed { idx, pt ->
                        val x = padLeft + (idx.toFloat() / points.lastIndex.toFloat()) * chartW
                        val yRatio = 1f - (pt.remainingDays.toFloat() / maxDays).coerceIn(0f, 1f)
                        val y = padTop + yRatio * chartH
                        Offset(x, y)
                    }

                    // Filled decreasing gradient area
                    val areaPath = Path().apply {
                        moveTo(coords.first().x, padTop + chartH)
                        coords.forEach { lineTo(it.x, it.y) }
                        lineTo(coords.last().x, padTop + chartH)
                        close()
                    }
                    drawPath(
                        path = areaPath,
                        brush = Brush.verticalGradient(
                            colors = listOf(
                                lineAccent.copy(alpha = 0.34f),
                                lineAccent.copy(alpha = 0.03f),
                            ),
                            startY = padTop,
                            endY = padTop + chartH,
                        ),
                    )

                    // Full decreasing trajectory line (subtle dashed future portion)
                    val fullLine = Path().apply {
                        moveTo(coords.first().x, coords.first().y)
                        for (i in 1 until coords.size) {
                            lineTo(coords[i].x, coords[i].y)
                        }
                    }
                    drawPath(
                        path = fullLine,
                        color = lineAccent.copy(alpha = 0.42f),
                        style = Stroke(
                            width = 2.5.dp.toPx(),
                            cap = StrokeCap.Round,
                            join = StrokeJoin.Round,
                            pathEffect = PathEffect.dashPathEffect(floatArrayOf(12f, 8f)),
                        ),
                    )

                    // Solid elapsed countdown trajectory up to Today
                    val elapsedLine = Path().apply {
                        moveTo(coords.first().x, coords.first().y)
                        for (i in 1..todayIndex.coerceAtMost(coords.lastIndex)) {
                            lineTo(coords[i].x, coords[i].y)
                        }
                    }
                    drawPath(
                        path = elapsedLine,
                        color = lineAccent,
                        style = Stroke(
                            width = 3.5.dp.toPx(),
                            cap = StrokeCap.Round,
                            join = StrokeJoin.Round,
                        ),
                    )

                    // Today glowing pulse dot
                    val todayPt = coords[todayIndex]
                    drawCircle(
                        color = emeraldColor.copy(alpha = 0.25f),
                        radius = 12.dp.toPx(),
                        center = todayPt,
                    )
                    drawCircle(
                        color = emeraldColor,
                        radius = 5.5.dp.toPx(),
                        center = todayPt,
                    )

                    // Inspected point crosshair + halo
                    val selPt = coords[selectedIdx]
                    drawLine(
                        color = lineAccent.copy(alpha = 0.65f),
                        start = Offset(selPt.x, padTop),
                        end = Offset(selPt.x, padTop + chartH),
                        strokeWidth = 1.5.dp.toPx(),
                    )
                    drawCircle(
                        color = lineAccent,
                        radius = 7.dp.toPx(),
                        center = selPt,
                    )
                    drawCircle(
                        color = surfaceBg,
                        radius = 3.5.dp.toPx(),
                        center = selPt,
                    )
                }

                // Bottom baseline
                drawLine(
                    color = mutedTextColor.copy(alpha = 0.35f),
                    start = Offset(padLeft, padTop + chartH),
                    end = Offset(padLeft + chartW, padTop + chartH),
                    strokeWidth = 1.dp.toPx(),
                )
            }
        }

        // X-Axis Labels + Helper Tip
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(
                text = "Start: ${unit.installDateFormatted()}",
                style = MaterialTheme.typography.labelSmall,
                color = colors.textSecondary,
            )
            Text(
                text = "Drag graph to inspect any day",
                style = MaterialTheme.typography.labelSmall,
                color = colors.brandPrimary,
            )
            Text(
                text = "Expiry: ${unit.expiryDateFormatted()}",
                style = MaterialTheme.typography.labelSmall,
                color = colors.textSecondary,
            )
        }
    }
}

/**
 * Luxury Digital Warranty Certificate & GST Bill Viewer Dialog with Share & Print actions.
 */
@Composable
fun DigitalBillAndCertificateDialog(
    unit: WarrantyUnit,
    profile: CustomerProfile?,
    onDismiss: () -> Unit,
    onFeedback: (String) -> Unit,
) {
    val colors = LocalAquaVaultColors.current
    val context = LocalContext.current
    val today = remember { currentUtcEpochDay() }
    val remaining = unit.daysRemaining(today)

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false),
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.94f)
                .padding(vertical = 24.dp),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = colors.elevatedSurface),
            border = BorderStroke(1.dp, colors.cardBorder),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Verified,
                            contentDescription = "Verified Digital Certificate",
                            tint = colors.brandPrimary,
                        )
                        Column {
                            Text(
                                text = "DIGITAL WARRANTY & BILL",
                                style = MaterialTheme.typography.labelSmall,
                                color = colors.brandPrimary,
                            )
                            Text(
                                text = unit.invoiceNumber,
                                fontFamily = JetBrainsMonoFamily,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = colors.textPrimary,
                            )
                        }
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(
                            imageVector = Icons.Rounded.Close,
                            contentDescription = "Close digital bill",
                            tint = colors.textSecondary,
                        )
                    }
                }

                Spacer(Modifier.height(14.dp))

                // Luxury Certificate Banner
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(18.dp))
                        .background(
                            Brush.linearGradient(
                                colors = listOf(Color(0xFF4C1D95), Color(0xFF6D28D9), Color(0xFF7C3AED))
                            )
                        )
                        .padding(18.dp),
                ) {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = "AQUAVAULT CERTIFICATE",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color(0xFFEDE9FE),
                            )
                            WarrantyStatusPill(health = unit.warrantyHealth(today))
                        }
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = unit.productName,
                            style = MaterialTheme.typography.titleLarge,
                            color = Color.White,
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = "${unit.category.displayLabel} • ${unit.locationTag}",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFFDDD6FE),
                        )
                        Spacer(Modifier.height(14.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Column {
                                Text("SERIAL NO.", style = MaterialTheme.typography.labelSmall, color = Color(0xFFC4B5FD))
                                Text(
                                    text = unit.serialNumber,
                                    fontFamily = JetBrainsMonoFamily,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 13.sp,
                                    color = Color.White,
                                )
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("REMAINING", style = MaterialTheme.typography.labelSmall, color = Color(0xFFC4B5FD))
                                Text(
                                    text = "$remaining / ${unit.warrantyTotalDays} Days",
                                    fontFamily = JetBrainsMonoFamily,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    color = Color.White,
                                )
                            }
                        }
                    }
                }

                Spacer(Modifier.height(16.dp))

                // Detailed Breakdown
                BillDetailRow("Customer", profile?.displayName?.ifBlank { "Verified Owner" } ?: "Verified Owner")
                BillDetailRow("Customer ID", profile?.customerCode ?: "AQV-MEMBER")
                BillDetailRow("Model Code", unit.modelCode, mono = true)
                BillDetailRow("Installation Date", unit.installDateFormatted())
                BillDetailRow("Warranty Expiry", unit.expiryDateFormatted())
                BillDetailRow("Warranty Period", "${unit.warrantyTotalDays} Days")
                BillDetailRow("Authorized Dealer", unit.dealerName)

                HorizontalDivider(
                    modifier = Modifier.padding(vertical = 12.dp),
                    color = colors.cardBorder,
                )

                BillDetailRow("Taxable Value", formatInr(unit.purchaseAmountInr), mono = true)
                BillDetailRow("GST (18%)", formatInr(unit.gstAmountInr), mono = true)
                Spacer(Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "Grand Total (Paid)",
                        style = MaterialTheme.typography.titleMedium,
                        color = colors.textPrimary,
                    )
                    Text(
                        text = formatInr(unit.grandTotalInr),
                        fontFamily = JetBrainsMonoFamily,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = colors.brandPrimary,
                    )
                }

                Spacer(Modifier.height(18.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Button(
                        onClick = {
                            printDigitalBillHtml(context, unit, profile, onFeedback)
                        },
                        modifier = Modifier
                            .weight(1f)
                            .testTag("print_digital_bill_button"),
                        colors = ButtonDefaults.buttonColors(containerColor = colors.brandPrimary),
                        shape = RoundedCornerShape(14.dp),
                    ) {
                        Icon(Icons.Rounded.Print, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Print / PDF")
                    }
                    OutlinedButton(
                        onClick = {
                            shareDigitalBillSummary(context, unit, profile)
                            onFeedback("Opened share sheet for ${unit.invoiceNumber}")
                        },
                        modifier = Modifier
                            .weight(1f)
                            .testTag("share_digital_bill_button"),
                        border = BorderStroke(1.dp, colors.cardBorder),
                        shape = RoundedCornerShape(14.dp),
                    ) {
                        Icon(Icons.Rounded.Share, contentDescription = null, tint = colors.brandPrimary, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Share Bill", color = colors.textPrimary)
                    }
                }
            }
        }
    }
}

@Composable
private fun BillDetailRow(
    label: String,
    value: String,
    mono: Boolean = false,
) {
    val colors = LocalAquaVaultColors.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 5.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = colors.textSecondary,
        )
        Text(
            text = value,
            style = if (mono) {
                MaterialTheme.typography.bodyMedium.copy(
                    fontFamily = JetBrainsMonoFamily,
                    fontWeight = FontWeight.Medium,
                )
            } else {
                MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium)
            },
            color = colors.textPrimary,
        )
    }
}

private fun shareDigitalBillSummary(
    context: Context,
    unit: WarrantyUnit,
    profile: CustomerProfile?,
) {
    val summary = buildString {
        appendLine("AQUAVAULT DIGITAL WARRANTY & TAX INVOICE")
        appendLine("Invoice No: ${unit.invoiceNumber}")
        appendLine("Customer: ${profile?.displayName ?: "Verified Customer"} (${profile?.customerCode ?: ""})")
        appendLine("Product: ${unit.productName} (${unit.modelCode})")
        appendLine("Category: ${unit.category.displayLabel}")
        appendLine("Location: ${unit.locationTag}")
        appendLine("Serial No: ${unit.serialNumber}")
        appendLine("Installed: ${unit.installDateFormatted()}")
        appendLine("Warranty Expiry: ${unit.expiryDateFormatted()} (${unit.daysRemaining()} days remaining)")
        appendLine("Amount Paid: ${formatInr(unit.grandTotalInr)} (incl. GST)")
    }
    val intent = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_SUBJECT, "AquaVault Digital Bill — ${unit.invoiceNumber}")
        putExtra(Intent.EXTRA_TEXT, summary)
    }
    context.startActivity(Intent.createChooser(intent, "Share Digital Bill"))
}

private fun printDigitalBillHtml(
    context: Context,
    unit: WarrantyUnit,
    profile: CustomerProfile?,
    onFeedback: (String) -> Unit,
) {
    try {
        val webView = WebView(context)
        val html = """
            <html>
            <body style="font-family: sans-serif; padding: 24px; color: #1E1B4B;">
              <h1 style="color: #6D28D9; margin-bottom: 4px;">AQUAVAULT DIGITAL WARRANTY &amp; TAX INVOICE</h1>
              <p style="color: #5B5578; margin-top: 0;">Invoice: ${unit.invoiceNumber} • Serial: ${unit.serialNumber}</p>
              <hr style="border: 1px solid #E6E0F8;" />
              <p><strong>Customer:</strong> ${profile?.displayName ?: "AquaVault Customer"} (${profile?.customerCode ?: ""})</p>
              <p><strong>Product:</strong> ${unit.productName} (${unit.modelCode})</p>
              <p><strong>Category:</strong> ${unit.category.displayLabel}</p>
              <p><strong>Location Tag:</strong> ${unit.locationTag}</p>
              <p><strong>Installation Date:</strong> ${unit.installDateFormatted()}</p>
              <p><strong>Warranty Expiry:</strong> ${unit.expiryDateFormatted()} (${unit.warrantyTotalDays} Days Total, ${unit.daysRemaining()} Days Remaining)</p>
              <p><strong>Dealer:</strong> ${unit.dealerName}</p>
              <hr style="border: 1px solid #E6E0F8;" />
              <p><strong>Base Amount:</strong> ${formatInr(unit.purchaseAmountInr)}</p>
              <p><strong>GST (18%):</strong> ${formatInr(unit.gstAmountInr)}</p>
              <h2 style="color: #6D28D9;">Grand Total Paid: ${formatInr(unit.grandTotalInr)}</h2>
            </body>
            </html>
        """.trimIndent()
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView, url: String) {
                val printManager = context.getSystemService(Context.PRINT_SERVICE) as? PrintManager
                if (printManager != null) {
                    val jobName = "AquaVault_${unit.invoiceNumber}"
                    val adapter = view.createPrintDocumentAdapter(jobName)
                    printManager.print(jobName, adapter, PrintAttributes.Builder().build())
                }
            }
        }
        webView.loadDataWithBaseURL(null, html, "text/HTML", "UTF-8", null)
        onFeedback("Preparing printable PDF for ${unit.invoiceNumber}...")
    } catch (_: Exception) {
        onFeedback("Print service unavailable on this device. Use Share Bill instead.")
    }
}
