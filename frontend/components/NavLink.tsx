"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  badge?: string;
}

export default function NavLink({
  href,
  children,
  badge
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`text-sm transition-colors
        flex items-center gap-1.5
        relative group ${
        isActive
          ? "text-[rgba(255,255,255,0.9)]"
          : "text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.9)]"
      }`}>
      {children}
      {badge && (
        <span className="text-[10px]
          bg-[rgba(245,158,11,0.15)] text-[#F59E0B]
          border border-[rgba(245,158,11,0.25)]
          px-1.5 py-0.5 rounded-[4px] font-medium">
          {badge}
        </span>
      )}
      {isActive && (
        <span className="absolute -bottom-[18px] left-0
          right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, #4F9EF8, transparent)"
          }} />
      )}
    </Link>
  );
}
