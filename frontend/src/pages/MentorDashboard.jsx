import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FolderGit2,
  LayoutDashboard,
  LifeBuoy,
  MessageCircle,
  Presentation,
  Star,
  UserCheck,
  UsersRound,
} from "lucide-react";

import {
  RoleBadge,
  RoleButton,
  RoleDashboardShell,
  RoleEmpty,
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

const mentorNavItems = [
  { label: "Overview", href: "#overview", icon: LayoutDashboard },
  { label: "My Students", href: "#students", icon: UsersRound },
  { label: "Tasks", href: "#tasks", icon: ClipboardList },
  { label: "Assignments", href: "#assignments", icon: ClipboardCheck },
  { label: "Project Reviews", href: "#projects", icon: FolderGit2 },
  { label: "Attendance", href: "#attendance", icon: CalendarCheck },
  { label: "Feedback", href: "#feedback", icon: MessageCircle },
  { label: "Meetings", href: "#meetings", icon: CalendarClock },
  { label: "Performance", href: "#performance", icon: BarChart3 },
  { label: "Support", href: "/support", icon: LifeBuoy },
];

const sampleTeams = [
  {
    id: 1,
    name: "Team Alpha",
    domain_name: "Python Development",
    mentor_name: "Sana Mentor",
    lead_student_name: "Aarav Sharma",
    member_count: 3,
    members: [
      { id: 1, name: "Aarav Sharma", email: "student@lytix.tech" },
      { id: 2, name: "Nisha Patel", email: "nisha@lytix.tech" },
      { id: 3, name: "Karan Mehta", email: "karan@lytix.tech" },
    ],
  },
];

const sampleReviews = [
  ["Assignment Review", "Week 2 portfolio task", "Aarav Sharma", "Pending"],
  ["Project Feedback", "AI Resume Builder", "Nisha Patel", "Needs feedback"],
  ["Attendance Review", "Weekly cohort attendance", "Team Alpha", "Monitor"],
];

export default function MentorDashboard() {
  const { token } = useAuth();
  const [teams, setTeams] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const teamRows = await api("/teams", { token });
      setTeams(teamRows.length ? teamRows : sampleTeams);
      const progressRows = await Promise.all(
        (teamRows.length ? teamRows : sampleTeams).map((team) =>
          api(`/teams/${team.id}/progress`, { token }).catch(() => ({
            team,
            average_progress: 68,
            members: team.members || [],
          }))
        )
      );
      const next = {};
      progressRows.forEach((row) => {
        next[row.team.id] = row;
      });
      setProgress(next);
    } catch (err) {
      setTeams(sampleTeams);
      setProgress({ 1: { team: sampleTeams[0], average_progress: 68, members: sampleTeams[0].members } });
      setError(`${err.message}. Showing mentor sample data where needed.`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const assignedStudents = useMemo(() => {
    const seen = new Map();
    teams.forEach((team) => {
      (team.members || []).forEach((member) => seen.set(member.id || member.email, { ...member, team: team.name, domain: team.domain_name }));
    });
    return Array.from(seen.values());
  }, [teams]);

  const averageProgress = teams.length
    ? Math.round(teams.reduce((sum, team) => sum + Number(progress[team.id]?.average_progress || 0), 0) / teams.length)
    : 0;
  const pendingReviews = sampleReviews.filter((row) => row[3] !== "Reviewed").length;
  const attendanceAverage = Math.max(72, Math.min(96, averageProgress + 14));

  return (
    <RoleDashboardShell
      roleLabel="LYTIX Mentor OS"
      title="Mentor Dashboard"
      subtitle="Guide students, assign tasks, review projects, and monitor cohort progress."
      navItems={mentorNavItems}
      actions={<RoleRefreshButton onClick={load} disabled={loading} />}
    >
      {loading && teams.length === 0 ? (
        <RolePanel className="grid min-h-[50vh] place-items-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-300/20 border-t-cyan-300" /></RolePanel>
      ) : (
        <motion.div className="grid min-w-0 gap-6" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <RoleHero
            eyebrow="Mentor dashboard"
            title="Cohort guidance and review workspace."
            subtitle="Track assigned students, review assignments, guide projects, monitor attendance, and keep mentorship meetings organized."
            chips={[
              { label: "Mentorship", section: "students" },
              { label: "Project Reviews", section: "projects" },
              { label: "Attendance", section: "attendance" },
              { label: "Meetings", section: "meetings" },
            ]}
          >
            <div className="grid min-w-[240px] gap-4 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <RoleProgressBar label="Average Student Progress" value={averageProgress} section="performance" />
              <RoleProgressBar label="Attendance Average" value={attendanceAverage} section="attendance" />
            </div>
          </RoleHero>

          {error && <RoleNotice type="error">{error}</RoleNotice>}

          <RoleSection id="overview" className="[grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            <RoleMetricCard icon={UsersRound} label="Assigned Students" value={assignedStudents.length} section="students" />
            <RoleMetricCard icon={ClipboardCheck} label="Pending Reviews" value={pendingReviews} tone="cyan" section="assignments" />
            <RoleMetricCard icon={ClipboardList} label="Tasks Assigned" value="12" section="tasks" />
            <RoleMetricCard icon={CalendarCheck} label="Attendance Average" value={`${attendanceAverage}%`} tone="indigo" section="attendance" />
            <RoleMetricCard icon={FolderGit2} label="Project Submissions" value="5" tone="slate" section="projects" />
          </RoleSection>

          <RoleSection id="students">
            <RolePanel id="students">
              <RoleSectionTitle eyebrow="Student Progress Tracker" title="Assigned students and team progress." />
              <div className="mt-6 grid gap-3">
                {assignedStudents.length === 0 && <RoleEmpty message="No students assigned yet." />}
                {assignedStudents.map((student, index) => (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={`${student.email}-${index}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-black text-white">{student.name}</h3>
                        <p className="mt-1 text-sm font-bold text-slate-400">{student.domain || "Domain"} | {student.team}</p>
                      </div>
                      <RoleBadge>{index === 0 ? "Team Lead" : "Member"}</RoleBadge>
                    </div>
                    <div className="mt-4">
                      <RoleProgressBar label="Internship progress" value={70 + (index * 7) % 24} />
                    </div>
                  </div>
                ))}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="attendance">
            <RolePanel id="attendance">
              <RoleSectionTitle eyebrow="Attendance Monitor" title="Cohort attendance signals." />
              <div className="mt-6 grid gap-4">
                {teams.map((team) => (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={team.id}>
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-white">{team.name}</strong>
                      <RoleBadge tone="green">{attendanceAverage}%</RoleBadge>
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-400">{team.domain_name || "Cross-domain"}</p>
                    <div className="mt-4">
                      <RoleProgressBar label="Average attendance" value={attendanceAverage} />
                    </div>
                  </div>
                ))}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="assignments">
            <RolePanel id="assignments">
              <RoleSectionTitle eyebrow="Assignment Review Queue" title="Weekly reviews." />
              <ReviewList rows={sampleReviews.filter((row) => row[0] !== "Project Feedback")} />
            </RolePanel>
          </RoleSection>

          <RoleSection id="projects">
            <RolePanel id="projects">
              <RoleSectionTitle eyebrow="Project Feedback Panel" title="Final project reviews." />
              <ReviewList rows={sampleReviews.filter((row) => row[0] === "Project Feedback")} />
              <div className="mt-6 rounded-3xl border border-cyan-300/30 bg-cyan-300/10 p-5">
                <FolderGit2 className="text-cyan-200" size={28} />
                <h3 className="mt-4 text-xl font-black text-white">Review rubric</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">Check GitHub, documentation, demo video, deployment quality, and problem-solving clarity before marking approved.</p>
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="tasks">
            <RolePanel id="tasks">
              <RoleSectionTitle eyebrow="Tasks" title="Task assignment board." />
              <div className="mt-6 grid gap-3">
                {["Weekly build task", "Portfolio update", "Project milestone", "Mentor review note"].map((task, index) => (
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={task}>
                    <CheckCircle2 className={index < 2 ? "text-cyan-200" : "text-slate-500"} size={19} />
                    <span className="text-sm font-black text-slate-200">{task}</span>
                  </div>
                ))}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="feedback">
            <RolePanel id="feedback">
              <RoleSectionTitle eyebrow="Feedback" title="Mentor notes." />
              <div className="mt-6 grid gap-3">
                {["Improve README clarity", "Add screenshots to demo", "Refine API error handling"].map((note) => (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={note}>
                    <MessageCircle className="text-cyan-200" size={20} />
                    <p className="mt-3 text-sm font-bold leading-6 text-slate-300">{note}</p>
                  </div>
                ))}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="meetings">
            <RolePanel id="meetings">
              <RoleSectionTitle eyebrow="Meetings" title="Mentor meeting schedule." />
              <div className="mt-6 grid gap-3">
                {["Monday 6:00 PM - Team Alpha", "Wednesday 7:00 PM - Project Review", "Friday 5:30 PM - Feedback Circle"].map((meeting) => (
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={meeting}>
                    <Presentation className="text-cyan-200" size={19} />
                    <span className="text-sm font-black text-slate-200">{meeting}</span>
                  </div>
                ))}
              </div>
            </RolePanel>
          </RoleSection>

          <RoleSection id="performance">
            <RolePanel id="performance">
              <RoleSectionTitle eyebrow="Performance" title="Student performance analytics." />
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <RoleMetricCard icon={BarChart3} label="Average Progress" value={`${averageProgress}%`} section="students" />
                <RoleMetricCard icon={CalendarCheck} label="Attendance" value={`${attendanceAverage}%`} tone="cyan" section="attendance" />
                <RoleMetricCard icon={ClipboardCheck} label="Pending Reviews" value={pendingReviews} tone="indigo" section="assignments" />
              </div>
            </RolePanel>
          </RoleSection>
        </motion.div>
      )}
    </RoleDashboardShell>
  );
}

function ReviewList({ rows }) {
  return (
    <div className="mt-6 grid gap-3">
      {rows.length === 0 && <RoleEmpty message="No reviews pending in this queue." />}
      {rows.map(([type, title, student, status]) => (
        <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={`${type}-${title}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <RoleBadge>{type}</RoleBadge>
              <h3 className="mt-3 truncate text-xl font-black text-white">{title}</h3>
              <p className="mt-1 text-sm font-bold text-slate-400">{student}</p>
            </div>
            <RoleBadge tone="amber">{status}</RoleBadge>
          </div>
          <RoleButton className="mt-4 w-full sm:w-auto" variant="secondary" type="button">
            <Star size={17} />
            Open Review
          </RoleButton>
        </div>
      ))}
    </div>
  );
}
