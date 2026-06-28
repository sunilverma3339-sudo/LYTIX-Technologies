import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  DarkButton,
  DarkPanel,
  EmptyDark,
  MetricCard,
  Notice,
  PageHero,
  ProjectSignal,
  SectionTitle,
  StudentDashboardShell,
  TextStatCard,
  fadeUp,
} from "../components/StudentDashboardShell.jsx";
import { api, downloadFile } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

export default function StudentDocumentsPage() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const dashboardData = await api("/students/dashboard", { token });
      setDashboard(dashboardData);
      if (dashboardData.application) {
        const [eligibilityData, documentRows] = await Promise.all([
          api("/documents/eligibility/me", { token }),
          api("/documents/me", { token }),
        ]);
        setEligibility(eligibilityData);
        setDocuments(documentRows);
      } else {
        setEligibility(null);
        setDocuments([]);
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

  const application = dashboard?.application;
  const documentMap = useMemo(() => {
    return documents.reduce((acc, document) => {
      acc[document.document_type] = document;
      return acc;
    }, {});
  }, [documents]);

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

  async function generateDocument(card) {
    await run(
      card.type,
      () =>
        downloadFile(card.generatePath, `${card.fileName}.pdf`, {
          method: "POST",
          token,
        }),
      `${card.title} downloaded.`
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

  if (loading) {
    return (
      <StudentDashboardShell title="Document Wallet" badge="Credentials">
        <DarkPanel className="grid min-h-[50vh] place-items-center text-center">
          <div>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-300/20 border-t-cyan-300" />
            <h1 className="mt-6 text-2xl font-black">Loading student documents...</h1>
            {error && <Notice type="error">{error}</Notice>}
          </div>
        </DarkPanel>
      </StudentDashboardShell>
    );
  }

  const cards = application ? buildDocumentCards(application, eligibility, documentMap) : [];

  return (
    <StudentDashboardShell title="Document Wallet" badge="Verified Documents">
      <motion.div className="grid gap-6" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.07 } } }}>
        <PageHero
          eyebrow="Student Documents"
          title="Document wallet and credential eligibility."
          subtitle={application ? `${application.domain.name} - ${dashboard.student.email}` : dashboard?.student.email}
          actions={
            <DarkButton variant="secondary" onClick={load}>
              <RefreshCcw size={17} />
              Refresh
            </DarkButton>
          }
        />

        {!application ? (
          <DarkPanel>
            <SectionTitle eyebrow="No active application" title="Submit an internship application first." copy="Documents unlock after an internship workflow is created." />
            <Link to="/internships" className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20">
              Browse Programs
            </Link>
          </DarkPanel>
        ) : (
          <>
            <motion.section id="eligibility" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" variants={fadeUp}>
              <TextStatCard icon={BadgeCheck} label="Certificate Eligible" value={eligibility?.certificate_eligible ? "Yes" : "No"} footer="Rule based" />
              <MetricCard icon={CalendarCheck} label="Attendance" value={eligibility?.attendance_percentage || 0} suffix="%" tone="cyan" />
              <MetricCard icon={ClipboardCheck} label="Assignments" value={eligibility?.assignment_completion || 0} suffix="%" tone="blue" />
              <TextStatCard icon={ShieldCheck} label="LOR Eligible" value={eligibility?.lor_eligible ? "Yes" : "No"} />
            </motion.section>

            {(notice || error) && <Notice type={error ? "error" : "success"}>{notice || error}</Notice>}

            <DarkPanel>
              <SectionTitle eyebrow="Eligibility Rules" title="Certificate and LOR requirements." copy="The backend still checks these rules before generating official documents." />
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <RuleRow label="Payment completed" done={eligibility?.payment_completed} />
                <RuleRow label={`Attendance minimum 70% (${eligibility?.attendance_percentage || 0}%)`} done={eligibility?.attendance_minimum_met} />
                <RuleRow label={`Assignments completed (${eligibility?.assignment_completion || 0}%)`} done={eligibility?.assignments_completed} />
                <RuleRow label="Final project approved" done={eligibility?.project_approved} />
                <RuleRow label="LinkedIn checklist completed" done={eligibility?.linkedin_completed} />
                <RuleRow label={`LOR top performer (${eligibility?.project_marks ?? "pending"} project marks)`} done={eligibility?.lor_eligible} />
              </div>
            </DarkPanel>

            <DarkPanel id="issued">
              <SectionTitle eyebrow="Issued Documents" title="Documents already generated." />
              <div className="mt-6 grid gap-3">
                {documents.length === 0 && <EmptyDark message="No documents have been issued yet." />}
                {documents.map((document) => (
                  <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.055] p-4 md:flex-row md:items-center md:justify-between" key={document.id}>
                    <div>
                      <strong className="block text-lg text-white">{document.type_label}</strong>
                      <span className="mt-1 block text-sm text-slate-400">{document.verification_id} - {document.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <DarkButton variant="secondary" disabled={busy === `download-${document.verification_id}` || document.status === "Revoked"} onClick={() => downloadIssued(document)}>
                        <Download size={16} />
                        Download
                      </DarkButton>
                      <Link to={`/verify/${document.verification_id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100">
                        <ExternalLink size={16} />
                        Verify
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </DarkPanel>

            <div className="grid gap-5 lg:grid-cols-2">
              {cards.map((card) => (
                <DocumentCard
                  key={card.type}
                  card={card}
                  busy={busy === card.type}
                  onGenerate={() => generateDocument(card)}
                  onDownload={() => downloadIssued(card.document)}
                />
              ))}
            </div>
          </>
        )}
      </motion.div>
    </StudentDashboardShell>
  );
}

function buildDocumentCards(application, eligibility, documentMap) {
  const appId = application.id;
  return [
    {
      id: "offer",
      type: "offer_letter",
      title: "Offer Letter",
      description: "Issued after successful payment confirmation.",
      eligible: eligibility?.payment_completed,
      blocker: "Complete payment to unlock the offer letter.",
      generatePath: `/documents/offer-letter/${appId}`,
      fileName: "lytix-offer-letter",
      document: documentMap.offer_letter,
      icon: BriefcaseBusiness,
    },
    {
      id: "certificate",
      type: "certificate",
      title: "Completion Certificate",
      description: "Advanced certificate with QR verification and internship identity.",
      eligible: eligibility?.certificate_eligible,
      blocker: "Complete attendance, assignments, final project approval, payment, and LinkedIn checklist.",
      generatePath: `/documents/certificate/${appId}`,
      fileName: "lytix-certificate",
      document: documentMap.certificate,
      icon: BadgeCheck,
    },
    {
      id: "experience",
      type: "experience_letter",
      title: "Experience Letter",
      description: "Official internship experience letter with work summary and rating.",
      eligible: eligibility?.certificate_eligible,
      blocker: "Experience letter unlocks after certificate eligibility is complete.",
      generatePath: `/documents/experience-letter/${appId}`,
      fileName: "lytix-experience-letter",
      document: documentMap.experience_letter,
      icon: FileText,
    },
    {
      id: "lor",
      type: "lor",
      title: "Letter of Recommendation",
      description: "Available only for top performers with high attendance, marks, and assignment completion.",
      eligible: eligibility?.lor_eligible,
      blocker: "LOR requires attendance above 85%, project marks above 80%, and assignments above 90%.",
      generatePath: `/documents/lor/${appId}`,
      fileName: "lytix-lor",
      document: documentMap.lor,
      icon: Award,
    },
  ];
}

function DocumentCard({ card, busy, onGenerate, onDownload }) {
  const Icon = card.icon || (card.eligible ? BadgeCheck : FileCheck2);
  return (
    <DarkPanel id={card.id}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">{card.document ? card.document.status : card.eligible ? "Ready" : "Locked"}</p>
          <h2 className="mt-2 text-2xl font-black text-white">{card.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{card.description}</p>
        </div>
        <Icon className={card.eligible ? "text-cyan-200" : "text-slate-500"} size={30} />
      </div>
      {card.document && (
        <div className="mt-5">
          <ProjectSignal icon={ShieldCheck} label="Verification ID" value={card.document.verification_id} />
        </div>
      )}
      {!card.eligible && <div className="mt-5"><Notice type="error">{card.blocker}</Notice></div>}
      <div className="mt-5 flex flex-wrap gap-3">
        <DarkButton disabled={!card.eligible || busy} onClick={onGenerate}>
          <Download size={17} />
          {busy ? "Preparing..." : card.document ? "Regenerate PDF" : "Generate PDF"}
        </DarkButton>
        {card.document && (
          <>
            <DarkButton variant="secondary" disabled={busy || card.document.status === "Revoked"} onClick={onDownload}>
              <Download size={17} />
              Download issued
            </DarkButton>
            <Link to={`/verify/${card.document.verification_id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15">
              <ExternalLink size={17} />
              Verify
            </Link>
          </>
        )}
      </div>
    </DarkPanel>
  );
}

function RuleRow({ label, done }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3">
      <span className="text-sm font-bold text-slate-200">{label}</span>
      {done ? <BadgeCheck size={18} className="text-cyan-200" /> : <FileCheck2 size={18} className="text-slate-500" />}
    </div>
  );
}
