import React, { useEffect, useState } from "react";
import { LayoutDashboard, MailCheck, RefreshCcw, SendHorizonal } from "lucide-react";

import DashboardShell from "../components/DashboardShell.jsx";
import GlassPanel from "../components/GlassPanel.jsx";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const navItems = [
  { label: "Admin", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Email Logs", href: "#logs", icon: MailCheck },
  { label: "Create Log", href: "#create", icon: SendHorizonal },
];

const emailTypes = [
  ["registration_confirmation", "Registration Confirmation"],
  ["account_verification", "Account Verification"],
  ["selection_notification", "Selection Notification"],
  ["rejection_notification", "Rejection Notification"],
  ["payment_confirmation", "Payment Confirmation"],
  ["internship_activation", "Internship Activation"],
  ["offer_letter_delivery", "Offer Letter Delivery"],
  ["assignment_notification", "Assignment Notification"],
  ["project_submission_confirmation", "Project Submission Confirmation"],
  ["certificate_delivery", "Certificate Delivery"],
  ["experience_letter_delivery", "Experience Letter Delivery"],
  ["new_application_alert", "New Application Alert"],
  ["new_payment_alert", "New Payment Alert"],
  ["certificate_request", "Certificate Request"],
  ["support_ticket_notification", "Support Ticket Notification"],
  ["candidate_shortlisting", "Candidate Shortlisting"],
  ["interview_request", "Interview Request"],
  ["hiring_update", "Hiring Update"],
  ["job_alert", "Job Alert"],
];

export default function EmailLogsPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ email_type: "registration_confirmation", recipient_email: "", subject: "", status: "Queued", metadata: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const rows = await api("/email-logs", { token });
      setLogs(rows);
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
      await api("/email-logs", { method: "POST", token, body: form });
      setNotice("Email log created.");
      setForm({ email_type: "registration_confirmation", recipient_email: "", subject: "", status: "Queued", metadata: "" });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <main className="page-shell"><section className="section-band"><div className="loader-panel">Loading email logs...</div></section></main>;
  }

  return (
    <DashboardShell
      eyebrow="Email Automation"
      title="Placeholder email log system."
      subtitle="Registration, selection, payment, offer letter, certificate, and job alert email events are stored locally."
      navItems={navItems}
      actions={<button className="btn-secondary" onClick={load}><RefreshCcw size={17} />Refresh</button>}
    >
      {notice && <div className="success-panel mt-6">{notice}</div>}
      {error && <div className="error-panel mt-6">{error}</div>}
      <GlassPanel id="create" className="mt-6">
        <h2 className="panel-title">Create email log</h2>
        <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={submit}>
          <select className="field-input" value={form.email_type} onChange={(event) => setForm({ ...form, email_type: event.target.value })}>
            {emailTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
          <input className="field-input" type="email" placeholder="Recipient email" value={form.recipient_email} onChange={(event) => setForm({ ...form, recipient_email: event.target.value })} required />
          <input className="field-input" placeholder="Subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} required />
          <select className="field-input" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option>Queued</option>
            <option>Sent</option>
            <option>Failed</option>
          </select>
          <textarea className="field-input min-h-24 md:col-span-2" placeholder="Metadata JSON placeholder" value={form.metadata} onChange={(event) => setForm({ ...form, metadata: event.target.value })} />
          <button className="btn-primary justify-center md:col-span-2" disabled={busy}><SendHorizonal size={17} />Log email</button>
        </form>
      </GlassPanel>
      <GlassPanel id="logs" className="mt-6">
        <h2 className="panel-title">Email logs</h2>
        <div className="mt-5 grid gap-3">
          {logs.length === 0 && <div className="loader-panel">No email logs yet.</div>}
          {logs.map((log) => (
            <div className="document-row" key={log.id}>
              <div>
                <strong>{log.subject}</strong>
                <span>{log.email_type} | {log.recipient_email}</span>
              </div>
              <span className="pill">{log.status}</span>
            </div>
          ))}
        </div>
      </GlassPanel>
    </DashboardShell>
  );
}
