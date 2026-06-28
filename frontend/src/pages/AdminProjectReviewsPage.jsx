import { BadgeCheck, BarChart3, ClipboardCheck, FolderGit2, RefreshCcw, Save } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import DashboardShell from "../components/DashboardShell.jsx";
import GlassPanel from "../components/GlassPanel.jsx";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const navItems = [
  { label: "Reviews", href: "#reviews", icon: ClipboardCheck },
  { label: "Projects", href: "/admin/projects", icon: FolderGit2 },
  { label: "Dashboard", href: "/admin/dashboard", icon: BarChart3 },
];

export default function AdminProjectReviewsPage() {
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const rows = await api("/projects/submissions", { token });
      setSubmissions(rows);
      const nextDrafts = {};
      rows.forEach((row) => {
        nextDrafts[row.id] = {
          status: row.status,
          marks: row.marks ?? "",
          feedback: row.feedback || "",
        };
      });
      setDrafts(nextDrafts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const metrics = useMemo(() => ({
    total: submissions.length,
    pending: submissions.filter((submission) => submission.status === "submitted").length,
    approved: submissions.filter((submission) => submission.status === "approved").length,
  }), [submissions]);

  async function review(submissionId) {
    setBusy(submissionId);
    setError("");
    setNotice("");
    try {
      const draft = drafts[submissionId];
      await api(`/projects/submissions/${submissionId}/review`, {
        method: "PATCH",
        token,
        body: {
          status: draft.status,
          marks: draft.marks === "" ? null : Number(draft.marks),
          feedback: draft.feedback,
        },
      });
      setNotice("Project review saved.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return (
      <main className="page-shell">
        <section className="section-band">
          <div className="loader-panel">Loading project reviews...</div>
        </section>
      </main>
    );
  }

  return (
    <DashboardShell
      eyebrow="Admin Project Reviews"
      title="Review submissions."
      subtitle="Score and approve student capstone projects."
      navItems={navItems}
      actions={<button className="btn-secondary" onClick={load}><RefreshCcw size={17} />Refresh</button>}
    >
      <div className="dashboard-card-grid">
        <Metric icon={ClipboardCheck} label="Total Submissions" value={metrics.total} />
        <Metric icon={BarChart3} label="Pending Reviews" value={metrics.pending} />
        <Metric icon={BadgeCheck} label="Approved Projects" value={metrics.approved} />
      </div>
      {notice && <div className="success-panel mt-6">{notice}</div>}
      {error && <div className="error-panel mt-6">{error}</div>}

      <GlassPanel id="reviews" className="mt-6">
        <h2 className="panel-title">Project submissions</h2>
        <div className="mt-5 grid gap-3">
          {submissions.length === 0 && <div className="loader-panel">No project submissions yet.</div>}
          {submissions.map((submission) => {
            const draft = drafts[submission.id] || {};
            return (
              <div className="lms-row" key={submission.id}>
                <div>
                  <strong>{submission.student_name}</strong>
                  <span>{submission.project_title} - {submission.domain_name}</span>
                  <a href={submission.github_link} target="_blank" rel="noreferrer">GitHub</a>
                  {submission.documentation_link && <a href={submission.documentation_link} target="_blank" rel="noreferrer">Documentation</a>}
                  {submission.ppt_link && <a href={submission.ppt_link} target="_blank" rel="noreferrer">PPT</a>}
                  {submission.demo_video_link && <a href={submission.demo_video_link} target="_blank" rel="noreferrer">Demo video</a>}
                </div>
                <div className="grid gap-3">
                  <select className="field-input" value={draft.status || "submitted"} onChange={(event) => setDrafts({ ...drafts, [submission.id]: { ...draft, status: event.target.value } })}>
                    <option>submitted</option>
                    <option>reviewed</option>
                    <option>approved</option>
                    <option>needs improvement</option>
                  </select>
                  <input className="field-input" type="number" min="0" max={submission.max_marks || 100} placeholder="Marks" value={draft.marks ?? ""} onChange={(event) => setDrafts({ ...drafts, [submission.id]: { ...draft, marks: event.target.value } })} />
                  <input className="field-input" placeholder="Feedback" value={draft.feedback || ""} onChange={(event) => setDrafts({ ...drafts, [submission.id]: { ...draft, feedback: event.target.value } })} />
                  <button className="btn-primary justify-center" disabled={busy === submission.id} onClick={() => review(submission.id)}>
                    <Save size={17} />
                    Save review
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </GlassPanel>
    </DashboardShell>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="stat-card">
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
