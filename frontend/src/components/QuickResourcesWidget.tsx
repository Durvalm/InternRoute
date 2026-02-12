import { ExternalLink, FileText, Code, DollarSign } from "lucide-react";

export default function QuickResourcesWidget() {
  const resources = [
    { name: "Blind 75 List", icon: Code, color: "text-emerald-600", bg: "bg-emerald-50" },
    { name: "Resume Template", icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
    { name: "Levels.fyi (Salaries)", icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { name: "r/csMajors", icon: ExternalLink, color: "text-orange-600", bg: "bg-orange-50" }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="font-bold text-slate-900 mb-4">Quick Resources</h3>
      <div className="space-y-3">
        {resources.map((resource) => (
          <a
            key={resource.name}
            href="#"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
          >
            <div className={`p-2 rounded-md ${resource.bg} ${resource.color}`}>
              <resource.icon size={18} />
            </div>
            <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
              {resource.name}
            </span>
            <ExternalLink size={14} className="ml-auto text-slate-300 group-hover:text-indigo-400" />
          </a>
        ))}
      </div>
    </div>
  );
}
