import { SendHorizonal } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import GlassPanel from "../components/GlassPanel.jsx";
import { api } from "../lib/api";

export default function ApplicationPage() {
  const [searchParams] = useSearchParams();
  const [domains, setDomains] = useState([]);
  const [form, setForm] = useState({
    domain_id: searchParams.get("domain") || "",
    statement: "",
    skills: "",
    linkedin_url: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api("/domains")
      .then(setDomains)
      .catch((err) => setError(err.message));
  }, []);

  const selected = useMemo(
    () => domains.find((domain) => String(domain.id) === String(form.domain_id)),
    [domains, form.domain_id]
  );

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/applications", {
        method: "POST",
        body: { ...form, domain_id: Number(form.domain_id) },
      });
      navigate("/student/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="section-band">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="eyebrow">Application</p>
            <h1 className="page-title">Submit your internship request.</h1>
            <p className="page-copy">
              Applications enter the workflow at Applied and move through test,
              selection, payment, tasks, LinkedIn update, and certificate issue.
            </p>
            {selected && (
              <GlassPanel className="mt-6">
                <h2 className="panel-title">{selected.name}</h2>
                <p className="card-copy mt-3">{selected.summary}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {selected.skills.map((skill) => (
                    <span className="skill-chip" key={skill}>{skill}</span>
                  ))}
                </div>
              </GlassPanel>
            )}
          </div>

          <GlassPanel>
            <form onSubmit={submit} className="grid gap-4">
              <label className="field-label">
                Domain
                <select
                  className="field-input"
                  value={form.domain_id}
                  onChange={(event) => setForm({ ...form, domain_id: event.target.value })}
                  required
                >
                  <option value="">Select domain</option>
                  {domains.map((domain) => (
                    <option value={domain.id} key={domain.id}>{domain.name}</option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Statement of interest
                <textarea
                  className="field-input min-h-36 resize-y"
                  value={form.statement}
                  onChange={(event) => setForm({ ...form, statement: event.target.value })}
                  placeholder="Tell us what you want to build during the internship."
                  required
                  minLength={20}
                />
              </label>
              <label className="field-label">
                Skills
                <input
                  className="field-input"
                  value={form.skills}
                  onChange={(event) => setForm({ ...form, skills: event.target.value })}
                  placeholder="Python, React, SQL"
                />
              </label>
              <label className="field-label">
                LinkedIn profile
                <input
                  className="field-input"
                  value={form.linkedin_url}
                  onChange={(event) => setForm({ ...form, linkedin_url: event.target.value })}
                  placeholder="https://www.linkedin.com/in/..."
                />
              </label>
              {error && <div className="error-panel">{error}</div>}
              <button className="btn-primary justify-center" disabled={busy}>
                <SendHorizonal size={18} />
                {busy ? "Submitting..." : "Submit application"}
              </button>
            </form>
          </GlassPanel>
        </div>
      </section>
    </main>
  );
}
