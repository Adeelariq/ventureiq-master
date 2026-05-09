"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { ComputedFinancials } from "@/lib/financial-parser";

// ── P&L ────────────────────────────────────────────────────────────────────────
export interface PnLResult {
  summary: {
    totalRevenue: number;
    totalCosts: number;
    netProfitLoss: number;
    profitMargin: number;
    verdict: string;
    dataCompleteness: number;
    confidence: number;
    missingFields: string[];
  };
  revenueItems: { name: string; amount: number; percentage: number }[];
  costItems: { name: string; amount: number; percentage: number }[];
  recommendations: { title: string; description: string; impact: string }[];
  insights: string[];
}

// ── Benchmark ──────────────────────────────────────────────────────────────────
export interface BMResult {
  overallScore: number;
  percentile: number;
  categories: { name: string; score: number; industryAvg: number; percentile: number; insight: string }[];
  strengths: string[];
  improvements: { area: string; suggestion: string; potentialImpact: string }[];
  peerComparison: string;
  companiesAnalyzed: number;
  dataSourceLabel?: string;
}

// ── FutureProof ────────────────────────────────────────────────────────────────
export interface FPResult {
  riskScore: number;
  risks: {
    id: number; title: string; severity: number; probability: number;
    category: string; description: string; mitigation: string;
  }[];
  timeline: {
    year: number;
    threats: { title: string; probability: number; impact: string; description: string }[];
  }[];
  summary: string;
  dataSourceLabel?: string;
}

// ── Regret ─────────────────────────────────────────────────────────────────────
export interface RegretResult {
  totalOpportunityCost: number;
  decisions: {
    id: number; originalDecision: string; missedOpportunityCost: number;
    whatIf: string; estimatedOutcome: string; confidence: string; lesson: string;
  }[];
  forwardLooking: { recommendation: string; potentialValue: string; timeframe: string }[];
  emotionalImpact: string;
  silverLining: string;
}

// ── Context ────────────────────────────────────────────────────────────────────
interface ReportData {
  pnl?: PnLResult;
  computedFinancials?: ComputedFinancials;
  benchmark?: BMResult;
  futureproof?: FPResult;
  regret?: RegretResult;
}

interface ReportContextType {
  reportData: ReportData;
  setPnLResult: (r: PnLResult, computedFinancials?: ComputedFinancials) => void;
  setBenchmarkResult: (r: BMResult) => void;
  setFutureproofResult: (r: FPResult) => void;
  setRegretResult: (r: RegretResult) => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function ReportProvider({ children }: { children: ReactNode }) {
  const [reportData, setReportData] = useState<ReportData>({});

  const setPnLResult = (r: PnLResult, computedFinancials?: ComputedFinancials) =>
    setReportData((prev) => ({ ...prev, pnl: r, computedFinancials }));
  const setBenchmarkResult = (r: BMResult) =>
    setReportData((prev) => ({ ...prev, benchmark: r }));
  const setFutureproofResult = (r: FPResult) =>
    setReportData((prev) => ({ ...prev, futureproof: r }));
  const setRegretResult = (r: RegretResult) =>
    setReportData((prev) => ({ ...prev, regret: r }));

  return (
    <ReportContext.Provider
      value={{ reportData, setPnLResult, setBenchmarkResult, setFutureproofResult, setRegretResult }}
    >
      {children}
    </ReportContext.Provider>
  );
}

export function useReport() {
  const ctx = useContext(ReportContext);
  if (!ctx) throw new Error("useReport must be used within ReportProvider");
  return ctx;
}
