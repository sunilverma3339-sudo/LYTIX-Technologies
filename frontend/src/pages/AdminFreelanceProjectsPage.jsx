import React, { useEffect, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  Mail,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";

import DashboardShell from "../components/DashboardShell.jsx";
import GlassPanel from "../components/GlassPanel.jsx";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const navItems = [
  { label: "Admin Dashboard", href: "/admin/dashboard", icon: ShieldCheck },
  { label: "Freelance Projects", href: "/admin/freelance-projects", icon: BriefcaseBusiness },
  { label: "Public Hub", href: "/freelance", icon: BadgeCheck },
];

export default function AdminFreelanceProjectsPage() {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function loadProjects() {
    setLoading(true);
    setError("");
    try {
      const rows = await api("/admin/freelance/projects", { token });
      setProjects(rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function run(projectId, action, successMessage) {
    setBusyId(projectId);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(successMessage);
      await loadProjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function approve(projectId) {
    await run(
      projectId,
      () => api(`/admin/freelance/projects/${projectId}/approve`, { method: "PUT", token }),
      "Project approved and visible in the marketplace."
    );
  }

  async function reject(projectId) {
    await run(
      projectId,
      () => api(`/admin/freelance/projects/${projectId}/reject`, { method: "PUT", token }),
      "Project rejected."
    );
  }

  async function remove(projectId) {
    const confirmed = window.confirm("Delete this freelance project?");
    if (!confirmed) return;
    await run(
      projectId,
      () => api(`/admin/freelance/projects/${projectId}`, { method: "DELETE", token }),
      "Project deleted."
    );
  }

  const metrics = {
    total: projects.length,
    pending: projects.filter((project) => project.status === "Pending Approval").length,
    approved: projects.filter((project) => project.status === "Approved").length,
    rejected: projects.filter((project) => project.status === "Rejected").length,
  };

  return (
    <DashboardShell
      eyebrow="Freelance projects"
      title="Review client project submissions."
      subtitle="Approve quality project briefs before they appear in the public LYTIX Freelance Hub marketplace."
      navItems={navItems}
      actions={
        <button className="btn-secondary" onClick={loadProjects}>
          <RefreshCcw size={17} />
          Refresh
        </button>
      }
    >
      <div className="dashboard-card-grid">
        <Metric label="Submitted" value={metrics.total} icon={BriefcaseBusiness} />
        <Metric label="Pending" value={metrics.pending} icon={Clock} />
        <Metric label="Approved" value={metrics.approved} icon={CheckCircle2} />
        <Metric label="Rejected" value={metrics.rejected} icon={XCircle} />
      </div>

      {error && <div className="error-panel mt-6">{error}</div>}
      {notice && <div className="success-panel mt-6">{notice}</div>}
      {loading && <div className="loader-panel mt-6">Loading freelance project submissions...</div>}

      {!loading && projects.length === 0 && (
        <GlassPanel className="mt-6 text-center">
          <BriefcaseBusiness className="mx-auto text-[#2563EB]" size={34} />
          <h2 className="mt-4 text-xl font-black text-[#0F172A]">No submitted freelance projects yet.</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#64748B]">
            Client submissions from the Post a Project page will appear here for review.
          </p>
        </GlassPanel>
      )}

      <div className="mt-6 grid gap-5">
        {projects.map((project) => (
          <GlassPanel key={project.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={statusClass(project.status)}>{project.status}</span>
                  <span className="pill">{project.category}</span>
                  <span className="pill">{project.experience_level}</span>
                </div>
                <h2 className="mt-4 text-2xl font-black text-[#0F172A]">{project.title}</h2>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-[#64748B]">{project.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="icon-text-button"
                  onClick={() => approve(project.id)}
                  disabled={busyId === project.id || project.status === "Approved"}
                >
                  <CheckCircle2 size={16} />
                  Approve
                </button>
                <button
                  className="icon-text-button"
                  onClick={() => reject(project.id)}
                  disabled={busyId === project.id || project.status === "Rejected"}
                >
                  <XCircle size={16} />
                  Reject
                </button>
                <button className="icon-button" onClick={() => remove(project.id)} disabled={busyId === project.id} title="Delete project">
                  <Trash2 size={17} />
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Info label="Budget" value={project.budget} />
              <Info label="Duration" value={project.duration} />
              <Info label="Deadline" value={project.deadline} />
              <Info label="Created" value={formatDate(project.created_at)} />
            </div>

            <div className="mt-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#64748B]">Skills Required</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(project.skills_list || []).map((skill) => (
                  <span className="skill-chip" key={skill}>{skill}</span>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 md:grid-cols-3">
              <ContactItem icon={UserRound} label="Client" value={project.client_name} />
              <ContactItem icon={Mail} label="Email" value={project.client_email} />
              <ContactItem icon={BriefcaseBusiness} label="Company" value={project.company_name || "Independent client"} />
            </div>
          </GlassPanel>
        ))}
      </div>
    </DashboardShell>
  );
}

function Metric({ label, value, icon: Icon }) {
  return (
    <GlassPanel>
      <Icon className="text-[#2563EB]" size={24} />
      <p className="mt-4 text-sm font-bold text-[#64748B]">{label}</p>
      <strong className="mt-1 block text-3xl font-black text-[#0F172A]">{value}</strong>
    </GlassPanel>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
      <span className="block text-xs font-black uppercase tracking-[0.12em] text-[#64748B]">{label}</span>
      <strong className="mt-1 block break-words text-sm text-[#0F172A]">{value || "Not provided"}</strong>
    </div>
  );
}

function ContactItem({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#2563EB]">
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#64748B]">{label}</p>
        <p className="truncate text-sm font-bold text-[#0F172A]">{value || "Not provided"}</p>
      </div>
    </div>
  );
}

function statusClass(status) {
  const base = "inline-flex rounded-full px-3 py-1 text-xs font-black";
  if (status === "Approved") return `${base} bg-emerald-50 text-emerald-700`;
  if (status === "Rejected") return `${base} bg-rose-50 text-rose-700`;
  return `${base} bg-amber-50 text-amber-700`;
}

function formatDate(value) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
