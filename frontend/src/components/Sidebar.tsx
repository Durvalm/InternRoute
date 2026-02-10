import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/timeline", label: "Timeline" },
  { href: "/skills", label: "Skills" },
  { href: "/resume", label: "Resume" },
  { href: "/applications", label: "Applications" },
  { href: "/interview-prep", label: "Interview Prep" },
  { href: "/leetcode", label: "Leetcode" },
  { href: "/opportunities", label: "Opportunities" }
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-night text-white min-h-screen px-5 py-6 shadow-soft">
      <div className="flex items-center gap-3 mb-10">
        <div className="h-10 w-10 rounded-xl bg-aqua/20 flex items-center justify-center text-aqua font-semibold">
          IR
        </div>
        <div>
          <p className="text-lg font-semibold">InternRoute</p>
          <p className="text-xs text-white/60">Prep cockpit</p>
        </div>
      </div>
      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-xl px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto pt-10 text-xs text-white/50">
        MVP skeleton • v0
      </div>
    </aside>
  );
}
