import React from "react";
import { Medal, Trophy } from "lucide-react";

import BrandLogo, { BRAND } from "../components/BrandLogo.jsx";
import GlassPanel from "../components/GlassPanel.jsx";

const rankings = [
  ["Aarav Mehta", "AI Career Tools Challenge", "96", "AI & ML"],
  ["Riya Sharma", "Product Build Sprint", "92", "Web Development"],
  ["Kabir Rao", "Cloud Automation Sprint", "89", "Cloud & DevOps"],
];

export default function LeaderboardPage() {
  return (
    <main className="page-shell">
      <section className="section-band">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <BrandLogo size="page" className="mb-6" />
          <p className="eyebrow">Community</p>
          <h1 className="page-title">Leaderboard preview.</h1>
          <p className="page-copy mt-4">{BRAND.tagline} Showcase hackathon scores, project rankings, and standout community builders.</p>
          <GlassPanel className="mt-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="panel-title">Top community builders</h2>
              <Trophy className="text-[#2563EB]" size={28} />
            </div>
            <div className="mt-6 grid gap-3">
              {rankings.map(([name, event, score, domain], index) => (
                <div className="info-box justify-between" key={name}>
                  <div className="flex min-w-0 items-center gap-3">
                    <Medal className="shrink-0 text-[#2563EB]" size={20} />
                    <div className="min-w-0">
                      <p className="font-black text-slate-950">{index + 1}. {name}</p>
                      <p className="truncate text-sm text-slate-500">{event} - {domain}</p>
                    </div>
                  </div>
                  <strong className="text-[#2563EB]">{score}</strong>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </section>
    </main>
  );
}
