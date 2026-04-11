"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Code2,
  Briefcase,
  FileText,
  Users,
  Calendar,
  CheckSquare,
  Settings,
  LogOut,
  GraduationCap,
  Sparkles,
  BarChart3,
  type LucideIcon
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { trackLogoutClicked } from "@/lib/analytics";
import { clearUser, getUser, USER_UPDATED_EVENT, type StoredUser } from "@/lib/user";

type SidebarProps = {
  onClose?: () => void;
};

type NavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    label: "Preparation",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
      { icon: Calendar, label: "Intro", href: "/intro" },
      { icon: Code2, label: "Coding Skills", href: "/skills" },
      { icon: Briefcase, label: "Projects", href: "/projects" },
      { icon: FileText, label: "Resume", href: "/resume" },
      { icon: CheckSquare, label: "Applications", href: "/applications" }
    ]
  },
  {
    label: "Support",
    items: [
      { icon: Sparkles, label: "Opportunities", href: "/opportunities" },
      { icon: Users, label: "Interview Prep", href: "/interview-prep" }
    ]
  },
  {
    label: "Beyond the Basics",
    items: [{ icon: Code2, label: "LeetCode", href: "/leetcode" }]
  }
];

const adminNavItems: NavItem[] = [{ icon: BarChart3, label: "Admin", href: "/admin" }];

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "S";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setCurrentUser] = useState<StoredUser | null>(null);

  const handleLogout = async () => {
    onClose?.();
    trackLogoutClicked(pathname || "/");
    try {
      await apiRequest<{ ok: boolean }>("/auth/logout", { method: "POST", skipAuthRedirect: true });
    } catch (error) {
      // Clear local user state even if logout request fails.
    }
    clearUser();
    router.push("/login");
  };

  useEffect(() => {
    const syncUser = () => {
      setCurrentUser(getUser());
    };

    syncUser();
    window.addEventListener(USER_UPDATED_EVENT, syncUser);
    return () => {
      window.removeEventListener(USER_UPDATED_EVENT, syncUser);
    };
  }, []);

  const userName = user?.name?.trim() || "Student";
  const initials = getInitials(userName);
  const visibleSections: NavSection[] = user?.is_superuser
    ? [...navSections, { label: "Admin", items: adminNavItems }]
    : navSections;

  return (
    <div className="flex h-full flex-col bg-white text-slate-600">
      <div className="border-b border-slate-100 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-600 p-2 text-white">
            <GraduationCap size={22} />
          </div>
          <div>
            <h1 className="leading-tight text-[15px] font-bold text-slate-900">InternRoute</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {visibleSections.map((section) => (
          <div key={section.label}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-[14px] font-medium transition-colors ${
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                    onClick={onClose}
                  >
                    <item.icon size={16} className={active ? "text-indigo-600" : "text-slate-400"} />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 p-4">
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-2">
          <div className="flex items-center gap-3 p-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-200 bg-indigo-100 text-sm font-semibold text-indigo-700">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{userName}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/settings"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-white"
              onClick={onClose}
            >
              <Settings size={14} className="text-slate-500" />
              Settings
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-2.5 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={14} className="text-red-500" />
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
