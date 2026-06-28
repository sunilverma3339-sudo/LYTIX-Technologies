import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, ExternalLink, Linkedin, RefreshCcw, Save } from "lucide-react";

import {
  CircularProgress,
  DarkButton,
  DarkField,
  DarkPanel,
  MetricCard,
  Notice,
  PageHero,
  SectionTitle,
  StudentDashboardShell,
  TextStatCard,
  fadeUp,
} from "../components/StudentDashboardShell.jsx";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const checklistLabels = {
  profile_updated: "Profile updated",
  headline_updated: "Internship headline added",
  post_published: "Completion post published",
  tasks_documented: "Tasks documented",
  certificate_shared: "Certificate shared",
  internship_experience_added: "Internship experience added",
  certificate_added: "Certificate added",
  project_posted: "Project posted",
  company_page_followed: "Company page followed",
};

export default function StudentLinkedInPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ linkedin_url: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const status = await api("/linkedin/me", { token });
      setData(status);
      setForm({ linkedin_url: status.linkedin_url || "", ...status.checklist });
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
      const updated = await api("/linkedin/me", { method: "PATCH", token, body: form });
      setData(updated);
      setForm({ linkedin_url: updated.linkedin_url || "", ...updated.checklist });
      setNotice("LinkedIn workflow updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <StudentDashboardShell title="LinkedIn Growth Tracker" badge="LinkedIn">
        <DarkPanel className="grid min-h-[50vh] place-items-center text-center">
          <div>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-300/20 border-t-cyan-300" />
            <h1 className="mt-6 text-2xl font-black">Loading LinkedIn workflow...</h1>
            {error && <Notice type="error">{error}</Notice>}
          </div>
        </DarkPanel>
      </StudentDashboardShell>
    );
  }

  return (
    <StudentDashboardShell title="LinkedIn Growth Tracker" badge="Profile Proof">
      <motion.div className="grid gap-6" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.07 } } }}>
        <PageHero
          eyebrow="LinkedIn Workflow"
          title="Professional profile readiness."
          subtitle={data ? `${data.domain.name} - ${data.internship_id}` : ""}
          actions={
            <DarkButton variant="secondary" onClick={load}>
              <RefreshCcw size={17} />
              Refresh
            </DarkButton>
          }
        />

        <motion.section id="status" className="grid gap-4 md:grid-cols-[0.7fr_1fr_1fr]" variants={fadeUp}>
          <DarkPanel className="grid place-items-center text-center">
            <CircularProgress value={data?.completion_percentage || 0} size={142} stroke={12} />
            <p className="mt-4 text-sm font-bold text-slate-300">Completion</p>
          </DarkPanel>
          <MetricCard icon={Linkedin} label="Completion" value={data?.completion_percentage || 0} suffix="%" tone="cyan" />
          <TextStatCard icon={BadgeCheck} label="Completed Items" value={`${data?.completed_items || 0}/${data?.total_items || 0}`} footer="Certificate eligibility signal" />
        </motion.section>

        {(notice || error) && <Notice type={error ? "error" : "success"}>{notice || error}</Notice>}

        <DarkPanel id="checklist">
          <SectionTitle eyebrow="Checklist" title="LinkedIn public proof checklist." copy="Add your profile URL and mark each required profile improvement complete." />
          <form className="mt-6 grid gap-5" onSubmit={save}>
            <label className="grid gap-2 text-sm font-black text-slate-200">
              LinkedIn profile URL
              <DarkField
                value={form.linkedin_url || ""}
                onChange={(event) => setForm({ ...form, linkedin_url: event.target.value })}
                placeholder="https://www.linkedin.com/in/your-profile"
                required
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(checklistLabels).map(([key, label]) => (
                <label className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-bold text-slate-200" key={key}>
                  <span>{label}</span>
                  <input
                    className="h-5 w-5 accent-cyan-400"
                    type="checkbox"
                    checked={Boolean(form[key])}
                    onChange={(event) => setForm({ ...form, [key]: event.target.checked })}
                  />
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <DarkButton disabled={busy}>
                <Save size={17} />
                {busy ? "Saving..." : "Save LinkedIn status"}
              </DarkButton>
              <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15" href={data?.add_to_linkedin_url} target="_blank" rel="noreferrer">
                <ExternalLink size={17} />
                Add to LinkedIn
              </a>
            </div>
          </form>
        </DarkPanel>
      </motion.div>
    </StudentDashboardShell>
  );
}
