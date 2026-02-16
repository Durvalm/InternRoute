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
  Sparkles
} from "lucide-react";
import { clearToken } from "@/lib/auth";
import { clearUser, getUser, USER_UPDATED_EVENT, type StoredUser } from "@/lib/user";

type SidebarProps = {
  onClose?: () => void;
};

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Calendar, label: "Timeline & Strategy", href: "/timeline" },
  { icon: Code2, label: "Coding Skills", href: "/skills" },
  { icon: Briefcase, label: "Projects", href: "/projects" },
  { icon: FileText, label: "Resume", href: "/resume" },
  { icon: CheckSquare, label: "Applications", href: "/applications" },
  { icon: Users, label: "Interview Prep", href: "/interview-prep" },
  { icon: Code2, label: "Leetcode", href: "/leetcode" },
  { icon: Sparkles, label: "Opportunities", href: "/opportunities" }
];

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

  const handleLogout = () => {
    onClose?.();
    clearToken();
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

  return (
    <div className="flex flex-col h-full bg-white text-slate-600">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight">InternshipRoute</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Preparation
        </div>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "hover:bg-slate-50 hover:text-slate-900"
              }`}
              onClick={onClose}
            >
              <item.icon size={18} className={active ? "text-indigo-600" : "text-slate-400"} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-100">
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2 space-y-2">
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center text-sm font-semibold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{userName}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/settings"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-white border border-slate-200 transition-colors"
              onClick={onClose}
            >
              <Settings size={14} className="text-slate-500" />
              Settings
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
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
