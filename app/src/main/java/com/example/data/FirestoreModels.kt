package com.example.data

import androidx.annotation.Keep
import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.IgnoreExtraProperties
import com.google.firebase.firestore.ServerTimestamp
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import kotlin.math.max
import kotlin.math.min

enum class DeviceCategory(val firestoreValue: String, val displayLabel: String) {
    WATER_LEVEL_CONTROLLER("WATER_LEVEL_CONTROLLER", "Water Level Controller"),
    WATER_STOPPER("WATER_STOPPER", "Water Stopper");

    companion object {
        fun fromRaw(raw: String): DeviceCategory =
            entries.firstOrNull { it.firestoreValue == raw } ?: WATER_LEVEL_CONTROLLER
    }
}

enum class UnitHealthStatus(val firestoreValue: String, val displayLabel: String) {
    ONLINE("ONLINE", "Active & Optimal"),
    STANDBY("STANDBY", "Standby Guard"),
    ATTENTION("ATTENTION", "Check Recommended");

    companion object {
        fun fromRaw(raw: String): UnitHealthStatus =
            entries.firstOrNull { it.firestoreValue == raw } ?: ONLINE
    }
}

enum class WarrantyHealth {
    ACTIVE,
    EXPIRING_SOON,
    EXPIRED,
}

enum class CalcMode(val firestoreValue: String, val label: String) {
    STANDARD("STANDARD", "Standard"),
    QTY_RATE("QTY_RATE", "Qty × Rate"),
    SPLIT("SPLIT", "Split"),
    MARGIN("MARGIN", "Margin");

    companion object {
        fun fromRaw(raw: String): CalcMode =
            entries.firstOrNull { it.firestoreValue == raw } ?: STANDARD
    }
}

@Keep
@IgnoreExtraProperties
data class CustomerProfile(
    @DocumentId val id: String = "",
    val userId: String = "",
    val displayName: String = "",
    val email: String = "",
    val customerCode: String = "",
    val phone: String = "",
    val address: String = "",
    val darkModeEnabled: Boolean = false,
    val dpdpConsentAccepted: Boolean = false,
    val dpdpConsentVersion: String = "2026.1",
    val gmailSyncEnabled: Boolean = true,
    val driveAutoSaveEnabled: Boolean = true,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null,
)

@Keep
@IgnoreExtraProperties
data class WarrantyUnit(
    @DocumentId val id: String = "",
    val userId: String = "",
    val deviceType: String = DeviceCategory.WATER_LEVEL_CONTROLLER.firestoreValue,
    val productName: String = "",
    val modelCode: String = "",
    val serialNumber: String = "",
    val locationTag: String = "",
    val installEpochDay: Long = 20500L,
    val warrantyTotalDays: Long = 365L,
    val unitStatus: String = UnitHealthStatus.ONLINE.firestoreValue,
    val invoiceNumber: String = "",
    val purchaseAmountInr: Double = 0.0,
    val gstAmountInr: Double = 0.0,
    val dealerName: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null,
) {
    val category: DeviceCategory
        get() = DeviceCategory.fromRaw(deviceType)

    val healthStatus: UnitHealthStatus
        get() = UnitHealthStatus.fromRaw(unitStatus)

    val expiryEpochDay: Long
        get() = installEpochDay + warrantyTotalDays

    val grandTotalInr: Double
        get() = purchaseAmountInr + gstAmountInr

    fun daysRemaining(todayEpochDay: Long = currentUtcEpochDay()): Long =
        max(0L, expiryEpochDay - todayEpochDay)

    fun daysElapsed(todayEpochDay: Long = currentUtcEpochDay()): Long =
        min(warrantyTotalDays, max(0L, todayEpochDay - installEpochDay))

    fun warrantyHealth(todayEpochDay: Long = currentUtcEpochDay()): WarrantyHealth {
        val rem = daysRemaining(todayEpochDay)
        return when {
            rem <= 0L -> WarrantyHealth.EXPIRED
            rem <= 45L -> WarrantyHealth.EXPIRING_SOON
            else -> WarrantyHealth.ACTIVE
        }
    }

    fun installDateFormatted(): String = formatEpochDay(installEpochDay)
    fun expiryDateFormatted(): String = formatEpochDay(expiryEpochDay)

    fun buildCountdownCurve(todayEpochDay: Long = currentUtcEpochDay()): List<CountdownPoint> {
        val total = max(1L, warrantyTotalDays)
        val steps = min(36, total.toInt())
        val points = ArrayList<CountdownPoint>(steps + 2)
        for (i in 0..steps) {
            val dayOffset = ((i.toDouble() / steps) * total).toLong()
            val epochDay = installEpochDay + dayOffset
            val remaining = max(0L, total - dayOffset)
            points.add(
                CountdownPoint(
                    epochDay = epochDay,
                    dateLabel = formatEpochDayShort(epochDay),
                    fullDateLabel = formatEpochDay(epochDay),
                    remainingDays = remaining,
                    progress = dayOffset.toFloat() / total.toFloat(),
                    isPastOrToday = epochDay <= todayEpochDay,
                )
            )
        }
        return points
    }
}

