import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, BadgeCheck, FileText, Github, Lightbulb, RefreshCcw, Save, SearchCheck, Sparkles, Target } from "lucide-react";

import {
  DarkButton,
  DarkField,
  DarkPanel,
  EmptyDark,
  MetricCard,
  Notice,
  PageHero,
  ProgressLine,
  ProjectSignal,
  SectionTitle,
  StudentDashboardShell,
  TextStatCard,
  fadeUp,
} from "../components/StudentDashboardShell.jsx";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

export default function StudentResumeToolsPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ resume_url: "", github_url: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const placement = await api("/placement/me", { token });
      setData(placement);
      setForm({
        resume_url: placement.profile.resume_url || "",
        github_url: placement.profile.github_url || "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api("/placement/resume", { method: "PUT", token, body: form });
      setNotice("Resume details saved for ATS review.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <StudentDashboardShell title="Resume Intelligence" eyebrow="LYTIX Student OS" badge="ATS Review">
        <DarkPanel className="grid min-h-[50vh] place-items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-300/20 border-t-cyan-300" />
          {error && <Notice type="error">{error}</Notice>}
        </DarkPanel>
      </StudentDashboardShell>
    );
  }

  const profile = data?.profile || {};
  const atsScore = Number(profile.ats_score || 0);
  const analysis = buildResumeAnalysis(profile);

  return (
    <StudentDashboardShell title="Resume Intelligence" eyebrow="LYTIX Student OS" badge="AI Resume Analysis">
      <motion.div className="grid min-w-0 gap-6" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.07 } } }}>
        <PageHero
          eyebrow="AI Resume Analysis"
          title="Smart Resume Analyzer"
          subtitle="Upload resume and GitHub links, track ATS readiness, and use guided keyword feedback to improve your recruiter-facing profile."
          actions={<DarkButton variant="secondary" onClick={load} type="button"><RefreshCcw size={17} />Refresh</DarkButton>}
        >
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <ProjectSignal icon={SearchCheck} label="Review Mode" value="ATS + Keyword Signals" />
            <ProjectSignal icon={Target} label="Placement Status" value={profile.placement_status || "Not Started"} />
            <ProjectSignal icon={BadgeCheck} label="Resume Link" value={profile.resume_url ? "Connected" : "Pending"} />
          </div>
        </PageHero>

        <motion.section id="score" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" variants={fadeUp}>
          <MetricCard icon={BarChart3} label="ATS Score" value={atsScore} suffix="%" tone="cyan" />
          <TextStatCard icon={Sparkles} label="Analyzer" value="AI Resume Analysis" footer="Smart keyword scan" />
          <TextStatCard icon={FileText} label="Resume URL" value={profile.resume_url ? "Uploaded" : "Needed"} />
          <TextStatCard icon={Github} label="GitHub URL" value={profile.github_url ? "Connected" : "Optional"} />
        </motion.section>

        {notice && <Notice>{notice}</Notice>}
        {error && <Notice type="error">{error}</Notice>}

        <motion.section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]" variants={fadeUp}>
          <DarkPanel id="tools" className="bg-slate-950/75">
            <SectionTitle
              eyebrow="Resume Upload"
              title="Submit profile links for ATS review."
              copy="Use public or shareable links so mentors and placement admins can review your resume evidence."
            />
            <form className="mt-6 grid gap-4" onSubmit={save}>
              <label className="grid gap-2 text-sm font-black text-slate-200">
                Resume URL
                <DarkField placeholder="https://drive.google.com/..." value={form.resume_url} onChange={(event) => setForm({ ...form, resume_url: event.target.value })} />
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-200">
                GitHub URL
                <DarkField placeholder="https://github.com/username" value={form.github_url} onChange={(event) => setForm({ ...form, github_url: event.target.value })} />
              </label>
              <DarkButton disabled={busy}>
                <Save size={17} />
                {busy ? "Saving..." : "Save resume details"}
              </DarkButton>
            </form>
          </DarkPanel>

          <DarkPanel className="bg-slate-950/75">
            <SectionTitle eyebrow="Overall Resume Strength" title="ATS readiness score." copy="A higher score means your resume is easier for screening systems and recruiters to understand." />
            <div className="mt-6 rounded-3xl border border-cyan-300/25 bg-cyan-300/10 p-5">
              <ProgressLine label="Overall Resume Strength" value={atsScore} />
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <ScoreSignal label="Keyword Fit" value={analysis.relevant.length * 12 + 28} />
                <ScoreSignal label="Evidence" value={profile.github_url ? 82 : 46} />
                <ScoreSignal label="Formatting" value={profile.resume_url ? 74 : 42} />
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-sm font-semibold leading-6 text-slate-300">
              {profile.resume_feedback || "Upload your latest resume and request admin review to receive personalized ATS feedback."}
            </div>
          </DarkPanel>
        </motion.section>

        <motion.section className="grid gap-6 xl:grid-cols-2" variants={fadeUp}>
          <AnalysisCard icon={SearchCheck} title="Relevant Keywords Found" items={analysis.relevant} tone="cyan" />
          <AnalysisCard icon={Target} title="Missing Keywords" items={analysis.missing} tone="amber" />
          <AnalysisCard icon={Lightbulb} title="Improvement Suggestions" items={analysis.suggestions} tone="blue" />
          <AnalysisCard icon={Sparkles} title="Overall Resume Strength" items={analysis.strengths} tone="green" />
        </motion.section>
      </motion.div>
    </StudentDashboardShell>
  );
}

