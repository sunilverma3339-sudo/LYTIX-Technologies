import React, { useEffect, useRef, useState } from "react";
import { animate, motion, useInView } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  Code2,
  Crown,
  IndianRupee,
  Laptop,
  Layers3,
  Medal,
  Palette,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import BrandLogo, { BRAND } from "../components/BrandLogo.jsx";
import freelanceIllustration from "../assets/lytix-freelance-hub.png";
import { api } from "../lib/api";

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const floatingCards = [
  ["Verified Intern Freelancer", ShieldCheck],
  ["Total Earnings", IndianRupee],
  ["Client Rating", Star],
  ["Active Projects", BriefcaseBusiness],
];

const stats = [
  ["Projects Posted", 500, "", "+"],
  ["Freelancers", 1250, "", "+"],
  ["Clients", 300, "", "+"],
  ["Freelancer Earnings", 25, "Rs ", "L+"],
];

const sampleProjects = [
  {
    id: "sample-1",
    title: "Startup Landing Page",
    category: "Web Development",
    budget: "Rs 12,000",
    duration: "10 days",
    skills_list: ["React", "Tailwind", "Responsive UI"],
    status: "Approved",
  },
  {
    id: "sample-2",
    title: "Food Delivery App UI",
    category: "Mobile App Development",
    budget: "Rs 18,000",
    duration: "3 weeks",
    skills_list: ["Mobile UI", "Figma", "UX Flows"],
    status: "Approved",
  },
  {
    id: "sample-3",
    title: "AI Resume Analyzer",
    category: "AI & Machine Learning",
    budget: "Rs 25,000",
    duration: "4 weeks",
    skills_list: ["Python", "NLP", "FastAPI"],
    status: "Approved",
  },
  {
    id: "sample-4",
    title: "SaaS Dashboard Redesign",
    category: "UI/UX Design",
    budget: "Rs 16,000",
    duration: "2 weeks",
    skills_list: ["Figma", "Design System", "UX"],
    status: "Approved",
  },
  {
    id: "sample-5",
    title: "Sales Analytics Report",
    category: "Data Science",
    budget: "Rs 20,000",
    duration: "3 weeks",
    skills_list: ["Python", "Power BI", "SQL"],
    status: "Approved",
  },
];

const freelancers = [
  ["Aarav Mehta", "Web Development", "4.9", ["React", "FastAPI", "Tailwind"], "AM"],
  ["Riya Sharma", "UI/UX Design", "4.8", ["Figma", "Design Systems", "UX"], "RS"],
  ["Kabir Rao", "AI & ML", "4.9", ["Python", "ML", "NLP"], "KR"],
  ["Naina Iyer", "Data Science", "4.7", ["Power BI", "SQL", "Python"], "NI"],
];

const steps = [
  ["Complete Internship", "Finish a structured LYTIX internship path.", BadgeCheck],
  ["Build Portfolio", "Publish projects, demos, and documentation.", Laptop],
  ["Get Verified Badge", "Earn the Verified Intern Freelancer badge.", Medal],
  ["Apply for Projects", "Match with real client and internal projects.", BriefcaseBusiness],
  ["Earn Experience", "Gain paid experience and client feedback.", IndianRupee],
  ["Get Placement Opportunities", "Turn proof-of-work into career visibility.", Rocket],
];

const clientReasons = [
  ["Verified Talent", "Freelancers come from structured LYTIX internship workflows.", ShieldCheck],
  ["Portfolio Backed", "Clients can review projects, GitHub links, and demos.", Laptop],
  ["Affordable Pricing", "Student talent with guided delivery and practical pricing.", IndianRupee],
  ["On-Time Delivery", "Clear scope, duration, milestones, and review workflow.", Clock],
  ["Secure Platform", "MVP marketplace flow designed for trust and verification.", CheckCircle2],
];

