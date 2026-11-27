package com.example.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.rounded.Apps
import androidx.compose.material.icons.rounded.AutoGraph
import androidx.compose.material.icons.rounded.BuildCircle
import androidx.compose.material.icons.rounded.Calculate
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material.icons.rounded.EditNote
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material.icons.rounded.WaterDrop
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.data.CustomerProfile
import com.example.data.DeviceCategory
import com.example.data.PersonalNote
import com.example.data.ServiceRequest
import com.example.data.WarrantyHealth
import com.example.data.WarrantyUnit
import com.example.data.currentUtcEpochDay
import com.example.ui.theme.JetBrainsMonoFamily
import com.example.ui.theme.LocalAquaVaultColors

@Composable
fun HomeScreen(
    profile: CustomerProfile?,
    warranties: List<WarrantyUnit>,
    serviceRequests: List<ServiceRequest>,
    notes: List<PersonalNote>,
    showDpdpBanner: Boolean,
    onAcceptDpdp: () -> Unit,
    onDismissDpdp: () -> Unit,
    onNavigate: (AppDestination) -> Unit,
    onOpenDigitalBill: (WarrantyUnit) -> Unit,
) {
    val colors = LocalAquaVaultColors.current
    val today = remember { currentUtcEpochDay() }

    val controllerCount = remember(warranties) {
        warranties.count { it.category == DeviceCategory.WATER_LEVEL_CONTROLLER }
    }
    val stopperCount = remember(warranties) {
        warranties.count { it.category == DeviceCategory.WATER_STOPPER }
    }
    val activeWarrantyCount = remember(warranties, today) {
        warranties.count { it.warrantyHealth(today) != WarrantyHealth.EXPIRED }
    }
    val primaryUnit = remember(warranties, today) {
        warranties.firstOrNull { it.warrantyHealth(today) == WarrantyHealth.ACTIVE }
            ?: warranties.firstOrNull()
    }
    val openTickets = remember(serviceRequests) {
        serviceRequests.count { it.status != "RESOLVED" }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .testTag("home_screen_list"),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        // DPDP Act Consent Banner if not yet accepted
        if (showDpdpBanner) {
            item(key = "dpdp_banner") {
                DpdpConsentBanner(
                    onAccept = onAcceptDpdp,
                    onReviewPrivacy = { onNavigate(AppDestination.PRIVACY) },
                    onDismiss = onDismissDpdp,
                )
            }
        }

        // Flagship Hardware Hero Banner
        item(key = "hero_banner") {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(212.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .testTag("home_hero_banner"),
            ) {
                Image(
                    painter = painterResource(id = R.drawable.img_hero_water_controller_1795775651354),
                    contentDescription = stringResource(R.string.cd_hero_hardware),
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop,
                )
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(
                                    Color(0x331E1B4B),
                                    Color(0xE614121E),
                                )
                            )
                        )
                )
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(18.dp),
                    verticalArrangement = Arrangement.SpaceBetween,
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Surface(
                            shape = RoundedCornerShape(50),
                            color = Color(0x446D28D9),
                            border = BorderStroke(1.dp, Color(0x88A78BFA)),
                        ) {
                            Text(
                                text = profile?.customerCode?.ifBlank { "PREMIUM MEMBER" } ?: "PREMIUM MEMBER",
                                fontFamily = JetBrainsMonoFamily,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFFEDE9FE),
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                            )
                        }
                        StatusPill(
                            label = "$activeWarrantyCount Shielded",
                            textColor = Color(0xFF34D399),
                            backgroundColor = Color(0xCC062C22),
                        )
                    }

                    Column {
                        Text(
                            text = "Welcome back, ${profile?.displayName?.substringBefore(" ") ?: "Owner"}",
                            style = MaterialTheme.typography.headlineMedium,
                            color = Color.White,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = "Your Water Level Controllers & Water Stoppers are monitored, insured, and backed by instant digital bills.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFFE2E0F5),
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Spacer(Modifier.height(12.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Button(
                                onClick = { onNavigate(AppDestination.WARRANTY) },
                                modifier = Modifier.testTag("hero_view_warranty_btn"),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color(0xFF7C3AED),
                                    contentColor = Color.White,
                                ),
                                shape = RoundedCornerShape(12.dp),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
                            ) {
                                Icon(Icons.Rounded.AutoGraph, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("Warranty Graph", style = MaterialTheme.typography.labelLarge)
                            }
                            if (primaryUnit != null) {
                                Surface(
                                    onClick = { onOpenDigitalBill(primaryUnit) },
                                    modifier = Modifier.testTag("hero_digital_bill_btn"),
                                    shape = RoundedCornerShape(12.dp),
                                    color = Color(0x33FFFFFF),
                                    border = BorderStroke(1.dp, Color(0x66FFFFFF)),
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                                    ) {
                                        Icon(
                                            Icons.Rounded.Description,
                                            contentDescription = null,
                                            tint = Color.White,
                                            modifier = Modifier.size(16.dp),
                                        )
                                        Text("Digital Bill", style = MaterialTheme.typography.labelLarge, color = Color.White)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Installed Hardware KPI Strip
        item(key = "kpi_row") {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                KpiMetricCard(
                    title = "Water Level Controllers",
                    value = "$controllerCount",
                    caption = "Installed units",
                    accent = colors.brandPrimary,
                    onClick = { onNavigate(AppDestination.DEVICES) },
                    modifier = Modifier.weight(1f),
                )
                KpiMetricCard(
                    title = "Water Stoppers",
                    value = "$stopperCount",
                    caption = "Cutoff valves",
                    accent = colors.brandAccent,
                    onClick = { onNavigate(AppDestination.DEVICES) },
                    modifier = Modifier.weight(1f),
                )
            }
        }

        // Featured Live Warranty Pulse Card
        if (primaryUnit != null) {
            item(key = "featured_warranty_pulse") {
                val remDays = primaryUnit.daysRemaining(today)
                AquaCard(
                    onClick = { onNavigate(AppDestination.WARRANTY) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("home_warranty_pulse_card"),
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "PRIMARY WARRANTY COUNTDOWN",
                                style = MaterialTheme.typography.labelSmall,
                                color = colors.brandPrimary,
                            )
                            Spacer(Modifier.height(2.dp))
                            Text(
                                text = primaryUnit.productName,
                                style = MaterialTheme.typography.titleMedium,
                                color = colors.textPrimary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                            Text(
                                text = "${primaryUnit.locationTag} • Expires ${primaryUnit.expiryDateFormatted()}",
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.textSecondary,
                            )
                        }
                        Spacer(Modifier.width(10.dp))
                        WarrantyStatusPill(health = primaryUnit.warrantyHealth(today))
                    }
                    Spacer(Modifier.height(14.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.Bottom,
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Row(verticalAlignment = Alignment.Bottom) {
                            Text(
                                text = "$remDays",
                                fontFamily = JetBrainsMonoFamily,
                                fontWeight = FontWeight.Bold,
                                fontSize = 34.sp,
                                color = colors.brandPrimary,
                            )
                            Spacer(Modifier.width(6.dp))
                            Text(
                                text = "days remaining / ${primaryUnit.warrantyTotalDays}",
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.textSecondary,
                                modifier = Modifier.padding(bottom = 6.dp),
                            )
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Open Graph",
                                style = MaterialTheme.typography.labelLarge,
                                color = colors.brandPrimary,
                            )
                            Spacer(Modifier.width(4.dp))
                            Icon(
                                imageVector = Icons.AutoMirrored.Rounded.ArrowForward,
                                contentDescription = "Open warranty graph",
                                tint = colors.brandPrimary,
                                modifier = Modifier.size(16.dp),
                            )
                        }
                    }
                }
            }
        }

        // Quick-Access Suite Grid (All 7 Destinations 1-Tap Accessible)
        item(key = "quick_suite_header") {
            Text(
                text = "Customer Workspace",
                style = MaterialTheme.typography.titleLarge,
                color = colors.textPrimary,
            )
        }

        item(key = "quick_suite_grid_1") {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                WorkspaceTile(
                    icon = Icons.Rounded.Calculate,
                    title = "Hisab-Kitab",
                    subtitle = "Totals, splits & tape",
                    onClick = { onNavigate(AppDestination.CALCULATOR) },
                    modifier = Modifier
                        .weight(1f)
                        .testTag("home_tile_calculator"),
                )
                WorkspaceTile(
                    icon = Icons.Rounded.EditNote,
                    title = "Notepad Sync",
                    subtitle = "${notes.size} notes • Drive & Gmail",
                    onClick = { onNavigate(AppDestination.NOTEPAD) },
                    modifier = Modifier
                        .weight(1f)
                        .testTag("home_tile_notepad"),
                )
            }
        }

        item(key = "quick_suite_grid_2") {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                WorkspaceTile(
                    icon = Icons.Rounded.Apps,
                    title = "New Tab Hub",
                    subtitle = "Brand apps & web tools",
                    onClick = { onNavigate(AppDestination.APPS_HUB) },
                    modifier = Modifier
                        .weight(1f)
                        .testTag("home_tile_apps_hub"),
                )
                WorkspaceTile(
                    icon = Icons.Rounded.BuildCircle,
                    title = "Service Desk",
                    subtitle = if (openTickets > 0) "$openTickets open request(s)" else "1-click technician visit",
                    onClick = { onNavigate(AppDestination.DEVICES) },
                    modifier = Modifier
                        .weight(1f)
                        .testTag("home_tile_service"),
                )
            }
        }

        item(key = "dpdp_footer_card") {
            AquaCard(
                onClick = { onNavigate(AppDestination.PRIVACY) },
                contentPadding = PaddingValues(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("home_privacy_card"),
            ) {
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
                        Icon(
                            imageVector = Icons.Rounded.Shield,
                            contentDescription = "DPDP Privacy",
                            tint = colors.brandPrimary,
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "DPDP Act Privacy & Theme Settings",
                            style = MaterialTheme.typography.titleSmall,
                            color = colors.textPrimary,
                        )
                        Text(
                            text = if (profile?.dpdpConsentAccepted == true) {
                                "Consent Active (v${profile.dpdpConsentVersion}) • Tap to manage rights"
                            } else {
                                "Review data purpose, export or withdraw consent anytime"
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.textSecondary,
                        )
                    }
                    Icon(
                        imageVector = Icons.AutoMirrored.Rounded.ArrowForward,
                        contentDescription = null,
                        tint = colors.textSecondary,
                        modifier = Modifier.size(18.dp),
                    )
                }
            }
        }

        item { Spacer(Modifier.height(12.dp)) }
    }
}

