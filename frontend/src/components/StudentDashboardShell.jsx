import React, { useEffect, useRef, useState } from "react";
import { animate, motion, useInView } from "framer-motion";
import {
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarCheck,
  ChevronLeft,
  ClipboardList,
  FileCheck2,
  FileQuestion,
  FolderGit2,
  LayoutDashboard,
  LifeBuoy,
  Linkedin,
  LogOut,
  Menu,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

import BrandLogo from "./BrandLogo.jsx";
import { useAuth } from "../lib/auth.jsx";

export const studentSidebarItems = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Learning", href: "/learning#learning", icon: BookOpenCheck },
  { label: "Attendance", href: "/learning#attendance", icon: CalendarCheck },
  { label: "Assignments", href: "/learning#assignments", icon: ClipboardList },
  { label: "Quizzes", href: "/learning#quizzes", icon: FileQuestion },
  { label: "Projects", href: "/project", icon: FolderGit2 },
  { label: "Documents", href: "/documents", icon: FileCheck2 },
  { label: "LinkedIn", href: "/linkedin", icon: Linkedin },
  { label: "Placement", href: "/placement", icon: BriefcaseBusiness },
  { label: "Support", href: "/support", icon: LifeBuoy },
  { label: "Profile", href: "#profile", icon: UserRound },
  { label: "Settings", href: "#settings", icon: Settings },
];

export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export function StudentDashboardShell({
  children,
  title = "Internship Command Center",
  eyebrow = "LYTIX Student OS",
  badge = "Live Dashboard",
  activeSection,
  onSectionSelect,
  sectionNavigation = {},
}) {
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <main className="relative h-screen min-h-screen overflow-hidden bg-[#07111F] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(37,99,235,0.28),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(6,182,212,0.22),transparent_30%),linear-gradient(135deg,#07111F_0%,#0B1220_48%,#071A2F_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:54px_54px] opacity-40" />

      <aside className={`fixed left-0 top-0 z-30 hidden h-screen overflow-hidden border-r border-white/10 bg-slate-950/70 p-4 shadow-[20px_0_80px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition-all duration-300 lg:block ${collapsed ? "w-[88px]" : "w-[280px]"}`}>
        <SidebarContent
          activeSection={activeSection}
          collapsed={collapsed}
          logout={logout}
          onSectionSelect={onSectionSelect}
          sectionNavigation={sectionNavigation}
          setCollapsed={setCollapsed}
        />
      </aside>

      {mobileNav && (
        <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden">
          <aside className="h-full w-[280px] max-w-[86vw] overflow-hidden border-r border-white/10 bg-slate-950/95 p-4 shadow-2xl">
            <SidebarContent
              activeSection={activeSection}
              collapsed={false}
              closeButton
              logout={logout}
              onNavigate={() => setMobileNav(false)}
              onSectionSelect={onSectionSelect}
              sectionNavigation={sectionNavigation}
              setCollapsed={() => setMobileNav(false)}
            />
          </aside>
        </div>
      )}

      <section className={`relative z-10 h-screen min-h-0 min-w-0 overflow-y-auto overflow-x-hidden transition-all duration-300 ${collapsed ? "lg:ml-[88px]" : "lg:ml-[280px]"}`}>
        <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/55 px-4 py-3 backdrop-blur-2xl sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/10 text-white lg:hidden" onClick={() => setMobileNav(true)} type="button">
                <Menu size={20} />
              </button>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">{eyebrow}</p>
                <h2 className="text-lg font-black text-white sm:text-xl">{title}</h2>
              </div>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-100">{badge}</span>
              <button className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15" onClick={logout} title="Log out" type="button">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>
        <div className="mx-auto min-w-0 max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </section>
    </main>
  );
}

