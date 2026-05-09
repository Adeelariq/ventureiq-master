import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/ai-clients";
import {
  computeMetrics,
  parseCSV,
  validateFinancialInput,
} from "@/lib/financial-parser";

export async function POST(req: NextRequest) {
  try {
    const { financialData, companyProfile } = await req.json();

    const rawFinancialData =
      typeof financialData === "string" ? financialData : "";
    const validation = validateFinancialInput(rawFinancialData);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "Financial validation failed",
          validation,
        },
        { status: 400 }
      );
    }

    const rows = parseCSV(rawFinancialData);
    const computedFinancials = computeMetrics(rows);

    const systemPrompt = `You are a senior financial analyst assistant.
Use ONLY the provided computed metrics.
Do NOT invent financial numbers.
If a value is missing, explicitly state it is unavailable.

You MUST respond with ONLY a valid JSON object in this exact structure:
{
  "executiveSummary": "string",
  "recommendations": [
    { "title": "string", "description": "string", "impact": "high" | "medium" | "low" }
  ],
  "insights": [
    "string"
  ]
}

Rules:
- Provide exactly 3 actionable recommendations
- Provide 2-3 key insights
- Do not add any numeric value that is not present in the provided metrics
- If data quality is low, call that out clearly`;

    const userPrompt = `Company: ${companyProfile?.name || "Unknown"} (${companyProfile?.industry || "Unknown industry"})

Computed metrics:
${JSON.stringify(computedFinancials, null, 2)}

Write narrative analysis based only on these computed metrics.`;

    const response = await callGroq(systemPrompt, userPrompt, true);

    if (!response.json) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      computedFinancials,
      aiNarrative: response.json,
      validation,
      result: {
        summary: {
          totalRevenue: computedFinancials.totalRevenue,
          totalCosts: computedFinancials.totalCosts,
          netProfitLoss: computedFinancials.netProfitLoss,
          profitMargin: computedFinancials.profitMargin,
          verdict:
            computedFinancials.netProfitLoss > 0
              ? "Profitable"
              : computedFinancials.netProfitLoss === 0
              ? "Break-even"
              : "Loss-making",
          dataCompleteness: computedFinancials.dataCompleteness,
          confidence: computedFinancials.confidence,
          missingFields: computedFinancials.missingFields,
        },
        revenueItems: computedFinancials.revenueItems,
        costItems: computedFinancials.costItems,
        recommendations:
          (response.json.recommendations as {
            title: string;
            description: string;
            impact: "high" | "medium" | "low";
          }[]) || [],
        insights: (response.json.insights as string[]) || [],
      },
    });
  } catch (error: unknown) {
    console.error("P&L Engine error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
