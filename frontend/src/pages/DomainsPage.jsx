import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Brush,
  Clock,
  Cloud,
  Code2,
  Cpu,
  IndianRupee,
  Layers3,
  LockKeyhole,
  Smartphone,
  Sparkles,
  Target,
} from "lucide-react";
import { Link } from "react-router-dom";

import GlassPanel from "../components/GlassPanel.jsx";
import { api } from "../lib/api";

const filters = ["All", "Development", "AI", "Cyber Security", "ECE", "Design"];

const categoryIcons = {
  Development: Code2,
  AI: Bot,
  "Cyber Security": LockKeyhole,
  ECE: Cpu,
  Design: Brush,
};

const domainIcons = [
  ["machine", Bot],
  ["ai", Bot],
  ["data", Layers3],
  ["python", Code2],
  ["web", Code2],
  ["mobile", Smartphone],
  ["cyber", LockKeyhole],
  ["cloud", Cloud],
  ["devops", Cloud],
  ["ui", Brush],
  ["ux", Brush],
  ["iot", Cpu],
  ["embedded", Cpu],
  ["plc", Cpu],
  ["scada", Cpu],
];

function classifyDomain(name = "") {
  const value = name.toLowerCase();
  if (value.includes("machine") || value.includes("ai") || value.includes("data")) return "AI";
  if (value.includes("cyber")) return "Cyber Security";
  if (value.includes("iot") || value.includes("embedded") || value.includes("plc") || value.includes("scada")) return "ECE";
  if (value.includes("ui") || value.includes("ux") || value.includes("design")) return "Design";
  return "Development";
}

function iconForDomain(name = "") {
  const value = name.toLowerCase();
  const match = domainIcons.find(([keyword]) => value.includes(keyword));
  return match?.[1] || Sparkles;
}

function levelForDomain(domain) {
  const duration = Number(domain.duration_weeks || 0);
  if (duration >= 10) return "Advanced";
  if (duration >= 8) return "Intermediate";
  return "Beginner";
}

export default function DomainsPage() {
  const [domains, setDomains] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api("/domains")
      .then((data) => {
        if (active) setDomains(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredDomains = useMemo(() => {
    if (activeFilter === "All") return domains;
    return domains.filter((domain) => classifyDomain(domain.name) === activeFilter);
  }, [activeFilter, domains]);

  return (
    <main className="page-shell">
      <section className="section-band">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="eyebrow">Programs</p>
              <h1 className="page-title">Internship programs built around skills, projects, and proof.</h1>
              <p className="page-copy mt-4">
                Explore practical LYTIX tracks with LMS materials, tasks, assignments, final projects,
                LinkedIn support, placement readiness, and QR verified credentials.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/apply" className="btn-primary">
                  Apply Now
                  <ArrowRight size={18} />
                </Link>
                <Link to="/training-programs" className="btn-secondary">
                  Explore Training
                </Link>
              </div>
            </div>
            <GlassPanel className="bg-white/80">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ["10+", "Domains", Sparkles],
                  ["6-8", "Week tracks", Clock],
                  ["QR", "Verified proof", BadgeCheck],
                ].map(([value, label, Icon]) => (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4" key={label}>
                    <Icon className="text-[#2563EB]" size={22} />
                    <strong className="mt-4 block text-3xl font-black text-slate-950">{value}</strong>
                    <span className="mt-1 block text-sm font-bold text-slate-600">{label}</span>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>

          <div className="mt-10 flex gap-2 overflow-x-auto pb-2">
            {filters.map((filter) => {
              const Icon = categoryIcons[filter] || Target;
              return (
                <button
                  type="button"
                  className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-black transition ${
                    activeFilter === filter
                      ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                >
                  <Icon size={16} />
                  {filter}
                </button>
              );
            })}
          </div>

          {loading && <div className="loader-panel mt-10">Loading domains...</div>}
          {error && <div className="error-panel mt-10">{error}</div>}
          {!loading && !error && filteredDomains.length === 0 && (
            <div className="loader-panel mt-10">No programs found for this filter.</div>
          )}

          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredDomains.map((domain) => {
              const Icon = iconForDomain(domain.name);
              const skills = Array.isArray(domain.skills) ? domain.skills : [];
              const category = classifyDomain(domain.name);
              const level = levelForDomain(domain);

              return (
                <GlassPanel key={domain.id} className="domain-card group bg-white/90 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-glass">
                  <div className="flex items-start justify-between gap-3">
                    <div className="premium-icon">
                      <Icon size={22} />
                    </div>
                    <span className="pill">{category}</span>
                  </div>
                  <h2 className="card-title mt-5">{domain.name}</h2>
                  <p className="card-copy mt-3">{domain.summary || "A practical LYTIX program with guided learning, projects, and verified completion."}</p>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
                    <div className="info-box flex-col items-start gap-1">
                      <Clock size={16} />
                      <strong>{domain.duration_weeks || 6} weeks</strong>
                    </div>
                    <div className="info-box flex-col items-start gap-1">
                      <Target size={16} />
                      <strong>{level}</strong>
                    </div>
                    <div className="info-box flex-col items-start gap-1">
                      <IndianRupee size={16} />
                      <strong>{domain.fee || 0}</strong>
                    </div>
                  </div>
                  <div className="mt-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Skills</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(skills.length ? skills : ["Projects", "Portfolio", "Mentor review"]).slice(0, 5).map((skill) => (
                        <span key={skill} className="skill-chip">{skill}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-5 grid gap-2">
                    {["Offer letter", "Live tasks", "Final project", "Verified certificate"].map((benefit) => (
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-600" key={benefit}>
                        <BadgeCheck size={16} className="text-[#2563EB]" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                  <Link to={`/apply?domain=${domain.id}`} className="btn-primary mt-6 w-full justify-center">
                    Apply Now
                    <ArrowRight size={17} />
                  </Link>
                </GlassPanel>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
