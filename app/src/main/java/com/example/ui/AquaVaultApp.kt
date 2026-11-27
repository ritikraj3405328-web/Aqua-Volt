package com.example.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Apps
import androidx.compose.material.icons.outlined.AutoGraph
import androidx.compose.material.icons.outlined.Calculate
import androidx.compose.material.icons.outlined.DevicesOther
import androidx.compose.material.icons.outlined.EditNote
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.rounded.Apps
import androidx.compose.material.icons.rounded.AutoGraph
import androidx.compose.material.icons.rounded.Calculate
import androidx.compose.material.icons.rounded.DevicesOther
import androidx.compose.material.icons.rounded.EditNote
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material.icons.rounded.WaterDrop
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.NavigationRailItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.credentials.CredentialManager
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.example.R
import com.example.auth.signOutWithCleanup
import com.example.data.AquaVaultRepository
import com.example.data.WarrantyUnit
import com.example.ui.theme.AquaVaultTheme
import com.example.ui.theme.LocalAquaVaultColors
import com.example.viewmodel.AquaVaultViewModel
import com.example.viewmodel.UiState
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.auth
import com.google.firebase.firestore.FirebaseFirestore

enum class AppDestination(
    val routeId: String,
    val label: String,
    val title: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector,
) {
    HOME("home", "Home", "AquaVault", Icons.Rounded.Home, Icons.Outlined.Home),
    WARRANTY("warranty", "Warranty", "Warranty Dashboard", Icons.Rounded.AutoGraph, Icons.Outlined.AutoGraph),
    DEVICES("devices", "Devices", "Devices, Bills & Service", Icons.Rounded.DevicesOther, Icons.Outlined.DevicesOther),
    CALCULATOR("calculator", "Hisab", "Hisab-Kitab Calculator", Icons.Rounded.Calculate, Icons.Outlined.Calculate),
    NOTEPAD("notepad", "Notes", "Notepad & Auto-Sync", Icons.Rounded.EditNote, Icons.Outlined.EditNote),
    APPS_HUB("apps_hub", "New Tab", "Apps & Websites Hub", Icons.Rounded.Apps, Icons.Outlined.Apps),
    PRIVACY("privacy", "Privacy", "DPDP Privacy & Settings", Icons.Rounded.Shield, Icons.Outlined.Shield),
}

private val COMPACT_BOTTOM_TABS = listOf(
    AppDestination.HOME,
    AppDestination.WARRANTY,
    AppDestination.DEVICES,
    AppDestination.CALCULATOR,
    AppDestination.NOTEPAD,
)

@Composable
fun AquaVaultRootApp() {
    var currentUser by remember { mutableStateOf(Firebase.auth.currentUser) }
    var preAuthDarkTheme by remember { mutableStateOf(false) }

    DisposableEffect(Unit) {
        val listener = FirebaseAuth.AuthStateListener { auth ->
            currentUser = auth.currentUser
        }
        Firebase.auth.addAuthStateListener(listener)
        onDispose { Firebase.auth.removeAuthStateListener(listener) }
    }

    val user = currentUser
    if (user == null) {
        AquaVaultTheme(darkTheme = preAuthDarkTheme) {
            AuthScreen(
                isDark = preAuthDarkTheme,
                onToggleDark = { preAuthDarkTheme = !preAuthDarkTheme },
                onAuthSuccess = { currentUser = Firebase.auth.currentUser },
            )
        }
    } else {
        val uid = user.uid
        key(uid) {
            AuthenticatedAquaVaultShell(
                currentUserId = uid,
                userDisplayName = user.displayName ?: "AquaVault Customer",
                userEmail = user.email ?: "",
                onSignedOut = { currentUser = null },
            )
        }
    }
}

