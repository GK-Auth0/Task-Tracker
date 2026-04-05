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
    <div className="rounded-2xl border border-slate-200 bg-white p-2">
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
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
