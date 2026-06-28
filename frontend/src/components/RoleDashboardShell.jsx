import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, LogOut, Menu, RefreshCcw, X } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { animate, motion, useInView } from "framer-motion";

import BrandLogo from "./BrandLogo.jsx";
import { useAuth } from "../lib/auth.jsx";

export const roleFadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const RoleDashboardContext = createContext({
  activeSection: "overview",
  setActiveSection: () => {},
});

export function RoleDashboardShell({
  roleLabel,
  title,
  subtitle,
  navItems,
  badge = "Live Control",
  children,
  actions,
}) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [mobileNav, setMobileNav] = useState(false);
  const defaultSection = navItems?.find((item) => item.href?.startsWith("#"))?.href?.slice(1) || "overview";
  const sectionIds = useMemo(
    () => new Set((navItems || []).filter((item) => item.href?.startsWith("#")).map((item) => item.href.slice(1))),
    [navItems]
  );
  const [activeSection, setActiveSectionState] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return hash && sectionIds.has(hash) ? hash : defaultSection;
  });

  function setActiveSection(section) {
    if (!section || !sectionIds.has(section)) return;
    setActiveSectionState(section);
    if (window.location.hash !== `#${section}`) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${section}`);
    }
  }

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    setActiveSectionState(hash && sectionIds.has(hash) ? hash : defaultSection);
  }, [defaultSection, location.hash, sectionIds]);

  return (
    <RoleDashboardContext.Provider value={{ activeSection, setActiveSection }}>
    <main className="relative h-screen min-h-screen overflow-hidden bg-[#07111F] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(37,99,235,0.28),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(6,182,212,0.22),transparent_30%),linear-gradient(135deg,#07111F_0%,#0B1220_48%,#071A2F_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:54px_54px] opacity-40" />

      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[280px] overflow-hidden border-r border-white/10 bg-slate-950/75 p-4 shadow-[20px_0_80px_rgba(0,0,0,0.24)] backdrop-blur-2xl lg:block">
        <RoleSidebar navItems={navItems} logout={logout} roleLabel={roleLabel} user={user} activeSection={activeSection} setActiveSection={setActiveSection} />
      </aside>

      {mobileNav && (
        <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden">
          <aside className="h-full w-[280px] max-w-[86vw] overflow-hidden border-r border-white/10 bg-slate-950/95 p-4 shadow-2xl">
            <RoleSidebar navItems={navItems} logout={logout} roleLabel={roleLabel} user={user} activeSection={activeSection} setActiveSection={setActiveSection} onNavigate={() => setMobileNav(false)} closeButton />
          </aside>
        </div>
      )}

      <section className="relative z-10 h-screen min-h-0 min-w-0 overflow-y-auto overflow-x-hidden transition-all duration-300 lg:ml-[280px]">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/55 px-4 py-3 backdrop-blur-2xl sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/10 text-white lg:hidden" onClick={() => setMobileNav(true)} type="button">
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <p className="truncate text-xs font-black uppercase tracking-[0.18em] text-cyan-200">{roleLabel}</p>
                <h1 className="truncate text-lg font-black text-white sm:text-xl">{title}</h1>
              </div>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              {actions}
              <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-100">{badge}</span>
            </div>
          </div>
          {subtitle && (
            <p className="mx-auto mt-2 max-w-[1400px] text-sm font-semibold leading-6 text-slate-400 sm:hidden">{subtitle}</p>
          )}
        </header>
        <div className="mx-auto min-w-0 max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </section>
    </main>
    </RoleDashboardContext.Provider>
  );
}

function RoleSidebar({ navItems, logout, roleLabel, user, activeSection, setActiveSection, onNavigate, closeButton = false }) {
  const location = useLocation();

  function isActive(href) {
    if (!href) return false;
    if (href.startsWith("#")) return href.slice(1) === activeSection;
    const [path, hash] = href.split("#");
    if (location.pathname !== path) return false;
    return !hash || location.hash === `#${hash}`;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3">
        <Link to="/" className="min-w-0" onClick={onNavigate}>
          <BrandLogo size="sidebar" compact={false} framed={false} />
        </Link>
        {closeButton && (
          <button className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15" onClick={onNavigate} type="button" aria-label="Close dashboard menu">
            <X size={18} />
          </button>
        )}
      </div>
      <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">{roleLabel}</p>
        <p className="mt-1 truncate text-sm font-bold text-slate-300">{user?.name || "LYTIX Operator"}</p>
      </div>
      <nav className="mt-6 grid min-h-0 flex-1 content-start gap-2 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon || ChevronDown;
          const active = isActive(item.href);
          const className = `group flex min-h-12 items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-black transition ${
            active
              ? "border-cyan-300/40 bg-cyan-300/15 text-white shadow-[0_0_34px_rgba(6,182,212,0.16)]"
              : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/10 hover:text-white"
          }`;
          const content = (
            <>
              <Icon className={active ? "text-cyan-200" : "text-slate-500 group-hover:text-cyan-200"} size={19} />
              <span>{item.label}</span>
            </>
          );
          if (item.href?.startsWith("#")) {
            return (
              <button
                className={className}
                key={item.label}
                onClick={() => {
                  setActiveSection(item.href.slice(1));
                  onNavigate?.();
                }}
                type="button"
              >
                {content}
              </button>
            );
          }
          return item.href?.startsWith("/") ? (
            <NavLink to={item.href} className={className} key={item.label} onClick={onNavigate}>
              {content}
            </NavLink>
          ) : (
            <a className={className} href={item.href || "#overview"} key={item.label} onClick={onNavigate}>
              {content}
            </a>
          );
        })}
      </nav>
      <button className="mt-auto flex min-h-12 w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-sm font-black text-slate-200 transition hover:bg-white/15" onClick={logout} type="button">
        <LogOut size={19} />
        <span>Log out</span>
      </button>
    </div>
  );
}

