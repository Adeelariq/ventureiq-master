"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock, Plus, Trash2, Loader2, IndianRupee,
  Lightbulb, AlertTriangle, Database, Activity,
  ShieldCheck, TrendingDown,
} from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { useReport } from "@/contexts/ReportContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";

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
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);

const CHART_STYLE = {
  background: "#0b1018",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 6,
  color: "#dde3ef",
  fontSize: 12,
};

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

  const addDecision = () => { if (decisions.length < 3) setDecisions([...decisions, ""]); };
  const removeDecision = (i: number) => {
    if (decisions.length > 1) setDecisions(decisions.filter((_, idx) => idx !== i));
  };
  const updateDecision = (i: number, val: string) => {
    const d = [...decisions]; d[i] = val; setDecisions(d);
  };

  const handleLoadDemo = () => {
    const ind = (company?.industry || "").toLowerCase();
    let demo: string[];
    if (ind.includes("saas") || ind.includes("software") || ind.includes("tech")) {
      demo = [
        "Delayed AI integration in core product by 12 months",
        "Ignored rising churn rate among mid-market customers",
        "Overspent on cloud infrastructure without optimization",
      ];
    } else if (ind.includes("retail") || ind.includes("e-commerce")) {
      demo = [
        "Overstocked seasonal inventory right before a demand drop",
        "Expanded logistics network too aggressively in Tier 3 cities",
      ];
    } else {
      demo = [
        "Delayed digital transformation initiatives by a year",
        "Hired aggressively for a new division that failed to find product-market fit",
      ];
    }
    setDecisions(demo);
  };

  const analyze = async () => {
    const filtered = decisions.filter((d) => d.trim());
    if (!filtered.length) { setError("Enter at least one past decision"); return; }
    if (!hasValidatedPnl) { setError("Upload financial data in the P&L Engine first."); return; }
    setLoading(true); setError(null); setResult(null);
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
    } finally { setLoading(false); }
  };

  const chartData = result && reportData.computedFinancials
    ? [
        { name: "Annual Revenue", value: reportData.computedFinancials.totalRevenue, type: "revenue" },
        {
          name: result.totalOpportunityCost >= 0 ? "Value Generated" : "Opportunity Cost",
          value: Math.abs(result.totalOpportunityCost),
          type: "impact",
        },
      ]
    : [];

  return (
    <div>
      {/* Engine header */}
      <div className="engine-header">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4" style={{ color: "var(--warning)" }} />
          <div>
            <h2 className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Regret Engine
            </h2>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Deterministic financial impact of past decisions
            </p>
          </div>
        </div>
        {result && (
          <button
            onClick={() => { setResult(null); setDecisions([""]); }}
            className="text-xs"
            style={{ color: "var(--accent)" }}
          >
            Analyze new decisions
          </button>
        )}
      </div>

      {/* P&L gate */}
      {!hasValidatedPnl && (
        <div
          className="card p-4 mb-5 flex items-start gap-3"
          style={{ borderColor: "var(--warning-border)", background: "var(--warning-dim)" }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--warning)" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--warning)" }}>Financial data required</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Run the P&L Engine with a valid CSV first. The Regret Engine uses your financial baseline to compute deterministic impact.
            </p>
          </div>
        </div>
      )}

      {/* P&L data indicator */}
      {hasValidatedPnl && !result && (
        <div
          className="flex items-center gap-2 mb-4 px-3 py-2 rounded-md w-fit text-xs"
          style={{
            background: "var(--success-dim)",
            border: "1px solid var(--success-border)",
            color: "var(--success)",
          }}
        >
          <Database className="w-3.5 h-3.5" />
          Revenue: {fmt(reportData.computedFinancials!.totalRevenue)} · Confidence:{" "}
          {reportData.computedFinancials!.confidence.toFixed(0)}%
        </div>
      )}

      {/* Input form */}
      {!result && (
        <div className="card p-5 mb-5" style={{ borderColor: "var(--border-default)" }}>
          <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
            Describe 1–3 past business decisions to compute their financial impact:
          </p>
          <div className="space-y-2.5">
            {decisions.map((d, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span
                  className="text-xs w-5 shrink-0 tabular-nums text-right"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {i + 1}.
                </span>
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
                    className="shrink-0 p-1.5 rounded transition-colors"
                    style={{ color: "var(--danger)" }}
                    disabled={!hasValidatedPnl}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-3">
            {decisions.length < 3 && (
              <button
                onClick={addDecision}
                disabled={!hasValidatedPnl}
                className="flex items-center gap-1 text-xs disabled:opacity-40"
                style={{ color: "var(--accent)" }}
              >
                <Plus className="w-3.5 h-3.5" /> Add decision
              </button>
            )}
            <button
              onClick={handleLoadDemo}
              disabled={!hasValidatedPnl}
              className="flex items-center gap-1 text-xs ml-auto disabled:opacity-40"
              style={{ color: "var(--text-secondary)" }}
            >
              <Lightbulb className="w-3.5 h-3.5" /> Demo decisions
            </button>
          </div>

          {error && (
            <p className="text-xs mt-3" style={{ color: "var(--danger)" }}>{error}</p>
          )}

          <button
            onClick={analyze}
            disabled={loading || !hasValidatedPnl}
            className="btn-glow w-full mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Computing impact...</>
            ) : (
              <><IndianRupee className="w-4 h-4" /> Calculate Deterministic Impact</>
            )}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-lg" />)}
        </div>
      )}

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Deterministic badge */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs"
              style={{
                background: "var(--accent-dim)",
                border: "1px solid var(--accent-border)",
                color: "var(--accent)",
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Deterministic — Formula-backed output
            </div>
          </div>

          {/* Net impact hero */}
          <div
            className="card p-6 text-center"
            style={{
              borderColor: result.totalOpportunityCost >= 0
                ? "var(--success-border)"
                : "var(--danger-border)",
            }}
          >
            <p className="metric-label mb-2">Net Financial Impact</p>
            <p
              className="text-4xl font-bold tabular-nums tracking-tight"
              style={{
                color: result.totalOpportunityCost >= 0 ? "var(--success)" : "var(--danger)",
              }}
            >
              {result.totalOpportunityCost >= 0 ? "+" : "−"}{fmt(Math.abs(result.totalOpportunityCost))}
            </p>
            <p className="text-xs mt-3 max-w-md mx-auto italic" style={{ color: "var(--text-secondary)" }}>
              &ldquo;{result.emotionalImpact}&rdquo;
            </p>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="card p-4">
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--text-secondary)" }}
              >
                Financial Proportions
              </p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%" minWidth={1}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: 12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false}
                      tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
                    <Tooltip contentStyle={CHART_STYLE} cursor={{ fill: "rgba(255,255,255,0.03)" }}
                      formatter={(value: any) => [fmt(Number(value)), "Amount"]} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.type === "revenue"
                              ? "var(--accent)"
                              : result.totalOpportunityCost >= 0
                              ? "var(--success)"
                              : "var(--danger)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Decision cards */}
          <div className="space-y-3">
            {result.decisions?.map((dec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }}
                className="card p-4"
                style={{
                  borderLeft: `3px solid ${dec.isGoodDecision ? "var(--success)" : "var(--danger)"}`,
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {dec.category?.replace(/_/g, " ") || "Strategy"}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          background: dec.riskLevel === "High" ? "var(--danger-dim)" : "var(--warning-dim)",
                          color: dec.riskLevel === "High" ? "var(--danger)" : "var(--warning)",
                          border: `1px solid ${dec.riskLevel === "High" ? "var(--danger-border)" : "var(--warning-border)"}`,
                          fontWeight: 600,
                        }}
                      >
                        {dec.riskLevel} Risk
                      </span>
                    </div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {dec.originalDecision}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className="text-lg font-bold tabular-nums"
                      style={{ color: dec.isGoodDecision ? "var(--success)" : "var(--danger)" }}
                    >
                      {dec.isGoodDecision ? "+" : "−"}{fmt(dec.missedOpportunityCost)}
                    </span>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {dec.isGoodDecision ? "value generated" : "opportunity cost"}
                    </p>
                  </div>
                </div>

                {dec.factors && dec.factors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {dec.factors.map((f, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded"
                        style={{
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-3">
                  <div className="p-2.5 rounded-md" style={{ background: "var(--bg-elevated)" }}>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <Activity className="w-3 h-3" /> Impact Vector
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {dec.categoryDescription}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-md" style={{ background: "var(--bg-elevated)" }}>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <TrendingDown className="w-3 h-3" /> What if...
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{dec.whatIf}</p>
                  </div>
                </div>

                <div
                  className="flex items-center justify-between pt-2.5 text-xs"
                  style={{ borderTop: "1px solid var(--border-subtle)" }}
                >
                  <p
                    className="flex items-start gap-1.5"
                    style={{ color: "var(--success)" }}
                  >
                    <Lightbulb className="w-3 h-3 mt-0.5 shrink-0" />
                    {dec.lesson}
                  </p>
                  <div className="flex gap-2 shrink-0 ml-3">
                    <span className="badge badge-info">{dec.confidence}</span>
                    {dec.stabilityRating && (
                      <span className="badge badge-info">{dec.stabilityRating}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Forward looking */}
          {result.forwardLooking?.length > 0 && (
            <div
              className="card p-4"
              style={{ borderTop: "2px solid rgba(167, 139, 250, 0.3)" }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--text-secondary)" }}
              >
                Forward-Looking Strategy
              </p>
              <div className="space-y-2.5">
                {result.forwardLooking.map((fl, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-md"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {fl.recommendation}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>
                      {fl.timeframe}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Silver lining */}
          <div
            className="card p-4"
            style={{ borderColor: "var(--success-border)" }}
          >
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              <span className="font-semibold" style={{ color: "var(--success)" }}>Silver lining — </span>
              {result.silverLining}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
