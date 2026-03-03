import Image from "next/image";
import {
  BrainCircuit,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  FileText,
  Filter,
  Heart,
  Info,
  Lightbulb,
  Search,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type StageCard = {
  title: string;
  subtitle: string;
  description: string;
  highlight: string;
  icon: LucideIcon;
  shell: string;
  iconShell: string;
};

type ActionItem = {
  title: string;
  description: string;
  shell: string;
  titleColor: string;
  note?: string;
};

type CodingStep = {
  title: string;
  description: string;
};

const interviewStages: StageCard[] = [
  {
    title: "OA",
    subtitle: "Online assessment",
    description: "If the company uses one, this is usually the first filter after you apply.",
    highlight: "Some companies skip this entirely.",
    icon: FileText,
    shell: "border-cyan-200 bg-cyan-50/70",
    iconShell: "bg-cyan-600 text-white",
  },
  {
    title: "Recruiter Screen",
    subtitle: "15-30 min screen",
    description: "Usually a light call to confirm basics, timeline, resume details, and overall fit.",
    highlight: "Lower-risk round, but still prepare.",
    icon: Briefcase,
    shell: "border-blue-200 bg-blue-50/70",
    iconShell: "bg-blue-600 text-white",
  },
  {
    title: "Behavioral",
    subtitle: "\"Tell me about a time...\"",
    description: "Questions about teamwork, conflict, failure, communication, ownership, and judgment.",
    highlight: "Your stories matter as much as your resume.",
    icon: Users,
    shell: "border-violet-200 bg-violet-50/70",
    iconShell: "bg-violet-600 text-white",
  },
  {
    title: "Technical",
    subtitle: "Coding or practical",
    description: "This could be LeetCode-style, project deep dives, debugging, or verbal technical questions.",
    highlight: "Figure out the format before you prep.",
    icon: Code2,
    shell: "border-emerald-200 bg-emerald-50/70",
    iconShell: "bg-emerald-600 text-white",
  },
];

const behavioralActionItems: ActionItem[] = [
  {
    title: "1. Research the company",
    description: "Know what they build, who they serve, how they make money, and what they say they value.",
    shell: "border-violet-200 bg-violet-50/80",
    titleColor: "text-violet-800",
  },
  {
    title: "2. Make one prep document",
    description: "Write down company values, product notes, team info, role keywords, and your best matching stories.",
    shell: "border-rose-200 bg-rose-50/80",
    titleColor: "text-rose-800",
  },
  {
    title: "3. Adapt your responses to their values",
    description: "Emphasize the parts of your real experience that best match what this company rewards.",
    shell: "border-pink-200 bg-pink-50/80",
    titleColor: "text-pink-800",
    note:
      "Example: In my Klaviyo interview, I noticed they emphasized ambition and ownership. So when discussing my Fidelity work, I leaned into phrases like \"I led a project...\" to reflect the traits they clearly valued.",
  },
  {
    title: "4. Practice out loud",
    description: "Do not only think through answers. Say them out loud so your delivery feels natural under pressure.",
    shell: "border-amber-200 bg-amber-50/80",
    titleColor: "text-amber-800",
  },
  {
    title: "5. Use STAR for structure",
    description: "Keep your answers organized so the interviewer can follow the situation, your role, and the outcome.",
    shell: "border-emerald-200 bg-emerald-50/80",
    titleColor: "text-emerald-800",
  },
  {
    title: "6. Build a story bank",
    description: "Map your projects, jobs, classes, and setbacks to common behavioral themes so you never freeze.",
    shell: "border-indigo-200 bg-indigo-50/80",
    titleColor: "text-indigo-800",
  },
];

const behavioralTopics = [
  "Teamwork",
  "Communication",
  "Problem solving",
  "Leadership",
  "Conflict",
  "Failure",
  "Ambiguity",
  "Resilience",
  "Ownership",
  "Motivation",
];

const codingSteps: CodingStep[] = [
  {
    title: "1. Read carefully",
    description: "Slow down and make sure you fully understand the prompt before you touch the keyboard.",
  },
  {
    title: "2. Ask clarifying questions",
    description: "Check assumptions about edge cases, constraints, input shape, and expected output.",
  },
  {
    title: "3. Talk through approaches",
    description: "Start with the brute-force idea, then explain the better approach and why you chose it.",
  },
  {
    title: "4. Talk while you code",
    description: "Do not go silent. Let the interviewer see how you think, especially if you get stuck.",
  },
  {
    title: "5. Analyze complexity",
    description: "After coding, discuss time and space complexity and mention obvious optimizations.",
  },
];

export default function InterviewPrepPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <section className="overflow-hidden rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-4 md:p-5">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-lg font-bold tracking-tight text-slate-950 md:text-xl">
            Interview Preparation
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-700 md:text-base">
            If you made it to an interview, you already did something hard. You learned the skills, survived the
            application grind, pushed through OAs, and got through a crowded recruiting process.
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Take that seriously. Whether or not you get this offer, reaching the interview stage means you built real
            momentum. Now the goal is to prepare in a focused way and give yourself the best chance to convert.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-950 md:text-lg">
            How Tech Interviews Usually Work
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-600">
            Most companies mix behavioral and technical evaluation. Sometimes those happen in separate rounds. Sometimes
            they happen in the same 45 to 60 minute interview. Your first job is knowing what kind of round comes next.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {interviewStages.map((stage) => {
            const Icon = stage.icon;
            return (
              <article
                key={stage.title}
                className={`rounded-2xl border-2 p-4 shadow-sm ${stage.shell}`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stage.iconShell}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="mt-3 text-base font-bold text-slate-950">{stage.title}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {stage.subtitle}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">{stage.description}</p>
                <p className="mt-3 text-sm font-semibold text-slate-900">{stage.highlight}</p>
              </article>
            );
          })}
        </div>

        <div className="rounded-2xl border border-amber-300 bg-amber-50/80 px-4 py-3 text-sm leading-6 text-slate-700">
          <span className="font-bold text-slate-950">Important:</span> behavioral and technical can be combined in the
          same interview. My Amazon loop was one round split between behavioral and coding. Other companies break those
          apart into separate rounds. Do not assume the format.
        </div>
      </section>

      <section className="rounded-2xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Target className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold tracking-tight text-slate-950 md:text-lg">
              First Step: Figure Out Your Next Round
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Before you start preparing, figure out whether your next round is recruiter screen, behavioral, technical,
              or a mix. That one answer determines your whole prep plan.
            </p>
            <div className="mt-4 rounded-2xl border border-indigo-200 bg-white/90 p-4">
              <p className="text-sm font-semibold text-slate-950">
                How to find out:
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Check the recruiter email, ask the recruiter directly, or search Glassdoor, Reddit, and Discord
                communities to see what format the company usually uses.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border-2 border-violet-300 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold tracking-tight text-slate-950 md:text-lg">
              Recruiter Calls and Behavioral Rounds
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              For recruiter screens and behavioral interviews, preparation is mostly about story quality. Research the
              company, line your examples up with what they value, and practice saying those stories out loud.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {behavioralActionItems.map((item) => (
            <article
              key={item.title}
              className={`rounded-2xl border p-4 shadow-sm ${item.shell}`}
            >
              <p className={`text-base font-bold ${item.titleColor}`}>{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.description}</p>
              {item.note ? (
                <div className="mt-3 rounded-xl border border-white/80 bg-white/80 p-3 text-xs leading-6 text-slate-700 md:text-sm">
                  <span className="font-semibold text-slate-950">Real example:</span> {item.note}
                </div>
              ) : null}
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-950">Use the STAR Method</h3>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                    Keep stories structured
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                Most behavioral questions are some version of: "Tell me about a time when..." Use one structure every
                time so your answers stay clear under pressure.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                {["Situation", "Task", "Action", "Result"].map((step, index) => (
                  <div
                    key={step}
                    className={`rounded-xl px-3 py-2 text-center text-xs font-bold md:text-sm ${
                      index === 0
                        ? "bg-violet-100 text-violet-900"
                        : index === 1
                          ? "bg-pink-100 text-pink-900"
                          : index === 2
                            ? "bg-rose-100 text-rose-900"
                            : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>
            </section>

            <details className="group overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-left">
                <div>
                  <h3 className="text-base font-bold text-slate-950">STAR Method Example</h3>
                  <p className="mt-1 text-xs text-slate-600 md:text-sm">Open a full sample answer</p>
                </div>
                <ChevronRight className="h-5 w-5 text-violet-600 transition-transform group-open:rotate-90" />
              </summary>
              <div className="border-t border-violet-100 px-5 py-4">
                <p className="text-sm font-semibold text-slate-950 md:text-base">
                  Question: "Tell me about a time you had to meet a tight deadline."
                </p>
                <div className="mt-3 space-y-2">
                  <div className="rounded-xl border border-violet-100 bg-violet-50/80 p-3">
                    <p className="font-bold text-violet-900">Situation</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      In my data structures class, we had a group assignment due in three days and one teammate dropped
                      out at the last minute.
                    </p>
                  </div>
                  <div className="rounded-xl border border-pink-100 bg-pink-50/80 p-3">
                    <p className="font-bold text-pink-900">Task</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      I had to cover both my work and the missing portion while still getting the project submitted on
                      time.
                    </p>
                  </div>
                  <div className="rounded-xl border border-rose-100 bg-rose-50/80 p-3">
                    <p className="font-bold text-rose-900">Action</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      I re-scoped the work to focus on core functionality first, redistributed the remaining tasks, and
                      worked late to finish the missing pieces while keeping the professor informed.
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-3">
                    <p className="font-bold text-amber-900">Result</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      We submitted on time, earned a 95%, and I learned how to stay calm, prioritize, and communicate
                      clearly under pressure.
                    </p>
                  </div>
                </div>
              </div>
            </details>
          </div>

          <div className="space-y-5">
            <section className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-950">Build a Story Bank</h3>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">
                    Avoid freezing
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                Map your past jobs, projects, classes, and setbacks to the kinds of behavioral questions companies ask.
                Once you do this, you are rarely inventing answers on the spot.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {behavioralTopics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 md:text-sm"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-violet-200 bg-white p-4 shadow-sm">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <Image
                  src="/interview/preparationgrid.png"
                  alt="Preparation grid mapping common behavioral topics across past jobs and projects"
                  width={1600}
                  height={1000}
                  className="h-auto w-full"
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                <span className="font-semibold text-slate-950">Tip:</span> this is the preparation-grid technique from
                <span className="italic"> Cracking the Coding Interview</span>. Build the story bank once so you do not
                have to invent examples in the room.
              </p>
            </section>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Code2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold tracking-tight text-slate-950 md:text-lg">
              Technical Interviews
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Technical prep is not one thing. Before you grind problems, figure out what kind of technical round the
              company actually runs. The prep for LeetCode-style interviews is very different from the prep for practical
              or verbal technical rounds.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-200 bg-white/90 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950">Research the Format First</h3>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Do not prepare blind
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Check Glassdoor, Reddit, and communities before you start. One thing I do often is go to the cscareers.dev
            Discord, search the company name, and see if someone already described the round. With enough people there,
            somebody has often interviewed before.
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Code2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950">If It Is LeetCode-Style</h3>
                <p className="text-xs text-slate-500 md:text-sm">Usually a higher-bar SWE process</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3">
              <p className="font-semibold text-emerald-900">Good sign:</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                If the company is asking DSA, that often means it is running a more rigorous software engineering
                process. That is hard, but it also means the opportunity is likely worth preparing for.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-950">Start with NeetCode 150</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  If you already have some DSA reps, you can cover the most important patterns in under a week. Skip
                  hard problems if you are short on time.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-950">Use company-tagged questions</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  After you warm up, look for questions reported by people interviewing at that company. That is where
                  the best short-term signal usually is.
                </p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3">
                <p className="font-semibold text-amber-900">Time crunch rule</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  Focus on easy and medium patterns. In a 1-week sprint, breadth and familiarity matter more than
                  mastering every hard question.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border-2 border-amber-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Filter className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950">If It Is Not LeetCode</h3>
                <p className="text-xs text-slate-500 md:text-sm">More common than people think</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/80 p-3">
              <p className="font-semibold text-rose-900">Harder to predict</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                I had these for Fidelity and Klaviyo. The exact format varies a lot, so researching the company is even
                more important here.
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="font-semibold text-slate-950">They might ask:</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  Resume and project deep dives
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  Debugging or improving existing code
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  Writing a small API, script, or helper function
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  Verbal technical questions about fundamentals
                </li>
              </ul>
            </div>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3">
              <p className="font-semibold text-amber-900">Very common verbal questions</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                Think: "What are the 4 principles of OOP?", "What is a primary key?", "What is the difference between
                a left join and an outer join?", or a small system-design style question based on the role.
              </p>
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-2xl border border-emerald-200 bg-white/90 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950">
                How I Prepared for Amazon in 1 Week
              </h3>
              <p className="text-xs text-slate-500 md:text-sm">A real short-sprint example</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            In five days, I covered the most important NeetCode 150 patterns, skipped hard problems, and reviewed
            Amazon-tagged questions reported by people who had recently interviewed. I was lucky enough to get asked
            <span className="font-semibold text-slate-950"> LRU Cache</span>, which was already on my list.
          </p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <Image
              src="/interview/common_questions.png"
              alt="A list of common Amazon-tagged interview questions collected during preparation"
              width={1600}
              height={1300}
              className="h-auto w-full"
            />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            I skipped some reported hard questions and some topics I judged too expensive to learn in the time window.
            If you are in a time crunch, it is fine to focus on core patterns instead of chasing perfect coverage.
          </p>
        </section>
      </section>

      <section className="rounded-2xl border-2 border-slate-200 bg-white p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold tracking-tight text-slate-950 md:text-lg">
              How to Solve Coding Questions in the Interview
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              You do not need a perfect script, but you should have a simple process. A calm, structured approach
              makes you look much stronger even when the question is difficult.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {codingSteps.map((step) => (
            <article
              key={step.title}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-base font-bold text-slate-950">{step.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{step.description}</p>
            </article>
          ))}
        </div>

        <details className="group mt-5 overflow-hidden rounded-2xl border border-indigo-200 bg-indigo-50/70">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
            <div>
              <h3 className="text-base font-bold text-slate-950">Why this works</h3>
              <p className="mt-1 text-xs text-slate-600 md:text-sm">Open the interviewer-side reasoning</p>
            </div>
            <ChevronRight className="h-5 w-5 text-indigo-600 transition-transform group-open:rotate-90" />
          </summary>
          <div className="border-t border-indigo-100 px-5 py-4 text-sm leading-7 text-slate-700">
            Following this structure shows two things at once: you can solve problems, and you can communicate like an
            engineer. Even when you do not fully finish, that signal can still carry a lot of weight.
          </div>
        </details>
      </section>

      <section className="overflow-hidden rounded-2xl border-2 border-violet-300 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-4 md:p-5">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-200">
            <Heart className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-bold tracking-tight text-slate-950 md:text-xl">
            Do Not Stress About Being Perfect
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-700 md:text-base">
            The person on the other side is just another engineer. They are not trying to fail you. If your resume made
            it this far, the company already believes there is real potential there.
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Most interviewers know the market is harder now than it used to be. They understand you are still a student
            or early-career candidate. They are usually looking for signal, not perfection.
          </p>

          <div className="mt-5 rounded-2xl border border-indigo-200 bg-white/90 p-4">
            <p className="text-base font-bold text-indigo-900">
              You do not need to get every question right to pass.
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              What matters most: being likable, showing genuine interest, thinking clearly, communicating your approach,
              and staying steady when the problem gets uncomfortable.
            </p>
            <div className="mt-4 grid gap-2 md:grid-cols-4">
              {[
                "Stay calm",
                "Show clear thinking",
                "Communicate well",
                "Be coachable",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-900 md:text-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-6 text-sm font-semibold text-slate-950 md:text-base">
            If you can do that, you are already giving yourself a real chance.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-slate-950">
              <Clock3 className="h-4 w-4 text-slate-500" />
              <p className="font-semibold">Recruiter screen</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Usually light, but still worth preparing. Know your timeline, resume, and why this role makes sense.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-slate-950">
              <Info className="h-4 w-4 text-slate-500" />
              <p className="font-semibold">Behavioral rounds</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your best prep is a researched company doc, a story bank, and STAR answers practiced out loud.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-slate-950">
              <BrainCircuit className="h-4 w-4 text-slate-500" />
              <p className="font-semibold">Technical rounds</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Identify whether it is LeetCode-style or practical first. The right prep depends on that answer.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
