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

const sevColor = (s: number) => s >= 8 ? "text-red-400" : s >= 6 ? "text-orange-400" : s >= 4 ? "text-yellow-400" : "text-emerald-400";
const sevBg = (s: number) => s >= 8 ? "bg-red-500/15 border-red-500/30" : s >= 6 ? "bg-orange-500/15 border-orange-500/30" : s >= 4 ? "bg-yellow-500/15 border-yellow-500/30" : "bg-emerald-500/15 border-emerald-500/30";
const impClr: Record<string, string> = { Critical: "badge-danger", High: "badge-warning", Medium: "badge-info", Low: "badge-success" };

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
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: company.industry,
          size: company.size,
          revenue: company.revenue,
          yearFounded: company.yearFounded,
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
      if (err instanceof Error && err.name === "AbortError") return; // component unmounted, ignore
      setError(err instanceof Error ? err.message : "Failed");
    }
    finally { setLoading(false); }
  };

  const chartData = result?.timeline?.map((y) => ({
    year: y.year,
    avgProb: y.threats.reduce((s, t) => s + t.probability, 0) / (y.threats.length || 1),
  })) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">FutureProof Engine</h2>
            <p className="text-sm text-(--text-secondary)">Top 5 risks + 5-year threat timeline</p>
          </div>
        </div>
        {result && hasValidatedPnl && <button onClick={() => analyze()} className="flex items-center gap-1 text-xs text-(--accent-primary) hover:underline"><RefreshCw className="w-3.5 h-3.5" /> Re-analyse</button>}
      </div>

      {!hasValidatedPnl && (
        <div className="glass-card p-5 mb-6 border border-amber-500/30 bg-amber-500/10">
          <p className="text-sm text-amber-200">
            FutureProof is disabled until validated P&L data is available. Run the P&L Engine with a valid uploaded CSV first.
          </p>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <div className="glass-card p-8 flex flex-col items-center"><Loader2 className="w-8 h-8 animate-spin text-violet-400 mb-3" /><p className="text-sm text-(--text-secondary)">Scanning threats for {company?.industry}...</p></div>
          {[1,2,3].map(i => <div key={i} className="shimmer h-20 rounded-xl" />)}
        </div>
      )}

      {error && (
        <div className="glass-card p-6 border-l-4 border-l-red-500">
          <div className="flex items-center gap-2 text-red-400 mb-2"><AlertTriangle className="w-5 h-5" /><span className="font-medium">Analysis Failed</span></div>
          <p className="text-sm text-(--text-secondary)">{error}</p>
          {hasValidatedPnl && (
            <button onClick={() => analyze()} className="mt-3 text-sm text-(--accent-primary) hover:underline">Try again →</button>
          )}
        </div>
      )}

      {!loading && !error && !result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-10 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30 flex items-center justify-center">
            <Shield className="w-8 h-8 text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">Ready for Risk Scan</h3>
            <p className="text-sm text-(--text-secondary) max-w-sm">Generate a 5-year risk outlook using company profile and validated P&L signals when available.</p>
          </div>
          <button
            onClick={() => analyze()}
            disabled={!hasValidatedPnl}
            className="btn-glow flex items-center gap-2 px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Shield className="w-4 h-4" /> Run FutureProof Analysis
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
          {/* Risk Score */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-(--text-secondary)">Overall Risk Score</h3>
              <span className={`text-3xl font-extrabold ${result.riskScore >= 70 ? "text-red-400" : result.riskScore >= 40 ? "text-orange-400" : "text-emerald-400"}`}>{result.riskScore}/100</span>
            </div>
            <div className="w-full bg-(--bg-tertiary) rounded-full h-3 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${result.riskScore}%` }} transition={{ duration: 1 }}
                className={`h-full rounded-full ${result.riskScore >= 70 ? "bg-linear-to-r from-red-500 to-red-400" : result.riskScore >= 40 ? "bg-linear-to-r from-orange-500 to-yellow-400" : "bg-linear-to-r from-emerald-500 to-teal-400"}`} />
            </div>
            <p className="text-sm text-(--text-secondary) mt-3">{result.summary}</p>
          </div>

          {/* Risk Cards */}
          <div>
            <h3 className="text-sm font-semibold text-(--text-secondary) mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-400" /> Top 5 Risks</h3>
            <div className="space-y-3">
              {result.risks?.map((risk, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className={`glass-card p-4 border ${sevBg(risk.severity)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-black ${sevColor(risk.severity)}`}>{risk.severity}</span>
                      <div><p className="text-sm font-semibold">{risk.title}</p><span className="badge badge-info text-[10px]">{risk.category}</span></div>
                    </div>
                    <span className="text-xs text-(--text-tertiary)">{risk.probability}% likely</span>
                  </div>
                  <p className="text-xs text-(--text-secondary) mb-2">{risk.description}</p>
                  <div className="flex items-start gap-1.5 text-xs text-emerald-400"><Zap className="w-3.5 h-3.5 mt-0.5 shrink-0" /><span>{risk.mitigation}</span></div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-(--text-secondary) mb-4">5-Year Threat Probability</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs><linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="year" tick={{ fill: "#7a7a8e", fontSize: 12 }} />
                <YAxis tick={{ fill: "#7a7a8e", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f0f5" }} />
                <Area type="monotone" dataKey="avgProb" stroke="#8b5cf6" fill="url(#pGrad)" strokeWidth={2} name="Avg Threat %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Timeline */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-(--text-secondary) mb-4">Year-by-Year Threats</h3>
            <div className="space-y-4">
              {result.timeline?.map((year, yi) => (
                <motion.div key={year.year} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: yi * 0.1 }}>
                  <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-violet-500" /><span className="text-sm font-bold">{year.year}</span></div>
                  <div className="ml-4 border-l border-(--border-glass) pl-4 space-y-2">
                    {year.threats?.map((t, ti) => (
                      <div key={ti} className="p-3 rounded-lg bg-(--bg-card)">
                        <div className="flex items-center justify-between mb-1"><span className="text-sm font-medium">{t.title}</span><span className={`badge text-[10px] ${impClr[t.impact] || "badge-info"}`}>{t.impact}</span></div>
                        <p className="text-xs text-(--text-secondary)">{t.description}</p>
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