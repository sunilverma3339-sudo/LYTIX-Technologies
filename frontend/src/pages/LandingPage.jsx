import React, { useEffect, useRef, useState } from "react";
import { animate, motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Bot,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  Cloud,
  Code2,
  Cpu,
  Database,
  Gift,
  GraduationCap,
  Handshake,
  Layers3,
  Linkedin,
  LockKeyhole,
  QrCode,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Trophy,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import BrandLogo, { BRAND } from "../components/BrandLogo.jsx";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const techCards = [
  ["AI & ML", Bot],
  ["Web Development", Code2],
  ["Mobile Apps", Smartphone],
  ["Cyber Security", LockKeyhole],
  ["Cloud & DevOps", Cloud],
  ["IoT & Automation", Cpu],
];

const featuredDomains = [
  ["AI & Machine Learning", "Build intelligent tools, models, and applied AI workflows.", Bot],
  ["Python Development", "Master scripting, APIs, automation, and backend foundations.", Code2],
  ["Web Development", "Create responsive products, dashboards, and full-stack apps.", Layers3],
  ["Cyber Security", "Learn security basics, risk thinking, and defensive practices.", LockKeyhole],
  ["Cloud & DevOps", "Work with deployment, cloud workflows, and DevOps concepts.", Cloud],
  ["Mobile App Development", "Design and build mobile-first product experiences.", Smartphone],
];

const whyChooseLytix = [
  ["Industry Mentors", "Guided learning from mentors focused on practical outcomes.", Award],
  ["Live Projects", "Portfolio-ready work with documentation, demos, and reviews.", Code2],
  ["Verified Certificates", "QR-backed credentials with public verification pages.", ShieldCheck],
  ["LinkedIn Support", "Profile updates, credential sharing, and career visibility.", Linkedin],
  ["Placement Assistance", "Resume tools, ATS placeholders, job alerts, and talent profiles.", BriefcaseBusiness],
  ["Hackathons", "Innovation challenges, leaderboards, and community recognition.", Trophy],
];

const workflowTimeline = [
  "Apply",
  "Assessment",
  "Selection",
  "Offer Letter",
  "Training",
  "Project",
  "LinkedIn Update",
  "Certificate",
];

const homeStats = [
  ["Students", 1000, "+", UsersRound],
  ["Certificates", 100, "+", BadgeCheck],
  ["Projects", 50, "+", Code2],
  ["Mentors", 20, "+", Award],
];

const projectShowcase = [
  ["AI Resume Builder", "AI-assisted resume analysis, ATS scoring, and improvement suggestions.", Bot],
  ["Smart Attendance System", "Attendance tracking, percentage summaries, and admin review workflows.", CheckCircle2],
  ["Disaster Management System", "Emergency coordination concept with dashboards, alerts, and reporting.", ShieldCheck],
  ["Movie Recommendation System", "Recommendation engine concept using user preferences and ML logic.", Sparkles],
];

const trustStats = [
  ["Internship Domains", 10, "+", GraduationCap],
  ["Students", 500, "+", UsersRound],
  ["Projects", 100, "+", Code2],
  ["Certificates", 50, "+", BadgeCheck],
  ["Mentors", 20, "+", Award],
  ["Partners", 15, "+", Handshake],
];

const whatWeDo = [
  ["Internship Programs", "Structured domain internships with LMS, tasks, projects, and verified outcomes.", GraduationCap],
  ["Technical Training", "Career-focused technical training for modern product, data, cloud, and automation roles.", Sparkles],
  ["AI & ML Solutions", "Recommendation engines, AI assistants, analytics prototypes, and applied ML workflows.", Bot],
  ["Web Development", "Premium websites, portals, dashboards, and API-connected business applications.", Code2],
  ["Mobile App Development", "Mobile-first product experiences, prototypes, and app interfaces for startups.", Smartphone],
  ["Placement Support", "Resume review, ATS scoring, job alerts, talent directory, and recruiter visibility.", BriefcaseBusiness],
  ["Certificate Verification", "QR-backed public verification for certificates, experience letters, and credentials.", QrCode],
  ["Corporate Training", "Custom technical enablement programs for teams, institutes, and enterprise partners.", UsersRound],
];

const whyChoose = [
  ["Real Industry Projects", "Portfolio-ready work with documentation, demos, and review workflows.", Code2],
  ["Placement Support", "Career tools, resume guidance, job alerts, and talent visibility.", BriefcaseBusiness],
  ["AI Powered Tools", "Domain recommendations, resume analyzer, interview simulator, and project reviewer.", Bot],
  ["QR Verified Certificates", "Public verification pages with document status and credential proof.", ShieldCheck],
  ["Hackathons & Events", "Innovation challenges, submissions, leaderboards, and recognition.", Trophy],
  ["Expert Mentors", "Guided feedback for projects, assignments, roadmaps, and career direction.", Award],
  ["Career Guidance", "Roadmaps, learning paths, LinkedIn workflows, and placement readiness.", Rocket],
  ["Community Access", "Domain-wise forums, teams, announcements, and build communities.", UsersRound],
];

const ecosystem = [
  ["LYTIX Academy", "Technical training and career-ready learning tracks.", GraduationCap],
  ["LYTIX Internships", "Structured internships with LMS, tasks, projects, and credentials.", BriefcaseBusiness],
  ["LYTIX Solutions", "Web, app, dashboard, cloud, and automation delivery.", Layers3],
  ["LYTIX AI Labs", "AI tools, analytics, assistants, and applied ML prototypes.", Bot],
  ["LYTIX Careers", "Resume tools, placement workflows, recruiter search, and talent profiles.", Handshake],
  ["LYTIX Hackathons", "Build sprints, innovation events, submissions, and leaderboards.", Trophy],
];

const businessServices = [
  ["Website Development", "Fast, responsive, conversion-ready websites for brands and institutions.", Code2],
  ["Mobile App Development", "Modern mobile experiences, prototypes, and product interfaces.", Smartphone],
  ["AI Solutions", "Chatbots, recommendation tools, automation intelligence, and ML prototypes.", Bot],
  ["Cloud & DevOps", "Deployment-ready workflows, cloud guidance, and scalable infrastructure patterns.", Cloud],
  ["Business Dashboards", "Operational dashboards, analytics panels, and internal business software.", Database],
  ["IoT & Automation", "IoT dashboards, embedded workflows, PLC/SCADA concepts, and automation tools.", Cpu],
];

const sampleHackathons = [
  {
    id: "sample-build-sprint",
    title: "LYTIX Product Build Sprint",
    domain_name: "All domains",
    deadline: "2026-07-15",
    prize: "Featured talent profile + innovation badge",
    registrations: 128,
  },
  {
    id: "sample-ai-challenge",
    title: "AI Career Tools Challenge",
    domain_name: "Machine Learning and AI",
    deadline: "2026-07-30",
    prize: "Mentor review + recruiter showcase",
    registrations: 84,
  },
];

const successStories = [
  {
    name: "Aarav Mehta",
    domain: "AI & ML Intern",
    review: "LYTIX helped me convert scattered learning into a clear roadmap, project, and verified certificate.",
    initials: "AM",
  },
  {
    name: "Riya Sharma",
    domain: "Web Development",
    review: "The internship workflow felt like a real product team: tasks, reviews, final project, and portfolio proof.",
    initials: "RS",
  },
  {
    name: "Kabir Rao",
    domain: "Cloud & DevOps",
    review: "The placement tools and LinkedIn checklist made my profile stronger and easier to share with recruiters.",
    initials: "KR",
  },
  {
    name: "Naina Iyer",
    domain: "Data Analytics",
    review: "The LMS, assignments, quizzes, and project milestones gave structure without feeling overwhelming.",
    initials: "NI",
  },
];

const partners = [
  "TECHNOVA",
  "CLOUDIFY",
  "AICORE",
  "EDUSTACK",
  "DEVFORGE",
  "AUTOLABS",
];

export default function LandingPage() {
  return (
    <main className="overflow-hidden bg-[#F8FAFC]">
      <HeroSection />
      <FeaturedDomainsSection />
      <WhyChooseLytixSection />
      <InternshipWorkflowSection />
      <StatisticsCounterSection />
      <ProjectShowcaseSection />
      <TestimonialsCarouselSection />
      <RecruiterSection />
      <HackathonBanner />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="hero-scene">
      <div className="hero-grid" />
      <motion.div
        className="pointer-events-none absolute left-[8%] top-24 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl"
        animate={{ scale: [1, 1.18, 1], opacity: [0.55, 0.9, 0.55] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute right-[8%] top-40 h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl"
        animate={{ y: [0, 28, 0], opacity: [0.45, 0.85, 0.45] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-24 mx-auto h-72 max-w-4xl rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 md:gap-10 lg:min-h-[90vh] lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:px-8 lg:py-20">
        <motion.div
          className="relative z-10 max-w-4xl text-left"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div className="flex flex-col items-start gap-3" variants={fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#2563EB] shadow-sm shadow-blue-500/10">
              <BrandLogo size="icon" compact className="[&>span>img]:h-7 [&>span>img]:w-7" />
              {BRAND.name}
            </span>
            <span className="text-sm font-black uppercase tracking-[0.18em] text-[#06B6D4]">{BRAND.tagline}</span>
            <span className="inline-flex rounded-md border border-slate-200 bg-[#EEF4FF] px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-slate-600">
              SaaS + Technology Company
            </span>
          </motion.div>
          <motion.h1
            className="mt-4 max-w-4xl text-[34px] font-black leading-[1.02] text-[#0F172A] min-[375px]:text-[38px] min-[425px]:text-[42px] sm:text-[46px] md:text-[56px] lg:mt-5 lg:text-7xl"
            variants={fadeUp}
          >
            BUILD SKILLS.
            <span className="block text-[#2563EB]">BUILD PRODUCTS.</span>
            BUILD FUTURES.
          </motion.h1>
          <motion.p className="mt-5 max-w-2xl text-base leading-7 text-[#475569] sm:text-lg sm:leading-8 lg:mt-7" variants={fadeUp}>
            LYTIX TECHNOLOGIES empowers students, startups, and businesses through internships,
            technical training, software development, AI solutions, freelancing opportunities, and career growth tools.
          </motion.p>
          <motion.div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap lg:mt-9" variants={fadeUp}>
            <Link to="/apply" className="btn-primary w-full justify-center sm:w-auto">
              <GraduationCap size={18} />
              Apply Now
            </Link>
            <Link to="/internships" className="btn-secondary w-full justify-center sm:w-auto">
              <Sparkles size={18} />
              Explore Programs
            </Link>
            <Link to="/hackathons" className="btn-secondary w-full justify-center sm:w-auto">
              <Trophy size={18} />
              Join Hackathon
            </Link>
          </motion.div>
          <motion.div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-3" variants={fadeUp}>
            {["QR verified certificates", "Mentor-led projects", "Placement ecosystem"].map((item) => (
              <div className="rounded-lg border border-[#E2E8F0] bg-white/80 px-4 py-3 text-sm font-black text-[#475569] shadow-sm backdrop-blur" key={item}>
                <BadgeCheck className="mb-2 text-[#2563EB]" size={17} />
                {item}
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          className="relative z-10 mx-auto w-full max-w-2xl"
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
        >
          <div className="relative rounded-[1.35rem] border border-[#E2E8F0] bg-white/80 p-3 shadow-[0_24px_70px_rgba(37,99,235,0.14)] backdrop-blur-xl sm:rounded-[2rem] sm:p-4 sm:shadow-[0_30px_90px_rgba(37,99,235,0.16)]">
            <div className="absolute -inset-4 -z-10 rounded-[2.2rem] bg-gradient-to-br from-blue-500/10 via-cyan-400/10 to-indigo-500/10 blur-2xl" />
            <DashboardPreview />
            {techCards.map(([label, Icon], index) => (
              <motion.div
                className={`floating-tech-card ${index % 2 === 0 ? "left-card" : "right-card"}`}
                key={label}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4 + index * 0.35, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 }}
                style={{ top: `${12 + index * 12}%` }}
              >
                <Icon size={16} />
                <span>{label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  const progressRows = [
    ["Internship Progress", "78%", "w-[78%]", GraduationCap],
    ["Project Review", "64%", "w-[64%]", Code2],
    ["Placement Ready", "82%", "w-[82%]", BriefcaseBusiness],
  ];

  return (
    <div className="overflow-hidden rounded-[1.15rem] border border-slate-200 bg-slate-950 text-white shadow-2xl sm:rounded-[1.55rem]">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
        </div>
        <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">
          Live Career OS
        </span>
      </div>
      <div className="grid gap-4 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_0.72fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Student dashboard</p>
            <h3 className="mt-3 text-2xl font-black leading-tight">AI & ML Internship</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">Offer letter issued, LMS active, project milestone in review.</p>
            <div className="mt-5 grid gap-3">
              {progressRows.map(([label, value, widthClass, Icon]) => (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-slate-300">
                    <span className="inline-flex items-center gap-2"><Icon size={14} />{label}</span>
                    <strong className="text-white">{value}</strong>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.span
                      className={`block h-full rounded-full bg-gradient-to-r from-[#06B6D4] to-[#2563EB] ${widthClass}`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 1.1, ease: "easeOut", delay: 0.35 }}
                      style={{ transformOrigin: "left" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-3">
            {[
              ["ATS Score", "86%", BadgeCheck],
              ["Certificates", "QR Ready", QrCode],
              ["Job Alerts", "12 active", Rocket],
            ].map(([label, value, Icon]) => (
              <motion.div
                className="rounded-2xl border border-white/10 bg-white/[0.07] p-4"
                key={label}
                whileHover={{ y: -4 }}
              >
                <Icon className="text-cyan-200" size={20} />
                <span className="mt-3 block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</span>
                <strong className="mt-1 block text-xl font-black">{value}</strong>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {["Domain AI match", "LinkedIn checklist", "Project portfolio"].map((item) => (
            <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-slate-200" key={item}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturedDomainsSection() {
  return (
    <motion.section
      className="section-band bg-white"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      variants={stagger}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Featured domains"
          title="Choose a career-ready technology track."
          copy="Start with structured learning paths designed around practical projects, mentor guidance, and verified outcomes."
        />
        <motion.div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" variants={stagger}>
          {featuredDomains.map(([title, copy, Icon]) => (
            <motion.div className="premium-card" key={title} variants={fadeUp} whileHover={{ y: -7 }}>
              <div className="premium-icon">
                <Icon size={23} />
              </div>
              <h3 className="mt-6 text-xl font-black text-[#0F172A]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#475569]">{copy}</p>
              <Link to="/internships" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#2563EB]">
                View program
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

function WhyChooseLytixSection() {
  return (
    <motion.section
      className="section-band bg-[#EEF4FF]"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      variants={stagger}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Why choose LYTIX"
          title="A complete ecosystem for learning, building, and career growth."
          copy="Every feature is designed to help students move from learning to proof-of-work, public credentials, and placement readiness."
        />
        <motion.div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" variants={stagger}>
          {whyChooseLytix.map(([title, copy, Icon]) => (
            <motion.div className="premium-card min-h-52" key={title} variants={fadeUp} whileHover={{ y: -7 }}>
              <Icon className="text-[#2563EB]" size={28} />
              <h3 className="mt-5 text-xl font-black text-[#0F172A]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#475569]">{copy}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

function InternshipWorkflowSection() {
  return (
    <motion.section
      className="section-band bg-white"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.16 }}
      variants={stagger}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Internship workflow"
          title="From application to verified certificate."
          copy="A transparent workflow helps students, admins, mentors, and recruiters understand progress at every stage."
        />
        <motion.div className="mt-10 grid gap-4 md:grid-cols-4 xl:grid-cols-8" variants={stagger}>
          {workflowTimeline.map((step, index) => (
            <motion.div className="timeline-card relative" key={step} variants={fadeUp} whileHover={{ y: -5 }}>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#2563EB] text-sm font-black text-white">{index + 1}</span>
              <h3 className="mt-5 text-lg font-black text-[#0F172A]">{step}</h3>
              <p className="mt-2 text-sm leading-6 text-[#475569]">
                {index === workflowTimeline.length - 1 ? "Verified completion" : "Guided milestone"}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

function StatisticsCounterSection() {
  return (
    <motion.section
      className="section-band bg-[#EEF4FF]"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={stagger}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Platform scale"
          title="Growing proof-of-work outcomes."
          copy="A quick snapshot of the LYTIX learning, project, mentorship, and credential ecosystem."
        />
        <motion.div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" variants={stagger}>
          {homeStats.map(([label, value, suffix, Icon]) => (
            <AnimatedCounter key={label} label={label} value={value} suffix={suffix} icon={Icon} />
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

function ProjectShowcaseSection() {
  return (
    <motion.section
      className="section-band bg-white"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      variants={stagger}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Project showcase"
          title="Portfolio-ready projects students can build and present."
          copy="Project ideas connect learning with demos, GitHub repositories, documentation, and recruiter-facing proof."
        />
        <motion.div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4" variants={stagger}>
          {projectShowcase.map(([title, copy, Icon]) => (
            <motion.div className="enterprise-service-card" key={title} variants={fadeUp} whileHover={{ y: -6 }}>
              <Icon className="text-[#2563EB]" size={28} />
              <h3 className="mt-5 text-xl font-black text-[#0F172A]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#475569]">{copy}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

function TestimonialsCarouselSection() {
  const storyRows = [...successStories, ...successStories];

  return (
    <section className="section-band bg-[#EEF4FF]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Testimonials"
          title="Stories from students building visible career proof."
          copy="A moving carousel of learner outcomes, portfolio progress, and credential-backed growth."
        />
        <div className="story-carousel mt-10">
          <motion.div
            className="flex gap-5"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          >
            {storyRows.map((story, index) => (
              <div className="testimonial-card min-w-[300px] sm:min-w-[380px]" key={`${story.name}-${index}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="student-photo">{story.initials}</div>
                    <div>
                      <strong className="block text-[#0F172A]">{story.name}</strong>
                      <span className="text-sm font-bold text-[#2563EB]">{story.domain}</span>
                    </div>
                  </div>
                  <Linkedin className="text-[#2563EB]" size={20} />
                </div>
                <p className="mt-5 leading-7 text-[#475569]">{story.review}</p>
                <div className="mt-5 flex gap-1 text-[#06B6D4]">
                  {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={16} fill="currentColor" />)}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function RecruiterSection() {
  return (
    <motion.section
      className="section-band bg-white"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p className="eyebrow">Recruiters</p>
          <h2 className="section-title">Hire Talent from LYTIX</h2>
          <p className="page-copy mt-5">
            Discover students with domains, skills, project links, LinkedIn profiles, and verified credential proof.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/talent" className="btn-primary">
              Explore Talent Directory
              <ArrowRight size={17} />
            </Link>
            <Link to="/contact" className="btn-secondary">
              Partner with LYTIX
            </Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {["Verified profiles", "Project portfolios", "ATS readiness", "Placement pipeline"].map((item) => (
            <div className="premium-card" key={item}>
              <UsersRound className="text-[#2563EB]" size={26} />
              <h3 className="mt-5 text-xl font-black text-[#0F172A]">{item}</h3>
              <p className="mt-3 text-sm leading-6 text-[#475569]">Recruiter-friendly signals for faster screening and candidate discovery.</p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function HackathonBanner() {
  return (
    <section className="px-4 pb-16 sm:px-6 lg:px-8">
      <motion.div
        className="cta-banner mx-auto max-w-7xl"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">Hackathon banner</p>
          <h2 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">LYTIX Innovation Challenge</h2>
          <p className="mt-4 max-w-2xl leading-7 text-blue-100">
            Join practical build challenges, submit projects, compete on leaderboards, and turn innovation into visible proof.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/hackathons" className="rounded-md bg-white px-5 py-3 text-sm font-black text-[#1D4ED8] transition hover:bg-blue-50">
            Join Hackathon
          </Link>
          <Link to="/leaderboard" className="rounded-md border border-white/30 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10">
            View Leaderboard
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

function TrustSection() {
  return (
    <motion.section
      className="section-band bg-[#EEF4FF]"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={stagger}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6" variants={stagger}>
          {trustStats.map(([label, value, suffix, Icon]) => (
            <AnimatedCounter key={label} label={label} value={value} suffix={suffix} icon={Icon} />
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

function WhatWeDoSection() {
  return (
    <motion.section
      className="section-band"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      variants={stagger}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="What we do"
          title="A complete technology, talent, and solutions ecosystem."
          copy="LYTIX combines professional software services with structured training, AI career tools, hackathons, and verified credentials."
        />
        <motion.div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" variants={stagger}>
          {whatWeDo.map(([title, copy, Icon]) => (
            <PremiumCard key={title} icon={Icon} title={title} copy={copy} />
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

function WhyChooseSection() {
  return (
    <motion.section
      className="section-band bg-[#EEF4FF]"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      variants={stagger}
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
        <motion.div variants={fadeUp}>
          <p className="eyebrow">Why choose LYTIX</p>
          <h2 className="section-title">Built for outcomes, not just enrollment.</h2>
          <p className="page-copy mt-5">
            From learning paths to verified documents and recruiter-facing talent profiles, every workflow is designed to produce visible career proof.
          </p>
          <div className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-glass">
            <div className="flex items-center gap-4">
              <div className="illustration-icon">
                <Rocket size={26} />
              </div>
              <div>
                <strong className="block text-lg text-[#0F172A]">Career-to-product workflow</strong>
                <span className="text-sm font-bold text-[#475569]">Learn, build, submit, verify, showcase.</span>
              </div>
            </div>
            <div className="mt-5 grid gap-2">
              {["Learning", "Projects", "Placement", "Verification"].map((step, index) => (
                <div className="flex items-center gap-3" key={step}>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-50 text-xs font-black text-[#2563EB]">{index + 1}</span>
                  <span className="text-sm font-bold text-[#475569]">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        <motion.div className="grid gap-4 sm:grid-cols-2" variants={stagger}>
          {whyChoose.map(([title, copy, Icon]) => (
            <motion.div className="premium-card min-h-44" key={title} variants={fadeUp} whileHover={{ y: -6 }}>
              <div className="flex items-start gap-4">
                <div className="premium-icon">
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0F172A]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#475569]">{copy}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

function EcosystemSection() {
  return (
    <motion.section
      className="section-band"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      variants={stagger}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="LYTIX ecosystem"
          title="Six divisions working together as one company."
          copy="The platform is positioned as a technology company with academy, solutions, AI labs, careers, internships, and innovation programs."
        />
        <motion.div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3" variants={stagger}>
          {ecosystem.map(([title, copy, Icon], index) => (
            <motion.div
              className="ecosystem-card"
              key={title}
              variants={fadeUp}
              whileHover={{ y: -8, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              <span className="text-xs font-black text-[#2563EB]">0{index + 1}</span>
              <Icon className="mt-6 text-[#2563EB]" size={30} />
              <h3 className="mt-5 text-2xl font-black text-[#0F172A]">{title}</h3>
              <p className="mt-3 leading-7 text-[#475569]">{copy}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

function ServicesSection() {
  return (
    <motion.section
      className="section-band bg-[#EEF4FF]"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      variants={stagger}
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.78fr_1.22fr] lg:px-8">
        <motion.div variants={fadeUp}>
          <p className="eyebrow">Business services</p>
          <h2 className="section-title">Enterprise-grade delivery for modern digital teams.</h2>
          <p className="page-copy mt-5">
            LYTIX builds digital products, internal tools, AI prototypes, cloud-ready workflows, and automation dashboards with clean implementation paths.
          </p>
          <Link to="/solutions" className="btn-primary mt-8">
            View solution portfolio
            <ArrowRight size={17} />
          </Link>
        </motion.div>
        <motion.div className="grid gap-4 sm:grid-cols-2" variants={stagger}>
          {businessServices.map(([title, copy, Icon]) => (
            <motion.div className="enterprise-service-card" key={title} variants={fadeUp} whileHover={{ y: -6 }}>
              <Icon className="text-[#2563EB]" size={26} />
              <h3 className="mt-5 text-xl font-black text-[#0F172A]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#475569]">{copy}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

function SuccessStoriesSection() {
  const storyRows = [...successStories, ...successStories];

  return (
    <section className="section-band">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Success stories"
          title="Students and partners building stronger proof of work."
          copy="Modern testimonial cards with career context, public identity cues, and professional social proof."
        />
        <div className="story-carousel mt-10">
          <motion.div
            className="flex gap-5"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          >
            {storyRows.map((story, index) => (
              <div className="testimonial-card min-w-[300px] sm:min-w-[380px]" key={`${story.name}-${index}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="student-photo">{story.initials}</div>
                    <div>
                      <strong className="block text-[#0F172A]">{story.name}</strong>
                      <span className="text-sm font-bold text-[#2563EB]">{story.domain}</span>
                    </div>
                  </div>
                  <Linkedin className="text-[#2563EB]" size={20} />
                </div>
                <p className="mt-5 leading-7 text-[#475569]">{story.review}</p>
                <div className="mt-5 flex gap-1 text-[#06B6D4]">
                  {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={16} fill="currentColor" />)}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HackathonPreview({ hackathons }) {
  return (
    <motion.section
      className="section-band bg-[#EEF4FF]"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      variants={stagger}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <SectionHeader
            eyebrow="Hackathons"
            title="Innovation challenges with leaderboards and verified submissions."
            copy="Join LYTIX build sprints, submit real projects, compete on leaderboards, and showcase your work."
          />
          <Link to="/hackathons" className="btn-secondary self-start md:self-auto">
            View all events
            <ArrowRight size={17} />
          </Link>
        </div>
        <motion.div className="mt-10 grid gap-5 lg:grid-cols-2" variants={stagger}>
          {hackathons.map((event) => (
            <motion.div className="hackathon-card" key={event.id} variants={fadeUp} whileHover={{ y: -6 }}>
              <div className="hackathon-visual">
                <Trophy size={44} />
                <span>{event.domain_name || "All domains"}</span>
              </div>
              <div className="grid gap-5 p-6">
                <div>
                  <p className="eyebrow">{event.domain_name || "All domains"}</p>
                  <h3 className="mt-2 text-2xl font-black text-[#0F172A]">{event.title}</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <HackathonMeta icon={Gift} label="Prize pool" value={event.prize || "Recognition badge"} />
                  <HackathonMeta icon={UsersRound} label="Registrations" value={`${event.registrations || 72}+`} />
                  <HackathonMeta icon={Calendar} label="Deadline" value={event.deadline || "Announcing soon"} />
                </div>
                <Link to="/hackathons" className="btn-primary justify-center">
                  Register
                  <ArrowRight size={17} />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

function PartnersSection() {
  return (
    <motion.section
      className="section-band"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={stagger}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Trusted by"
          title="Designed for institutes, startups, hiring teams, and builders."
          copy="Partner placeholders are intentionally neutral until real logos are added."
        />
        <motion.div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6" variants={stagger}>
          {partners.map((partner) => (
            <motion.div className="partner-logo" key={partner} variants={fadeUp} whileHover={{ y: -4 }}>
              {partner}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

function FinalCta() {
  return (
    <section className="px-4 pb-16 sm:px-6 lg:px-8">
      <motion.div
        className="cta-banner mx-auto max-w-7xl"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">Start with LYTIX</p>
          <h2 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">READY TO START YOUR JOURNEY?</h2>
          <p className="mt-4 max-w-2xl leading-7 text-blue-100">
            Choose an internship, request a technology solution, or join a hackathon to build proof that moves your career or company forward.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/internships" className="rounded-md bg-white px-5 py-3 text-sm font-black text-[#1D4ED8] transition hover:bg-blue-50">
            Start Internship
          </Link>
          <Link to="/services" className="rounded-md border border-white/30 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10">
            Explore Services
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, copy }) {
  return (
    <motion.div className="max-w-3xl" variants={fadeUp}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="section-title">{title}</h2>
      {copy && <p className="page-copy mt-5">{copy}</p>}
    </motion.div>
  );
}

function PremiumCard({ icon: Icon, title, copy }) {
  return (
    <motion.div className="premium-card" variants={fadeUp} whileHover={{ y: -7 }}>
      <div className="premium-icon">
        <Icon size={23} />
      </div>
      <h3 className="mt-6 text-xl font-black text-[#0F172A]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[#475569]">{copy}</p>
    </motion.div>
  );
}

function AnimatedCounter({ label, value, suffix, icon: Icon }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return undefined;
    const controls = animate(0, value, {
      duration: 1.25,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <motion.div className="counter-card" ref={ref} variants={fadeUp} whileHover={{ y: -5 }}>
      <Icon className="text-[#2563EB]" size={24} />
      <strong>{display}{suffix}</strong>
      <span>{label}</span>
    </motion.div>
  );
}

function HackathonMeta({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
      <Icon className="text-[#2563EB]" size={18} />
      <span className="mt-2 block text-xs font-black uppercase tracking-[0.12em] text-[#64748B]">{label}</span>
      <strong className="mt-1 block text-sm text-[#0F172A]">{value}</strong>
    </div>
  );
}
