import React from "react";
import { Link } from "react-router-dom";

import BrandLogo, { BRAND } from "./BrandLogo.jsx";

const quickLinks = [
  ["Home", "/"],
  ["About", "/about"],
  ["Internships", "/internships"],
  ["Services", "/services"],
  ["Solutions", "/solutions"],
  ["Freelance Hub", "/freelance"],
  ["Hackathons", "/hackathons"],
  ["Talent Directory", "/talent"],
  ["Verify Certificate", "/verify"],
  ["Contact Us", "/contact"],
];

const services = [
  ["Website Development", "/services"],
  ["Mobile App Development", "/services"],
  ["AI & ML Solutions", "/solutions"],
  ["Cloud & DevOps", "/solutions"],
  ["Business Dashboards", "/solutions"],
  ["IoT & Automation", "/solutions"],
];

const domains = [
  "Python Development",
  "Web Development MERN Stack",
  "Machine Learning and AI",
  "Data Science and Analytics",
  "Cloud Computing and DevOps",
  "PLC and SCADA Automation",
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#0B1220]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.25fr_0.9fr_0.9fr_0.9fr_0.85fr] lg:px-8">
        <div>
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo size="footer" />
          </Link>
          <p className="mt-3 text-sm font-black text-cyan-200">{BRAND.tagline}</p>
          <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
            LYTIX TECHNOLOGIES builds digital solutions and future-ready talent through
            internships, training, AI tools, web and app development, automation, and verified credentials.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a className="rounded border border-slate-700 px-3 py-1 text-xs font-black text-slate-300 hover:border-cyan-400 hover:text-cyan-300" href="https://www.linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a>
            <a className="rounded border border-slate-700 px-3 py-1 text-xs font-black text-slate-300 hover:border-cyan-400 hover:text-cyan-300" href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
            <a className="rounded border border-slate-700 px-3 py-1 text-xs font-black text-slate-300 hover:border-cyan-400 hover:text-cyan-300" href="https://www.instagram.com" target="_blank" rel="noreferrer">Instagram</a>
          </div>
        </div>

        <FooterColumn title="Quick links">
          {quickLinks.map(([label, href]) => (
            <Link key={href} to={href}>{label}</Link>
          ))}
        </FooterColumn>

        <FooterColumn title="Services">
          {services.map(([label, href]) => (
            <Link key={label} to={href}>{label}</Link>
          ))}
        </FooterColumn>

        <FooterColumn title="Internship domains">
          {domains.map((domain) => (
            <Link key={domain} to="/internships">{domain}</Link>
          ))}
        </FooterColumn>

        <FooterColumn title="Contact">
          <span>Email: hello@lytix.tech</span>
          <span>Phone: +91 90000 00000</span>
          <span>Office: LYTIX TECHNOLOGIES, Bengaluru, India</span>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms & Conditions</Link>
        </FooterColumn>
      </div>
      <div className="border-t border-slate-800 px-4 py-4 text-center text-xs font-bold text-slate-500">
        (c) 2026 LYTIX TECHNOLOGIES. Founded by Sunil Kumar. All rights reserved.
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }) {
  return (
    <div>
      <h2 className="text-sm font-black uppercase tracking-[0.12em] text-cyan-300">{title}</h2>
      <div className="mt-4 grid gap-2 text-sm text-slate-400">
        {children}
      </div>
    </div>
  );
}
