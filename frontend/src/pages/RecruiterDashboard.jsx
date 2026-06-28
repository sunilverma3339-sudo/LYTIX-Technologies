import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  FileText,
  Filter,
  LayoutDashboard,
  LifeBuoy,
  MailPlus,
  MessageCircle,
  Search,
  Send,
  Star,
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

const recruiterNavItems = [
  { label: "Overview", href: "#overview", icon: LayoutDashboard },
  { label: "Talent Directory", href: "#talent", icon: Search },
  { label: "Shortlisted", href: "#shortlists", icon: Star },
  { label: "Job Posts", href: "#jobs", icon: BriefcaseBusiness },
  { label: "Applications", href: "#applications", icon: FileText },
  { label: "Interviews", href: "#interviews", icon: CalendarClock },
  { label: "Messages", href: "#messages", icon: MessageCircle },
  { label: "Hiring Reports", href: "#reports", icon: Filter },
  { label: "Support", href: "/support", icon: LifeBuoy },
];

const sampleProfiles = [
  {
    student_id: 1,
    student_name: "Aarav Sharma",
    email: "student@lytix.tech",
    domain: "Python Development",
    domain_id: 1,
    skills: ["Python", "FastAPI", "SQLite", "React"],
    ats_score: 82,
    project_score: 88,
    placement_status: "Shortlisted",
    certificate_verification_link: "/verify/sample-cert",
    github_url: "https://github.com",
  },
  {
    student_id: 2,
    student_name: "Nisha Patel",
    email: "nisha@lytix.tech",
    domain: "Machine Learning and AI",
    domain_id: 4,
    skills: ["Python", "ML", "Pandas", "Dashboards"],
    ats_score: 76,
    project_score: 84,
    placement_status: "Resume Reviewed",
    certificate_verification_link: "",
    github_url: "",
  },
];

