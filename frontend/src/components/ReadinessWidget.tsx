import type { ElementType } from "react";
import { TrendingUp, FileText, Code2, Briefcase } from "lucide-react";

type CategoryProgressProps = {
  icon: ElementType;
  label: string;
  percentage: number;
  color: string;
  bgColor: string;
  bgLight: string;
  details: string;
};

export default function ReadinessWidget() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Overall Readiness</h2>
            <p className="text-sm text-slate-500">Your preparedness for the recruiting season</p>
          </div>
        </div>
        <span className="text-3xl font-bold text-indigo-600">42%</span>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-4 mb-8 overflow-hidden">
        <div
          className="bg-indigo-600 h-4 rounded-full transition-all duration-1000 ease-out relative"
          style={{ width: "42%" }}
        >
          <div className="absolute top-0 left-0 bottom-0 right-0 bg-white/20 animate-[shimmer_2s_infinite] bg-[length:200%_100%] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CategoryProgress
          icon={Code2}
          label="Coding Skills"
          percentage={65}
          color="text-emerald-600"
          bgColor="bg-emerald-600"
          bgLight="bg-emerald-50"
          details="On Track"
        />
        <CategoryProgress
          icon={Briefcase}
          label="Projects"
          percentage={30}
          color="text-amber-600"
          bgColor="bg-amber-600"
          bgLight="bg-amber-50"
          details="Needs Attention"
        />
        <CategoryProgress
          icon={FileText}
          label="Resume"
          percentage={85}
          color="text-blue-600"
          bgColor="bg-blue-600"
          bgLight="bg-blue-50"
          details="Almost Ready"
        />
      </div>
    </div>
  );
}

function CategoryProgress({
  icon: Icon,
  label,
  percentage,
  color,
  bgColor,
  bgLight,
  details
}: CategoryProgressProps) {
  return (
    <div className={`p-4 rounded-xl border border-slate-100 ${bgLight}`}>
      <div className="flex justify-between items-start mb-2">
        <div className={`p-1.5 rounded-md bg-white shadow-sm ${color}`}>
          <Icon size={18} />
        </div>
        <span className={`text-lg font-bold ${color}`}>{percentage}%</span>
      </div>
      <h3 className="font-medium text-slate-900 mb-1">{label}</h3>
      <p className="text-xs text-slate-500 mb-3">{details}</p>
      <div className="w-full bg-white rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full ${bgColor}`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}
