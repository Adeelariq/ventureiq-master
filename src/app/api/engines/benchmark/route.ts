import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/ai-clients";
import type { ComputedFinancials } from "@/lib/financial-parser";

const CANONICAL_INTEGRITY_CLAUSE = `CRITICAL INTEGRITY RULES:
- Use ONLY the provided business metrics. Do NOT invent revenue values.
- Do NOT fabricate losses, costs, or financial figures.
- Do NOT hallucinate benchmark data or industry averages.
- If insufficient data exists, explicitly state it is unavailable.
- All monetary estimates must be proportional to the provided metrics.`;

/**
 * Return industry-specific benchmark category hints so AI outputs are
 * grounded in the company's actual sector, not generic corporate boilerplate.
 */
function industryBenchmarkContext(industry: string): string {
  const ind = industry.toLowerCase();

  if (ind.includes("saas") || ind.includes("cloud") || ind.includes("software")) {
    return `Industry-specific context for SaaS/Cloud:
- Key metrics: Monthly Recurring Revenue (MRR), churn rate, Customer Acquisition Cost (CAC), Lifetime Value (LTV)
- Benchmark focus: net revenue retention, seat expansion, gross margin (typically 70-85% for SaaS)
- Risk areas: AI disruption, cloud costs, churn, pricing pressure`;
  }

  if (ind.includes("retail") || ind.includes("e-commerce")) {
    return `Industry-specific context for Retail/E-commerce:
- Key metrics: same-store sales growth, inventory turnover, GMV, return rate, basket size
- Benchmark focus: logistics efficiency, customer retention, gross margin (typically 25-45%)
- Risk areas: inventory risk, logistics delays, customer retention, platform fees`;
  }

  if (ind.includes("construction")) {
    return `Industry-specific context for Construction:
- Key metrics: project margin, overhead rate, equipment utilization, contract pipeline
- Benchmark focus: on-time delivery, cost overrun rate, safety record, subcontractor management
- Risk areas: material cost volatility, project delays, contractor risk, regulatory compliance`;
  }

  if (ind.includes("manufacturing")) {
    return `Industry-specific context for Manufacturing:
- Key metrics: OEE (Overall Equipment Effectiveness), scrap rate, inventory days, capacity utilization
- Benchmark focus: cost per unit, defect rate, supply chain efficiency
- Risk areas: raw material costs, supply chain disruption, automation lag, energy costs`;
  }

  if (ind.includes("healthcare") || ind.includes("pharma")) {
    return `Industry-specific context for Healthcare/Pharma:
- Key metrics: patient outcomes, compliance rate, R&D spend ratio, regulatory approval pipeline
- Benchmark focus: cost per patient, regulatory adherence, operational efficiency
- Risk areas: regulatory changes, IP expiry, pricing pressure, clinical trial failures`;
  }

  if (ind.includes("food") || ind.includes("beverage") || ind.includes("restaurant")) {
    return `Industry-specific context for Food & Beverage:
- Key metrics: food cost percentage (ideal <30%), table turnover, waste ratio, order accuracy
- Benchmark focus: gross margin, same-store revenue growth, supply chain reliability
- Risk areas: food inflation, supply chain, perishable waste, health regulations`;
  }

  if (ind.includes("finance") || ind.includes("banking") || ind.includes("insurance")) {
    return `Industry-specific context for Finance/Banking/Insurance:
- Key metrics: NPA ratio, CASA ratio, net interest margin, claims ratio, combined ratio
- Benchmark focus: cost-to-income ratio, capital adequacy, customer retention
- Risk areas: regulatory changes, credit risk, fraud, fintech disruption`;
  }

  if (ind.includes("education")) {
    return `Industry-specific context for Education:
- Key metrics: student retention, completion rate, teacher:student ratio, revenue per student
- Benchmark focus: learning outcomes, cost per learner, platform adoption
- Risk areas: ed-tech disruption, government regulation, demographic shifts`;
  }

  return `Industry-specific context for ${industry}:
- Apply realistic benchmarks for this industry's typical gross margins, growth rates, and cost structures
- Be specific about risks and opportunities relevant to this sector in the Indian market`;
}

