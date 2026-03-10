import Link from "next/link";
import {
  Calendar,
  ChevronDown,
  Code2,
  Construction,
  ExternalLink,
  Github,
  GraduationCap,
  Lightbulb,
  Sparkles
} from "lucide-react";

const opportunityTypes = [
  {
    title: "Underclassmen Internships",
    subtitle: "Freshmen / Sophomore focused",
    description:
      "Internships specifically designed for early-year students. Top companies (including Google and Meta) run early-talent tracks like these, so you can compete earlier instead of waiting until junior year."
  },
  {
    title: "Diversity Programs",
    subtitle: "Career access + community",
    description:
      "Programs that support underrepresented students with mentorship, coaching, networking, and recruiting support. These programs can open doors to opportunities that are hard to access alone."
  },
  {
    title: "Fellowships",
    subtitle: "Usually 6-12 weeks",
    description:
      "Fellowships can include internships, mentorship, training, or open-source contribution tracks. Many are 6-12 weeks and can provide high-signal experience that stands out to recruiters at companies like Google and Meta."
  },
  {
    title: "Internship-Matching Fellowships",
    subtitle: "Hosted by NPOs / VCs",
    description:
      "A type of fellowship run by nonprofits or VC ecosystems to match students with startup internships. Usually not exclusive to underclassmen, but a strong way to get a fair shot at quality startup roles."
  },
  {
    title: "Externships",
    subtitle: "Usually 1-5 days",
    description:
      "Short programs to get to know and get noticed by a company. They can include webinars, training, networking events, and hackathons. Many big-tech and bank companies run these."
  },
  {
    title: "Other Special Programs & Resources",
    subtitle: "Hidden edge",
    description:
      "There are many more program types and categories beyond internships. Communities are especially valuable because they give you networking, referrals, and a support system throughout recruiting."
  }
];

