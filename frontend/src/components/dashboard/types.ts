export type ModuleProgress = {
  module_key: string;
  module_name: string;
  overall_weight?: number;
  score: number;
  is_unlocked: boolean;
  unlock_threshold: number;
  has_tasks: boolean;
  has_bonus_tasks: boolean;
};

export type JourneyModule = {
  module_key: string;
  roadmap_key: "timeline" | "coding" | "projects" | "resume" | "applications";
  module_name: string;
  score: number;
  unlock_threshold: number;
  status: "completed" | "current" | "upcoming";
  target_date: string | null;
  days_to_target: number | null;
  completed_at: string | null;
  completed_delta_days: number | null;
};

export type JourneyPayload = {
  track_key: string;
  original_anchor_date: string;
  active_anchor_date: string;
  readiness_threshold: number;
  readiness_target_date: string;
  days_to_readiness_target: number;
  is_stale: boolean;
  stale_reason: string | null;
  modules: JourneyModule[];
};

export type TimelinePlan = {
  estimated_ready_date: string;
  estimated_duration_weeks: number;
  season_at_ready: "peak" | "lower" | "off";
  peak_cycle_open: string;
  peak_reference_is_current_cycle: boolean;
  next_peak_open: string;
  next_lower_open: string;
  recommended_start_date: string;
  recommended_season: "peak" | "lower" | "off";
  recommendation_key: string;
  recommendation_title: string;
  recommendation_summary: string;
  peak_hiring_note: string;
  season_explainer: string;
  ready_after_graduation: boolean;
  graduates_before_next_peak: boolean;
  graduation_date: string | null;
};

export type RecruitingScenario = {
  id: string;
  name: string;
  header: string;
  subtext: string;
  color_theme: "indigo" | "emerald" | "amber" | "slate";
  countdown_label: string;
  countdown_target: string;
  countdown_days: number;
  countdown_direction: "until" | "since";
  show_one_summer_badge: boolean;
};

export type RecruitingSummary = {
  season: "peak" | "lower" | "off";
  ready_threshold: number;
  readiness_status: "ready" | "not_ready";
  summers_left: number | null;
  next_peak_date: string;
  recruiting_window_end: string | null;
  season_explainer: string;
  scenario: RecruitingScenario;
};

export type DashboardSummary = {
  user_name: string | null;
  needs_skill_placement_assessment?: boolean;
  progress: number;
  category_readiness: {
    coding: number;
    projects: number;
    resume: number;
  };
  module_progress: ModuleProgress[];
  next_action: string | null;
  season_status: "prep" | "window";
  days_until_recruiting: number;
  recruiting_date: string;
  days_until_window_close: number | null;
  recruiting_window_end: string | null;
  graduation_date: string | null;
  recruiting: RecruitingSummary;
  journey: JourneyPayload;
  timeline_plan: TimelinePlan;
};

export type RebaselineResponse = {
  ok: boolean;
  journey: JourneyPayload;
  progress: number;
  category_readiness: {
    coding: number;
    projects: number;
    resume: number;
  };
  module_progress: ModuleProgress[];
  next_action: string | null;
};
