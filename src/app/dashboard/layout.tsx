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
  Brain,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { EngineId } from "@/lib/constants";
const navItems: { id: EngineId | "docs" | "export"; icon: React.ElementType; label: string }[] = [
  { id: "pnl", icon: TrendingUp, label: "P&L Engine" },
  { id: "futureproof", icon: Shield, label: "FutureProof" },
  { id: "benchmark", icon: BarChart3, label: "Benchmark" },
  { id: "regret", icon: Clock, label: "Regret Engine" },
  { id: "docs", icon: FileText, label: "Doc Analyzer" },
  { id: "export", icon: Download, label: "Export PDF" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { company, clearCompany } = useCompany();
  const [activeTab, setActiveTab] = useState<string>("pnl");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!company) {
      const stored = sessionStorage.getItem("ventureiq_company");
      if (!stored) {
        router.push("/onboard");
      }
    }
  }, [company, router]);

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    // Dispatch custom event so dashboard page can react
    window.dispatchEvent(new CustomEvent("ventureiq:tab", { detail: id }));
  };

  const handleLogout = () => {
    clearCompany();
    router.push("/");
  };

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="shimmer w-full max-w-xs h-8 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } shrink-0 border-r border-(--border-glass) bg-(--bg-secondary) flex flex-col transition-all duration-300`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-(--border-glass)">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-(--accent-primary) to-(--accent-secondary) flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4 text-white" />
          </div>
          {sidebarOpen && (
            <span className="text-sm font-bold tracking-tight">VentureIQ</span>
          )}
        </div>

        {/* Company Info */}
        {sidebarOpen && (
          <div className="px-4 py-4 border-b border-(--border-glass)">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {company.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{company.name}</p>
                <p className="text-xs text-(--text-tertiary) truncate">
                  {company.industry}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`sidebar-item w-full ${
                activeTab === item.id ? "active" : ""
              }`}
              title={item.label}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
              {sidebarOpen && activeTab === item.id && (
                <ChevronRight className="w-3.5 h-3.5 ml-auto text-(--accent-primary)" />
              )}
            </button>
          ))}
        </nav>

        {/* Collapse + Logout */}
        <div className="px-3 py-4 border-t border-(--border-glass) space-y-1">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="sidebar-item w-full text-xs"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform ${
                sidebarOpen ? "rotate-180" : ""
              }`}
            />
            {sidebarOpen && <span>Collapse</span>}
          </button>
          <button onClick={handleLogout} className="sidebar-item w-full text-xs text-red-400">
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span>Exit</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
