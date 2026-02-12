"use client";

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

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const handleLogout = () => {
    clearToken();
    router.push("/login");
  };

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

        <div className="px-3 mt-8 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Account
        </div>
        <Link
          href="/settings"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <Settings size={18} className="text-slate-400" />
          Settings
        </Link>
      </div>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
          <img
            src="https://images.unsplash.com/photo-1633092229537-5d491c2b414d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21wdXRlciUyMHNjaWVuY2UlMjBzdHVkZW50JTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcwODQ1Mjc2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="User"
            className="w-10 h-10 rounded-full object-cover border border-slate-200"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">Alex Student</p>
            <p className="text-xs text-slate-500 truncate">CS Major @ Tech U</p>
          </div>
          <button onClick={handleLogout} aria-label="Log out">
            <LogOut size={16} className="text-slate-400 hover:text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
