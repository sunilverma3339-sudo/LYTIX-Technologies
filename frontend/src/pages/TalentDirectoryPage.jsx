import React, { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, ExternalLink, Search, ShieldCheck, UserRound } from "lucide-react";

import BrandLogo, { BRAND } from "../components/BrandLogo.jsx";
import GlassPanel from "../components/GlassPanel.jsx";
import { api } from "../lib/api";

const placementStatuses = ["", "Not Started", "Resume Reviewed", "Mock Interview Done", "Shortlisted", "Placed"];

export default function TalentDirectoryPage() {
  const [domains, setDomains] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [filters, setFilters] = useState({ domain_id: "", skills: "", placement_status: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.domain_id) params.set("domain_id", filters.domain_id);
    if (filters.skills) params.set("skills", filters.skills);
    if (filters.placement_status) params.set("placement_status", filters.placement_status);
    return params.toString();
  }, [filters]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [domainRows, profileRows] = await Promise.all([
        api("/domains", { token: null }),
        api(`/talent-directory${query ? `?${query}` : ""}`, { token: null }),
      ]);
      setDomains(domainRows);
      setProfiles(profileRows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [query]);

  return (
    <main className="page-shell">
      <section className="section-band">
        <div id="top-talent" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <BrandLogo size="page" className="mb-6" />
          <p className="eyebrow">Talent Directory</p>
          <h1 className="page-title">Discover LYTIX interns.</h1>
          <p className="page-copy mt-4">{BRAND.tagline} Search verified student profiles by domain, skill, and placement readiness.</p>

          <GlassPanel className="mt-8">
            <div className="grid gap-3 md:grid-cols-4">
              <select className="field-input" value={filters.domain_id} onChange={(event) => setFilters({ ...filters, domain_id: event.target.value })}>
                <option value="">All domains</option>
                {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}
              </select>
              <input className="field-input md:col-span-2" placeholder="Search skills" value={filters.skills} onChange={(event) => setFilters({ ...filters, skills: event.target.value })} />
              <select className="field-input" value={filters.placement_status} onChange={(event) => setFilters({ ...filters, placement_status: event.target.value })}>
                {placementStatuses.map((status) => <option key={status} value={status}>{status || "All placement statuses"}</option>)}
              </select>
            </div>
          </GlassPanel>

          {loading && <div className="loader-panel mt-6">Loading talent profiles...</div>}
          {error && <div className="error-panel mt-6">{error}</div>}
          {!loading && !error && (
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {profiles.length === 0 && <div className="loader-panel md:col-span-2 xl:col-span-3">No profiles match the current filters.</div>}
              {profiles.map((profile) => (
                <GlassPanel key={`${profile.student_id}-${profile.domain_id}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="eyebrow">{profile.placement_status}</p>
                      <h2 className="panel-title">{profile.student_name}</h2>
                      <p className="card-copy mt-2">{profile.domain}</p>
                    </div>
                    <UserRound className="text-mint" size={28} />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {profile.skills.slice(0, 5).map((skill) => <span className="skill-chip" key={skill}>{skill}</span>)}
                  </div>
                  <div className="mt-5 grid gap-2">
                    {profile.projects.length > 0 && <a className="icon-text-button" href={profile.projects[0]} target="_blank" rel="noreferrer"><BriefcaseBusiness size={16} />Project</a>}
                    {profile.certificate_verification_link && <a className="icon-text-button" href={profile.certificate_verification_link} target="_blank" rel="noreferrer"><ShieldCheck size={16} />Certificate</a>}
                    {profile.linkedin_url && <a className="icon-text-button" href={profile.linkedin_url} target="_blank" rel="noreferrer"><ExternalLink size={16} />LinkedIn</a>}
                    {profile.github_url && <a className="icon-text-button" href={profile.github_url} target="_blank" rel="noreferrer"><Search size={16} />GitHub</a>}
                  </div>
                </GlassPanel>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
