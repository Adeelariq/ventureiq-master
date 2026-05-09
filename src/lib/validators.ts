export interface FinancialValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const FINANCIAL_KEYWORDS = [
  "revenue",
  "sales",
  "income",
  "turnover",
  "cost",
  "expense",
  "cogs",
  "gross",
  "profit",
  "loss",
  "margin",
  "opex",
  "operating",
  "ebitda",
  "net",
  "cash",
  "finance",
  "p&l",
] as const;

function extractNumericValues(text: string): number[] {
  return (text.match(/-?\$?\d[\d,]*\.?\d*/g) || [])
    .map((token) => Number(token.replace(/[$,]/g, "")))
    .filter((value) => Number.isFinite(value));
}

export function isGibberish(text: string): boolean {
  const cleaned = text.trim().toLowerCase();
  if (!cleaned) return true;

  if (/(.)\1{5,}/.test(cleaned.replace(/\s/g, ""))) return true;

  const alphaOnly = cleaned.replace(/[^a-z]/g, "");
  if (alphaOnly.length >= 8 && !/[aeiou]/.test(alphaOnly)) return true;

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 1 && words[0].length >= 8 && !hasFinancialKeywords(cleaned)) {
    return true;
  }
  if (words.length >= 4) {
    const longWordRatio =
      words.filter((word) => word.length > 7).length / words.length;
    if (longWordRatio > 0.9 && !hasFinancialKeywords(cleaned)) return true;
  }

  return false;
}

export function hasFinancialKeywords(text: string): boolean {
  const lowered = text.toLowerCase();
  return FINANCIAL_KEYWORDS.some((keyword) => lowered.includes(keyword));
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

  if (inQuotes) {
    return [];
  }

  cells.push(current.trim());
  return cells;
}

export function validateCSVStructure(text: string): FinancialValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const trimmed = text.trim();

  if (!trimmed) {
    return {
      isValid: false,
      errors: ["Uploaded data is empty."],
      warnings,
    };
  }

  const lines = trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) {
    errors.push("CSV must contain at least a header and one data row.");
  }

  const delimiterCandidates = [",", ";", "\t"];
  const delimiter = delimiterCandidates.reduce((best, candidate) => {
    const score = (lines[0]?.match(new RegExp(`\\${candidate}`, "g")) || []).length;
    const bestScore = (lines[0]?.match(new RegExp(`\\${best}`, "g")) || []).length;
    return score > bestScore ? candidate : best;
  }, ",");

  const parsedRows = lines.map((line) => parseCsvLine(line, delimiter));
  if (parsedRows.some((row) => row.length === 0)) {
    errors.push("Malformed CSV detected (unclosed quote or invalid row).");
  }

  const expectedColumns = parsedRows[0]?.length || 0;
  if (expectedColumns < 2) {
    errors.push("CSV requires at least 2 columns.");
  }

  if (
    parsedRows.some(
      (row, index) => index > 0 && row.length !== expectedColumns
    )
  ) {
    errors.push("CSV rows do not have a consistent number of columns.");
  }

  const numericValues = extractNumericValues(trimmed);
  if (numericValues.length === 0) {
    errors.push("No numeric values found in upload.");
  } else if (numericValues.every((value) => Number.isNaN(value))) {
    errors.push("All numeric cells are invalid.");
  }

  if (!hasFinancialKeywords(trimmed)) {
    warnings.push("No financial keywords found; verify headers and labels.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateFinancialInput(text: string): FinancialValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const trimmed = text.trim();

  if (!trimmed) {
    return {
      isValid: false,
      errors: ["Financial input is empty."],
      warnings,
    };
  }

  if (isGibberish(trimmed)) {
    errors.push("Input appears to be gibberish or non-financial text.");
  }

  const csvValidation = validateCSVStructure(trimmed);
  errors.push(...csvValidation.errors);
  warnings.push(...csvValidation.warnings);

  const numericValues = extractNumericValues(trimmed);
  if (numericValues.length === 0) {
    errors.push("Financial data must include numeric values.");
  }

  const lines = trimmed.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    errors.push("Too few rows to compute financial metrics.");
  }

  if (!hasFinancialKeywords(trimmed) && numericValues.length > 0) {
    warnings.push("Numeric-only data detected; confidence may be lower.");
  }

  return {
    isValid: errors.length === 0,
    errors: Array.from(new Set(errors)),
    warnings: Array.from(new Set(warnings)),
  };
}
