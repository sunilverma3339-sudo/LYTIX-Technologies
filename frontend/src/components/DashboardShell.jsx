import React from "react";
import { Link } from "react-router-dom";

import BrandLogo from "./BrandLogo.jsx";

export default function DashboardShell({ eyebrow, title, subtitle, navItems, actions, children }) {
  return (
    <main className="page-shell">
      <section className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="flex h-full min-h-0 flex-col">
          <Link to="/" className="sidebar-brand">
            <BrandLogo size="sidebar" />
          </Link>
          <nav className="mt-8 grid min-h-0 flex-1 content-start gap-2 overflow-y-auto pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const content = (
                <>
                  <Icon size={17} />
                  {item.label}
                </>
              );
              return (
                item.href?.startsWith("/") ? (
                  <Link className="sidebar-link" to={item.href} key={item.label}>
                    {content}
                  </Link>
                ) : (
                  <a className="sidebar-link" href={item.href} key={item.label}>
                    {content}
                  </a>
                )
              );
            })}
          </nav>
          </div>
        </aside>
        <div className="dashboard-content">
          <header className="dashboard-header">
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h1 className="page-title">{title}</h1>
              {subtitle && <p className="page-copy">{subtitle}</p>}
            </div>
            {actions && <div className="dashboard-actions">{actions}</div>}
          </header>
          {children}
        </div>
      </section>
    </main>
  );
}
