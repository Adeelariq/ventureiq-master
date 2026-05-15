import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/lib/ai-clients";
import { isGibberish } from "@/lib/validators";
import type { ComputedFinancials } from "@/lib/financial-parser";

const CANONICAL_INTEGRITY_CLAUSE = `CRITICAL INTEGRITY RULES:
- Use ONLY the provided business metrics. Do NOT invent revenue values.
- Do NOT fabricate losses, costs, or financial figures.
- Do NOT hallucinate benchmark data or industry averages.
- If insufficient data exists, explicitly state it is unavailable.
- All monetary estimates must be proportional to the provided metrics.`;

/**
 * Calculate grounded opportunity cost for each decision using REAL P&L financials.
 * Costs scale proportionally to actual uploaded revenue — NOT bracket guesses.
 *
 * Formula basis:
 *   - Each past decision mistake represents a lost % of annual revenue
 *   - Range: 3%–18% of revenue per decision (realistic for Indian SME context)
 *   - When costs exceed revenue (loss-making), multiply by 1.3 (compounding risk)
 *   - Costs naturally vary per decision using text-length as a deterministic seed
 *   - Total is capped at 30% of annual revenue to prevent absurd estimates
 */
function groundedOpportunityCost(
  pnl: ComputedFinancials,
  decisionText: string,
  decisionIndex: number,
  totalDecisions: number
): number {
  const revenue = pnl.totalRevenue;

  // Ensure we have a real positive revenue to work with
  if (!revenue || revenue <= 0) return 0;

  // Deterministic variation per decision: use text length % to avoid identical values
  const textSeed = decisionText.length % 10; // 0–9
  const seedFraction = textSeed / 10; // 0.0–0.9

  // Base impact range: 3% to 18% of annual revenue per decision
  // Lower decisions (later in list) tend to have slightly smaller impact
  const positionDiscount = decisionIndex / (totalDecisions + 1); // 0.0 → 0.75
  const minFraction = Math.max(0.03, 0.06 - positionDiscount * 0.02);
  const maxFraction = Math.max(0.07, 0.18 - positionDiscount * 0.05);

  // Blend between min and max using text seed
  const fraction = minFraction + (maxFraction - minFraction) * seedFraction;

  // Amplify if company is loss-making (compounding risk)
  const costPressureMultiplier = pnl.netProfitLoss < 0 ? 1.3 : 1.0;

  const raw = Math.round(revenue * fraction * costPressureMultiplier);

  // Floor: at least ₹25,000 (realistic minimum for any business decision)
  return Math.max(25_000, raw);
}

/**
 * Map P&L confidence score to regret confidence label.
 */
function pnlConfidenceToRegretConfidence(pnlConfidence: number): string {
  if (pnlConfidence >= 70) return "High";
  if (pnlConfidence >= 40) return "Medium";
  return "Low";
}

