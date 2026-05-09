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
        }
      : undefined;

    const systemPrompt = `You are a business benchmarking analyst AI.
Use ONLY provided metrics.
Do NOT fabricate percentages or financial values.

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
      "insight": "string"
    },
    {
      "name": "Profitability",
      "score": number (0-100),
      "industryAvg": number (0-100),
      "percentile": number,
      "insight": "string"
    },
    {
      "name": "Operational Efficiency",
      "score": number (0-100),
      "industryAvg": number (0-100),
      "percentile": number,
      "insight": "string"
    },
    {
      "name": "Innovation Index",
      "score": number (0-100),
      "industryAvg": number (0-100),
      "percentile": number,
      "insight": "string"
    },
    {
      "name": "Market Position",
      "score": number (0-100),
      "industryAvg": number (0-100),
      "percentile": number,
      "insight": "string"
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
  "peerComparison": "string (2-3 sentence summary comparing to peers)",
  "companiesAnalyzed": number (always 1000+)
}

Rules:
- Base scores on realistic industry benchmarks for the given industry and company size
- Scores should vary — NOT all similar. Show clear strengths and weaknesses
- Industry averages should be around 50-65 range
- Provide exactly 2 strengths and 3 improvement areas
- companiesAnalyzed should be between 1000-5000
- Be specific with insights, not generic
- Do not invent exact financial values unless they are explicitly provided in metrics`;

    const userPrompt = `Company: ${companyName || "Unknown"}
Industry: ${industry}
Company Size: ${size}
Revenue Bracket: ${revenue}
Founded: ${yearFounded}

Deterministic financial ratios (if available):
${JSON.stringify(deterministicRatios, null, 2)}

Benchmark this company against similar companies in the ${industry} industry.`;

    const response = await callGroq(systemPrompt, userPrompt, true);

    if (!response.json) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
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
