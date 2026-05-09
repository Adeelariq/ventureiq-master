// Server-only AI client wrappers — never import in client components

export interface AIResponse {
  text: string;
  json?: Record<string, unknown>;
}

/**
 * Call Groq API — ultra-fast inference, great for structured JSON
 * Used for: P&L, FutureProof, Benchmark, Regret engines
 */
export async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  jsonMode: boolean = true
): Promise<AIResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const body: Record<string, unknown> = {
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 2048,
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) {
      // Parse retry time from Groq's error message e.g. "Please try again in 12m51.552s"
      let retryMsg = "";
      try {
        const parsed = JSON.parse(errText);
        const msg: string = parsed?.error?.message || "";
        const match = msg.match(/try again in ([\d]+m[\d.]+s|[\d.]+s)/i);
        if (match) retryMsg = ` Resets in ${match[1].replace(/\.\d+s/, "s")}.`;
      } catch { /* ignore parse errors */ }
      throw new Error(`⚠️ Groq daily token limit reached.${retryMsg} Please wait and try again, or check your quota at console.groq.com`);
    }
    throw new Error(`AI request failed (${res.status}). Please try again.`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";

  let json: Record<string, unknown> | undefined;
  if (jsonMode) {
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }
  }

  return { text, json };
}

/**
 * Call Gemini API — 1M token context, perfect for RAG document analysis
 * Used for: Document Analyzer (Phase 3)
 */
export async function callGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  let json: Record<string, unknown> | undefined;
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      json = JSON.parse(jsonMatch[0]);
    }
  } catch {
    json = undefined;
  }

  return { text, json };
}
