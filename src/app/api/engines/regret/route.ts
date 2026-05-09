import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/lib/ai-clients";
import { isGibberish } from "@/lib/validators";

function revenueBracketBounds(bracket?: string): { min: number; max: number } {
  if (typeof bracket === "string" && bracket.startsWith("custom:")) {
    const customValue = Number(bracket.replace("custom:", "").trim());
    if (Number.isFinite(customValue) && customValue > 0) {
      // Estimate opportunity cost as a bounded slice of annual revenue.
      return {
        min: Math.max(50_000, Math.round(customValue * 0.05)),
        max: Math.max(2_00_000, Math.round(customValue * 0.35)),
      };
    }
  }

  switch (bracket) {
    case "under-50l":
      return { min: 2_00_000, max: 50_00_000 };
    case "50l-5cr":
      return { min: 50_00_000, max: 5_00_00_000 };
    case "8cr-80cr":
      return { min: 8_00_00_000, max: 80_00_00_000 };
    case "80cr-800cr":
      return { min: 80_00_00_000, max: 800_00_00_000 };
    case "800cr-plus":
      return { min: 800_00_00_000, max: 3_000_00_00_000 };
    case "pre-revenue":
    default:
      return { min: 50_000, max: 5_00_000 };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { decisions, companyProfile } = await req.json();

    if (!Array.isArray(decisions) || !decisions.length) {
      return NextResponse.json({ error: "At least one decision is required" }, { status: 400 });
    }

    const normalizedDecisions = decisions
      .map((decision: unknown) =>
        typeof decision === "string" ? decision.trim() : ""
      )
      .filter(Boolean);
    if (!normalizedDecisions.length) {
      return NextResponse.json({ error: "At least one valid decision is required" }, { status: 400 });
    }

    const invalidDecision = normalizedDecisions.find(
      (decision) => decision.length < 15 || isGibberish(decision)
    );
    if (invalidDecision) {
      return NextResponse.json(
        { error: "Each decision must be meaningful, non-gibberish, and at least 15 characters." },
        { status: 400 }
      );
    }

    const bounds = revenueBracketBounds(companyProfile?.revenue);
    const localDecisionCosts = normalizedDecisions.map((decision, index) => {
      const ratio = (index + 1) / (normalizedDecisions.length + 1);
      const amount = Math.round(bounds.min + (bounds.max - bounds.min) * ratio);
      return {
        id: index + 1,
        originalDecision: decision,
        missedOpportunityCost: amount,
      };
    });
    const totalOpportunityCost = localDecisionCosts.reduce(
      (sum, decision) => sum + decision.missedOpportunityCost,
      0
    );

    const systemPrompt = `You are a business strategist AI specializing in opportunity-cost storytelling.
You must use provided opportunity-cost values exactly as given.
Do not generate fake exact dollar figures.
Do not add any new monetary values.

You MUST respond with ONLY a valid JSON object in this exact structure:
{
  "decisions": [
    {
      "id": number,
      "originalDecision": "string (what they did)",
      "whatIf": "string (what would have happened if they chose differently)",
      "estimatedOutcome": "string (projected better outcome without exact dollar figures)",
      "confidence": "High" | "Medium" | "Low",
      "lesson": "string (actionable takeaway)"
    }
  ],
  "forwardLooking": [
    {
      "recommendation": "string",
      "potentialValue": "string (estimated value in INR with ₹)",
      "timeframe": "string"
    }
  ],
  "emotionalImpact": "string (empathetic 1-2 sentence reflection on the cumulative cost)",
  "silverLining": "string (something positive that came from these decisions)"
}

Rules:
- Use the provided local opportunity costs and do not alter them
- Use INR currency notation (₹) in forward-looking potential values
- Keep all money references realistic for Indian business context
- Provide exactly 2-3 forward-looking recommendations
- The emotional impact should be professional and concise
- Always include a silver lining to balance the analysis`;

    const userPrompt = `Company: ${companyProfile?.name || "Unknown"}
Industry: ${companyProfile?.industry || "Unknown"}
Size: ${companyProfile?.size || "Unknown"}
Revenue Bracket: ${companyProfile?.revenue || "Unknown"}
Founded: ${companyProfile?.yearFounded || "Unknown"}
Currency: INR (Indian Rupees)

Past Decisions to Analyze:
${localDecisionCosts
  .map(
    (decision) =>
      `${decision.id}. ${decision.originalDecision} (local estimated opportunity cost: ₹${decision.missedOpportunityCost})`
  )
  .join("\n")}

Return narrative analysis for each decision using those values.`;

    const response = await callGemini(systemPrompt, userPrompt);

    if (!response.json) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const aiDecisions =
      (response.json.decisions as {
        id: number;
        originalDecision: string;
        whatIf: string;
        estimatedOutcome: string;
        confidence: string;
        lesson: string;
      }[]) || [];

    const resultDecisions = localDecisionCosts.map((localDecision) => {
      const aiDecision =
        aiDecisions.find((decision) => decision.id === localDecision.id) || aiDecisions[localDecision.id - 1];
      return {
        ...localDecision,
        whatIf: aiDecision?.whatIf || "Alternative scenario unavailable.",
        estimatedOutcome:
          aiDecision?.estimatedOutcome ||
          "Potential outcome unavailable from submitted context.",
        confidence: aiDecision?.confidence || "Medium",
        lesson: aiDecision?.lesson || "Prioritize earlier validation in future decisions.",
      };
    });

    return NextResponse.json({
      result: {
        totalOpportunityCost,
        decisions: resultDecisions,
        forwardLooking: response.json.forwardLooking || [],
        emotionalImpact: response.json.emotionalImpact || "Opportunity costs are meaningful but recoverable.",
        silverLining:
          response.json.silverLining ||
          "Each past decision now provides a clearer basis for future execution.",
      },
    });
  } catch (error: unknown) {
    console.error("Regret Engine error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
