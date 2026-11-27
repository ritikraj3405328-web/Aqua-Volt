package com.example.ui

import android.content.Intent
import android.net.Uri
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.OpenInNew
import androidx.compose.material.icons.rounded.Apps
import androidx.compose.material.icons.rounded.Bolt
import androidx.compose.material.icons.rounded.LocationOn
import androidx.compose.material.icons.rounded.PlayCircle
import androidx.compose.material.icons.rounded.Public
import androidx.compose.material.icons.rounded.Sensors
import androidx.compose.material.icons.rounded.Speed
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.data.BrandEcosystemApp
import com.example.data.BrandEcosystemCatalog
import com.example.ui.theme.LocalAquaVaultColors

private val HUB_FILTERS = listOf("All", "New App", "Website", "Tool")

@Composable
fun AppsHubScreen(
    onFeedback: (String) -> Unit,
) {
    val colors = LocalAquaVaultColors.current
    val context = LocalContext.current
    var selectedBadge by remember { mutableStateOf("All") }

    val items = remember(selectedBadge) {
        if (selectedBadge == "All") {
            BrandEcosystemCatalog.defaultItems
        } else {
            BrandEcosystemCatalog.defaultItems.filter { it.badge == selectedBadge }
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .testTag("apps_hub_screen"),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        // Brand Ecosystem Banner
        item(key = "hub_banner") {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(22.dp))
                    .background(
                        Brush.linearGradient(
                            colors = listOf(Color(0xFF4C1D95), Color(0xFF6D28D9), Color(0xFF8B5CF6))
                        )
                    )
                    .padding(20.dp),
            ) {
                Column {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Icon(Icons.Rounded.Apps, contentDescription = null, tint = Color(0xFFEDE9FE), modifier = Modifier.size(20.dp))
                        Text(
                            text = "NEW TAB • BRAND LAUNCHPAD",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color(0xFFEDE9FE),
                        )
                    }
                    Spacer(Modifier.height(6.dp))
                    Text(
                        text = "Future Apps & Websites Hub",
                        style = MaterialTheme.typography.headlineMedium,
                        color = Color.White,
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "Instant 1-click access to every AquaVault companion app, engineering tool, and official web portal.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFFDDD6FE),
                    )
                }
            }
        }

        // Category Filter Row
        item(key = "hub_filters") {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(HUB_FILTERS) { badge ->
                    val selected = badge == selectedBadge
                    FilterChip(
                        selected = selected,
                        onClick = { selectedBadge = badge },
                        modifier = Modifier.testTag("hub_filter_$badge"),
                        label = { Text(badge) },
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

        // 1-Click Ecosystem Cards
        items(items, key = { it.id }) { app ->
            val (badgeFg, badgeBg) = when (app.badge) {
                "New App" -> colors.statusActive to colors.statusActiveBg
                "Website" -> colors.brandPrimary to colors.brandTint
                else -> colors.statusWarning to colors.statusWarningBg
            }

            AquaCard(
                onClick = {
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(app.targetUrl))
                        context.startActivity(intent)
                    } catch (_: Exception) {
                        onFeedback("Could not open link: ${app.targetUrl}")
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("hub_app_card_${app.id}"),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top,
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f),
                    ) {
                        Box(
                            modifier = Modifier
                                .size(46.dp)
                                .clip(RoundedCornerShape(14.dp))
                                .background(colors.brandTint),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(
                                imageVector = hubIconFor(app.iconKey),
                                contentDescription = app.title,
                                tint = colors.brandPrimary,
                                modifier = Modifier.size(24.dp),
                            )
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = app.title,
                                style = MaterialTheme.typography.titleMedium,
                                color = colors.textPrimary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                            Text(
                                text = app.highlightTag,
                                style = MaterialTheme.typography.labelSmall,
                                color = colors.brandPrimary,
                            )
                        }
                    }
                    Spacer(Modifier.width(8.dp))
                    StatusPill(label = app.badge, textColor = badgeFg, backgroundColor = badgeBg)
                }

                Spacer(Modifier.height(10.dp))
                Text(
                    text = app.subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.textSecondary,
                )

                Spacer(Modifier.height(12.dp))
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = colors.subtleSurface,
                    border = BorderStroke(1.dp, colors.cardBorder),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 9.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = "Open in 1 Click",
                            style = MaterialTheme.typography.labelLarge,
                            color = colors.brandPrimary,
                        )
                        Icon(
                            imageVector = Icons.AutoMirrored.Rounded.OpenInNew,
                            contentDescription = "Launch ${app.title}",
                            tint = colors.brandPrimary,
                            modifier = Modifier.size(18.dp),
                        )
                    }
                }
            }
        }

        item { Spacer(Modifier.height(12.dp)) }
    }
}

private fun hubIconFor(key: String): ImageVector = when (key) {
    "globe" -> Icons.Rounded.Public
    "sensors" -> Icons.Rounded.Sensors
    "gauge" -> Icons.Rounded.Speed
    "video" -> Icons.Rounded.PlayCircle
    "location" -> Icons.Rounded.LocationOn
    "bolt" -> Icons.Rounded.Bolt
    else -> Icons.Rounded.Apps
}
