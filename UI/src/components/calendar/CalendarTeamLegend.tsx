import React from "react";
import { LEGEND_DOT_CLASSES } from "./calendarColors";

interface TeamLegendMember {
  id: string;
  full_name: string;
  color: string;
}

interface CalendarTeamLegendProps {
  members: TeamLegendMember[];
}

const CalendarTeamLegend: React.FC<CalendarTeamLegendProps> = ({ members }) => {
  if (members.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        Team Legend:
      </span>
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-2">
            <span
              className={`size-3 rounded-sm ${
                LEGEND_DOT_CLASSES[member.color as keyof typeof LEGEND_DOT_CLASSES] ||
                "bg-blue-500"
              }`}
            ></span>
            <span className="text-sm font-medium text-slate-900">
              {member.full_name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarTeamLegend;
