import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  CreditCard,
  FileCheck2,
  FolderGit2,
  LayoutDashboard,
  LifeBuoy,
  MailCheck,
  ListChecks,
  PieChart,
  Save,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

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
  RoleRefreshButton,
  RoleSection,
  RoleSectionTitle,
  roleFadeUp,
} from "../components/RoleDashboardShell.jsx";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const adminNavItems = [
  { label: "Overview", href: "#overview", icon: LayoutDashboard },
  { label: "Students", href: "#students", icon: UsersRound },
  { label: "Applications", href: "#applications", icon: ClipboardCheck },
  { label: "Domains", href: "#domains", icon: BookOpenCheck },
  { label: "Tasks", href: "#tasks", icon: ListChecks },
  { label: "Payments", href: "#payments", icon: CreditCard },
  { label: "Certificates", href: "#certificates", icon: BadgeCheck },
  { label: "Email Automation", href: "/admin/email-logs", icon: MailCheck },
  { label: "Reports", href: "#reports", icon: BarChart3 },
  { label: "Support", href: "/support", icon: LifeBuoy },
];

const fallbackAdmin = {
  metrics: {
    students: 3,
    applications: 3,
    paid: 2,
    certified: 1,
    revenue: 5998,
    total_projects: 10,
    pending_project_reviews: 2,
  },
  domain_enrollments: [
    { domain: "Python Development", enrollments: 1 },
    { domain: "Machine Learning and AI", enrollments: 1 },
    { domain: "Cloud Computing and DevOps", enrollments: 1 },
  ],
  workflow: ["Applied", "Assessment", "Selected", "Payment", "Offer Letter", "Tasks", "Project", "LinkedIn", "Certificate", "Rejected"],
  payment_statuses: ["Pending", "Paid", "Failed"],
  applications: [],
};

const sampleStudents = [
  { id: 1, name: "Aarav Sharma", email: "student@lytix.tech", graduation_year: "2027" },
  { id: 2, name: "Nisha Patel", email: "nisha@lytix.tech", graduation_year: "2026" },
  { id: 3, name: "Karan Mehta", email: "karan@lytix.tech", graduation_year: "2028" },
];

