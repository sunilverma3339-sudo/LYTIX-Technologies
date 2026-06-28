import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BadgeCheck,
  BarChart3,
  CreditCard,
  Crown,
  Database,
  FileCheck2,
  LayoutDashboard,
  LifeBuoy,
  LockKeyhole,
  Save,
  ServerCog,
  Settings,
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
  RoleProgressBar,
  RoleRefreshButton,
  RoleSection,
  RoleSectionTitle,
  useRoleDashboardSection,
  roleFadeUp,
} from "../components/RoleDashboardShell.jsx";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const roles = ["student", "mentor", "admin", "hr", "recruiter", "super_admin"];
const superAdminNavItems = [
  { label: "Command Center", href: "#command", icon: Crown },
  { label: "Users", href: "#users", icon: UsersRound },
  { label: "Roles", href: "#roles", icon: ShieldCheck },
  { label: "Revenue", href: "#revenue", icon: CreditCard },
  { label: "Domains", href: "#domains", icon: Database },
  { label: "Teams", href: "#teams", icon: UsersRound },
  { label: "Documents", href: "#documents", icon: FileCheck2 },
  { label: "Community", href: "#community", icon: Activity },
  { label: "Hackathons", href: "#hackathons", icon: BadgeCheck },
  { label: "Certificates", href: "#certificates", icon: BadgeCheck },
  { label: "Payments", href: "#payments", icon: CreditCard },
  { label: "Pending Actions", href: "#pending", icon: LockKeyhole },
  { label: "Platform Settings", href: "#settings", icon: Settings },
  { label: "Audit Logs", href: "#audit", icon: FileCheck2 },
  { label: "System Health", href: "#health", icon: ServerCog },
  { label: "Support", href: "/support", icon: LifeBuoy },
];

const fallbackSuperAdmin = {
  totals: {
    total_users: 8,
    total_students: 3,
    total_mentors: 1,
    total_admins: 1,
    total_hr: 1,
    total_recruiters: 1,
    total_super_admins: 1,
  },
  total_revenue: 5998,
  platform: {
    applications: 3,
    certificates: 1,
    documents: 4,
    teams: 4,
    community_posts: 8,
    hackathons: 2,
    email_logs: 12,
    recruiter_shortlists: 1,
  },
  users: [],
  role_management: "Manage platform access for seeded MVP users and role-based dashboards.",
};

