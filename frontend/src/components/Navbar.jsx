import React, { useState } from "react";
import {
  BarChart3,
  Building2,
  BriefcaseBusiness,
  ChevronDown,
  Cloud,
  Code2,
  Cpu,
  FileText,
  GraduationCap,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

import BrandLogo from "./BrandLogo.jsx";
import { useAuth } from "../lib/auth.jsx";

const navGroups = [
  {
    label: "Programs",
    icon: GraduationCap,
    items: [
      { label: "Internships", to: "/internships", icon: BriefcaseBusiness },
      { label: "Training Programs", to: "/training-programs", icon: GraduationCap },
      { label: "Certifications", to: "/certifications", icon: ShieldCheck },
      { label: "Placement Cell", to: "/placement-cell", icon: UsersRound },
    ],
  },
  {
    label: "Solutions",
    icon: Sparkles,
    items: [
      { label: "AI Solutions", to: "/solutions#ai-solutions", icon: Sparkles },
      { label: "Web Development", to: "/solutions#web-development", icon: Code2 },
      { label: "Mobile App Development", to: "/solutions#mobile-app-development", icon: BriefcaseBusiness },
      { label: "Cloud & DevOps", to: "/solutions#cloud-devops", icon: Cloud },
      { label: "IoT & Automation", to: "/solutions#iot-automation", icon: Cpu },
    ],
  },
  {
    label: "Freelance Hub",
    icon: BriefcaseBusiness,
    items: [
      { label: "Browse Projects", to: "/freelance#featured-projects", icon: Search },
      { label: "Post Project", to: "/freelance/post-project", icon: Rocket },
      { label: "Find Freelancers", to: "/freelancers", icon: UsersRound },
    ],
  },
  {
    label: "Community",
    icon: UsersRound,
    items: [
      { label: "Hackathons", to: "/hackathons", icon: Trophy },
      { label: "Talent Directory", to: "/talent", icon: Search },
      { label: "Leaderboard", to: "/leaderboard", icon: BarChart3 },
      { label: "Success Stories", to: "/success-stories", icon: Sparkles },
    ],
  },
  {
    label: "Resources",
    icon: FileText,
    items: [
      { label: "Verify Certificate", to: "/verify", icon: ShieldCheck },
      { label: "FAQs", to: "/faqs", icon: HelpCircle },
      { label: "Blog", to: "/blog", icon: FileText },
      { label: "Privacy Policy", to: "/privacy", icon: FileText },
      { label: "Terms & Conditions", to: "/terms", icon: FileText },
    ],
  },
  {
    label: "Company",
    icon: Building2,
    items: [
      { label: "About Us", to: "/about", icon: Building2 },
      { label: "Leadership Team", to: "/leadership", icon: UsersRound },
      { label: "Careers", to: "/careers", icon: BriefcaseBusiness },
      { label: "Contact Us", to: "/contact", icon: Mail },
    ],
  },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGroups, setMobileGroups] = useState({ Programs: true });

  function closeMenus() {
    setActiveDropdown("");
    setMobileOpen(false);
  }

  function toggleMobileGroup(label) {
    setMobileGroups((current) => ({ ...current, [label]: !current[label] }));
  }

  function isPathActive(to) {
    const path = to.split("#")[0];
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  }

  function isGroupActive(group) {
    return group.items.some((item) => isPathActive(item.to));
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white/85 shadow-[0_4px_20px_rgba(15,23,42,0.05)] backdrop-blur-[12px]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-3 rounded-xl px-1 py-0.5 transition duration-200 hover:bg-blue-50/60" onClick={closeMenus}>
          <BrandLogo size="nav" framed={false} />
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-1 xl:flex">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
            <Home size={16} />
            Home
          </NavLink>

          {navGroups.map((group) => (
            <DesktopDropdown
              key={group.label}
              group={group}
              active={activeDropdown === group.label}
              groupActive={isGroupActive(group)}
              onOpen={() => setActiveDropdown(group.label)}
              onClose={() => setActiveDropdown("")}
              onToggle={() => setActiveDropdown(activeDropdown === group.label ? "" : group.label)}
              onNavigate={closeMenus}
            />
          ))}

        </div>

        <div className="hidden shrink-0 items-center gap-2 xl:flex">
          <AuthActions user={user} logout={logout} />
        </div>

        <button
          className="icon-button shrink-0 xl:hidden"
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="animate-navbar-mobile max-h-[calc(100vh-66px)] overflow-y-auto border-t border-[#E2E8F0] bg-white/95 px-4 py-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-[12px] xl:hidden">
          <div className="mx-auto grid max-w-7xl gap-2">
            <MobileLink to="/" icon={Home} label="Home" onNavigate={closeMenus} />

            {navGroups.map((group) => (
              <MobileDropdown
                key={group.label}
                group={group}
                open={Boolean(mobileGroups[group.label])}
                onToggle={() => toggleMobileGroup(group.label)}
                onNavigate={closeMenus}
              />
            ))}

            <div className="mt-3 border-t border-slate-200 pt-3">
              <AuthActions user={user} logout={logout} mobile onNavigate={closeMenus} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function DesktopDropdown({ group, active, groupActive, onOpen, onClose, onToggle, onNavigate }) {
  const GroupIcon = group.icon;

  return (
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <button
        type="button"
        className={`nav-link ${groupActive || active ? "nav-link-active" : ""}`}
        onClick={onToggle}
        aria-expanded={active}
      >
        <GroupIcon size={16} />
        {group.label}
        <ChevronDown size={15} className={`transition ${active ? "rotate-180" : ""}`} />
      </button>

      {active && (
        <div className="absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-3">
          <div className="animate-dropdown-pop rounded-2xl border border-[#E2E8F0] bg-white/95 p-2 shadow-[0_24px_70px_rgba(15,23,42,0.14)] backdrop-blur-[12px]">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-600 transition duration-200 ease-out hover:bg-blue-50 hover:text-blue-700"
                  onClick={onNavigate}
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon size={17} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MobileDropdown({ group, open, onToggle, onNavigate }) {
  const GroupIcon = group.icon;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-black text-slate-800"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <GroupIcon size={18} className="text-blue-600" />
          {group.label}
        </span>
        <ChevronDown size={17} className={`shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="grid gap-1 border-t border-slate-200 p-2">
          {group.items.map((item) => (
            <MobileLink
              key={item.label}
              to={item.to}
              icon={item.icon}
              label={item.label}
              nested
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MobileLink({ to, icon: Icon, label, nested = false, onNavigate }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition duration-200 ease-out ${
          nested ? "bg-slate-50" : "border border-slate-200 bg-white"
        } ${isActive ? "bg-blue-50 text-blue-700 shadow-sm" : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"}`
      }
      onClick={onNavigate}
    >
      <Icon size={18} className="shrink-0 text-blue-600" />
      <span>{label}</span>
    </NavLink>
  );
}

function AuthActions({ user, logout, mobile = false, onNavigate }) {
  if (user) {
    return (
      <div className={mobile ? "grid gap-2" : "flex items-center gap-2"}>
        <Link to={homeForRole(user.role)} className={mobile ? "btn-secondary w-full justify-center" : "icon-text-button"} onClick={onNavigate}>
          <LayoutDashboard size={16} />
          <span>{mobile ? "Dashboard" : "Dashboard"}</span>
        </Link>
        <button
          className={mobile ? "btn-secondary w-full justify-center" : "icon-button"}
          onClick={() => {
            logout();
            onNavigate?.();
          }}
          title="Log out"
          type="button"
        >
          <LogOut size={18} />
          {mobile && <span>Log out</span>}
        </button>
      </div>
    );
  }

  return (
    <Link to="/auth" className={mobile ? "btn-primary w-full justify-center" : "btn-primary min-h-10 px-4 py-2"} onClick={onNavigate}>
      <UserRound size={17} />
      Login
    </Link>
  );
}

function homeForRole(role) {
  const map = {
    admin: "/admin/dashboard",
    super_admin: "/super-admin/dashboard",
    hr: "/hr/dashboard",
    recruiter: "/recruiter/dashboard",
    mentor: "/mentor/dashboard",
    student: "/student/dashboard",
  };
  return map[role] || "/student/dashboard";
}
