package com.example.ui

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.Backspace
import androidx.compose.material.icons.rounded.BookmarkAdd
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.History
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.CalcEntry
import com.example.data.CalcMode
import com.example.data.formatInr
import com.example.ui.theme.JetBrainsMonoFamily
import com.example.ui.theme.LocalAquaVaultColors
import java.text.DecimalFormat
import kotlin.math.abs

@Composable
fun CalculatorScreen(
    calcEntries: List<CalcEntry>,
    onSaveEntry: (String, String, Double, String, CalcMode) -> Unit,
    onDeleteEntry: (String) -> Unit,
) {
    val colors = LocalAquaVaultColors.current
    var mode by remember { mutableStateOf(CalcMode.STANDARD) }
    var noteLabel by remember { mutableStateOf("") }

    // Standard Keypad State
    var expression by remember { mutableStateOf("") }
    var lastResult by remember { mutableStateOf("0") }

    // Qty × Rate State
    var qtyText by remember { mutableStateOf("4") }
    var rateText by remember { mutableStateOf("1250") }
    var gstText by remember { mutableStateOf("18") }

    // Split State
    var splitTotalText by remember { mutableStateOf("18000") }
    var splitCountText by remember { mutableStateOf("6") }

    // Margin State
    var costText by remember { mutableStateOf("8500") }
    var sellText by remember { mutableStateOf("11200") }

    val runningTapeSum = remember(calcEntries) {
        calcEntries.sumOf { it.resultValue }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .testTag("calculator_screen"),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        // Mode Selector Pills
        item(key = "calc_modes") {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(CalcMode.entries) { m ->
                    val selected = m == mode
                    FilterChip(
                        selected = selected,
                        onClick = { mode = m },
                        modifier = Modifier.testTag("calc_mode_${m.firestoreValue}"),
                        label = { Text(m.label) },
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

        // Optional Hisab-Kitab Memo Label
        item(key = "calc_label_input") {
            OutlinedTextField(
                value = noteLabel,
                onValueChange = { if (it.length <= 120) noteLabel = it },
                label = { Text("Hisab Label (optional, e.g., Tank fittings, Plumber bill)") },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("calc_label_field"),
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = colors.brandPrimary,
                    unfocusedBorderColor = colors.cardBorder,
                    focusedTextColor = colors.textPrimary,
                    unfocusedTextColor = colors.textPrimary,
                ),
            )
        }

        // Active Calculator Mode Workspace
        item(key = "calc_body") {
            when (mode) {
                CalcMode.STANDARD -> {
                    StandardHisabKeypad(
                        expression = expression,
                        resultText = lastResult,
                        onAppend = { token ->
                            expression += token
                            evaluateExpressionSafe(expression)?.let { lastResult = formatNumber(it) }
                        },
                        onBackspace = {
                            if (expression.isNotEmpty()) {
                                expression = expression.dropLast(1)
                                lastResult = evaluateExpressionSafe(expression)?.let { formatNumber(it) } ?: "0"
                            }
                        },
                        onClear = {
                            expression = ""
                            lastResult = "0"
                        },
                        onEquals = {
                            val evaluated = evaluateExpressionSafe(expression)
                            if (evaluated != null) {
                                val fmt = formatNumber(evaluated)
                                lastResult = fmt
                                onSaveEntry(
                                    noteLabel.ifBlank { "Quick Hisab" },
                                    expression,
                                    evaluated,
                                    fmt,
                                    CalcMode.STANDARD,
                                )
                                expression = fmt.replace(",", "")
                                noteLabel = ""
                            }
                        },
                    )
                }

                CalcMode.QTY_RATE -> {
                    val qty = qtyText.toDoubleOrNull() ?: 0.0
                    val rate = rateText.toDoubleOrNull() ?: 0.0
                    val gst = gstText.toDoubleOrNull() ?: 0.0
                    val base = qty * rate
                    val tax = base * (gst / 100.0)
                    val total = base + tax

                    AquaCard(modifier = Modifier.fillMaxWidth()) {
                        Text("Quantity × Rate + GST Hisab", style = MaterialTheme.typography.titleMedium, color = colors.textPrimary)
                        Spacer(Modifier.height(12.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            NumericField("Quantity", qtyText, { qtyText = it }, Modifier.weight(1f))
                            NumericField("Rate (₹)", rateText, { rateText = it }, Modifier.weight(1f))
                            NumericField("GST %", gstText, { gstText = it }, Modifier.weight(0.8f))
                        }
                        Spacer(Modifier.height(14.dp))
                        HisabResultStrip(
                            subtitle = "Base ${formatInr(base)} + Tax ${formatInr(tax)}",
                            primaryValue = formatInr(total),
                        )
                        Spacer(Modifier.height(12.dp))
                        Button(
                            onClick = {
                                if (total > 0.0) {
                                    onSaveEntry(
                                        noteLabel.ifBlank { "Qty × Rate Entry" },
                                        "$qty × ₹$rate (+${gst}% GST)",
                                        total,
                                        formatInr(total),
                                        CalcMode.QTY_RATE,
                                    )
                                    noteLabel = ""
                                }
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                                .testTag("calc_save_qty_rate"),
                            colors = ButtonDefaults.buttonColors(containerColor = colors.brandPrimary),
                            shape = RoundedCornerShape(14.dp),
                        ) {
                            Icon(Icons.Rounded.BookmarkAdd, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("Save to Hisab Tape")
                        }
                    }
                }

                CalcMode.SPLIT -> {
                    val totalAmt = splitTotalText.toDoubleOrNull() ?: 0.0
                    val count = (splitCountText.toDoubleOrNull() ?: 1.0).coerceAtLeast(1.0)
                    val perShare = totalAmt / count

                    AquaCard(modifier = Modifier.fillMaxWidth()) {
                        Text("Society / Flat Expense Splitter", style = MaterialTheme.typography.titleMedium, color = colors.textPrimary)
                        Spacer(Modifier.height(12.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            NumericField("Total Amount (₹)", splitTotalText, { splitTotalText = it }, Modifier.weight(1.3f))
                            NumericField("Flats / People", splitCountText, { splitCountText = it }, Modifier.weight(1f))
                        }
                        Spacer(Modifier.height(14.dp))
                        HisabResultStrip(
                            subtitle = "Each share across ${count.toInt()} unit(s)",
                            primaryValue = formatInr(perShare),
                        )
                        Spacer(Modifier.height(12.dp))
                        Button(
                            onClick = {
                                if (perShare > 0.0) {
                                    onSaveEntry(
                                        noteLabel.ifBlank { "Shared Water Split" },
                                        "${formatInr(totalAmt)} ÷ ${count.toInt()} shares",
                                        perShare,
                                        "${formatInr(perShare)} / each",
                                        CalcMode.SPLIT,
                                    )
                                    noteLabel = ""
                                }
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                                .testTag("calc_save_split"),
                            colors = ButtonDefaults.buttonColors(containerColor = colors.brandPrimary),
                            shape = RoundedCornerShape(14.dp),
                        ) {
                            Icon(Icons.Rounded.BookmarkAdd, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("Save Split to Tape")
                        }
                    }
                }

                CalcMode.MARGIN -> {
                    val cost = costText.toDoubleOrNull() ?: 0.0
                    val sell = sellText.toDoubleOrNull() ?: 0.0
                    val profit = sell - cost
                    val marginPct = if (sell > 0.0) (profit / sell) * 100.0 else 0.0

                    AquaCard(modifier = Modifier.fillMaxWidth()) {
                        Text("Profit & Margin Estimator", style = MaterialTheme.typography.titleMedium, color = colors.textPrimary)
                        Spacer(Modifier.height(12.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            NumericField("Cost Price (₹)", costText, { costText = it }, Modifier.weight(1f))
                            NumericField("Selling Price (₹)", sellText, { sellText = it }, Modifier.weight(1f))
                        }
                        Spacer(Modifier.height(14.dp))
                        HisabResultStrip(
                            subtitle = "Margin ${String.format("%.1f", marginPct)}% on selling price",
                            primaryValue = "${if (profit >= 0) "+" else ""}${formatInr(profit)}",
                        )
                        Spacer(Modifier.height(12.dp))
                        Button(
                            onClick = {
                                onSaveEntry(
                                    noteLabel.ifBlank { "Margin Check" },
                                    "Sell ₹$sell - Cost ₹$cost (${String.format("%.1f", marginPct)}%)",
                                    profit,
                                    formatInr(profit),
                                    CalcMode.MARGIN,
                                )
                                noteLabel = ""
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                                .testTag("calc_save_margin"),
                            colors = ButtonDefaults.buttonColors(containerColor = colors.brandPrimary),
                            shape = RoundedCornerShape(14.dp),
                        ) {
                            Icon(Icons.Rounded.BookmarkAdd, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("Save Margin to Tape")
                        }
                    }
                }
            }
        }

        // Persistent Running Calculation History / Tape Header
        item(key = "tape_header") {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Rounded.History, contentDescription = null, tint = colors.brandPrimary)
                    Text(
                        text = "Hisab-Kitab Tape (${calcEntries.size})",
                        style = MaterialTheme.typography.titleMedium,
                        color = colors.textPrimary,
                    )
                }
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = colors.brandTint,
                ) {
                    Text(
                        text = "Sum: ${formatNumber(runningTapeSum)}",
                        fontFamily = JetBrainsMonoFamily,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = colors.brandPrimary,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                    )
                }
            }
        }

        if (calcEntries.isEmpty()) {
            item(key = "tape_empty") {
                AquaCard(modifier = Modifier.fillMaxWidth()) {
                    Text("Your Hisab tape is ready", style = MaterialTheme.typography.titleSmall, color = colors.textPrimary)
                    Text(
                        text = "Tap = or Save to Tape to keep a permanent cloud-synced ledger of your daily calculations.",
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.textSecondary,
                    )
                }
            }
        } else {
            items(calcEntries, key = { it.id }) { entry ->
                AquaCard(
                    onClick = {
                        mode = CalcMode.STANDARD
                        expression = formatPlainDouble(entry.resultValue)
                        lastResult = entry.resultFormatted
                    },
                    contentPadding = PaddingValues(14.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                            ) {
                                Text(
                                    text = entry.label.ifBlank { CalcMode.fromRaw(entry.mode).label },
                                    style = MaterialTheme.typography.titleSmall,
                                    color = colors.textPrimary,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = colors.brandTint,
                                ) {
                                    Text(
                                        text = CalcMode.fromRaw(entry.mode).label,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = colors.brandPrimary,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                    )
                                }
                            }
                            Text(
                                text = entry.expression,
                                fontFamily = JetBrainsMonoFamily,
                                fontSize = 12.sp,
                                color = colors.textSecondary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = entry.resultFormatted,
                            fontFamily = JetBrainsMonoFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = colors.brandPrimary,
                        )
                        IconButton(onClick = { onDeleteEntry(entry.id) }) {
                            Icon(
                                imageVector = Icons.Rounded.DeleteOutline,
                                contentDescription = "Delete calculation entry",
                                tint = colors.textSecondary,
                                modifier = Modifier.size(20.dp),
                            )
                        }
                    }
                }
            }
        }

        item { Spacer(Modifier.height(12.dp)) }
    }
}

@Composable
private fun StandardHisabKeypad(
    expression: String,
    resultText: String,
    onAppend: (String) -> Unit,
    onBackspace: () -> Unit,
    onClear: () -> Unit,
    onEquals: () -> Unit,
) {
    val colors = LocalAquaVaultColors.current
    AquaCard(modifier = Modifier.fillMaxWidth(), contentPadding = PaddingValues(16.dp)) {
        // Digital Display Screen
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = colors.subtleSurface,
            border = BorderStroke(1.dp, colors.cardBorder),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                horizontalAlignment = Alignment.End,
            ) {
                Text(
                    text = expression.ifEmpty { "0" },
                    fontFamily = JetBrainsMonoFamily,
                    fontSize = 15.sp,
                    color = colors.textSecondary,
                    maxLines = 2,
                    textAlign = TextAlign.End,
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = resultText,
                    fontFamily = JetBrainsMonoFamily,
                    fontWeight = FontWeight.Bold,
                    fontSize = 32.sp,
                    color = colors.textPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }

        Spacer(Modifier.height(14.dp))

        val rows = listOf(
            listOf("C", "⌫", "%", "÷"),
            listOf("7", "8", "9", "×"),
            listOf("4", "5", "6", "-"),
            listOf("1", "2", "3", "+"),
            listOf("00", "0", ".", "="),
        )

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            rows.forEach { rowKeys ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    rowKeys.forEach { key ->
                        val isEquals = key == "="
                        val isOp = key in listOf("÷", "×", "-", "+", "%")
                        val isClear = key == "C" || key == "⌫"
                        val bg = when {
                            isEquals -> colors.brandPrimary
                            isOp -> colors.brandTint
                            isClear -> colors.statusExpiredBg
                            else -> colors.subtleSurface
                        }
                        val fg = when {
                            isEquals -> Color.White
                            isOp -> colors.brandPrimary
                            isClear -> colors.statusExpired
                            else -> colors.textPrimary
                        }

                        Surface(
                            onClick = {
                                when (key) {
                                    "C" -> onClear()
                                    "⌫" -> onBackspace()
                                    "=" -> onEquals()
                                    "%" -> onAppend("/100")
                                    else -> onAppend(key)
                                }
                            },
                            modifier = Modifier
                                .weight(1f)
                                .height(54.dp)
                                .testTag("calc_key_$key"),
                            shape = RoundedCornerShape(14.dp),
                            color = bg,
                            border = BorderStroke(1.dp, if (isEquals) colors.brandPrimary else colors.cardBorder),
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                if (key == "⌫") {
                                    Icon(
                                        imageVector = Icons.AutoMirrored.Rounded.Backspace,
                                        contentDescription = "Backspace",
                                        tint = fg,
                                        modifier = Modifier.size(20.dp),
                                    )
                                } else {
                                    Text(
                                        text = key,
                                        fontFamily = JetBrainsMonoFamily,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 19.sp,
                                        color = fg,
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun NumericField(
    label: String,
    value: String,
    onChange: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = LocalAquaVaultColors.current
    OutlinedTextField(
        value = value,
        onValueChange = { raw ->
            if (raw.all { it.isDigit() || it == '.' } && raw.length <= 12) {
                onChange(raw)
            }
        },
        label = { Text(label, maxLines = 1, overflow = TextOverflow.Ellipsis) },
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = colors.brandPrimary,
            unfocusedBorderColor = colors.cardBorder,
            focusedTextColor = colors.textPrimary,
            unfocusedTextColor = colors.textPrimary,
        ),
    )
}

@Composable
private fun HisabResultStrip(
    subtitle: String,
    primaryValue: String,
) {
    val colors = LocalAquaVaultColors.current
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = colors.brandTint,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = colors.textSecondary,
                modifier = Modifier.weight(1f),
            )
            Spacer(Modifier.width(8.dp))
            Text(
                text = primaryValue,
                fontFamily = JetBrainsMonoFamily,
                fontWeight = FontWeight.Bold,
                fontSize = 20.sp,
                color = colors.brandPrimary,
            )
        }
    }
}

private fun evaluateExpressionSafe(raw: String): Double? {
    val clean = raw.replace("×", "*").replace("÷", "/").replace(" ", "")
    if (clean.isBlank()) return null
    return try {
        val tokens = tokenizeMath(clean)
        if (tokens.isEmpty()) return null
        val parser = SimpleMathParser(tokens)
        val res = parser.parseExpression()
        if (res.isFinite()) res else null
    } catch (_: Exception) {
        null
    }
}

private fun tokenizeMath(expr: String): List<String> {
    val out = mutableListOf<String>()
    var i = 0
    while (i < expr.length) {
        val ch = expr[i]
        when {
            ch.isDigit() || ch == '.' -> {
                val start = i
                while (i < expr.length && (expr[i].isDigit() || expr[i] == '.')) i++
                out.add(expr.substring(start, i))
            }
            ch in listOf('+', '-', '*', '/') -> {
                out.add(ch.toString())
                i++
            }
            else -> i++
        }
    }
    return out
}

private class SimpleMathParser(private val tokens: List<String>) {
    private var idx = 0

    fun parseExpression(): Double {
        var value = parseTerm()
        while (idx < tokens.size && (tokens[idx] == "+" || tokens[idx] == "-")) {
            val op = tokens[idx++]
            val right = parseTerm()
            value = if (op == "+") value + right else value - right
        }
        return value
    }

    private fun parseTerm(): Double {
        var value = parseFactor()
        while (idx < tokens.size && (tokens[idx] == "*" || tokens[idx] == "/")) {
            val op = tokens[idx++]
            val right = parseFactor()
            value = if (op == "*") value * right else if (abs(right) > 1e-12) value / right else Double.NaN
        }
        return value
    }

    private fun parseFactor(): Double {
        if (idx >= tokens.size) return 0.0
        if (tokens[idx] == "-") {
            idx++
            return -parseFactor()
        }
        if (tokens[idx] == "+") {
            idx++
            return parseFactor()
        }
        return tokens[idx++].toDoubleOrNull() ?: 0.0
    }
}

private fun formatNumber(value: Double): String {
    val df = DecimalFormat("#,##0.##")
    return df.format(value)
}

private fun formatPlainDouble(value: Double): String {
    return if (value == value.toLong().toDouble()) {
        value.toLong().toString()
    } else {
        String.format("%.2f", value)
    }
}
