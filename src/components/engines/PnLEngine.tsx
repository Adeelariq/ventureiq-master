"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  Lightbulb,
  RefreshCcw,
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
  Legend,
  Area,
  AreaChart,
} from "recharts";

interface ValidationState {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const CHART_STYLE = {
  background: "#0b1018",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 6,
  color: "#dde3ef",
  fontSize: 12,
};

export default function PnLEngine() {
  const { company } = useCompany();
  const { reportData, setPnLResult, resetPnL } = useReport();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"paste" | "upload">("paste");
  const [textData, setTextData] = useState("");
  const [validation, setValidation] = useState<ValidationState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const result = reportData.pnl;
  const computed = reportData.computedFinancials;

  useEffect(() => {
    if (reportData.rawFinancialData && !textData) {
      setTextData(reportData.rawFinancialData);
    }
  }, [reportData.rawFinancialData, textData]);

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
    if (!textData.trim()) { setError("Please enter or upload financial data"); return; }
    setLoading(true); setError(null); setValidation(null);
    try {
      const res = await fetch("/api/engines/pnl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ financialData: textData, companyProfile: company }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.validation) {
          setValidation(data.validation);
          throw new Error((data.validation.errors || []).join(" ") || data.error || "Validation failed");
        }
        throw new Error(data.error || "Analysis failed");
      }
      setValidation(data.validation || null);
      setPnLResult(data.result, data.computedFinancials, textData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { resetPnL(); setTextData(""); setValidation(null); setError(null); };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const formatCompact = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 1 }).format(n);

  const monthlyTrends = computed?.monthlyTrends || [];

  return (
    <div>
      {/* Engine header */}
      <div className="engine-header">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="w-4 h-4" style={{ color: "var(--success)" }} />
          <div>
            <h2
              className="text-sm font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              P&L Engine
            </h2>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Revenue &amp; cost analysis from uploaded financial data
            </p>
          </div>
        </div>
        {result && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors"
            style={{
              background: "var(--danger-dim)",
              color: "var(--danger)",
              border: "1px solid var(--danger-border)",
            }}
          >
            <RefreshCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* Input section */}
      {!result && (
        <div className="card p-5 mb-5" style={{ borderColor: "var(--border-default)" }}>
          {/* Mode toggle */}
          <div className="flex gap-1 mb-4 p-1 rounded-md w-fit" style={{ background: "var(--bg-elevated)" }}>
            {(["paste", "upload"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setInputMode(mode)}
                className="px-3 py-1.5 rounded text-xs font-medium transition-all capitalize"
                style={{
                  background: inputMode === mode ? "var(--bg-surface)" : "transparent",
                  color: inputMode === mode ? "var(--text-primary)" : "var(--text-secondary)",
                  border: inputMode === mode ? "1px solid var(--border-default)" : "1px solid transparent",
                }}
              >
                {mode === "paste" ? "Paste Data" : "Upload CSV"}
              </button>
            ))}
          </div>

          {inputMode === "upload" ? (
            <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--text-secondary)" }} />
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Click to upload a CSV file
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>.csv only</p>
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
                className="input-glass w-full h-40 resize-none font-mono text-xs"
                placeholder="Paste CSV data here — Month, Revenue_INR, Operational_Cost_INR, ..."
                value={textData}
                onChange={(e) => setTextData(e.target.value)}
              />
              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={() => setTextData(dummyCsv)}
                  className="text-xs transition-colors"
                  style={{ color: "var(--accent)" }}
                  type="button"
                >
                  Load sample data
                </button>
                {textData && (
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {textData.split("\n").length} rows
                  </span>
                )}
              </div>
            </div>
          )}

          {error && (
            <div
              className="flex items-center gap-2 mt-3 text-sm p-3 rounded"
              style={{
                background: "var(--danger-dim)",
                color: "var(--danger)",
                border: "1px solid var(--danger-border)",
              }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {validation?.errors?.length ? (
            <div
              className="mt-3 p-3 rounded text-xs"
              style={{
                background: "var(--danger-dim)",
                border: "1px solid var(--danger-border)",
                color: "var(--danger)",
              }}
            >
              <p className="font-semibold mb-1">Validation errors</p>
              <ul className="space-y-0.5">
                {validation.errors.map((e, i) => <li key={i}>— {e}</li>)}
              </ul>
            </div>
          ) : null}

          <button
            onClick={handleAnalyze}
            disabled={loading || !textData.trim()}
            className="btn-glow w-full mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analysing financials...</>
            ) : (
              <><TrendingUp className="w-4 h-4" /> Analyse P&L</>
            )}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-lg" />)}
        </div>
      )}