export async function POST(req: NextRequest) {
  try {
    const { industry, size, revenue, yearFounded, companyName, computedFinancials } =
      await req.json();

    if (!industry) {
      return NextResponse.json({ error: "Industry is required" }, { status: 400 });
    }

    const pnlMetrics = computedFinancials as ComputedFinancials | undefined;
    const hasPnL =
      !!pnlMetrics &&
      Number.isFinite(pnlMetrics.totalRevenue) &&
      Number.isFinite(pnlMetrics.totalCosts);
    if (!hasPnL) {
      return NextResponse.json(
        {
          error:
            "Validated P&L data is required. Run P&L Engine with valid uploaded data first.",
        },
        { status: 400 }
      );
    }

    const deterministicRatios = hasPnL
      ? {
          grossMargin:
            pnlMetrics.totalRevenue > 0
              ? ((pnlMetrics.totalRevenue - pnlMetrics.totalCosts) /
                  pnlMetrics.totalRevenue) *
                100
              : 0,
          costRatio:
            pnlMetrics.totalRevenue > 0
              ? (pnlMetrics.totalCosts / pnlMetrics.totalRevenue) * 100
              : 0,
          profitability: pnlMetrics.netProfitLoss >= 0 ? "profitable" : "loss-making",
          profitMargin: pnlMetrics.profitMargin,
          annualRevenue: pnlMetrics.totalRevenue,
          annualCosts: pnlMetrics.totalCosts,
          netPnL: pnlMetrics.netProfitLoss,
        }
      : undefined;

    const industryContext = industryBenchmarkContext(industry);

    const systemPrompt = `You are a business benchmarking analyst AI.
Use ONLY provided metrics.
Do NOT fabricate percentages or financial values.
${CANONICAL_INTEGRITY_CLAUSE}

${industryContext}

You MUST respond with ONLY a valid JSON object in this exact structure:
{
  "overallScore": number (0-100),
  "percentile": number (1-99, what percentile the company is in),
  "categories": [
    {
      "name": "Revenue Growth",
      "score": number (0-100),
      "industryAvg": number (0-100),
      "percentile": number,
      "insight": "string (specific to the actual provided metrics)"
    },
    {
      "name": "Profitability",
      "score": number (0-100),
      "industryAvg": number (0-100),
      "percentile": number,
      "insight": "string (based on the actual grossMargin and profitMargin provided)"
    },
    {
      "name": "Operational Efficiency",
      "score": number (0-100),
      "industryAvg": number (0-100),
      "percentile": number,
      "insight": "string (based on actual costRatio provided)"
    },
    {
      "name": "Innovation Index",
      "score": number (0-100),
      "industryAvg": number (0-100),
      "percentile": number,
      "insight": "string (specific to the industry)"
    },
    {
      "name": "Market Position",
      "score": number (0-100),
      "industryAvg": number (0-100),
      "percentile": number,
      "insight": "string (specific to company size and industry)"
    },
    {
      "name": "Team & Culture",
      "score": number (0-100),
      "industryAvg": number (0-100),
      "percentile": number,
      "insight": "string"
    }
  ],
  "strengths": ["string", "string"],
  "improvements": [
    { "area": "string", "suggestion": "string", "potentialImpact": "string" }
  ],
  "peerComparison": "string (2-3 sentence summary citing actual provided metrics)",
  "companiesAnalyzed": number (always 1000+)
}

Rules:
- Base scores on realistic ${industry} industry benchmarks for the given company size
- Scores MUST vary — reflect clear strengths and weaknesses based on actual ratios
- Industry averages should be around 50-65 range
- Provide exactly 2 strengths and 3 improvement areas specific to ${industry}
- companiesAnalyzed should be between 1000-5000
- Insights MUST reference the actual provided grossMargin, costRatio, or profitMargin
- Do not invent exact financial values; reference only the provided metrics`;

    const userPrompt = `Company: ${companyName || "Unknown"}
Industry: ${industry}
Company Size: ${size}
Revenue Bracket: ${revenue}
Founded: ${yearFounded}

Actual computed financial ratios from uploaded P&L:
${JSON.stringify(deterministicRatios, null, 2)}

Benchmark this company against similar companies in the ${industry} industry.
Your insights MUST be specific to the provided ratios above — not generic.`;

    const response = await callGroq(systemPrompt, userPrompt, true);

    if (!response.json) {
      return NextResponse.json(
        { error: "AI service was unable to generate analysis. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      result: {
        ...response.json,
        dataSourceLabel: "Powered by uploaded P&L",
        deterministicRatios,
      },
    });
  } catch (error: unknown) {
    console.error("Benchmark Engine error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
