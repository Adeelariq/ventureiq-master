import {
  hasFinancialKeywords,
  type FinancialValidationResult,
  validateFinancialInput as baseValidateFinancialInput,
} from "@/lib/validators";

export interface ParsedFinancialRow {
  raw: string[];
  label: string;
  category?: "revenue" | "cost";
  amount: number | null;
}

export interface FinancialColumnsDetection {
  labelIndex: number;
  amountIndex: number;
  categoryIndex?: number;
  hasHeader: boolean;
}

export interface FinancialItem {
  name: string;
  amount: number;
  percentage: number;
}

export interface ComputedFinancials {
  totalRevenue: number;
  totalCosts: number;
  netProfitLoss: number;
  profitMargin: number;
  revenueItems: FinancialItem[];
  costItems: FinancialItem[];
  monthlyTrends: { month: string; revenue: number; costs: number; profit: number }[];
  dataCompleteness: number;
  confidence: number;
  missingFields: string[];
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function parseAmount(rawAmount: string): number | null {
  let normalized = rawAmount
    .replace(/[₹$,]/g, "")
    .replace(/\s/g, "")
    .trim();
  if (!normalized) return null;

  let sign = 1;
  if (/^\(.*\)$/.test(normalized)) {
    sign = -1;
    normalized = normalized.slice(1, -1);
  }
  if (normalized.startsWith("-")) {
    sign = -1;
    normalized = normalized.slice(1);
  }

  const unitMatch = normalized.match(/(cr|crore|l|lac|lakh|k)$/i);
  const unit = unitMatch?.[1]?.toLowerCase();
  if (unit) {
    normalized = normalized.replace(/(cr|crore|l|lac|lakh|k)$/i, "");
  }

  let multiplier = 1;
  if (unit === "cr" || unit === "crore") multiplier = 10_000_000;
  if (unit === "l" || unit === "lac" || unit === "lakh") multiplier = 100_000;
  if (unit === "k") multiplier = 1_000;

  const amount = Number(normalized) * multiplier * sign;
  return Number.isFinite(amount) ? amount : null;
}

export function parseCSV(text: string): string[][] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const delimiters = [",", ";", "\t"];
  const delimiter = delimiters.reduce((best, candidate) => {
    const score = (lines[0]?.match(new RegExp(`\\${candidate}`, "g")) || []).length;
    const bestScore = (lines[0]?.match(new RegExp(`\\${best}`, "g")) || []).length;
    return score > bestScore ? candidate : best;
  }, ",");

  return lines.map((line) => parseCsvLine(line, delimiter));
}

export function detectFinancialColumns(rows: string[][]): FinancialColumnsDetection {
  const firstRow = rows[0] || [];
  const secondRow = rows[1] || [];
  const header = firstRow.map((cell) => cell.toLowerCase());
  const firstRowHasNumeric = firstRow.some((cell) => parseAmount(cell) !== null);
  const secondRowHasNumeric = secondRow.some((cell) => parseAmount(cell) !== null);
  const hasHeader = !firstRowHasNumeric && secondRowHasNumeric;

  const labelIndex = Math.max(
    header.findIndex((h) => /item|name|account|category|line/.test(h)),
    0
  );

  let amountIndex = header.findIndex((h) =>
    /amount|value|total|usd|price|revenue|cost|expense/.test(h)
  );
  if (amountIndex === -1) {
    amountIndex = (hasHeader ? rows[1] : rows[0] || []).findIndex((cell) =>
      Number.isFinite(parseAmount(cell) ?? Number.NaN)
    );
  }
  if (amountIndex === -1) {
    amountIndex = Math.max((rows[0]?.length || 1) - 1, 0);
  }

  const categoryIndex = header.findIndex((h) =>
    /category|type|section/.test(h)
  );

  return {
    labelIndex,
    amountIndex,
    categoryIndex: categoryIndex >= 0 ? categoryIndex : undefined,
    hasHeader,
  };
}

function classifyRow(label: string, categoryCell?: string): "revenue" | "cost" | undefined {
  const source = `${categoryCell || ""} ${label}`.toLowerCase();
  if (/revenue|sales|income|turnover|receipt|top line/.test(source)) return "revenue";
  if (/cost|expense|cogs|opex|payroll|rent|marketing|utility|tax/.test(source)) return "cost";
  return undefined;
}

function isRevenueHeader(header: string): boolean {
  return /revenue|sales|income|turnover|topline/.test(header.toLowerCase());
}

function isCostHeader(header: string): boolean {
  return /cost|expense|spend|salary|cogs|opex|payroll|rent|marketing|utility/.test(
    header.toLowerCase()
  );
}

