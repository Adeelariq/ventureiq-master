"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { FileText, Upload, Send, Loader2, Lock, X } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";

interface Message { role: "user" | "ai"; content: string; }

export default function DocumentAnalyzer() {
  const { company } = useCompany();
  const [docText, setDocText] = useState<string>("");
  const [docName, setDocName] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    setDocName(file.name);

    try {
      if (file.type === "text/csv" || file.name.endsWith(".csv") || file.type === "text/plain" || file.name.endsWith(".txt")) {
        const text = await file.text();
        setDocText(text);
        setMessages([{ role: "ai", content: `Loaded: ${file.name} (${text.split("\n").length} lines). Ask me anything about this document.` }]);
      } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        // Dynamic import of pdfjs-dist to reduce initial bundle
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += (content.items as Array<{str: string}>).map((item) => item.str).join(" ") + "\n";
        }
        setDocText(fullText);
        setMessages([{ role: "ai", content: `Loaded: ${file.name} — ${pdf.numPages} pages, ${fullText.length.toLocaleString()} chars extracted client-side. Ask me anything about this document.` }]);
      } else {
        setMessages([{ role: "ai", content: "Unsupported file type. Please upload a PDF, CSV, or TXT file." }]);
      }
    } catch (err) {
      setMessages([{ role: "ai", content: `Error reading file: ${err instanceof Error ? err.message : "Unknown error"}` }]);
    } finally {
      setExtracting(false);
    }
  };

  const askQuestion = async () => {
    if (!question.trim() || !docText) return;
    const q = question.trim();
    setQuestion("");
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setLoading(true);

    try {
      const res = await fetch("/api/rag/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentText: docText, question: q, companyProfile: company }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(prev => [...prev, { role: "ai", content: data.answer }]);
    } catch (err: unknown) {
      setMessages(prev => [...prev, { role: "ai", content: `Analysis error: ${err instanceof Error ? err.message : "Failed to analyze"}` }]);
    } finally {
      setLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const clearDoc = () => { setDocText(""); setDocName(""); setMessages([]); };

  return (
    <div>
      <div className="engine-header">
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <div>
            <h2 className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Document Analyzer
            </h2>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Upload a document · Ask questions · AI answers from your data
            </p>
          </div>
        </div>
      </div>

      {/* Security note */}
      <div
        className="flex items-center gap-2 mb-4 text-xs px-3 py-2 rounded-md"
        style={{
          background: "var(--success-dim)",
          border: "1px solid var(--success-border)",
          color: "var(--success)",
        }}
      >
        <Lock className="w-3.5 h-3.5 shrink-0" />
        <span>File parsing runs locally in your browser. Text is sent server-side only when you submit a question.</span>
      </div>

      {/* Upload */}
      {!docText && (
        <div className="glass-card p-6">
          {extracting ? (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-3" />
              <p className="text-sm text-[var(--text-secondary)]">Extracting text from {docName}...</p>
            </div>
          ) : (
            <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
              <p className="text-sm font-medium">Upload a document</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">PDF, CSV, or TXT files supported</p>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept=".pdf,.csv,.txt" onChange={handleFile} className="hidden" />
        </div>
      )}

      {/* Chat Interface */}
      {docText && (
        <div className="glass-card flex flex-col" style={{ height: "calc(100vh - 280px)" }}>
          {/* Doc header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-glass)]">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium">{docName}</span>
              <span className="text-xs text-[var(--text-tertiary)]">({docText.length.toLocaleString()} chars)</span>
            </div>
            <button onClick={clearDoc} className="text-[var(--text-tertiary)] hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-[var(--accent-primary)] text-white rounded-tr-sm" : "bg-[var(--bg-card)] border border-[var(--border-glass)] rounded-tl-sm"}`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[var(--bg-card)] border border-[var(--border-glass)] rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Loader2 className="w-4 h-4 animate-spin" /> Analyzing document...
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[var(--border-glass)] p-3">
            <div className="flex gap-2">
              <input className="input-glass flex-1" placeholder="Ask about your document..." value={question} onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askQuestion(); } }} disabled={loading} />
              <button onClick={askQuestion} disabled={loading || !question.trim()} className="btn-glow px-4 py-2 disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
