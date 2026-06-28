import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BrainCircuit, Code2, FileText, GraduationCap, MessageCircle, Route, Send, Sparkles, X } from "lucide-react";
import { useLocation } from "react-router-dom";

import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const tools = [
  { key: "resume_builder", label: "AI Resume Builder", icon: FileText },
  { key: "resume_analyzer", label: "AI Resume Analyzer", icon: FileText },
  { key: "ats_score_checker", label: "ATS Score Checker", icon: Sparkles },
  { key: "interview_simulator", label: "AI Interview Simulator", icon: MessageCircle },
  { key: "career_roadmap", label: "Career Roadmap Generator", icon: Route },
  { key: "coding_assistant", label: "AI Coding Assistant", icon: Code2 },
  { key: "project_reviewer", label: "AI Project Reviewer", icon: BrainCircuit },
  { key: "assignment_helper", label: "AI Assignment Helper", icon: GraduationCap },
  { key: "career_counselor", label: "AI Career Counselor", icon: Sparkles },
  { key: "domain_recommendation", label: "AI Domain Recommendation", icon: BrainCircuit },
];

export default function FloatingAIAssistant() {
  const { user, token } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [toolKey, setToolKey] = useState(tools[0].key);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [provider, setProvider] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function ask(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult("");
    setProvider("");
    try {
      const text = prompt.trim();
      const response = await runAssistant(toolKey, text, user, token, location.pathname);
      setResult(response.answer);
      setProvider(response.provider);
    } catch (err) {
      setError(err.message || "LYTIX AI service is unavailable right now.");
    } finally {
      setBusy(false);
    }
  }

  const activeTool = tools.find((item) => item.key === toolKey) || tools[0];
  const ActiveIcon = activeTool.icon || BrainCircuit;

  return (
    <div className="fixed bottom-4 right-3 z-[90] sm:bottom-5 sm:right-6" data-testid="lytix-ai-assistant">
      <AnimatePresence>
      {open && (
        <motion.div
          className="mb-4 max-h-[calc(100vh-104px)] w-[calc(100vw-24px)] max-w-[430px] overflow-hidden rounded-[1.6rem] border border-white/15 bg-slate-950/[0.92] shadow-[0_28px_90px_rgba(0,0,0,0.36)] backdrop-blur-2xl sm:w-[calc(100vw-32px)]"
          data-testid="lytix-ai-panel"
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.97 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/10 p-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">LYTIX AI Assistant</p>
              <h3 className="mt-1 text-xl font-black text-white">Ask LYTIX AI</h3>
              <p className="mt-1 text-xs font-bold text-slate-400">Context preserved on {location.pathname}. No paid API key required.</p>
            </div>
            <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.94 }} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/10 text-white" onClick={() => setOpen(false)} type="button" aria-label="Close LYTIX AI" data-testid="lytix-ai-close">
              <X size={18} />
            </motion.button>
          </div>

          <div className="max-h-[calc(100vh-244px)] overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-2">
              {tools.map((item) => {
                const Icon = item.icon;
                const active = item.key === toolKey;
                return (
                  <motion.button
                    className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-black transition ${active ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/10"}`}
                    key={item.label}
                    data-testid="lytix-ai-tool"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setToolKey(item.key);
                      setResult("");
                      setProvider("");
                      setError("");
                    }}
                    type="button"
                  >
                    <Icon size={15} />
                    {item.label.replace("AI ", "")}
                  </motion.button>
                );
              })}
            </div>

            <form className="mt-4 grid gap-3" onSubmit={ask}>
              <label className="grid gap-2 text-sm font-black text-slate-200">
                <span className="flex items-center gap-2"><ActiveIcon size={16} className="text-cyan-200" />{activeTool.label}</span>
                <textarea
                  className="min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold leading-6 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/60"
                  placeholder="Ask for resume bullets, ATS feedback, interview questions, roadmap, code review, project review, or career advice..."
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                />
              </label>
              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 disabled:opacity-60" disabled={busy} type="submit">
                <Send size={17} />
                {busy ? "Thinking..." : "Ask LYTIX AI"}
              </motion.button>
            </form>

            {error && <div className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">{error}</div>}
            {busy && <TypingLoader />}
            {result && (
              <motion.div
                className="mt-4 whitespace-pre-wrap rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-4 text-sm font-semibold leading-6 text-slate-100"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
              >
                {provider && (
                  <span className={`mb-3 flex w-fit rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${provider === "gemini" ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100" : "border-amber-300/30 bg-amber-400/10 text-amber-100"}`}>
                    {provider === "gemini" ? "Powered by Gemini" : "Fallback mode"}
                  </span>
                )}
                {result}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      <motion.button
        className="inline-flex min-h-12 items-center gap-3 rounded-full border border-cyan-300/30 bg-slate-950/90 px-4 py-3 text-sm font-black text-white shadow-[0_18px_50px_rgba(6,182,212,0.28)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-slate-900 sm:px-5"
        onClick={() => setOpen((current) => !current)}
        type="button"
        aria-label="Ask LYTIX AI"
        data-testid="lytix-ai-toggle"
        animate={{ boxShadow: ["0 18px 50px rgba(6,182,212,0.22)", "0 22px 70px rgba(6,182,212,0.38)", "0 18px 50px rgba(6,182,212,0.22)"] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.96 }}
      >
        <BrainCircuit className="text-cyan-200" size={20} />
        <span className="hidden min-[380px]:inline">Ask LYTIX AI</span>
        <span className="min-[380px]:hidden">LYTIX AI</span>
      </motion.button>
    </div>
  );
}

function TypingLoader() {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100">
      <span>LYTIX AI is typing</span>
      <span className="flex gap-1">
        {[0, 1, 2].map((index) => (
          <motion.span
            className="h-2 w-2 rounded-full bg-cyan-200"
            animate={{ y: [0, -5, 0], opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 0.85, repeat: Infinity, delay: index * 0.14, ease: "easeInOut" }}
            key={index}
          />
        ))}
      </span>
    </div>
  );
}

async function runAssistant(tool, prompt, user, token, route) {
  const text = prompt.trim() || "Give me guidance for this LYTIX page.";
  return api("/ai/ask", {
    method: "POST",
    token,
    body: {
      tool,
      message: text,
      route,
      role: user?.role || "guest",
    },
  });
}
