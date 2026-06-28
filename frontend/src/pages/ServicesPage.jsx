import React from "react";
import { BadgeCheck, Bot, BriefcaseBusiness, Code2, FileCheck2, GraduationCap, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import GlassPanel from "../components/GlassPanel.jsx";

const services = [
  ["Internship Programs", "Structured domain internships with workflow tracking, tasks, LMS, project review, and certificates.", GraduationCap],
  ["Technical Training", "Hands-on training for programming, full-stack development, data, cloud, security, UI/UX, IoT, and automation.", Code2],
  ["Web Development Services", "Modern web application planning, UI development, backend APIs, dashboards, and deployment support.", BriefcaseBusiness],
  ["AI/ML Solutions", "Rule-based and AI-ready workflows for recommendations, resume analysis, interviews, and project review.", Bot],
  ["Resume & Placement Support", "ATS scoring signals, resume feedback, job alerts, HR pipeline, recruiter search, and talent directory.", FileCheck2],
  ["Certification Verification", "QR-enabled public verification for certificates, offer letters, experience letters, and LORs.", ShieldCheck],
];

export default function ServicesPage() {
  return (
    <main className="page-shell">
      <section className="section-band">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="eyebrow">Services</p>
          <h1 className="page-title">Company services for students, teams, and recruiters.</h1>
          <p className="page-copy mt-4">
            LYTIX TECHNOLOGIES delivers internship programs, technical training,
            technology services, placement support, and verified document systems.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map(([title, copy, Icon]) => (
              <GlassPanel key={title}>
                <Icon className="text-mint" size={28} />
                <h2 className="panel-title mt-4">{title}</h2>
                <p className="card-copy mt-3">{copy}</p>
                <div className="mt-5 flex items-center gap-2 text-sm font-bold text-mint">
                  <BadgeCheck size={16} />
                  LYTIX service vertical
                </div>
              </GlassPanel>
            ))}
          </div>
          <GlassPanel className="mt-8">
            <h2 className="panel-title">Need a program or service?</h2>
            <p className="card-copy mt-3">Contact the LYTIX team for internships, training batches, project support, or verification workflows.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/contact" className="btn-primary">Contact us</Link>
              <Link to="/internships" className="btn-secondary">Explore internships</Link>
            </div>
          </GlassPanel>
        </div>
      </section>
    </main>
  );
}
