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
 * Return industry-specific risk categories and top threats.
 * This ensures FutureProof outputs vary meaningfully by sector.
 */
function industryRiskContext(industry: string): string {
  const ind = industry.toLowerCase();

  if (ind.includes("saas") || ind.includes("cloud") || ind.includes("software")) {
    return `Industry risk context for SaaS/Cloud:
Primary risk categories: Technology, Market, Financial, Regulatory, Operational
Top sector risks: AI disruption by competitors, customer churn, cloud cost inflation,
data privacy regulations (DPDPA India), pricing commoditization, talent attrition in engineering.
Financial signals to watch: declining net revenue retention, CAC > LTV, burn rate acceleration.`;
  }

  if (ind.includes("retail") || ind.includes("e-commerce")) {
    return `Industry risk context for Retail/E-commerce:
Primary risk categories: Market, Operational, Financial, Technology, Regulatory
Top sector risks: inventory obsolescence, logistics cost spikes, customer retention erosion,
marketplace fee increases (Amazon/Flipkart), quick-commerce disruption, supply chain concentration.
Financial signals to watch: rising return rates, falling basket size, logistics cost as % of revenue.`;
  }

  if (ind.includes("construction")) {
    return `Industry risk context for Construction:
Primary risk categories: Operational, Financial, Regulatory, Market, Technology
Top sector risks: raw material cost volatility (steel, cement), project delays, contractor defaults,
government policy changes (RERA), labour shortages, interest rate risk on project financing.
Financial signals to watch: cost overruns vs. contract value, working capital stretch, receivables aging.`;
  }

  if (ind.includes("manufacturing")) {
    return `Industry risk context for Manufacturing:
Primary risk categories: Operational, Market, Financial, Regulatory, Technology
Top sector risks: raw material price spikes, automation disruption, energy cost volatility,
supply chain concentration, quality compliance failures, export regulation changes.
Financial signals to watch: rising cost of goods, energy spend as % of revenue, inventory build-up.`;
  }

  if (ind.includes("healthcare") || ind.includes("pharma")) {
    return `Industry risk context for Healthcare/Pharma:
Primary risk categories: Regulatory, Financial, Operational, Market, Technology
Top sector risks: drug pricing regulation, clinical trial failures, IP expiry, CDSCO compliance,
AI-driven diagnostics disruption, talent shortage in specialists, insurance reimbursement changes.
Financial signals to watch: R&D spend ROI, regulatory approval pipeline delays, margins on generics.`;
  }

  if (ind.includes("food") || ind.includes("beverage")) {
    return `Industry risk context for Food & Beverage:
Primary risk categories: Operational, Market, Regulatory, Financial, Technology
Top sector risks: food inflation (edible oil, grains), FSSAI compliance risk, perishable waste,
cold chain disruption, health trend shifts, packaging cost increases.
Financial signals to watch: food cost % of revenue, waste %, same-store sales growth.`;
  }

  if (ind.includes("finance") || ind.includes("banking") || ind.includes("insurance")) {
    return `Industry risk context for Finance/Banking/Insurance:
Primary risk categories: Regulatory, Financial, Technology, Market, Operational
Top sector risks: RBI policy changes, rising NPAs, fintech disruption, cybersecurity breaches,
fraud losses, capital adequacy pressure, UPI/CBDC disruption to fee income.
Financial signals to watch: NIM compression, cost-to-income ratio, NPA formation rate.`;
  }

  if (ind.includes("education")) {
    return `Industry risk context for Education:
Primary risk categories: Market, Technology, Regulatory, Financial, Operational
Top sector risks: ed-tech commoditization, NEP policy changes, demographic shifts, platform
dependence, faculty retention, student loan default risk.
Financial signals to watch: student retention rate, revenue per learner, completion rates.`;
  }

  return `Industry risk context for ${industry}:
Apply realistic risk categories and threats relevant to this specific industry in the Indian market.
Consider regulatory, market, technology, financial, and operational risks specific to this sector.`;
}

