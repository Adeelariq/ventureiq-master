"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Loader2, RefreshCw, Trophy, Target } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { useReport } from "@/contexts/ReportContext";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";

interface Category { name: string; score: number; industryAvg: number; percentile: number; insight: string; }
interface Improvement { area: string; suggestion: string; potentialImpact: string; }
interface BMResult {
  overallScore: number; percentile: number; categories: Category[];
  strengths: string[]; improvements: Improvement[];
  peerComparison: string; companiesAnalyzed: number;
  dataSourceLabel?: string;
}

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
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: company.industry,
          size: company.size,
          revenue: company.revenue,
          yearFounded: company.yearFounded,
          companyName: company.name,
          computedFinancials: reportData.computedFinancials,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.result);
      setBenchmarkResult(data.result);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  };

  // No auto-fetch — user triggers analysis manually

  const radarData = result?.categories?.map(c => ({ subject: c.name, You: c.score, Industry: c.industryAvg, fullMark: 100 })) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Benchmark Engine</h2>
            <p className="text-sm text-(--text-secondary)">AI comparison vs {result?.companiesAnalyzed?.toLocaleString() || "1,000+"}  companies</p>
          </div>
        </div>
        {result && hasValidatedPnl && <button onClick={() => analyze()} className="flex items-center gap-1 text-xs text-(--accent-primary) hover:underline"><RefreshCw className="w-3.5 h-3.5" /> Re-analyse</button>}
      </div>

      {!hasValidatedPnl && (
        <div className="glass-card p-5 mb-6 border border-amber-500/30 bg-amber-500/10">
          <p className="text-sm text-amber-200">
            Benchmark is disabled until validated P&L data is available. Run the P&L Engine with a valid uploaded CSV first.
          </p>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <div className="glass-card p-8 flex flex-col items-center"><Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-3" /><p className="text-sm text-(--text-secondary)">Comparing against industry peers...</p></div>
          {[1,2].map(i => <div key={i} className="shimmer h-32 rounded-xl" />)}
        </div>
      )}

      {error && (
        <div className="glass-card p-6 border-l-4 border-l-red-500">
          <p className="text-red-400 font-medium mb-1">Analysis Failed</p>
          <p className="text-sm text-(--text-secondary)">{error}</p>
          {hasValidatedPnl && (
            <button onClick={() => analyze()} className="mt-3 text-sm text-(--accent-primary) hover:underline">Try again →</button>
          )}
        </div>
      )}

      {!loading && !error && !result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-10 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">Ready to Benchmark</h3>
            <p className="text-sm text-(--text-secondary) max-w-sm">Compare <span className="text-white font-medium">{company?.name}</span> against {(1200).toLocaleString()} industry peers across key performance metrics.</p>
          </div>
          <button
            onClick={() => analyze()}
            disabled={!hasValidatedPnl}
            className="btn-glow flex items-center gap-2 px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BarChart3 className="w-4 h-4" /> Run Benchmark Analysis
          </button>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="glass-card p-4">
            <p className="text-sm font-medium">
              {result.dataSourceLabel?.includes("Powered by uploaded P&L")
                ? "Powered by uploaded P&L"
                : "AI-generated estimate"}
            </p>
          </div>
          {/* Overall Score */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 text-center">
              <p className="text-xs text-(--text-tertiary) mb-2">Overall Score</p>
              <p className="text-5xl font-extrabold bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{result.overallScore}</p>
              <p className="text-xs text-(--text-tertiary) mt-1">out of 100</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-card p-6 text-center">
              <p className="text-xs text-(--text-tertiary) mb-2">Percentile Rank</p>
              <p className="text-5xl font-extrabold text-(--accent-primary)">Top {100 - result.percentile}%</p>
              <p className="text-xs text-(--text-tertiary) mt-1">of {result.companiesAnalyzed?.toLocaleString()} companies</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="glass-card p-6">
              <p className="text-xs text-(--text-tertiary) mb-2 flex items-center gap-1"><Trophy className="w-3 h-3 text-yellow-400" /> Strengths</p>
              <ul className="space-y-1">
                {result.strengths?.map((s, i) => <li key={i} className="text-sm text-emerald-400 flex items-start gap-1.5"><span className="mt-1">✦</span>{s}</li>)}
              </ul>
            </motion.div>
          </div>

          {/* Radar Chart */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-(--text-secondary) mb-4">Multi-Axis Comparison</h3>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#7a7a8e", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#4a4a5e", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f0f5" }} />
                <Radar name="You" dataKey="You" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Industry Avg" dataKey="Industry" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 5" />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-2 text-xs text-(--text-secondary)">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-(--accent-primary) inline-block" /> You</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-violet-500 inline-block opacity-60" style={{ borderTop: "2px dashed" }} /> Industry Avg</span>
            </div>
          </div>

          {/* Category Scores */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-(--text-secondary) mb-4">Category Breakdown</h3>
            <div className="space-y-4">
              {result.categories?.map((cat, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{cat.name}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-(--text-tertiary)">Avg: {cat.industryAvg}</span>
                      <span className={cat.score >= cat.industryAvg ? "text-emerald-400 font-bold" : "text-orange-400 font-bold"}>{cat.score}/100</span>
                    </div>
                  </div>
                  <div className="w-full bg-(--bg-tertiary) rounded-full h-2 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${cat.score}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                      className={`h-full rounded-full ${cat.score >= cat.industryAvg ? "bg-linear-to-r from-emerald-500 to-teal-400" : "bg-linear-to-r from-orange-500 to-yellow-400"}`} />
                  </div>
                  <p className="text-xs text-(--text-tertiary) mt-1">Top {100 - cat.percentile}% — {cat.insight}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Improvements */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-(--text-secondary) mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-blue-400" /> Areas for Improvement</h3>
            <div className="space-y-3">
              {result.improvements?.map((imp, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="p-3 rounded-lg bg-(--bg-card)">
                  <p className="text-sm font-medium">{imp.area}</p>
                  <p className="text-xs text-(--text-secondary) mt-0.5">{imp.suggestion}</p>
                  <p className="text-xs text-(--accent-primary) mt-1">💡 {imp.potentialImpact}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <p className="text-xs text-(--text-tertiary) text-center">{result.peerComparison}</p>
        </motion.div>
      )}
    </div>
  );
}