export function computeMetrics(rows: string[][]): ComputedFinancials {
  const detection = detectFinancialColumns(rows);
  const dataRows = rows.slice(detection.hasHeader ? 1 : 0);
  const headerRow = detection.hasHeader ? rows[0] || [] : [];
  const revenueColumnIndexes = headerRow
    .map((header, index) => ({ header, index }))
    .filter(({ header }) => isRevenueHeader(header))
    .map(({ index }) => index);
  const costColumnIndexes = headerRow
    .map((header, index) => ({ header, index }))
    .filter(({ header }) => isCostHeader(header))
    .map(({ index }) => index);

  let totalRevenue = 0;
  let totalCosts = 0;
  let revenueItems: FinancialItem[] = [];
  let costItems: FinancialItem[] = [];
  let monthlyTrends: { month: string; revenue: number; costs: number; profit: number }[] = [];
  let validAmountCount = 0;
  let totalAmountCells = 0;

  // Wide financial tables: multiple numeric columns (e.g. Revenue_INR, Operational_Cost).
  if (detection.hasHeader && (revenueColumnIndexes.length > 0 || costColumnIndexes.length > 0)) {
    const revenueTotals = new Map<string, number>();
    const costTotals = new Map<string, number>();

    dataRows.forEach((row) => {
      let rowRev = 0;
      let rowCost = 0;
      revenueColumnIndexes.forEach((columnIndex) => {
        totalAmountCells += 1;
        const amount = parseAmount(row[columnIndex] || "");
        if (amount !== null) {
          validAmountCount += 1;
          const key = headerRow[columnIndex] || `Revenue_${columnIndex}`;
          revenueTotals.set(key, (revenueTotals.get(key) || 0) + amount);
          totalRevenue += amount;
          rowRev += amount;
        }
      });
      costColumnIndexes.forEach((columnIndex) => {
        totalAmountCells += 1;
        const amount = parseAmount(row[columnIndex] || "");
        if (amount !== null) {
          validAmountCount += 1;
          const key = headerRow[columnIndex] || `Cost_${columnIndex}`;
          const normalizedAmount = Math.abs(amount);
          costTotals.set(key, (costTotals.get(key) || 0) + normalizedAmount);
          totalCosts += normalizedAmount;
          rowCost += normalizedAmount;
        }
      });
      
      const monthLabel = row[0] || `Period ${monthlyTrends.length + 1}`;
      monthlyTrends.push({
        month: monthLabel,
        revenue: rowRev,
        costs: rowCost,
        profit: rowRev - rowCost
      });
    });

    revenueItems = Array.from(revenueTotals.entries()).map(([name, amount]) => ({
      name,
      amount,
      percentage: 0,
    }));
    costItems = Array.from(costTotals.entries()).map(([name, amount]) => ({
      name,
      amount,
      percentage: 0,
    }));
  } else {
    const parsedRows: ParsedFinancialRow[] = dataRows.map((row) => {
      const label = row[detection.labelIndex] || row[0] || "Unnamed line item";
      const amount = parseAmount(row[detection.amountIndex] || "");
      const categoryCell =
        detection.categoryIndex !== undefined ? row[detection.categoryIndex] : undefined;
      const category = classifyRow(label, categoryCell);
      return { raw: row, label, category, amount };
    });

    const revenueRows = parsedRows.filter(
      (row) => row.category === "revenue" && row.amount !== null
    );
    const costRows = parsedRows.filter((row) => row.category === "cost" && row.amount !== null);
    const uncategorized = parsedRows.filter(
      (row) => row.category === undefined && row.amount !== null
    );

    uncategorized.forEach((row) => {
      if ((row.amount || 0) < 0) {
        costRows.push({ ...row, amount: Math.abs(row.amount || 0), category: "cost" });
      } else {
        revenueRows.push({ ...row, category: "revenue" });
      }
    });

    totalRevenue = revenueRows.reduce((sum, row) => sum + (row.amount || 0), 0);
    totalCosts = costRows.reduce((sum, row) => sum + Math.abs(row.amount || 0), 0);

    revenueItems = revenueRows.map((row) => ({
      name: row.label,
      amount: row.amount || 0,
      percentage: 0,
    }));
    costItems = costRows.map((row) => ({
      name: row.label,
      amount: Math.abs(row.amount || 0),
      percentage: 0,
    }));

    validAmountCount = parsedRows.filter((row) => row.amount !== null).length;
    totalAmountCells = parsedRows.length;
  }

  const netProfitLoss = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? (netProfitLoss / totalRevenue) * 100 : 0;
  revenueItems = revenueItems.map((item) => ({
    ...item,
    percentage: totalRevenue > 0 ? (item.amount / totalRevenue) * 100 : 0,
  }));
  costItems = costItems.map((item) => ({
    ...item,
    percentage: totalCosts > 0 ? (item.amount / totalCosts) * 100 : 0,
  }));

  const dataCompleteness =
    totalAmountCells > 0 ? (validAmountCount / totalAmountCells) * 100 : 0;

  const missingFields: string[] = [];
  if (totalRevenue <= 0) missingFields.push("revenue");
  if (totalCosts <= 0) missingFields.push("costs");
  if (!hasFinancialKeywords(rows.flat().join(" "))) {
    missingFields.push("financial_keywords");
  }

  const confidence = Math.max(
    0,
    Math.min(100, dataCompleteness - missingFields.length * 10)
  );

  return {
    totalRevenue,
    totalCosts,
    netProfitLoss,
    profitMargin,
    revenueItems,
    costItems,
    monthlyTrends,
    dataCompleteness: Number(dataCompleteness.toFixed(1)),
    confidence: Number(confidence.toFixed(1)),
    missingFields,
  };
}

export function validateFinancialInput(text: string): FinancialValidationResult {
  const validation = baseValidateFinancialInput(text);
  if (!validation.isValid) return validation;

  const rows = parseCSV(text);
  const hasAnyDataRows = rows.length > 1;
  if (!hasAnyDataRows) {
    return {
      isValid: false,
      errors: [...validation.errors, "No financial data rows found."],
      warnings: validation.warnings,
    };
  }

  const computed = computeMetrics(rows);
  const errors = [...validation.errors];
  const warnings = [...validation.warnings];

  if (computed.totalRevenue <= 0 && computed.totalCosts <= 0) {
    errors.push("Unable to detect revenue or cost amounts from uploaded data.");
  }

  if (computed.confidence < 40) {
    warnings.push("Low confidence parsing result. Check your CSV headers and values.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