export function useRoleDashboardSection() {
  return useContext(RoleDashboardContext);
}

export function RoleSection({ id, children, className = "" }) {
  const { activeSection } = useRoleDashboardSection();
  if (activeSection !== id) return null;
  return (
    <motion.div
      data-dashboard-section={id}
      className={`grid min-w-0 gap-6 ${className}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function RoleSectionHeader({ eyebrow, title, copy, actions }) {
  return (
    <RolePanel className="bg-white/[0.06]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <RoleSectionTitle eyebrow={eyebrow} title={title} copy={copy} />
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </RolePanel>
  );
}

export function RoleHero({ eyebrow, title, subtitle, chips = [], children }) {
  const { activeSection, setActiveSection } = useRoleDashboardSection();
  return (
    <motion.section className="relative min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.08] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-8" variants={roleFadeUp}>
      <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute -bottom-20 left-12 h-44 w-44 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-5xl">{title}</h2>
          {subtitle && <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">{subtitle}</p>}
          {chips.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {chips.map((chip) => {
                const label = typeof chip === "string" ? chip : chip.label;
                const section = typeof chip === "string" ? "" : chip.section;
                const active = section && activeSection === section;
                if (!section) return <RoleBadge key={label}>{label}</RoleBadge>;
                return (
                  <motion.button
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] outline-none transition ${
                      active
                        ? "border-cyan-300/70 bg-cyan-300/20 text-white shadow-[0_0_28px_rgba(6,182,212,0.22)]"
                        : "border-cyan-300/30 bg-cyan-300/10 text-cyan-100 hover:-translate-y-0.5 hover:border-cyan-300/60 hover:bg-cyan-300/15"
                    }`}
                    key={label}
                    onClick={() => setActiveSection(section)}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                  >
                    {label}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
        {children}
      </div>
    </motion.section>
  );
}

export function RolePanel({ children, className = "", ...props }) {
  return (
    <section className={`min-w-0 rounded-[1.7rem] border border-white/10 bg-white/[0.075] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl sm:p-6 ${className}`} {...props}>
      {children}
    </section>
  );
}

export function RoleSectionTitle({ eyebrow, title, copy }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black leading-tight text-white">{title}</h2>
      {copy && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{copy}</p>}
    </div>
  );
}

