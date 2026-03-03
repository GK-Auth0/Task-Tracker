export interface CalendarTask {
  id: string;
  title: string;
  due_date?: string;
  status: string;
  priority: string;
  assignee?: {
    id: string;
    full_name: string;
    email: string;
  };
  project: {
    id: string;
    name: string;
  };
}

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  color: string;
}

export interface CalendarDayCell {
  date: Date;
  isCurrentMonth: boolean;
}
