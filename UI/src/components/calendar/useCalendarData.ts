import { useEffect, useState } from "react";
import { projectsAPI, tasksAPI, usersAPI } from "../../services/dashboard";
import { CalendarTask, TeamMember } from "./types";

type CalendarType = "personal" | "team";

const MEMBER_COLORS: TeamMember["color"][] = [
  "emerald",
  "indigo",
  "rose",
  "amber",
  "purple",
  "green",
  "blue",
  "orange",
];

const assignMemberColors = (
  members: Array<{
    id: string;
    full_name: string;
    email: string;
    role: string;
  }>,
): TeamMember[] =>
  members.map((member, index) => ({
    ...member,
    color: MEMBER_COLORS[index % MEMBER_COLORS.length],
  }));

const sanitizeTeamTasks = (
  tasks: CalendarTask[],
  members: TeamMember[],
): CalendarTask[] => {
  const orgMemberIds = new Set(members.map((member) => member.id));

  return Array.from(new Map(tasks.map((task) => [task.id, task])).values())
    .map((task) => ({
      ...task,
      assignee:
        task.assignee && orgMemberIds.has(task.assignee.id)
          ? task.assignee
          : undefined,
    }))
    .filter((task) => !task.assignee || orgMemberIds.has(task.assignee.id));
};

export const useCalendarData = (
  userId: string | undefined,
  calendarType: CalendarType,
) => {
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTasks([]);
      setTeamMembers([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadCalendarData = async () => {
      try {
        setLoading(true);

        if (calendarType === "team") {
          const [projectsResponse, membersResponse] = await Promise.all([
            projectsAPI.getProjects({ limit: 100 }),
            usersAPI.getUsers({ limit: 100 }),
          ]);

          const coloredMembers = membersResponse.success
            ? assignMemberColors(membersResponse.data)
            : [];

          if (isMounted) {
            setTeamMembers(coloredMembers);
          }

          if (!projectsResponse.success || projectsResponse.data.length === 0) {
            if (isMounted) {
              setTasks([]);
            }
            return;
          }

          const taskResponses = await Promise.all(
            projectsResponse.data.map((project) =>
              tasksAPI.getTasks({ project_id: project.id, limit: 100 }),
            ),
          );

          const mergedTasks = taskResponses
            .filter((response) => response.success)
            .flatMap((response) => response.data);

          if (isMounted) {
            setTasks(sanitizeTeamTasks(mergedTasks, coloredMembers));
          }
          return;
        }

        const response = await tasksAPI.getTasks({ limit: 100 });

        if (!isMounted) {
          return;
        }

        setTeamMembers([]);
        setTasks(response.success ? response.data : []);
      } catch (error) {
        console.error("Error fetching calendar data:", error);

        if (isMounted) {
          setTasks([]);
          if (calendarType !== "team") {
            setTeamMembers([]);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadCalendarData();

    return () => {
      isMounted = false;
    };
  }, [calendarType, userId]);

  return {
    loading,
    tasks,
    teamMembers,
  };
};