export function RoleMetricCard({ icon: Icon, label, value, footer, tone = "blue", section, onClick }) {
  const { setActiveSection } = useRoleDashboardSection();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const valueParts = useMemo(() => splitMetricValue(value), [value]);
  const [display, setDisplay] = useState(valueParts ? 0 : value);
  const colors = {
    blue: "from-blue-600/25 to-blue-400/10",
    cyan: "from-cyan-500/25 to-cyan-300/10",
    indigo: "from-indigo-500/25 to-blue-500/10",
    slate: "from-white/10 to-white/[0.04]",
  };

  useEffect(() => {
    if (!inView || !valueParts) {
      setDisplay(valueParts ? 0 : value);
      return undefined;
    }
    const controls = animate(0, valueParts.numeric, {
      duration: 1,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, value, valueParts]);

  return (
    <motion.div
      ref={ref}
      role={section || onClick ? "button" : undefined}
      tabIndex={section || onClick ? 0 : undefined}
      onClick={() => {
        onClick?.();
        if (section) setActiveSection(section);
      }}
      onKeyDown={(event) => {
        if (!(section || onClick)) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
          if (section) setActiveSection(section);
        }
      }}
      className={`relative min-w-0 overflow-hidden rounded-[1.4rem] border border-white/10 bg-gradient-to-br ${colors[tone] || colors.blue} p-5 shadow-[0_18px_55px_rgba(0,0,0,0.18)] backdrop-blur-2xl ${section || onClick ? "cursor-pointer outline-none focus:border-cyan-300/70 focus:ring-4 focus:ring-cyan-300/15" : ""}`}
      whileHover={{ y: -6, boxShadow: "0 24px 70px rgba(6,182,212,0.22)" }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      <Icon className="relative text-cyan-200" size={24} />
      <span className="relative mt-5 block text-xs font-black uppercase tracking-[0.14em] text-slate-300">{label}</span>
      <strong className="relative mt-2 block break-words text-3xl font-black text-white">
        {valueParts ? `${valueParts.prefix}${display}${valueParts.suffix}` : value}
      </strong>
      <div className="relative mt-4 flex h-8 items-end gap-1">
        {[42, 64, 48, 78, 58, 86].map((height, index) => (
          <motion.span
            className="w-full rounded-t bg-cyan-300/35"
            initial={{ height: "12%" }}
            whileInView={{ height: `${height}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: index * 0.04, ease: "easeOut" }}
            key={index}
          />
        ))}
      </div>
      {footer && <p className="relative mt-3 text-xs font-bold text-slate-300">{footer}</p>}
    </motion.div>
  );
}

function splitMetricValue(value) {
  if (typeof value === "number") {
    return { prefix: "", numeric: value, suffix: "" };
  }
  const text = String(value ?? "");
  const match = text.match(/^([^0-9-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  return {
    prefix: match[1],
    numeric: Number(match[2].replace(/,/g, "")),
    suffix: match[3],
  };
}

export function RoleBadge({ children, tone = "cyan" }) {
  const tones = {
    cyan: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
    blue: "border-blue-300/30 bg-blue-500/10 text-blue-100",
    green: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
    amber: "border-amber-300/30 bg-amber-400/10 text-amber-100",
    rose: "border-rose-300/30 bg-rose-400/10 text-rose-100",
    slate: "border-white/10 bg-white/10 text-slate-200",
  };
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${tones[tone] || tones.cyan}`}>{children}</span>;
}

export function RoleButton({ children, variant = "primary", className = "", ...props }) {
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

export function RoleField({ as, className = "", children, ...props }) {
  const Component = as || "input";
  const isSelect = Component === "select";
  return (
    <Component className={`w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70 focus:bg-white/[0.13] ${isSelect ? "lytix-dark-select" : ""} ${className}`} {...props}>
      {children}
    </Component>
  );
}

export function RoleNotice({ type = "success", children }) {
  const isError = type === "error";
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${isError ? "border-rose-400/30 bg-rose-500/10 text-rose-100" : "border-cyan-300/30 bg-cyan-400/10 text-cyan-100"}`}>
      {children}
    </div>
  );
}

export function RoleEmpty({ message }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-5 text-sm font-bold text-slate-400">{message}</div>;
}

export function RoleProgressBar({ label, value, footer, section }) {
  const { activeSection, setActiveSection } = useRoleDashboardSection();
  const normalized = Math.max(0, Math.min(100, Number(value || 0)));
  const active = section && activeSection === section;
  return (
    <div
      className={`rounded-2xl outline-none transition ${section ? "cursor-pointer p-3 hover:bg-cyan-300/10 focus:bg-cyan-300/10" : ""} ${active ? "bg-cyan-300/10 ring-1 ring-cyan-300/40" : ""}`}
      onClick={() => section && setActiveSection(section)}
      onKeyDown={(event) => {
        if (!section) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setActiveSection(section);
        }
      }}
      role={section ? "button" : undefined}
      tabIndex={section ? 0 : undefined}
    >
      <div className="flex items-center justify-between gap-3 text-sm font-black text-slate-200">
        <span>{label}</span>
        <span className="text-cyan-100">{Math.round(normalized)}%</span>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
        <motion.span className="block h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300" initial={{ width: 0 }} animate={{ width: `${normalized}%` }} transition={{ duration: 0.8 }} />
      </div>
      {footer && <p className="mt-2 text-xs font-bold text-slate-400">{footer}</p>}
    </div>
  );
}

export function RoleRefreshButton({ onClick, disabled }) {
  return (
    <RoleButton variant="secondary" onClick={onClick} disabled={disabled} type="button">
      <RefreshCcw size={17} />
      Refresh
    </RoleButton>
  );
}
