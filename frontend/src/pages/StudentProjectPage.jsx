import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Calendar,
  ClipboardCheck,
  ExternalLink,
  FolderGit2,
  Github,
  Link2,
  Presentation,
  RefreshCcw,
  SendHorizonal,
  Video,
} from "lucide-react";

import {
  DarkButton,
  DarkField,
  DarkPanel,
  EmptyDark,
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
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const emptyLinks = {
  github_link: "",
  documentation_link: "",
  ppt_link: "",
  demo_video_link: "",
};

export default function StudentProjectPage() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState(null);
  const [links, setLinks] = useState(emptyLinks);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [dashboardData, projectList, projectStatus] = await Promise.all([
        api("/students/dashboard", { token }),
        api("/projects/me", { token }),
        api("/projects/status/me", { token }),
      ]);
      setDashboard(dashboardData);
      setProjects(projectList);
      setStatus(projectStatus);
      const firstProject = projectList[0];
      setSelectedProjectId(String(firstProject?.id || ""));
      const submittedProject = projectList.find((project) => project.submission_id) || firstProject;
      setLinks({
        github_link: submittedProject?.github_link || "",
        documentation_link: submittedProject?.documentation_link || "",
        ppt_link: submittedProject?.ppt_link || "",
        demo_video_link: submittedProject?.demo_video_link || "",
      });
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
      await api("/projects/submit", {
        method: "POST",
        token,
        body: { project_id: Number(selectedProjectId), ...links },
      });
      setNotice("Project submitted for review.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === String(selectedProjectId)) || projects[0],
    [projects, selectedProjectId]
  );

  const application = dashboard?.application;
  const projectProgress = status?.project_status === "approved" ? 100 : status?.project_status === "reviewed" ? 82 : status?.project_status === "submitted" ? 62 : links.github_link ? 42 : 16;

  if (loading) {
    return (
      <StudentDashboardShell title="Project Workspace" badge="Projects">
        <DarkPanel className="grid min-h-[50vh] place-items-center text-center">
          <div>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-300/20 border-t-cyan-300" />
            <h1 className="mt-6 text-2xl font-black">Loading project workspace...</h1>
            {error && <Notice type="error">{error}</Notice>}
          </div>
        </DarkPanel>
      </StudentDashboardShell>
    );
  }

  return (
    <StudentDashboardShell title="Project Workspace" badge="Final Project">
      <motion.div className="grid gap-6" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.07 } } }}>
        <PageHero
          eyebrow="Student Project"
          title="Final project workspace."
          subtitle={application ? `${application.domain.name} - ${dashboard?.student?.email}` : dashboard?.student?.email}
          actions={
            <DarkButton variant="secondary" onClick={load}>
              <RefreshCcw size={17} />
              Refresh
            </DarkButton>
          }
        />

        {(notice || error) && <Notice type={error ? "error" : "success"}>{notice || error}</Notice>}

        <motion.section id="status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" variants={fadeUp}>
          <TextStatCard icon={ClipboardCheck} label="Project Status" value={status?.project_status || "not submitted"} footer="Review pipeline" />
          <TextStatCard icon={BadgeCheck} label="Marks" value={status?.marks ?? "Pending"} />
          <TextStatCard icon={Calendar} label="Deadline" value={status?.deadline || "Not set"} />
          <MetricCard icon={FolderGit2} label="Project Progress" value={projectProgress} suffix="%" tone="cyan" />
        </motion.section>

        <motion.section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]" variants={fadeUp}>
          <DarkPanel id="project">
            <SectionTitle eyebrow="Assigned Project" title={selectedProject?.title || "No project assigned yet."} copy="Choose your assigned project and review requirements before submitting artifacts." />
            {projects.length === 0 ? (
              <div className="mt-6"><EmptyDark message="No project assigned for your domain yet." /></div>
            ) : (
              <div className="mt-6 grid gap-5">
                <label className="grid gap-2 text-sm font-black text-slate-200">
                  Project
                  <DarkField as="select" value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
                    {projects.map((project) => (
                      <option className="bg-slate-950 text-white" key={project.id} value={project.id}>{project.title}</option>
                    ))}
                  </DarkField>
                </label>
                {selectedProject && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                    <div className="grid gap-5 xl:grid-cols-[1fr_auto]">
                      <div>
                        <strong className="block text-xl text-white">{selectedProject.title}</strong>
                        <span className="mt-2 block text-sm leading-6 text-slate-300">{selectedProject.description}</span>
                        <p className="mt-4 text-sm font-bold text-slate-400">Requirements: {selectedProject.requirements}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">Deadline {selectedProject.deadline || "N/A"}</span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300">{selectedProject.difficulty}</span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300">Max {selectedProject.max_marks} marks</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DarkPanel>

          <DarkPanel>
            <SectionTitle eyebrow="Project Progress" title="Submission readiness." />
            <div className="mt-6">
              <ProgressLine label="Project Progress" value={projectProgress} />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <ProjectSignal icon={Github} label="GitHub Status" value={links.github_link ? "Repository linked" : "Missing"} />
              <ProjectSignal icon={Calendar} label="Deadline" value={status?.deadline || selectedProject?.deadline || "Not set"} />
              <ProjectSignal icon={BadgeCheck} label="Review Status" value={status?.project_status || "Not submitted"} />
              <ProjectSignal icon={ClipboardCheck} label="Marks" value={status?.marks ?? "Pending"} />
            </div>
          </DarkPanel>
        </motion.section>

        <DarkPanel id="submit">
          <SectionTitle eyebrow="Submit Project Links" title="Upload your final artifacts." copy="Submit GitHub, documentation, PPT, and demo links for admin or mentor review." />
          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={submit}>
            <label className="grid gap-2 text-sm font-black text-slate-200">
              GitHub link
              <DarkField value={links.github_link} onChange={(event) => setLinks({ ...links, github_link: event.target.value })} required />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-200">
              Documentation link
              <DarkField value={links.documentation_link} onChange={(event) => setLinks({ ...links, documentation_link: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-200">
              PPT link
              <DarkField value={links.ppt_link} onChange={(event) => setLinks({ ...links, ppt_link: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-200">
              Demo video link
              <DarkField value={links.demo_video_link} onChange={(event) => setLinks({ ...links, demo_video_link: event.target.value })} />
            </label>
            <DarkButton className="md:col-span-2" disabled={busy || !selectedProjectId}>
              <SendHorizonal size={18} />
              {busy ? "Submitting..." : "Submit project"}
            </DarkButton>
          </form>
        </DarkPanel>

        <DarkPanel>
          <SectionTitle eyebrow="Submitted Artifacts" title="Links attached to your project." />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Artifact icon={FolderGit2} label="GitHub" url={links.github_link} />
            <Artifact icon={Link2} label="Documentation" url={links.documentation_link} />
            <Artifact icon={Presentation} label="PPT" url={links.ppt_link} />
            <Artifact icon={Video} label="Demo Video" url={links.demo_video_link} />
          </div>
        </DarkPanel>
      </motion.div>
    </StudentDashboardShell>
  );
}

function Artifact({ icon: Icon, label, url }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
      <Icon className="text-cyan-200" size={22} />
      <span className="mt-4 block text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</span>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-black text-cyan-200">
          Open link
          <ExternalLink size={15} />
        </a>
      ) : (
        <strong className="mt-3 block text-xl font-black text-white">Missing</strong>
      )}
    </div>
  );
}
