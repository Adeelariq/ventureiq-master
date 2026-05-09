"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Building2 } from "lucide-react";
import { useCompany, CompanyProfile } from "@/contexts/CompanyContext";
import { INDUSTRIES, COMPANY_SIZES, REVENUE_BRACKETS } from "@/lib/constants";
import Link from "next/link";
import { Suspense } from "react";

function OnboardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCompany } = useCompany();

  // Pre-fill from URL params (for the judge demo trick)
  const [form, setForm] = useState<CompanyProfile>({
    name: searchParams.get("company") || "",
    industry: searchParams.get("industry") || "",
    size: searchParams.get("size") || "",
    revenue: searchParams.get("revenue") || "",
    yearFounded: parseInt(searchParams.get("year") || "") || new Date().getFullYear(),
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CompanyProfile, string>>>({});

  const update = (field: keyof CompanyProfile, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CompanyProfile, string>> = {};
    if (!form.name.trim()) newErrors.name = "Company name is required";
    if (!form.industry) newErrors.industry = "Select an industry";
    if (!form.size) newErrors.size = "Select company size";
    if (!form.revenue) newErrors.revenue = "Select revenue bracket";
    if (!form.yearFounded || form.yearFounded < 1900 || form.yearFounded > 2026)
      newErrors.yearFounded = "Enter a valid year";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setCompany(form);
    router.push("/dashboard");
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 py-12">
      {/* Background */}
      <div className="grid-bg" />
      <div className="orb orb-cyan" />
      <div className="orb orb-purple" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-(--text-secondary) hover:text-(--accent-primary) transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        {/* Card */}
        <div className="glass-card p-8 md:p-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-(--accent-primary) to-(--accent-secondary) flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Tell us about your business</h1>
              <p className="text-xs text-(--text-secondary)">
                5 quick fields — takes 30 seconds
              </p>
            </div>
          </div>

          <div className="w-full h-px bg-(--border-glass) my-6" />

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-(--text-secondary) mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                className="input-glass"
                placeholder="e.g. Acme Corp"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
              {errors.name && (
                <p className="text-xs text-red-400 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-(--text-secondary) mb-1.5">
                Industry
              </label>
              <select
                className="input-glass"
                value={form.industry}
                onChange={(e) => update("industry", e.target.value)}
              >
                <option value="">Select your industry</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
              {errors.industry && (
                <p className="text-xs text-red-400 mt-1">{errors.industry}</p>
              )}
            </div>

            {/* Company Size */}
            <div>
              <label className="block text-sm font-medium text-(--text-secondary) mb-1.5">
                Company Size
              </label>
              <select
                className="input-glass"
                value={form.size}
                onChange={(e) => update("size", e.target.value)}
              >
                <option value="">Select company size</option>
                {COMPANY_SIZES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              {errors.size && (
                <p className="text-xs text-red-400 mt-1">{errors.size}</p>
              )}
            </div>

            {/* Annual Revenue */}
            <div>
              <label className="block text-sm font-medium text-(--text-secondary) mb-1.5">
                Annual Revenue
              </label>
              <select
                className="input-glass"
                value={form.revenue}
                onChange={(e) => update("revenue", e.target.value)}
              >
                <option value="">Select revenue bracket</option>
                {REVENUE_BRACKETS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {errors.revenue && (
                <p className="text-xs text-red-400 mt-1">{errors.revenue}</p>
              )}
            </div>

            {/* Year Founded */}
            <div>
              <label className="block text-sm font-medium text-(--text-secondary) mb-1.5">
                Year Founded
              </label>
              <input
                type="number"
                className="input-glass"
                placeholder="e.g. 2020"
                min={1900}
                max={2026}
                value={form.yearFounded || ""}
                onChange={(e) => update("yearFounded", parseInt(e.target.value) || 0)}
              />
              {errors.yearFounded && (
                <p className="text-xs text-red-400 mt-1">{errors.yearFounded}</p>
              )}
            </div>

            <button
              type="submit"
              className="btn-glow w-full flex items-center justify-center gap-2 mt-2"
            >
              Launch Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <p className="text-xs text-(--text-tertiary) text-center mt-5">
            🔒 Your data is kept in browser session storage; analysis requests are processed securely server-side.
          </p>
        </div>
      </motion.div>
    </main>
  );
}

export default function OnboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="shimmer w-96 h-[600px] rounded-2xl" />
      </div>
    }>
      <OnboardForm />
    </Suspense>
  );
}