@Composable
private fun AuthenticatedAquaVaultShell(
    currentUserId: String,
    userDisplayName: String,
    userEmail: String,
    onSignedOut: () -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val credentialManager = remember(context) { CredentialManager.create(context) }

    val viewModel: AquaVaultViewModel = viewModel(
        key = currentUserId,
        factory = viewModelFactory {
            initializer {
                val app = checkNotNull(this[APPLICATION_KEY]) {
                    "APPLICATION_KEY missing from CreationExtras"
                }
                val databaseId = app.getString(R.string.firestore_database_id)
                val db = FirebaseFirestore.getInstance(databaseId)
                AquaVaultViewModel(
                    repository = AquaVaultRepository(db),
                    currentUserId = currentUserId,
                    userDisplayName = userDisplayName,
                    userEmail = userEmail,
                )
            }
        },
    )

    val profileState by viewModel.profileState.collectAsStateWithLifecycle()
    val warrantiesState by viewModel.warrantiesState.collectAsStateWithLifecycle()
    val serviceRequestsState by viewModel.serviceRequestsState.collectAsStateWithLifecycle()
    val calcEntriesState by viewModel.calcEntriesState.collectAsStateWithLifecycle()
    val notesState by viewModel.notesState.collectAsStateWithLifecycle()
    val privacyLogsState by viewModel.privacyLogsState.collectAsStateWithLifecycle()
    val selectedWarrantyId by viewModel.selectedWarrantyId.collectAsStateWithLifecycle()
    val snackbarMessage by viewModel.snackbarMessage.collectAsStateWithLifecycle()
    val dpdpBannerDismissed by viewModel.dpdpBannerDismissed.collectAsStateWithLifecycle()
    val isBusy by viewModel.isBusy.collectAsStateWithLifecycle()
    val localDarkOverride by viewModel.localDarkOverride.collectAsStateWithLifecycle()

    val profile = (profileState as? UiState.Success)?.data
    val warranties = (warrantiesState as? UiState.Success)?.data ?: emptyList()
    val serviceRequests = (serviceRequestsState as? UiState.Success)?.data ?: emptyList()
    val calcEntries = (calcEntriesState as? UiState.Success)?.data ?: emptyList()
    val notes = (notesState as? UiState.Success)?.data ?: emptyList()
    val privacyLogs = (privacyLogsState as? UiState.Success)?.data ?: emptyList()

    val isDark = localDarkOverride ?: profile?.darkModeEnabled ?: false

    var activeDestination by remember { mutableStateOf(AppDestination.HOME) }
    var billDialogUnit by remember { mutableStateOf<WarrantyUnit?>(null) }

    // Hardware Back button returns to Home cleanly from any secondary page
    BackHandler(enabled = activeDestination != AppDestination.HOME) {
        activeDestination = AppDestination.HOME
    }

    val snackbarHostState = remember { SnackbarHostState() }
    LaunchedEffect(snackbarMessage) {
        val msg = snackbarMessage
        if (msg != null) {
            snackbarHostState.showSnackbar(msg)
            viewModel.clearSnackbar()
        }
    }

    // Surface Firestore stream errors gracefully without crashing
    val streamError = listOf(profileState, warrantiesState, serviceRequestsState, calcEntriesState, notesState)
        .filterIsInstance<UiState.Error>()
        .firstOrNull()?.message

    AquaVaultTheme(darkTheme = isDark) {
        val colors = LocalAquaVaultColors.current

        BoxWithConstraints(
            modifier = Modifier
                .fillMaxSize()
                .background(colors.canvasBackground)
        ) {
            val useNavigationRail = maxWidth >= 680.dp

            Row(modifier = Modifier.fillMaxSize()) {
                if (useNavigationRail) {
                    NavigationRail(
                        modifier = Modifier
                            .fillMaxHeight()
                            .statusBarsPadding()
                            .navigationBarsPadding(),
                        containerColor = colors.elevatedSurface,
                        header = {
                            Box(
                                modifier = Modifier
                                    .padding(vertical = 12.dp)
                                    .size(42.dp)
                                    .clip(RoundedCornerShape(13.dp))
                                    .background(
                                        Brush.linearGradient(
                                            listOf(Color(0xFF4C1D95), Color(0xFF7C3AED))
                                        )
                                    ),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.WaterDrop,
                                    contentDescription = stringResource(R.string.cd_brand_logo),
                                    tint = Color.White,
                                )
                            }
                        },
                    ) {
                        Column(
                            modifier = Modifier.verticalScroll(rememberScrollState()),
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            AppDestination.entries.forEach { dest ->
                                val selected = dest == activeDestination
                                NavigationRailItem(
                                    selected = selected,
                                    onClick = { activeDestination = dest },
                                    modifier = Modifier.testTag("rail_nav_${dest.routeId}"),
                                    icon = {
                                        Icon(
                                            imageVector = if (selected) dest.selectedIcon else dest.unselectedIcon,
                                            contentDescription = dest.label,
                                        )
                                    },
                                    label = { Text(dest.label, maxLines = 1) },
                                    colors = NavigationRailItemDefaults.colors(
                                        selectedIconColor = colors.brandPrimary,
                                        selectedTextColor = colors.brandPrimary,
                                        indicatorColor = colors.brandTint,
                                        unselectedIconColor = colors.textSecondary,
                                        unselectedTextColor = colors.textSecondary,
                                    ),
                                )
                            }
                        }
                    }
                }

                Scaffold(
                    modifier = Modifier.weight(1f),
                    containerColor = colors.canvasBackground,
                    contentWindowInsets = WindowInsets(0, 0, 0, 0),
                    snackbarHost = { SnackbarHost(snackbarHostState) },
                    topBar = {
                        AquaVaultTopHeader(
                            destination = activeDestination,
                            isDark = isDark,
                            showCompactHubActions = !useNavigationRail,
                            onToggleDark = { viewModel.toggleDarkMode(isDark) },
                            onSelectDestination = { activeDestination = it },
                        )
                    },
                    bottomBar = {
                        if (!useNavigationRail) {
                            Surface(
                                color = colors.elevatedSurface,
                                border = BorderStroke(1.dp, colors.cardBorder),
                            ) {
                                NavigationBar(
                                    containerColor = colors.elevatedSurface,
                                    tonalElevation = 0.dp,
                                ) {
                                    COMPACT_BOTTOM_TABS.forEach { dest ->
                                        val selected = dest == activeDestination
                                        NavigationBarItem(
                                            selected = selected,
                                            onClick = { activeDestination = dest },
                                            modifier = Modifier.testTag("bottom_nav_${dest.routeId}"),
                                            icon = {
                                                Icon(
                                                    imageVector = if (selected) dest.selectedIcon else dest.unselectedIcon,
                                                    contentDescription = dest.label,
                                                )
                                            },
                                            label = {
                                                Text(
                                                    text = dest.label,
                                                    maxLines = 1,
                                                    overflow = TextOverflow.Ellipsis,
                                                )
                                            },
                                            colors = NavigationBarItemDefaults.colors(
                                                selectedIconColor = colors.brandPrimary,
                                                selectedTextColor = colors.brandPrimary,
                                                indicatorColor = colors.brandTint,
                                                unselectedIconColor = colors.textSecondary,
                                                unselectedTextColor = colors.textSecondary,
                                            ),
                                        )
                                    }
                                }
                            }
                        }
                    },
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding),
                        contentAlignment = Alignment.TopCenter,
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .widthIn(max = 880.dp),
                        ) {
                            if (streamError != null) {
                                Surface(
                                    color = colors.statusWarningBg,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 16.dp, vertical = 6.dp),
                                    shape = RoundedCornerShape(12.dp),
                                ) {
                                    Text(
                                        text = "Cloud sync notice: $streamError",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = colors.statusWarning,
                                        modifier = Modifier.padding(10.dp),
                                    )
                                }
                            }

                            when (activeDestination) {
                                AppDestination.HOME -> HomeScreen(
                                    profile = profile,
                                    warranties = warranties,
                                    serviceRequests = serviceRequests,
                                    notes = notes,
                                    showDpdpBanner = (profile != null && !profile.dpdpConsentAccepted && !dpdpBannerDismissed),
                                    onAcceptDpdp = { viewModel.setDpdpConsent(true) },
                                    onDismissDpdp = { viewModel.dismissDpdpBannerForSession() },
                                    onNavigate = { activeDestination = it },
                                    onOpenDigitalBill = { billDialogUnit = it },
                                )

                                AppDestination.WARRANTY -> WarrantyDashboardScreen(
                                    profile = profile,
                                    warranties = warranties,
                                    selectedWarrantyId = selectedWarrantyId,
                                    onSelectWarranty = { viewModel.selectWarranty(it) },
                                    onOpenDigitalBill = { billDialogUnit = it },
                                )

                                AppDestination.DEVICES -> DevicesServiceScreen(
                                    warranties = warranties,
                                    serviceRequests = serviceRequests,
                                    isBusy = isBusy,
                                    onOpenDigitalBill = { billDialogUnit = it },
                                    onSubmitService = { unit, cat, note, slot, cb ->
                                        viewModel.submitServiceRequest(unit, cat, note, slot, cb)
                                    },
                                    onResolveService = { viewModel.markServiceResolved(it) },
                                )

                                AppDestination.CALCULATOR -> CalculatorScreen(
                                    calcEntries = calcEntries,
                                    onSaveEntry = { label, expr, value, fmt, m ->
                                        viewModel.saveCalcEntry(label, expr, value, fmt, m)
                                    },
                                    onDeleteEntry = { viewModel.deleteCalcEntry(it) },
                                )

                                AppDestination.NOTEPAD -> NotepadScreen(
                                    profile = profile,
                                    notes = notes,
                                    isBusy = isBusy,
                                    onUpdateSyncPrefs = { g, d -> viewModel.updateNoteSyncPreferences(g, d) },
                                    onSaveNote = { id, t, c, tag, pin, g, d, onDone ->
                                        viewModel.saveNote(id, t, c, tag, pin, g, d, onDone)
                                    },
                                    onTogglePin = { viewModel.togglePinNote(it) },
                                    onDeleteNote = { viewModel.deleteNote(it) },
                                    onFeedback = { viewModel.showMessage(it) },
                                )

                                AppDestination.APPS_HUB -> AppsHubScreen(
                                    onFeedback = { viewModel.showMessage(it) },
                                )

                                AppDestination.PRIVACY -> PrivacySettingsScreen(
                                    profile = profile,
                                    warranties = warranties,
                                    serviceRequests = serviceRequests,
                                    calcEntries = calcEntries,
                                    notes = notes,
                                    privacyLogs = privacyLogs,
                                    isDark = isDark,
                                    isBusy = isBusy,
                                    onToggleDarkMode = { viewModel.toggleDarkMode(isDark) },
                                    onSetDpdpConsent = { viewModel.setDpdpConsent(it) },
                                    onRecordExport = { viewModel.recordDataExport() },
                                    onRequestDeletion = { viewModel.requestDataErasure() },
                                    onSignOut = {
                                        signOutWithCleanup(
                                            credentialManager = credentialManager,
                                            scope = scope,
                                            onSignOutComplete = onSignedOut,
                                        )
                                    },
                                )
                            }
                        }
                    }
                }
            }

            // Digital Warranty Card & Bill Modal Viewer
            val activeBill = billDialogUnit
            if (activeBill != null) {
                DigitalBillAndCertificateDialog(
                    unit = activeBill,
                    profile = profile,
                    onDismiss = { billDialogUnit = null },
                    onFeedback = { viewModel.showMessage(it) },
                )
            }
        }
    }
}

