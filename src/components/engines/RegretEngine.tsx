"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Plus, Trash2, Loader2, IndianRupee, ArrowRight, Lightbulb } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { useReport } from "@/contexts/ReportContext";

interface DecisionResult {
  id: number; originalDecision: string; missedOpportunityCost: number;
  whatIf: string; estimatedOutcome: string; confidence: string; lesson: string;
}
interface RegretResult {
  totalOpportunityCost: number; decisions: DecisionResult[];
  forwardLooking: { recommendation: string; potentialValue: string; timeframe: string }[];
  emotionalImpact: string; silverLining: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export default function RegretEngine() {
  const { company } = useCompany();
  const { setRegretResult } = useReport();
  const [decisions, setDecisions] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RegretResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dummyDecisions = [
    "I delayed hiring a senior sales manager in 2024 while leads were increasing.",
    "I reduced marketing spend during peak demand months and lost inbound growth momentum.",
    "I postponed launching our premium pricing tier despite strong customer willingness to pay.",
  ];

  const addDecision = () => { if (decisions.length < 3) setDecisions([...decisions, ""]); };
  const removeDecision = (i: number) => { if (decisions.length > 1) setDecisions(decisions.filter((_, idx) => idx !== i)); };
  const updateDecision = (i: number, val: string) => { const d = [...decisions]; d[i] = val; setDecisions(d); };

  const analyze = async () => {
    const filtered = decisions.filter(d => d.trim());
    if (!filtered.length) { setError("Enter at least one past decision"); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/engines/regret", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisions: filtered, companyProfile: company }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.result);
      setRegretResult(data.result);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-500 to-red-600 flex items-center justify-center">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Regret Engine</h2>
          <p className="text-sm text-(--text-secondary)">Calculate missed opportunity cost from past decisions</p>
        </div>
      </div>

      {!result && (
        <div className="glass-card p-6 mb-6">
          <p className="text-sm text-(--text-secondary) mb-4">Describe 1–3 past business decisions you wonder about:</p>
          <div className="space-y-3">
            {decisions.map((d, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-xs text-(--text-tertiary) mt-3 w-6">{i + 1}.</span>
                <input className="input-glass flex-1" placeholder={`e.g. "Didn't hire a sales team in 2023"`} value={d} onChange={(e) => updateDecision(i, e.target.value)} />
                {decisions.length > 1 && <button onClick={() => removeDecision(i)} className="text-red-400 hover:text-red-300 p-2"><Trash2 className="w-4 h-4" /></button>}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            {decisions.length < 3 && <button onClick={addDecision} className="flex items-center gap-1 text-xs text-(--accent-primary) hover:underline"><Plus className="w-3.5 h-3.5" /> Add decision</button>}
            <button
              onClick={() => setDecisions(dummyDecisions)}
              className="text-xs text-(--accent-primary) hover:underline"
              type="button"
            >
              Enter dummy data
            </button>
          </div>
          {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
          <button onClick={analyze} disabled={loading} className="btn-glow w-full mt-4 flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Calculating regret...</> : <><IndianRupee className="w-5 h-5" /> Calculate Opportunity Cost</>}
          </button>
        </div>
      )}

      {loading && <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="shimmer h-24 rounded-xl" />)}</div>}

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Total Banner */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 text-center border border-orange-500/20 bg-linear-to-br from-orange-500/10 to-red-600/10">
            <p className="text-xs text-(--text-tertiary) uppercase tracking-widest mb-2">Total Missed Opportunity Cost</p>
            <p className="text-4xl md:text-5xl font-extrabold text-orange-400">{fmt(result.totalOpportunityCost)}</p>
            <p className="text-sm text-(--text-secondary) mt-3 max-w-md mx-auto italic">&ldquo;{result.emotionalImpact}&rdquo;</p>
          </motion.div>

          {/* Individual Decisions */}
          <div className="space-y-4">
            {result.decisions?.map((dec, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} className="glass-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-(--text-secondary)">Decision #{dec.id || i + 1}</p>
                    <p className="text-base font-semibold mt-0.5">{dec.originalDecision}</p>
                  </div>
                  <span className="text-xl font-extrabold text-orange-400">{fmt(dec.missedOpportunityCost)}</span>
                </div>
                <div className="p-3 rounded-lg bg-(--bg-card) mb-3">
                  <p className="text-xs text-(--text-tertiary) mb-1 flex items-center gap-1"><ArrowRight className="w-3 h-3" /> What if...</p>
                  <p className="text-sm text-(--text-secondary)">{dec.whatIf}</p>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-(--text-secondary)">📊 {dec.estimatedOutcome}</span>
                  <span className={`badge ${dec.confidence === "High" ? "badge-success" : dec.confidence === "Medium" ? "badge-warning" : "badge-info"}`}>{dec.confidence} confidence</span>
                </div>
                <p className="text-xs text-emerald-400 mt-2 flex items-start gap-1"><Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0" />{dec.lesson}</p>
              </motion.div>
            ))}
          </div>

          {/* Forward Looking */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-(--text-secondary) mb-3">🔮 Forward-Looking Recommendations</h3>
            <div className="space-y-3">
              {result.forwardLooking?.map((fl, i) => (
                <div key={i} className="p-3 rounded-lg bg-(--bg-card) border border-emerald-500/15">
                  <p className="text-sm font-medium">{fl.recommendation}</p>
                  <div className="flex gap-4 mt-1 text-xs text-(--text-tertiary)">
                    <span>💰 {fl.potentialValue}</span>
                    <span>⏱ {fl.timeframe}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Silver Lining */}
          <div className="glass-card p-5 border border-emerald-500/20 bg-emerald-500/5">
            <p className="text-sm"><span className="text-emerald-400 font-semibold">Silver Lining: </span><span className="text-(--text-secondary)">{result.silverLining}</span></p>
          </div>

          <button onClick={() => { setResult(null); setDecisions([""]); }} className="text-sm text-(--accent-primary) hover:underline">← Analyze different decisions</button>
        </motion.div>
      )}
    </div>
  );
}
