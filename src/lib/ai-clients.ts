// Server-only AI client wrappers — never import in client components

export interface AIResponse {
  text: string;
  json?: Record<string, unknown>;
}

const AI_TIMEOUT_MS = 30_000; // 30 seconds

function makeTimeoutSignal(): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(id),
  };
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

  const { signal, clear } = makeTimeoutSignal();

  let res: Response;
  try {
    res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    clear();
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("AI service unavailable — request timed out after 30 seconds. Please try again.");
    }
    throw new Error("AI service unavailable — network error. Please check your connection and try again.");
  }
  clear();

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) {
      let retryMsg = "";
      try {
        const parsed = JSON.parse(errText);
        const msg: string = parsed?.error?.message || "";
        const match = msg.match(/try again in ([\d]+m[\d.]+s|[\d.]+s)/i);
        if (match) retryMsg = ` Resets in ${match[1].replace(/\.\d+s/, "s")}.`;
      } catch { /* ignore parse errors */ }
      throw new Error(`⚠️ Groq daily token limit reached.${retryMsg} Please wait and try again, or check your quota at console.groq.com`);
    }
    console.error(`[Groq] HTTP ${res.status}: ${errText.slice(0, 300)}`);
    throw new Error(`AI service unavailable (${res.status}). Please try again.`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";

  // Integrity logging
  console.log(`[Groq] Response received — length: ${text.length} chars, finish_reason: ${data.choices?.[0]?.finish_reason}`);

  if (!text) {
    throw new Error("AI service returned an empty response. Please try again.");
  }

  let json: Record<string, unknown> | undefined;
  if (jsonMode) {
    try {
      json = JSON.parse(text);
      console.log(`[Groq] JSON parsed successfully — top-level keys: ${Object.keys(json || {}).join(", ")}`);
    } catch {
      console.error("[Groq] Failed to parse JSON response:", text.slice(0, 200));
      json = undefined;
    }
  }

  return { text, json };
}

/**
 * Call Gemini API — 1M token context, perfect for RAG document analysis
 * Used for: Document Analyzer, Regret Engine
 */
export async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7
): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const { signal, clear } = makeTimeoutSignal();

  let res: Response;
  try {
    res = await fetch(
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
            temperature: temperature,
            maxOutputTokens: 8192,
          },
        }),
        signal,
      }
    );
  } catch (err) {
    clear();
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("AI service unavailable — request timed out after 30 seconds. Please try again.");
    }
    throw new Error("AI service unavailable — network error. Please check your connection and try again.");
  }
  clear();

  if (!res.ok) {
    const err = await res.text();
    console.error(`[Gemini] HTTP ${res.status}: ${err.slice(0, 300)}`);
    if (res.status === 429) {
      throw new Error("AI service unavailable — quota exceeded. Please wait and try again.");
    }
    throw new Error(`AI service unavailable (${res.status}). Please try again.`);
  }

  const data = await res.json();
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Integrity logging
  console.log(`[Gemini] Response received — length: ${text.length} chars, finish_reason: ${data.candidates?.[0]?.finishReason}`);

  if (!text) {
    throw new Error("AI service returned an empty response. Please try again.");
  }

  let json: Record<string, unknown> | undefined;
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      json = JSON.parse(jsonMatch[0]);
      console.log(`[Gemini] JSON parsed successfully — top-level keys: ${Object.keys(json || {}).join(", ")}`);
    }
  } catch {
    console.error("[Gemini] Failed to parse JSON from response:", text.slice(0, 200));
    json = undefined;
  }

  return { text, json };
}
