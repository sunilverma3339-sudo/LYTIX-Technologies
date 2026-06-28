import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  BarChart3,
  BookOpenCheck,
  CalendarCheck,
  ClipboardList,
  FileQuestion,
  Link2,
  ListChecks,
  RefreshCcw,
  SendHorizonal,
} from "lucide-react";

import {
  DarkButton,
  DarkField,
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
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

export default function StudentLmsPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [submissionLinks, setSubmissionLinks] = useState({});
  const [quizAnswers, setQuizAnswers] = useState({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setError("");
    try {
      const [dashboard, materials, attendance, assignments, quizzes, quizResults] = await Promise.all([
        api("/students/dashboard", { token }),
        api("/learning/materials/me", { token }),
        api("/attendance/me", { token }),
        api("/assignments/me", { token }),
        api("/quizzes/me", { token }),
        api("/quizzes/results/me", { token }),
      ]);
      setData({ dashboard, materials, attendance, assignments, quizzes, quizResults });
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const groupedMaterials = useMemo(() => groupByWeek(data?.materials || []), [data]);
  const groupedAssignments = useMemo(() => groupByWeek(data?.assignments || []), [data]);
  const groupedQuizzes = useMemo(() => groupByWeek(data?.quizzes || []), [data]);

  async function run(label, action, message) {
    setBusy(label);
    setError("");
    setNotice("");
    try {
      const result = await action();
      setNotice(result?.message || message || "Saved.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  function chooseAnswer(quizId, questionId, optionId) {
    setQuizAnswers((current) => ({
      ...current,
      [quizId]: { ...(current[quizId] || {}), [questionId]: optionId },
    }));
  }

  if (!data) {
    return (
      <StudentDashboardShell title="Learning Workspace" badge="LMS">
        <DarkPanel className="grid min-h-[50vh] place-items-center text-center">
          <div>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-300/20 border-t-cyan-300" />
            <h1 className="mt-6 text-2xl font-black">Loading LMS workspace...</h1>
            {error && <Notice type="error">{error}</Notice>}
          </div>
        </DarkPanel>
      </StudentDashboardShell>
    );
  }

  const summary = data.dashboard.lms_summary || {};
  const student = data.dashboard.student;
  const application = data.dashboard.application;

  return (
    <StudentDashboardShell title="Learning Workspace" badge="LMS Active">
      <motion.div className="grid gap-6" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.07 } } }}>
        <PageHero
          eyebrow="Student LMS"
          title="Learning, attendance, assignments, and quizzes."
          subtitle={application ? `${application.domain.name} - ${student.email}` : student.email}
          actions={
            <DarkButton variant="secondary" onClick={load}>
              <RefreshCcw size={17} />
              Refresh
            </DarkButton>
          }
        />

        <motion.section id="progress" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6" variants={fadeUp}>
          <MetricCard icon={BookOpenCheck} label="Learning Progress" value={summary.learning_progress || 0} suffix="%" tone="cyan" />
          <MetricCard icon={CalendarCheck} label="Attendance" value={summary.attendance_percentage || 0} suffix="%" tone="blue" />
          <TextStatCard icon={ClipboardList} label="Pending Assignments" value={summary.pending_assignments || 0} />
          <TextStatCard icon={BadgeCheck} label="Completed Assignments" value={summary.completed_assignments || 0} />
          <MetricCard icon={FileQuestion} label="Latest Quiz Score" value={summary.quiz_score || 0} suffix="%" tone="indigo" />
          <MetricCard icon={BarChart3} label="Internship Progress" value={summary.internship_progress || 0} suffix="%" tone="cyan" />
        </motion.section>

        {(notice || error) && <Notice type={error ? "error" : "success"}>{notice || error}</Notice>}

        <DarkPanel id="learning">
          <SectionTitle eyebrow="Learning Materials" title="Weekly material library." copy="Materials are grouped by week for your selected internship domain." />
          <div className="mt-6 grid gap-5">
            {Object.keys(groupedMaterials).length === 0 && <EmptyDark message="No learning materials are available yet." />}
            {Object.entries(groupedMaterials).map(([week, materials]) => (
              <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5" key={week}>
                <h3 className="text-xl font-black text-white">Week {week}</h3>
                <div className="mt-4 grid gap-3">
                  {materials.map((material) => (
                    <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.055] p-4 xl:grid-cols-[1fr_auto]" key={material.id}>
                      <div>
                        <strong className="block text-lg text-white">{material.title}</strong>
                        <span className="mt-2 block text-sm leading-6 text-slate-300">{material.description}</span>
                        <a className="mt-3 inline-flex items-center gap-2 text-sm font-black text-cyan-200" href={material.url} target="_blank" rel="noreferrer">
                          <Link2 size={14} />
                          {material.type}
                        </a>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                        <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">{material.progress_status}</span>
                        <DarkButton
                          variant="secondary"
                          disabled={busy === `material-${material.id}`}
                          onClick={() =>
                            run(
                              `material-${material.id}`,
                              () =>
                                api(`/learning/materials/${material.id}/progress`, {
                                  method: "PATCH",
                                  token,
                                  body: { status: "Completed" },
                                }),
                              "Material marked completed."
                            )
                          }
                        >
                          Complete
                        </DarkButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DarkPanel>

        <DarkPanel id="attendance">
          <SectionTitle eyebrow="Attendance" title="Attendance performance and recent records." />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <MetricCard icon={CalendarCheck} label="Attendance Percentage" value={data.attendance.percentage || 0} suffix="%" tone="cyan" />
            <TextStatCard icon={BadgeCheck} label="Present Days" value={data.attendance.present || 0} />
            <TextStatCard icon={ListChecks} label="Total Records" value={data.attendance.total || 0} />
          </div>
          <div className="mt-6 grid gap-3">
            {data.attendance.records.length === 0 && <EmptyDark message="No attendance records yet." />}
            {data.attendance.records.slice(0, 8).map((record) => (
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3" key={record.id}>
                <span className="text-sm font-bold text-slate-300">{record.date}</span>
                <strong className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase text-cyan-100">{record.status}</strong>
              </div>
            ))}
          </div>
        </DarkPanel>

        <DarkPanel id="assignments">
          <SectionTitle eyebrow="Assignments" title="Weekly assignment submissions." />
          <div className="mt-6 grid gap-5">
            {Object.keys(groupedAssignments).length === 0 && <EmptyDark message="No assignments are available yet." />}
            {Object.entries(groupedAssignments).map(([week, assignments]) => (
              <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5" key={week}>
                <h3 className="text-xl font-black text-white">Week {week}</h3>
                <div className="mt-4 grid gap-3">
                  {assignments.map((assignment) => (
                    <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.055] p-4 xl:grid-cols-[1fr_420px]" key={assignment.id}>
                      <div>
                        <strong className="block text-lg text-white">{assignment.title}</strong>
                        <span className="mt-2 block text-sm leading-6 text-slate-300">{assignment.description}</span>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300">Due: {assignment.due_date || "Not set"}</span>
                          {assignment.submission_status && <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">{assignment.submission_status}</span>}
                          {assignment.marks != null && <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300">{assignment.marks}/100</span>}
                        </div>
                      </div>
                      <form
                        className="grid gap-3 md:grid-cols-[1fr_auto]"
                        onSubmit={(event) => {
                          event.preventDefault();
                          run(
                            `assignment-${assignment.id}`,
                            () =>
                              api(`/assignments/${assignment.id}/submit`, {
                                method: "POST",
                                token,
                                body: { submission_link: submissionLinks[assignment.id] },
                              }),
                            "Assignment submitted."
                          );
                        }}
                      >
                        <DarkField
                          placeholder="Submission link"
                          value={submissionLinks[assignment.id] || assignment.submission_link || ""}
                          onChange={(event) =>
                            setSubmissionLinks((current) => ({
                              ...current,
                              [assignment.id]: event.target.value,
                            }))
                          }
                          required
                        />
                        <DarkButton variant="secondary" disabled={busy === `assignment-${assignment.id}`}>
                          <SendHorizonal size={17} />
                          Submit
                        </DarkButton>
                      </form>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DarkPanel>

        <DarkPanel id="quizzes">
          <SectionTitle eyebrow="Quizzes" title="Attempt quizzes and track scores." />
          <div className="mt-6 grid gap-5">
            {Object.keys(groupedQuizzes).length === 0 && <EmptyDark message="No quizzes are available yet." />}
            {Object.entries(groupedQuizzes).map(([week, quizzes]) => (
              <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5" key={week}>
                <h3 className="text-xl font-black text-white">Week {week}</h3>
                <div className="mt-4 grid gap-4">
                  {quizzes.map((quiz) => (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={quiz.id}>
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <strong className="block text-lg text-white">{quiz.title}</strong>
                          <p className="mt-2 text-sm leading-6 text-slate-300">{quiz.description}</p>
                        </div>
                        {quiz.result && <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">Score {quiz.result.score}/{quiz.result.total_questions}</span>}
                      </div>
                      <div className="mt-4 grid gap-4">
                        {quiz.questions.map((question) => (
                          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4" key={question.id}>
                            <strong className="text-white">{question.question_text}</strong>
                            <div className="mt-3 grid gap-2">
                              {question.options.map((option) => (
                                <label className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2 text-sm text-slate-200" key={option.id}>
                                  <input
                                    className="h-4 w-4 accent-cyan-400"
                                    type="radio"
                                    name={`quiz-${quiz.id}-question-${question.id}`}
                                    checked={quizAnswers[quiz.id]?.[question.id] === option.id}
                                    onChange={() => chooseAnswer(quiz.id, question.id, option.id)}
                                  />
                                  <span>{option.option_text}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <DarkButton
                        className="mt-4"
                        disabled={busy === `quiz-${quiz.id}`}
                        onClick={() => {
                          const answers = Object.entries(quizAnswers[quiz.id] || {}).map(([questionId, optionId]) => ({
                            question_id: Number(questionId),
                            option_id: optionId,
                          }));
                          run(
                            `quiz-${quiz.id}`,
                            () =>
                              api(`/quizzes/${quiz.id}/attempt`, {
                                method: "POST",
                                token,
                                body: { answers },
                              }),
                            "Quiz submitted."
                          );
                        }}
                      >
                        Submit quiz
                      </DarkButton>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DarkPanel>
      </motion.div>
    </StudentDashboardShell>
  );
}

function groupByWeek(items) {
  return items.reduce((acc, item) => {
    const week = item.week_number || 1;
    acc[week] = acc[week] || [];
    acc[week].push(item);
    return acc;
  }, {});
}
