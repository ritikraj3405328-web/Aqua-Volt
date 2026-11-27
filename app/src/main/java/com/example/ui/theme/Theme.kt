package com.example.ui.theme

import android.app.Activity
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.dp
import androidx.core.view.WindowCompat

private val DayMaterialColorScheme = lightColorScheme(
    primary = DayPrimaryPurple,
    onPrimary = Color.White,
    primaryContainer = DayLavenderTint,
    onPrimaryContainer = DayTextPrimary,
    secondary = DaySecondaryViolet,
    onSecondary = Color.White,
    secondaryContainer = DayLavenderTint,
    onSecondaryContainer = DayTextPrimary,
    tertiary = StatusEmerald,
    onTertiary = Color.White,
    background = DayBgSecondary,
    onBackground = DayTextPrimary,
    surface = DayCardSurface,
    onSurface = DayTextPrimary,
    surfaceVariant = DayBgPrimary,
    onSurfaceVariant = DayTextSecondary,
    outline = DayCardBorder,
    outlineVariant = DayCardBorder,
    error = StatusRose,
    onError = Color.White,
)

private val NightMaterialColorScheme = darkColorScheme(
    primary = NightPrimaryViolet,
    onPrimary = NightBgPrimary,
    primaryContainer = NightLavenderTint,
    onPrimaryContainer = NightTextPrimary,
    secondary = NightSecondaryViolet,
    onSecondary = Color.White,
    secondaryContainer = NightLavenderTint,
    onSecondaryContainer = NightTextPrimary,
    tertiary = Color(0xFF34D399),
    onTertiary = NightBgPrimary,
    background = NightBgPrimary,
    onBackground = NightTextPrimary,
    surface = NightCardSurface,
    onSurface = NightTextPrimary,
    surfaceVariant = NightBgSecondary,
    onSurfaceVariant = NightTextSecondary,
    outline = NightCardBorder,
    outlineVariant = NightCardBorder,
    error = Color(0xFFF87171),
    onError = NightBgPrimary,
)

private val AquaVaultShapes = Shapes(
    small = RoundedCornerShape(10.dp),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(22.dp),
    extraLarge = RoundedCornerShape(28.dp),
)

@Composable
fun AquaVaultTheme(
    darkTheme: Boolean,
    content: @Composable () -> Unit,
) {
    val colorScheme = if (darkTheme) NightMaterialColorScheme else DayMaterialColorScheme
    val extraColors = if (darkTheme) NightAquaVaultColors else DayAquaVaultColors

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window ?: return@SideEffect
            val controller = WindowCompat.getInsetsController(window, view)
            controller.isAppearanceLightStatusBars = !darkTheme
            controller.isAppearanceLightNavigationBars = !darkTheme
        }
    }

    CompositionLocalProvider(LocalAquaVaultColors provides extraColors) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = AquaVaultTypography,
            shapes = AquaVaultShapes,
            content = content,
        )
    }
}
