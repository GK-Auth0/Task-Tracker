import { NavLink } from "react-router-dom";
import { testCaseSectionLinks } from "../../data/testManagement";

interface SectionLink {
  to: string;
  label: string;
  icon: string;
}

interface TestCaseNavProps {
  links?: SectionLink[];
}

export default function TestCaseNav({
  links = testCaseSectionLinks,
}: TestCaseNavProps) {
  return (
    <div className="border-b border-slate-200">
      <div className="flex flex-wrap gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `inline-flex items-center gap-2 rounded-t-lg border border-b-0 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-slate-200 bg-white text-slate-900"
                  : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700"
              }`
            }
          >
            <span className="material-symbols-outlined text-[18px]">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
