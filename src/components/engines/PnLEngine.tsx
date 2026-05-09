"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  Lightbulb,
} from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { useReport } from "@/contexts/ReportContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface PnLResult {
  summary: {
    totalRevenue: number;
    totalCosts: number;
    netProfitLoss: number;
    profitMargin: number;
    verdict: string;
    dataCompleteness: number;
    confidence: number;
    missingFields: string[];
  };
  revenueItems: { name: string; amount: number; percentage: number }[];
  costItems: { name: string; amount: number; percentage: number }[];
  recommendations: { title: string; description: string; impact: string }[];
  insights: string[];
}
interface ValidationState {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export default function PnLEngine() {
  const { company } = useCompany();
  const { setPnLResult } = useReport();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PnLResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"paste" | "upload">("paste");
  const [textData, setTextData] = useState("");
  const [validation, setValidation] = useState<ValidationState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dummyCsv = `Month,Revenue_INR,Operational_Cost_INR,Marketing_Spend_INR,Employee_Salary_INR
Jan,1200000,900000,250000,420000
Feb,1180000,940000,270000,420000
Mar,1250000,980000,300000,420000
Apr,1100000,1020000,310000,440000
May,980000,1080000,320000,440000
Jun,950000,1120000,340000,460000`;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith(".csv") || file.type === "text/csv") {
      const text = await file.text();
      setTextData(text);
    } else {
      setError("Please upload a CSV file. PDF support available in Doc Analyzer.");
    }
  };

  const handleAnalyze = async () => {
    if (!textData.trim()) {
      setError("Please enter or upload financial data");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setValidation(null);

    try {
      const res = await fetch("/api/engines/pnl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          financialData: textData,
          companyProfile: company,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.validation) {
          setValidation(data.validation);
          throw new Error((data.validation.errors || []).join(" ") || data.error || "Validation failed");
        }
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data.result);
      setValidation(data.validation || null);
      setPnLResult(data.result, data.computedFinancials);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  const chartData = result
    ? [
        ...result.revenueItems.map((r) => ({
          name: r.name,
          amount: r.amount,
          type: "revenue",
        })),
        ...result.costItems.map((c) => ({
          name: c.name,
          amount: -c.amount,
          type: "cost",
        })),
      ]
    : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">P&L Engine</h2>
          <p className="text-sm text-(--text-secondary)">
            Upload financials → AI extracts revenue & costs → instant verdict
          </p>
        </div>
      </div>

      {/* Input Section */}
      {!result && (
        <div className="glass-card p-6 mb-6">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setInputMode("paste")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                inputMode === "paste"
                  ? "bg-(--accent-primary) text-white"
                  : "bg-(--bg-card) text-(--text-secondary) hover:text-white"
              }`}
            >
              Paste Data
            </button>
            <button
              onClick={() => setInputMode("upload")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                inputMode === "upload"
                  ? "bg-(--accent-primary) text-white"
                  : "bg-(--bg-card) text-(--text-secondary) hover:text-white"
              }`}
            >
              Upload CSV
            </button>
          </div>

          {inputMode === "upload" ? (
            <div
              className="upload-zone"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-(--text-tertiary) mx-auto mb-3" />
              <p className="text-sm text-(--text-secondary)">
                Click to upload a CSV file
              </p>
              <p className="text-xs text-(--text-tertiary) mt-1">
                .csv files only
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div>
              <textarea
                className="input-glass w-full h-48 resize-none font-mono text-sm"
                placeholder="Paste your financial data here (CSV format, plain text, or any format)..."
                value={textData}
                onChange={(e) => setTextData(e.target.value)}
              />
              <button
                onClick={() => setTextData(dummyCsv)}
                className="text-xs text-(--accent-primary) hover:underline mt-2"
                type="button"
              >
                Enter dummy data
              </button>
            </div>
          )}

          {textData && (
            <p className="text-xs text-(--text-tertiary) mt-2">
              📄 {textData.split("\n").length} lines of data loaded
            </p>
          )}

          {error && (
            <div className="flex items-center gap-2 mt-3 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          {validation?.errors?.length ? (
            <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-red-300 font-medium mb-1">Validation errors</p>
              <ul className="text-xs text-red-200 space-y-1">
                {validation.errors.map((validationError, idx) => (
                  <li key={idx}>• {validationError}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <button
            onClick={handleAnalyze}
            disabled={loading || !textData.trim()}
            className="btn-glow w-full mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analysing your financials...
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5" />
                Analyse P&L
              </>
            )}
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shimmer h-24 rounded-xl" />
          ))}
        </div>
      )}

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Verdict Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`glass-card p-6 border-l-4 ${
              result.summary.verdict === "Profitable"
                ? "border-l-emerald-500"
                : result.summary.verdict === "Break-even"
                ? "border-l-yellow-500"
                : "border-l-red-500"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              {result.summary.verdict === "Profitable" ? (
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-400" />
              )}
              <span
                className={`badge ${
                  result.summary.verdict === "Profitable"
                    ? "badge-success"
                    : result.summary.verdict === "Break-even"
                    ? "badge-warning"
                    : "badge-danger"
                }`}
              >
                {result.summary.verdict}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-(--text-tertiary) mb-1">Revenue</p>
                <p className="text-lg font-bold text-emerald-400">
                  {formatCurrency(result.summary.totalRevenue)}
                </p>
              </div>
              <div>
                <p className="text-xs text-(--text-tertiary) mb-1">Costs</p>
                <p className="text-lg font-bold text-red-400">
                  {formatCurrency(result.summary.totalCosts)}
                </p>
              </div>
              <div>
                <p className="text-xs text-(--text-tertiary) mb-1">Net P&L</p>
                <p
                  className={`text-lg font-bold ${
                    result.summary.netProfitLoss >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {formatCurrency(result.summary.netProfitLoss)}
                </p>
              </div>
              <div>
                <p className="text-xs text-(--text-tertiary) mb-1">Margin</p>
                <p className="text-lg font-bold text-(--accent-primary)">
                  {result.summary.profitMargin?.toFixed(1)}%
                </p>
              </div>
            </div>
          </motion.div>

          {/* Data Quality */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold mb-4 text-(--text-secondary)">Data Quality</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-(--text-tertiary) mb-1">Completeness</p>
                <p className="text-lg font-bold">{result.summary.dataCompleteness.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-(--text-tertiary) mb-1">Confidence</p>
                <p className="text-lg font-bold">{result.summary.confidence.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-(--text-tertiary) mb-1">Missing fields</p>
                <p className="text-sm text-(--text-secondary)">
                  {result.summary.missingFields.length
                    ? result.summary.missingFields.join(", ")
                    : "None"}
                </p>
              </div>
            </div>
            {validation?.warnings?.length ? (
              <p className="text-xs text-yellow-300 mt-3">
                {validation.warnings.join(" ")}
              </p>
            ) : null}
          </div>

          {/* Chart */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold mb-4 text-(--text-secondary)">
              Revenue vs Costs Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: "#7a7a8e", fontSize: 12 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: "#7a7a8e", fontSize: 11 }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a2e",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#f0f0f5",
                  }}
                  formatter={(value: unknown) => [formatCurrency(Math.abs(Number(value))), ""]}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.type === "revenue" ? "#10b981" : "#ef4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recommendations */}
          <div className="glass-card p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-4">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              AI Recommendations
            </h3>
            <div className="space-y-3">
              {result.recommendations?.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="flex gap-3 p-3 rounded-lg bg-(--bg-card)"
                >
                  <span
                    className={`badge text-[10px] mt-0.5 ${
                      rec.impact === "high"
                        ? "badge-danger"
                        : rec.impact === "medium"
                        ? "badge-warning"
                        : "badge-info"
                    }`}
                  >
                    {rec.impact}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{rec.title}</p>
                    <p className="text-xs text-(--text-secondary) mt-0.5">
                      {rec.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={() => {
              setResult(null);
              setTextData("");
            }}
            className="text-sm text-(--accent-primary) hover:underline"
          >
            ← Analyze new data
          </button>
        </motion.div>
      )}
    </div>
  );
}
