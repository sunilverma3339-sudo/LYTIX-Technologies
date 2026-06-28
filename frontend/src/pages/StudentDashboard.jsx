import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  BadgeCheck,
  BarChart3,
  BellRing,
  BookOpenCheck,
  BriefcaseBusiness,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Download,
  ExternalLink,
  FileCheck2,
  FileQuestion,
  FileText,
  FolderGit2,
  Github,
  Linkedin,
  MessageCircle,
  RefreshCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  CircularProgress,
  DarkButton,
  DarkField,
  DarkPanel,
  DeadlineRow,
  EmptyDark,
  HeroInfo,
  MetricCard,
  Notice,
  PageHero,
  ProgressLine,
  ProjectSignal,
  SectionTitle,
  StudentDashboardShell,
  TextStatCard,
  fadeUp,
} from "../components/StudentDashboardShell.jsx";
import { api, downloadPdf } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const checklistLabels = {
  profile_updated: "Profile updated",
  headline_updated: "Internship headline added",
  post_published: "Completion post published",
  tasks_documented: "Tasks documented",
  certificate_shared: "Certificate shared",
  internship_experience_added: "Internship experience added",
  certificate_added: "Certificate added",
  project_posted: "Project posted",
  company_page_followed: "Company page followed",
};

const timelineStages = ["Applied", "Assessment", "Selected", "Payment", "Offer Letter", "Tasks", "Project", "LinkedIn", "Certificate"];

const statusMap = {
  Test: "Assessment",
  "Final Project": "Project",
  "LinkedIn Update": "LinkedIn",
};

const studentSectionNavigation = {
  Dashboard: "progress",
  Learning: "learning",
  Attendance: "attendance",
  Assignments: "assignments",
  Quizzes: "quizzes",
  Projects: "project",
  Documents: "certificate",
  LinkedIn: "linkedin",
  Placement: "placement",
  Profile: "profile",
  Settings: "settings",
};

