import React from "react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bot,
  Cloud,
  Code2,
  Cpu,
  Layers3,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

import GlassPanel from "../components/GlassPanel.jsx";

const solutions = [
  {
    id: "ai-solutions",
    title: "AI Solutions",
    copy: "AI chatbots, recommendation engines, resume analyzers, interview simulators, project reviewers, and applied automation prototypes.",
    icon: Bot,
    points: ["AI chatbots", "Career AI tools", "Recommendation systems", "Process intelligence"],
  },
  {
    id: "web-development",
    title: "Web Development",
    copy: "Premium company websites, dashboards, portals, admin systems, verification pages, and API-connected web applications.",
    icon: Code2,
    points: ["SaaS websites", "Admin dashboards", "Business portals", "Verification systems"],
  },
  {
    id: "mobile-app-development",
    title: "Mobile Apps",
    copy: "Mobile-first product experiences, student apps, internal tools, clickable prototypes, and API-ready app flows.",
    icon: Smartphone,
    points: ["Student apps", "Client apps", "Prototypes", "API integrations"],
  },
  {
    id: "cloud-devops",
    title: "Cloud & DevOps",
    copy: "Deployment planning, cloud-ready architecture, DevOps workflows, monitoring concepts, and scalable delivery support.",
    icon: Cloud,
    points: ["Cloud setup", "CI/CD guidance", "Deployment flows", "Monitoring"],
  },
  {
    id: "iot-automation",
    title: "IoT Automation",
    copy: "IoT dashboards, embedded systems concepts, PLC/SCADA learning support, process tracking, and automation reporting.",
    icon: Cpu,
    points: ["IoT dashboards", "Automation tools", "Embedded workflows", "SCADA concepts"],
  },
  {
    id: "business-dashboards",
    title: "Business Dashboards",
    copy: "Analytics dashboards for applications, revenue, placements, attendance, performance, operations, and project delivery.",
    icon: BarChart3,
    points: ["KPI dashboards", "Reports", "Pipeline tracking", "Admin panels"],
  },
];

export default function SolutionsPage() {
  return (
    <main className="page-shell">
      <section className="section-band">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="eyebrow">Solutions</p>
              <h1 className="page-title">Technology solutions for startups, institutes, and growing teams.</h1>
              <p className="page-copy mt-4">
                LYTIX TECHNOLOGIES delivers AI, web, mobile, cloud, IoT automation, and dashboard
                solutions with a practical delivery mindset and premium SaaS-grade UI.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/contact" className="btn-primary">
                  Request Service
                  <ArrowRight size={17} />
                </Link>
                <Link to="/services" className="btn-secondary">
                  View Services
                </Link>
              </div>
            </div>
            <GlassPanel className="relative overflow-hidden bg-slate-950 text-white">
              <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
              <Layers3 className="relative text-cyan-200" size={32} />
              <h2 className="relative mt-5 text-3xl font-black">Solution delivery model</h2>
              <div className="relative mt-6 grid gap-3">
                {["Discovery", "Prototype", "Build", "Review", "Launch"].map((step, index) => (
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3" key={step}>
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-sm font-black text-blue-700">{index + 1}</span>
                    <strong>{step}</strong>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {solutions.map(({ id, title, copy, icon: Icon, points }) => (
              <GlassPanel
                id={id}
                key={title}
                className="group transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-glass"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="premium-icon">
                    <Icon size={24} />
                  </div>
                  <span className="pill">LYTIX Solution</span>
                </div>
                <h2 className="panel-title mt-5">{title}</h2>
                <p className="card-copy mt-3">{copy}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {points.map((point) => (
                    <span className="skill-chip" key={point}>
                      <BadgeCheck size={14} />
                      {point}
                    </span>
                  ))}
                </div>
                <Link to={`/contact?service=${encodeURIComponent(title)}`} className="btn-secondary mt-6 w-full justify-center">
                  Request Service
                  <ArrowRight size={17} />
                </Link>
              </GlassPanel>
            ))}
          </div>

          <GlassPanel className="mt-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <Sparkles className="text-cyan-100" size={28} />
                <h2 className="mt-4 text-3xl font-black">Need a custom technology solution?</h2>
                <p className="mt-3 max-w-2xl leading-7 text-blue-50">
                  Share your goal and the LYTIX team can help shape it into a website, dashboard,
                  app prototype, AI workflow, or automation solution.
                </p>
              </div>
              <Link to="/contact" className="rounded-md bg-white px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-50">
                Start Request
              </Link>
            </div>
          </GlassPanel>
        </div>
      </section>
    </main>
  );
}
