import { BarChart3, FolderGit2, RefreshCcw, Save, SendHorizonal } from "lucide-react";
import React, { useEffect, useState } from "react";

import DashboardShell from "../components/DashboardShell.jsx";
import GlassPanel from "../components/GlassPanel.jsx";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const today = new Date().toISOString().slice(0, 10);

const navItems = [
  { label: "Projects", href: "#projects", icon: FolderGit2 },
  { label: "Reviews", href: "/admin/project-reviews", icon: SendHorizonal },
  { label: "Dashboard", href: "/admin/dashboard", icon: BarChart3 },
];

export default function AdminProjectsPage() {
  const { token } = useAuth();
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    domain_id: "",
    difficulty: "beginner",
    deadline: today,
    requirements: "",
    max_marks: 100,
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const domainList = await api("/domains", { token });
      const domainId = selectedDomain || String(domainList[0]?.id || "");
      setDomains(domainList);
      setSelectedDomain(domainId);
      setForm((current) => ({ ...current, domain_id: domainId }));
      if (domainId) {
        setProjects(await api(`/projects/domain/${domainId}`, { token }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function changeDomain(domainId) {
    setSelectedDomain(domainId);
    setForm((current) => ({ ...current, domain_id: domainId }));
    try {
      setProjects(await api(`/projects/domain/${domainId}`, { token }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api("/projects", {
        method: "POST",
        token,
        body: { ...form, domain_id: Number(form.domain_id), max_marks: Number(form.max_marks) },
      });
      setNotice("Project created.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="page-shell">
        <section className="section-band">
          <div className="loader-panel">Loading project management...</div>
        </section>
      </main>
    );
  }

  return (
    <DashboardShell
      eyebrow="Admin Projects"
      title="Project management."
      subtitle="Create domain projects and monitor available capstones."
      navItems={navItems}
      actions={<button className="btn-secondary" onClick={load}><RefreshCcw size={17} />Refresh</button>}
    >
      {notice && <div className="success-panel mt-6">{notice}</div>}
      {error && <div className="error-panel mt-6">{error}</div>}
      <GlassPanel id="projects" className="mt-6">
        <h2 className="panel-title">Create project</h2>
        <form className="mt-5 grid gap-3 lg:grid-cols-6" onSubmit={submit}>
          <select className="field-input" value={selectedDomain} onChange={(event) => changeDomain(event.target.value)}>
            {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}
          </select>
          <input className="field-input lg:col-span-2" placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          <select className="field-input" value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}>
            <option>beginner</option>
            <option>intermediate</option>
            <option>advanced</option>
          </select>
          <input className="field-input" type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
          <input className="field-input" type="number" min="1" value={form.max_marks} onChange={(event) => setForm({ ...form, max_marks: event.target.value })} />
          <input className="field-input lg:col-span-3" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <input className="field-input lg:col-span-2" placeholder="Requirements" value={form.requirements} onChange={(event) => setForm({ ...form, requirements: event.target.value })} />
          <button className="btn-primary justify-center" disabled={busy}><Save size={17} />Create</button>
        </form>
      </GlassPanel>

      <GlassPanel className="mt-6">
        <h2 className="panel-title">Projects</h2>
        <div className="mt-5 grid gap-3">
          {projects.length === 0 && <div className="loader-panel">No projects for this domain.</div>}
          {projects.map((project) => (
            <div className="lms-row" key={project.id}>
              <div>
                <strong>{project.title}</strong>
                <span>{project.description}</span>
                <small>Requirements: {project.requirements}</small>
              </div>
              <div className="lms-row-actions">
                <span className="pill">{project.difficulty}</span>
                <span className="pill">Deadline {project.deadline || "N/A"}</span>
                <span className="pill">{project.max_marks} marks</span>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </DashboardShell>
  );
}
