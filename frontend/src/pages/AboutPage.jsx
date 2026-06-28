import React from "react";
import {
  BadgeCheck,
  Building2,
  Eye,
  Flag,
  HeartHandshake,
  Lightbulb,
  Rocket,
  ShieldCheck,
  Target,
  UsersRound,
} from "lucide-react";

import BrandLogo, { BRAND } from "../components/BrandLogo.jsx";
import GlassPanel from "../components/GlassPanel.jsx";

const values = [
  ["Practical learning", "Every program is connected to tasks, projects, reviews, and outcomes.", Lightbulb],
  ["Verified proof", "Certificates, documents, and talent profiles are built for public verification.", ShieldCheck],
  ["Career accountability", "Students get guided workflows for LinkedIn, resumes, projects, and placement readiness.", Target],
  ["Technology delivery", "LYTIX serves learners and businesses with modern software, AI, and automation solutions.", Building2],
];

const roadmap = [
  ["Phase 1", "MVP internship platform with applications, dashboards, offer letters, and certificates."],
  ["Phase 2", "LMS, assignments, quizzes, attendance, and internship task systems."],
  ["Phase 3", "Projects, documents, placement tools, freelance hub, and talent directory."],
  ["Phase 4", "AI career tools, community, hackathons, recruiter workflows, and enterprise roles."],
];

export default function AboutPage() {
  return (
    <main className="page-shell">
      <section className="section-band">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <BrandLogo size="page" className="mb-6" />
              <p className="eyebrow">About Us</p>
              <h1 className="page-title">A technology company building skills, products, and futures.</h1>
              <p className="page-copy mt-4">
                LYTIX TECHNOLOGIES is a technology, training, internship, freelancing, and career
                development platform helping students, professionals, startups, and businesses build
                future-ready skills and solutions.
              </p>
            </div>
            <GlassPanel className="bg-white/80">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Technology", "Software, AI, cloud, and automation solutions."],
                  ["Training", "Skill-focused programs with practical milestones."],
                  ["Internships", "Structured workflows from application to certificate."],
                  ["Careers", "Placement support, talent profiles, and recruiter visibility."],
                ].map(([title, copy]) => (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4" key={title}>
                    <BadgeCheck className="text-[#2563EB]" size={20} />
                    <h2 className="mt-4 text-lg font-black text-slate-950">{title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <GlassPanel>
              <Rocket className="text-[#2563EB]" size={30} />
              <h2 className="panel-title mt-4">Mission</h2>
              <p className="card-copy mt-3">
                Bridge the gap between education and industry through practical learning,
                innovation, technology, and real-world opportunities.
              </p>
            </GlassPanel>
            <GlassPanel>
              <Eye className="text-[#2563EB]" size={30} />
              <h2 className="panel-title mt-4">Vision</h2>
              <p className="card-copy mt-3">
                Create a global ecosystem where students can learn, build, earn, and grow into
                industry-ready professionals.
              </p>
            </GlassPanel>
            <GlassPanel>
              <HeartHandshake className="text-[#2563EB]" size={30} />
              <h2 className="panel-title mt-4">What we do</h2>
              <p className="card-copy mt-3">
                We combine internships, training, software services, freelancing pathways,
                verified documents, AI career tools, and placement workflows.
              </p>
            </GlassPanel>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <GlassPanel className="relative overflow-hidden">
              <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-blue-500/10 blur-3xl" />
              <UsersRound className="relative text-[#2563EB]" size={30} />
              <h2 className="panel-title relative mt-4">Founder</h2>
              <div className="relative mt-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-5">
                <p className="text-3xl font-black text-[#0F172A]">{BRAND.founder}</p>
                <p className="mt-1 text-sm font-bold text-[#2563EB]">{BRAND.founderTitle}</p>
              </div>
              <p className="card-copy relative mt-4">
                LYTIX TECHNOLOGIES is founder-led with a focus on practical innovation,
                student outcomes, technology execution, and career enablement.
              </p>
            </GlassPanel>

            <GlassPanel>
              <Flag className="text-[#2563EB]" size={30} />
              <h2 className="panel-title mt-4">Company roadmap</h2>
              <div className="mt-6 grid gap-4">
                {roadmap.map(([phase, copy], index) => (
                  <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" key={phase}>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-600 text-sm font-black text-white">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-black text-slate-950">{phase}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>

          <div className="mt-10">
            <p className="eyebrow">Company values</p>
            <h2 className="section-title">Built around trust, outcomes, and innovation.</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {values.map(([title, copy, Icon]) => (
                <GlassPanel key={title} className="transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-glass">
                  <Icon className="text-[#2563EB]" size={28} />
                  <h3 className="mt-5 text-xl font-black text-slate-950">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
                </GlassPanel>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
