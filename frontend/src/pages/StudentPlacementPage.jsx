import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  BellRing,
  BriefcaseBusiness,
  ExternalLink,
  FileText,
  RefreshCcw,
  Save,
  SendHorizonal,
} from "lucide-react";

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

export default function StudentPlacementPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState({ resume_url: "", github_url: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [placement, jobAlerts] = await Promise.all([
        api("/placement/me", { token }),
        api("/job-alerts/me", { token }),
      ]);
      setData(placement);
      setAlerts(jobAlerts);
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

  async function run(label, action, message) {
    setBusy(label);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(message);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return (
      <StudentDashboardShell title="Placement Cell" badge="Career">
        <DarkPanel className="grid min-h-[50vh] place-items-center text-center">
          <div>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-300/20 border-t-cyan-300" />
            <h1 className="mt-6 text-2xl font-black">Loading placement cell...</h1>
            {error && <Notice type="error">{error}</Notice>}
          </div>
        </DarkPanel>
      </StudentDashboardShell>
    );
  }

  const profile = data?.profile || {};

  return (
    <StudentDashboardShell title="Placement Cell" badge="Career Launch">
      <motion.div className="grid gap-6" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.07 } } }}>
        <PageHero
          eyebrow="Placement Cell"
          title="Career launch workspace."
          subtitle={data?.application ? `${data.application.domain.name} - ${data.application.internship_id}` : ""}
          actions={
            <DarkButton variant="secondary" onClick={load}>
              <RefreshCcw size={17} />
              Refresh
            </DarkButton>
          }
        />

        <motion.section id="placement" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" variants={fadeUp}>
          <MetricCard icon={FileText} label="ATS Score" value={profile.ats_score || 0} suffix="%" tone="cyan" />
          <TextStatCard icon={BriefcaseBusiness} label="Placement Status" value={profile.placement_status || "Not Started"} footer="Pipeline stage" />
          <TextStatCard icon={BadgeCheck} label="Mock Interview" value={profile.mock_interview_requested ? "Requested" : "Not Requested"} />
          <TextStatCard icon={BellRing} label="Job Alerts" value={alerts.length} />
        </motion.section>

        {(notice || error) && <Notice type={error ? "error" : "success"}>{notice || error}</Notice>}

        <motion.section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]" variants={fadeUp}>
          <DarkPanel id="resume">
            <SectionTitle eyebrow="Resume Upload" title="Resume and GitHub profile links." copy="Use shareable URLs for review. Admin review updates ATS score and feedback." />
            <form
              className="mt-6 grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                run("resume", () => api("/placement/resume", { method: "PUT", token, body: form }), "Resume details saved.");
              }}
            >
              <label className="grid gap-2 text-sm font-black text-slate-200">
                Resume URL
                <DarkField value={form.resume_url} onChange={(event) => setForm({ ...form, resume_url: event.target.value })} placeholder="https://drive.google.com/..." />
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-200">
                GitHub URL
                <DarkField value={form.github_url} onChange={(event) => setForm({ ...form, github_url: event.target.value })} placeholder="https://github.com/..." />
              </label>
              <DarkButton disabled={busy === "resume"}>
                <Save size={17} />
                Save resume details
              </DarkButton>
            </form>
          </DarkPanel>

          <DarkPanel>
            <SectionTitle eyebrow="Resume Analysis" title="ATS score and improvement feedback." />
            <div className="mt-6">
              <ProgressLine label="ATS Score" value={profile.ats_score || 0} />
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <ProjectSignal icon={FileText} label="ATS Score" value={`${profile.ats_score || 0}%`} />
              <ProjectSignal icon={BriefcaseBusiness} label="Status" value={profile.placement_status || "Not Started"} />
            </div>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-sm leading-6 text-slate-300">
                {profile.resume_feedback || "Resume feedback will appear after admin review."}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-sm leading-6 text-slate-300">
                {profile.improvement_suggestions || "Improvement suggestions will be generated after review."}
              </div>
            </div>
            <DarkButton
              className="mt-5"
              variant="secondary"
              disabled={busy === "interview" || profile.mock_interview_requested}
              onClick={() => run("interview", () => api("/placement/mock-interview", { method: "POST", token }), "Mock interview request submitted.")}
            >
              <SendHorizonal size={17} />
              Request mock interview
            </DarkButton>
          </DarkPanel>
        </motion.section>

        <DarkPanel id="jobs">
          <SectionTitle eyebrow="Latest Job Alerts" title="Domain-specific hiring opportunities." />
          <div className="mt-6 grid gap-4">
            {alerts.length === 0 && <EmptyDark message="No job alerts for your domain yet." />}
            {alerts.slice(0, 4).map((alert) => (
              <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.055] p-4 md:flex-row md:items-center md:justify-between" key={alert.id}>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">{alert.company_name}</p>
                  <strong className="mt-2 block text-xl text-white">{alert.role}</strong>
                  <span className="mt-2 block text-sm text-slate-400">{alert.location} | {alert.job_type} | Deadline {alert.deadline || "N/A"}</span>
                </div>
                {alert.apply_link && (
                  <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-blue-700" href={alert.apply_link} target="_blank" rel="noreferrer">
                    Apply
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </DarkPanel>
      </motion.div>
    </StudentDashboardShell>
  );
}
