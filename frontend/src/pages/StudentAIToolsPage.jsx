import React, { useEffect, useState } from "react";
import {
  BadgeCheck,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  Code2,
  FileText,
  FolderGit2,
  LayoutDashboard,
  Lightbulb,
  MessagesSquare,
  RefreshCcw,
  Route,
  SendHorizonal,
  Sparkles,
} from "lucide-react";

import DashboardShell from "../components/DashboardShell.jsx";
import GlassPanel from "../components/GlassPanel.jsx";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const navItems = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Domain AI", href: "#recommend", icon: Sparkles },
  { label: "Resume AI", href: "#resume", icon: FileText },
  { label: "Roadmap", href: "#roadmap", icon: Route },
  { label: "Interview", href: "#interview", icon: MessagesSquare },
  { label: "Project Review", href: "#project-review", icon: FolderGit2 },
  { label: "Code Assistant", href: "#coding", icon: Code2 },
];

const defaultProjectForm = {
  github_link: "",
  documentation_link: "",
  demo_video_link: "",
  readme_text: "",
};

export default function StudentAIToolsPage() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [domains, setDomains] = useState([]);
  const [domainId, setDomainId] = useState("");
  const [recommendForm, setRecommendForm] = useState({ skills: "", branch: "", interests: "", career_goal: "" });
  const [resumeForm, setResumeForm] = useState({ resume_text: "", resume_url: "" });
  const [interviewType, setInterviewType] = useState("Technical Interview");
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [interviewAnswers, setInterviewAnswers] = useState([]);
  const [projectForm, setProjectForm] = useState(defaultProjectForm);
  const [codeForm, setCodeForm] = useState({ language: "javascript", code: "" });
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [dashboardData, domainList] = await Promise.all([
        api("/students/dashboard", { token }),
        api("/domains", { token }),
      ]);
      const application = dashboardData.application;
      const appDomainId = application?.domain?.id || domainList[0]?.id || "";
      const appSkills = application?.skills || application?.domain?.skills?.join(", ") || "";
      const submission = application?.project_submission || {};
      setDashboard(dashboardData);
      setDomains(domainList);
      setDomainId(String(appDomainId));
      setRecommendForm({
        skills: appSkills,
        branch: "",
        interests: application?.domain?.name || "",
        career_goal: "Build a portfolio and get shortlisted for entry-level roles",
      });
      setResumeForm({
        resume_text: `${appSkills} ${application?.domain?.name || ""} internship project GitHub documentation`,
        resume_url: dashboardData.placement_summary?.resume_url || "",
      });
      setProjectForm({
        github_link: submission.github_link || application?.final_project_url || "",
        documentation_link: submission.documentation_link || "",
        demo_video_link: submission.demo_video_link || "",
        readme_text: "Features, setup, usage, API flow, screenshots, test notes, and deployment details.",
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

  async function run(key, action, successMessage) {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      const result = await action();
      setResults((current) => ({ ...current, [key]: result }));
      setNotice(successMessage);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  function patchAnswer(index, value) {
    setInterviewAnswers((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  }

  if (loading) {
    return (
      <main className="page-shell">
        <section className="section-band">
          <div className="loader-panel">Loading AI tools...</div>
          {error && <div className="error-panel mt-4">{error}</div>}
        </section>
      </main>
    );
  }

  const currentDomain = domains.find((domain) => String(domain.id) === String(domainId));
  const recommendation = results.recommend;
  const resume = results.resume;
  const roadmap = results.roadmap;
  const interview = results.interviewSubmit;
  const projectReview = results.projectReview;
  const codeResult = results.code;

  return (
    <DashboardShell
      eyebrow="AI Tools"
      title="Smart career assistant."
      subtitle="Rule-based local AI helpers for recommendations, resumes, interviews, projects, and code."
      navItems={navItems}
      actions={<button className="btn-secondary" onClick={load}><RefreshCcw size={17} />Refresh</button>}
    >
      {notice && <div className="success-panel mt-6">{notice}</div>}
      {error && <div className="error-panel mt-6">{error}</div>}

      <div className="dashboard-card-grid">
        <StatCard icon={Sparkles} label="Recommended Match" value={recommendation ? `${recommendation.match_percentage}%` : "Run"} />
        <StatCard icon={BarChart3} label="Resume ATS" value={resume ? `${resume.ats_score}%` : `${dashboard?.placement_summary?.ats_score || 0}%`} />
        <StatCard icon={MessagesSquare} label="Interview Score" value={interview ? `${interview.score}%` : "Pending"} />
        <StatCard icon={FolderGit2} label="Project AI Score" value={projectReview ? `${projectReview.final_score}%` : "Pending"} />
      </div>

      <GlassPanel id="recommend" className="mt-6">
        <h2 className="panel-title">AI domain recommendation</h2>
        <form
          className="mt-5 grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            run("recommend", () => api("/ai/recommend-domain", { method: "POST", token, body: recommendForm }), "Domain recommendation generated.");
          }}
        >
          <input className="field-input" placeholder="Skills" value={recommendForm.skills} onChange={(event) => setRecommendForm({ ...recommendForm, skills: event.target.value })} />
          <input className="field-input" placeholder="Branch" value={recommendForm.branch} onChange={(event) => setRecommendForm({ ...recommendForm, branch: event.target.value })} />
          <input className="field-input" placeholder="Interests" value={recommendForm.interests} onChange={(event) => setRecommendForm({ ...recommendForm, interests: event.target.value })} />
          <input className="field-input" placeholder="Career goal" value={recommendForm.career_goal} onChange={(event) => setRecommendForm({ ...recommendForm, career_goal: event.target.value })} />
          <button className="btn-primary justify-center md:col-span-2" disabled={busy === "recommend"}>
            <Sparkles size={17} />
            Recommend domain
          </button>
        </form>
        {recommendation ? (
          <ResultList
            className="mt-5"
            items={[
              ["Recommended domain", recommendation.recommended_domain.name],
              ["Match percentage", `${recommendation.match_percentage}%`],
              ["Reason", recommendation.reason],
              ["Suggested skills", recommendation.suggested_skills.join(", ")],
            ]}
          />
        ) : (
          <div className="loader-panel mt-5">Add your profile details to get a best-fit internship domain.</div>
        )}
      </GlassPanel>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <GlassPanel id="resume">
          <h2 className="panel-title">AI resume analyzer</h2>
          <form
            className="mt-5 grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              run("resume", () => api("/ai/resume/analyze", { method: "POST", token, body: resumeForm }), "Resume analysis completed.");
            }}
          >
            <input className="field-input" placeholder="Resume URL" value={resumeForm.resume_url} onChange={(event) => setResumeForm({ ...resumeForm, resume_url: event.target.value })} />
            <textarea className="field-input min-h-32" placeholder="Paste resume text or keywords" value={resumeForm.resume_text} onChange={(event) => setResumeForm({ ...resumeForm, resume_text: event.target.value })} />
            <button className="btn-primary justify-center" disabled={busy === "resume"}>
              <FileText size={17} />
              Analyze resume
            </button>
          </form>
          {resume && (
            <div className="mt-5 grid gap-3">
              <ResultList items={[["ATS score", `${resume.ats_score}%`], ["Missing skills", resume.missing_skills.join(", ") || "None"]]} />
              <TagBlock title="Strengths" items={resume.strengths} />
              <TagBlock title="Weaknesses" items={resume.weaknesses} />
              <TagBlock title="Suggestions" items={resume.improvement_suggestions} />
            </div>
          )}
        </GlassPanel>

        <GlassPanel id="roadmap">
          <h2 className="panel-title">AI career roadmap</h2>
          <div className="mt-5 grid gap-3">
            <select className="field-input" value={domainId} onChange={(event) => setDomainId(event.target.value)}>
              {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}
            </select>
            <button className="btn-primary justify-center" disabled={busy === "roadmap"} onClick={() => run("roadmap", () => api("/ai/roadmap", { method: "POST", token, body: { domain_id: Number(domainId) } }), "Roadmap generated.")}>
              <Route size={17} />
              Generate roadmap
            </button>
          </div>
          {roadmap ? (
            <div className="mt-5 grid gap-3">
              <TagBlock title="Beginner" items={roadmap.beginner_skills} />
              <TagBlock title="Intermediate" items={roadmap.intermediate_skills} />
              <TagBlock title="Advanced" items={roadmap.advanced_skills} />
              <TagBlock title="Projects" items={roadmap.projects_to_build} />
              <TagBlock title="Job roles" items={roadmap.job_roles} />
            </div>
          ) : (
            <div className="loader-panel mt-5">Select a domain to generate a week-wise career path.</div>
          )}
        </GlassPanel>
      </div>

      <GlassPanel id="interview" className="mt-6">
        <h2 className="panel-title">AI interview simulator</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <select className="field-input" value={domainId} onChange={(event) => setDomainId(event.target.value)}>
            {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}
          </select>
          <select className="field-input" value={interviewType} onChange={(event) => setInterviewType(event.target.value)}>
            <option>Technical Interview</option>
            <option>HR Interview</option>
          </select>
          <button
            className="btn-primary justify-center"
            disabled={busy === "interviewQuestions"}
            onClick={() =>
              run(
                "interviewQuestions",
                async () => {
                  const result = await api("/ai/interview/questions", { method: "POST", token, body: { domain_id: Number(domainId), interview_type: interviewType } });
                  setInterviewQuestions(result.questions);
                  setInterviewAnswers(result.questions.map(() => ""));
                  return result;
                },
                "Interview questions generated."
              )
            }
          >
            <MessagesSquare size={17} />
            Generate
          </button>
        </div>
        {interviewQuestions.length > 0 ? (
          <form
            className="mt-5 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              run(
                "interviewSubmit",
                () =>
                  api("/ai/interview/submit", {
                    method: "POST",
                    token,
                    body: {
                      domain_id: Number(domainId),
                      interview_type: interviewType,
                      answers: interviewQuestions.map((question, index) => ({ question, answer: interviewAnswers[index] || "" })),
                    },
                  }),
                "Interview feedback generated."
              );
            }}
          >
            {interviewQuestions.map((question, index) => (
              <label className="field-label" key={question}>
                {index + 1}. {question}
                <textarea className="field-input min-h-24" value={interviewAnswers[index] || ""} onChange={(event) => patchAnswer(index, event.target.value)} required />
              </label>
            ))}
            <button className="btn-primary justify-center" disabled={busy === "interviewSubmit"}>
              <SendHorizonal size={17} />
              Submit answers
            </button>
          </form>
        ) : (
          <div className="loader-panel mt-5">Generate five HR or technical questions for {currentDomain?.name || "your domain"}.</div>
        )}
        {interview && <ResultList className="mt-5" items={[["Score", `${interview.score}%`], ["Feedback", interview.feedback]]} />}
      </GlassPanel>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <GlassPanel id="project-review">
          <h2 className="panel-title">AI project reviewer</h2>
          <form
            className="mt-5 grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              run("projectReview", () => api("/ai/project-review", { method: "POST", token, body: projectForm }), "Project review completed.");
            }}
          >
            <input className="field-input" placeholder="GitHub link" value={projectForm.github_link} onChange={(event) => setProjectForm({ ...projectForm, github_link: event.target.value })} />
            <input className="field-input" placeholder="Documentation link" value={projectForm.documentation_link} onChange={(event) => setProjectForm({ ...projectForm, documentation_link: event.target.value })} />
            <input className="field-input" placeholder="Demo video link" value={projectForm.demo_video_link} onChange={(event) => setProjectForm({ ...projectForm, demo_video_link: event.target.value })} />
            <textarea className="field-input min-h-32" placeholder="Paste README text" value={projectForm.readme_text} onChange={(event) => setProjectForm({ ...projectForm, readme_text: event.target.value })} />
            <button className="btn-primary justify-center" disabled={busy === "projectReview"}>
              <FolderGit2 size={17} />
              Review project
            </button>
          </form>
          {projectReview && (
            <div className="mt-5 grid gap-3">
              <ResultList items={[["Final score", `${projectReview.final_score}%`], ["README quality", projectReview.checks.readme_quality]]} />
              <TagBlock title="Suggestions" items={projectReview.suggestions} />
            </div>
          )}
        </GlassPanel>

        <GlassPanel id="coding">
          <h2 className="panel-title">AI coding assistant</h2>
          <form
            className="mt-5 grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              run("code", () => api("/ai/code/analyze", { method: "POST", token, body: codeForm }), "Code analysis completed.");
            }}
          >
            <input className="field-input" placeholder="Language" value={codeForm.language} onChange={(event) => setCodeForm({ ...codeForm, language: event.target.value })} />
            <textarea className="field-input min-h-48 font-mono text-sm" placeholder="Paste code here" value={codeForm.code} onChange={(event) => setCodeForm({ ...codeForm, code: event.target.value })} required />
            <button className="btn-primary justify-center" disabled={busy === "code"}>
              <Code2 size={17} />
              Analyze code
            </button>
          </form>
          {codeResult && (
            <div className="mt-5 grid gap-3">
              <div className="loader-panel">{codeResult.code_explanation}</div>
              <TagBlock title="Bug suggestions" items={codeResult.bug_suggestions} />
              <TagBlock title="Optimization tips" items={codeResult.optimization_tips} />
              <TagBlock title="Best practices" items={codeResult.best_practices} />
            </div>
          )}
        </GlassPanel>
      </div>
    </DashboardShell>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="stat-card">
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ResultList({ items, className = "" }) {
  return (
    <div className={`grid gap-3 ${className}`}>
      {items.map(([label, value]) => (
        <div className="info-line" key={label}>
          <span>{label}</span>
          <strong>{value || "Not available"}</strong>
        </div>
      ))}
    </div>
  );
}

function TagBlock({ title, items }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-black text-slate-950">
        <Lightbulb size={16} className="text-mint" />
        {title}
      </div>
      <div className="flex flex-wrap gap-2">
        {(items || []).length === 0 ? (
          <span className="pill">No items yet</span>
        ) : (
          items.map((item) => (
            <span className="skill-chip" key={item}>
              <BadgeCheck size={14} />
              {item}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