data class CountdownPoint(
    val epochDay: Long,
    val dateLabel: String,
    val fullDateLabel: String,
    val remainingDays: Long,
    val progress: Float,
    val isPastOrToday: Boolean,
)

@Keep
@IgnoreExtraProperties
data class ServiceRequest(
    @DocumentId val id: String = "",
    val userId: String = "",
    val ticketNumber: String = "",
    val warrantyId: String = "",
    val deviceLabel: String = "",
    val issueCategory: String = "",
    val issueNote: String = "",
    val preferredSlot: String = "",
    val status: String = "LOGGED",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null,
)

@Keep
@IgnoreExtraProperties
data class CalcEntry(
    @DocumentId val id: String = "",
    val userId: String = "",
    val label: String = "",
    val expression: String = "",
    val resultValue: Double = 0.0,
    val resultFormatted: String = "",
    val mode: String = CalcMode.STANDARD.firestoreValue,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null,
)

@Keep
@IgnoreExtraProperties
data class PersonalNote(
    @DocumentId val id: String = "",
    val userId: String = "",
    val title: String = "",
    val content: String = "",
    val tag: String = "Personal",
    val pinned: Boolean = false,
    val gmailSyncState: String = "SYNCED",
    val driveSyncState: String = "AUTO_SAVED",
    val lastSyncedLabel: String = "Synced just now",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null,
)

@Keep
@IgnoreExtraProperties
data class PrivacyAuditLog(
    @DocumentId val id: String = "",
    val userId: String = "",
    val actionType: String = "CONSENT_GRANTED",
    val details: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null,
)

data class BrandEcosystemApp(
    val id: String,
    val title: String,
    val subtitle: String,
    val badge: String, // "New App", "Website", "Tool"
    val targetUrl: String,
    val highlightTag: String,
    val iconKey: String,
)