function SidebarContent({ activeSection, collapsed, setCollapsed, logout, closeButton = false, onNavigate, onSectionSelect, sectionNavigation = {} }) {
  const location = useLocation();

  function isActive(href) {
    if (href.startsWith("#")) return location.hash === href;
    const [path, hash] = href.split("#");
    if (location.pathname !== path) return false;
    if (!hash) return true;
    const fullHash = `#${hash}`;
    return location.hash === fullHash || (!location.hash && fullHash === "#learning");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3">
        <Link to="/" className={`min-w-0 ${collapsed ? "mx-auto" : ""}`} onClick={onNavigate}>
          <BrandLogo size={collapsed ? "icon" : "sidebar"} compact={collapsed} framed={false} />
        </Link>
        <button
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15"
          onClick={() => setCollapsed((current) => !current)}
          type="button"
          aria-label={closeButton ? "Close dashboard menu" : "Toggle sidebar"}
        >
          {closeButton ? <X size={18} /> : <ChevronLeft className={`transition ${collapsed ? "rotate-180" : ""}`} size={18} />}
        </button>
      </div>
      {!collapsed && <p className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-xs font-bold leading-5 text-cyan-100">Learn. Build. Innovate.</p>}
      <nav className="mt-6 grid min-h-0 flex-1 content-start gap-2 overflow-y-auto pr-1">
        {studentSidebarItems.map((item) => {
          const Icon = item.icon;
          const sectionTarget = sectionNavigation[item.label];
          const active = sectionTarget ? activeSection === sectionTarget : isActive(item.href);
          const className = `group flex min-h-12 items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-black transition ${
            active
              ? "border-cyan-300/40 bg-cyan-300/15 text-white shadow-[0_0_34px_rgba(6,182,212,0.16)]"
              : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/10 hover:text-white"
          } ${collapsed ? "justify-center" : ""}`;
          const content = (
            <>
              <Icon className={active ? "text-cyan-200" : "text-slate-500 group-hover:text-cyan-200"} size={19} />
              {!collapsed && <span>{item.label}</span>}
            </>
          );
          if (sectionTarget && onSectionSelect) {
            return (
              <button
                className={className}
                key={item.label}
                onClick={() => {
                  onSectionSelect(sectionTarget);
                  onNavigate?.();
                }}
                type="button"
              >
                {content}
              </button>
            );
          }
          return item.href.startsWith("/") ? (
            <NavLink to={item.href} className={className} key={item.label} onClick={onNavigate}>
              {content}
            </NavLink>
          ) : (
            <a className={className} href={item.href} key={item.label} onClick={onNavigate}>
              {content}
            </a>
          );
        })}
      </nav>
      <div className="mt-auto pt-4">
        <button className={`flex min-h-12 w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-sm font-black text-slate-200 transition hover:bg-white/15 ${collapsed ? "justify-center" : ""}`} onClick={logout} type="button">
          <LogOut size={19} />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </div>
  );
}

export function PageHero({ eyebrow, title, subtitle, actions, children }) {
  return (
    <motion.section
      className="relative min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.08] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-8"
      variants={fadeUp}
    >
      <motion.div
        className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl"
        animate={{ scale: [1, 1.14, 1], opacity: [0.55, 0.9, 0.55] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-20 left-12 h-44 w-44 rounded-full bg-blue-500/20 blur-3xl"
        animate={{ x: [0, 18, 0], y: [0, -12, 0], opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 7.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">{subtitle}</p>}
          {children}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </motion.section>
  );
}

export function HeroInfo({ label, value, accent = false, onClick }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 transition ${accent ? "border-cyan-300/30 bg-cyan-300/10" : "border-white/10 bg-white/[0.06]"} ${onClick ? "cursor-pointer outline-none hover:-translate-y-0.5 hover:border-cyan-300/50 hover:bg-cyan-300/10 focus:border-cyan-300/70 focus:ring-4 focus:ring-cyan-300/15" : ""}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <span className="block text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</span>
      <strong className="mt-2 block break-words text-sm font-black text-white">{value}</strong>
    </div>
  );
}

export function DarkPanel({ children, className = "", ...props }) {
  return (
    <section className={`min-w-0 rounded-[1.7rem] border border-white/10 bg-white/[0.075] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl sm:p-6 ${className}`} {...props}>
      {children}
    </section>
  );
}

export function SectionTitle({ eyebrow, title, copy }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black leading-tight text-white">{title}</h2>
      {copy && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{copy}</p>}
    </div>
  );
}

export function CircularProgress({ value, size = 160, stroke = 12 }) {
  const normalized = Math.max(0, Math.min(100, Number(value || 0)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#studentProgressGradient)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="studentProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-3xl font-black text-white">{Math.round(normalized)}%</span>
    </div>
  );
}

export function MetricCard({ icon: Icon, label, value, suffix = "", tone = "blue", footer, onClick, active = false }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(0);
  const numeric = Number(value || 0);
  const colors = {
    blue: "from-blue-600/25 to-blue-400/10 text-blue-100",
    cyan: "from-cyan-500/25 to-cyan-300/10 text-cyan-100",
    indigo: "from-indigo-500/25 to-blue-500/10 text-indigo-100",
    slate: "from-white/10 to-white/[0.04] text-slate-100",
  };

  useEffect(() => {
    if (!inView) return undefined;
    const controls = animate(0, numeric, {
      duration: 1.1,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, numeric]);

  return (
    <motion.div
      ref={ref}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className={`relative min-w-0 overflow-hidden rounded-[1.4rem] border bg-gradient-to-br ${colors[tone] || colors.blue} p-5 shadow-[0_18px_55px_rgba(0,0,0,0.18)] backdrop-blur-2xl outline-none ${active ? "border-cyan-300/70 ring-4 ring-cyan-300/15" : "border-white/10"} ${onClick ? "cursor-pointer focus:border-cyan-300/70 focus:ring-4 focus:ring-cyan-300/15" : ""}`}
      whileHover={{ y: -6, boxShadow: "0 24px 70px rgba(6,182,212,0.22)" }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      <Icon className="relative text-cyan-200" size={24} />
      <span className="relative mt-5 block text-xs font-black uppercase tracking-[0.14em] text-slate-300">{label}</span>
      <strong className="relative mt-2 block break-words text-3xl font-black text-white">{display}{suffix}</strong>
      <div className="relative mt-4 flex h-8 items-end gap-1">
        {[38, 56, 44, 70, 62, 86].map((height, index) => (
          <span className="w-full rounded-t bg-cyan-300/40" style={{ height: `${Math.max(14, Math.min(100, (height + numeric) / 2))}%` }} key={index} />
        ))}
      </div>
      {footer && <p className="relative mt-3 text-xs font-bold text-slate-300">{footer}</p>}
    </motion.div>
  );
}

export function TextStatCard({ icon: Icon, label, value, footer, onClick, active = false }) {
  return (
    <motion.div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className={`relative min-w-0 overflow-hidden rounded-[1.4rem] border bg-white/[0.075] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.18)] backdrop-blur-2xl outline-none ${active ? "border-cyan-300/70 ring-4 ring-cyan-300/15" : "border-white/10"} ${onClick ? "cursor-pointer focus:border-cyan-300/70 focus:ring-4 focus:ring-cyan-300/15" : ""}`}
      whileHover={{ y: -6, boxShadow: "0 24px 70px rgba(6,182,212,0.18)" }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <Icon className="text-cyan-200" size={24} />
      <span className="mt-5 block text-xs font-black uppercase tracking-[0.14em] text-slate-300">{label}</span>
      <strong className="mt-2 block break-words text-2xl font-black text-white">{value}</strong>
      {footer && <p className="mt-4 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-100">{footer}</p>}
    </motion.div>
  );
}

export function ProgressLine({ label, value, className = "" }) {
  const normalized = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between text-sm font-black text-slate-200">
        <span>{label}</span>
        <span>{normalized}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <motion.span
          className="block h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
          initial={{ width: 0 }}
          whileInView={{ width: `${normalized}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export function ProjectSignal({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
      <Icon className="text-cyan-200" size={19} />
      <span className="mt-3 block text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</span>
      <strong className="mt-2 block break-words text-sm font-black text-white">{value}</strong>
    </div>
  );
}

export function DeadlineRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <Icon className="text-cyan-200" size={19} />
      <div>
        <h3 className="text-sm font-black text-white">{label}</h3>
        <p className="mt-1 text-sm font-bold text-slate-400">{value}</p>
      </div>
    </div>
  );
}

export function EmptyDark({ message }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-5 text-sm font-bold text-slate-400">
      {message}
    </div>
  );
}

export function Notice({ type = "success", children }) {
  const isError = type === "error";
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${isError ? "border-rose-400/30 bg-rose-500/10 text-rose-100" : "border-cyan-300/30 bg-cyan-400/10 text-cyan-100"}`}>
      {children}
    </div>
  );
}

export function DarkField({ children, className = "", ...props }) {
  const Component = props.as || "input";
  const cleanProps = { ...props };
  delete cleanProps.as;
  return (
    <Component
      className={`w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70 focus:bg-white/[0.13] ${className}`}
      {...cleanProps}
    >
      {children}
    </Component>
  );
}

export function DarkButton({ children, variant = "primary", className = "", ...props }) {
  const base = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50";
  const style = variant === "primary"
    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20 hover:-translate-y-0.5"
    : "border border-white/10 bg-white/10 text-white hover:-translate-y-0.5 hover:bg-white/15";
  return (
    <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className={`${base} ${style} ${className}`} {...props}>
      {children}
    </motion.button>
  );
}
