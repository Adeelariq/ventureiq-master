"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCompany } from "@/contexts/CompanyContext";
import PnLEngine from "@/components/engines/PnLEngine";
import FutureProofEngine from "@/components/engines/FutureProofEngine";
import BenchmarkEngine from "@/components/engines/BenchmarkEngine";
import RegretEngine from "@/components/engines/RegretEngine";
import DocumentAnalyzer from "@/components/engines/DocumentAnalyzer";
import PdfExport from "@/components/shared/PdfExport";

const engineLabels: Record<string, string> = {
  pnl:         "P&L Engine",
  futureproof: "FutureProof",
  benchmark:   "Benchmark Engine",
  regret:      "Regret Engine",
  docs:        "Document Analyzer",
  export:      "Export PDF",
};

const engineSublabels: Record<string, string> = {
  pnl:         "Revenue & cost analysis",
  futureproof: "Risk forecast · 5-year threat timeline",
  benchmark:   "Peer comparison across 6 dimensions",
  regret:      "Opportunity cost of past decisions",
  docs:        "RAG-powered document Q&A",
  export:      "Generate structured PDF report",
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("pnl");
  const { company } = useCompany();

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      setActiveTab(customEvent.detail);
    };
    window.addEventListener("ventureiq:tab", handler);
    return () => window.removeEventListener("ventureiq:tab", handler);
  }, []);

  const renderEngine = () => {
    switch (activeTab) {
      case "pnl":         return <PnLEngine />;
      case "futureproof": return <FutureProofEngine />;
      case "benchmark":   return <BenchmarkEngine />;
      case "regret":      return <RegretEngine />;
      case "docs":        return <DocumentAnalyzer />;
      case "export":      return <PdfExport />;
      default:            return <PnLEngine />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Context bar — compact, terminal-style, not a marketing header */}
      <div
        className="shrink-0 px-6 h-12 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-sm font-semibold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {company?.name || "Dashboard"}
          </span>
          {company?.industry && (
            <>
              <span style={{ color: "var(--border-strong)" }}>·</span>
              <span
                className="text-xs truncate hidden sm:block"
                style={{ color: "var(--text-secondary)" }}
              >
                {company.industry}
              </span>
            </>
          )}
          {company?.size && (
            <>
              <span
                className="hidden md:block"
                style={{ color: "var(--border-strong)" }}
              >
                ·
              </span>
              <span
                className="text-[11px] hidden md:block"
                style={{
                  color: "var(--text-secondary)",
                  fontFamily: "monospace",
                }}
              >
                {company.size}
              </span>
            </>
          )}
          {company?.yearFounded && (
            <>
              <span
                className="hidden md:block"
                style={{ color: "var(--border-strong)" }}
              >
                ·
              </span>
              <span
                className="text-[11px] hidden md:block"
                style={{ color: "var(--text-tertiary)" }}
              >
                Est. {company.yearFounded}
              </span>
            </>
          )}
        </div>

        {/* Active engine indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider hidden sm:block"
            style={{ color: "var(--text-tertiary)" }}
          >
            {engineSublabels[activeTab]}
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded"
            style={{
              background: "var(--accent-dim)",
              color: "var(--accent)",
              border: "1px solid var(--accent-border)",
            }}
          >
            {engineLabels[activeTab]}
          </span>
        </div>
      </div>

      {/* Engine content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {renderEngine()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
