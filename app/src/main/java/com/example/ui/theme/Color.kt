package com.example.ui.theme

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

// Day Mode Palette (White + Deep Royal Purple / Violet)
val DayBgPrimary = Color(0xFFFFFFFF)
val DayBgSecondary = Color(0xFFF8F7FC)
val DayCardSurface = Color(0xFFFFFFFF)
val DayCardBorder = Color(0xFFE6E0F8)
val DayPrimaryPurple = Color(0xFF6D28D9)
val DaySecondaryViolet = Color(0xFF7C3AED)
val DayLavenderTint = Color(0xFFEDE9FE)
val DayTextPrimary = Color(0xFF1E1B4B)
val DayTextSecondary = Color(0xFF5B5578)
val DayShadowTint = Color(0x146D28D9)

// Night Mode Palette (True/Deep Black + Luminous Violet)
val NightBgPrimary = Color(0xFF07070B)
val NightBgSecondary = Color(0xFF0E0D14)
val NightCardSurface = Color(0xFF14121E)
val NightCardBorder = Color(0xFF2E244D)
val NightPrimaryViolet = Color(0xFFA78BFA)
val NightSecondaryViolet = Color(0xFF8B5CF6)
val NightLavenderTint = Color(0xFF231B3D)
val NightTextPrimary = Color(0xFFF8FAFC)
val NightTextSecondary = Color(0xFFA59EC2)
val NightShadowTint = Color(0x338B5CF6)

// Shared Semantic Status Colors
val StatusEmerald = Color(0xFF059669)
val StatusEmeraldBgLight = Color(0xFFECFDF5)
val StatusEmeraldBgDark = Color(0xFF062C22)

val StatusAmber = Color(0xFFD97706)
val StatusAmberBgLight = Color(0xFFFFFBEB)
val StatusAmberBgDark = Color(0xFF2E1E06)

val StatusRose = Color(0xFFDC2626)
val StatusRoseBgLight = Color(0xFFFEF2F2)
val StatusRoseBgDark = Color(0xFF310C10)

@Immutable
data class AquaVaultExtraColors(
    val isDark: Boolean,
    val canvasBackground: Color,
    val elevatedSurface: Color,
    val subtleSurface: Color,
    val cardBorder: Color,
    val brandPrimary: Color,
    val brandAccent: Color,
    val brandTint: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val shadowGlow: Color,
    val statusActive: Color,
    val statusActiveBg: Color,
    val statusWarning: Color,
    val statusWarningBg: Color,
    val statusExpired: Color,
    val statusExpiredBg: Color,
)

val DayAquaVaultColors = AquaVaultExtraColors(
    isDark = false,
    canvasBackground = DayBgSecondary,
    elevatedSurface = DayCardSurface,
    subtleSurface = DayBgPrimary,
    cardBorder = DayCardBorder,
    brandPrimary = DayPrimaryPurple,
    brandAccent = DaySecondaryViolet,
    brandTint = DayLavenderTint,
    textPrimary = DayTextPrimary,
    textSecondary = DayTextSecondary,
    shadowGlow = DayShadowTint,
    statusActive = StatusEmerald,
    statusActiveBg = StatusEmeraldBgLight,
    statusWarning = StatusAmber,
    statusWarningBg = StatusAmberBgLight,
    statusExpired = StatusRose,
    statusExpiredBg = StatusRoseBgLight,
)

val NightAquaVaultColors = AquaVaultExtraColors(
    isDark = true,
    canvasBackground = NightBgPrimary,
    elevatedSurface = NightCardSurface,
    subtleSurface = NightBgSecondary,
    cardBorder = NightCardBorder,
    brandPrimary = NightPrimaryViolet,
    brandAccent = NightSecondaryViolet,
    brandTint = NightLavenderTint,
    textPrimary = NightTextPrimary,
    textSecondary = NightTextSecondary,
    shadowGlow = NightShadowTint,
    statusActive = Color(0xFF34D399),
    statusActiveBg = StatusEmeraldBgDark,
    statusWarning = Color(0xFFFBBF24),
    statusWarningBg = StatusAmberBgDark,
    statusExpired = Color(0xFFF87171),
    statusExpiredBg = StatusRoseBgDark,
)

val LocalAquaVaultColors = staticCompositionLocalOf { DayAquaVaultColors }
