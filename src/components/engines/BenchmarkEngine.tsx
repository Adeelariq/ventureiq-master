"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Loader2, RefreshCw, Trophy, Target } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { useReport } from "@/contexts/ReportContext";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";

interface Category {
  name: string; score: number; industryAvg: number; percentile: number; insight: string;
}
interface Improvement { area: string; suggestion: string; potentialImpact: string; }
interface BMResult {
  overallScore: number; percentile: number; categories: Category[];
  strengths: string[]; improvements: Improvement[];
  peerComparison: string; companiesAnalyzed: number;
  dataSourceLabel?: string;
}

const CHART_STYLE = {
  background: "#0b1018",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 6,
  color: "#dde3ef",
  fontSize: 12,
};

export default function BenchmarkEngine() {
  const { company } = useCompany();
  const { setBenchmarkResult, reportData } = useReport();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BMResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasValidatedPnl =
    !!reportData.computedFinancials &&
    reportData.computedFinancials.confidence >= 40 &&
    reportData.computedFinancials.totalRevenue > 0;

  const analyze = async () => {
    if (!company || !hasValidatedPnl) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/engines/benchmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: company.industry, size: company.size,
          revenue: company.revenue, yearFounded: company.yearFounded,
          companyName: company.name,
          computedFinancials: reportData.computedFinancials,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.result);
      setBenchmarkResult(data.result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally { setLoading(false); }
  };

  const radarData = result?.categories?.map(c => ({
    subject: c.name, You: c.score, Industry: c.industryAvg, fullMark: 100,
  })) || [];

  return (
    <div>
      {/* Engine header */}
      <div className="engine-header">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="w-4 h-4" style={{ color: "#60a5fa" }} />
          <div>
            <h2 className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Benchmark Engine
            </h2>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Peer comparison vs {result?.companiesAnalyzed?.toLocaleString() || "1,000+"} companies
            </p>
          </div>
        </div>
        {result && hasValidatedPnl && (
          <button
            onClick={analyze}
            className="flex items-center gap-1.5 text-xs"
            style={{ color: "var(--accent)" }}
          >
            <RefreshCw className="w-3 h-3" /> Re-analyse
          </button>
        )}
      </div>

      {/* P&L gate */}
      {!hasValidatedPnl && (
        <div
          className="card p-4 mb-5 flex items-start gap-3"
          style={{ borderColor: "var(--warning-border)", background: "var(--warning-dim)" }}
        >
          <BarChart3 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--warning)" }} />
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Benchmark is disabled until validated P&L data is available. Run the P&L Engine first.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !result && (
        <div className="card p-8 flex flex-col items-center text-center gap-4">
          <BarChart3 className="w-8 h-8" style={{ color: "#60a5fa", opacity: 0.7 }} />
          <div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              Industry Benchmarking
            </h3>
            <p className="text-xs max-w-sm" style={{ color: "var(--text-secondary)" }}>
              Compare <strong style={{ color: "var(--text-primary)" }}>{company?.name}</strong> against{" "}
              {(1200).toLocaleString()} industry peers across 6 performance dimensions.
            </p>
          </div>
          <button
            onClick={analyze}
            disabled={!hasValidatedPnl}
            className="btn-glow flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <BarChart3 className="w-4 h-4" /> Run Benchmark Analysis
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          <div className="card p-6 flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#60a5fa" }} />
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Comparing against industry peers...
            </p>
          </div>
          {[1, 2].map(i => <div key={i} className="skeleton h-24 rounded-lg" />)}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card p-4" style={{ borderLeft: "3px solid var(--danger)" }}>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--danger)" }}>Analysis failed</p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{error}</p>
          {hasValidatedPnl && (
            <button onClick={analyze} className="mt-3 text-xs" style={{ color: "var(--accent)" }}>
              Try again →
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Score row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-4 text-center">
              <p className="metric-label mb-2">Overall Score</p>
              <p
                className="text-3xl font-bold tabular-nums tracking-tight"
                style={{ color: "#60a5fa" }}
              >
                {result.overallScore}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>out of 100</p>
            </div>
            <div className="card p-4 text-center">
              <p className="metric-label mb-2">Percentile Rank</p>
              <p
                className="text-2xl font-bold tabular-nums tracking-tight"
                style={{ color: "var(--accent)" }}
              >
                Top {100 - result.percentile}%
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                of {result.companiesAnalyzed?.toLocaleString()} companies
              </p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Trophy className="w-3.5 h-3.5" style={{ color: "var(--warning)" }} />
                <p className="metric-label">Strengths</p>
              </div>
              <ul className="space-y-1">
                {result.strengths?.map((s, i) => (
                  <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: "var(--success)" }}>
                    <span className="mt-1 shrink-0" style={{ fontSize: 8 }}>●</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Radar */}
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-secondary)" }}>
              Multi-Axis Comparison
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#5c6b82", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#2d3a4a", fontSize: 9 }} />
                <Tooltip contentStyle={CHART_STYLE} />
                <Radar name="You" dataKey="You" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="Industry Avg" dataKey="Industry" stroke="#64748b" fill="#64748b" fillOpacity={0.05} strokeWidth={1.5} strokeDasharray="5 5" />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-5 text-xs" style={{ color: "var(--text-secondary)" }}>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded inline-block" style={{ background: "var(--accent)" }} /> You
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded inline-block" style={{ background: "#64748b", opacity: 0.6 }} /> Industry Avg
              </span>
            </div>
          </div>

          {/* Category scores */}
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-secondary)" }}>
              Category Breakdown
            </p>
            <div className="space-y-3.5">
              {result.categories?.map((cat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-3 text-xs tabular-nums">
                      <span style={{ color: "var(--text-secondary)" }}>avg {cat.industryAvg}</span>
                      <span
                        className="font-bold"
                        style={{ color: cat.score >= cat.industryAvg ? "var(--success)" : "var(--warning)" }}
                      >
                        {cat.score}/100
                      </span>
                    </div>
                  </div>
                  <div
                    className="w-full rounded-full h-1.5 overflow-hidden"
                    style={{ background: "var(--bg-elevated)" }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.score}%` }}
                      transition={{ duration: 0.7, delay: i * 0.08 }}
                      className="h-full rounded-full"
                      style={{
                        background: cat.score >= cat.industryAvg ? "var(--success)" : "var(--warning)",
                      }}
                    />
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>
                    Top {100 - cat.percentile}% — {cat.insight}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Improvements */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-3.5 h-3.5" style={{ color: "#60a5fa" }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Areas for Improvement
              </p>
            </div>
            <div className="space-y-2.5">
              {result.improvements?.map((imp, i) => (
                <div
                  key={i}
                  className="p-3 rounded-md"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>
                    {imp.area}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{imp.suggestion}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--accent)" }}>
                    {imp.potentialImpact}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
            {result.peerComparison}
          </p>
        </motion.div>
      )}
    </div>
  );
}
