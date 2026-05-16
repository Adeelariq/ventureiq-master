"use client";

import { useState } from "react";
import { Download, Loader2, FileDown, CheckCircle, AlertCircle } from "lucide-react";
import { useReport } from "@/contexts/ReportContext";
import { useCompany } from "@/contexts/CompanyContext";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function PdfExport() {
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { reportData } = useReport();
  const { company } = useCompany();

  const hasAny = !!(reportData.pnl || reportData.benchmark || reportData.futureproof || reportData.regret);

  const exportPdf = async () => {
    setExporting(true);
    setDone(false);
    setError(null);

    try {
      const { default: jsPDF } = await import("jspdf");
      const pdf = new jsPDF("p", "mm", "a4");

      const W = pdf.internal.pageSize.getWidth();   // 210
      const H = pdf.internal.pageSize.getHeight();  // 297
      const ML = 18, MR = 18, MT = 20;
      const CW = W - ML - MR;
      let y = MT;

      // ── Palette ────────────────────────────────────────────────────────────
      const DARK   = [15, 15, 25]   as [number,number,number];
      const MID    = [30, 30, 50]   as [number,number,number];
      const LIGHT  = [240, 240, 250] as [number,number,number];
      const DIM    = [120, 120, 145] as [number,number,number];
      const GREEN  = [16, 185, 129]  as [number,number,number];
      const RED    = [239, 68, 68]   as [number,number,number];
      const BLUE   = [0, 212, 255]   as [number,number,number];
      const PURPLE = [139, 92, 246]  as [number,number,number];
      const ORANGE = [249, 115, 22]  as [number,number,number];

      // ── Helpers ─────────────────────────────────────────────────────────────
      const newPage = () => {
        pdf.addPage();
        y = MT;
        // subtle header bar
        pdf.setFillColor(...DARK);
        pdf.rect(0, 0, W, 10, "F");
        pdf.setFontSize(7);
        pdf.setTextColor(...DIM);
        pdf.text("VentureIQ Detailed Report", ML, 7);
        pdf.text(`${company?.name || ""}`, W - MR, 7, { align: "right" });
        y = 16;
      };

      const ensureSpace = (needed: number) => {
        if (y + needed > H - 15) newPage();
      };

      const sectionHeader = (title: string, color: [number,number,number]) => {
        ensureSpace(16);
        pdf.setFillColor(...color);
        pdf.roundedRect(ML, y, CW, 10, 2, 2, "F");
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...DARK);
        pdf.text(title, ML + 4, y + 7);
        y += 14;
      };

      const subHeader = (title: string) => {
        ensureSpace(10);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...LIGHT);
        pdf.text(title, ML, y);
        y += 5;
      };

      const bodyText = (text: string, color?: [number,number,number], indent = 0) => {
        pdf.setFontSize(8.5);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...(color || DIM));
        const lines = pdf.splitTextToSize(text, CW - indent);
        ensureSpace(lines.length * 4.5 + 2);
        pdf.text(lines, ML + indent, y);
        y += lines.length * 4.5 + 2;
      };

      const kv = (label: string, value: string, valColor?: [number,number,number]) => {
        ensureSpace(7);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...DIM);
        pdf.text(label, ML + 2, y);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...(valColor || LIGHT));
        pdf.text(value, ML + 55, y);
        y += 5.5;
      };

      const divider = () => {
        ensureSpace(5);
        pdf.setDrawColor(...MID);
        pdf.setLineWidth(0.3);
        pdf.line(ML, y, W - MR, y);
        y += 4;
      };

      const chip = (text: string, bg: [number,number,number], x: number, cy: number) => {
        const tw = pdf.getTextWidth(text) + 4;
        pdf.setFillColor(...bg);
        pdf.roundedRect(x, cy - 3.5, tw, 5, 1, 1, "F");
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...DARK);
        pdf.text(text, x + 2, cy);
        return tw + 2;
      };

      const progressBar = (value: number, max: number, barColor: [number,number,number]) => {
        ensureSpace(8);
        const bw = CW - 4;
        pdf.setFillColor(...MID);
        pdf.roundedRect(ML + 2, y, bw, 3.5, 1, 1, "F");
        pdf.setFillColor(...barColor);
        pdf.roundedRect(ML + 2, y, (bw * Math.min(value, max)) / max, 3.5, 1, 1, "F");
        y += 7;
      };

      // ══════════════════════════════════════════════════════════════════════
      // COVER PAGE
      // ══════════════════════════════════════════════════════════════════════
      pdf.setFillColor(...DARK);
      pdf.rect(0, 0, W, H, "F");

      // accent strip
      pdf.setFillColor(...BLUE);
      pdf.rect(0, 0, 4, H, "F");

      // Logo area
      pdf.setFillColor(30, 30, 55);
      pdf.roundedRect(ML, 30, 36, 36, 4, 4, "F");
      pdf.setFontSize(22);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...BLUE);
      pdf.text("IQ", ML + 10, 54);

      pdf.setFontSize(28);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...LIGHT);
      pdf.text("VentureIQ", ML + 42, 46);

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...DIM);
      pdf.text("AI-Powered Business Intelligence Report", ML + 42, 55);

      // Divider
      pdf.setFillColor(...BLUE);
      pdf.rect(ML, 75, CW, 0.8, "F");

      // Company info
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...LIGHT);
      pdf.text(company?.name || "Your Company", ML, 95);

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...DIM);
      pdf.text(
        [
          company?.industry || "",
          `${company?.size || ""} company`,
          `Founded ${company?.yearFounded || ""}`,
          `Revenue: ${company?.revenue || ""}`,
        ]
          .filter(Boolean)
          .join("  •  "),
        ML,
        104
      );

      // What's inside
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...DIM);
      pdf.text("REPORT CONTENTS", ML, 125);

      const sections = [
        { label: "P&L Analysis", color: GREEN, active: !!reportData.pnl },
        { label: "Industry Benchmark", color: BLUE, active: !!reportData.benchmark },
        { label: "FutureProof Risk Analysis", color: PURPLE, active: !!reportData.futureproof },
        { label: "Regret / Opportunity Cost", color: ORANGE, active: !!reportData.regret },
      ];

      let sy = 133;
      sections.forEach((s) => {
        pdf.setFillColor(s.active ? s.color[0] : 50, s.active ? s.color[1] : 50, s.active ? s.color[2] : 65);
        pdf.circle(ML + 3, sy - 1.5, 2.5, "F");
        pdf.setFontSize(9);
        pdf.setFont("helvetica", s.active ? "bold" : "normal");
        pdf.setTextColor(...(s.active ? LIGHT : DIM));
        pdf.text(s.label + (s.active ? "" : " (not run)"), ML + 9, sy);
        sy += 9;
      });

      // Generated date
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...DIM);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, ML, H - 20);
      pdf.text("Powered by VentureIQ — ventureiq.ai", W - MR, H - 20, { align: "right" });

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 1 — P&L
      // ══════════════════════════════════════════════════════════════════════
      if (reportData.pnl) {
        const pnl = reportData.pnl;
        newPage();

        sectionHeader("📊  P&L Analysis", GREEN);

        // Summary cards
        const verdictColor =
          pnl.summary.verdict === "Profitable" ? GREEN : pnl.summary.verdict === "Break-even" ? ORANGE : RED;
        chip(pnl.summary.verdict.toUpperCase(), verdictColor, ML, y + 4);
        y += 10;

        kv("Total Revenue",   fmt(pnl.summary.totalRevenue),    GREEN);
        kv("Total Costs",     fmt(pnl.summary.totalCosts),      RED);
        kv("Net P&L",         fmt(pnl.summary.netProfitLoss),   pnl.summary.netProfitLoss >= 0 ? GREEN : RED);
        kv("Profit Margin",   `${pnl.summary.profitMargin?.toFixed(1)}%`, BLUE);

        divider();
        subHeader("Revenue Breakdown");
        pnl.revenueItems?.forEach((item) => {
          ensureSpace(10);
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(...LIGHT);
          pdf.text(item.name, ML + 2, y);
          pdf.setTextColor(...GREEN);
          pdf.text(fmt(item.amount), ML + 90, y);
          pdf.setTextColor(...DIM);
          pdf.text(`${item.percentage?.toFixed(1)}%`, ML + 130, y);
          y += 5;
          progressBar(item.amount, pnl.summary.totalRevenue, GREEN);
        });

        divider();
        subHeader("Cost Breakdown");
        pnl.costItems?.forEach((item) => {
          ensureSpace(10);
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(...LIGHT);
          pdf.text(item.name, ML + 2, y);
          pdf.setTextColor(...RED);
          pdf.text(fmt(item.amount), ML + 90, y);
          pdf.setTextColor(...DIM);
          pdf.text(`${item.percentage?.toFixed(1)}%`, ML + 130, y);
          y += 5;
          progressBar(item.amount, pnl.summary.totalCosts, RED);
        });

        divider();
        subHeader("AI Recommendations");
        pnl.recommendations?.forEach((rec, i) => {
          ensureSpace(20);
          const impColor = rec.impact === "high" ? RED : rec.impact === "medium" ? ORANGE : BLUE;
          chip(rec.impact.toUpperCase(), impColor, ML, y + 4);
          pdf.setFontSize(8.5);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(...LIGHT);
          const title = `${i + 1}. ${rec.title}`;
          pdf.text(title, ML + 22, y + 4);
          y += 9;
          bodyText(rec.description, DIM, 4);
        });

        if (pnl.insights?.length) {
          divider();
          subHeader("Key Insights");
          pnl.insights.forEach((ins) => bodyText(`• ${ins}`, DIM, 2));
        }
      }

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 2 — BENCHMARK
      // ══════════════════════════════════════════════════════════════════════
      if (reportData.benchmark) {
        const bm = reportData.benchmark;
        newPage();
        sectionHeader("🏆  Industry Benchmark", BLUE);

        kv("Overall Score",     `${bm.overallScore} / 100`,                  BLUE);
        kv("Percentile Rank",   `Top ${100 - bm.percentile}%`,               GREEN);
        kv("Companies Analysed", bm.companiesAnalyzed?.toLocaleString() || "-", DIM);

        divider();
        subHeader("Category Scores");
        bm.categories?.forEach((cat) => {
          ensureSpace(16);
          const barColor = cat.score >= cat.industryAvg ? GREEN : ORANGE;
          pdf.setFontSize(8.5);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(...LIGHT);
          pdf.text(cat.name, ML + 2, y);
          pdf.setTextColor(...barColor);
          pdf.text(`${cat.score}/100`, ML + 120, y);
          pdf.setTextColor(...DIM);
          pdf.text(`Avg: ${cat.industryAvg}`, ML + 145, y);
          y += 5;
          progressBar(cat.score, 100, barColor);
          bodyText(`Top ${100 - cat.percentile}% — ${cat.insight}`, DIM, 4);
        });

        divider();
        subHeader("Strengths");
        bm.strengths?.forEach((s) => bodyText(`✦  ${s}`, GREEN, 2));

        divider();
        subHeader("Areas for Improvement");
        bm.improvements?.forEach((imp, i) => {
          ensureSpace(18);
          pdf.setFontSize(8.5);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(...LIGHT);
          pdf.text(`${i + 1}. ${imp.area}`, ML + 2, y);
          y += 5;
          bodyText(imp.suggestion, DIM, 4);
          bodyText(`💡 ${imp.potentialImpact}`, BLUE, 4);
        });

        ensureSpace(8);
        bodyText(bm.peerComparison, DIM, 0);
      }

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 3 — FUTUREPROOF
      // ══════════════════════════════════════════════════════════════════════
      if (reportData.futureproof) {
        const fp = reportData.futureproof;
        newPage();
        sectionHeader("🛡️  FutureProof Risk Analysis", PURPLE);

        const riskColor = fp.riskScore >= 70 ? RED : fp.riskScore >= 40 ? ORANGE : GREEN;
        kv("Overall Risk Score", `${fp.riskScore} / 100`, riskColor);
        ensureSpace(8);
        progressBar(fp.riskScore, 100, riskColor);
        bodyText(fp.summary, DIM, 0);

        divider();
        subHeader("Top Risks");
        fp.risks?.forEach((risk) => {
          ensureSpace(28);
          const sevColor = risk.severity >= 8 ? RED : risk.severity >= 6 ? ORANGE : risk.severity >= 4 ? [234, 179, 8] as [number,number,number] : GREEN;
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(...sevColor);
          pdf.text(`${risk.severity}`, ML + 2, y + 1);
          pdf.setTextColor(...LIGHT);
          pdf.text(risk.title, ML + 12, y + 1);
          chip(risk.category, MID, ML + 120, y + 1);
          pdf.setTextColor(...DIM);
          pdf.setFontSize(7.5);
          pdf.text(`${risk.probability}% probable`, W - MR - 2, y + 1, { align: "right" });
          y += 7;
          bodyText(risk.description, DIM, 10);
          bodyText(`⚡ Mitigation: ${risk.mitigation}`, GREEN, 10);
          y += 2;
        });

        divider();
        subHeader("5-Year Threat Timeline");
        fp.timeline?.forEach((yr) => {
          ensureSpace(12);
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(...PURPLE);
          pdf.text(`${yr.year}`, ML + 2, y);
          y += 5;
          yr.threats?.forEach((t) => {
            ensureSpace(14);
            const impClr = t.impact === "Critical" ? RED : t.impact === "High" ? ORANGE : t.impact === "Medium" ? BLUE : GREEN;
            chip(t.impact, impClr, ML + 6, y + 3);
            pdf.setFontSize(8.5);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(...LIGHT);
            pdf.text(t.title, ML + 30, y + 3);
            pdf.setTextColor(...DIM);
            pdf.setFontSize(7.5);
            pdf.text(`${t.probability}%`, W - MR, y + 3, { align: "right" });
            y += 8;
            bodyText(t.description, DIM, 8);
          });
        });
      }

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 4 — REGRET ENGINE
      // ══════════════════════════════════════════════════════════════════════
      if (reportData.regret) {
        const rg = reportData.regret;
        newPage();
        sectionHeader("⏳  Regret Engine — Opportunity Cost", ORANGE);

        // Hero number
        pdf.setFontSize(24);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...ORANGE);
        pdf.text(fmt(rg.totalOpportunityCost), ML, y + 6);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...DIM);
        pdf.text("Total Missed Opportunity Cost", ML, y + 13);
        y += 20;

        bodyText(`"${rg.emotionalImpact}"`, DIM, 0);
        y += 2;

        divider();
        subHeader("Decision Analysis");
        rg.decisions?.forEach((dec, i) => {
          ensureSpace(36);
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(...DIM);
          pdf.text(`Decision #${dec.id || i + 1}`, ML + 2, y);
          y += 5;
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(...LIGHT);
          pdf.text(dec.originalDecision, ML + 2, y);
          pdf.setTextColor(...ORANGE);
          pdf.text(fmt(dec.missedOpportunityCost), W - MR, y, { align: "right" });
          y += 6;
          bodyText(`→ What if: ${dec.whatIf}`, DIM, 4);
          bodyText(`📊 ${dec.estimatedOutcome}`, DIM, 4);
          const confColor = dec.confidence === "High" ? GREEN : dec.confidence === "Medium" ? ORANGE : BLUE;
          ensureSpace(6);
          chip(`${dec.confidence} confidence`, confColor, ML + 4, y + 3);
          y += 8;
          bodyText(`💡 Lesson: ${dec.lesson}`, GREEN, 4);
          y += 2;
          divider();
        });

        subHeader("Forward-Looking Recommendations");
        rg.forwardLooking?.forEach((fl, i) => {
          ensureSpace(18);
          pdf.setFontSize(8.5);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(...LIGHT);
          pdf.text(`${i + 1}. ${fl.recommendation}`, ML + 2, y);
          y += 5;
          bodyText(`💰 ${fl.potentialValue}   ⏱ ${fl.timeframe}`, DIM, 4);
          y += 1;
        });

        ensureSpace(14);
        pdf.setFillColor(22, 101, 52);
        pdf.roundedRect(ML, y, CW, 12, 2, 2, "F");
        pdf.setFontSize(8.5);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...GREEN);
        pdf.text("Silver Lining:", ML + 4, y + 5);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...LIGHT);
        const slLines = pdf.splitTextToSize(rg.silverLining, CW - 36);
        pdf.text(slLines[0] || "", ML + 32, y + 5);
        y += 16;
      }

      // ══════════════════════════════════════════════════════════════════════
      // LAST PAGE — footer
      // ══════════════════════════════════════════════════════════════════════
      ensureSpace(20);
      divider();
      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(...DIM);
      pdf.text(
        "This report was generated by VentureIQ. Financial figures are computed from uploaded data when available; AI content is narrative support and not professional financial advice.",
        ML,
        y,
        { maxWidth: CW }
      );
      y += 8;
      pdf.text(`Generated on ${new Date().toLocaleString()} for ${company?.name || ""}`, ML, y);

      // Page numbers
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setTextColor(...DIM);
        pdf.text(`Page ${i} of ${totalPages}`, W - MR, H - 6, { align: "right" });
      }

      pdf.save(`VentureIQ-Report-${company?.name || "Business"}-${new Date().toISOString().split("T")[0]}.pdf`);
      setDone(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to generate PDF report."
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-pink-500 to-rose-600 flex items-center justify-center">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Export Detailed PDF Report</h2>
          <p className="text-sm text-[var(--text-secondary)]">Full data export — every number, insight & recommendation</p>
        </div>
      </div>

      {/* Engine Status */}
      <div className="glass-card p-5 mb-5">
        <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">
          Engines Ready for Export
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: "pnl",         label: "P&L Analysis",        color: "text-emerald-400" },
            { key: "benchmark",   label: "Benchmark",           color: "text-blue-400"    },
            { key: "futureproof", label: "FutureProof Risks",   color: "text-violet-400"  },
            { key: "regret",      label: "Regret Engine",       color: "text-orange-400"  },
          ].map(({ key, label, color }) => {
            const ready = !!(reportData as Record<string, unknown>)[key];
            return (
              <div key={key} className={`flex items-center gap-2 text-sm ${ready ? color : "text-[var(--text-tertiary)]"}`}>
                {ready
                  ? <CheckCircle className="w-4 h-4" />
                  : <AlertCircle className="w-4 h-4 opacity-40" />}
                <span className={ready ? "font-medium" : "opacity-40"}>{label}</span>
              </div>
            );
          })}
        </div>
        {!hasAny && (
          <p className="text-xs text-[var(--text-tertiary)] mt-4">
            💡 Run at least one engine first, then come back to export.
          </p>
        )}
      </div>

      <div className="glass-card p-8 text-center">
        <FileDown className="w-16 h-16 text-[var(--text-tertiary)] mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Generate Full Data Report</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
          Downloads a multi-page PDF with every table, metric, recommendation and insight
          from all engines you have run — no screenshots, real data.
        </p>

        {done && (
          <div className="flex items-center justify-center gap-2 text-emerald-400 mb-4">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Report downloaded successfully!</span>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center gap-2 text-red-400 mb-4">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <button
          onClick={exportPdf}
          disabled={exporting || !hasAny}
          className="btn-glow px-8 py-4 text-base flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Building PDF...</>
            : <><Download className="w-5 h-5" /> Download Detailed Report</>}
        </button>

        <p className="text-xs text-[var(--text-tertiary)] mt-4">
          All data stays in your browser — nothing is sent to a server.
        </p>
      </div>
    </div>
  );
}