object BrandEcosystemCatalog {
    val defaultItems: List<BrandEcosystemApp> = listOf(
        BrandEcosystemApp(
            id = "aquavault_web_portal",
            title = "AquaVault Official Portal",
            subtitle = "Explore flagship Pro-X7 Water Level Controllers, Brass Solenoid Stoppers & installation manuals.",
            badge = "Website",
            targetUrl = "https://www.aquavault.in",
            highlightTag = "Official Store",
            iconKey = "globe",
        ),
        BrandEcosystemApp(
            id = "smart_pump_companion",
            title = "AquaSense Telemetry App",
            subtitle = "Next-gen Wi-Fi & LoRa tank level alerts, dry-run protection logs & automated pump schedules.",
            badge = "New App",
            targetUrl = "https://play.google.com/store",
            highlightTag = "Early Access",
            iconKey = "sensors",
        ),
        BrandEcosystemApp(
            id = "tank_volume_planner",
            title = "Tank Capacity & Flow Estimator",
            subtitle = "Compute overhead & underground sump litre capacity, fill time, and HP motor sizing instantly.",
            badge = "Tool",
            targetUrl = "https://www.calculator.net/volume-calculator.html",
            highlightTag = "Engineering Tool",
            iconKey = "gauge",
        ),
        BrandEcosystemApp(
            id = "water_care_guides",
            title = "Installation & Care Video Hub",
            subtitle = "Step-by-step wiring diagrams, probe cleaning guides, and monsoon surge-protection tips.",
            badge = "Website",
            targetUrl = "https://www.youtube.com/results?search_query=water+level+controller+installation",
            highlightTag = "HD Guides",
            iconKey = "video",
        ),
        BrandEcosystemApp(
            id = "dealer_network",
            title = "Authorized Service Network",
            subtitle = "Locate certified AquaVault installation partners, genuine SS-316 probes & spare valves near you.",
            badge = "Tool",
            targetUrl = "https://maps.google.com/?q=water+level+controller+service+center",
            highlightTag = "Pan-India",
            iconKey = "location",
        ),
        BrandEcosystemApp(
            id = "solar_pump_suite",
            title = "AquaSolar Smart Controller",
            subtitle = "Upcoming solar-powered agricultural & residential water automation companion suite.",
            badge = "New App",
            targetUrl = "https://www.google.com/search?q=smart+solar+water+level+controller",
            highlightTag = "Coming Next",
            iconKey = "bolt",
        ),
    )
}

/**
 * Clean service boundary for future Google Workspace OAuth / Drive API / Gmail API wiring.
 * Out of the box, Cloud Firestore persists notes across devices with offline caching,
 * while Android Intents & Storage Access Framework provide instant Gmail & Google Drive export.
 */
interface CloudNoteSyncGateway {
    fun buildGmailSubject(note: PersonalNote): String
    fun buildDriveDocumentBody(note: PersonalNote, userEmail: String): String
    fun computeSyncState(gmailEnabled: Boolean, driveEnabled: Boolean): Pair<String, String>
}

class DefaultCloudNoteSyncGateway : CloudNoteSyncGateway {
    override fun buildGmailSubject(note: PersonalNote): String =
        "[AquaVault Note • ${note.tag}] ${note.title}"

    override fun buildDriveDocumentBody(note: PersonalNote, userEmail: String): String {
        val timestamp = formatTimestamp(note.updatedAt ?: note.createdAt ?: Timestamp.now())
        return buildString {
            appendLine("AQUAVAULT PERSONAL NOTEPAD — GOOGLE DRIVE BACKUP")
            appendLine("Account: $userEmail")
            appendLine("Title: ${note.title}")
            appendLine("Tag: ${note.tag}")
            appendLine("Last Updated: $timestamp")
            appendLine("--------------------------------------------------")
            appendLine()
            appendLine(note.content)
        }
    }

    override fun computeSyncState(gmailEnabled: Boolean, driveEnabled: Boolean): Pair<String, String> {
        val gmail = if (gmailEnabled) "SYNCED" else "DISABLED"
        val drive = if (driveEnabled) "AUTO_SAVED" else "OFFLINE_LOCAL"
        return gmail to drive
    }
}

fun currentUtcEpochDay(): Long = System.currentTimeMillis() / 86_400_000L

fun formatEpochDay(epochDay: Long): String {
    val sdf = SimpleDateFormat("dd MMM yyyy", Locale.ENGLISH).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }
    return sdf.format(Date(epochDay * 86_400_000L))
}

fun formatEpochDayShort(epochDay: Long): String {
    val sdf = SimpleDateFormat("dd MMM", Locale.ENGLISH).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }
    return sdf.format(Date(epochDay * 86_400_000L))
}

fun formatTimestamp(ts: Timestamp?): String {
    val date = (ts ?: Timestamp.now()).toDate()
    val sdf = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.ENGLISH)
    return sdf.format(date)
}

fun formatInr(amount: Double): String {
    val formatter = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
    return formatter.format(amount)
}
