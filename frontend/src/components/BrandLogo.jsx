import React from "react";

import logoIcon from "../assets/lytix-logo-icon.png";
import logoLockup from "../assets/lytix-logo-brand.png";

const sizeClasses = {
  nav: "h-10 w-auto max-w-[132px]",
  footer: "h-12 w-auto max-w-[176px]",
  sidebar: "h-9 w-auto max-w-[138px]",
  page: "h-14 w-auto max-w-[196px]",
  icon: "h-10 w-10",
};

export default function BrandLogo({
  size = "nav",
  compact = false,
  showTagline = false,
  framed = false,
  className = "",
}) {
  const image = compact || size === "icon" ? logoIcon : logoLockup;
  const imageClass = compact || size === "icon" ? sizeClasses.icon : sizeClasses[size] || sizeClasses.nav;
  const imageElement = (
    <img
      src={image}
      alt="LYTIX TECHNOLOGIES logo"
      className={`${imageClass} object-contain`}
      loading="eager"
    />
  );

  return (
    <span className={`inline-flex min-w-0 items-center gap-3 ${className}`}>
      {framed ? (
        <span className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white/90 p-1 shadow-sm shadow-blue-500/10">
          {imageElement}
        </span>
      ) : (
        <span className="inline-flex shrink-0 items-center justify-center">
          {imageElement}
        </span>
      )}
      {showTagline && (
        <span className="hidden leading-tight sm:block">
          <strong className="block text-sm font-black text-slate-950">LYTIX TECHNOLOGIES</strong>
          <span className="block text-xs font-bold text-slate-500">Learn. Build. Innovate.</span>
        </span>
      )}
    </span>
  );
}

export const BRAND = {
  name: "LYTIX TECHNOLOGIES",
  tagline: "Learn. Build. Innovate.",
  founder: "Sunil Kumar",
  founderTitle: "Founder & CEO",
};
