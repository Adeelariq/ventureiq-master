"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, Loader2, Zap, RefreshCw } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { useReport } from "@/contexts/ReportContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Risk {
  id: number; title: string; severity: number; probability: number;
  category: string; description: string; mitigation: string;
}
interface TimelineYear {
  year: number;
  threats: { title: string; probability: number; impact: string; description: string }[];
}
interface FPResult {
  riskScore: number; risks: Risk[]; timeline: TimelineYear[]; summary: string;
  dataSourceLabel?: string;
}

const CHART_STYLE = {
  background: "#0b1018",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 6,
  color: "#dde3ef",
  fontSize: 12,
};

const sevColor = (s: number) =>
  s >= 8 ? "var(--danger)" : s >= 6 ? "var(--warning)" : s >= 4 ? "#eab308" : "var(--success)";

const impClr: Record<string, string> = {
  Critical: "badge-danger",
  High: "badge-warning",
  Medium: "badge-info",
  Low: "badge-success",
};

export default function FutureProofEngine() {
  const { company } = useCompany();
  const { setFutureproofResult, reportData } = useReport();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FPResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasValidatedPnl =
    !!reportData.computedFinancials &&
    reportData.computedFinancials.confidence >= 40 &&
    reportData.computedFinancials.totalRevenue > 0;

  const analyze = async (signal?: AbortSignal) => {
    if (!company || !hasValidatedPnl) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/engines/futureproof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: company.industry, size: company.size,
          revenue: company.revenue, yearFounded: company.yearFounded,
          companyName: company.name,
          computedFinancials: reportData.computedFinancials,
        }),
        signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.result);
      setFutureproofResult(data.result);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed");
    } finally { setLoading(false); }
  };

  const chartData = result?.timeline?.map((y) => ({
    year: y.year,
    avgProb: Math.round(y.threats.reduce((s, t) => s + t.probability, 0) / (y.threats.length || 1)),
  })) || [];

  return (
    <div>
      {/* Engine header */}
      <div className="engine-header">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4" style={{ color: "#a78bfa" }} />
          <div>
            <h2 className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
              FutureProof Engine
            </h2>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Top 5 risks · 5-year threat timeline
            </p>
          </div>
        </div>
        {result && hasValidatedPnl && (
          <button
            onClick={() => analyze()}
            className="flex items-center gap-1.5 text-xs"
            style={{ color: "var(--accent)" }}
          >
            <RefreshCw className="w-3 h-3" /> Re-analyse
          </button>
        )}
      </div>

      {/* Requires P&L data gate */}
      {!hasValidatedPnl && (
        <div
          className="card p-4 mb-5 flex items-start gap-3"
          style={{ borderColor: "var(--warning-border)", background: "var(--warning-dim)" }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--warning)" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--warning)" }}>
              Financial data required
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Run the P&L Engine with a valid CSV first. FutureProof uses your financial signals to calibrate risk estimates.
            </p>
          </div>
        </div>
      )}

      {/* Empty state with CTA */}
      {!loading && !error && !result && (
        <div className="card p-8 flex flex-col items-center text-center gap-4">
          <Shield className="w-8 h-8" style={{ color: "#a78bfa", opacity: 0.7 }} />
          <div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              5-Year Risk Scan
            </h3>
            <p className="text-xs max-w-sm" style={{ color: "var(--text-secondary)" }}>
              Generates a ranked list of industry-specific threats and a year-by-year threat timeline calibrated to your company profile.
            </p>
          </div>
          <button
            onClick={() => analyze()}
            disabled={!hasValidatedPnl}
            className="btn-glow flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <Shield className="w-4 h-4" /> Run FutureProof Analysis
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          <div className="card p-6 flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#a78bfa" }} />
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Scanning threats for {company?.industry}...
            </p>
          </div>
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-lg" />)}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card p-4" style={{ borderLeft: "3px solid var(--danger)" }}>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--danger)" }}>Analysis failed</p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{error}</p>
          {hasValidatedPnl && (
            <button onClick={() => analyze()} className="mt-3 text-xs" style={{ color: "var(--accent)" }}>
              Try again →
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Risk score + summary */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Overall Risk Score
              </p>
              <span
                className="text-2xl font-bold tabular-nums"
                style={{
                  color: result.riskScore >= 70 ? "var(--danger)"
                    : result.riskScore >= 40 ? "var(--warning)" : "var(--success)",
                }}
              >
                {result.riskScore}<span className="text-sm font-normal" style={{ color: "var(--text-secondary)" }}>/100</span>
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden mb-3" style={{ background: "var(--bg-elevated)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.riskScore}%` }}
                transition={{ duration: 0.8 }}
                className="h-full rounded-full"
                style={{
                  background: result.riskScore >= 70 ? "var(--danger)"
                    : result.riskScore >= 40 ? "var(--warning)" : "var(--success)",
                }}
              />
            </div>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{result.summary}</p>
          </div>

          {/* Risk cards */}
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-secondary)" }}>
              Top 5 Risks
            </p>
            <div className="space-y-2.5">
              {result.risks?.map((risk, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="p-3 rounded-md"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-lg font-black tabular-nums w-6"
                        style={{ color: sevColor(risk.severity), lineHeight: 1 }}
                      >
                        {risk.severity}
                      </span>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                          {risk.title}
                        </p>
                        <span className="badge badge-info text-[10px] mt-0.5">{risk.category}</span>
                      </div>
                    </div>
                    <span className="text-[11px] tabular-nums shrink-0 ml-2" style={{ color: "var(--text-secondary)" }}>
                      {risk.probability}%
                    </span>
                  </div>
                  <p className="text-xs ml-8 mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    {risk.description}
                  </p>
                  <div className="flex items-start gap-1.5 ml-8 text-xs" style={{ color: "var(--success)" }}>
                    <Zap className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>{risk.mitigation}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Threat probability chart */}
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-secondary)" }}>
              5-Year Threat Probability
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: "#5c6b82", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#5c6b82", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_STYLE} />
                <Area type="monotone" dataKey="avgProb" stroke="#a78bfa" fill="url(#pGrad)" strokeWidth={2} name="Avg Threat %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Timeline */}
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-secondary)" }}>
              Year-by-Year Threats
            </p>
            <div className="space-y-4">
              {result.timeline?.map((year, yi) => (
                <motion.div
                  key={year.year}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: yi * 0.08 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: "#a78bfa" }}
                    />
                    <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                      {year.year}
                    </span>
                  </div>
                  <div
                    className="ml-4 pl-4 space-y-2"
                    style={{ borderLeft: "1px solid var(--border-subtle)" }}
                  >
                    {year.threats?.map((t, ti) => (
                      <div
                        key={ti}
                        className="p-2.5 rounded-md"
                        style={{ background: "var(--bg-elevated)" }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                            {t.title}
                          </span>
                          <span className={`badge text-[10px] ${impClr[t.impact] || "badge-info"}`}>
                            {t.impact}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {t.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}