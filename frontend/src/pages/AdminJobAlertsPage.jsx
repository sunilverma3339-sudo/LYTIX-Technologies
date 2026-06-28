import React, { useEffect, useState } from "react";
import { BellRing, BriefcaseBusiness, LayoutDashboard, RefreshCcw, Save } from "lucide-react";

import DashboardShell from "../components/DashboardShell.jsx";
import GlassPanel from "../components/GlassPanel.jsx";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Job Alerts", href: "#alerts", icon: BellRing },
];

export default function AdminJobAlertsPage() {
  const { token } = useAuth();
  const [domains, setDomains] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState({
    domain_id: "",
    company_name: "",
    role: "",
    location: "",
    job_type: "Internship",
    skills_required: "",
    apply_link: "",
    deadline: "",
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [domainRows, alertRows] = await Promise.all([
        api("/domains", { token }),
        api("/admin/job-alerts", { token }),
      ]);
      setDomains(domainRows);
      setAlerts(alertRows);
      setForm((current) => ({ ...current, domain_id: current.domain_id || String(domainRows[0]?.id || "") }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api("/admin/job-alerts", { method: "POST", token, body: { ...form, domain_id: Number(form.domain_id) } });
      setNotice("Job alert created.");
      setForm({ ...form, company_name: "", role: "", location: "", skills_required: "", apply_link: "", deadline: "" });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <main className="page-shell"><section className="section-band"><div className="loader-panel">Loading job alert management...</div></section></main>;
  }

  return (
    <DashboardShell
      eyebrow="Admin Job Alerts"
      title="Opportunity broadcasts."
      subtitle="Create domain-matched job alerts for students."
      navItems={navItems}
      actions={<button className="btn-secondary" onClick={load}><RefreshCcw size={17} />Refresh</button>}
    >
      <div className="dashboard-card-grid">
        <StatCard icon={BellRing} label="Total Job Alerts" value={alerts.length} />
        <StatCard icon={BriefcaseBusiness} label="Domains" value={domains.length} />
      </div>
      {notice && <div className="success-panel mt-6">{notice}</div>}
      {error && <div className="error-panel mt-6">{error}</div>}
      <GlassPanel className="mt-6">
        <h2 className="panel-title">Create job alert</h2>
        <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={submit}>
          <select className="field-input" value={form.domain_id} onChange={(event) => setForm({ ...form, domain_id: event.target.value })}>
            {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}
          </select>
          <input className="field-input" placeholder="Company name" value={form.company_name} onChange={(event) => setForm({ ...form, company_name: event.target.value })} required />
          <input className="field-input" placeholder="Role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} required />
          <input className="field-input" placeholder="Location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
          <input className="field-input" placeholder="Job type" value={form.job_type} onChange={(event) => setForm({ ...form, job_type: event.target.value })} />
          <input className="field-input" placeholder="Skills required" value={form.skills_required} onChange={(event) => setForm({ ...form, skills_required: event.target.value })} />
          <input className="field-input" placeholder="Apply link" value={form.apply_link} onChange={(event) => setForm({ ...form, apply_link: event.target.value })} />
          <input className="field-input" type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
          <button className="btn-primary justify-center md:col-span-2" disabled={busy}>
            <Save size={17} />
            Create alert
          </button>
        </form>
      </GlassPanel>
      <GlassPanel id="alerts" className="mt-6">
        <h2 className="panel-title">All job alerts</h2>
        <div className="mt-5 grid gap-3">
          {alerts.length === 0 && <div className="loader-panel">No job alerts created yet.</div>}
          {alerts.map((alert) => (
            <div className="document-row" key={alert.id}>
              <div>
                <strong>{alert.company_name} - {alert.role}</strong>
                <span>{alert.domain_name} | {alert.location} | {alert.job_type}</span>
              </div>
              <span className="pill">{alert.deadline || "Open"}</span>
            </div>
          ))}
        </div>
      </GlassPanel>
    </DashboardShell>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return <div className="stat-card"><Icon size={22} /><span>{label}</span><strong>{value}</strong></div>;
}
