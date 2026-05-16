"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, TrendingUp } from "lucide-react";
import { useCompany, CompanyProfile } from "@/contexts/CompanyContext";
import { INDUSTRIES, COMPANY_SIZES, REVENUE_BRACKETS } from "@/lib/constants";
import Link from "next/link";
import { Suspense } from "react";

const CUSTOM_REVENUE_PREFIX = "custom:";

function sanitizeRevenueInput(raw: string): string {
  const digitsOnly = raw.replace(/[^\d]/g, "");
  if (!digitsOnly) return "";
  const normalized = String(Number(digitsOnly));
  return normalized === "0" ? "" : normalized;
}

function formatRevenueINR(amount: string): string {
  if (!amount) return "";
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return "";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
      style={{ color: "var(--text-secondary)" }}
    >
      {children}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-xs mt-1.5" style={{ color: "var(--danger)" }}>
      {msg}
    </p>
  );
}

function OnboardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCompany } = useCompany();
  const initialRevenue = searchParams.get("revenue") || "";
  const hasCustomRevenue = initialRevenue.startsWith(CUSTOM_REVENUE_PREFIX);
  const initialCustomRevenue = hasCustomRevenue
    ? sanitizeRevenueInput(initialRevenue.replace(CUSTOM_REVENUE_PREFIX, ""))
    : "";

  const [form, setForm] = useState<CompanyProfile>({
    name:        searchParams.get("company") || "",
    industry:    searchParams.get("industry") || "",
    size:        searchParams.get("size") || "",
    revenue:     hasCustomRevenue ? "custom" : initialRevenue,
    yearFounded: parseInt(searchParams.get("year") || "") || new Date().getFullYear(),
  });
  const [customRevenue, setCustomRevenue] = useState(initialCustomRevenue);
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyProfile, string>>>({});

  const update = (field: keyof CompanyProfile, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof CompanyProfile, string>> = {};
    if (!form.name.trim()) e.name = "Company name is required";
    if (!form.industry) e.industry = "Select an industry";
    if (!form.size) e.size = "Select company size";
    if (!form.revenue) {
      e.revenue = "Select revenue bracket";
    } else if (form.revenue === "custom") {
      if (!customRevenue) {
        e.revenue = "Enter a valid custom annual revenue";
      } else {
        const val = Number(customRevenue);
        if (!Number.isFinite(val) || val <= 0) e.revenue = "Must be a positive number";
        else if (val < 500_000) e.revenue = "Minimum ₹5 lakh";
        else if (val > 80_000_000_000) e.revenue = "Maximum ₹800 crore";
      }
    }
    if (!form.yearFounded || form.yearFounded < 1900 || form.yearFounded > 2026)
      e.yearFounded = "Enter a valid year (1900–2026)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload: CompanyProfile = {
      ...form,
      revenue:
        form.revenue === "custom"
          ? `${CUSTOM_REVENUE_PREFIX}${customRevenue}`
          : form.revenue,
    };
    setCompany(payload);
    router.push("/dashboard");
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "var(--bg-base)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs mb-8 transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to home
        </Link>

        {/* Header */}
        <div className="mb-7">
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="w-7 h-7 rounded flex items-center justify-center"
              style={{ background: "var(--accent)" }}
            >
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              VentureIQ
            </span>
          </div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Set up your company profile
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Five fields. Used to calibrate all analytical engines.
          </p>
        </div>

        {/* Form card */}
        <div
          className="card p-6"
          style={{ borderColor: "var(--border-default)" }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company Name */}
            <div>
              <FieldLabel>Company Name</FieldLabel>
              <input
                type="text"
                className="input-glass"
                placeholder="e.g. Acme Corp"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
              <FieldError msg={errors.name} />
            </div>

            {/* Industry */}
            <div>
              <FieldLabel>Industry</FieldLabel>
              <select
                className="input-glass"
                value={form.industry}
                onChange={(e) => update("industry", e.target.value)}
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
              <FieldError msg={errors.industry} />
            </div>

            {/* Size + Year — 2-col */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Company Size</FieldLabel>
                <select
                  className="input-glass"
                  value={form.size}
                  onChange={(e) => update("size", e.target.value)}
                >
                  <option value="">Select size</option>
                  {COMPANY_SIZES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <FieldError msg={errors.size} />
              </div>
              <div>
                <FieldLabel>Year Founded</FieldLabel>
                <input
                  type="number"
                  className="input-glass"
                  placeholder="e.g. 2020"
                  min={1900}
                  max={2026}
                  value={form.yearFounded || ""}
                  onChange={(e) => update("yearFounded", parseInt(e.target.value) || 0)}
                />
                <FieldError msg={errors.yearFounded} />
              </div>
            </div>

            {/* Revenue */}
            <div>
              <FieldLabel>Annual Revenue</FieldLabel>
              <select
                className="input-glass"
                value={form.revenue}
                onChange={(e) => {
                  update("revenue", e.target.value);
                  if (e.target.value !== "custom") setCustomRevenue("");
                }}
              >
                <option value="">Select revenue bracket</option>
                {REVENUE_BRACKETS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
                <option value="custom">Custom amount (INR)</option>
              </select>
              {form.revenue === "custom" && (
                <div className="mt-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="input-glass"
                    placeholder="Enter annual revenue in INR"
                    value={customRevenue}
                    onChange={(e) => setCustomRevenue(sanitizeRevenueInput(e.target.value))}
                  />
                  {customRevenue && (
                    <p
                      className="text-xs mt-1 tabular-nums"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {formatRevenueINR(customRevenue)}
                    </p>
                  )}
                </div>
              )}
              <FieldError msg={errors.revenue} />
            </div>

            <button
              type="submit"
              className="btn-glow w-full flex items-center justify-center gap-2 mt-2"
            >
              Launch Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <p
          className="text-[11px] text-center mt-4"
          style={{ color: "var(--text-tertiary)" }}
        >
          Data is kept in browser session storage. Analysis is processed server-side and never stored.
        </p>
      </motion.div>
    </main>
  );
}

export default function OnboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="skeleton w-96 h-[500px] rounded-lg" />
        </div>
      }
    >
      <OnboardForm />
    </Suspense>
  );
}
