"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCompany } from "@/contexts/CompanyContext";
import PnLEngine from "@/components/engines/PnLEngine";
import FutureProofEngine from "@/components/engines/FutureProofEngine";
import BenchmarkEngine from "@/components/engines/BenchmarkEngine";
import RegretEngine from "@/components/engines/RegretEngine";
import DocumentAnalyzer from "@/components/engines/DocumentAnalyzer";
import PdfExport from "@/components/shared/PdfExport";

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
      case "pnl":
        return <PnLEngine />;
      case "futureproof":
        return <FutureProofEngine />;
      case "benchmark":
        return <BenchmarkEngine />;
      case "regret":
        return <RegretEngine />;
      case "docs":
        return <DocumentAnalyzer />;
      case "export":
        return <PdfExport />;
      default:
        return <PnLEngine />;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-bold">
          Welcome back,{" "}
          <span className="bg-linear-to-r from-(--accent-primary) to-(--accent-secondary) bg-clip-text text-transparent">
            {company?.name || "there"}
          </span>
        </h1>
        <p className="text-sm text-(--text-secondary) mt-1">
          {company?.industry} • {company?.size} • Founded {company?.yearFounded}
        </p>
      </motion.div>

      {/* Engine Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
        >
          {renderEngine()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
