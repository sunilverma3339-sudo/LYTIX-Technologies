import React, { useEffect, useState } from "react";
import { BellRing, BriefcaseBusiness, ExternalLink, LayoutDashboard, RefreshCcw } from "lucide-react";

import DashboardShell from "../components/DashboardShell.jsx";
import GlassPanel from "../components/GlassPanel.jsx";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const navItems = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Alerts", href: "#alerts", icon: BellRing },
];

export default function StudentJobAlertsPage() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [dashboardData, jobAlerts] = await Promise.all([
        api("/students/dashboard", { token }),
        api("/job-alerts/me", { token }),
      ]);
      setDashboard(dashboardData);
      setAlerts(jobAlerts);
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
          <div className="loader-panel">Loading job alerts...</div>
          {error && <div className="error-panel mt-4">{error}</div>}
        </section>
      </main>
    );
  }

  return (
    <DashboardShell
      eyebrow="Job Alerts"
      title="Domain-matched opportunities."
      subtitle={dashboard?.application ? dashboard.application.domain.name : "Placement cell alerts"}
      navItems={navItems}
      actions={<button className="btn-secondary" onClick={load}><RefreshCcw size={17} />Refresh</button>}
    >
      <div className="dashboard-card-grid">
        <StatCard icon={BellRing} label="Alerts" value={alerts.length} />
        <StatCard icon={BriefcaseBusiness} label="Domain" value={dashboard?.application?.domain?.name || "N/A"} />
      </div>
      {error && <div className="error-panel mt-6">{error}</div>}
      <GlassPanel id="alerts" className="mt-6">
        <h2 className="panel-title">Open job alerts</h2>
        <div className="mt-5 grid gap-3">
          {alerts.length === 0 && <div className="loader-panel">No job alerts are available for your domain yet.</div>}
          {alerts.map((alert) => (
            <div className="lms-row" key={alert.id}>
              <div>
                <strong>{alert.company_name}</strong>
                <span>{alert.role} - {alert.location}</span>
                <small>{alert.job_type} | Skills: {alert.skills_required || "Not specified"}</small>
                <small>Deadline: {alert.deadline || "Open"}</small>
              </div>
              <div className="lms-row-actions">
                {alert.apply_link && (
                  <a className="btn-secondary" href={alert.apply_link} target="_blank" rel="noreferrer">
                    <ExternalLink size={17} />
                    Apply
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </DashboardShell>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="stat-card">
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
