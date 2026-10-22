"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "لوحة التحكم", icon: "◈" },
  { href: "/documents", label: "المستندات", icon: "▤" },
  { href: "/settings", label: "إعدادات المساحة", icon: "⚙" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="أقسام مساحة العمل">
      <span className="nav-section-label">Workspace</span>
      <div className="nav-links">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              className={`nav-link${active ? " nav-link-active" : ""}`}
              href={link.href}
              aria-current={active ? "page" : undefined}
            >
              <span className="nav-icon" aria-hidden="true">
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
