import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, BriefcaseBusiness, FileText, LayoutDashboard, LifeBuoy, RefreshCcw, Save, SearchCheck, Sparkles, Target } from "lucide-react";

import {
  RoleBadge,
  RoleButton,
  RoleDashboardShell,
  RoleEmpty,
  RoleField,
  RoleHero,
  RoleMetricCard,
  RoleNotice,
  RolePanel,
  RoleSectionTitle,
  roleFadeUp,
} from "../components/RoleDashboardShell.jsx";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const statuses = ["Not Started", "Resume Reviewed", "Mock Interview Done", "Shortlisted", "Placed"];
const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Placement", href: "#placement", icon: BriefcaseBusiness },
  { label: "ATS Review", href: "/admin/resume-review", icon: FileText },
  { label: "Support", href: "/support", icon: LifeBuoy },
];

export default function AdminPlacementPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/admin/placement/resumes", { token });
      setRows(data);
      const next = {};
      data.forEach((row) => {
        next[row.student_id] = {
          ats_score: row.ats_score ?? 0,
          resume_feedback: row.resume_feedback || "",
          improvement_suggestions: row.improvement_suggestions || "",
          placement_status: row.placement_status || "Not Started",
        };
      });
      setDrafts(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(studentId) {
    setBusy(studentId);
    setError("");
    setNotice("");
    try {
      await api(`/admin/placement/resumes/${studentId}`, {
        method: "PATCH",
        token,
        body: { ...drafts[studentId], ats_score: Number(drafts[studentId].ats_score || 0) },
      });
      setNotice("ATS review and placement profile updated.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  const average = rows.length ? Math.round(rows.reduce((sum, row) => sum + Number(row.ats_score || 0), 0) / rows.length) : 0;
  const pipeline = rows.filter((row) => row.placement_status !== "Not Started").length;
  const reviewed = rows.filter((row) => Number(row.ats_score || 0) > 0 || row.resume_feedback).length;

  return (
    <RoleDashboardShell
      roleLabel="LYTIX Admin OS"
      title="ATS Review"
      subtitle="Review resumes, update ATS scores, add feedback, and move students through the placement pipeline."
      navItems={navItems}
      badge="Smart Resume Analyzer"
      actions={<RoleButton variant="secondary" onClick={load} disabled={loading} type="button"><RefreshCcw size={17} />Refresh</RoleButton>}
    >
      {loading ? (
        <RolePanel className="grid min-h-[50vh] place-items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-300/20 border-t-cyan-300" />
        </RolePanel>
      ) : (
        <motion.div className="grid min-w-0 gap-6" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <RoleHero
            eyebrow="AI Resume Analysis"
            title="Smart Resume Analyzer for placement readiness."
            subtitle="A dark ATS review workspace for checking resume links, scoring student profiles, adding recruiter-ready feedback, and tracking placement status."
            chips={["ATS Scoring", "Resume Feedback", "Keyword Gaps", "Placement Pipeline"]}
          >
            <div className="grid min-w-[240px] gap-3 rounded-3xl border border-cyan-300/25 bg-cyan-300/10 p-5">
              <strong className="text-4xl font-black text-white">{average}%</strong>
              <span className="text-sm font-bold text-cyan-100">Average ATS Score</span>
            </div>
          </RoleHero>

          {notice && <RoleNotice>{notice}</RoleNotice>}
          {error && <RoleNotice type="error">{error}</RoleNotice>}

          <motion.section id="placement" className="grid min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]" variants={roleFadeUp}>
            <RoleMetricCard icon={FileText} label="Resumes Uploaded" value={rows.filter((row) => row.resume_url).length} />
            <RoleMetricCard icon={BarChart3} label="Average ATS" value={`${average}%`} tone="cyan" />
            <RoleMetricCard icon={Sparkles} label="Reviews Completed" value={reviewed} tone="indigo" />
            <RoleMetricCard icon={BriefcaseBusiness} label="Pipeline Active" value={pipeline} tone="slate" />
          </motion.section>

          <motion.section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" variants={roleFadeUp}>
            <RolePanel>
              <RoleSectionTitle eyebrow="ATS Result Sections" title="Review quality checklist." />
              <div className="mt-6 grid gap-3">
                <ReviewSignal icon={SearchCheck} title="Relevant Keywords Found" copy="Technical skills, project names, tools, domain keywords, and LYTIX credentials." />
                <ReviewSignal icon={Target} title="Missing Keywords" copy="Role-specific tools, measurable impact, deployment terms, and target job language." />
                <ReviewSignal icon={Sparkles} title="Improvement Suggestions" copy="Add stronger project proof, public links, quantified bullets, and verified certificate URLs." />
                <ReviewSignal icon={BarChart3} title="Overall Resume Strength" copy="Use ATS score plus feedback quality to decide placement readiness." />
              </div>
            </RolePanel>

            <RolePanel>
              <RoleSectionTitle eyebrow="Student Resume Profiles" title="ATS review queue." />
              <div className="mt-6 grid gap-4">
                {rows.length === 0 && <RoleEmpty message="No student resumes are available for review yet." />}
                {rows.map((row) => {
                  const draft = drafts[row.student_id] || {};
                  return (
                    <motion.div
                      className="rounded-[1.45rem] border border-cyan-300/25 bg-slate-950/75 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.2)] backdrop-blur-2xl"
                      key={`${row.student_id}-${row.application_id || "profile"}`}
                      whileHover={{ y: -4, boxShadow: "0 24px 70px rgba(6,182,212,0.16)" }}
                    >
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(300px,1.1fr)]">
                        <div className="min-w-0">
                          <RoleBadge tone={statusTone(draft.placement_status)}>{draft.placement_status || "Not Started"}</RoleBadge>
                          <h3 className="mt-3 truncate text-xl font-black text-white">{row.student_name}</h3>
                          <p className="mt-1 text-sm font-bold text-slate-400">{row.domain_name || "No application"} | {row.email}</p>
                          <div className="mt-4 grid gap-2">
                            {row.resume_url ? <a className="text-sm font-black text-cyan-100 hover:text-white" href={row.resume_url} target="_blank" rel="noreferrer">Open resume</a> : <span className="text-sm font-bold text-slate-500">Resume link not submitted</span>}
                            {row.github_url ? <a className="text-sm font-black text-cyan-100 hover:text-white" href={row.github_url} target="_blank" rel="noreferrer">Open GitHub profile</a> : <span className="text-sm font-bold text-slate-500">GitHub link not submitted</span>}
                          </div>
                        </div>
                        <div className="grid gap-3">
                          <RoleField type="number" min="0" max="100" value={draft.ats_score ?? 0} onChange={(event) => setDrafts({ ...drafts, [row.student_id]: { ...draft, ats_score: event.target.value } })} />
                          <RoleField as="select" value={draft.placement_status || "Not Started"} onChange={(event) => setDrafts({ ...drafts, [row.student_id]: { ...draft, placement_status: event.target.value } })}>
                            {statuses.map((status) => <option key={status}>{status}</option>)}
                          </RoleField>
                          <RoleField placeholder="Relevant keywords found and resume feedback" value={draft.resume_feedback || ""} onChange={(event) => setDrafts({ ...drafts, [row.student_id]: { ...draft, resume_feedback: event.target.value } })} />
                          <RoleField placeholder="Missing keywords and improvement suggestions" value={draft.improvement_suggestions || ""} onChange={(event) => setDrafts({ ...drafts, [row.student_id]: { ...draft, improvement_suggestions: event.target.value } })} />
                          <RoleButton disabled={busy === row.student_id} onClick={() => save(row.student_id)} type="button">
                            <Save size={17} />
                            {busy === row.student_id ? "Saving..." : "Save ATS Review"}
                          </RoleButton>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </RolePanel>
          </motion.section>
        </motion.div>
      )}
    </RoleDashboardShell>
  );
}

function ReviewSignal({ icon: Icon, title, copy }) {
  return (
    <div className="rounded-2xl border border-cyan-300/20 bg-white/[0.055] p-4">
      <Icon className="text-cyan-200" size={20} />
      <h3 className="mt-3 text-sm font-black text-white">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">{copy}</p>
    </div>
  );
}

function statusTone(status) {
  if (status === "Placed") return "green";
  if (status === "Shortlisted" || status === "Mock Interview Done") return "cyan";
  if (status === "Resume Reviewed") return "blue";
  return "slate";
}