      {/* Results */}
      {result && computed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

          {/* Verdict + key metrics in one card */}
          <div className="card p-5" style={{
            borderLeft: `3px solid ${
              result.summary.verdict === "Profitable"
                ? "var(--success)"
                : result.summary.verdict === "Break-even"
                ? "var(--warning)"
                : "var(--danger)"
            }`,
          }}>
            <div className="flex items-center gap-2.5 mb-4">
              {result.summary.verdict === "Profitable" ? (
                <CheckCircle className="w-4 h-4" style={{ color: "var(--success)" }} />
              ) : (
                <AlertCircle className="w-4 h-4" style={{ color: "var(--danger)" }} />
              )}
              <span className={`badge ${
                result.summary.verdict === "Profitable"
                  ? "badge-success"
                  : result.summary.verdict === "Break-even"
                  ? "badge-warning"
                  : "badge-danger"
              }`}>
                {result.summary.verdict}
              </span>
              <span className="text-xs ml-auto" style={{ color: "var(--text-secondary)" }}>
                {result.summary.confidence.toFixed(0)}% confidence · {result.summary.dataCompleteness.toFixed(0)}% data completeness
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Revenue",  value: formatCurrency(result.summary.totalRevenue),  color: "var(--success)" },
                { label: "Total Costs",    value: formatCurrency(result.summary.totalCosts),    color: "var(--danger)" },
                { label: "Net P&L",        value: formatCurrency(result.summary.netProfitLoss),
                  color: result.summary.netProfitLoss >= 0 ? "var(--success)" : "var(--danger)" },
                { label: "Margin",         value: `${result.summary.profitMargin?.toFixed(1)}%`, color: "var(--accent)" },
              ].map((m) => (
                <div key={m.label}>
                  <p className="metric-label mb-1">{m.label}</p>
                  <p
                    className="text-lg font-bold tabular-nums tracking-tight"
                    style={{ color: m.color }}
                  >
                    {m.value}
                  </p>
                </div>
              ))}
            </div>

            {validation?.warnings?.length ? (
              <p
                className="text-xs mt-3 pt-3"
                style={{ borderTop: "1px solid var(--border-subtle)", color: "var(--warning)" }}
              >
                {validation.warnings.join(" ")}
              </p>
            ) : null}
          </div>

          {/* Charts side by side */}
          {monthlyTrends.length > 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Area chart */}
              <div className="card p-4">
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Monthly Trend
                </p>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1}>
                    <AreaChart data={monthlyTrends} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: "#5c6b82", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#5c6b82", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatCompact} />
                      <Tooltip contentStyle={CHART_STYLE} formatter={(v: any) => [formatCurrency(v), ""]} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                      <Area type="monotone" name="Revenue" dataKey="revenue" stroke="#22c55e" strokeWidth={2} fill="url(#gRev)" />
                      <Area type="monotone" name="Costs"   dataKey="costs"   stroke="#ef4444" strokeWidth={2} fill="url(#gCost)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar chart */}
              <div className="card p-4">
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Revenue vs Costs
                </p>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1}>
                    <BarChart data={monthlyTrends} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: "#5c6b82", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#5c6b82", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatCompact} />
                      <Tooltip contentStyle={CHART_STYLE} formatter={(v: any) => [formatCurrency(v), ""]} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                      <Bar dataKey="revenue" name="Revenue" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="costs"   name="Costs"   fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4" style={{ color: "var(--warning)" }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                AI Recommendations
              </p>
            </div>
            <div className="space-y-2.5">
              {result.recommendations?.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-3 p-3 rounded-md"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <span className={`badge mt-0.5 shrink-0 ${
                    rec.impact === "high" ? "badge-danger" :
                    rec.impact === "medium" ? "badge-warning" : "badge-info"
                  }`}>
                    {rec.impact}
                  </span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                      {rec.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {rec.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Missing fields — only if any */}
          {result.summary.missingFields.length > 0 && (
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Missing fields: {result.summary.missingFields.join(", ")}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