export default function FreelanceHubPage() {
  const [projects, setProjects] = useState(sampleProjects);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectError, setProjectError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadProjects() {
      setLoadingProjects(true);
      setProjectError("");
      try {
        const rows = await api("/freelance/projects", { token: "" });
        if (active) {
          setProjects(rows.length ? rows : sampleProjects);
        }
      } catch (err) {
        if (active) {
          setProjectError(`${err.message}. Showing sample approved projects.`);
          setProjects(sampleProjects);
        }
      } finally {
        if (active) setLoadingProjects(false);
      }
    }
    loadProjects();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="overflow-hidden bg-[#F8FAFC]">
      <HeroSection />
      <StatsSection />
      <FeaturedProjects projects={projects} loading={loadingProjects} error={projectError} />
      <TopFreelancers />
      <HowItWorks />
      <WhyClientsChoose />
      <FinalCta />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-[#EEF4FF] to-[#F8FAFC]">
      <div className="hero-grid" />
      <div className="pointer-events-none absolute inset-x-0 top-20 mx-auto h-72 max-w-4xl rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-9 px-4 py-12 sm:px-6 sm:py-16 lg:min-h-[88vh] lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:px-8 lg:py-20">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="relative z-10">
          <motion.div variants={fadeUp}>
            <BrandLogo size="page" />
            <p className="mt-3 text-sm font-black uppercase tracking-[0.18em] text-[#2563EB]">{BRAND.tagline}</p>
          </motion.div>
          <motion.p className="eyebrow mt-5" variants={fadeUp}>LYTIX FREELANCE HUB</motion.p>
          <motion.h1
            className="mt-4 max-w-3xl text-[40px] font-black leading-[1.02] text-[#0F172A] min-[375px]:text-[44px] sm:text-6xl lg:text-7xl"
            variants={fadeUp}
          >
            Earn While You Learn
          </motion.h1>
          <motion.p className="mt-5 max-w-2xl text-base leading-7 text-[#475569] sm:text-lg sm:leading-8" variants={fadeUp}>
            Work on real projects, build your portfolio, gain experience, and earn income through the LYTIX Freelance Hub.
          </motion.p>
          <motion.div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap" variants={fadeUp}>
            <a href="#featured-projects" className="btn-primary w-full justify-center sm:w-auto">
              <BriefcaseBusiness size={18} />
              Browse Projects
            </a>
            <Link to="/freelance/post-project" className="btn-secondary w-full justify-center sm:w-auto">
              <Rocket size={18} />
              Post a Project
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="relative z-10 mx-auto w-full max-w-2xl"
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut", delay: 0.08 }}
        >
          <div className="relative rounded-[1.35rem] border border-[#E2E8F0] bg-white/80 p-2 shadow-[0_24px_70px_rgba(37,99,235,0.14)] backdrop-blur-xl sm:rounded-[2rem] sm:p-3">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-blue-500/10 via-cyan-400/10 to-indigo-500/10 blur-2xl" />
            <img
              src={freelanceIllustration}
              alt="LYTIX Freelance Hub student freelancer illustration with projects, ratings, and earnings panels"
              className="w-full rounded-[1rem] object-cover sm:rounded-[1.55rem]"
            />
            {floatingCards.map(([label, Icon], index) => (
              <motion.div
                className={`freelance-floating-card ${index % 2 === 0 ? "left-card" : "right-card"}`}
                key={label}
                animate={{ y: [0, -9, 0] }}
                transition={{ duration: 3.8 + index * 0.35, repeat: Infinity, ease: "easeInOut", delay: index * 0.18 }}
                style={{ top: `${14 + index * 18}%` }}
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

function StatsSection() {
  return (
    <motion.section
      className="section-band bg-[#EEF4FF]"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={stagger}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div className="grid grid-cols-2 gap-4 lg:grid-cols-4" variants={stagger}>
          {stats.map(([label, value, prefix, suffix]) => (
            <FreelanceCounter key={label} label={label} value={value} prefix={prefix} suffix={suffix} />
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

function FeaturedProjects({ projects, loading, error }) {
  return (
    <motion.section
      id="featured-projects"
      className="section-band"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      variants={stagger}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Featured projects"
          title="Approved project opportunities for verified student freelancers."
          copy="Only admin-approved projects appear in the public Freelance Hub marketplace."
        />
        {error && <div className="error-panel mt-6">{error}</div>}
        {loading && <div className="loader-panel mt-6">Loading approved freelance projects...</div>}
        <motion.div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3" variants={stagger}>
          {projects.map((project) => {
            const Icon = projectIcon(project.category);
            return (
              <motion.div className="freelance-project-card" key={project.id || project.title} variants={fadeUp} whileHover={{ y: -7 }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="premium-icon">
                    <Icon size={23} />
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#2563EB]">{project.status}</span>
                </div>
                <h3 className="mt-6 text-xl font-black text-[#0F172A]">{project.title}</h3>
                <p className="mt-2 text-sm font-bold text-[#2563EB]">{project.category}</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <InfoPill label="Budget" value={project.budget} />
                  <InfoPill label="Duration" value={project.duration} />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {(project.skills_list || []).slice(0, 4).map((skill) => (
                    <span className="skill-chip" key={skill}>{skill}</span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
        {!loading && projects.length === 0 && <div className="loader-panel mt-6">No approved projects are available yet.</div>}
        <div className="mt-8 flex justify-center">
          <a href="#featured-projects" className="btn-secondary">
            View All Projects
            <ArrowRight size={17} />
          </a>
        </div>
      </div>
    </motion.section>
  );
}

function TopFreelancers() {
  return (
    <motion.section
      id="success-stories"
      className="section-band bg-[#EEF4FF]"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      variants={stagger}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Top freelancers"
          title="Verified Intern Freelancers ready for project work."
          copy="Showcase students who have completed internships, built portfolios, and earned a verified freelancing badge."
        />
        <motion.div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4" variants={stagger}>
          {freelancers.map(([name, domain, rating, skills, initials]) => (
            <motion.div className="freelancer-card" key={name} variants={fadeUp} whileHover={{ y: -7 }}>
              <div className="freelancer-avatar">{initials}</div>
              <h3 className="mt-5 text-xl font-black text-[#0F172A]">{name}</h3>
              <p className="mt-1 text-sm font-bold text-[#2563EB]">{domain}</p>
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-cyan-50 px-3 py-1 text-sm font-black text-cyan-700">
                <Star size={15} fill="currentColor" />
                {rating}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {skills.map((skill) => <span className="skill-chip" key={skill}>{skill}</span>)}
              </div>
              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-[#1D4ED8]">
                Verified Intern Freelancer
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

function HowItWorks() {
  return (
    <motion.section
      className="section-band"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.16 }}
      variants={stagger}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="How it works"
          title="Internship to portfolio to freelancing to placement."
          copy="A practical transition path that helps students move from guided learning into real earning and career opportunities."
        />
        <motion.div className="mt-10 grid gap-4 md:grid-cols-3 xl:grid-cols-6" variants={stagger}>
          {steps.map(([title, copy, Icon], index) => (
            <motion.div className="timeline-card" key={title} variants={fadeUp} whileHover={{ y: -6 }}>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#2563EB] text-sm font-black text-white">{index + 1}</span>
              <Icon className="mt-5 text-[#2563EB]" size={24} />
              <h3 className="mt-4 text-lg font-black text-[#0F172A]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#475569]">{copy}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

function WhyClientsChoose() {
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
          eyebrow="Why clients choose LYTIX"
          title="A talent marketplace backed by learning, proof, and verification."
          copy="Clients get access to motivated student freelancers with structured training history and portfolio evidence."
        />
        <motion.div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5" variants={stagger}>
          {clientReasons.map(([title, copy, Icon]) => (
            <motion.div className="premium-card min-h-56" key={title} variants={fadeUp} whileHover={{ y: -7 }}>
              <div className="premium-icon">
                <Icon size={23} />
              </div>
              <h3 className="mt-5 text-lg font-black text-[#0F172A]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#475569]">{copy}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

function FinalCta() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <motion.div
        className="cta-banner mx-auto max-w-7xl"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">LYTIX Freelance Hub</p>
          <h2 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">Ready to Start Your Freelancing Journey?</h2>
          <p className="mt-4 max-w-2xl leading-7 text-blue-100">
            Build real client experience, earn project income, and turn internship proof into stronger placement opportunities.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href="#featured-projects" className="rounded-md bg-white px-5 py-3 text-center text-sm font-black text-[#1D4ED8] transition hover:bg-blue-50">
            Browse Projects
          </a>
          <Link to="/freelance/post-project" className="rounded-md border border-white/30 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/10">
            Post a Project
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

function InfoPill({ label, value }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
      <span className="block text-xs font-black uppercase tracking-[0.12em] text-[#64748B]">{label}</span>
      <strong className="mt-1 block text-sm text-[#0F172A]">{value}</strong>
    </div>
  );
}

function FreelanceCounter({ label, value, prefix = "", suffix = "" }) {
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
      <Crown className="text-[#2563EB]" size={24} />
      <strong>{prefix}{display.toLocaleString("en-IN")}{suffix}</strong>
      <span>{label}</span>
    </motion.div>
  );
}

function projectIcon(category) {
  const map = {
    "Web Development": Code2,
    "Mobile App Development": Smartphone,
    "AI & Machine Learning": Sparkles,
    "AI & ML": Sparkles,
    "Data Science": Layers3,
    "UI/UX Design": Palette,
  };
  return map[category] || BriefcaseBusiness;
}
