import React, { useEffect, useState } from "react";
import { BadgeCheck, Calendar, Gift, RefreshCcw, Save, SendHorizonal, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

import BrandLogo, { BRAND } from "../components/BrandLogo.jsx";
import GlassPanel from "../components/GlassPanel.jsx";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const sampleHackathons = [
  {
    id: "sample-1",
    title: "LYTIX Build Sprint",
    description: "Build a portfolio-ready project with documentation, demo, and leaderboard submission.",
    domain_name: "All domains",
    deadline: "2026-07-15",
    prize: "Featured talent profile + certificate badge",
  },
  {
    id: "sample-2",
    title: "AI Career Tools Challenge",
    description: "Create a smart career helper, resume assistant, or project review workflow.",
    domain_name: "Machine Learning and AI",
    deadline: "2026-07-30",
    prize: "Mentor review and recruiter showcase",
  },
];

export default function HackathonsPage() {
  const { token, user } = useAuth();
  const [domains, setDomains] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [leaderboards, setLeaderboards] = useState({});
  const [submitDrafts, setSubmitDrafts] = useState({});
  const [form, setForm] = useState({ title: "", description: "", domain_id: "", deadline: "", prize: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [domainRows, hackathonRows] = await Promise.all([
        api("/domains", { token: token || null }),
        api("/hackathons", { token: null }),
      ]);
      setDomains(domainRows);
      setHackathons(hackathonRows.length ? hackathonRows : sampleHackathons);
      const boards = await Promise.all(hackathonRows.map((event) => api(`/hackathons/${event.id}/leaderboard`, { token: null })));
      const next = {};
      hackathonRows.forEach((event, index) => { next[event.id] = boards[index]; });
      setLeaderboards(next);
    } catch (err) {
      setError(`${err.message}. Showing sample hackathons.`);
      setHackathons(sampleHackathons);
      setLeaderboards({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createHackathon(event) {
    event.preventDefault();
    setBusy("create");
    setError("");
    setNotice("");
    try {
      await api("/hackathons", {
        method: "POST",
        token,
        body: { ...form, domain_id: form.domain_id ? Number(form.domain_id) : null },
      });
      setNotice("Hackathon created.");
      setForm({ title: "", description: "", domain_id: "", deadline: "", prize: "" });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function register(id) {
    setBusy(`register-${id}`);
    setError("");
    setNotice("");
    try {
      await api(`/hackathons/${id}/register`, { method: "POST", token });
      setNotice("Hackathon registration saved.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function submit(id) {
    const project_link = submitDrafts[id] || "";
    if (!project_link.trim()) return;
    setBusy(`submit-${id}`);
    setError("");
    setNotice("");
    try {
      await api(`/hackathons/${id}/submit`, { method: "POST", token, body: { project_link } });
      setNotice("Hackathon project submitted.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return <main className="page-shell"><section className="section-band"><div className="loader-panel">Loading hackathons...</div></section></main>;
  }

  const canCreate = ["admin", "super_admin"].includes(user?.role);

  return (
    <main className="page-shell">
      <section className="section-band">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <BrandLogo size="page" className="mb-6" />
              <p className="eyebrow">Hackathons</p>
              <h1 className="page-title">Build sprints and leaderboards.</h1>
              <p className="page-copy mt-4">{BRAND.tagline} Register for LYTIX challenges, submit project links, and follow public leaderboard previews.</p>
            </div>
            <button className="btn-secondary self-start md:self-auto" onClick={load}><RefreshCcw size={17} />Refresh</button>
          </div>
          {notice && <div className="success-panel mt-6">{notice}</div>}
          {error && <div className="error-panel mt-6">{error}</div>}
          {canCreate && (
            <GlassPanel id="create" className="mt-6">
          <h2 className="panel-title">Create hackathon</h2>
          <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={createHackathon}>
            <input className="field-input" placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            <select className="field-input" value={form.domain_id} onChange={(event) => setForm({ ...form, domain_id: event.target.value })}>
              <option value="">All domains</option>
              {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}
            </select>
            <input className="field-input" type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
            <input className="field-input" placeholder="Prize" value={form.prize} onChange={(event) => setForm({ ...form, prize: event.target.value })} />
            <textarea className="field-input min-h-28 md:col-span-2" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            <button className="btn-primary justify-center md:col-span-2" disabled={busy === "create"}><Save size={17} />Create hackathon</button>
          </form>
            </GlassPanel>
          )}
          <div id="hackathons" className="mt-6 grid gap-4 xl:grid-cols-2">
        {hackathons.length === 0 && <div className="loader-panel xl:col-span-2">No hackathons yet.</div>}
        {hackathons.map((event) => (
          <GlassPanel key={event.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{event.domain_name || "All domains"}</p>
                <h2 className="panel-title">{event.title}</h2>
                <p className="card-copy mt-2">{event.description}</p>
              </div>
              <Trophy className="text-mint" size={30} />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Info icon={Calendar} label="Deadline" value={event.deadline || "Not set"} />
              <Info icon={Gift} label="Prize" value={event.prize || "Recognition badge"} />
            </div>
            {user?.role === "student" && !String(event.id).startsWith("sample") && (
              <div className="mt-5 grid gap-3">
                <button className="btn-secondary justify-center" disabled={busy === `register-${event.id}`} onClick={() => register(event.id)}><BadgeCheck size={17} />Register</button>
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <input className="field-input" placeholder="Project link" value={submitDrafts[event.id] || ""} onChange={(input) => setSubmitDrafts({ ...submitDrafts, [event.id]: input.target.value })} />
                  <button className="btn-primary justify-center" disabled={busy === `submit-${event.id}`} onClick={() => submit(event.id)}><SendHorizonal size={17} />Submit</button>
                </div>
              </div>
            )}
            {!user && (
              <Link to="/auth" className="btn-primary mt-5 w-full justify-center">
                <BadgeCheck size={17} />
                Login to register
              </Link>
            )}
            {user && user.role !== "student" && (
              <div className="loader-panel mt-5">Student login is required for registration and submissions.</div>
            )}
            <div className="mt-5 grid gap-3">
              <h3 className="text-sm font-black text-slate-950">Leaderboard</h3>
              {(leaderboards[event.id] || []).length === 0 && <div className="loader-panel">No submissions yet.</div>}
              {(leaderboards[event.id] || []).slice(0, 5).map((row, index) => (
                <div className="analytics-row" key={row.id}><span>{index + 1}. {row.student_name}</span><strong>{row.score}</strong></div>
              ))}
            </div>
          </GlassPanel>
        ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Info({ icon: Icon, label, value }) {
  return <div className="info-line"><Icon size={18} className="text-mint" /><span>{label}</span><strong>{value}</strong></div>;
}
