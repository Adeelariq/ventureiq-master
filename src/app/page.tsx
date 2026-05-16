"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Shield,
  BarChart3,
  Clock,
  ArrowRight,
  FileText,
} from "lucide-react";

const engines = [
  {
    icon: TrendingUp,
    label: "P&L Engine",
    desc: "Upload a CSV to get revenue, cost, and margin analysis with AI-generated recommendations.",
    accent: "text-emerald-500",
    tag: "Financial Analysis",
  },
  {
    icon: Shield,
    label: "FutureProof",
    desc: "Identify the top 5 risks and a 5-year threat timeline specific to your industry and scale.",
    accent: "text-violet-400",
    tag: "Risk Intelligence",
  },
  {
    icon: BarChart3,
    label: "Benchmark Engine",
    desc: "Compare performance across 6 dimensions against 1,000+ peers in your industry segment.",
    accent: "text-blue-400",
    tag: "Competitive Intelligence",
  },
  {
    icon: Clock,
    label: "Regret Engine",
    desc: "Quantify the financial cost of past decisions using deterministic impact modelling.",
    accent: "text-amber-400",
    tag: "Decision Analysis",
  },
];

const stats = [
  { value: "90s", label: "Time to first insight" },
  { value: "5", label: "Analytical engines" },
  { value: "0", label: "Data stored server-side" },
];

export default function LandingPage() {
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-6 md:px-10 h-14 border-b shrink-0"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ background: "var(--accent)" }}
          >
            <TrendingUp className="w-3.5 h-3.5 text-white" />
          </div>
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            VentureIQ
          </span>
        </div>

        <div className="flex items-center gap-6">
          <span
            className="text-xs hidden md:block"
            style={{ color: "var(--text-secondary)" }}
          >
            Business Intelligence Platform
          </span>
          <Link href="/onboard">
            <button className="btn-primary text-xs px-4 py-2">
              Get Started <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col px-6 md:px-10 pt-16 pb-10 md:pt-20">
        <div className="max-w-4xl">
          {/* Label */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 mb-6"
          >
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--accent)" }}
            >
              Financial Intelligence
            </span>
            <span
              className="w-6 h-px"
              style={{ background: "var(--accent)", opacity: 0.4 }}
            />
            <span
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              Built for founders & operators
            </span>
          </motion.div>

          {/* Headline — weight contrast, no gradient */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.5 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight mb-5"
            style={{ color: "var(--text-primary)" }}
          >
            Five engines.
            <br />
            <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>
              One analytical layer.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.5 }}
            className="text-base md:text-lg leading-relaxed max-w-2xl mb-8"
            style={{ color: "var(--text-secondary)" }}
          >
            Upload your financials and get P&L verdicts, risk forecasts, industry
            benchmarks, and opportunity-cost calculations — in under 90 seconds.
            No signup. No data retention.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            className="flex flex-col sm:flex-row items-start gap-4"
          >
            <Link href="/onboard">
              <button className="btn-primary flex items-center gap-2 px-6 py-3 text-sm">
                Analyse My Business
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <div
              className="flex items-center gap-5 text-xs pt-3 sm:pt-0"
              style={{ color: "var(--text-secondary)" }}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--success)" }}
                />
                No sign-up required
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--success)" }}
                />
                Client-side processing
              </span>
            </div>
          </motion.div>
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="flex items-center gap-8 mt-12 pt-8"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          {stats.map((s) => (
            <div key={s.label}>
              <p
                className="text-2xl font-bold tabular-nums tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {s.value}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-secondary)" }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Engines grid */}
      <section
        className="px-6 md:px-10 pb-16"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <div className="pt-8 mb-6 flex items-center justify-between">
          <h2
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-secondary)" }}
          >
            Platform Engines
          </h2>
          <Link href="/onboard">
            <span
              className="text-xs hover:underline cursor-pointer"
              style={{ color: "var(--accent)" }}
            >
              Launch dashboard →
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {engines.map((e, i) => (
            <motion.div
              key={e.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              className="card p-5 group cursor-default"
            >
              <div className="flex items-start justify-between mb-4">
                <e.icon className={`w-5 h-5 ${e.accent}`} />
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{
                    background: "var(--bg-elevated)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {e.tag}
                </span>
              </div>
              <h3
                className="text-sm font-semibold mb-1.5"
                style={{ color: "var(--text-primary)" }}
              >
                {e.label}
              </h3>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {e.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Document analyzer callout */}
      <section
        className="px-6 md:px-10 pb-16"
      >
        <div
          className="card p-6 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div className="flex items-start gap-4">
            <FileText
              className="w-5 h-5 mt-0.5 shrink-0"
              style={{ color: "var(--accent)" }}
            />
            <div>
              <p
                className="text-sm font-semibold mb-0.5"
                style={{ color: "var(--text-primary)" }}
              >
                Document Analyzer
              </p>
              <p
                className="text-xs leading-relaxed max-w-lg"
                style={{ color: "var(--text-secondary)" }}
              >
                Upload any financial PDF — annual reports, pitch decks, board
                memos — and ask questions in plain language. 1M token context,
                zero data stored.
              </p>
            </div>
          </div>
          <Link href="/onboard" className="shrink-0">
            <button className="btn-ghost text-xs px-4 py-2 whitespace-nowrap">
              Open Analyzer →
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 md:px-10 py-5 flex items-center justify-between text-xs"
        style={{
          borderTop: "1px solid var(--border-subtle)",
          color: "var(--text-secondary)",
        }}
      >
        <span>VentureIQ — AI-Powered Business Intelligence</span>
        <span style={{ color: "var(--text-tertiary)" }}>
          © 2026
        </span>
      </footer>
    </main>
  );
}