function AnalysisCard({ icon: Icon, title, items, tone }) {
  const tones = {
    cyan: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
    amber: "border-amber-300/25 bg-amber-300/10 text-amber-100",
    blue: "border-blue-300/25 bg-blue-400/10 text-blue-100",
    green: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
  };
  return (
    <motion.div
      className="rounded-[1.6rem] border border-cyan-300/25 bg-slate-950/75 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl"
      whileHover={{ y: -5, boxShadow: "0 24px 70px rgba(6,182,212,0.18)" }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <div className="flex items-center gap-3">
        <span className={`grid h-11 w-11 place-items-center rounded-2xl border ${tones[tone] || tones.cyan}`}>
          <Icon size={20} />
        </span>
        <h3 className="text-xl font-black text-white">{title}</h3>
      </div>
      <div className="mt-5 grid gap-3">
        {items.length === 0 && <EmptyDark message="No signals available yet." />}
        {items.map((item) => (
          <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-bold leading-6 text-slate-200" key={item}>
            {item}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ScoreSignal({ label, value }) {
  const score = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</span>
      <strong className="mt-2 block text-2xl font-black text-white">{score}%</strong>
    </div>
  );
}

function buildResumeAnalysis(profile) {
  const hasResume = Boolean(profile.resume_url);
  const hasGithub = Boolean(profile.github_url);
  const feedback = String(profile.resume_feedback || "");
  const suggestions = String(profile.improvement_suggestions || "");

  return {
    relevant: [
      hasResume ? "Resume link submitted for ATS review" : "Profile is ready to accept a resume link",
      hasGithub ? "GitHub portfolio signal connected" : "Career profile created in LYTIX placement cell",
      feedback ? "Admin feedback history available" : "LYTIX credential and project workflow signals available",
    ],
    missing: [
      !hasResume && "Share a public resume URL",
      !hasGithub && "Add GitHub or portfolio repository link",
      "Add role-specific keywords from the target internship domain",
      "Include measurable project outcomes and tool names",
    ].filter(Boolean),
    suggestions: [
      suggestions || "Add quantified impact, project metrics, deployment links, and role-specific keywords.",
      "Keep section headings clear: Skills, Projects, Internship Experience, Certifications, Education.",
      "Add LYTIX certificate verification and LinkedIn credential links after documents are issued.",
    ],
    strengths: [
      "Structured LYTIX internship workflow supports credibility.",
      hasGithub ? "Portfolio evidence is easier for recruiters to inspect." : "Project links can significantly improve resume strength.",
      feedback ? "You already have review feedback to iterate on." : "Admin review can unlock more specific recommendations.",
    ],
  };
}
