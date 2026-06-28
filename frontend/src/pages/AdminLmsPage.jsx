import {
  BadgeCheck,
  BarChart3,
  BookOpenCheck,
  CalendarCheck,
  ClipboardList,
  FileQuestion,
  RefreshCcw,
  Save,
  SendHorizonal,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import DashboardShell from "../components/DashboardShell.jsx";
import GlassPanel from "../components/GlassPanel.jsx";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const today = new Date().toISOString().slice(0, 10);

const navItems = [
  { label: "LMS Materials", href: "#materials", icon: BookOpenCheck },
  { label: "Attendance", href: "#attendance", icon: CalendarCheck },
  { label: "Assignments", href: "#assignments", icon: ClipboardList },
  { label: "Quizzes", href: "#quizzes", icon: FileQuestion },
  { label: "Submissions", href: "#submissions", icon: SendHorizonal },
];

export default function AdminLmsPage() {
  const { token } = useAuth();
  const [domains, setDomains] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [materialForm, setMaterialForm] = useState({
    title: "",
    description: "",
    domain_id: "",
    type: "video",
    url: "",
    week_number: 1,
  });
  const [attendanceForm, setAttendanceForm] = useState({
    student_id: "",
    date: today,
    status: "present",
    remarks: "",
  });
  const [assignmentForm, setAssignmentForm] = useState({
    domain_id: "",
    title: "",
    description: "",
    week_number: 1,
    due_date: today,
  });
  const [quizForm, setQuizForm] = useState({
    domain_id: "",
    title: "",
    description: "",
    week_number: 1,
    q1: "",
    q1_correct: "",
    q1_wrong: "",
    q2: "",
    q2_correct: "",
    q2_wrong: "",
  });
  const [reviewDrafts, setReviewDrafts] = useState({});

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [domainList, studentList, submissionList, resultList] = await Promise.all([
        api("/domains", { token }),
        api("/admin/students", { token }),
        api("/admin/submissions", { token }),
        api("/admin/quiz-results", { token }),
      ]);
      setDomains(domainList);
      setStudents(studentList);
      setSubmissions(submissionList);
      setQuizResults(resultList);
      const domainId = selectedDomain || String(domainList[0]?.id || "");
      setSelectedDomain(domainId);
      syncDomainForms(domainId);
      if (domainId) {
        await loadDomainData(domainId);
      }
      const nextReviews = {};
      submissionList.forEach((submission) => {
        nextReviews[submission.id] = {
          marks: submission.marks ?? "",
          feedback: submission.feedback || "",
        };
      });
      setReviewDrafts(nextReviews);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadDomainData(domainId) {
    const [materialList, assignmentList, quizList] = await Promise.all([
      api(`/learning/materials/domain/${domainId}`, { token }),
      api(`/assignments/domain/${domainId}`, { token }),
      api(`/quizzes/domain/${domainId}`, { token }),
    ]);
    setMaterials(materialList);
    setAssignments(assignmentList);
    setQuizzes(quizList);
  }

  useEffect(() => {
    load();
  }, []);

  async function changeDomain(domainId) {
    setSelectedDomain(domainId);
    syncDomainForms(domainId);
    setError("");
    try {
      await loadDomainData(domainId);
    } catch (err) {
      setError(err.message);
    }
  }

  function syncDomainForms(domainId) {
    setMaterialForm((current) => ({ ...current, domain_id: domainId }));
    setAssignmentForm((current) => ({ ...current, domain_id: domainId }));
    setQuizForm((current) => ({ ...current, domain_id: domainId }));
  }

  async function run(label, action, message) {
    setBusy(label);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(message || "Saved.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  const averageQuizScore = useMemo(() => {
    if (!quizResults.length) return 0;
    const total = quizResults.reduce(
      (sum, result) => sum + (result.total_questions ? (result.score / result.total_questions) * 100 : 0),
      0
    );
    return Math.round(total / quizResults.length);
  }, [quizResults]);

  const reviewedSubmissions = submissions.filter((submission) => submission.status === "reviewed").length;

  if (loading) {
    return (
      <main className="page-shell">
        <section className="section-band">
          <div className="loader-panel">Loading LMS management...</div>
          {error && <div className="error-panel mt-4">{error}</div>}
        </section>
      </main>
    );
  }

  return (
    <DashboardShell
      eyebrow="Admin LMS"
      title="Learning management."
      subtitle="Create materials, attendance, assignments, quizzes, and review student work."
      navItems={navItems}
      actions={
        <button className="btn-secondary" onClick={load}>
          <RefreshCcw size={17} />
          Refresh
        </button>
      }
    >
      <div className="dashboard-card-grid">
        <Metric icon={BookOpenCheck} label="Materials" value={materials.length} />
        <Metric icon={ClipboardList} label="Assignments" value={assignments.length} />
        <Metric icon={FileQuestion} label="Quizzes" value={quizzes.length} />
        <Metric icon={SendHorizonal} label="Submissions" value={submissions.length} />
        <Metric icon={BadgeCheck} label="Reviewed" value={reviewedSubmissions} />
        <Metric icon={BarChart3} label="Avg Quiz Score" value={`${averageQuizScore}%`} />
      </div>

      <GlassPanel className="mt-6">
        <label className="field-label">
          Active domain
          <select
            className="field-input"
            value={selectedDomain}
            onChange={(event) => changeDomain(event.target.value)}
          >
            {domains.map((domain) => (
              <option key={domain.id} value={domain.id}>{domain.name}</option>
            ))}
          </select>
        </label>
      </GlassPanel>

      {notice && <div className="success-panel mt-6">{notice}</div>}
      {error && <div className="error-panel mt-6">{error}</div>}

      <GlassPanel id="materials" className="mt-6">
        <h2 className="panel-title">Learning Materials Management</h2>
        <form
          className="mt-5 grid gap-3 lg:grid-cols-6"
          onSubmit={(event) => {
            event.preventDefault();
            run(
              "material",
              () =>
                api("/learning/materials", {
                  method: "POST",
                  token,
                  body: { ...materialForm, domain_id: Number(materialForm.domain_id), week_number: Number(materialForm.week_number) },
                }),
              "Learning material added."
            );
          }}
        >
          <input className="field-input lg:col-span-2" placeholder="Title" value={materialForm.title} onChange={(event) => setMaterialForm({ ...materialForm, title: event.target.value })} required />
          <input className="field-input lg:col-span-2" placeholder="Description" value={materialForm.description} onChange={(event) => setMaterialForm({ ...materialForm, description: event.target.value })} />
          <select className="field-input" value={materialForm.type} onChange={(event) => setMaterialForm({ ...materialForm, type: event.target.value })}>
            <option>video</option>
            <option>pdf</option>
            <option>article</option>
            <option>link</option>
          </select>
          <input className="field-input" type="number" min="1" value={materialForm.week_number} onChange={(event) => setMaterialForm({ ...materialForm, week_number: event.target.value })} />
          <input className="field-input lg:col-span-5" placeholder="URL" value={materialForm.url} onChange={(event) => setMaterialForm({ ...materialForm, url: event.target.value })} required />
          <button className="btn-primary justify-center" disabled={busy === "material"}>
            <Save size={17} />
            Add material
          </button>
        </form>
        <ListRows
          items={materials}
          empty="No materials for this domain."
          render={(material) => (
            <div className="lms-row" key={material.id}>
              <div>
                <strong>{material.title}</strong>
                <span>Week {material.week_number} - {material.type}</span>
              </div>
              <span className="pill">{material.url}</span>
            </div>
          )}
        />
      </GlassPanel>

      <GlassPanel id="attendance" className="mt-6">
        <h2 className="panel-title">Attendance Management</h2>
        <form
          className="mt-5 grid gap-3 md:grid-cols-5"
          onSubmit={(event) => {
            event.preventDefault();
            run(
              "attendance",
              () =>
                api("/attendance/mark", {
                  method: "POST",
                  token,
                  body: { ...attendanceForm, student_id: Number(attendanceForm.student_id) },
                }),
              "Attendance marked."
            );
          }}
        >
          <select className="field-input" value={attendanceForm.student_id} onChange={(event) => setAttendanceForm({ ...attendanceForm, student_id: event.target.value })} required>
            <option value="">Student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>{student.name}</option>
            ))}
          </select>
          <input className="field-input" type="date" value={attendanceForm.date} onChange={(event) => setAttendanceForm({ ...attendanceForm, date: event.target.value })} />
          <select className="field-input" value={attendanceForm.status} onChange={(event) => setAttendanceForm({ ...attendanceForm, status: event.target.value })}>
            <option>present</option>
            <option>absent</option>
          </select>
          <input className="field-input" placeholder="Remarks" value={attendanceForm.remarks} onChange={(event) => setAttendanceForm({ ...attendanceForm, remarks: event.target.value })} />
          <button className="btn-primary justify-center" disabled={busy === "attendance"}>
            <CalendarCheck size={17} />
            Mark
          </button>
        </form>
      </GlassPanel>

      <GlassPanel id="assignments" className="mt-6">
        <h2 className="panel-title">Assignment Management</h2>
        <form
          className="mt-5 grid gap-3 lg:grid-cols-6"
          onSubmit={(event) => {
            event.preventDefault();
            run(
              "assignment",
              () =>
                api("/assignments", {
                  method: "POST",
                  token,
                  body: { ...assignmentForm, domain_id: Number(assignmentForm.domain_id), week_number: Number(assignmentForm.week_number) },
                }),
              "Assignment created."
            );
          }}
        >
          <input className="field-input lg:col-span-2" placeholder="Title" value={assignmentForm.title} onChange={(event) => setAssignmentForm({ ...assignmentForm, title: event.target.value })} required />
          <input className="field-input lg:col-span-2" placeholder="Description" value={assignmentForm.description} onChange={(event) => setAssignmentForm({ ...assignmentForm, description: event.target.value })} />
          <input className="field-input" type="number" min="1" value={assignmentForm.week_number} onChange={(event) => setAssignmentForm({ ...assignmentForm, week_number: event.target.value })} />
          <input className="field-input" type="date" value={assignmentForm.due_date} onChange={(event) => setAssignmentForm({ ...assignmentForm, due_date: event.target.value })} />
          <button className="btn-primary justify-center lg:col-span-6" disabled={busy === "assignment"}>
            <Save size={17} />
            Create assignment
          </button>
        </form>
        <ListRows
          items={assignments}
          empty="No assignments for this domain."
          render={(assignment) => (
            <div className="lms-row" key={assignment.id}>
              <div>
                <strong>{assignment.title}</strong>
                <span>Week {assignment.week_number} - Due {assignment.due_date || "not set"}</span>
              </div>
            </div>
          )}
        />
      </GlassPanel>

      <GlassPanel id="quizzes" className="mt-6">
        <h2 className="panel-title">Quiz Management</h2>
        <form
          className="mt-5 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            run(
              "quiz",
              () =>
                api("/quizzes", {
                  method: "POST",
                  token,
                  body: buildQuizPayload(quizForm),
                }),
              "Quiz created."
            );
          }}
        >
          <div className="grid gap-3 md:grid-cols-4">
            <input className="field-input md:col-span-2" placeholder="Quiz title" value={quizForm.title} onChange={(event) => setQuizForm({ ...quizForm, title: event.target.value })} required />
            <input className="field-input" type="number" min="1" value={quizForm.week_number} onChange={(event) => setQuizForm({ ...quizForm, week_number: event.target.value })} />
            <input className="field-input" placeholder="Description" value={quizForm.description} onChange={(event) => setQuizForm({ ...quizForm, description: event.target.value })} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <input className="field-input" placeholder="Question 1" value={quizForm.q1} onChange={(event) => setQuizForm({ ...quizForm, q1: event.target.value })} required />
            <input className="field-input" placeholder="Correct answer" value={quizForm.q1_correct} onChange={(event) => setQuizForm({ ...quizForm, q1_correct: event.target.value })} required />
            <input className="field-input" placeholder="Wrong answer" value={quizForm.q1_wrong} onChange={(event) => setQuizForm({ ...quizForm, q1_wrong: event.target.value })} required />
            <input className="field-input" placeholder="Question 2" value={quizForm.q2} onChange={(event) => setQuizForm({ ...quizForm, q2: event.target.value })} required />
            <input className="field-input" placeholder="Correct answer" value={quizForm.q2_correct} onChange={(event) => setQuizForm({ ...quizForm, q2_correct: event.target.value })} required />
            <input className="field-input" placeholder="Wrong answer" value={quizForm.q2_wrong} onChange={(event) => setQuizForm({ ...quizForm, q2_wrong: event.target.value })} required />
          </div>
          <button className="btn-primary justify-center" disabled={busy === "quiz"}>
            <FileQuestion size={17} />
            Create quiz
          </button>
        </form>
        <ListRows
          items={quizzes}
          empty="No quizzes for this domain."
          render={(quiz) => (
            <div className="lms-row" key={quiz.id}>
              <div>
                <strong>{quiz.title}</strong>
                <span>Week {quiz.week_number} - {quiz.questions.length} questions</span>
              </div>
            </div>
          )}
        />
      </GlassPanel>

      <GlassPanel id="submissions" className="mt-6">
        <h2 className="panel-title">Submission Review</h2>
        <ListRows
          items={submissions}
          empty="No assignment submissions yet."
          render={(submission) => {
            const draft = reviewDrafts[submission.id] || {};
            return (
              <div className="lms-row" key={submission.id}>
                <div>
                  <strong>{submission.student_name}</strong>
                  <span>{submission.assignment_title} - {submission.domain_name}</span>
                  <a href={submission.submission_link} target="_blank" rel="noreferrer">Open submission</a>
                </div>
                <form
                  className="lms-submit-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    run(
                      `review-${submission.id}`,
                      () =>
                        api(`/assignments/submissions/${submission.id}/review`, {
                          method: "PATCH",
                          token,
                          body: {
                            status: "reviewed",
                            marks: draft.marks === "" ? null : Number(draft.marks),
                            feedback: draft.feedback || "",
                          },
                        }),
                      "Submission reviewed."
                    );
                  }}
                >
                  <input className="field-input" type="number" min="0" max="100" placeholder="Marks" value={draft.marks ?? ""} onChange={(event) => setReviewDrafts({ ...reviewDrafts, [submission.id]: { ...draft, marks: event.target.value } })} />
                  <input className="field-input" placeholder="Feedback" value={draft.feedback || ""} onChange={(event) => setReviewDrafts({ ...reviewDrafts, [submission.id]: { ...draft, feedback: event.target.value } })} />
                  <button className="btn-secondary justify-center" disabled={busy === `review-${submission.id}`}>
                    Review
                  </button>
                </form>
              </div>
            );
          }}
        />
        <h3 className="mt-8 text-xl font-black text-slate-950">Quiz results</h3>
        <ListRows
          items={quizResults}
          empty="No quiz results yet."
          render={(result) => (
            <div className="analytics-row" key={result.id}>
              <span>{result.student_name} - {result.quiz_title}</span>
              <strong>{result.score}/{result.total_questions}</strong>
            </div>
          )}
        />
      </GlassPanel>
    </DashboardShell>
  );
}

function buildQuizPayload(form) {
  return {
    domain_id: Number(form.domain_id),
    title: form.title,
    description: form.description,
    week_number: Number(form.week_number),
    questions: [
      {
        question_text: form.q1,
        options: [
          { option_text: form.q1_correct, is_correct: true },
          { option_text: form.q1_wrong, is_correct: false },
        ],
      },
      {
        question_text: form.q2,
        options: [
          { option_text: form.q2_correct, is_correct: true },
          { option_text: form.q2_wrong, is_correct: false },
        ],
      },
    ],
  };
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="stat-card">
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ListRows({ items, empty, render }) {
  return (
    <div className="mt-5 grid gap-3">
      {items.length === 0 && <div className="loader-panel">{empty}</div>}
      {items.map(render)}
    </div>
  );
}
