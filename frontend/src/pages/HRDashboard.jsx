import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  LifeBuoy,
  MailCheck,
  MessageCircle,
  Save,
  Send,
  UserCheck,
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
  roleFadeUp,
} from "../components/RoleDashboardShell.jsx";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const hrNavItems = [
  { label: "Overview", href: "#overview", icon: LayoutDashboard },
  { label: "Candidates", href: "#candidates", icon: UsersRound },
  { label: "Screening", href: "#screening", icon: ClipboardList },
  { label: "Interviews", href: "#interviews", icon: CalendarClock },
  { label: "Offer Letters", href: "#offers", icon: MailCheck },
  { label: "Onboarding", href: "#onboarding", icon: CheckCircle2 },
  { label: "Messages", href: "#messages", icon: MessageCircle },
  { label: "Follow-ups", href: "#followups", icon: Send },
  { label: "Reports", href: "#reports", icon: BriefcaseBusiness },
  { label: "Support", href: "/support", icon: LifeBuoy },
];

const statuses = ["Applied", "Shortlisted", "Interview Scheduled", "Interview Done", "Offered", "Rejected", "Placed"];

const fallbackHr = {
  metrics: { applications: 3, shortlisted: 1, interviews: 1, placed: 0 },
  pipeline: { Applied: 1, Shortlisted: 1, "Interview Scheduled": 1 },
  applications: [
    {
      application_id: 1,
      student_name: "Aarav Sharma",
      student_email: "student@lytix.tech",
      domain_name: "Python Development",
      internship_id: "LYTIX-INT-0001",
      candidate_status: "Shortlisted",
      shortlisted: true,
      interview_date: "",
      notes: "Strong project interest.",
      placement_status: "Resume Reviewed",
    },
  ],
};

