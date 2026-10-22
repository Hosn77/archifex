"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const workspaceLinks = [
  { href: "/dashboard", label: "لوحة التحكم", icon: "◈" },
  { href: "/documents", label: "المستندات", icon: "▤" },
  { href: "/settings", label: "إعدادات المساحة", icon: "⚙" },
];

const providerLinks = [
  { href: "/admin", label: "إدارة الاشتراكات", icon: "◎" },
];

function NavLink({
  href,
  label,
  icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: string;
  pathname: string;
}) {
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      className={`nav-link${active ? " nav-link-active" : ""}`}
      href={href}
      aria-current={active ? "page" : undefined}
    >
      <span className="nav-icon" aria-hidden="true">
        {icon}
      </span>
      {label}
    </Link>
  );
}

interface SidebarNavProps {
  isPlatformAdmin?: boolean;
}

export function SidebarNav({ isPlatformAdmin = false }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="أقسام مساحة العمل">
      <span className="nav-section-label">Workspace</span>
      <div className="nav-links">
        {workspaceLinks.map((link) => (
          <NavLink key={link.href} {...link} pathname={pathname} />
        ))}
      </div>

      {isPlatformAdmin ? (
        <>
          <span className="nav-section-label nav-section-label-spaced">Provider</span>
          <div className="nav-links nav-links-provider">
            {providerLinks.map((link) => (
              <NavLink key={link.href} {...link} pathname={pathname} />
            ))}
          </div>
        </>
      ) : null}
    </nav>
  );
}