@Composable
private fun AquaVaultTopHeader(
    destination: AppDestination,
    isDark: Boolean,
    showCompactHubActions: Boolean,
    onToggleDark: () -> Unit,
    onSelectDestination: (AppDestination) -> Unit,
) {
    val colors = LocalAquaVaultColors.current
    Surface(
        color = colors.elevatedSurface,
        border = BorderStroke(1.dp, colors.cardBorder),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 14.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.weight(1f),
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(11.dp))
                        .background(
                            Brush.linearGradient(
                                listOf(Color(0xFF4C1D95), Color(0xFF7C3AED))
                            )
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = Icons.Rounded.WaterDrop,
                        contentDescription = stringResource(R.string.cd_brand_logo),
                        tint = Color.White,
                        modifier = Modifier.size(20.dp),
                    )
                }
                Column {
                    Text(
                        text = destination.title,
                        style = MaterialTheme.typography.titleMedium,
                        color = colors.textPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Text(
                        text = "Water Level & Stopper Portal",
                        style = MaterialTheme.typography.labelSmall,
                        color = colors.textSecondary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                if (showCompactHubActions) {
                    IconButton(
                        onClick = { onSelectDestination(AppDestination.APPS_HUB) },
                        modifier = Modifier.testTag("top_nav_apps_hub"),
                    ) {
                        Icon(
                            imageVector = if (destination == AppDestination.APPS_HUB) Icons.Rounded.Apps else Icons.Outlined.Apps,
                            contentDescription = "New Tab Future Apps Hub",
                            tint = if (destination == AppDestination.APPS_HUB) colors.brandPrimary else colors.textSecondary,
                        )
                    }
                    IconButton(
                        onClick = { onSelectDestination(AppDestination.PRIVACY) },
                        modifier = Modifier.testTag("top_nav_privacy"),
                    ) {
                        Icon(
                            imageVector = if (destination == AppDestination.PRIVACY) Icons.Rounded.Shield else Icons.Outlined.Shield,
                            contentDescription = "DPDP Privacy and Settings",
                            tint = if (destination == AppDestination.PRIVACY) colors.brandPrimary else colors.textSecondary,
                        )
                    }
                }
                DayNightToggleButton(isDark = isDark, onToggle = onToggleDark)
            }
        }
    }
}
