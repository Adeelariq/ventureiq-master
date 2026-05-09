export const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance & Banking",
  "E-commerce & Retail",
  "Manufacturing",
  "Real Estate",
  "Education",
  "Food & Beverage",
  "Transportation & Logistics",
  "Energy & Utilities",
  "Media & Entertainment",
  "Telecommunications",
  "Agriculture",
  "Construction",
  "Consulting & Professional Services",
  "Automotive",
  "Pharmaceuticals",
  "Tourism & Hospitality",
  "Insurance",
  "SaaS & Cloud Services",
] as const;

export const COMPANY_SIZES = [
  { label: "Startup (1–10 employees)", value: "startup" },
  { label: "Small Business (11–50)", value: "small" },
  { label: "SME (51–200)", value: "sme" },
  { label: "Mid-Market (201–1000)", value: "mid-market" },
  { label: "Enterprise (1000+)", value: "enterprise" },
] as const;

export const REVENUE_BRACKETS = [
  { label: "Pre-revenue", value: "pre-revenue" },
  { label: "< ₹50L", value: "under-50l" },
  { label: "₹50L – ₹5Cr", value: "50l-5cr" },
  { label: "₹8Cr – ₹80Cr", value: "8cr-80cr" },
  { label: "₹80Cr – ₹800Cr", value: "80cr-800cr" },
  { label: "₹800Cr+", value: "800cr-plus" },
] as const;

export const ENGINE_INFO = {
  pnl: {
    id: "pnl",
    title: "P&L Engine",
    subtitle: "Profit & Loss Analysis",
    description: "Upload your financial data and get an instant AI-powered profit & loss breakdown with actionable verdicts.",
    icon: "TrendingUp",
    gradient: "from-emerald-500 to-teal-600",
    color: "#10b981",
  },
  futureproof: {
    id: "futureproof",
    title: "FutureProof Engine",
    subtitle: "Risk & Threat Forecasting",
    description: "Discover the top 5 risks facing your business and see a 5-year threat timeline powered by AI.",
    icon: "Shield",
    gradient: "from-violet-500 to-purple-600",
    color: "#8b5cf6",
  },
  benchmark: {
    id: "benchmark",
    title: "Benchmark Engine",
    subtitle: "Industry Comparison",
    description: "See how you stack up against 1,000+ similar companies with AI-synthesised benchmarking.",
    icon: "BarChart3",
    gradient: "from-blue-500 to-cyan-600",
    color: "#3b82f6",
  },
  regret: {
    id: "regret",
    title: "Regret Engine",
    subtitle: "Opportunity Cost Calculator",
    description: "Calculate the missed opportunity cost of past decisions and discover what could have been.",
    icon: "Clock",
    gradient: "from-orange-500 to-red-600",
    color: "#f97316",
  },
} as const;

export type EngineId = keyof typeof ENGINE_INFO;
