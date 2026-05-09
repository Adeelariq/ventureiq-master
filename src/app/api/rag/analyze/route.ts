import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/ai-clients";

export async function POST(req: NextRequest) {
  try {
    const { documentText, question, companyProfile } = await req.json();

    if (!documentText || !documentText.trim()) {
      return NextResponse.json({ error: "Document text is required" }, { status: 400 });
    }

    if (!question || !question.trim()) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const systemPrompt = `You are VentureIQ's AI document analyst. You have been given the full text of a business document uploaded by a CEO/founder.

Your job is to:
1. Answer the user's question based ONLY on the document content
2. Cite specific numbers, sections, or quotes from the document
3. If the document doesn't contain relevant info, say so clearly
4. Provide actionable insights when possible
5. Format your response with clear headers and bullet points using markdown

Company Context:
- Name: ${companyProfile?.name || "Unknown"}
- Industry: ${companyProfile?.industry || "Unknown"}
- Size: ${companyProfile?.size || "Unknown"}

Be concise but thorough. Use bold for key numbers and findings.`;

    const userPrompt = `## Document Content
${documentText.substring(0, 100000)}

## Question
${question}`;

    // Switch to Groq because Gemini fetch is timing out for the user
    const response = await callGroq(systemPrompt, userPrompt, false);

    return NextResponse.json({ answer: response.text });
  } catch (error: unknown) {
    console.error("RAG Analyze error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
