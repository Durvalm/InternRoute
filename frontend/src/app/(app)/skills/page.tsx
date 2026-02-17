import {
  BookOpen,
  ChevronRight,
  CircleAlert,
  Clock3,
  Code2,
  Play,
  TerminalSquare
} from "lucide-react";

const challenges = [
  "The String Reversal",
  "FizzBuzz Logic",
  "List Filtering",
  "Dictionary Basics",
  "The Palindrome",
  "Sum of Two"
];

export default function SkillsPage() {
  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-7">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="grid grid-cols-1 xl:grid-cols-[1.65fr_1fr] gap-6">
          <div>
            <div className="inline-flex items-center gap-3">
              <span className="rounded-full bg-indigo-100 text-indigo-700 px-3 py-1 text-xs font-bold tracking-wider uppercase">
                Module 02
              </span>
              <span className="text-base font-medium text-slate-500">The Foundation</span>
            </div>

            <h1 className="mt-4 text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              The 2 Skills You Need
            </h1>
            <p className="mt-4 max-w-3xl text-base md:text-lg leading-relaxed text-slate-600">
              To get your next internship, you need to master two specific areas.
              We split them into separate modules so you can focus.
            </p>

            <div className="mt-9 relative pl-10 space-y-9">
              <div className="absolute left-4 top-1 bottom-1 w-px bg-indigo-200" />

              <article className="relative">
                <span className="absolute -left-[30px] top-1 h-5 w-5 rounded-full bg-indigo-500 ring-4 ring-indigo-100" />
                <h2 className="text-xl md:text-2xl font-bold text-indigo-900">1. Programming Language (Python)</h2>
                <div className="mt-2 inline-flex items-center gap-2 text-indigo-600 text-base md:text-lg font-semibold">
                  <Clock3 size={26} />
                  ~2 Months
                </div>
                <p className="mt-3 text-base md:text-lg leading-relaxed text-slate-600">
                  Your main tool. Used for coding interviews, scripts, and logic.
                </p>
                <p className="text-base md:text-lg font-semibold text-indigo-700">This Module Focuses on This.</p>
              </article>

              <article className="relative opacity-60">
                <span className="absolute -left-[30px] top-1 h-5 w-5 rounded-full bg-slate-300" />
                <h2 className="text-xl md:text-2xl font-bold text-slate-700">2. Backend Development</h2>
                <div className="mt-2 inline-flex items-center gap-2 text-slate-500 text-base md:text-lg font-semibold">
                  <Clock3 size={26} />
                  ~4 Months
                </div>
                <p className="mt-3 text-base md:text-lg leading-relaxed text-slate-600">
                  APIs, Databases, Frameworks, Git. This is how you build real software.
                </p>
                <p className="text-base md:text-lg italic text-slate-500">Covered in the "Projects" module.</p>
              </article>
            </div>
          </div>

          <aside className="rounded-3xl bg-[#201b56] text-white p-6 md:p-8 border border-indigo-950/30 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 text-indigo-300/15">
              <TerminalSquare size={180} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl md:text-3xl font-bold">Why Python?</h3>
                <span className="rounded-full bg-yellow-400 text-slate-900 text-xs font-bold px-3 py-1 uppercase tracking-wide">
                  Recommended
                </span>
              </div>
              <p className="mt-4 text-base md:text-lg leading-relaxed text-indigo-100">
                It has the <strong>easiest syntax</strong>, letting you focus on logic, not semicolons.
              </p>
              <p className="mt-4 text-base md:text-lg leading-relaxed text-indigo-100">
                <strong>Insider Tip:</strong> My first two internships were in Data Engineering.
                There is often <em>less competition</em> in Data/AI roles than general Software Engineering.
                Python unlocks these doors.
              </p>
              <p className="mt-4 text-base md:text-lg leading-relaxed text-indigo-100">
                Plus, it is the standard for <strong>Coding Interviews</strong> (LeetCode).
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-indigo-600" />
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">How to Learn</h2>
          </div>
          <a
            href="#readiness-check"
            className="rounded-full bg-indigo-50 text-indigo-700 px-4 py-2 text-sm font-semibold"
          >
            Already know the basics? Skip to Challenges
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wider text-amber-600">Top Recommendation (Paid)</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">The Art of Doing (Python)</h3>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              You&apos;ll build 40 small projects. It&apos;s the best way to learn by doing.
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-700">
              <strong>Optimization Tip:</strong> Skip the OOP section and the last 5 projects.
              This saves you 8 hours (~20h total).
            </p>
            <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between gap-4">
              <p className="text-base font-semibold text-slate-500">Udemy Course</p>
              <button type="button" className="inline-flex items-center gap-1 text-indigo-600 text-lg font-bold">
                View Course <ChevronRight size={24} />
              </button>
            </div>
          </article>

          <article className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wider text-emerald-600">Free Option</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">FreeCodeCamp Python</h3>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              An excellent, comprehensive video course available for free on YouTube.
              Great if you are on a budget but still want high-quality instruction.
            </p>
            <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between gap-4">
              <p className="text-base font-semibold text-slate-500">YouTube</p>
              <button type="button" className="inline-flex items-center gap-1 text-indigo-600 text-lg font-bold">
                Watch Video <ChevronRight size={24} />
              </button>
            </div>
          </article>
        </div>
      </section>

      <section id="readiness-check" className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Code2 size={24} className="text-slate-700" />
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Readiness Check</h2>
            </div>
            <p className="mt-1 text-base md:text-lg text-slate-500">
              Can you solve these 6 problems? If so, you are ready for the Projects module.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 min-w-[210px] shadow-sm">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Progress</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="text-3xl font-bold text-indigo-600">0/6</p>
              <div className="h-3 flex-1 rounded-full bg-slate-100" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] min-h-[670px]">
            <div className="border-r border-slate-200 bg-slate-50">
              <div className="px-5 py-4 border-b border-slate-200 text-sm font-bold uppercase tracking-wider text-slate-500">
                Challenge List
              </div>
              <div>
                {challenges.map((item, index) => {
                  const active = index === 0;
                  return (
                    <div
                      key={item}
                      className={`px-5 py-4 border-b border-slate-200 ${active ? "bg-white border-l-4 border-l-indigo-500" : ""}`}
                    >
                      <p className="text-sm font-semibold text-slate-400">#{index + 1}</p>
                      <p className={`text-lg font-bold ${active ? "text-indigo-900" : "text-slate-700"}`}>{item}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="p-5 md:p-6">
                <h3 className="text-2xl font-bold text-slate-900">The String Reversal</h3>
                <p className="mt-3 text-lg text-slate-600">
                  Write a function that accepts a string and returns it reversed.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700 text-sm font-semibold">
                  <CircleAlert size={18} />
                  Hint: In Python, you can slice strings like [::-1]
                </div>
              </div>

              <div className="flex-1 bg-[#231f5a] text-indigo-100 p-5 md:p-6 font-mono relative">
                <div className="absolute right-8 top-7 text-indigo-300/20">
                  <Code2 size={86} />
                </div>
                <pre className="text-base leading-7 whitespace-pre-wrap">{`main.py

def reverse_string(s):
    # Your code here
    return s[::-1]  # Pythonic hint`}</pre>
              </div>

              <div className="border-t border-slate-200 bg-white px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
                <p className="text-base text-slate-500 font-mono">// Ready to run...</p>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
                >
                  Run Code
                  <Play size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
