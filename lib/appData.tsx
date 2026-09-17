"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuthStore } from "@/app/store/authStore";
import {
  fetchAgencies,
  fetchNotifications,
  fetchProjects,
  fetchTasks,
  loadAgencyMembers,
  getApiErrorMessage,
} from "./services";
import type { Agency, AppNotification, MyTask, Project, Task } from "./types";
import {
  buildMyTask,
  getProjectById,
  getProjectsByAgency,
  getTaskById,
  getTasksByAgency,
  getTasksByProject,
} from "./types";

type AppDataState = {
  agencies: Agency[];
  projects: Project[];
  tasks: Task[];
  notifications: AppNotification[];
  loading: boolean;
  error: string | null;
  lastLoadedAt: number | null;
};

type AppDataContextValue = {
  data: AppDataState;
  reload: () => Promise<void>;
  agencyById: (id: number | string) => Agency | undefined;
  projectById: (id: number | string) => Project | undefined;
  taskById: (id: number | string) => Task | undefined;
  getProject: (id: number | string) => Project | undefined;
  getTask: (id: number | string) => Task | undefined;
  projectsByAgency: (agencyId: number | string) => Project[];
  tasksByProject: (projectId: number | string) => Task[];
  tasksByAgency: (agencyId: number | string) => Task[];
  myTasks: () => MyTask[];
  myTasksInAgency: (agencyId: number | string) => MyTask[];
  unreadCount: number;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

const EMPTY: AppDataState = {
  agencies: [],
  projects: [],
  tasks: [],
  notifications: [],
  loading: true,
  error: null,
  lastLoadedAt: null,
};

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<AppDataState>(EMPTY);

  const load = useCallback(async () => {
    setData((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const agencies = await fetchAgencies();
      const withMembers: Agency[] = [];
      for (const agency of agencies) {
        const members = await loadAgencyMembers(agency.id);
        withMembers.push({ ...agency, members });
      }

      const projects: Project[] = [];
      for (const agency of withMembers) {
        const agencyProjects = await fetchProjects(agency.id);
        projects.push(...agencyProjects);
      }

      const tasks: Task[] = [];
      for (const project of projects) {
        const projectTasks = await fetchTasks(project.id);
        tasks.push(...projectTasks);
      }

      const notifications = await fetchNotifications();

      setData({
        agencies: withMembers,
        projects,
        tasks,
        notifications,
        loading: false,
        error: null,
        lastLoadedAt: Date.now(),
      });
    } catch (err) {
      setData((prev) => ({ ...prev, loading: false, error: getApiErrorMessage(err) }));
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    void load();
  }, [token, load]);

  const value = useMemo<AppDataContextValue>(() => {
    const byId = <T extends { id: number }>(list: T[], id: number | string) =>
      list.find((x) => Number(x.id) === Number(id));

    const myEmail = user?.email?.toLowerCase() ?? "";

    const myTasks = (): MyTask[] =>
      data.tasks
        .filter((t) => (t.assigneeEmail ?? "").toLowerCase() === myEmail)
        .map((t) => buildMyTask(t, byId(data.projects, t.projectId)));

    const myTasksInAgency = (agencyId: number | string): MyTask[] => {
      const agencyProjectIds = new Set(
        data.projects.filter((p) => Number(p.agencyId) === Number(agencyId)).map((p) => p.id),
      );
      return myTasks().filter((t) => agencyProjectIds.has(t.projectId));
    };

    const unreadCount = data.notifications.filter((n) => !n.readAt).length;

    return {
      data,
      reload: load,
      agencyById: (id) => byId(data.agencies, id),
      projectById: (id) => byId(data.projects, id),
      taskById: (id) => byId(data.tasks, id),
      getProject: (id) => getProjectById(data.projects, id),
      getTask: (id) => getTaskById(data.tasks, id),
      projectsByAgency: (agencyId) => getProjectsByAgency(data.projects, agencyId),
      tasksByProject: (projectId) => getTasksByProject(data.tasks, projectId),
      tasksByAgency: (agencyId) =>
        getTasksByAgency(data.tasks, data.projects, agencyId),
      myTasks,
      myTasksInAgency,
      unreadCount,
    };
  }, [data, user, load]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData doit être utilisé sous <AppDataProvider>");
  return ctx;
}

// Charge une ressource ponctuelle depuis l'API (membres d'un projet, commentaires, activité…).
export function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const [result, setResult] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const key = JSON.stringify(deps);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const value = await fetcherRef.current();
        if (alive) {
          setResult(value);
          setLoading(false);
        }
      } catch (err) {
        if (alive) {
          setError(getApiErrorMessage(err));
          setLoading(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);

  return { data: result, loading, error, reload };
}