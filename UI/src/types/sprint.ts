export interface Sprint {
  id: string;
  name: string;
  goal?: string | null;
  release?: string | null;
  squad?: string | null;
  project_id: string;
  owner_id: string;
  capacity?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  status: "Planning" | "Active" | "Completed";
  created_at: string;
  updated_at: string;
  tasks_count: number;
  project: {
    id: string;
    name: string;
  } | null;
  owner: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}
