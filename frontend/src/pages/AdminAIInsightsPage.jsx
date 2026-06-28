import React, { useEffect, useState } from "react";
import {
  BarChart3,
  BrainCircuit,
  Code2,
  FileText,
  FolderGit2,
  LayoutDashboard,
  MessagesSquare,
  RefreshCcw,
  Sparkles,
} from "lucide-react";

import DashboardShell from "../components/DashboardShell.jsx";
import GlassPanel from "../components/GlassPanel.jsx";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "AI Insights", href: "#insights", icon: BrainCircuit },
  { label: "Domains", href: "#domains", icon: Sparkles },
  { label: "Missing Skills", href: "#skills", icon: BarChart3 },
];

export default function AdminAIInsightsPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const insights = await api("/admin/ai/insights", { token });
      setData(insights);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <main className="page-shell">
        <section className="section-band">
          <div className="loader-panel">Loading AI insights...</div>
          {error && <div className="error-panel mt-4">{error}</div>}
        </section>
      </main>
    );
  }

  const totals = data?.totals || {};

  return (
    <DashboardShell
      eyebrow="Admin AI Insights"
      title="Smart career analytics."
      subtitle="Local AI history across recommendations, resumes, interviews, projects, and code reviews."
      navItems={navItems}
      actions={<button className="btn-secondary" onClick={load}><RefreshCcw size={17} />Refresh</button>}
    >
      {error && <div className="error-panel mt-6">{error}</div>}
      <div id="insights" className="dashboard-card-grid">
        <Metric icon={Sparkles} label="Recommendations" value={totals.recommendations || 0} />
        <Metric icon={FileText} label="Resume Analyses" value={totals.resume_analyses || 0} />
        <Metric icon={BarChart3} label="Average ATS" value={`${data?.average_ats_score || 0}%`} />
        <Metric icon={MessagesSquare} label="Interview Avg" value={`${data?.interview_average_score || 0}%`} />
        <Metric icon={FolderGit2} label="Project Review Avg" value={`${data?.project_review_average_score || 0}%`} />
        <Metric icon={Code2} label="Code Analyses" value={totals.code_analyses || 0} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <GlassPanel id="domains">
          <h2 className="panel-title">Most recommended domains</h2>
          <div className="mt-5 grid gap-3">
            {(data?.most_recommended_domains || []).length === 0 && (
              <div className="loader-panel">No recommendation history yet.</div>
            )}
            {(data?.most_recommended_domains || []).map((domain) => (
              <div className="analytics-row" key={domain.recommended_domain}>
                <span>{domain.recommended_domain}</span>
                <strong>{domain.count} | {domain.average_match}%</strong>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel id="skills">
          <h2 className="panel-title">Common missing skills</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {(data?.common_missing_skills || []).length === 0 && (
              <div className="loader-panel w-full">No resume analysis gaps yet.</div>
            )}
            {(data?.common_missing_skills || []).map((item) => (
              <span className="skill-chip" key={item.skill}>
                {item.skill} ({item.count})
              </span>
            ))}
          </div>
        </GlassPanel>
      </div>

      <GlassPanel className="mt-6">
        <h2 className="panel-title">AI operations summary</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Summary label="Interview attempts" value={totals.interview_attempts || 0} />
          <Summary label="Project reviews" value={totals.project_reviews || 0} />
          <Summary label="Resume analyses" value={totals.resume_analyses || 0} />
          <Summary label="Code analyses" value={totals.code_analyses || 0} />
          <Summary label="Recommendation runs" value={totals.recommendations || 0} />
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

function Summary({ label, value }) {
  return (
    <div className="info-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
