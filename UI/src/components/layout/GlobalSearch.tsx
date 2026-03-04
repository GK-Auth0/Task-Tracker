import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { tasksAPI, Task } from "../../services/dashboard";
import { projectService } from "../../services/projectService";

type SearchProject = {
  id: string;
  name: string;
  description?: string;
};

const parseProjects = (payload: unknown): SearchProject[] => {
  const direct = (payload as { data?: unknown })?.data;
  if (Array.isArray(direct)) {
    return direct.map((project: any) => ({
      id: String(project?.id || ""),
      name: String(project?.name || "Untitled Project"),
      description: project?.description ? String(project.description) : undefined,
    }));
  }

  const nested = (payload as { data?: { data?: unknown } })?.data?.data;
  if (Array.isArray(nested)) {
    return nested.map((project: any) => ({
      id: String(project?.id || ""),
      name: String(project?.name || "Untitled Project"),
      description: project?.description ? String(project.description) : undefined,
    }));
  }

  return [];
};

export default function GlobalSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<SearchProject[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length < 2) {
      setTasks([]);
      setProjects([]);
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const [taskRes, projectRes] = await Promise.all([
          tasksAPI.getTasks({ page: 1, limit: 80 }),
          projectService.getProjects({ page: 1, limit: 80 }),
        ]);

        const filteredTasks = (taskRes.data || [])
          .filter((task) => {
            const title = String(task.title || "").toLowerCase();
            const description = String(task.description || "").toLowerCase();
            const projectName = String(task.project?.name || "").toLowerCase();
            return (
              title.includes(trimmed) ||
              description.includes(trimmed) ||
              projectName.includes(trimmed)
            );
          })
          .slice(0, 5);

        const filteredProjects = parseProjects(projectRes)
          .filter((project) => {
            const name = String(project.name || "").toLowerCase();
            const description = String(project.description || "").toLowerCase();
            return name.includes(trimmed) || description.includes(trimmed);
          })
          .slice(0, 5);

        setTasks(filteredTasks);
        setProjects(filteredProjects);
        setOpen(true);
      } catch (error) {
        setTasks([]);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => window.clearTimeout(timer);
  }, [query]);

  const hasResults = useMemo(
    () => tasks.length > 0 || projects.length > 0,
    [tasks.length, projects.length],
  );

  const goToTasksSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/tasks?q=${encodeURIComponent(trimmed)}`);
    setOpen(false);
  };

  const goToProjectsSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/projects?q=${encodeURIComponent(trimmed)}`);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
        search
      </span>
      <input
        ref={inputRef}
        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-500 outline-none"
        placeholder="Search tasks or projects..."
        type="text"
        value={query}
        onFocus={() => {
          if (query.trim().length >= 2) setOpen(true);
        }}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            goToTasksSearch();
          }
        }}
      />

      {open && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="border-b border-slate-100 px-3 py-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Global Search
            </p>
            {loading && <p className="text-xs text-slate-400">Searching...</p>}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {query.trim().length < 2 ? (
              <p className="px-3 py-3 text-sm text-slate-500">
                Type at least 2 characters.
              </p>
            ) : (
              <>
                <div className="px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Quick Actions
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={goToTasksSearch}
                      className="h-8 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Search Tasks
                    </button>
                    <button
                      type="button"
                      onClick={goToProjectsSearch}
                      className="h-8 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Search Projects
                    </button>
                  </div>
                </div>

                {hasResults ? (
                  <>
                    {tasks.length > 0 && (
                      <div className="border-t border-slate-100">
                        <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          Tasks
                        </p>
                        {tasks.map((task) => (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => {
                              navigate(`/task/${task.id}`);
                              setOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-slate-50"
                          >
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {task.title}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {task.project?.name || "No project"} • {task.status}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}

                    {projects.length > 0 && (
                      <div className="border-t border-slate-100">
                        <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          Projects
                        </p>
                        {projects.map((project) => (
                          <button
                            key={project.id}
                            type="button"
                            onClick={() => {
                              navigate(`/projects/${project.id}`);
                              setOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-slate-50"
                          >
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {project.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {project.description || "Open project details"}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : !loading ? (
                  <p className="px-3 py-3 text-sm text-slate-500">
                    No matches. Try another keyword.
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