export default function SuperAdminDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const analytics = await api("/super-admin/analytics", { token });
      hydrate(analytics);
    } catch (err) {
      hydrate(fallbackSuperAdmin);
      setError(`${err.message}. Showing super admin sample data where needed.`);
    } finally {
      setLoading(false);
    }
  }

  function hydrate(analytics) {
    setData(analytics);
    const next = {};
    (analytics.users || []).forEach((user) => {
      next[user.id] = user.role;
    });
    setDrafts(next);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveRole(userId) {
    setBusy(userId);
    setError("");
    setNotice("");
    try {
      await api(`/super-admin/users/${userId}/role`, { method: "PATCH", token, body: { role: drafts[userId] } });
      setNotice("Role updated for MVP testing.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  const totals = data?.totals || {};
  const platform = data?.platform || {};
  const totalUsers = totals.total_users || 1;
  const healthScore = 98;

  return (
    <RoleDashboardShell
      roleLabel="LYTIX Super Admin OS"
      title="Super Admin Dashboard"
      subtitle="Full company control center."
      navItems={superAdminNavItems}
      actions={<RoleRefreshButton onClick={load} disabled={loading} />}
      badge="Platform Control"
    >
      {loading && !data ? (
        <RolePanel className="grid min-h-[50vh] place-items-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-300/20 border-t-cyan-300" /></RolePanel>
      ) : (
        <motion.div className="grid min-w-0 gap-6" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <RoleHero
            eyebrow="Command center"
            title="Global analytics and platform governance."
            subtitle="Control users, roles, revenue, platform activity, certificates, payments, audit logs, and system health from one executive dashboard."
            chips={[
              { label: "Global Control", section: "command" },
              { label: "Role Management", section: "users" },
              { label: "Revenue", section: "revenue" },
              { label: "Audit Logs", section: "audit" },
            ]}
          >
            <div className="grid min-w-[240px] gap-4 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <RoleProgressBar label="System Health" value={healthScore} footer="MVP local system monitor" section="health" />
              <RoleProgressBar label="Student Share" value={Math.round(((totals.total_students || 0) / totalUsers) * 100)} section="users" />
            </div>
          </RoleHero>

          {notice && <RoleNotice>{notice}</RoleNotice>}
          {error && <RoleNotice type="error">{error}</RoleNotice>}

          <RoleSection id="command" className="[grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            <RoleMetricCard icon={UsersRound} label="Total Users" value={totals.total_users || 0} section="users" />
            <RoleMetricCard icon={CreditCard} label="Total Revenue" value={`INR ${data?.total_revenue || 0}`} tone="cyan" section="revenue" />
            <RoleMetricCard icon={Database} label="Active Programs" value={platform.applications || 0} section="domains" />
            <RoleMetricCard icon={BadgeCheck} label="Certificates Issued" value={platform.certificates || 0} tone="indigo" section="certificates" />
            <RoleMetricCard icon={ServerCog} label="System Health" value={`${healthScore}%`} tone="cyan" section="health" />
            <RoleMetricCard icon={LockKeyhole} label="Pending Admin Actions" value={platform.email_logs || 0} tone="slate" section="pending" />
          </RoleSection>

          <RoleSection id="users">
            <RolePanel id="users">
              <RoleSectionTitle eyebrow="Role Management" title="User access control." copy={data?.role_management} />
              <div className="mt-6 grid gap-3">
                {(data?.users || []).length === 0 && <RoleEmpty message="No users returned yet. Seed the backend to see role management rows." />}
                {(data?.users || []).map((row) => (
                  <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.055] p-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.65fr)]" key={row.id}>
                    <div className="min-w-0">
                      <RoleBadge tone={roleTone(row.role)}>{row.role}</RoleBadge>
                      <h3 className="mt-3 truncate text-xl font-black text-white">{row.name}</h3>
                      <p className="mt-1 text-sm font-bold text-slate-400">{row.email}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                      <RoleField as="select" value={drafts[row.id] || row.role} onChange={(event) => setDrafts({ ...drafts, [row.id]: event.target.value })}>
                        {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                      </RoleField>
                      <RoleButton disabled={busy === row.id} onClick={() => saveRole(row.id)} type="button">
                        <Save size={17} />
                        Save
                      </RoleButton>
                    </div>
                  </div>
                ))}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="roles">
            <RolePanel id="roles">
              <RoleSectionTitle eyebrow="Global Analytics" title="Role split." />
              <div className="mt-6 grid gap-3">
                <SplitRow label="Students" value={totals.total_students || 0} total={totalUsers} />
                <SplitRow label="Mentors" value={totals.total_mentors || 0} total={totalUsers} />
                <SplitRow label="Admins" value={totals.total_admins || 0} total={totalUsers} />
                <SplitRow label="HR" value={totals.total_hr || 0} total={totalUsers} />
                <SplitRow label="Recruiters" value={totals.total_recruiters || 0} total={totalUsers} />
                <SplitRow label="Super Admins" value={totals.total_super_admins || 0} total={totalUsers} />
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="revenue">
            <RolePanel id="revenue">
              <RoleSectionTitle eyebrow="Revenue Dashboard" title="Revenue and payments table." copy="Track paid amount, pending payment queues, and finance-related control signals." />
              <BigSignal icon={BarChart3} value={`INR ${data?.total_revenue || 0}`} label="Total revenue" section="payments" />
              <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
                <div className="grid grid-cols-3 bg-white/[0.08] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-cyan-100">
                  <span>Signal</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>
                {[
                  ["Paid revenue", `INR ${data?.total_revenue || 0}`, "Open payments", "payments"],
                  ["Applications in pipeline", platform.applications || 0, "Review enrollments", "domains"],
                  ["Payment confirmations", platform.email_logs || 0, "Check email logs", "pending"],
                ].map(([signal, status, action, section]) => (
                  <ActionTableRow action={action} key={signal} section={section} signal={signal} status={status} />
                ))}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="payments">
            <RolePanel id="payments">
              <RoleSectionTitle eyebrow="Payments" title="Payment control center." />
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <PlatformStat icon={CreditCard} label="Total Revenue" value={`INR ${data?.total_revenue || 0}`} section="revenue" />
                <PlatformStat icon={Activity} label="Applications" value={platform.applications || 0} section="domains" />
                <PlatformStat icon={FileCheck2} label="Email Logs" value={platform.email_logs || 0} section="pending" />
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="certificates">
            <RolePanel id="certificates">
              <RoleSectionTitle eyebrow="Certificates" title="Issued credential overview." />
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <PlatformStat icon={BadgeCheck} label="Certificates" value={platform.certificates || 0} section="certificates" />
                <PlatformStat icon={FileCheck2} label="Documents" value={platform.documents || 0} section="documents" />
                <PlatformStat icon={ShieldCheck} label="Verification Health" value="Active" section="health" />
              </div>
              <div className="mt-6 grid gap-3">
                {["Internship Certificate", "Experience Letter", "Letter of Recommendation"].map((documentType, index) => (
                  <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]" key={documentType}>
                    <div>
                      <strong className="text-white">{documentType}</strong>
                      <p className="mt-1 text-sm font-bold text-slate-400">Verification ID LYTIX-DOC-{String(index + 1).padStart(3, "0")}</p>
                    </div>
                    <RoleButton variant="secondary" type="button">Verify</RoleButton>
                    <RoleButton type="button">Download</RoleButton>
                  </div>
                ))}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="health">
            <RolePanel id="health">
              <RoleSectionTitle eyebrow="System Health Monitor" title="Local MVP status." />
              <div className="mt-6 grid gap-3">
                {["API online", "SQLite connected", "JWT active", "PDF generator ready"].map((item) => (
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={item}>
                    <Activity className="text-cyan-200" size={19} />
                    <span className="text-sm font-black text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="pending">
            <RolePanel id="pending">
              <RoleSectionTitle eyebrow="Pending Admin Actions" title="Action center." />
              <div className="mt-6 grid gap-3">
                {[
                  ["Application approvals", platform.applications || 0],
                  ["Payment confirmations", platform.email_logs || 0],
                  ["Certificate requests", platform.documents || 0],
                  ["Support tickets", platform.recruiter_shortlists || 0],
                ].map(([label, value]) => (
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={label}>
                    <span className="text-sm font-black text-white">{label}</span>
                    <RoleBadge>{value}</RoleBadge>
                  </div>
                ))}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="settings">
            <RolePanel id="settings">
              <RoleSectionTitle eyebrow="Admin Controls" title="Platform settings." />
              <div className="mt-6 grid gap-3">
                {["Feature flags ready for production setup", "Billing controls tracked in revenue dashboard", "Organization policies managed by Super Admin"].map((item) => (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-sm font-black text-slate-200" key={item}>{item}</div>
                ))}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="audit">
            <RolePanel id="audit">
              <RoleSectionTitle eyebrow="Audit Logs" title="Audit log viewer." copy="Review high-level platform activity across roles, finance, credentials, and system checks." />
              <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
                <div className="grid grid-cols-[1fr_130px_120px] bg-white/[0.08] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-cyan-100">
                  <span>Event</span>
                  <span>Module</span>
                  <span>Status</span>
                </div>
                {["Role management viewed", "Revenue analytics refreshed", "Certificate queue checked", "System health monitor synced"].map((item, index) => (
                  <div className="grid grid-cols-[1fr_130px_120px] gap-3 border-t border-white/10 px-4 py-3 text-sm font-bold text-slate-300" key={item}>
                    <span className="min-w-0 truncate text-white">{item}</span>
                    <span>{["Roles", "Revenue", "Documents", "Health"][index]}</span>
                    <RoleBadge tone="green">Recorded</RoleBadge>
                  </div>
                ))}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="domains">
            <RolePanel id="domains">
              <RoleSectionTitle eyebrow="Platform Activity" title="Company-wide modules." />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <PlatformStat icon={Database} label="Teams" value={platform.teams || 0} section="teams" />
                <PlatformStat icon={FileCheck2} label="Documents" value={platform.documents || 0} section="documents" />
                <PlatformStat icon={Activity} label="Community Posts" value={platform.community_posts || 0} section="community" />
                <PlatformStat icon={BadgeCheck} label="Hackathons" value={platform.hackathons || 0} section="hackathons" />
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="teams">
            <RolePanel id="teams">
              <RoleSectionTitle eyebrow="Team Management" title="Default cohort teams." copy="Manage team assignment signals, mentor ownership, and team progress from the Super Admin control plane." />
              <div className="mt-6 grid gap-3">
                {["Team Alpha", "Team Beta", "Team Gamma", "Team Delta"].map((team, index) => (
                  <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-4 sm:grid-cols-[minmax(0,1fr)_auto]" key={team}>
                    <div>
                      <strong className="text-white">{team}</strong>
                      <p className="mt-1 text-sm font-bold text-slate-400">Mentor assigned | {index + 3} active members</p>
                    </div>
                    <RoleBadge tone={index < 2 ? "green" : "cyan"}>{index < 2 ? "Active" : "Ready"}</RoleBadge>
                  </div>
                ))}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="documents">
            <RolePanel id="documents">
              <RoleSectionTitle eyebrow="Documents" title="Documents, letters, and certificates." copy="Credential, offer letter, experience letter, and LOR records are monitored here for issue and verification readiness." />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <PlatformStat icon={FileCheck2} label="Offer Letters" value={platform.documents || 0} section="documents" />
                <PlatformStat icon={BadgeCheck} label="Certificates" value={platform.certificates || 0} section="certificates" />
                <PlatformStat icon={ShieldCheck} label="Experience Letters" value={Math.max(0, Number(platform.documents || 0) - 1)} section="documents" />
                <PlatformStat icon={Crown} label="LOR Requests" value={Math.max(0, Number(platform.certificates || 0))} section="pending" />
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="community">
            <RolePanel id="community">
              <RoleSectionTitle eyebrow="Community Moderation" title="Posts, comments, announcements, and events." />
              <div className="mt-6 grid gap-3">
                {[
                  ["Domain discussion posts", platform.community_posts || 0],
                  ["Announcements", 3],
                  ["Event updates", platform.hackathons || 0],
                ].map(([label, value]) => (
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={label}>
                    <span className="text-sm font-black text-white">{label}</span>
                    <RoleBadge>{value}</RoleBadge>
                  </div>
                ))}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="hackathons">
            <RolePanel id="hackathons">
              <RoleSectionTitle eyebrow="Hackathon Management" title="Innovation challenge control." />
              <div className="mt-6 grid gap-3">
                {["LYTIX Innovation Challenge", "AI Builders Sprint"].map((eventName, index) => (
                  <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-4 sm:grid-cols-[minmax(0,1fr)_auto]" key={eventName}>
                    <div>
                      <strong className="text-white">{eventName}</strong>
                      <p className="mt-1 text-sm font-bold text-slate-400">Leaderboard, registrations, submissions, and prize tracking active.</p>
                    </div>
                    <RoleBadge tone={index === 0 ? "green" : "amber"}>{index === 0 ? "Open" : "Draft"}</RoleBadge>
                  </div>
                ))}
              </div>
            </RolePanel>
          </RoleSection>
        </motion.div>
      )}
    </RoleDashboardShell>
  );
}

function SplitRow({ label, value, total }) {
  const percent = Math.round((Number(value || 0) / Math.max(Number(total || 1), 1)) * 100);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-black text-white">{label}</span>
        <strong className="text-cyan-100">{value}</strong>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <span className="block h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function BigSignal({ icon: Icon, value, label, section }) {
  const { setActiveSection } = useRoleDashboardSection();
  const clickable = Boolean(section);
  return (
    <button
      className={`mt-6 w-full rounded-3xl border border-cyan-300/30 bg-cyan-300/10 p-5 text-center transition ${clickable ? "cursor-pointer hover:-translate-y-1 hover:bg-cyan-300/15 hover:shadow-[0_22px_60px_rgba(6,182,212,0.18)]" : ""}`}
      onClick={() => section && setActiveSection(section)}
      type="button"
    >
      <Icon className="mx-auto text-cyan-200" size={34} />
      <strong className="mt-4 block text-3xl font-black text-white">{value}</strong>
      <span className="mt-2 block text-sm font-bold text-slate-300">{label}</span>
    </button>
  );
}

function PlatformStat({ icon: Icon, label, value, section }) {
  const { activeSection, setActiveSection } = useRoleDashboardSection();
  const active = section && activeSection === section;
  return (
    <button
      className={`rounded-2xl border bg-white/[0.055] p-4 text-left outline-none transition ${active ? "border-cyan-300/70 ring-4 ring-cyan-300/15" : "border-white/10"} ${section ? "cursor-pointer hover:-translate-y-1 hover:border-cyan-300/50 hover:bg-cyan-300/10 focus:border-cyan-300/70 focus:ring-4 focus:ring-cyan-300/15" : ""}`}
      onClick={() => section && setActiveSection(section)}
      type="button"
    >
      <Icon className="text-cyan-200" size={22} />
      <strong className="mt-4 block text-3xl font-black text-white">{value}</strong>
      <span className="mt-1 block text-sm font-bold text-slate-400">{label}</span>
    </button>
  );
}

function ActionTableRow({ signal, status, action, section }) {
  const { setActiveSection } = useRoleDashboardSection();
  return (
    <button
      className="grid w-full grid-cols-3 gap-3 border-t border-white/10 px-4 py-3 text-left text-sm font-bold text-slate-300 transition hover:bg-cyan-300/10 hover:text-white focus:bg-cyan-300/10"
      onClick={() => setActiveSection(section)}
      type="button"
    >
      <span className="min-w-0 truncate text-white">{signal}</span>
      <span>{status}</span>
      <span className="text-cyan-100">{action}</span>
    </button>
  );
}

function roleTone(role) {
  if (role === "super_admin") return "rose";
  if (role === "admin") return "amber";
  if (role === "student") return "cyan";
  return "blue";
}
