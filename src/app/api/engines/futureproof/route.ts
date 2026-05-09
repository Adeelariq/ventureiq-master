import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/ai-clients";
import type { ComputedFinancials } from "@/lib/financial-parser";

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
        }
      : undefined;

    const systemPrompt = `You are a strategic risk analyst and futurist AI.
Use only provided metrics and profile context.
Never invent financial figures, probabilities, or percentages from missing data.
If financial metrics are unavailable, clearly mark the output as speculative.

You MUST respond with ONLY a valid JSON object in this exact structure:
{
  "riskScore": number (1-100, overall risk level),
  "risks": [
    {
      "id": number,
      "title": "string",
      "severity": number (1-10),
      "probability": number (1-100),
      "category": "Market" | "Technology" | "Regulatory" | "Financial" | "Operational",
      "description": "string",
      "mitigation": "string"
    }
  ],
  "timeline": [
    {
      "year": number,
      "threats": [
        {
          "title": "string",
          "probability": number (1-100),
          "impact": "Critical" | "High" | "Medium" | "Low",
          "description": "string"
        }
      ]
    }
  ],
  "summary": "string (2-3 sentence executive summary)"
}

Rules:
- Provide exactly 5 risks, ordered by severity (highest first)
- Provide a 5-year timeline (current year through current year + 4)
- Each year should have 1-2 major threats
- Be specific to the industry and company size
- Threats should be realistic and based on current trends
- Include AI/technology disruption risks where relevant
- Cite provided metrics directly; do not invent exact percentages`;

    const currentYear = new Date().getFullYear();
    const userPrompt = `Company: ${companyName || "Unknown"}
Industry: ${industry}
Company Size: ${size}
Annual Revenue Bracket: ${revenue}
Founded: ${yearFounded}
Current Year: ${currentYear}
Financial Signals: ${JSON.stringify(
      localSignals,
      null,
      2
    )}

Generate a comprehensive risk assessment and threat timeline for this company.`;

    const response = await callGroq(systemPrompt, userPrompt, true);

    if (!response.json) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
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
