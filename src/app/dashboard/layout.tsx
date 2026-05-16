"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Shield,
  BarChart3,
  Clock,
  FileText,
  Download,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { EngineId } from "@/lib/constants";

const navItems: {
  id: EngineId | "docs" | "export";
  icon: React.ElementType;
  label: string;
  sublabel: string;
}[] = [
  { id: "pnl",         icon: TrendingUp, label: "P&L Engine",    sublabel: "Profit & Loss" },
  { id: "futureproof", icon: Shield,     label: "FutureProof",   sublabel: "Risk Forecast" },
  { id: "benchmark",   icon: BarChart3,  label: "Benchmark",     sublabel: "Peer Analysis" },
  { id: "regret",      icon: Clock,      label: "Regret Engine", sublabel: "Decision Cost" },
  { id: "docs",        icon: FileText,   label: "Doc Analyzer",  sublabel: "RAG Analysis" },
  { id: "export",      icon: Download,   label: "Export PDF",    sublabel: "Generate Report" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { company, clearCompany } = useCompany();
  const [activeTab, setActiveTab] = useState<string>("pnl");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!company) {
      const stored = sessionStorage.getItem("ventureiq_company");
      if (!stored) router.push("/onboard");
    }
  }, [company, router]);

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    window.dispatchEvent(new CustomEvent("ventureiq:tab", { detail: id }));
  };

  const handleLogout = () => {
    clearCompany();
    router.push("/");
  };

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="skeleton w-72 h-8 rounded" />
      </div>
    );
  }

  const companyAge = new Date().getFullYear() - company.yearFounded;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: collapsed ? "56px" : "228px",
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          transition: "width 0.2s ease",
          overflow: "hidden",
        }}
      >
        {/* Logo row */}
        <div
          className="flex items-center px-3 h-12 shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div
            className="w-6 h-6 rounded flex items-center justify-center shrink-0"
            style={{ background: "var(--accent)" }}
          >
            <TrendingUp className="w-3.5 h-3.5 text-white" />
          </div>
          {!collapsed && (
            <span
              className="ml-2.5 text-sm font-semibold tracking-tight truncate"
              style={{ color: "var(--text-primary)" }}
            >
              VentureIQ
            </span>
          )}
        </div>

        {/* Company context */}
        {!collapsed && (
          <div
            className="px-3 py-3 shrink-0"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center gap-2.5">
              {/* Monogram */}
              <div
                className="w-7 h-7 rounded text-xs font-bold flex items-center justify-center shrink-0"
                style={{
                  background: "var(--bg-elevated)",
                  color: "var(--accent)",
                  border: "1px solid var(--border-default)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {company.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p
                  className="text-xs font-semibold truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {company.name}
                </p>
                <p
                  className="text-[11px] truncate"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {company.industry}
                </p>
              </div>
            </div>
            <div
              className="flex items-center gap-3 mt-2.5"
            >
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{
                  background: "var(--bg-elevated)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                  fontFamily: "monospace",
                }}
              >
                {company.size}
              </span>
              <span
                className="text-[10px]"
                style={{ color: "var(--text-tertiary)" }}
              >
                Est. {company.yearFounded}
              </span>
              {companyAge > 0 && (
                <span
                  className="text-[10px]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {companyAge}yr
                </span>
              )}
            </div>
          </div>
        )}

        {/* Collapsed monogram */}
        {collapsed && (
          <div className="flex justify-center py-3 shrink-0"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <div
              className="w-7 h-7 rounded text-xs font-bold flex items-center justify-center"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--accent)",
                border: "1px solid var(--border-default)",
              }}
            >
              {company.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {!collapsed && (
            <p
              className="text-[10px] font-semibold uppercase tracking-wider px-2 mb-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              Engines
            </p>
          )}
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={`sidebar-item ${activeTab === item.id ? "active" : ""}`}
              style={{ justifyContent: collapsed ? "center" : undefined, gap: collapsed ? 0 : undefined }}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom: collapse + logout */}
        <div
          className="px-2 py-3 space-y-0.5 shrink-0"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="sidebar-item"
            style={{ justifyContent: collapsed ? "center" : undefined }}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="sidebar-item"
            style={{
              justifyContent: collapsed ? "center" : undefined,
              color: "var(--danger)",
            }}
            title="Exit"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Exit</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
