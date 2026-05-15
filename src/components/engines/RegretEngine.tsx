"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Plus,
  Trash2,
  Loader2,
  IndianRupee,
  ArrowRight,
  Lightbulb,
  AlertTriangle,
  Database,
  Activity,
  ShieldCheck,
  TrendingDown
} from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { useReport } from "@/contexts/ReportContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

interface DecisionResult {
  id: number;
  originalDecision: string;
  missedOpportunityCost: number;
  whatIf: string;
  category?: string;
  categoryDescription?: string;
  factors?: string[];
  stabilityRating?: string;
  riskLevel?: string;
  confidence: string;
  lesson: string;
  isGoodDecision?: boolean;
}

interface RegretResult {
  totalOpportunityCost: number;
  decisions: DecisionResult[];
  forwardLooking: { recommendation: string; timeframe: string }[];
  emotionalImpact: string;
  silverLining: string;
  dataSourceLabel?: string;
  pnlConfidence?: number;
  regretConfidence?: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export default function RegretEngine() {
  const { company } = useCompany();
  const { setRegretResult, reportData } = useReport();
  const [decisions, setDecisions] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RegretResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasValidatedPnl =
    !!reportData.computedFinancials &&
    reportData.computedFinancials.confidence >= 40 &&
    reportData.computedFinancials.totalRevenue > 0;

  const addDecision = () => {
    if (decisions.length < 3) setDecisions([...decisions, ""]);
  };
  const removeDecision = (i: number) => {
    if (decisions.length > 1) setDecisions(decisions.filter((_, idx) => idx !== i));
  };
  const updateDecision = (i: number, val: string) => {
    const d = [...decisions];
    d[i] = val;
    setDecisions(d);
  };

  const handleLoadDemo = () => {
    const ind = (company?.industry || "").toLowerCase();
    let demo: string[];
    
    if (ind.includes("saas") || ind.includes("software") || ind.includes("tech")) {
      demo = [
        "Delayed AI integration in core product by 12 months",
        "Ignored rising churn rate among mid-market customers",
        "Overspent on cloud infrastructure without optimization"
      ];
    } else if (ind.includes("retail") || ind.includes("e-commerce")) {
      demo = [
        "Overstocked seasonal inventory right before a demand drop",
        "Expanded logistics network too aggressively in Tier 3 cities"
      ];
    } else {
      demo = [
        "Delayed digital transformation initiatives by a year",
        "Hired aggressively for a new division that failed to find product-market fit"
      ];
    }
    
    setDecisions(demo);
  };

  const analyze = async () => {
    const filtered = decisions.filter((d) => d.trim());
    if (!filtered.length) {
      setError("Enter at least one past decision");
      return;
    }
    if (!hasValidatedPnl) {
      setError("Upload financial data in the P&L Engine first.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/engines/regret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisions: filtered,
          companyProfile: company,
          computedFinancials: reportData.computedFinancials,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.result);
      setRegretResult(data.result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const chartData = result && reportData.computedFinancials ? [
    { name: "Annual Revenue", value: reportData.computedFinancials.totalRevenue, type: "revenue" },
    { name: result.totalOpportunityCost >= 0 ? "Value Generated" : "Opportunity Cost", value: Math.abs(result.totalOpportunityCost), type: "impact" },
  ] : [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-500 to-red-600 flex items-center justify-center">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Regret Engine</h2>
          <p className="text-sm text-(--text-secondary)">
            Deterministic financial impact of past decisions
          </p>
        </div>
      </div>

      {!hasValidatedPnl && (
        <div className="glass-card p-5 mb-6 border border-amber-500/30 bg-amber-500/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-300 mb-1">Financial Data Required</p>
              <p className="text-sm text-amber-200">
                Upload financial data first to generate grounded regret analysis. Run the P&amp;L Engine with a valid CSV, then return here.
              </p>
            </div>
          </div>
        </div>
      )}

      {hasValidatedPnl && !result && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 w-fit">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-400">
            Revenue: {fmt(reportData.computedFinancials!.totalRevenue)} · Confidence: {reportData.computedFinancials!.confidence.toFixed(0)}%
          </span>
        </div>
      )}

      {!result && (
        <div className="glass-card p-6 mb-6">
          <p className="text-sm text-(--text-secondary) mb-4">
            Describe 1–3 past business decisions to compute their exact financial impact:
          </p>
          <div className="space-y-3">
            {decisions.map((d, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-xs text-(--text-tertiary) mt-3 w-6">{i + 1}.</span>
                <input
                  className="input-glass flex-1"
                  placeholder={`e.g. "Didn't hire a sales team in 2023"`}
                  value={d}
                  onChange={(e) => updateDecision(i, e.target.value)}
                  disabled={!hasValidatedPnl}
                />
                {decisions.length > 1 && (
                  <button
                    onClick={() => removeDecision(i)}
                    className="text-red-400 hover:text-red-300 p-2"
                    disabled={!hasValidatedPnl}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            {decisions.length < 3 && (
              <button
                onClick={addDecision}
                disabled={!hasValidatedPnl}
                className="flex items-center gap-1 text-xs text-(--accent-primary) hover:underline disabled:opacity-40 disabled:pointer-events-none"
              >
                <Plus className="w-3.5 h-3.5" /> Add decision
              </button>
            )}
            <button
              onClick={handleLoadDemo}
              disabled={!hasValidatedPnl}
              className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 hover:underline disabled:opacity-40 disabled:pointer-events-none ml-auto"
            >
              <Lightbulb className="w-3.5 h-3.5" /> Demo Decisions
            </button>
          </div>
          {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
          <button
            onClick={analyze}
            disabled={loading || !hasValidatedPnl}
            className="btn-glow w-full mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Computing Impact...
              </>
            ) : (
              <>
                <IndianRupee className="w-5 h-5" /> Calculate Deterministic Impact
              </>
            )}
          </button>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shimmer h-24 rounded-xl" />
          ))}
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 w-fit">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs text-blue-400">
                100% Deterministic Engine (Formula-Backed)
              </span>
            </div>
            <button
              onClick={() => {
                setResult(null);
                setDecisions([""]);
              }}
              className="text-xs text-(--accent-primary) hover:underline"
            >
              Analyze new decisions
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`glass-card p-8 text-center border ${result.totalOpportunityCost >= 0 ? "border-emerald-500/20 bg-linear-to-br from-emerald-500/10 to-teal-600/10" : "border-red-500/20 bg-linear-to-br from-red-500/10 to-rose-600/10"}`}
          >
            <p className="text-xs text-(--text-tertiary) uppercase tracking-widest mb-2">
              Net Financial Impact
            </p>
            <p className={`text-4xl md:text-5xl font-extrabold ${result.totalOpportunityCost >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {result.totalOpportunityCost >= 0 ? "+" : "-"}{fmt(Math.abs(result.totalOpportunityCost))}
            </p>
            <p className="text-xs text-(--text-tertiary) mt-1">
              Based on predefined business impact library + deterministic hashing
            </p>
            <p className="text-sm text-(--text-secondary) mt-3 max-w-md mx-auto italic">
              &ldquo;{result.emotionalImpact}&rdquo;
            </p>
          </motion.div>

          {/* Visualization Graph */}
          {chartData.length > 0 && (
            <div className="glass-card p-6 border border-(--border-light)">
              <h3 className="text-sm font-semibold text-(--text-secondary) mb-4">Financial Proportions</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={1}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} />
                    <Tooltip
                      cursor={{ fill: '#ffffff05' }}
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                      formatter={(value: any) => [fmt(Number(value)), "Amount"]}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.type === "revenue" ? "#3b82f6" : result.totalOpportunityCost >= 0 ? "#10b981" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Individual Decisions */}
          <div className="space-y-4">
            {result.decisions?.map((dec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`glass-card p-5 border-l-4 ${dec.isGoodDecision ? "border-l-emerald-500" : "border-l-red-500"}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider">
                        {dec.category?.replace(/_/g, ' ') || "STRATEGY"}
                      </p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${dec.riskLevel === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {dec.riskLevel} Risk
                      </span>
                    </div>
                    <p className="text-base font-semibold">{dec.originalDecision}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className={`text-xl font-extrabold ${dec.isGoodDecision ? "text-emerald-400" : "text-red-400"}`}>
                      {dec.isGoodDecision ? "+" : "-"}{fmt(dec.missedOpportunityCost)}
                    </span>
                    <p className="text-xs text-(--text-tertiary) mt-0.5">
                      {dec.isGoodDecision ? "value generated" : "opportunity cost"}
                    </p>
                  </div>
                </div>

                {dec.factors && dec.factors.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {dec.factors.map((factor, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-(--bg-card) border border-(--border-light) rounded-md text-(--text-secondary)">
                        {factor}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div className="p-3 rounded-lg bg-(--bg-card)">
                    <p className="text-xs text-(--text-tertiary) mb-1 flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Impact Vector
                    </p>
                    <p className="text-sm text-(--text-secondary)">{dec.categoryDescription}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-(--bg-card)">
                    <p className="text-xs text-(--text-tertiary) mb-1 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" /> What if...
                    </p>
                    <p className="text-sm text-(--text-secondary)">{dec.whatIf}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-(--border-light)">
                  <p className="text-emerald-400 flex items-start gap-1">
                    <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {dec.lesson}
                  </p>
                  <div className="flex gap-2">
                    <span className="badge badge-info">{dec.confidence} Confidence</span>
                    {dec.stabilityRating && (
                      <span className="badge border border-blue-500/30 bg-blue-500/10 text-blue-400">
                        {dec.stabilityRating} Stability
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {result.forwardLooking?.length > 0 && (
            <div className="glass-card p-6 border-t-2 border-t-purple-500/50">
              <h3 className="text-sm font-semibold text-(--text-secondary) mb-3">
                🔮 Forward-Looking Strategy
              </h3>
              <div className="space-y-3">
                {result.forwardLooking.map((fl, i) => (
                  <div key={i} className="p-3 rounded-lg bg-(--bg-card) border border-purple-500/15">
                    <p className="text-sm font-medium">{fl.recommendation}</p>
                    <div className="flex gap-4 mt-1 text-xs text-(--text-tertiary)">
                      <span>⏱ {fl.timeframe}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card p-5 border border-emerald-500/20 bg-emerald-500/5">
            <p className="text-sm">
              <span className="text-emerald-400 font-semibold">Silver Lining: </span>
              <span className="text-(--text-secondary)">{result.silverLining}</span>
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