export default function StudentDashboard() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [projectUrl, setProjectUrl] = useState("");
  const [activeSection, setActiveSection] = useState("progress");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadDashboard() {
    setError("");
    try {
      const data = await api("/students/dashboard", { token });
      setDashboard(data);
      setProjectUrl(data.application?.final_project_url || "");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const appData = dashboard?.application;
  const checklist = dashboard?.checklist;
  const lms = dashboard?.lms_summary || {};
  const project = dashboard?.project_summary || {};
  const linkedin = dashboard?.linkedin_summary || {};
  const placement = dashboard?.placement_summary || {};
  const tasks = dashboard?.tasks || [];
  const documents = dashboard?.documents || [];
  const jobAlerts = dashboard?.latest_job_alerts || [];

  const currentStage = statusMap[appData?.status] || appData?.status || "Applied";
  const currentStageIndex = Math.max(0, timelineStages.indexOf(currentStage));
  const completion = Math.max(0, Math.min(100, Math.round(Number(lms.internship_progress || 0))));
  const level = completion >= 90 ? "Verified Graduate" : completion >= 65 ? "Pro Intern" : completion >= 35 ? "Builder" : "Explorer";
  const projectScore = project.marks ?? 0;
  const taskCompletion = tasks.length ? Math.round((tasks.filter((task) => ["Completed", "Reviewed", "Done"].includes(task.status)).length / tasks.length) * 100) : 0;
  const projectProgress = project.status === "approved" ? 100 : project.status === "reviewed" ? 82 : project.status === "submitted" ? 62 : projectUrl ? 42 : 16;

  const certificateReady = useMemo(() => {
    if (!appData || !checklist) return false;
    const linkedinDone = Number(linkedin.completion_percentage || 0) >= 100;
    const tasksDone = tasks.length > 0 && tasks.every((task) => ["Completed", "Reviewed", "Done"].includes(task.status));
    return appData.payment_status === "Paid" && project.status === "approved" && tasksDone && linkedinDone;
  }, [appData, checklist, linkedin.completion_percentage, project.status, tasks]);

  const recentActivity = useMemo(() => {
    const rows = [];
    if (appData) rows.push(["Application status", `Current stage moved to ${appData.status}.`, BadgeCheck]);
    if (project.project_title) rows.push(["Project assigned", project.project_title, FolderGit2]);
    if (project.feedback) rows.push(["Mentor feedback", project.feedback, MessageCircle]);
    documents.slice(0, 2).forEach((document) => rows.push(["Document issued", `${document.type} is ${document.status || "active"}.`, FileCheck2]));
    jobAlerts.slice(0, 1).forEach((job) => rows.push(["Job alert", `${job.company_name} is hiring for ${job.role}.`, BellRing]));
    return rows.slice(0, 5);
  }, [appData, documents, jobAlerts, project.feedback, project.project_title]);

  const notifications = [
    project.deadline ? `Final project deadline: ${project.deadline}` : "Final project deadline will appear after assignment.",
    Number(lms.pending_assignments || 0) > 0 ? `${lms.pending_assignments} assignment(s) pending.` : "Assignments are currently on track.",
    Number(linkedin.completion_percentage || 0) < 100 ? "Complete LinkedIn checklist for certificate eligibility." : "LinkedIn workflow completed.",
  ];

  const achievements = [
    ["Payment", appData?.payment_status === "Paid", CreditCard],
    ["Attendance 70%+", Number(lms.attendance_percentage || 0) >= 70, CalendarCheck],
    ["Project", ["submitted", "reviewed", "approved"].includes(project.status), FolderGit2],
    ["LinkedIn", Number(linkedin.completion_percentage || 0) >= 100, Linkedin],
  ];

  function openSection(section) {
    setActiveSection(section);
    window.setTimeout(() => {
      document.querySelector("[data-student-detail-panel]")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  async function runAction(label, action, successMessage) {
    setBusy(label);
    setError("");
    setNotice("");
    try {
      const result = await action();
      setNotice(result?.message || successMessage || "");
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  if (!dashboard) {
    return (
      <StudentDashboardShell>
        <DarkPanel className="grid min-h-[50vh] place-items-center text-center">
          <div>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-300/20 border-t-cyan-300" />
            <h1 className="mt-6 text-2xl font-black">Loading dashboard...</h1>
            {error && <Notice type="error"><span>{error}</span></Notice>}
          </div>
        </DarkPanel>
      </StudentDashboardShell>
    );
  }

  if (!appData) {
    return (
      <StudentDashboardShell>
        <DarkPanel className="mt-8 text-center">
          <Sparkles className="mx-auto text-cyan-200" size={36} />
          <h1 className="mt-5 text-3xl font-black">No application yet</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">Start with an internship domain and submit your first LYTIX application.</p>
          <Link to="/internships" className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20">
            Browse Programs
          </Link>
        </DarkPanel>
      </StudentDashboardShell>
    );
  }

  return (
    <StudentDashboardShell activeSection={activeSection} onSectionSelect={openSection} sectionNavigation={studentSectionNavigation}>
      <motion.div className="grid min-w-0 gap-6" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.07 } } }}>
        <motion.section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]" variants={fadeUp}>
          <PageHero
            eyebrow="Student Dashboard"
            title={`Welcome back, ${dashboard.student.name}`}
            subtitle={dashboard.student.email}
            actions={
              <DarkButton variant="secondary" onClick={loadDashboard}>
                <RefreshCcw size={17} />
                Refresh
              </DarkButton>
            }
          >
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <HeroInfo label="Internship Domain" value={appData.domain.name} onClick={() => openSection("learning")} />
              <HeroInfo label="Internship ID" value={appData.internship_id || `LYTIX-${appData.id}`} onClick={() => openSection("profile")} />
              <HeroInfo label="Current Status" value={appData.status} accent onClick={() => openSection("progress")} />
            </div>
          </PageHero>

          <DarkPanel className="grid place-items-center text-center">
            <CircularProgress value={completion} size={178} stroke={14} />
            <h2 className="mt-5 text-3xl font-black text-white">{completion}% Complete</h2>
            <p className="mt-2 text-sm font-bold text-slate-300">Internship Completion</p>
            <span className="mt-5 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-100">{level}</span>
          </DarkPanel>
        </motion.section>

        {(notice || error) && <Notice type={error ? "error" : "success"}>{notice || error}</Notice>}

        <motion.section className="grid min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]" variants={fadeUp}>
          <MetricCard icon={CalendarCheck} label="Attendance" value={Number(lms.attendance_percentage || 0)} suffix="%" tone="cyan" onClick={() => openSection("attendance")} active={activeSection === "attendance"} />
          <MetricCard icon={BarChart3} label="Progress" value={completion} suffix="%" tone="blue" onClick={() => openSection("progress")} active={activeSection === "progress"} />
          <MetricCard icon={FileText} label="ATS Score" value={Number(placement.ats_score || 0)} suffix="%" tone="indigo" onClick={() => openSection("resume")} active={activeSection === "resume"} />
          <MetricCard icon={FolderGit2} label="Project Score" value={Number(projectScore || 0)} tone="cyan" footer={project.marks == null ? "Pending review" : "Marks"} onClick={() => openSection("project")} active={activeSection === "project"} />
          <MetricCard icon={Linkedin} label="LinkedIn" value={Number(linkedin.completion_percentage || 0)} suffix="%" tone="blue" onClick={() => openSection("linkedin")} active={activeSection === "linkedin"} />
          <TextStatCard icon={BriefcaseBusiness} label="Placement Status" value={placement.placement_status || "Not Started"} footer="Pipeline active" onClick={() => openSection("placement")} active={activeSection === "placement"} />
        </motion.section>

        <motion.section className="grid min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]" variants={fadeUp}>
          <TextStatCard icon={BadgeCheck} label="Internship Status" value={appData.status} footer="Open progress" onClick={() => openSection("progress")} active={activeSection === "progress"} />
          <MetricCard icon={ClipboardList} label="Tasks" value={tasks.length} tone="slate" footer={`${taskCompletion}% complete`} onClick={() => openSection("tasks")} active={activeSection === "tasks"} />
          <MetricCard icon={BookOpenCheck} label="Pending Assignments" value={Number(lms.pending_assignments || 0)} tone="indigo" onClick={() => openSection("assignments")} active={activeSection === "assignments"} />
          <MetricCard icon={FileQuestion} label="Latest Quiz" value={Number(lms.latest_quiz_score || 0)} suffix="%" tone="cyan" onClick={() => openSection("quizzes")} active={activeSection === "quizzes"} />
          <TextStatCard icon={ShieldCheck} label="Certificate" value={certificateReady ? "Eligible" : "Pending"} footer="Open documents" onClick={() => openSection("certificate")} active={activeSection === "certificate"} />
        </motion.section>

        <StudentDetailPanel
          activeSection={activeSection}
          appData={appData}
          certificateReady={certificateReady}
          checklist={checklist}
          completion={completion}
          documents={documents}
          jobAlerts={jobAlerts}
          linkedin={linkedin}
          lms={lms}
          placement={placement}
          project={project}
          projectProgress={projectProgress}
          projectScore={projectScore}
          student={dashboard.student}
          taskCompletion={taskCompletion}
          tasks={tasks}
          timelineStages={timelineStages}
          currentStageIndex={currentStageIndex}
        />

        <motion.section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]" variants={fadeUp}>
          <DarkPanel className="pb-5">
            <SectionTitle eyebrow="Internship timeline" title="Your journey from application to certificate." />
            <TimelineStepper stages={timelineStages} currentIndex={currentStageIndex} />
          </DarkPanel>

          <DarkPanel>
            <SectionTitle eyebrow="Notifications" title="What needs attention." />
            <div className="mt-6 grid gap-3">
              {notifications.map((item) => (
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm font-bold leading-6 text-slate-200" key={item}>
                  <BellRing className="mb-3 text-cyan-200" size={18} />
                  {item}
                </div>
              ))}
            </div>
          </DarkPanel>
        </motion.section>

        <motion.section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]" variants={fadeUp}>
          <DarkPanel id="project">
            <SectionTitle eyebrow="Project area" title={project.project_title || "Final project workspace"} />
            <div className="mt-6 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
              <div>
                <ProgressLine label="Project Progress" value={projectProgress} />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <ProjectSignal icon={Github} label="GitHub Status" value={projectUrl ? "Repository linked" : "Awaiting link"} />
                  <ProjectSignal icon={Calendar} label="Deadline" value={project.deadline || "Not set"} />
                  <ProjectSignal icon={MessageCircle} label="Mentor Feedback" value={project.feedback || "Feedback pending"} />
                  <ProjectSignal icon={Award} label="Project Score" value={project.marks == null ? "Pending" : `${project.marks} marks`} />
                </div>
              </div>
              <form
                className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  runAction("project", () =>
                    api(`/applications/${appData.id}/final-project`, {
                      method: "PATCH",
                      token,
                      body: { final_project_url: projectUrl },
                    })
                  );
                }}
              >
                <label className="grid gap-2 text-sm font-black text-slate-200">
                  Latest Submission
                  <DarkField value={projectUrl} onChange={(event) => setProjectUrl(event.target.value)} placeholder="https://github.com/..." required />
                </label>
                <DarkButton className="mt-4 w-full" disabled={busy === "project"}>
                  <Save size={17} />
                  Save Project Link
                </DarkButton>
              </form>
            </div>
          </DarkPanel>

          <DarkPanel id="linkedin">
            <SectionTitle eyebrow="LinkedIn Growth Tracker" title="Build your public proof." />
            <div className="mt-6 grid gap-6 sm:grid-cols-[150px_1fr] sm:items-center">
              <CircularProgress value={Number(linkedin.completion_percentage || 0)} size={132} stroke={12} />
              <div>
                <h3 className="text-2xl font-black text-white">{linkedin.completion_percentage || 0}% completed</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">Complete every checklist item to improve certificate eligibility and recruiter visibility.</p>
                <a className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15" href={linkedin.add_to_linkedin_url || "https://www.linkedin.com/profile/add"} target="_blank" rel="noreferrer">
                  <Linkedin size={17} />
                  Add to LinkedIn
                </a>
              </div>
            </div>
            <div className="mt-6 grid max-h-80 gap-3 overflow-y-auto pr-1">
              {Object.entries(checklistLabels).map(([key, label]) => (
                <label className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-slate-200" key={key}>
                  <span>{label}</span>
                  <input
                    className="h-5 w-5 accent-cyan-400"
                    type="checkbox"
                    checked={Boolean(checklist?.[key])}
                    onChange={(event) =>
                      runAction(key, () =>
                        api(`/applications/${appData.id}/checklist`, {
                          method: "PATCH",
                          token,
                          body: { [key]: event.target.checked },
                        })
                      )
                    }
                  />
                </label>
              ))}
            </div>
          </DarkPanel>
        </motion.section>

        <motion.section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]" variants={fadeUp}>
          <DarkPanel id="documents">
            <SectionTitle eyebrow="Documents" title="Premium credential center." />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <DocumentCard
                title="Offer Letter"
                status={appData.payment_status === "Paid" ? "Ready" : "Payment required"}
                icon={FileCheck2}
                busy={busy === "offer"}
                onDownload={() =>
                  runAction("offer", () => downloadPdf(`/documents/offer-letter/${appData.id}`, "lytix-offer-letter.pdf", token), "Offer letter downloaded.")
                }
                disabled={appData.payment_status !== "Paid"}
              />
              <DocumentCard
                title="Certificate"
                status={certificateReady ? "Eligible" : "Eligibility pending"}
                icon={ShieldCheck}
                document={findDocument(documents, "certificate")}
                busy={busy === "certificate"}
                onDownload={() =>
                  runAction("certificate", () => downloadPdf(`/documents/certificate/${appData.id}`, "lytix-certificate.pdf", token), "Certificate downloaded.")
                }
                disabled={!certificateReady}
              />
              <DocumentCard title="Experience Letter" status="Issued after completion" icon={FileText} document={findDocument(documents, "experience")} />
              <DocumentCard title="LOR" status="Top performer only" icon={Award} document={findDocument(documents, "lor")} />
            </div>
          </DarkPanel>

          <DarkPanel>
            <SectionTitle eyebrow="Latest jobs" title="Fresh opportunities by domain." />
            <div className="mt-6 grid gap-4">
              {jobAlerts.length === 0 && <EmptyDark message="No job alerts for your domain yet." />}
              {jobAlerts.map((alert) => (
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4" key={alert.id}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">{alert.company_name}</p>
                      <h3 className="mt-2 text-xl font-black text-white">{alert.role}</h3>
                      <p className="mt-2 text-sm font-bold text-slate-400">{alert.location} | {alert.job_type}</p>
                    </div>
                    {alert.apply_link ? (
                      <a className="inline-flex min-h-10 items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-black text-blue-700" href={alert.apply_link} target="_blank" rel="noreferrer">Apply</a>
                    ) : (
                      <Link className="inline-flex min-h-10 items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-black text-blue-700" to="/jobs">Apply</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </DarkPanel>
        </motion.section>

        <motion.section className="grid min-w-0 gap-6 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]" variants={fadeUp}>
          <DarkPanel>
            <SectionTitle eyebrow="Achievements" title="Badges unlocked." />
            <div className="mt-6 grid gap-3">
              {achievements.map(([label, unlocked, Icon]) => (
                <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${unlocked ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.05] text-slate-400"}`} key={label}>
                  <Icon size={19} />
                  <span className="text-sm font-black">{label}</span>
                  <span className="ml-auto text-xs font-black">{unlocked ? "Unlocked" : "Locked"}</span>
                </div>
              ))}
            </div>
          </DarkPanel>

          <DarkPanel>
            <SectionTitle eyebrow="Intern ranking" title="Cohort standing." />
            <div className="mt-6 rounded-3xl border border-cyan-300/30 bg-cyan-300/10 p-5 text-center">
              <Trophy className="mx-auto text-cyan-200" size={36} />
              <strong className="mt-4 block text-4xl font-black text-white">Top {completion >= 80 ? "10" : completion >= 55 ? "25" : "40"}%</strong>
              <span className="mt-2 block text-sm font-bold text-slate-300">Based on progress, tasks, and project signals</span>
            </div>
            <ProgressLine label="Task completion" value={taskCompletion} className="mt-6" />
          </DarkPanel>

          <DarkPanel id="profile">
            <SectionTitle eyebrow="Mentor card" title="Your guidance channel." />
            <div className="mt-6 flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.06] p-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-lg font-black text-white">LM</div>
              <div>
                <h3 className="text-xl font-black text-white">LYTIX Mentor</h3>
                <p className="mt-1 text-sm font-bold text-slate-400">Weekly review and project guidance</p>
              </div>
            </div>
            <Link to="/community" className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15">
              <MessageCircle size={17} />
              Open Community
            </Link>
          </DarkPanel>
        </motion.section>

        <motion.section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]" variants={fadeUp}>
          <DarkPanel>
            <SectionTitle eyebrow="Upcoming deadlines" title="Stay ahead." />
            <div className="mt-6 grid gap-3">
              <DeadlineRow icon={FolderGit2} label="Final project" value={project.deadline || "Not scheduled"} />
              <DeadlineRow icon={ClipboardList} label="Pending assignments" value={`${lms.pending_assignments || 0} pending`} />
              <DeadlineRow icon={Linkedin} label="LinkedIn completion" value={`${linkedin.completion_percentage || 0}% done`} />
            </div>
          </DarkPanel>
          <DarkPanel id="settings">
            <SectionTitle eyebrow="Recent activity" title="What changed recently." />
            <div className="mt-6 grid gap-3">
              {recentActivity.length === 0 && <EmptyDark message="No recent activity yet." />}
              {recentActivity.map(([label, copy, Icon]) => (
                <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4" key={`${label}-${copy}`}>
                  <Icon className="mt-1 text-cyan-200" size={19} />
                  <div>
                    <h3 className="text-sm font-black text-white">{label}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </DarkPanel>
        </motion.section>
      </motion.div>
    </StudentDashboardShell>
  );
}

function StudentDetailPanel({
  activeSection,
  appData,
  certificateReady,
  checklist,
  completion,
  documents,
  jobAlerts,
  linkedin,
  lms,
  placement,
  project,
  projectProgress,
  projectScore,
  student,
  taskCompletion,
  tasks,
  timelineStages,
  currentStageIndex,
}) {
  const meta = {
    progress: ["Internship Progress", "Your current workflow stage and eligibility signals."],
    attendance: ["Attendance Details", "Attendance readiness for certificate eligibility."],
    resume: ["Resume Tools", "ATS score, recruiter readiness, and resume improvement path."],
    project: ["Project Submission", "Final project status, marks, deadline, and review feedback."],
    linkedin: ["LinkedIn Workflow", "Checklist completion for public proof and certificate eligibility."],
    placement: ["Placement Cell", "Placement status and latest matching job alerts."],
    tasks: ["Task List", "Assigned internship tasks and completion status."],
    learning: ["Learning Materials", "Weekly learning progress and LMS next actions."],
    assignments: ["Assignments", "Weekly assignment completion and review readiness."],
    quizzes: ["Quiz Results", "Latest quiz score and learning performance summary."],
    certificate: ["Certificate Section", "Document eligibility and verification-ready credentials."],
    profile: ["Profile Snapshot", "Your student identity, domain, and internship profile signals."],
    settings: ["Dashboard Settings", "Account actions and support shortcuts for your workspace."],
  };
  const [title, copy] = meta[activeSection] || meta.progress;

  return (
    <motion.section variants={fadeUp}>
      <DarkPanel data-student-detail-panel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle eyebrow="Action Center" title={title} copy={copy} />
          <span className="w-fit rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-100">
            {activeSection}
          </span>
        </div>
        <motion.div
          key={activeSection}
          className="mt-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {activeSection === "progress" && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
              <div>
                <TimelineStepper stages={timelineStages} currentIndex={currentStageIndex} />
              </div>
              <div className="grid gap-3">
                <ProjectSignal icon={BadgeCheck} label="Current Stage" value={appData.status} />
                <ProjectSignal icon={CreditCard} label="Payment" value={appData.payment_status || "Pending"} />
                <ProjectSignal icon={BarChart3} label="Internship Progress" value={`${completion}%`} />
              </div>
            </div>
          )}

          {activeSection === "attendance" && (
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.6fr)]">
              <div>
                <ProgressLine label="Attendance Percentage" value={Number(lms.attendance_percentage || 0)} />
                <p className="mt-4 text-sm font-bold leading-6 text-slate-300">
                  Certificate eligibility requires at least 70% attendance. Your attendance is tracked from marked internship sessions.
                </p>
              </div>
              <ProjectSignal icon={CalendarCheck} label="Eligibility Signal" value={Number(lms.attendance_percentage || 0) >= 70 ? "Attendance eligible" : "Needs improvement"} />
            </div>
          )}

          {activeSection === "learning" && (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.55fr)]">
              <div>
                <ProgressLine label="Learning Progress" value={Number(lms.learning_progress || completion)} />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <ProjectSignal icon={BookOpenCheck} label="Domain" value={appData.domain.name} />
                  <ProjectSignal icon={ClipboardList} label="Pending Assignments" value={lms.pending_assignments || 0} />
                  <ProjectSignal icon={CheckCircle2} label="Completed Assignments" value={lms.completed_assignments || 0} />
                  <ProjectSignal icon={FileQuestion} label="Latest Quiz" value={`${lms.latest_quiz_score || 0}%`} />
                </div>
              </div>
              <Link to="/learning#learning" className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5">
                <BookOpenCheck size={17} />
                Open Learning Page
              </Link>
            </div>
          )}

          {activeSection === "resume" && (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.55fr)]">
              <div>
                <ProgressLine label="ATS Score" value={Number(placement.ats_score || 0)} />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <ProjectSignal icon={FileText} label="Resume Review" value={placement.resume_feedback ? "Feedback received" : "Ready for review"} />
                  <ProjectSignal icon={Github} label="Portfolio Evidence" value={placement.github_url ? "GitHub connected" : "Add GitHub link"} />
                </div>
              </div>
              <Link to="/resume" className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5">
                <FileText size={17} />
                Open Resume Tools
              </Link>
            </div>
          )}

          {activeSection === "project" && (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.55fr)]">
              <div>
                <ProgressLine label="Project Progress" value={projectProgress} />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <ProjectSignal icon={FolderGit2} label="Project" value={project.project_title || "Awaiting assignment"} />
                  <ProjectSignal icon={Calendar} label="Deadline" value={project.deadline || "Not scheduled"} />
                  <ProjectSignal icon={MessageCircle} label="Mentor Feedback" value={project.feedback || "Feedback pending"} />
                  <ProjectSignal icon={Award} label="Marks" value={projectScore == null ? "Pending" : projectScore} />
                </div>
              </div>
              <Link to="/project" className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5">
                <FolderGit2 size={17} />
                Open Project Workspace
              </Link>
            </div>
          )}

          {activeSection === "linkedin" && (
            <div className="grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)_auto] lg:items-start">
              <CircularProgress value={Number(linkedin.completion_percentage || 0)} size={150} stroke={12} />
              <div className="grid gap-2">
                {Object.entries(checklistLabels).slice(0, 6).map(([key, label]) => (
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-bold text-slate-200" key={key}>
                    <span>{label}</span>
                    <span className={checklist?.[key] ? "text-cyan-100" : "text-slate-500"}>{checklist?.[key] ? "Done" : "Pending"}</span>
                  </div>
                ))}
              </div>
              <Link to="/linkedin" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5">
                <Linkedin size={17} />
                Open LinkedIn Page
              </Link>
            </div>
          )}

          {activeSection === "placement" && (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.6fr)]">
              <div className="grid gap-3">
                <ProjectSignal icon={BriefcaseBusiness} label="Placement Status" value={placement.placement_status || "Not Started"} />
                <ProjectSignal icon={BarChart3} label="ATS Score" value={`${placement.ats_score || 0}%`} />
                <ProjectSignal icon={BellRing} label="Latest Alerts" value={`${jobAlerts.length} visible`} />
              </div>
              <div className="grid gap-3">
                {jobAlerts.slice(0, 2).map((job) => (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={job.id}>
                    <h3 className="text-sm font-black text-white">{job.company_name}</h3>
                    <p className="mt-1 text-sm font-bold text-slate-400">{job.role}</p>
                  </div>
                ))}
                {jobAlerts.length === 0 && <EmptyDark message="No matching job alerts yet. New alerts will appear by internship domain." />}
                <Link to="/placement" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15">
                  Open Placement Cell
                </Link>
              </div>
            </div>
          )}

          {activeSection === "tasks" && (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.55fr)]">
              <div className="grid gap-3">
                {tasks.length === 0 && <EmptyDark message="No tasks assigned yet. Assigned tasks will appear here with due dates and review status." />}
                {tasks.map((task) => (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={task.id || task.title}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-base font-black text-white">{task.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-400">{task.description || "Task details available in your learning workspace."}</p>
                      </div>
                      <span className="w-fit rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">{task.status || "Assigned"}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <ProgressLine label="Task Completion" value={taskCompletion} />
              </div>
            </div>
          )}

          {activeSection === "assignments" && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <ProjectSignal icon={ClipboardList} label="Pending Assignments" value={lms.pending_assignments || 0} />
              <ProjectSignal icon={CheckCircle2} label="Completed Assignments" value={lms.completed_assignments || 0} />
              <Link to="/learning#assignments" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5">
                Open Assignments
              </Link>
            </div>
          )}

          {activeSection === "quizzes" && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <ProjectSignal icon={FileQuestion} label="Latest Quiz Score" value={`${lms.latest_quiz_score || 0}%`} />
              <ProjectSignal icon={BookOpenCheck} label="Learning Progress" value={`${lms.learning_progress || 0}%`} />
              <Link to="/learning#quizzes" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5">
                Open Quizzes
              </Link>
            </div>
          )}

          {activeSection === "certificate" && (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.55fr)]">
              <div className="grid gap-3 sm:grid-cols-2">
                <ProjectSignal icon={CreditCard} label="Payment" value={appData.payment_status || "Pending"} />
                <ProjectSignal icon={CalendarCheck} label="Attendance" value={`${lms.attendance_percentage || 0}%`} />
                <ProjectSignal icon={FolderGit2} label="Project" value={project.status || "Pending"} />
                <ProjectSignal icon={Linkedin} label="LinkedIn" value={`${linkedin.completion_percentage || 0}%`} />
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                <ShieldCheck className={certificateReady ? "text-cyan-200" : "text-slate-500"} size={28} />
                <h3 className="mt-4 text-xl font-black text-white">{certificateReady ? "Certificate eligible" : "Eligibility in progress"}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {documents.length ? `${documents.length} document(s) are available in your wallet.` : "Issued documents will appear in your wallet after generation."}
                </p>
                <Link to="/documents" className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5">
                  Open Documents
                </Link>
              </div>
            </div>
          )}

          {activeSection === "profile" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ProjectSignal icon={BadgeCheck} label="Student" value={student?.name || "LYTIX Student"} />
              <ProjectSignal icon={FileText} label="Email" value={student?.email || "Email unavailable"} />
              <ProjectSignal icon={BookOpenCheck} label="Domain" value={appData.domain.name} />
              <ProjectSignal icon={BadgeCheck} label="Internship ID" value={appData.internship_id || `LYTIX-${appData.id}`} />
            </div>
          )}

          {activeSection === "settings" && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                <h3 className="text-base font-black text-white">Dashboard refresh</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">Use the top refresh button after submitting projects, documents, or LinkedIn checklist updates.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                <h3 className="text-base font-black text-white">Account access</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">JWT authentication is active and your workspace remains role-protected.</p>
              </div>
              <Link to="/support" className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15">
                Open Support
              </Link>
            </div>
          )}
        </motion.div>
      </DarkPanel>
    </motion.section>
  );
}