export default function RecruiterDashboard() {
  const { token } = useAuth();
  const [domains, setDomains] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [shortlists, setShortlists] = useState([]);
  const [filters, setFilters] = useState({ domain_id: "", skills: "", ats_min: 0, project_score_min: 0, placement_status: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) params.set(key, value);
    });
    return params.toString();
  }, [filters]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [domainRows, profileRows, shortlistRows] = await Promise.all([
        api("/domains", { token }),
        api(`/recruiter/search${query ? `?${query}` : ""}`, { token }),
        api("/recruiter/shortlists", { token }),
      ]);
      setDomains(domainRows);
      setProfiles(profileRows);
      setShortlists(shortlistRows);
    } catch (err) {
      setDomains([{ id: 1, name: "Python Development" }, { id: 4, name: "Machine Learning and AI" }]);
      setProfiles(sampleProfiles);
      setShortlists([]);
      setError(`${err.message}. Showing recruiter sample data where needed.`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [query]);

  async function action(path, body, message, key) {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      await api(path, { method: "POST", token, body });
      setNotice(message);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  const verified = profiles.filter((profile) => profile.certificate_verification_link).length;
  const hired = profiles.filter((profile) => profile.placement_status === "Placed").length;

  return (
    <RoleDashboardShell
      roleLabel="LYTIX Recruiter OS"
      title="Recruiter Dashboard"
      subtitle="Search and hire verified LYTIX talent."
      navItems={recruiterNavItems}
      actions={<RoleRefreshButton onClick={load} disabled={loading} />}
    >
      {loading && profiles.length === 0 ? (
        <RolePanel className="grid min-h-[50vh] place-items-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-300/20 border-t-cyan-300" /></RolePanel>
      ) : (
        <motion.div className="grid min-w-0 gap-6" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <RoleHero
            eyebrow="Recruiter dashboard"
            title="Verified talent search and hiring pipeline."
            subtitle="Filter interns by domain, skills, ATS score, project score, certificate proof, and placement readiness."
            chips={[
              { label: "Talent Search", section: "talent" },
              { label: "Shortlists", section: "shortlists" },
              { label: "Interview Requests", section: "interviews" },
              { label: "Verified Certificates", section: "applications" },
            ]}
          >
            <div className="grid min-w-[240px] gap-4 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <RoleProgressBar label="Verified Profiles" value={profiles.length ? Math.round((verified / profiles.length) * 100) : 0} section="applications" />
              <RoleProgressBar label="Hiring Pipeline" value={profiles.length ? Math.round((shortlists.length / profiles.length) * 100) : 0} section="shortlists" />
            </div>
          </RoleHero>

          {notice && <RoleNotice>{notice}</RoleNotice>}
          {error && <RoleNotice type="error">{error}</RoleNotice>}

          <RoleSection id="overview" className="[grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            <RoleMetricCard icon={UserCheck} label="Available Talent" value={profiles.length} section="talent" />
            <RoleMetricCard icon={Star} label="Shortlisted Candidates" value={shortlists.length} tone="cyan" section="shortlists" />
            <RoleMetricCard icon={BriefcaseBusiness} label="Active Job Posts" value="3" section="jobs" />
            <RoleMetricCard icon={CalendarClock} label="Interview Requests" value={shortlists.filter((item) => item.contact_requested).length} tone="indigo" section="interviews" />
            <RoleMetricCard icon={BadgeCheck} label="Hired Candidates" value={hired} tone="slate" section="reports" />
          </RoleSection>

          <RoleSection id="talent">
            <RolePanel id="talent">
              <RoleSectionTitle eyebrow="Talent Search" title="Skill filters." />
              <div className="mt-6 grid gap-3">
                <RoleField as="select" value={filters.domain_id} onChange={(event) => setFilters({ ...filters, domain_id: event.target.value })}>
                  <option value="">All domains</option>
                  {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}
                </RoleField>
                <RoleField placeholder="Skill keyword" value={filters.skills} onChange={(event) => setFilters({ ...filters, skills: event.target.value })} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <RoleField type="number" min="0" max="100" placeholder="ATS min" value={filters.ats_min} onChange={(event) => setFilters({ ...filters, ats_min: event.target.value })} />
                  <RoleField type="number" min="0" max="100" placeholder="Project min" value={filters.project_score_min} onChange={(event) => setFilters({ ...filters, project_score_min: event.target.value })} />
                </div>
                <RoleField as="select" value={filters.placement_status} onChange={(event) => setFilters({ ...filters, placement_status: event.target.value })}>
                  <option value="">Any placement status</option>
                  <option>Not Started</option>
                  <option>Resume Reviewed</option>
                  <option>Mock Interview Done</option>
                  <option>Shortlisted</option>
                  <option>Placed</option>
                </RoleField>
              </div>

              <div id="jobs" className="mt-8 rounded-3xl border border-white/10 bg-white/[0.055] p-5">
                <RoleSectionTitle eyebrow="Job Posting Panel" title="MVP hiring cards." />
                <div className="mt-5 grid gap-3">
                  {["Junior Full Stack Intern", "AI Project Assistant", "Cloud DevOps Trainee"].map((role) => (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={role}>
                      <strong className="text-white">{role}</strong>
                      <p className="mt-1 text-sm font-bold text-slate-400">Open for LYTIX verified talent</p>
                    </div>
                  ))}
                </div>
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="applications">
            <RolePanel id="applications">
              <RoleSectionTitle eyebrow="Candidate Cards" title="Talent results." />
              <div className="mt-6 grid gap-4">
                {profiles.length === 0 && <RoleEmpty message="No talent profiles match the filters." />}
                {profiles.map((profile) => (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={profile.student_id}>
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <RoleBadge>{profile.domain}</RoleBadge>
                          <RoleBadge tone={profile.certificate_verification_link ? "green" : "slate"}>{profile.certificate_verification_link ? "Verified" : "Verification Pending"}</RoleBadge>
                        </div>
                        <h3 className="mt-3 truncate text-xl font-black text-white">{profile.student_name}</h3>
                        <p className="mt-1 text-sm font-bold text-slate-400">ATS {profile.ats_score}% | Project {profile.project_score}% | {profile.placement_status}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(profile.skills || []).slice(0, 6).map((skill) => <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-200" key={skill}>{skill}</span>)}
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[260px] lg:grid-cols-1">
                        {profile.certificate_verification_link && (
                          <a className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm font-black text-cyan-100" href={profile.certificate_verification_link} target="_blank" rel="noreferrer">
                            <BadgeCheck size={16} />
                            Certificate
                          </a>
                        )}
                        {profile.github_url && (
                          <a className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-black text-white" href={profile.github_url} target="_blank" rel="noreferrer">
                            <FileText size={16} />
                            GitHub
                          </a>
                        )}
                        <RoleButton variant="secondary" disabled={busy === `short-${profile.student_id}`} onClick={() => action("/recruiter/shortlists", { student_id: profile.student_id, notes: "Recruiter shortlist from dashboard." }, "Student shortlisted.", `short-${profile.student_id}`)} type="button">
                          <Star size={17} />
                          Shortlist
                        </RoleButton>
                        <RoleButton disabled={busy === `contact-${profile.student_id}`} onClick={() => action("/recruiter/contact-request", { student_id: profile.student_id, notes: "Recruiter contact request from dashboard." }, "Contact request logged.", `contact-${profile.student_id}`)} type="button">
                          <MailPlus size={17} />
                          Contact
                        </RoleButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="jobs">
            <RolePanel id="jobs">
              <RoleSectionTitle eyebrow="Job Posts" title="Job posting management." />
              <div className="mt-6 grid gap-3">
                {["Junior Full Stack Intern", "AI Project Assistant", "Cloud DevOps Trainee"].map((role) => (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={role}>
                    <BriefcaseBusiness className="text-cyan-200" size={20} />
                    <strong className="mt-3 block text-white">{role}</strong>
                    <p className="mt-1 text-sm font-bold text-slate-400">Open for LYTIX verified talent</p>
                  </div>
                ))}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="shortlists">
            <RolePanel id="shortlists">
              <RoleSectionTitle eyebrow="Shortlist Table" title="Recruiter saved candidates." />
              <div className="mt-6 grid gap-3">
                {shortlists.length === 0 && <RoleEmpty message="No shortlisted students yet." />}
                {shortlists.map((item) => (
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={item.id}>
                    <div className="min-w-0">
                      <strong className="block truncate text-white">{item.student_name}</strong>
                      <span className="text-sm font-bold text-slate-400">{item.student_email}</span>
                    </div>
                    <RoleBadge tone={item.contact_requested ? "green" : "cyan"}>{item.contact_requested ? "Contact Requested" : item.status}</RoleBadge>
                  </div>
                ))}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="interviews">
            <RolePanel id="interviews">
              <RoleSectionTitle eyebrow="Interview Requests" title="Next actions." />
              <div className="mt-6 grid gap-3">
                {shortlists.slice(0, 4).map((item) => (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={`interview-${item.id}`}>
                    <CalendarClock className="text-cyan-200" size={20} />
                    <strong className="mt-3 block text-white">{item.student_name}</strong>
                    <p className="mt-1 text-sm leading-6 text-slate-400">Schedule a screening call and log the hiring decision in the recruiter pipeline.</p>
                  </div>
                ))}
                {shortlists.length === 0 && <RoleEmpty message="Shortlisted candidates will appear here for interview scheduling." />}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="messages">
            <RolePanel id="messages">
              <RoleSectionTitle eyebrow="Messages" title="Contact request log." />
              <div className="mt-6 grid gap-3">
                {shortlists.filter((item) => item.contact_requested).length === 0 && <RoleEmpty message="No candidate contact requests have been sent yet." />}
                {shortlists.filter((item) => item.contact_requested).map((item) => (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={`message-${item.id}`}>
                    <MessageCircle className="text-cyan-200" size={20} />
                    <strong className="mt-3 block text-white">{item.student_name}</strong>
                    <p className="mt-1 text-sm leading-6 text-slate-400">Contact request is recorded for recruiter follow-up.</p>
                  </div>
                ))}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="reports">
            <RolePanel id="reports">
              <RoleSectionTitle eyebrow="Hiring Reports" title="Recruiter performance." />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <RoleMetricCard icon={UsersRound} label="Talent Viewed" value={profiles.length} section="talent" />
                <RoleMetricCard icon={Send} label="Requests Sent" value={shortlists.filter((item) => item.contact_requested).length} tone="cyan" section="messages" />
              </div>
            </RolePanel>
          </RoleSection>
        </motion.div>
      )}
    </RoleDashboardShell>
  );
}