export default function OpportunitiesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Opportunities</h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
          Discover programs, internships, and resources designed to help you succeed
        </p>
        <p className="mx-auto mt-3 max-w-3xl text-sm text-slate-600">
          Best used during fall recruiting: when internship applications open up, apply to jobs and
          these opportunities in parallel. Hackathons, fellowships, and communities like ColorStack
          can add major value to your resume and network.
        </p>
      </header>

      <section className="rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-sky-50 to-blue-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">Why This Matters</h2>
            <p className="mt-2 text-slate-700">
              Recruiting is more than submitting applications. There are{" "}
              <strong>underclassmen internships, diversity programs, fellowships, externships, and communities</strong>{" "}
              that can accelerate your path with mentorship, real project experience, and stronger
              access to opportunities.
            </p>
            <p className="mt-3 text-sm text-slate-600">
              This page is your starting map: learn the opportunity types, use the curated links,
              and then build your own pipeline by filtering for the programs that fit your goals.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <Construction className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <p className="text-sm text-slate-700">
            <strong>This page is still a work in progress.</strong> I&apos;m continuously adding
            more opportunities, programs, and resources. Check back soon for updates.
          </p>
        </div>
      </section>

      <section className="rounded-lg border-2 border-indigo-300 bg-indigo-50 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" />
          <p className="text-sm text-slate-700">
            <strong>If you don&apos;t have an internship yet, focus on this during the fall too.</strong>{" "}
            Open these links, get familiar with the programs, and filter for the ones that fit you.
            You might find communities you stay in for years, mentorship programs that help you get
            internships, and opportunities that become the start of your journey. There&apos;s a lot
            in these resources, so your job is to explore and choose what matches you best.
          </p>
        </div>
      </section>

      <section className="rounded-lg border-2 border-cyan-300 bg-cyan-50 p-4">
        <div className="flex items-start gap-3">
          <Github className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-700" />
          <p className="text-sm text-slate-700">
            <strong>Search for more opportunities beyond these lists.</strong> Especially for
            company programs and fellowships, these repositories will never include everything.
            New programs open, some programs close, and timelines change each season. Keep searching
            for more opportunities on your own, you might find untouched opportunities.
          </p>
        </div>
      </section>

      <section className="rounded-xl border-2 border-sky-200 bg-sky-50/70 p-5 md:p-6">
        <h2 className="text-xl font-bold text-slate-900">What These Opportunities Mean</h2>
        <p className="mt-2 text-sm text-slate-700">
          Expand each item for a quick definition.
        </p>

        <div className="mt-4 divide-y divide-sky-200 rounded-xl border border-sky-200 bg-white">
          {opportunityTypes.map((type) => (
            <details key={type.title} className="group px-4 py-2">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{type.title}</p>
                  <p className="text-xs font-medium uppercase tracking-wide text-sky-700">
                    {type.subtitle}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-2 text-sm leading-relaxed text-slate-700">{type.description}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <article className="rounded-xl border-2 border-emerald-200 bg-white p-5 transition-colors hover:border-emerald-400">
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Github className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900">Underclassmen Internships</h3>
              <p className="text-xs font-medium text-emerald-600">GitHub Repository</p>
            </div>
          </div>
          <p className="mb-4 text-sm text-slate-700">
            A curated GitHub repository listing tech internships specifically open to
            underclassmen (freshmen and sophomores). It&apos;s actively maintained by the community
            and regularly updated with new opportunities.
          </p>
          <Link
            href="https://github.com/zapplyjobs/underclassmen-internships"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            <Github className="h-4 w-4" />
            View Repository
            <ExternalLink className="h-3 w-3" />
          </Link>
        </article>

        <article className="rounded-xl border-2 border-cyan-200 bg-white p-5 transition-colors hover:border-cyan-400">
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
              <Github className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900">Other Opportunity Lists</h3>
              <p className="text-xs font-medium text-cyan-700">Extra repositories to explore</p>
            </div>
          </div>
          <p className="mb-4 text-sm text-slate-700">
            These lists can still be useful for discovery, but some entries may be outdated or
            overlap with the Underclassmen Internships GitHub list above.
          </p>
          <ul className="space-y-2">
            <li>
              <Link
                href="https://github.com/deepanshu1422/List-Of-Open-Source-Internships-Programs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-cyan-700 hover:text-cyan-800 hover:underline"
              >
                Open Source Internships Programs
                <ExternalLink className="h-3 w-3" />
              </Link>
            </li>
            <li>
              <Link
                href="https://github.com/zapplyjobs/Research-Internships-for-Undergraduates"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-cyan-700 hover:text-cyan-800 hover:underline"
              >
                Research Internships for Undergraduates
                <ExternalLink className="h-3 w-3" />
              </Link>
            </li>
            <li>
              <Link
                href="https://github.com/Julian048/CS-Everything-but-Internships"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-cyan-700 hover:text-cyan-800 hover:underline"
              >
                CS Everything But Internships
                <ExternalLink className="h-3 w-3" />
              </Link>
            </li>
            <li>
              <Link
                href="https://github.com/cslegasse/CS-Tech-Resource-Hub#Fellowships"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-cyan-700 hover:text-cyan-800 hover:underline"
              >
                CS Tech Resource Hub (Fellowships)
                <ExternalLink className="h-3 w-3" />
              </Link>
            </li>
          </ul>
        </article>

        <article className="rounded-xl border-2 border-indigo-200 bg-white p-5 transition-colors hover:border-indigo-400">
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <Code2 className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900">ColorStack</h3>
              <p className="text-xs font-medium text-indigo-600">Community Program</p>
            </div>
          </div>
          <p className="mb-4 text-sm text-slate-700">
            A diversity-focused community program with mentorship, career resources, exclusive
            internship opportunities, and strong peer support.
          </p>
          <Link
            href="https://www.colorstack.org/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Visit ColorStack
            <ExternalLink className="h-3 w-3" />
          </Link>
        </article>



        <article className="rounded-xl border-2 border-orange-200 bg-white p-5">
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900">Hackathons</h3>
              <p className="text-xs font-medium text-orange-600">Platforms + personal note</p>
            </div>
          </div>
          <p className="text-sm text-slate-700">
            I went to hackathons at Harvard and Princeton, and college hackathons have been very
            fun in my experience. There&apos;s probably one at your college, or at least in your
            state.
          </p>
          <div className="mt-3 space-y-1">
            <Link
              href="https://devpost.com/hackathons"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-orange-700 hover:text-orange-800 hover:underline"
            >
              Devpost Hackathons
              <ExternalLink className="h-3 w-3" />
            </Link>
            <br />
            <Link
              href="https://www.mlh.com/seasons/2025/events"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-orange-700 hover:text-orange-800 hover:underline"
            >
              MLH Season Events
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </article>
      </section>

     
    </div>
  );
}
