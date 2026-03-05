import Image from "next/image";
import Link from "next/link";
import {
  BrainCircuit,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Code2,
  ExternalLink,
  FileText,
  Heart,
  Lightbulb,
  Mail,
  MessageSquare,
  Search,
  Sparkles,
  Target,
  Users,
  Wrench
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type StageCard = {
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  shell: string;
  iconShell: string;
};

type BehavioralStep = {
  title: string;
  description: string;
  shell: string;
  titleColor: string;
  note?: string;
};

type ResourceLink = {
  label: string;
  href: string;
  description: string;
};

type CodingStep = {
  title: string;
  description: string;
};

const interviewStages: StageCard[] = [
  {
    title: "OA",
    subtitle: "Online assessment",
    description: "Some companies send this after you apply. Some skip it completely.",
    icon: FileText,
    shell: "border-cyan-200 bg-cyan-50/70",
    iconShell: "bg-cyan-600 text-white"
  },
  {
    title: "Recruiter Screen",
    subtitle: "15-30 min",
    description: "Usually a light check on basics, timeline, and resume.",
    icon: Briefcase,
    shell: "border-blue-200 bg-blue-50/70",
    iconShell: "bg-blue-600 text-white"
  },
  {
    title: "Behavioral",
    subtitle: "\"Tell me about a time...\"",
    description: "Questions about communication, teamwork, ownership, and failure.",
    icon: Users,
    shell: "border-violet-200 bg-violet-50/70",
    iconShell: "bg-violet-600 text-white"
  },
  {
    title: "Technical",
    subtitle: "Coding or practical",
    description: "Could be LeetCode, code reading, debugging, or project deep dives.",
    icon: Code2,
    shell: "border-emerald-200 bg-emerald-50/70",
    iconShell: "bg-emerald-600 text-white"
  }
];

const behavioralSteps: BehavioralStep[] = [
  {
    title: "1. Research the company",
    description:
      "Research what matters: products, mission, values, leadership principles, culture, and what this company actually builds.",
    shell: "border-violet-200 bg-violet-50/80",
    titleColor: "text-violet-800"
  },
  {
    title: "2. Turn your research into one prep document",
    description:
      "Write mission/values notes, \"why I want to work here\", \"why I am a great fit\", likely behavioral prompts, and rough answers. Example of this below.",
    shell: "border-rose-200 bg-rose-50/80",
    titleColor: "text-rose-800"
  },
  {
    title: "3. Adapt answers to their values",
    description:
      "Keep your stories true, but emphasize the traits this company rewards (ownership, collaboration, speed, quality, etc).",
    shell: "border-pink-200 bg-pink-50/80",
    titleColor: "text-pink-800",
    note:
      "Klaviyo example: they emphasized ambition and ownership, so when discussing my Fidelity work I intentionally used language like \"I led...\" to reflect those values."
  },
  {
    title: "4. Draft common behavioral answers",
    description:
      "Prepare categories like teamwork, conflict, failure, leadership, adaptability, and initiative. Use STAR structure for each (explained below), and write drafts in your prep document. You can look up in Glassdoor if there's questions this company asks frequently.",
    shell: "border-amber-200 bg-amber-50/80",
    titleColor: "text-amber-800"
  },
  {
    title: "5. Build a story bank",
    description:
      "This is to avoid freezing in interviews: keep short notes from your experiences so you can quickly pull a relevant story and turn it into STAR on the spot.",
    shell: "border-indigo-200 bg-indigo-50/80",
    titleColor: "text-indigo-800"
  },
  {
    title: "6. Practice out loud (last step)",
    description:
      "Practice saying your answers, elevator pitch, company-fit points, and \"why I want to work here\" out loud so delivery is natural.",
    shell: "border-emerald-200 bg-emerald-50/80",
    titleColor: "text-emerald-800"
  }
];

const behavioralCategories = [
  "Teamwork",
  "Communication",
  "Conflict",
  "Failure",
  "Leadership",
  "Initiative",
  "Ambiguity",
  "Resilience",
  "Ownership",
  "Motivation"
];

const technicalResearchLinks: ResourceLink[] = [
  {
    label: "Glassdoor",
    href: "https://www.glassdoor.com",
    description: "Search recent interview reports for your role and location."
  },
  {
    label: "Reddit",
    href: "https://www.reddit.com",
    description: "Find recent candidate experiences and specific company threads."
  },
  {
    label: "CSCareers Discord",
    href: "https://discord.com/invite/cscareers",
    description:
      "Use the search bar for the company name, read interview mentions in chats, then ask in channel or DM people who recently interviewed."
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com",
    description: "Message students or interns who interviewed for similar roles."
  }
];

const codingSteps: CodingStep[] = [
  {
    title: "1. Read carefully first",
    description: "Do not rush to code. Restate the question and constraints in your own words."
  },
  {
    title: "2. Ask clarifying questions",
    description:
      "Do not assume. Example: \"Is money an integer or float?\" \"Can input be empty?\" \"Are negatives allowed?\""
  },
  {
    title: "3. Explain approaches",
    description: "Mention brute force first, then the improved approach and why you picked it."
  },
  {
    title: "4. Talk while coding",
    description: "Keep communicating. If you get stuck, say what you are checking and what you will try next."
  },
  {
    title: "5. Analyze and test",
    description: "Walk through sample cases, then discuss time and space complexity."
  }
];

export default function InterviewPrepPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12 md:[&_.text-sm]:text-[15px]">
      <section className="overflow-hidden rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-200">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-xl font-bold tracking-tight text-slate-950">Interview Preparation</h1>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            If you made it to interviews, you already did hard work: skills, projects, applications, and often OAs.
            Now the goal is focused preparation so you can convert interviews into offers.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-950">How Tech Interviews Usually Work</h2>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            Companies usually evaluate both behavioral and technical skills. Sometimes in separate rounds, sometimes in
            one combined interview.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {interviewStages.map((stage) => {
            const Icon = stage.icon;
            return (
              <article key={stage.title} className={`rounded-xl border p-3 ${stage.shell}`}>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stage.iconShell}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="mt-2 text-sm font-bold text-slate-950">{stage.title}</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{stage.subtitle}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{stage.description}</p>
              </article>
            );
          })}
        </div>
        <div className="rounded-xl border border-amber-300 bg-amber-50/80 px-3 py-2.5 text-sm leading-6 text-slate-700">
          <span className="font-semibold text-slate-950">Prep disclaimer:</span> before each round, confirm if it is
          behavioral, technical, or mixed. That one answer changes your prep plan.
        </div>
      </section>

      <section className="rounded-2xl border border-indigo-300 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4">
        <h2 className="text-lg font-bold tracking-tight text-slate-950">How to Prepare</h2>
        <p className="mt-1 text-sm leading-6 text-slate-700">
          Think in two interview types. Most prep mistakes come from preparing for the wrong type.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <article className="rounded-xl border border-violet-200 bg-violet-50/70 p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">
                <Users className="h-4 w-4" />
              </div>
              <p className="text-sm font-bold text-slate-950">Interview Type 1: Behavioral / Recruiter</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Prepare stories, company-fit messaging, and clear STAR responses.
            </p>
          </article>
          <article className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Code2 className="h-4 w-4" />
              </div>
              <p className="text-sm font-bold text-slate-950">Interview Type 2: Technical</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              First identify format (LeetCode vs practical), then train for that format specifically.
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-violet-300 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-white">
            <Users className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-slate-950">Behavioral and Recruiter Prep</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          This is where most candidates can gain edge quickly. The goal is to make your stories clear, relevant, and
          easy to deliver under pressure.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {behavioralSteps.map((item) => (
            <article key={item.title} className={`rounded-xl border p-3 ${item.shell}`}>
              <p className={`text-sm font-bold ${item.titleColor}`}>{item.title}</p>
              <p className="mt-1.5 text-sm leading-6 text-slate-700">{item.description}</p>
              {item.note ? (
                <div className="mt-2 rounded-lg border border-white/80 bg-white/80 p-2.5 text-xs leading-6 text-slate-700">
                  <span className="font-semibold text-slate-950">Example:</span> {item.note}
                </div>
              ) : null}
            </article>
          ))}
        </div>

        <details className="group mt-4 overflow-hidden rounded-xl border border-violet-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-bold text-slate-950">Show company-research prep doc example</p>
              <p className="text-xs text-slate-600">Use this format for mission, values, fit, and expected questions.</p>
            </div>
            <ChevronRight className="h-4 w-4 text-violet-700 transition-transform group-open:rotate-90" />
          </summary>
          <div className="border-t border-violet-100 p-3">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              <Image
                src="/interview/company_research_example.png"
                alt="Example behavioral prep document with company mission, values, and fit notes"
                width={1400}
                height={1800}
                className="h-auto w-full"
              />
            </div>
          </div>
        </details>
      </section>

      <section className="space-y-4">
        <section className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-950">STAR Method (Use this for behavioral answers)</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Structure answers as Situation, Task, Action, Result. This keeps answers concise and easier for the
            interviewer to follow.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            {["Situation", "Task", "Action", "Result"].map((part, index) => (
              <div
                key={part}
                className={`rounded-lg px-2.5 py-2 text-center text-xs font-bold ${index === 0
                  ? "bg-violet-100 text-violet-900"
                  : index === 1
                    ? "bg-pink-100 text-pink-900"
                    : index === 2
                      ? "bg-rose-100 text-rose-900"
                      : "bg-amber-100 text-amber-900"
                  }`}
              >
                {part}
              </div>
            ))}
          </div>
          <details className="group mt-3 overflow-hidden rounded-lg border border-emerald-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5">
              <p className="text-sm font-semibold text-slate-950">Show STAR example answer</p>
              <ChevronRight className="h-4 w-4 text-emerald-700 transition-transform group-open:rotate-90" />
            </summary>
            <div className="border-t border-emerald-100 p-3 text-sm leading-6 text-slate-700">
              <p className="font-semibold text-slate-950">Question: Tell me about a time you had to meet a tight deadline.</p>
              <div className="mt-2 space-y-2">
                <div className="rounded-lg border border-violet-100 bg-violet-50/80 p-2.5">
                  <span className="font-semibold text-violet-900">Situation:</span> Group assignment due in 3 days,
                  one teammate dropped out last minute.
                </div>
                <div className="rounded-lg border border-pink-100 bg-pink-50/80 p-2.5">
                  <span className="font-semibold text-pink-900">Task:</span> Finish both my part and the missing part
                  before deadline.
                </div>
                <div className="rounded-lg border border-rose-100 bg-rose-50/80 p-2.5">
                  <span className="font-semibold text-rose-900">Action:</span> Re-scoped to core deliverables,
                  prioritized, worked late, and updated the professor proactively.
                </div>
                <div className="rounded-lg border border-amber-100 bg-amber-50/80 p-2.5">
                  <span className="font-semibold text-amber-900">Result:</span> Submitted on time, earned a high
                  grade, and learned prioritization under pressure.
                </div>
              </div>
            </div>
          </details>
        </section>

        <section className="rounded-2xl border border-indigo-300 bg-indigo-50/70 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <BrainCircuit className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-950">Build a Story Bank</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Map each experience to common behavioral categories so when a question comes, you can pick the right story
            and build a STAR answer quickly.
          </p>
          <div className="mt-3 rounded-lg border border-indigo-200 bg-white p-2.5">
            <p className="text-sm font-semibold text-indigo-900">What this is for</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              The goal is not memorizing scripts. The goal is having a reliable memory bank so you do not freeze when
              you hear "tell me about a time..." and can answer with confidence and structure.
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {behavioralCategories.map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
              >
                {topic}
              </span>
            ))}
          </div>

          <details className="group mt-3 overflow-hidden rounded-lg border border-indigo-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5">
              <p className="text-sm font-semibold text-slate-950">Show how to build a story bank</p>
              <ChevronRight className="h-4 w-4 text-indigo-700 transition-transform group-open:rotate-90" />
            </summary>
            <div className="border-t border-indigo-100 p-3">
              <div className="grid gap-2 text-xs leading-6 text-slate-700 md:grid-cols-3">
                <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-2.5">
                  <p className="font-semibold text-indigo-900">Step 1</p>
                  Pick one experience: internship, project, class, club, or even a non-tech job.
                </div>
                <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-2.5">
                  <p className="font-semibold text-indigo-900">Step 2</p>
                  For that same experience, write down a challenge, failure, initiative, conflict, and impact that you had.
                </div>
                <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-2.5">
                  <p className="font-semibold text-indigo-900">Step 3</p>
                  Repeat this for every project, experience, and school work you had. Then use these to build a STAR answer on the spot.
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Example card</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">Fidelity Internship</p>
                <div className="mt-1.5 grid gap-1.5 text-xs leading-5 text-slate-700">
                  <p><span className="font-semibold text-slate-900">Challenge:</span> Built a solo data pipeline flexible enough for multiple data sources.</p>
                  <p><span className="font-semibold text-slate-900">Failure:</span> Missed early alignment with manager before a business presentation.</p>
                  <p><span className="font-semibold text-slate-900">Initiative:</span> Proposed an automation step that removed repeated manual checks.</p>
                  <p><span className="font-semibold text-slate-900">Conflict:</span> Resolved requirement mismatch by resetting expectations with stakeholders.</p>
                </div>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                You can use non-tech jobs too. What matters is having clear examples of challenge, initiative,
                communication, conflict, and impact ready before the interview.
              </p>
            </div>
          </details>
        </section>

        <section className="rounded-2xl border border-violet-200 bg-white p-3">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <Image
              src="/interview/preparationgrid.png"
              alt="Behavioral preparation grid mapping topics to previous experiences"
              width={1600}
              height={1000}
              className="h-auto w-full"
            />
          </div>
          <p className="mt-2 text-xs leading-6 text-slate-700">
            Story-bank grid idea from <span className="italic">Cracking the Coding Interview</span>: build the bank
            once so examples are always ready.
          </p>
        </section>
      </section>

      <section className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Code2 className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-slate-950">Technical Interviews</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Research the format first. If you prep for LeetCode but get a practical interview, you lose time. If you prep
          practical but get LeetCode, same problem.
        </p>

        <section className="mt-4 rounded-xl border border-emerald-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-950">Research the format first</h3>
          </div>
          <p className="mt-1.5 text-sm leading-6 text-slate-700">
            Use these resources before starting prep. In CSCareers Discord, use the search button with your company
            name, read existing interview mentions in chats, then ask in-channel or DM people who recently interviewed.
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {technicalResearchLinks.map((resource) => (
              <a
                key={resource.label}
                href={resource.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-950">{resource.label}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-600">{resource.description}</p>
              </a>
            ))}
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            More resources will be added in the{" "}
            <Link href="/opportunities" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Opportunities
            </Link>{" "}
            tab.
          </p>
        </section>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <section className="rounded-xl border border-emerald-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-950">If LeetCode-style</h3>
            </div>
            <div className="mt-2 space-y-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                <p className="text-sm font-semibold text-slate-950">Set realistic expectations</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  LeetCode and DSA take months to build. If you are short on time, focus on high-yield categories and
                  interview behavior instead of trying to cover everything.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                <p className="text-sm font-semibold text-slate-950">Flow A: already did NC150 (or similar)</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  You can usually review most key patterns in about a week if needed, skip hard problems in a crunch,
                  and spend extra time on tagged questions.
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-2.5">
                <p className="text-sm font-semibold text-amber-900">Flow B: new to DSA/LeetCode</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  Prioritize easiest high-yield topics first: arrays, hash maps, linked lists, and binary search. This
                  gives the best return with limited prep time.
                </p>
              </div>
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/70 p-2.5">
                <p className="text-sm font-semibold text-indigo-900">LeetCode tagged questions are mandatory prep</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  Tagged questions are problems reported by people interviewing at that specific company. You can get
                  many through LeetCode Premium, or gather them from communities and peers. Both Flow A and Flow B
                  should use tagged questions.
                </p>
              </div>
            </div>

            <details className="group mt-2.5 overflow-hidden rounded-lg border border-emerald-200 bg-emerald-50/70">
              <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-emerald-700" />
                  <p className="text-sm font-semibold text-emerald-900">How I prepared for Amazon (after NC150 baseline)</p>
                </div>
                <ChevronRight className="h-4 w-4 text-emerald-700 transition-transform group-open:rotate-90" />
              </summary>
              <div className="border-t border-emerald-200 px-3 py-2.5">
                <p className="text-sm leading-6 text-slate-700">
                  In 5 days I reviewed key NC150 patterns, skipped hard problems, and prioritized Amazon-tagged
                  reports. I got asked LRU Cache, which was in my review set.
                </p>
                <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <Image
                    src="/interview/common_questions.png"
                    alt="Amazon interview prep notes with common and tagged coding questions"
                    width={1600}
                    height={1300}
                    className="h-auto w-full"
                  />
                </div>
              </div>
            </details>
          </section>

          <section className="rounded-xl border border-amber-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-amber-700" />
              <h3 className="text-sm font-bold text-slate-950">If not LeetCode</h3>
            </div>
            <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50/80 p-2.5">
              <p className="text-sm font-semibold text-amber-900">Format varies a lot by company and team</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                Research is even more important here: use Glassdoor, Reddit, Discord, LinkedIn, friends, and alumni to
                confirm the exact interview style.
              </p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Common types of non-LeetCode technical interviews are below. These are small examples so you can quickly
              recognize the format and prepare the right way.
            </p>
            <div className="mt-2.5 space-y-2">
              <details className="group overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">1. Resume and project deep dive</p>
                    <p className="text-xs text-slate-600">Very common: they start from your own work.</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600 transition-transform group-open:rotate-90" />
                </summary>
                <div className="border-t border-slate-200 px-3 py-2.5 text-sm leading-6 text-slate-700">
                  <p>
                    Typical prompts: "Tell me about a project you built", "Walk me through the architecture", "Why did
                    you choose this technology?", "What challenges did you face?"
                  </p>
                  <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Example</p>
                    <p className="mt-1 text-sm">
                      If you built an image-upload web app, be ready to explain data flow, framework choice, tradeoffs,
                      and what would break at 10x traffic.
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    They are evaluating technical depth, decision making, tradeoffs, and explanation clarity.
                  </p>
                </div>
              </details>

              <details className="group overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">2. Code reading interview</p>
                    <p className="text-xs text-slate-600">Common for interns: analyze code instead of writing from scratch.</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600 transition-transform group-open:rotate-90" />
                </summary>
                <div className="border-t border-slate-200 px-3 py-2.5 text-sm leading-6 text-slate-700">
                  <p>Typical prompts: "What does this do?", "What bugs might exist?", "How can this be improved?"</p>
                  <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Example snippet</p>
                    <pre className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-700">{`def get_average(nums):
    total = 0
    for i in range(len(nums)):
        total += nums[i]
    return total / len(nums)`}</pre>
                  </div>
                  <p className="mt-2">
                    Follow-ups you may get: empty list behavior, clearer implementation, time complexity, and Pythonic
                    alternatives.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    They are evaluating debugging ability, edge-case reasoning, and code quality awareness.
                  </p>
                </div>
              </details>

              <details className="group overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">3. Debugging interview</p>
                    <p className="text-xs text-slate-600">Real-engineering style: diagnose why something fails.</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600 transition-transform group-open:rotate-90" />
                </summary>
                <div className="border-t border-slate-200 px-3 py-2.5 text-sm leading-6 text-slate-700">
                  <p>Typical prompts: "Why does this crash?", "Why is output wrong?", "How would you debug this?"</p>
                  <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Example snippet</p>
                    <pre className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-700">{`def divide(a, b):
    return a / b`}</pre>
                  </div>
                  <p className="mt-2">
                    Follow-ups you may get: zero division handling, preventive checks, and tests to avoid regressions.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    They are evaluating structured debugging process, root-cause analysis, and practical engineering
                    mindset.
                  </p>
                </div>
              </details>

              <details className="group overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">4. Small system design</p>
                    <p className="text-xs text-slate-600">Simplified system design questions for intern roles.</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600 transition-transform group-open:rotate-90" />
                </summary>
                <div className="border-t border-slate-200 px-3 py-2.5 text-sm leading-6 text-slate-700">
                  <p>
                    Common prompts: URL shortener, notification system, rate limiter, caching layer.
                  </p>
                  <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Example prompt</p>
                    <p className="mt-1 text-sm">"Design a URL shortener like bit.ly."</p>
                    <p className="mt-2 text-sm">
                      Be ready for endpoints, data model, short-code generation, and scaling to millions of users.
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    They are evaluating how you break down systems, reason about architecture, and think about scaling.
                  </p>
                </div>
              </details>
            </div>

            <details className="group mt-2.5 overflow-hidden rounded-lg border border-amber-200 bg-amber-50/70">
              <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5">
                <p className="text-sm font-semibold text-amber-900">Show common verbal technical fundamentals</p>
                <ChevronRight className="h-4 w-4 text-amber-700 transition-transform group-open:rotate-90" />
              </summary>
              <div className="border-t border-amber-200 px-3 py-2.5 text-sm leading-6 text-slate-700">
                Typical examples: "What are the 4 principles of OOP?", "When would you use a queue vs stack?", "How
                does HTTP differ from HTTPS?", and role-specific fundamentals.
              </div>
            </details>
          </section>
        </div>

        <section className="mt-4 rounded-2xl border border-cyan-300 bg-cyan-50/60 p-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-cyan-700" />
            <h3 className="text-sm font-bold text-slate-950">At the end of any interview</h3>
          </div>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <div className="rounded-lg border border-cyan-200 bg-white p-2.5">
              <p className="text-sm font-semibold text-slate-950">Ask thoughtful questions before wrapping up</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                Examples: "What makes an intern successful here?" and "What projects did past interns usually work on?"
              </p>
            </div>
            <div className="rounded-lg border border-cyan-200 bg-white p-2.5">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-cyan-700" />
                <p className="text-sm font-semibold text-slate-950">Send a short thank-you email after</p>
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                Thank them for their time, mention one specific discussion point, and restate your interest.
              </p>
            </div>
          </div>
        </section>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
            <Target className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-slate-950">How to Solve Coding Questions</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          You do not need to be perfect. You need a clear process and strong communication.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {codingSteps.map((step) => (
            <article key={step.title} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-bold text-slate-950">{step.title}</p>
              <p className="mt-1.5 text-sm leading-6 text-slate-700">{step.description}</p>
            </article>
          ))}
        </div>
        <a
          href="https://youtu.be/1qw5ITr3k9E?si=0Cut-Mdxu2aoHzZg"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-800"
        >
          <ExternalLink className="h-4 w-4" />
          Optional: watch a simple mock coding interview (freeCodeCamp)
        </a>
      </section>

      <section className="overflow-hidden rounded-2xl border border-violet-300 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-sm shadow-violet-200">
            <Heart className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-950">Conclusion</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            If your resume reached interview stage, the company already believes you could be a hire. They are not
            spending an engineer hour interviewing someone they see as impossible to hire. Recruiters are also measured
            on successful hires, so everyone involved wants this to work.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            I have passed interviews where I did not fully solve the coding question. What matters most is being
            likable, showing genuine interest, thinking clearly, asking good questions, collaborating with the
            interviewer, and staying steady when things get uncomfortable.
          </p>
          <div className="mt-4 rounded-xl border border-indigo-200 bg-white p-3">
            <p className="text-sm font-semibold text-indigo-900">
              You do not need perfect answers. You need clear thinking, communication, and good collaboration signals.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
