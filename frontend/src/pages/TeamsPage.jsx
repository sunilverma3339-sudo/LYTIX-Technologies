import React, { useEffect, useState } from "react";
import { BarChart3, LayoutDashboard, RefreshCcw, Save, UserPlus, UsersRound } from "lucide-react";

import DashboardShell from "../components/DashboardShell.jsx";
import GlassPanel from "../components/GlassPanel.jsx";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const navItems = [
  { label: "Teams", href: "#teams", icon: UsersRound },
  { label: "Create", href: "#create", icon: UserPlus },
  { label: "Dashboard", href: "/mentor/dashboard", icon: LayoutDashboard },
];

export default function TeamsPage() {
  const { token, user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [students, setStudents] = useState([]);
  const [domains, setDomains] = useState([]);
  const [progress, setProgress] = useState({});
  const [form, setForm] = useState({ name: "", domain_id: "", mentor_id: "", lead_student_id: "" });
  const [memberDrafts, setMemberDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const requests = [api("/teams", { token }), api("/domains", { token })];
      if (["admin", "super_admin"].includes(user?.role)) {
        requests.push(api("/admin/students", { token }));
      }
      const [teamRows, domainRows, studentRows = []] = await Promise.all(requests);
      setTeams(teamRows);
      setDomains(domainRows);
      setStudents(studentRows);
      const next = {};
      teamRows.forEach((team) => { next[team.id] = ""; });
      setMemberDrafts(next);
      const progressRows = await Promise.all(teamRows.map((team) => api(`/teams/${team.id}/progress`, { token })));
      const progressMap = {};
      progressRows.forEach((row) => { progressMap[row.team.id] = row; });
      setProgress(progressMap);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createTeam(event) {
    event.preventDefault();
    setBusy("create");
    setError("");
    setNotice("");
    try {
      await api("/teams", {
        method: "POST",
        token,
        body: {
          name: form.name,
          domain_id: form.domain_id ? Number(form.domain_id) : null,
          mentor_id: form.mentor_id ? Number(form.mentor_id) : null,
          lead_student_id: form.lead_student_id ? Number(form.lead_student_id) : null,
        },
      });
      setNotice("Team created.");
      setForm({ name: "", domain_id: "", mentor_id: "", lead_student_id: "" });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function addMember(teamId) {
    const studentId = memberDrafts[teamId];
    if (!studentId) return;
    setBusy(`member-${teamId}`);
    setError("");
    setNotice("");
    try {
      await api(`/teams/${teamId}/members`, { method: "POST", token, body: { student_id: Number(studentId) } });
      setNotice("Student assigned to team.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return <main className="page-shell"><section className="section-band"><div className="loader-panel">Loading teams...</div></section></main>;
  }

  return (
    <DashboardShell
      eyebrow="Team Management"
      title="Cohort teams and mentor progress."
      subtitle="Create teams, assign students, choose team leads, and track progress."
      navItems={navItems}
      actions={<button className="btn-secondary" onClick={load}><RefreshCcw size={17} />Refresh</button>}
    >
      {notice && <div className="success-panel mt-6">{notice}</div>}
      {error && <div className="error-panel mt-6">{error}</div>}
      <GlassPanel id="create" className="mt-6">
        <h2 className="panel-title">Create team</h2>
        <form className="mt-5 grid gap-3 md:grid-cols-4" onSubmit={createTeam}>
          <input className="field-input" placeholder="Team name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <select className="field-input" value={form.domain_id} onChange={(event) => setForm({ ...form, domain_id: event.target.value })}>
            <option value="">Domain</option>
            {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}
          </select>
          <select className="field-input" value={form.lead_student_id} onChange={(event) => setForm({ ...form, lead_student_id: event.target.value })}>
            <option value="">Team lead</option>
            {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
          </select>
          <button className="btn-primary justify-center" disabled={busy === "create"}><Save size={17} />Create</button>
        </form>
      </GlassPanel>
      <div id="teams" className="mt-6 grid gap-4 xl:grid-cols-2">
        {teams.length === 0 && <div className="loader-panel xl:col-span-2">No teams created yet.</div>}
        {teams.map((team) => (
          <GlassPanel key={team.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{team.domain_name || "Cross-domain"}</p>
                <h2 className="panel-title">{team.name}</h2>
                <p className="card-copy mt-2">Mentor: {team.mentor_name || "Not assigned"} | Lead: {team.lead_student_name || "Not assigned"}</p>
              </div>
              <UsersRound className="text-mint" size={28} />
            </div>
            <div className="dashboard-card-grid !mt-5">
              <Stat icon={UsersRound} label="Members" value={team.member_count || 0} />
              <Stat icon={BarChart3} label="Progress" value={`${progress[team.id]?.average_progress || 0}%`} />
            </div>
            <div className="mt-5 grid gap-3">
              {team.members.length === 0 && <div className="loader-panel">No members assigned yet.</div>}
              {team.members.map((member) => (
                <div className="document-row" key={member.id}><div><strong>{member.name}</strong><span>{member.email}</span></div></div>
              ))}
              {students.length > 0 && (
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <select className="field-input" value={memberDrafts[team.id] || ""} onChange={(event) => setMemberDrafts({ ...memberDrafts, [team.id]: event.target.value })}>
                    <option value="">Assign student</option>
                    {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
                  </select>
                  <button className="btn-secondary justify-center" disabled={busy === `member-${team.id}`} onClick={() => addMember(team.id)}><UserPlus size={17} />Add</button>
                </div>
              )}
            </div>
          </GlassPanel>
        ))}
      </div>
    </DashboardShell>
  );
}

function Stat({ icon: Icon, label, value }) {
  return <div className="stat-card"><Icon size={22} /><span>{label}</span><strong>{value}</strong></div>;
}