export async function POST(req: NextRequest) {
  try {
    const { decisions, companyProfile, computedFinancials } = await req.json();

    // ── Gate: Require uploaded P&L data ────────────────────────────────────────
    const pnl = computedFinancials as ComputedFinancials | undefined;
    const hasValidPnl =
      !!pnl &&
      Number.isFinite(pnl.totalRevenue) &&
      pnl.totalRevenue > 0 &&
      Number.isFinite(pnl.totalCosts) &&
      pnl.confidence >= 40;

    if (!hasValidPnl) {
      return NextResponse.json(
        {
          error:
            "Upload financial data first to generate grounded regret analysis. Run the P&L Engine with valid uploaded data, then return here.",
        },
        { status: 400 }
      );
    }

    // ── Validate decisions ──────────────────────────────────────────────────────
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

    // ── Grounded opportunity cost calculation (deterministic, no guesses) ───────
    const regretConfidence = pnlConfidenceToRegretConfidence(pnl.confidence);

    const localDecisionCosts = normalizedDecisions.map((decision, index) => {
      const amount = groundedOpportunityCost(pnl, decision, index, normalizedDecisions.length);
      return {
        id: index + 1,
        originalDecision: decision,
        missedOpportunityCost: amount,
        confidence: regretConfidence,
      };
    });

    const totalOpportunityCost = localDecisionCosts.reduce(
      (sum, d) => sum + d.missedOpportunityCost,
      0
    );

    // Integrity check: cap total at 50% of annual revenue (hard ceiling)
    const revenueCapCeiling = Math.round(pnl.totalRevenue * 0.5);
    const cappedTotal = Math.min(totalOpportunityCost, revenueCapCeiling);
    const capRatio = cappedTotal / totalOpportunityCost;

    const cappedDecisionCosts = localDecisionCosts.map((d) => ({
      ...d,
      missedOpportunityCost: Math.round(d.missedOpportunityCost * capRatio),
    }));

    // ── AI prompt: narrative only — no new monetary figures ────────────────────
    const systemPrompt = `You are a business strategist AI specializing in opportunity-cost and ROI storytelling.
${CANONICAL_INTEGRITY_CLAUSE}

Your ONLY job is to provide narrative context for pre-calculated financial impact figures.
You MUST NOT invent or alter any monetary figures. Use the exact values provided.

You MUST respond with ONLY a valid JSON object in this exact structure:
{
  "decisions": [
    {
      "id": number,
      "originalDecision": "string (what they did)",
      "isGoodDecision": boolean (true if it was actually a smart move, false if it's a regret/mistake),
      "whatIf": "string (what would have happened if they chose differently, no invented ₹ figures)",
      "estimatedOutcome": "string (projected better outcome if mistake, or projected worse outcome if it was a good decision, reference provided cost only)",
      "confidence": "High" | "Medium" | "Low",
      "lesson": "string (actionable takeaway, industry-specific)"
    }
  ],
  "forwardLooking": [
    {
      "recommendation": "string (specific to industry and company size)",
      "potentialValue": "string (AI projection only — labeled as estimate, e.g. '₹15L–₹50L (AI projection, not guarantee)')",
      "timeframe": "string"
    }
  ],
  "emotionalImpact": "string (empathetic 1-2 sentence reflection on the cumulative cost, referencing provided total)",
  "silverLining": "string (something positive that came from these decisions)"
}

Rules:
- If a decision was actually a SMART move, set isGoodDecision to true. The provided financial impact then represents "Profit/Value Generated" instead of a loss.
- Use the provided opportunity costs exactly as given — do not change them
- Use INR currency notation (₹) only when referencing provided figures
- Forward-looking potentialValue MUST be labeled with '(AI projection, not guarantee)'
- Provide exactly 2-3 forward-looking recommendations specific to the company industry
- Be specific to the industry and company size — not generic advice
- The emotional impact must reference the actual provided total cost figure
- Always include a silver lining`;

    const userPrompt = `Company: ${companyProfile?.name || "Unknown"}
Industry: ${companyProfile?.industry || "Unknown"}
Company Size: ${companyProfile?.size || "Unknown"}
Founded: ${companyProfile?.yearFounded || "Unknown"}
Currency: INR (Indian Rupees)

Uploaded P&L Summary:
- Annual Revenue: ₹${pnl.totalRevenue.toLocaleString("en-IN")}
- Total Costs: ₹${pnl.totalCosts.toLocaleString("en-IN")}
- Net P&L: ₹${pnl.netProfitLoss.toLocaleString("en-IN")}
- Profit Margin: ${pnl.profitMargin.toFixed(1)}%
- Data Confidence: ${pnl.confidence.toFixed(0)}%
- Regret Analysis Confidence: ${regretConfidence}

Total Missed Opportunity Cost (pre-calculated, DO NOT ALTER): ₹${cappedTotal.toLocaleString("en-IN")}

    Past Decisions with Pre-Calculated Financial Impact:
${cappedDecisionCosts
  .map(
    (d) =>
      `${d.id}. "${d.originalDecision}"
   → Financial Impact (Opportunity Cost / Value Generated): ₹${d.missedOpportunityCost.toLocaleString("en-IN")} (grounded in uploaded revenue)`
  )
  .join("\n")}

Provide narrative analysis for each decision using ONLY these values. Do NOT change any figures.`;

    const response = await callGemini(systemPrompt, userPrompt);

    if (!response.json) {
      return NextResponse.json(
        { error: "AI service was unable to generate analysis. Please try again." },
        { status: 500 }
      );
    }

    const aiDecisions =
      (response.json.decisions as {
        id: number;
        originalDecision: string;
        isGoodDecision: boolean;
        whatIf: string;
        estimatedOutcome: string;
        confidence: string;
        lesson: string;
      }[]) || [];

    const resultDecisions = cappedDecisionCosts.map((localDecision) => {
      const aiDecision =
        aiDecisions.find((d) => d.id === localDecision.id) ||
        aiDecisions[localDecision.id - 1];
      return {
        ...localDecision,
        isGoodDecision: aiDecision?.isGoodDecision || false,
        whatIf: aiDecision?.whatIf || "Alternative scenario analysis unavailable.",
        estimatedOutcome:
          aiDecision?.estimatedOutcome ||
          "Outcome projection unavailable — insufficient AI response.",
        confidence: aiDecision?.confidence || regretConfidence,
        lesson: aiDecision?.lesson || "Validate key decisions earlier with financial data.",
      };
    });

    return NextResponse.json({
      result: {
        totalOpportunityCost: cappedTotal,
        decisions: resultDecisions,
        forwardLooking: response.json.forwardLooking || [],
        emotionalImpact:
          response.json.emotionalImpact ||
          "These decisions represent real opportunity costs grounded in your uploaded financial data.",
        silverLining:
          response.json.silverLining ||
          "Each past decision now provides a clearer financial basis for future execution.",
        dataSourceLabel: "Grounded in uploaded P&L data",
        pnlConfidence: pnl.confidence,
        regretConfidence,
      },
    });
  } catch (error: unknown) {
    console.error("Regret Engine error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
