import {
  BadgeCheck,
  BarChart3,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileCheck2,
  LayoutDashboard,
  RefreshCcw,
  Save,
  ShieldCheck,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import DashboardShell from "../components/DashboardShell.jsx";
import GlassPanel from "../components/GlassPanel.jsx";
import { api, downloadFile } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Eligible Students", href: "#eligible", icon: BadgeCheck },
  { label: "Issued Documents", href: "#issued", icon: FileCheck2 },
  { label: "Revoked", href: "#revoked", icon: ShieldCheck },
];

const documentActions = [
  {
    type: "certificate",
    label: "Certificate",
    path: (applicationId) => `/documents/certificate/${applicationId}`,
    eligible: (eligibility) => eligibility?.certificate_eligible,
  },
  {
    type: "experience_letter",
    label: "Experience Letter",
    path: (applicationId) => `/documents/experience-letter/${applicationId}`,
    eligible: (eligibility) => eligibility?.certificate_eligible,
  },
  {
    type: "lor",
    label: "LOR",
    path: (applicationId) => `/documents/lor/${applicationId}`,
    eligible: (eligibility) => eligibility?.lor_eligible,
  },
];

export default function AdminDocumentsPage() {
  const { token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [revokeDrafts, setRevokeDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [dashboard, issuedDocuments] = await Promise.all([
        api("/admin/dashboard", { token }),
        api("/documents", { token }),
      ]);
      const eligibilityRows = await Promise.all(
        dashboard.applications.map((application) =>
          api(`/documents/eligibility/${application.id}`, { token })
            .then((eligibility) => ({ id: application.id, eligibility }))
            .catch((err) => ({ id: application.id, error: err.message }))
        )
      );
      const eligibilityByApplication = eligibilityRows.reduce((acc, row) => {
        acc[row.id] = row.eligibility || { error: row.error };
        return acc;
      }, {});
      setApplications(
        dashboard.applications.map((application) => ({
          ...application,
          eligibility: eligibilityByApplication[application.id],
        }))
      );
      setDocuments(issuedDocuments);
      const nextDrafts = {};
      issuedDocuments.forEach((document) => {
        nextDrafts[document.verification_id] = document.revoked_reason || "";
      });
      setRevokeDrafts(nextDrafts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const metrics = useMemo(() => {
    const certificateEligible = applications.filter((item) => item.eligibility?.certificate_eligible).length;
    const lorEligible = applications.filter((item) => item.eligibility?.lor_eligible).length;
    const revoked = documents.filter((document) => document.status === "Revoked").length;
    return {
      certificateEligible,
      lorEligible,
      issued: documents.length,
      revoked,
    };
  }, [applications, documents]);

  async function run(label, action, successMessage) {
    setBusy(label);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(successMessage);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function generateDocument(application, action) {
    await run(
      `${action.type}-${application.id}`,
      () =>
        downloadFile(action.path(application.id), `${application.internship_id}-${action.type}.pdf`, {
          method: "POST",
          token,
        }),
      `${action.label} generated for ${application.student.name}.`
    );
  }

  async function downloadIssued(document) {
    await run(
      `download-${document.verification_id}`,
      () =>
        downloadFile(`/documents/${document.verification_id}/download`, `${document.verification_id}.pdf`, {
          token,
        }),
      `${document.type_label || "Document"} downloaded.`
    );
  }

  async function revokeDocument(document) {
    await run(
      `revoke-${document.verification_id}`,
      () =>
        api(`/documents/${document.verification_id}/revoke`, {
          method: "PATCH",
          token,
          body: { reason: revokeDrafts[document.verification_id] || "Revoked by admin" },
        }),
      `${document.type_label || "Document"} revoked.`
    );
  }

  if (loading) {
    return (
      <main className="page-shell">
        <section className="section-band">
          <div className="loader-panel">Loading document management...</div>
          {error && <div className="error-panel mt-4">{error}</div>}
        </section>
      </main>
    );
  }

  const revokedDocuments = documents.filter((document) => document.status === "Revoked");

  return (
    <DashboardShell
      eyebrow="Admin Documents"
      title="Document management."
      subtitle="Check eligibility, issue PDFs, download credentials, and revoke documents when needed."
      navItems={navItems}
      actions={
        <button className="btn-secondary" onClick={load}>
          <RefreshCcw size={17} />
          Refresh
        </button>
      }
    >
      <div className="dashboard-card-grid">
        <Metric icon={BadgeCheck} label="Certificate Eligible" value={metrics.certificateEligible} />
        <Metric icon={BarChart3} label="LOR Eligible" value={metrics.lorEligible} />
        <Metric icon={FileCheck2} label="Issued Documents" value={metrics.issued} />
        <Metric icon={ShieldCheck} label="Revoked" value={metrics.revoked} />
      </div>

      {notice && <div className="success-panel mt-6">{notice}</div>}
      {error && <div className="error-panel mt-6">{error}</div>}

      <GlassPanel id="eligible" className="mt-6">
        <h2 className="panel-title">Eligible students</h2>
        <p className="card-copy mt-2">Each row uses backend eligibility rules, including payment, attendance, assignments, project approval, and LinkedIn completion.</p>
        <div className="mt-5 grid gap-3">
          {applications.length === 0 && <div className="loader-panel">No applications are available.</div>}
          {applications.map((application) => (
            <div className="lms-row" key={application.id}>
              <div>
                <strong>{application.student.name}</strong>
                <span>{application.domain.name} - {application.internship_id}</span>
                <small>
                  Attendance {application.eligibility?.attendance_percentage || 0}%,
                  assignments {application.eligibility?.assignment_completion || 0}%,
                  project marks {application.eligibility?.project_marks ?? "pending"}
                </small>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusPill label="Paid" done={application.eligibility?.payment_completed} />
                  <StatusPill label="Attendance" done={application.eligibility?.attendance_minimum_met} />
                  <StatusPill label="Assignments" done={application.eligibility?.assignments_completed} />
                  <StatusPill label="Project" done={application.eligibility?.project_approved} />
                  <StatusPill label="LinkedIn" done={application.eligibility?.linkedin_completed} />
                </div>
              </div>
              <div className="grid gap-3">
                {documentActions.map((action) => (
                  <button
                    className="btn-secondary justify-center"
                    key={action.type}
                    disabled={!action.eligible(application.eligibility) || busy === `${action.type}-${application.id}`}
                    onClick={() => generateDocument(application, action)}
                  >
                    <Download size={17} />
                    {busy === `${action.type}-${application.id}` ? "Preparing..." : `Generate ${action.label}`}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      <GlassPanel id="issued" className="mt-6">
        <h2 className="panel-title">Issued documents</h2>
        <div className="mt-5 grid gap-3">
          {documents.length === 0 && <div className="loader-panel">No documents have been issued yet.</div>}
          {documents.map((document) => (
            <div className="lms-row" key={document.id}>
              <div>
                <strong>{document.student_name || "Student"} - {document.type_label}</strong>
                <span>{document.domain_name} - {document.verification_id}</span>
                <small>Status: {document.status} | Issued: {document.issue_date || "N/A"}</small>
                {document.revoked_reason && <small>Revoked reason: {document.revoked_reason}</small>}
              </div>
              <div className="grid gap-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn-secondary"
                    disabled={document.status === "Revoked" || busy === `download-${document.verification_id}`}
                    onClick={() => downloadIssued(document)}
                  >
                    <Download size={17} />
                    Download
                  </button>
                  <Link to={`/verify/${document.verification_id}`} className="btn-secondary">
                    <ExternalLink size={17} />
                    Verify
                  </Link>
                </div>
                <form
                  className="lms-submit-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    revokeDocument(document);
                  }}
                >
                  <input
                    className="field-input"
                    disabled={document.status === "Revoked"}
                    placeholder="Revocation reason"
                    value={revokeDrafts[document.verification_id] || ""}
                    onChange={(event) =>
                      setRevokeDrafts({
                        ...revokeDrafts,
                        [document.verification_id]: event.target.value,
                      })
                    }
                  />
                  <button
                    className="btn-secondary justify-center"
                    disabled={document.status === "Revoked" || busy === `revoke-${document.verification_id}`}
                  >
                    <Save size={17} />
                    Revoke
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      <GlassPanel id="revoked" className="mt-6">
        <h2 className="panel-title">Revoked documents</h2>
        <div className="mt-5 grid gap-3">
          {revokedDocuments.length === 0 && <div className="loader-panel">No revoked documents.</div>}
          {revokedDocuments.map((document) => (
            <div className="analytics-row" key={document.id}>
              <span>{document.verification_id}</span>
              <strong>{document.revoked_reason || "Revoked"}</strong>
            </div>
          ))}
        </div>
      </GlassPanel>
    </DashboardShell>
  );
}

function StatusPill({ label, done }) {
  return <span className={done ? "skill-chip" : "pill"}>{label}</span>;
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