export default function HRDashboard() {
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
      const dashboard = await api("/hr/dashboard", { token });
      hydrate(dashboard);
    } catch (err) {
      hydrate(fallbackHr);
      setError(`${err.message}. Showing HR sample data where needed.`);
    } finally {
      setLoading(false);
    }
  }

  function hydrate(dashboard) {
    setData(dashboard);
    const next = {};
    dashboard.applications.forEach((item) => {
      next[item.application_id] = {
        candidate_status: item.candidate_status,
        shortlisted: Boolean(item.shortlisted),
        interview_date: item.interview_date || "",
        notes: item.notes || "",
      };
    });
    setDrafts(next);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(applicationId) {
    setBusy(applicationId);
    setError("");
    setNotice("");
    try {
      await api(`/hr/applications/${applicationId}`, {
        method: "PATCH",
        token,
        body: drafts[applicationId],
      });
      setNotice("Candidate pipeline updated.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  const applications = data?.applications || [];
  const metrics = data?.metrics || {};
  const offerCount = applications.filter((item) => ["Offered", "Placed"].includes(item.candidate_status)).length;
  const onboardingPending = applications.filter((item) => item.candidate_status === "Offered" && item.placement_status !== "Placed").length;
  const pipelineTotal = Math.max(applications.length, 1);

  const interviewRows = useMemo(
    () => applications.filter((item) => item.interview_date || ["Interview Scheduled", "Interview Done"].includes(item.candidate_status)).slice(0, 5),
    [applications]
  );

  return (
    <RoleDashboardShell
      roleLabel="LYTIX HR OS"
      title="HR Dashboard"
      subtitle="Manage hiring, screening, onboarding, and communication."
      navItems={hrNavItems}
      actions={<RoleRefreshButton onClick={load} disabled={loading} />}
    >
      {loading && !data ? (
        <RolePanel className="grid min-h-[50vh] place-items-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-300/20 border-t-cyan-300" /></RolePanel>
      ) : (
        <motion.div className="grid min-w-0 gap-6" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <RoleHero
            eyebrow="HR dashboard"
            title="Candidate screening and onboarding pipeline."
            subtitle="Shortlist talent, schedule interviews, track offer letters, and keep onboarding moving with clean HR signals."
            chips={[
              { label: "Screening", section: "screening" },
              { label: "Interviews", section: "interviews" },
              { label: "Offers", section: "offers" },
              { label: "Onboarding", section: "onboarding" },
            ]}
          >
            <div className="grid min-w-[240px] gap-4 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <RoleProgressBar label="Pipeline Conversion" value={Math.round(((metrics.shortlisted || 0) / pipelineTotal) * 100)} footer="Shortlisted against total candidates" section="candidates" />
              <RoleProgressBar label="Interview Coverage" value={Math.round(((metrics.interviews || 0) / pipelineTotal) * 100)} section="interviews" />
            </div>
          </RoleHero>

          {notice && <RoleNotice>{notice}</RoleNotice>}
          {error && <RoleNotice type="error">{error}</RoleNotice>}

          <RoleSection id="overview" className="[grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            <RoleMetricCard icon={UsersRound} label="Total Candidates" value={metrics.applications || applications.length || 0} section="candidates" />
            <RoleMetricCard icon={UserCheck} label="Shortlisted" value={metrics.shortlisted || 0} tone="cyan" section="candidates" />
            <RoleMetricCard icon={CalendarClock} label="Interviews Scheduled" value={metrics.interviews || 0} section="interviews" />
            <RoleMetricCard icon={MailCheck} label="Offer Letters Sent" value={offerCount} tone="indigo" section="offers" />
            <RoleMetricCard icon={CheckCircle2} label="Onboarding Pending" value={onboardingPending} tone="slate" section="onboarding" />
          </RoleSection>

          <RoleSection id="screening">
            <RolePanel id="screening">
              <RoleSectionTitle eyebrow="Candidate Pipeline" title="Status distribution." />
              <div className="mt-6 grid gap-3">
                {Object.entries(data?.pipeline || {}).map(([label, count]) => (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={label}>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-black text-white">{label}</span>
                      <strong className="text-cyan-100">{count}</strong>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <span className="block h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300" style={{ width: `${Math.min(100, (Number(count) / pipelineTotal) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="candidates">
            <RolePanel id="candidates">
              <RoleSectionTitle eyebrow="Candidates" title="Screening workspace." />
              <div className="mt-6 grid gap-3">
                {applications.length === 0 && <RoleEmpty message="No candidates in the HR pipeline yet." />}
                {applications.map((item) => {
                  const draft = drafts[item.application_id] || {};
                  return (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={item.application_id}>
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
                        <div className="min-w-0">
                          <RoleBadge tone={draft.shortlisted ? "green" : "cyan"}>{draft.candidate_status || item.candidate_status}</RoleBadge>
                          <h3 className="mt-3 truncate text-xl font-black text-white">{item.student_name}</h3>
                          <p className="mt-1 text-sm font-bold text-slate-400">{item.domain_name} | {item.internship_id}</p>
                          <p className="mt-2 text-sm text-slate-500">{item.student_email}</p>
                        </div>
                        <div className="grid gap-3">
                          <RoleField as="select" value={draft.candidate_status || ""} onChange={(event) => setDrafts({ ...drafts, [item.application_id]: { ...draft, candidate_status: event.target.value } })}>
                            {statuses.map((status) => <option key={status}>{status}</option>)}
                          </RoleField>
                          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-slate-200">
                            <input type="checkbox" className="h-5 w-5 accent-cyan-400" checked={Boolean(draft.shortlisted)} onChange={(event) => setDrafts({ ...drafts, [item.application_id]: { ...draft, shortlisted: event.target.checked } })} />
                            Shortlisted
                          </label>
                          <RoleField type="datetime-local" value={draft.interview_date || ""} onChange={(event) => setDrafts({ ...drafts, [item.application_id]: { ...draft, interview_date: event.target.value } })} />
                          <RoleField placeholder="HR notes" value={draft.notes || ""} onChange={(event) => setDrafts({ ...drafts, [item.application_id]: { ...draft, notes: event.target.value } })} />
                          <RoleButton disabled={busy === item.application_id} onClick={() => save(item.application_id)} type="button">
                            <Save size={17} />
                            Save Candidate
                          </RoleButton>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="interviews">
            <RolePanel id="interviews">
              <RoleSectionTitle eyebrow="Interview Schedule" title="Upcoming and active interviews." />
              <div className="mt-6 grid gap-3">
                {interviewRows.length === 0 && <RoleEmpty message="No interviews scheduled yet." />}
                {interviewRows.map((item) => (
                  <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-4 sm:flex-row sm:items-center sm:justify-between" key={item.application_id}>
                    <div>
                      <strong className="text-white">{item.student_name}</strong>
                      <p className="mt-1 text-sm font-bold text-slate-400">{item.interview_date || "Schedule pending"}</p>
                    </div>
                    <RoleBadge>{item.candidate_status}</RoleBadge>
                  </div>
                ))}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="messages">
            <RolePanel id="messages">
              <RoleSectionTitle eyebrow="HR Notes" title="Communication queue." />
              <div className="mt-6 grid gap-3">
                {applications.slice(0, 4).map((item) => (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={`note-${item.application_id}`}>
                    <MessageCircle className="text-cyan-200" size={20} />
                    <strong className="mt-3 block text-white">{item.student_name}</strong>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{item.notes || "No HR notes yet."}</p>
                  </div>
                ))}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="offers">
            <RolePanel id="offers">
              <RoleSectionTitle eyebrow="Offer Letter Status" title="Offer readiness." />
              <div className="mt-6">
                <RoleMetricCard icon={MailCheck} label="Offers Sent" value={offerCount} section="offers" />
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="onboarding">
            <RolePanel id="onboarding">
              <RoleSectionTitle eyebrow="Onboarding Checklist" title="Pre-start actions." />
              <div className="mt-6 grid gap-3">
                {["Documents collected", "Mentor assigned", "Welcome message sent", "Program access enabled"].map((item, index) => (
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={item}>
                    <CheckCircle2 className={index < 2 ? "text-cyan-200" : "text-slate-500"} size={19} />
                    <span className="text-sm font-black text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="followups">
            <RolePanel id="followups">
              <RoleSectionTitle eyebrow="Follow-ups" title="Candidate follow-up list." />
              <div className="mt-6 grid gap-3">
                {applications.length === 0 && <RoleEmpty message="No follow-ups are due right now." />}
                {applications.slice(0, 5).map((item) => (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={`follow-${item.application_id}`}>
                    <Send className="text-cyan-200" size={20} />
                    <strong className="mt-3 block text-white">{item.student_name}</strong>
                    <p className="mt-1 text-sm leading-6 text-slate-400">Next HR follow-up: confirm {item.candidate_status?.toLowerCase() || "candidate"} status and update notes.</p>
                  </div>
                ))}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="reports">
            <RolePanel id="reports">
              <RoleSectionTitle eyebrow="Reports" title="HR health." />
              <div className="mt-6">
                <RoleMetricCard icon={Send} label="Pipeline Active" value={`${Math.round(((metrics.shortlisted || 0) / pipelineTotal) * 100)}%`} section="screening" />
              </div>
            </RolePanel>
          </RoleSection>
        </motion.div>
      )}
    </RoleDashboardShell>
  );
}