function DocumentCard({ title, status, icon: Icon, document, onDownload, disabled, busy }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
      <div className="flex items-start justify-between gap-4">
        <Icon className="text-cyan-200" size={24} />
        <span className={`rounded-full px-3 py-1 text-xs font-black ${document ? "bg-cyan-300/10 text-cyan-100" : "bg-white/10 text-slate-300"}`}>
          {document?.status || status}
        </span>
      </div>
      <h3 className="mt-5 text-xl font-black text-white">{title}</h3>
      <p className="mt-2 min-h-10 text-sm leading-6 text-slate-400">{document?.document_number || "Verification status will appear after issue."}</p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {onDownload ? (
          <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-black text-blue-700 disabled:opacity-50" disabled={disabled || busy} onClick={onDownload} type="button">
            <Download size={16} />
            Download
          </button>
        ) : (
          <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-black text-slate-400" disabled type="button">
            <Download size={16} />
            Download
          </button>
        )}
        {document?.verification_code ? (
          <Link className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm font-black text-cyan-100" to={`/verify/${document.verification_code}`}>
            <ExternalLink size={16} />
            View
          </Link>
        ) : (
          <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-black text-slate-400" disabled type="button">
            View
          </button>
        )}
      </div>
    </div>
  );
}

function TimelineStepper({ stages, currentIndex }) {
  const progress = Math.max(0, Math.min(1, currentIndex / Math.max(stages.length - 1, 1)));

  return (
    <div className="mt-5 max-w-full overflow-x-auto overflow-y-hidden pb-1 [scrollbar-width:thin] [scrollbar-color:rgba(103,232,249,0.35)_rgba(255,255,255,0.08)]">
      <div className="relative flex w-max max-w-none gap-3 pr-2">
        <div className="absolute left-14 right-14 top-[29px] h-0.5 rounded-full bg-white/10" />
        <div className="absolute left-14 right-14 top-[29px] h-0.5 overflow-hidden rounded-full">
          <motion.span
            className="block h-full origin-left rounded-full bg-gradient-to-r from-blue-500 to-cyan-300"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        {stages.map((stage, index) => {
          const active = index === currentIndex;
          const done = index < currentIndex;
          const upcoming = !active && !done;

          return (
            <motion.div
              className={`relative z-10 flex min-h-[116px] w-[136px] shrink-0 flex-col rounded-2xl border p-3 transition sm:w-[148px] ${
                active
                  ? "border-cyan-300/70 bg-cyan-300/15 shadow-[0_0_42px_rgba(6,182,212,0.22)]"
                  : done
                    ? "border-blue-400/35 bg-gradient-to-br from-blue-600/25 to-cyan-400/10"
                    : "border-white/10 bg-white/[0.045]"
              }`}
              key={stage}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: Math.min(index * 0.035, 0.24), ease: "easeOut" }}
              whileHover={{ y: -5, boxShadow: active ? "0 0 46px rgba(6,182,212,0.28)" : "0 18px 45px rgba(37,99,235,0.16)" }}
              whileTap={{ scale: 0.985 }}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black ring-4 ${
                  active
                    ? "bg-cyan-300 text-slate-950 ring-cyan-300/15"
                    : done
                      ? "bg-gradient-to-br from-blue-500 to-cyan-400 text-white ring-blue-500/15"
                      : "bg-white/10 text-slate-400 ring-white/5"
                }`}
              >
                {done ? <CheckCircle2 size={16} /> : index + 1}
              </span>
              <h3 className={`mt-3 min-h-[32px] text-[12px] font-black leading-tight sm:text-[13px] ${upcoming ? "text-slate-300" : "text-white"}`}>
                {stage}
              </h3>
              <p className={`mt-auto pt-2 text-[10px] font-black uppercase tracking-[0.12em] ${active ? "text-cyan-100" : done ? "text-blue-100" : "text-slate-500"}`}>
                {active ? "Current" : done ? "Completed" : "Upcoming"}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function findDocument(documents, type) {
  return documents.find((document) => String(document.type || "").toLowerCase().includes(type));
}
