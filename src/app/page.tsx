"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  Shield,
  BarChart3,
  Clock,
  ArrowRight,
  Lock,
  Zap,
  Brain,
} from "lucide-react";
import Link from "next/link";

const engines = [
  {
    icon: TrendingUp,
    title: "P&L Engine",
    desc: "Upload financials, get instant profit & loss verdicts with AI.",
    gradient: "from-emerald-500/20 to-teal-600/20",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: Shield,
    title: "FutureProof",
    desc: "Top 5 risks + 5-year threat timeline for your industry.",
    gradient: "from-violet-500/20 to-purple-600/20",
    border: "border-violet-500/20",
    iconColor: "text-violet-400",
  },
  {
    icon: BarChart3,
    title: "Benchmark",
    desc: "AI-synthesised comparisons vs 1,000+ similar companies.",
    gradient: "from-blue-500/20 to-cyan-600/20",
    border: "border-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: Clock,
    title: "Regret Engine",
    desc: 'Calculate "missed opportunity cost in ₹" from past decisions.',
    gradient: "from-orange-500/20 to-red-600/20",
    border: "border-orange-500/20",
    iconColor: "text-orange-400",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="grid-bg" />
      <div className="orb orb-cyan" />
      <div className="orb orb-purple" />
      <div className="orb orb-emerald" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-(--accent-primary) to-(--accent-secondary) flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">VentureIQ</span>
        </div>
        <Link
          href="/onboard"
          className="text-sm font-medium text-(--text-secondary) hover:text-(--accent-primary) transition-colors"
        >
          Get Started →
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-20 md:pt-28 md:pb-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <span className="badge badge-info">
            <Zap className="w-3 h-3" /> Powered by AI
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight max-w-4xl"
        >
          Analyse Your Business{" "}
          <span className="bg-linear-to-r from-(--accent-primary) to-(--accent-secondary) bg-clip-text text-transparent">
            in 90 Seconds
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7 }}
          className="mt-6 text-lg md:text-xl text-(--text-secondary) max-w-2xl leading-relaxed"
        >
          Upload your financials, describe your decisions, and let AI deliver
          instant P&L verdicts, risk forecasts, industry benchmarks, and
          opportunity cost calculations.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="mt-10 flex flex-col sm:flex-row gap-4"
        >
          <Link href="/onboard">
            <button className="btn-glow flex items-center gap-2 text-base px-8 py-4">
              Analyse My Business
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="mt-8 flex items-center gap-6 text-xs text-(--text-tertiary)"
        >
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Data never leaves your device
          </span>
          <span className="w-1 h-1 rounded-full bg-(--text-tertiary)" />
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Results in under 90 seconds
          </span>
        </motion.div>
      </section>

      {/* Engine Cards */}
      <section className="relative z-10 px-6 md:px-12 pb-24">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-sm font-semibold text-(--text-tertiary) uppercase tracking-widest mb-12"
          >
            Four AI Engines. One Dashboard.
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {engines.map((engine, i) => (
              <motion.div
                key={engine.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className={`glass-card p-6 bg-linear-to-br ${engine.gradient} border ${engine.border}`}
              >
                <engine.icon className={`w-8 h-8 ${engine.iconColor} mb-4`} />
                <h3 className="text-lg font-semibold mb-2">{engine.title}</h3>
                <p className="text-sm text-(--text-secondary) leading-relaxed">
                  {engine.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 px-6 pb-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass-card p-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to see the truth about your business?
            </h2>
            <p className="text-(--text-secondary) mb-8">
              No sign-up required. No data stored. Just instant AI insights.
            </p>
            <Link href="/onboard">
              <button className="btn-glow flex items-center gap-2 mx-auto text-base px-8 py-4">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-(--border-glass) py-8 text-center text-xs text-(--text-tertiary)">
        <p>© 2026 VentureIQ. Built for the future of business intelligence.</p>
      </footer>
    </main>
  );
}
