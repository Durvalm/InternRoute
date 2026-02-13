"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type ProfileResponse = {
  user: {
    name: string | null;
    coding_skill_level: string | null;
    graduation_date: string | null;
  };
};

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [codingSkillLevel, setCodingSkillLevel] = useState("Beginner");
  const [graduationDate, setGraduationDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiRequest<ProfileResponse>("/user/onboarding", {
        method: "POST",
        body: JSON.stringify({
          name,
          coding_skill_level: codingSkillLevel,
          graduation_date: graduationDate || null
        })
      });
      router.push("/dashboard");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white/90 p-8 shadow-soft border border-white/60">
      <h1 className="text-2xl font-semibold">Let’s personalize your plan</h1>
      <p className="mt-2 text-sm text-slate-500">
        Tell us your current level and goals so we can build your dashboard.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-xs font-medium text-slate-600">Full name</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Alex Johnson"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">
            How would you rate your coding skills with at least one programming language?
          </label>
          <select
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            value={codingSkillLevel}
            onChange={(event) => setCodingSkillLevel(event.target.value)}
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Graduation date</label>
          <input
            type="month"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            value={graduationDate}
            onChange={(event) => setGraduationDate(event.target.value)}
          />
        </div>
        {error ? <p className="text-xs text-red-500">{error}</p> : null}
        <button
          className="w-full rounded-xl bg-night text-white py-3 text-sm font-semibold disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Saving..." : "Finish onboarding"}
        </button>
      </form>
    </div>
  );
}