export default function AdminDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [students, setStudents] = useState([]);
  const [domains, setDomains] = useState([]);
  const [taskDraft, setTaskDraft] = useState({ application_id: "", title: "", description: "", due_date: "" });
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [dashboardResult, studentsResult, domainsResult] = await Promise.allSettled([
        api("/admin/dashboard", { token }),
        api("/admin/students", { token }),
        api("/domains", { token }),
      ]);
      const dashboard = dashboardResult.status === "fulfilled" ? dashboardResult.value : fallbackAdmin;
      const studentRows = studentsResult.status === "fulfilled" ? studentsResult.value : sampleStudents;
      const domainRows = domainsResult.status === "fulfilled" ? domainsResult.value : fallbackAdmin.domain_enrollments.map((row, index) => ({ id: index + 1, name: row.domain }));
      setData(dashboard);
      setStudents(studentRows);
      setDomains(domainRows);
      setTaskDraft((current) => ({
        ...current,
        application_id: current.application_id || dashboard.applications?.[0]?.id || "",
      }));
      const failed = [dashboardResult, studentsResult, domainsResult].find((result) => result.status === "rejected");
      if (failed) {
        setError(`${failed.reason.message}. Showing dashboard sample data where needed.`);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const applications = data?.applications || [];
  const metrics = data?.metrics || {};

  const derived = useMemo(() => {
    const active = applications.filter((item) => !["Certificate", "Rejected"].includes(item.status)).length;
    const pending = applications.filter((item) => ["Applied", "Assessment", "Test"].includes(item.status) || item.decision === "Pending").length;
    const certificateQueue = applications.filter((item) => item.payment_status === "Paid" || item.status === "Certificate");
    const paidCount = applications.filter((item) => item.payment_status === "Paid").length || metrics.paid || 0;
    const pendingPayments = Math.max((metrics.applications || applications.length || 0) - paidCount, 0);
    return { active, pending, certificateQueue, paidCount, pendingPayments };
  }, [applications, metrics]);

  async function run(label, action, successMessage) {
    setBusy(label);
    setError("");
    setNotice("");
    try {
      const result = await action();
      setNotice(result?.message || successMessage || "Saved.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function submitTask(event) {
    event.preventDefault();
    if (!taskDraft.application_id) {
      setError("Select an application before assigning a task.");
      return;
    }
    await run(
      "task",
      () =>
        api(`/admin/applications/${taskDraft.application_id}/tasks`, {
          method: "POST",
          token,
          body: {
            title: taskDraft.title,
            description: taskDraft.description,
            due_date: taskDraft.due_date || null,
          },
        }),
      "Task assigned."
    );
    setTaskDraft((current) => ({ ...current, title: "", description: "", due_date: "" }));
  }

  const content = (
    <motion.div className="grid min-w-0 gap-6" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
      <RoleHero
        eyebrow="Admin dashboard"
        title="Internship operations command center."
        subtitle="Manage students, applications, payments, certificates, task assignments, and operating reports from one dark SaaS workspace."
        chips={[
          { label: "Operations", section: "overview" },
          { label: "Internships", section: "applications" },
          { label: "Certificates", section: "certificates" },
          { label: "Revenue", section: "payments" },
        ]}
      >
        <div className="min-w-[220px]">
          <RoleMetricCard icon={Clock3} label="Pending Approvals" value={derived.pending} footer="Applications needing admin action" tone="slate" section="applications" />
        </div>
      </RoleHero>

      {notice && <RoleNotice>{notice}</RoleNotice>}
      {error && <RoleNotice type="error">{error}</RoleNotice>}

      <RoleSection id="overview" className="[grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <RoleMetricCard icon={UsersRound} label="Total Students" value={metrics.students || students.length || 0} footer="Registered learners" section="students" />
        <RoleMetricCard icon={BriefcaseBusiness} label="Active Internships" value={derived.active || 0} tone="cyan" footer="Live program flow" section="applications" />
        <RoleMetricCard icon={ClipboardCheck} label="Applications" value={metrics.applications || applications.length || 0} footer="All submissions" section="applications" />
        <RoleMetricCard icon={BarChart3} label="Revenue" value={`INR ${metrics.revenue || 0}`} tone="indigo" footer="Paid payments" section="payments" />
        <RoleMetricCard icon={BadgeCheck} label="Certificates Issued" value={metrics.certified || 0} tone="cyan" footer="Verified credentials" section="certificates" />
        <RoleMetricCard icon={Clock3} label="Pending Approvals" value={derived.pending || 0} tone="slate" footer="Decision queue" section="applications" />
      </RoleSection>

      <RoleSection id="applications">
        <RolePanel id="applications">
          <RoleSectionTitle eyebrow="Recent Applications" title="Review and move candidates forward." />
          <div className="mt-6 grid gap-3">
            {applications.length === 0 && <RoleEmpty message="No live applications found. Seeded sample data will appear after backend seed runs." />}
            {applications.slice(0, 6).map((application) => (
              <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.055] p-4 lg:grid-cols-[minmax(0,1fr)_auto]" key={application.id}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <RoleBadge tone={statusTone(application.status)}>{application.status}</RoleBadge>
                    <RoleBadge tone={application.payment_status === "Paid" ? "green" : "amber"}>{application.payment_status}</RoleBadge>
                  </div>
                  <h3 className="mt-3 truncate text-xl font-black text-white">{application.student?.name || "Student"}</h3>
                  <p className="mt-1 text-sm font-bold text-slate-400">{application.domain?.name || "Internship domain"} | {application.internship_id}</p>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <RoleButton variant="secondary" disabled={busy === `approve-${application.id}`} onClick={() => run(`approve-${application.id}`, () => api(`/admin/applications/${application.id}/decision`, { method: "PATCH", token, body: { decision: "Approved", test_score: application.test_score || null } }), "Application approved.")} type="button">
                    <CheckCircle2 size={16} />
                    Approve
                  </RoleButton>
                  <RoleButton variant="secondary" disabled={busy === `reject-${application.id}`} onClick={() => run(`reject-${application.id}`, () => api(`/admin/applications/${application.id}/decision`, { method: "PATCH", token, body: { decision: "Rejected" } }), "Application rejected.")} type="button">
                    Reject
                  </RoleButton>
                  <RoleButton disabled={busy === `paid-${application.id}`} onClick={() => run(`paid-${application.id}`, () => api(`/admin/applications/${application.id}/payment`, { method: "PATCH", token, body: { status: "Paid" } }), "Payment marked completed.")} type="button">
                    <CreditCard size={16} />
                    Mark Paid
                  </RoleButton>
                </div>
              </div>
            ))}
          </div>
        </RolePanel>
      </RoleSection>

      <RoleSection id="domains">
        <RolePanel id="domains">
          <RoleSectionTitle eyebrow="Domain-wise Enrollments" title="Program demand." />
          <div className="mt-6 grid gap-3">
            {(data?.domain_enrollments || []).map((row) => (
              <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={row.domain}>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-black text-white">{row.domain}</span>
                  <strong className="text-cyan-100">{row.enrollments}</strong>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <span className="block h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300" style={{ width: `${Math.min(100, Number(row.enrollments || 0) * 24)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </RolePanel>
      </RoleSection>

      <RoleSection id="payments">
        <RolePanel id="payments">
          <RoleSectionTitle eyebrow="Payment Overview" title="Revenue and payment health." />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <RoleMetricCard icon={CreditCard} label="Paid" value={derived.paidCount} section="payments" />
            <RoleMetricCard icon={Clock3} label="Pending" value={derived.pendingPayments} tone="slate" section="applications" />
            <RoleMetricCard icon={BarChart3} label="Revenue" value={`INR ${metrics.revenue || 0}`} tone="indigo" section="payments" />
          </div>
        </RolePanel>
      </RoleSection>

      <RoleSection id="certificates">
        <RolePanel id="certificates">
          <RoleSectionTitle eyebrow="Certificate Queue" title="Students nearing credential issue." />
          <div className="mt-6 grid gap-3">
            {derived.certificateQueue.length === 0 && <RoleEmpty message="No certificate-ready students yet." />}
            {derived.certificateQueue.slice(0, 5).map((application) => (
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={application.id}>
                <div className="min-w-0">
                  <strong className="block truncate text-white">{application.student?.name}</strong>
                  <span className="text-sm font-bold text-slate-400">{application.domain?.name}</span>
                </div>
                <RoleBadge tone={application.status === "Certificate" ? "green" : "cyan"}>{application.status}</RoleBadge>
              </div>
            ))}
          </div>
        </RolePanel>
      </RoleSection>

      <RoleSection id="tasks">
        <RolePanel id="tasks">
          <RoleSectionTitle eyebrow="Task Assignment Panel" title="Assign a focused deliverable." />
          <form className="mt-6 grid gap-3" onSubmit={submitTask}>
            <RoleField as="select" value={taskDraft.application_id} onChange={(event) => setTaskDraft({ ...taskDraft, application_id: event.target.value })}>
              <option value="">Select application</option>
              {applications.map((application) => (
                <option key={application.id} value={application.id}>{application.student?.name} - {application.domain?.name}</option>
              ))}
            </RoleField>
            <RoleField placeholder="Task title" value={taskDraft.title} onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })} required />
            <RoleField as="textarea" rows={3} placeholder="Task description" value={taskDraft.description} onChange={(event) => setTaskDraft({ ...taskDraft, description: event.target.value })} />
            <RoleField type="date" value={taskDraft.due_date} onChange={(event) => setTaskDraft({ ...taskDraft, due_date: event.target.value })} />
            <RoleButton disabled={busy === "task"}>
              <Save size={17} />
              Assign Task
            </RoleButton>
          </form>
        </RolePanel>
      </RoleSection>

      <RoleSection id="reports">
        <RolePanel id="reports">
          <RoleSectionTitle eyebrow="Reports" title="Operational signals." copy="Weekly program health, review throughput, certificate progress, and compliance readiness." />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <RoleMetricCard icon={PieChart} label="Program Utilization" value={`${Math.min(100, Math.round(((metrics.applications || 0) / Math.max(domains.length, 1)) * 12))}%`} section="domains" />
            <RoleMetricCard icon={FolderGit2} label="Project Reviews" value={metrics.pending_project_reviews || 0} tone="cyan" section="tasks" />
            <RoleMetricCard icon={ShieldCheck} label="Compliance" value="100%" tone="slate" section="reports" />
            <RoleMetricCard icon={FileCheck2} label="Document Pipeline" value={metrics.certified || 0} tone="indigo" section="certificates" />
          </div>
        </RolePanel>
      </RoleSection>

      <RoleSection id="students">
        <RolePanel>
          <RoleSectionTitle eyebrow="Students" title="Recent registered learners." />
          <div className="mt-6 grid gap-3">
            {students.slice(0, 6).map((student) => (
              <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-4 sm:grid-cols-[minmax(0,1fr)_auto]" key={student.id}>
                <div className="min-w-0">
                  <strong className="block truncate text-white">{student.name}</strong>
                  <span className="text-sm font-bold text-slate-400">{student.email}</span>
                </div>
                <RoleBadge>{student.graduation_year || "Student"}</RoleBadge>
              </div>
            ))}
          </div>
        </RolePanel>
      </RoleSection>
    </motion.div>
  );

  return (
    <RoleDashboardShell
      roleLabel="LYTIX Admin OS"
      title="Admin Dashboard"
      subtitle="Manage internship operations."
      navItems={adminNavItems}
      actions={<RoleRefreshButton onClick={load} disabled={loading} />}
    >
      {loading && !data ? <RolePanel className="grid min-h-[50vh] place-items-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-300/20 border-t-cyan-300" /></RolePanel> : content}
    </RoleDashboardShell>
  );
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
      <Icon className="text-cyan-200" size={22} />
      <strong className="mt-4 block text-2xl font-black text-white">{value}</strong>
      <span className="mt-1 block text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</span>
    </div>
  );
}

function ReportCard({ icon: Icon, title, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
      <Icon className="text-cyan-200" size={22} />
      <strong className="mt-4 block text-2xl font-black text-white">{value}</strong>
      <span className="mt-1 block text-sm font-bold text-slate-400">{title}</span>
    </div>
  );
}

function statusTone(status) {
  if (["Selected", "Offer Letter", "Tasks", "Project", "LinkedIn", "Certificate"].includes(status)) return "green";
  if (["Rejected", "Failed"].includes(status)) return "rose";
  if (["Payment", "Applied", "Assessment"].includes(status)) return "amber";
  return "cyan";
}
