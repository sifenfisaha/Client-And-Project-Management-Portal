import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useWorkspaceContext } from '../context/workspaceContext';
import ProjectCalendar from '../components/ProjectCalendar';

const ClientCalendar = () => {
  const { currentWorkspace } = useWorkspaceContext();

  const tasks = useMemo(() => {
    const projects = currentWorkspace?.projects || [];
    return projects.flatMap((project) =>
      (project.tasks || []).map((task) => ({
        ...task,
        projectName: project.name,
        projectId: project.id,
      }))
    );
  }, [currentWorkspace]);

  if (!currentWorkspace) {
    return (
      <div className="p-6 text-center text-zinc-900 dark:text-zinc-200">
        Loading calendar...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-zinc-900 dark:text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-medium">Project Calendar</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Deadlines across all projects
            </p>
          </div>
        </div>
      </div>

      <ProjectCalendar tasks={tasks} />
    </div>
  );
};

export default ClientCalendar;