export async function POST(req: NextRequest) {
  try {
    const { industry, size, revenue, yearFounded, companyName, computedFinancials } =
      await req.json();

    if (!industry) {
      return NextResponse.json({ error: "Industry is required" }, { status: 400 });
    }

    const pnlMetrics = computedFinancials as ComputedFinancials | undefined;
    const hasFinancialData =
      !!pnlMetrics &&
      Number.isFinite(pnlMetrics.totalRevenue) &&
      Number.isFinite(pnlMetrics.totalCosts);
    if (!hasFinancialData) {
      return NextResponse.json(
        {
          error:
            "Validated P&L data is required. Run P&L Engine with valid uploaded data first.",
        },
        { status: 400 }
      );
    }

    const localSignals = hasFinancialData
      ? {
          decliningRevenue: pnlMetrics.totalRevenue <= pnlMetrics.totalCosts,
          marginCompression: pnlMetrics.profitMargin < 15,
          risingCosts:
            pnlMetrics.totalRevenue > 0 &&
            pnlMetrics.totalCosts / pnlMetrics.totalRevenue > 0.7,
          confidence: pnlMetrics.confidence,
          annualRevenue: pnlMetrics.totalRevenue,
          annualCosts: pnlMetrics.totalCosts,
          netPnL: pnlMetrics.netProfitLoss,
          profitMargin: pnlMetrics.profitMargin,
          costRatio:
            pnlMetrics.totalRevenue > 0
              ? (pnlMetrics.totalCosts / pnlMetrics.totalRevenue) * 100
              : 0,
        }
      : undefined;

    const industryContext = industryRiskContext(industry);

    const systemPrompt = `You are a strategic risk analyst and futurist AI.
Use only provided metrics and profile context.
Never invent financial figures, probabilities, or percentages from missing data.
If financial metrics are unavailable, clearly mark the output as speculative.
${CANONICAL_INTEGRITY_CLAUSE}

${industryContext}

You MUST respond with ONLY a valid JSON object in this exact structure:
{
  "riskScore": number (1-100, overall risk level),
  "risks": [
    {
      "id": number,
      "title": "string (specific to ${industry} sector)",
      "severity": number (1-10),
      "probability": number (1-100),
      "category": "Market" | "Technology" | "Regulatory" | "Financial" | "Operational",
      "description": "string (cite actual financial signals where applicable)",
      "mitigation": "string (actionable and specific to the industry)"
    }
  ],
  "timeline": [
    {
      "year": number,
      "threats": [
        {
          "title": "string (industry-specific)",
          "probability": number (1-100),
          "impact": "Critical" | "High" | "Medium" | "Low",
          "description": "string (grounded in provided financial signals)"
        }
      ]
    }
  ],
  "summary": "string (2-3 sentence executive summary citing actual provided metrics)"
}

Rules:
- Provide exactly 5 risks, ordered by severity (highest first)
- Risks MUST be specific to ${industry} — not generic corporate boilerplate
- Provide a 5-year timeline (current year through current year + 4)
- Each year should have 1-2 major threats specific to this industry
- The summary MUST cite at least one actual provided financial metric
- If company is loss-making (netPnL < 0), elevate Financial risk category severity`;

    const currentYear = new Date().getFullYear();
    const userPrompt = `Company: ${companyName || "Unknown"}
Industry: ${industry}
Company Size: ${size}
Annual Revenue Bracket: ${revenue}
Founded: ${yearFounded}
Current Year: ${currentYear}

Financial Signals from Uploaded P&L:
${JSON.stringify(localSignals, null, 2)}

Generate a comprehensive risk assessment and threat timeline for this ${industry} company.
All risks and threats MUST be specific to the ${industry} sector and grounded in the financial signals above.`;

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
        financialSignals: localSignals,
      },
    });
  } catch (error: unknown) {
    console.error("FutureProof Engine error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
