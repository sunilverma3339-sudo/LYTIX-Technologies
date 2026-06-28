import React from "react";
import { Linkedin, Star } from "lucide-react";

import BrandLogo, { BRAND } from "../components/BrandLogo.jsx";
import GlassPanel from "../components/GlassPanel.jsx";

const stories = [
  ["Aarav Mehta", "AI & ML Intern", "Built an AI resume helper and earned a verified certificate."],
  ["Riya Sharma", "Web Development", "Converted internship projects into a freelance-ready portfolio."],
  ["Naina Iyer", "Data Analytics", "Used assignments and dashboards to showcase practical analytics skills."],
];

export default function SuccessStoriesPage() {
  return (
    <main className="page-shell">
      <section className="section-band">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <BrandLogo size="page" className="mb-6" />
          <p className="eyebrow">Success stories</p>
          <h1 className="page-title">Proof-of-work journeys from the LYTIX ecosystem.</h1>
          <p className="page-copy mt-4">{BRAND.tagline} Student, freelancer, and community success stories will be expanded as the platform grows.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {stories.map(([name, domain, story]) => (
              <GlassPanel key={name}>
                <div className="flex items-center justify-between gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-lg font-black text-[#2563EB]">
                    {name.split(" ").map((part) => part[0]).join("")}
                  </div>
                  <Star className="text-[#2563EB]" size={22} fill="currentColor" />
                </div>
                <h2 className="mt-5 text-xl font-black text-slate-950">{name}</h2>
                <p className="mt-1 text-sm font-bold text-[#2563EB]">{domain}</p>
                <p className="mt-4 leading-7 text-slate-600">{story}</p>
                <button className="icon-text-button mt-5" type="button">
                  <Linkedin size={16} />
                  LinkedIn story
                </button>
              </GlassPanel>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
