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
} from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { useReport } from "@/contexts/ReportContext";

interface DecisionResult {
  id: number;
  originalDecision: string;
  missedOpportunityCost: number;
  whatIf: string;
  estimatedOutcome: string;
  confidence: string;
  lesson: string;
}
interface RegretResult {
  totalOpportunityCost: number;
  decisions: DecisionResult[];
  forwardLooking: { recommendation: string; potentialValue: string; timeframe: string }[];
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

  // Require validated P&L data — same gate as Benchmark and FutureProof
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
    } else if (ind.includes("retail") || ind.includes("e-commerce") || ind.includes("ecommerce")) {
      demo = [
        "Overstocked seasonal inventory right before a demand drop",
        "Expanded logistics network too aggressively in Tier 3 cities",
        "Reduced performance marketing budget during peak season"
      ];
    } else if (ind.includes("construction") || ind.includes("real estate")) {
      demo = [
        "Underestimated raw material inflation on fixed-price contracts",
        "Expanded into commercial real estate during weak market demand",
        "Delayed adopting project management software for site tracking"
      ];
    } else if (ind.includes("manufacturing") || ind.includes("industrial")) {
      demo = [
        "Delayed automation upgrades on the primary assembly line",
        "Maintained single-supplier dependency for critical components",
        "Ignored predictive maintenance warnings on key machinery"
      ];
    } else if (ind.includes("finance") || ind.includes("banking") || ind.includes("fintech")) {
      demo = [
        "Delayed launch of mobile-first onboarding experience",
        "Underinvested in cybersecurity infrastructure ahead of compliance audit",
        "Ignored rising customer acquisition costs on primary channels"
      ];
    } else if (ind.includes("health") || ind.includes("pharma")) {
      demo = [
        "Delayed telemedicine integration post-pandemic",
        "Overinvested in generic drug inventory before price caps",
        "Underestimated time required for regulatory compliance updates"
      ];
    } else {
      demo = [
        "Delayed digital transformation initiatives by a year",
        "Hired aggressively for a new division that failed to find product-market fit",
        "Cut R&D budget to meet short-term profitability goals"
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-500 to-red-600 flex items-center justify-center">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Regret Engine</h2>
          <p className="text-sm text-(--text-secondary)">
            Calculate missed opportunity cost from past decisions — grounded in your financials
          </p>
        </div>
      </div>

      {/* P&L Gate Warning */}
      {!hasValidatedPnl && (
        <div className="glass-card p-5 mb-6 border border-amber-500/30 bg-amber-500/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-300 mb-1">
                Financial Data Required
              </p>
              <p className="text-sm text-amber-200">
                Upload financial data first to generate grounded regret analysis. Run the{" "}
                <strong>P&amp;L Engine</strong> with a valid uploaded CSV, then return here.
                Regret costs are calculated proportionally from your actual revenue — not
                guessed from a bracket.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data source badge when P&L is available */}
      {hasValidatedPnl && !result && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 w-fit">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-400">
            Grounded in uploaded P&amp;L — Revenue:{" "}
            {fmt(reportData.computedFinancials!.totalRevenue)} · Confidence:{" "}
            {reportData.computedFinancials!.confidence.toFixed(0)}%
          </span>
        </div>
      )}

      {/* Input Form */}
      {!result && (
        <div className="glass-card p-6 mb-6">
          <p className="text-sm text-(--text-secondary) mb-4">
            Describe 1–3 past business decisions you wonder about:
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
              <Lightbulb className="w-3.5 h-3.5" /> Use Demo Decisions
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
                <Loader2 className="w-5 h-5 animate-spin" /> Calculating regret...
              </>
            ) : (
              <>
                <IndianRupee className="w-5 h-5" /> Calculate Opportunity Cost
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
          {/* Data source label */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 w-fit">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400">
              {result.dataSourceLabel || "Grounded in uploaded P&L data"}
              {result.pnlConfidence !== undefined && ` · P&L Confidence: ${result.pnlConfidence.toFixed(0)}%`}
            </span>
          </div>

          {/* Total Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 text-center border border-orange-500/20 bg-linear-to-br from-orange-500/10 to-red-600/10"
          >
            <p className="text-xs text-(--text-tertiary) uppercase tracking-widest mb-2">
              Total Financial Impact Evaluated
            </p>
            <p className="text-4xl md:text-5xl font-extrabold text-orange-400">
              {fmt(result.totalOpportunityCost)}
            </p>
            <p className="text-xs text-(--text-tertiary) mt-1">
              Proportional estimate based on uploaded annual revenue
            </p>
            <p className="text-sm text-(--text-secondary) mt-3 max-w-md mx-auto italic">
              &ldquo;{result.emotionalImpact}&rdquo;
            </p>
          </motion.div>

          {/* Individual Decisions */}
          <div className="space-y-4">
            {result.decisions?.map((dec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`glass-card p-5 border-l-4 ${dec.isGoodDecision ? "border-l-emerald-500" : "border-l-orange-500"}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-(--text-secondary)">
                      Decision #{dec.id || i + 1}
                    </p>
                    <p className="text-base font-semibold mt-0.5">{dec.originalDecision}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xl font-extrabold ${dec.isGoodDecision ? "text-emerald-400" : "text-orange-400"}`}>
                      {fmt(dec.missedOpportunityCost)}
                    </span>
                    <p className="text-xs text-(--text-tertiary) mt-0.5">
                      {dec.isGoodDecision ? "value generated" : "opportunity cost"}
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-(--bg-card) mb-3">
                  <p className="text-xs text-(--text-tertiary) mb-1 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" /> What if...
                  </p>
                  <p className="text-sm text-(--text-secondary)">{dec.whatIf}</p>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-(--text-secondary)">📊 {dec.estimatedOutcome}</span>
                  <span
                    className={`badge ${
                      dec.confidence === "High"
                        ? "badge-success"
                        : dec.confidence === "Medium"
                        ? "badge-warning"
                        : "badge-info"
                    }`}
                  >
                    {dec.confidence} confidence
                  </span>
                </div>
                <p className="text-xs text-emerald-400 mt-2 flex items-start gap-1">
                  <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  {dec.lesson}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Forward Looking */}
          {result.forwardLooking?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-(--text-secondary) mb-3">
                🔮 Forward-Looking Recommendations
              </h3>
              <div className="space-y-3">
                {result.forwardLooking.map((fl, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-(--bg-card) border border-emerald-500/15"
                  >
                    <p className="text-sm font-medium">{fl.recommendation}</p>
                    <div className="flex gap-4 mt-1 text-xs text-(--text-tertiary)">
                      <span>💰 {fl.potentialValue}</span>
                      <span>⏱ {fl.timeframe}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Silver Lining */}
          <div className="glass-card p-5 border border-emerald-500/20 bg-emerald-500/5">
            <p className="text-sm">
              <span className="text-emerald-400 font-semibold">Silver Lining: </span>
              <span className="text-(--text-secondary)">{result.silverLining}</span>
            </p>
          </div>

          <button
            onClick={() => {
              setResult(null);
              setDecisions([""]);
            }}
            className="text-sm text-(--accent-primary) hover:underline"
          >
            ← Analyze different decisions
          </button>
        </motion.div>
      )}
    </div>
  );
}