@Composable
private fun KpiMetricCard(
    title: String,
    value: String,
    caption: String,
    accent: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = LocalAquaVaultColors.current
    AquaCard(
        modifier = modifier,
        onClick = onClick,
        contentPadding = PaddingValues(16.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(colors.brandTint),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = Icons.Rounded.WaterDrop,
                    contentDescription = null,
                    tint = accent,
                    modifier = Modifier.size(18.dp),
                )
            }
            Text(
                text = value,
                fontFamily = JetBrainsMonoFamily,
                fontWeight = FontWeight.Bold,
                fontSize = 26.sp,
                color = accent,
            )
        }
        Spacer(Modifier.height(10.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.titleSmall,
            color = colors.textPrimary,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
        )
        Text(
            text = caption,
            style = MaterialTheme.typography.bodySmall,
            color = colors.textSecondary,
        )
    }
}

@Composable
private fun WorkspaceTile(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = LocalAquaVaultColors.current
    AquaCard(
        modifier = modifier,
        onClick = onClick,
        contentPadding = PaddingValues(15.dp),
    ) {
        Box(
            modifier = Modifier
                .size(38.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(colors.brandTint),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = colors.brandPrimary,
                modifier = Modifier.size(20.dp),
            )
        }
        Spacer(Modifier.height(10.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.titleSmall,
            color = colors.textPrimary,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        Text(
            text = subtitle,
            style = MaterialTheme.typography.bodySmall,
            color = colors.textSecondary,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}
