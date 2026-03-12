'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { setTaskCompassResult, getTaskCompassResultForTask } from '@/lib/task_compass_storage';
import { 
  ListTodo, 
  LayoutGrid, 
  GanttChart,
  MoreHorizontal,
  Plus,
  Bug,
  Bookmark,
  CheckSquare,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  ArrowLeft,
  Search,
  GitBranch,
  AlertTriangle,
  FileCode,
  Play,
  Users,
  Shield,
  Loader2,
  RefreshCw,
} from 'lucide-react';

type PageProps = {
  params: Promise<{ orgShortId: string }> | { orgShortId: string };
};

type TabId = 'main' | 'board' | 'timeline';

// --- Mock Data & Types for Board ---
type Priority = 'high' | 'medium' | 'low';
type TaskType = 'bug' | 'story' | 'task';
type Status = 'backlog' | 'todo' | 'in-progress' | 'to-test' | 'completed';

interface Task {
  id: string;
  title: string;
  type: TaskType;
  priority: Priority;
  status: Status;
  assignee?: string;
  points?: number;
  description?: string;
  repositories?: string[];
}

const COLUMNS: { id: Status; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'to-test', title: 'To Test' },
  { id: 'completed', title: 'Completed' },
];

const MOCK_TASKS: Task[] = [
  {
    id: 'NC-104',
    title: 'Task Compass: Kanban board drag and drop',
    type: 'story',
    priority: 'high',
    status: 'backlog',
    points: 5,
    repositories: ['neurocode'],
    description:
      'Add drag-and-drop for moving issues between columns on the Task Compass board. Board state lives in task-compass/page.tsx; consider @dnd-kit or similar. Backlog/To Do/In Progress/To Test/Completed columns are already defined.',
  },
  {
    id: 'NC-105',
    title: 'Sidebar: fix active nav state for nested routes',
    type: 'bug',
    priority: 'high',
    status: 'backlog',
    repositories: ['neurocode'],
    description:
      'Active state on the sidebar (app/components/Sidebar.tsx) is wrong for nested routes like repo/[repoName]/documentation and repo/[repoName]/visual-tree. usePathname() may need to be compared with startsWith or a route matcher.',
  },
  {
    id: 'NC-106',
    title: 'Neurocode app: add dark/light theme toggle',
    type: 'task',
    priority: 'medium',
    status: 'backlog',
    points: 2,
    repositories: ['neurocode'],
    description:
      'Add a theme toggle (e.g. on settings page or navbar). Theme is driven by CSS variables in app/globals.css and possibly tailwind.config. Ensure all pages (task-compass, hot-zones, repo documentation) respect the toggle.',
  },
  {
    id: 'NC-101',
    title: 'neurocode-python: Jira integration API endpoints',
    type: 'story',
    priority: 'high',
    status: 'todo',
    points: 8,
    repositories: ['neurocode', 'neurocode-python'],
    description:
      'Add FastAPI routes in neurocode-python for syncing tasks with Jira (e.g. fetch issues, map to internal schema). Follow patterns in neurocode/routes/internal.py for auth. Neurocode frontend will call these from Task Compass later.',
  },
  {
    id: 'NC-102',
    title: 'Task Compass: empty states for Main, Board, Timeline',
    type: 'task',
    priority: 'medium',
    status: 'todo',
    points: 3,
    repositories: ['neurocode'],
    description:
      'Improve empty states in app/(pages)/(main)/[orgShortId]/task-compass/page.tsx: MainView (select task), BoardView (no tasks in column), and the Timeline tab. Keep styling consistent with globals.css tokens.',
  },
  {
    id: 'NC-99',
    title: 'neurocode-python: migrate avatar uploads to new CDN',
    type: 'story',
    priority: 'medium',
    status: 'in-progress',
    points: 5,
    repositories: ['neurocode-python'],
    description:
      'Update neurocode/services/storage/s3_service.py (and any callers) to write avatar objects to the new CDN bucket and use the new base URL from config. Preserve the storage.py abstraction so neurocode frontend does not need changes.',
  },
  {
    id: 'NC-95',
    title: 'Hot Zones: fix memory leak in dashboard',
    type: 'bug',
    priority: 'high',
    status: 'to-test',
    repositories: ['neurocode', 'neurocode-python'],
    description:
      'HotZonesDashboard.tsx (neurocode) holds heavy state and may leak on unmount; neurocode-python routes/hot_zones.py returns large payloads. Fix useEffect cleanup and/or subscription cleanup in the dashboard; verify with DevTools Memory.',
  },
  {
    id: 'NC-92',
    title: 'neurocode-python: update README and API docs for v2',
    type: 'task',
    priority: 'low',
    status: 'to-test',
    points: 2,
    repositories: ['neurocode-python'],
    description:
      'Update neurocode-python/README.md and the docs produced by neurocode/routes/documentation.py to reflect API v2 (e.g. new routes, request/response shapes). Align with neurocode/services/config/documentation_schema.json if used.',
  },
  {
    id: 'NC-88',
    title: 'Neurocode: Next.js app router and main layout',
    type: 'story',
    priority: 'high',
    status: 'completed',
    points: 13,
    repositories: ['neurocode'],
    description:
      'Completed: app router, (pages), (main), [orgShortId] routing structure and app/(pages)/(main)/layout.tsx. Sidebar and main content area are used by task-compass, hot-zones, repo documentation, and visual-tree.',
  },
  {
    id: 'NC-110',
    title: 'Task Compass: fetch tasks from neurocode-python API',
    type: 'story',
    priority: 'high',
    status: 'backlog',
    points: 8,
    repositories: ['neurocode', 'neurocode-python'],
    description:
      'Replace MOCK_TASKS in task-compass/page.tsx with data from neurocode-python (e.g. a new internal route or task-sync endpoint). Frontend: fetch on load, handle loading/error. Backend: return task list in a shape compatible with existing Task type and board columns.',
  },
  {
    id: 'NC-111',
    title: 'Visual tree: improve load time for large repos',
    type: 'story',
    priority: 'medium',
    status: 'backlog',
    points: 5,
    repositories: ['neurocode', 'neurocode-python'],
    description:
      'Visual tree page (neurocode repo/[repoName]/visual-tree) calls neurocode-python routes/visual_tree.py. Tree can be slow for large repos. Consider pagination, lazy loading, or caching in neurocode-python services/analysis/tree_builder.py.',
  },
  {
    id: 'NC-112',
    title: 'Documentation chat: stream LLM responses',
    type: 'task',
    priority: 'medium',
    status: 'todo',
    points: 3,
    repositories: ['neurocode', 'neurocode-python'],
    description:
      'Documentation chat in neurocode (DocumentationChatPanel) calls neurocode-python (e.g. routes/chat.py). Switch to streaming so the UI shows tokens as they arrive. Backend uses neurocode/services/external/llm_service.py.',
  },
];

// --- Task Compass Context ---

type RiskLevel = 'low' | 'medium' | 'high';
type CautionLabel = 'caution' | 'manual approval';
type FileBadge = 'core' | 'helper' | 'config' | 'UI' | 'route' | 'service' | 'schema' | 'test';

interface CompassContext {
  area: string;
  riskLevel: RiskLevel;
  cautionAreas: { file: string; reason: string; label: CautionLabel }[];
  relevantFiles: { file: string; reason: string; badge: FileBadge }[];
  entryPoints: { target: string; reason: string }[];
  ownership: { name: string; role: string; type: 'owner' | 'contributor' | 'reviewer' }[];
}

function getTypeIcon(type: TaskType) {
  switch (type) {
    case 'bug': return <Bug className="w-3.5 h-3.5 text-red-400" />;
    case 'story': return <Bookmark className="w-3.5 h-3.5 text-green-400" />;
    case 'task': return <CheckSquare className="w-3.5 h-3.5 text-blue-400" />;
  }
}

function getPriorityIcon(priority: Priority) {
  switch (priority) {
    case 'high': return <ArrowUp className="w-3.5 h-3.5 text-red-400" />;
    case 'medium': return <ArrowRight className="w-3.5 h-3.5 text-amber-400" />;
    case 'low': return <ArrowDown className="w-3.5 h-3.5 text-blue-400" />;
  }
}

// --- Components ---

function TaskDetailsModal({ task, onClose }: { task: Task; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative w-full max-w-2xl rounded-lg border border-[#333] bg-[#141414] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 text-xs font-medium text-white/40">{task.id}</div>
            <h2 className="text-lg font-semibold text-white">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-transparent px-2 py-1 text-xs text-white/50 hover:border-[#333] hover:bg-[#1f1f1f] hover:text-white/80"
          >
            Close
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1 rounded-full bg-[#1a1a1a] px-2 py-1 text-white/60">
            <span className="text-white/40">Type</span>
            <span className="font-medium capitalize">{task.type}</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-[#1a1a1a] px-2 py-1 text-white/60">
            <span className="text-white/40">Priority</span>
            <span className="flex items-center gap-1 font-medium capitalize">
              {getPriorityIcon(task.priority)}
              <span>{task.priority}</span>
            </span>
          </div>
          {typeof task.points === 'number' && (
            <div className="flex items-center gap-1 rounded-full bg-[#1a1a1a] px-2 py-1 text-white/60">
              <span className="text-white/40">Story points</span>
              <span className="font-medium">{task.points}</span>
            </div>
          )}
          <div className="flex items-center gap-1 rounded-full bg-[#1a1a1a] px-2 py-1 text-white/60">
            <span className="text-white/40">Status</span>
            <span className="font-medium capitalize">{task.status.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[#1a1a1a] px-2 py-1 text-white/60">
            <span className="text-white/40">Assignee</span>
            {task.assignee ? (
              <div
                className="flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--color-primary)]"
                title={`Assignee: ${task.assignee}`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)]/20">
                  {getAssigneeInitials(task.assignee)}
                </span>
                <span>{task.assignee}</span>
              </div>
            ) : (
              <span className="text-white/40">Unassigned</span>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-6 md:grid-cols-[2fr,1fr]">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Description</h3>
            <div className="rounded-md border border-[#262626] bg-[#151515] p-3 text-sm text-white/70">
              {task.description || (
                <span className="text-white/40">
                  This is a placeholder description for a demo issue on the Task Compass board. You can later replace
                  this with real Jira data.
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3 text-xs text-white/60">
            <div>
              <div className="mb-1 font-semibold uppercase tracking-wide text-white/40">People</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>Reporter</span>
                  <span className="rounded-full bg-[#1a1a1a] px-2 py-0.5 text-[11px] text-white/70">
                    Demo Reporter
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Assignee</span>
                  <span className="rounded-full bg-[#1a1a1a] px-2 py-0.5 text-[11px] text-white/70">
                    {task.assignee || 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-1 font-semibold uppercase tracking-wide text-white/40">Meta</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>Key</span>
                  <span className="text-white/80">{task.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Type</span>
                  <span className="capitalize">{task.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Priority</span>
                  <span className="capitalize">{task.priority}</span>
                </div>
              </div>
            </div>

            {task.repositories && task.repositories.length > 0 && (
              <div>
                <div className="mb-1 font-semibold uppercase tracking-wide text-white/40">Repositories</div>
                <div className="flex flex-wrap gap-1.5">
                  {task.repositories.map((repo) => (
                    <span
                      key={repo}
                      className="inline-flex items-center gap-1 rounded bg-[#1a1a1a] border border-[#262626] px-1.5 py-0.5 text-[11px] text-white/60"
                    >
                      <GitBranch className="w-2.5 h-2.5" />
                      {repo}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BoardCard({ task, onClick }: { task: Task; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-[#262626] border border-[#333] hover:border-[var(--color-primary)]/50 hover:bg-[#2a2a2a] transition-colors rounded-md p-3 shadow-sm cursor-pointer text-left group w-full"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-medium text-white/50 group-hover:text-white/70 transition-colors">{task.id}</span>
        <span className="text-white/40 hover:text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-4 h-4" />
        </span>
      </div>
      
      <p className="text-sm text-white mb-4 line-clamp-3">{task.title}</p>
      
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          <div title={`Type: ${task.type}`}>{getTypeIcon(task.type)}</div>
          <div title={`Priority: ${task.priority}`}>{getPriorityIcon(task.priority)}</div>
          {task.points && (
            <span className="text-[10px] font-medium text-white/50 bg-[#1a1a1a] px-1.5 py-0.5 rounded-full" title="Story Points">
              {task.points}
            </span>
          )}
        </div>
        
        {task.assignee ? (
          <div className="w-5 h-5 rounded-full bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/30 flex items-center justify-center text-[10px] font-bold text-[var(--color-primary)]" title={`Assignee: ${task.assignee}`}>
            {getAssigneeInitials(task.assignee)}
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-[#1a1a1a] border border-[#333] border-dashed flex items-center justify-center text-white/30" title="Unassigned">
            <span className="sr-only">Unassigned</span>
          </div>
        )}
      </div>
    </button>
  );
}

function TaskPickerModal({
  tasks,
  onSelect,
  onClose,
}: {
  tasks: Task[];
  onSelect: (task: Task) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTasks = tasks.filter((t) => t.status !== 'completed');

  const filtered = activeTasks.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.id.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      t.type.includes(q) ||
      (t.repositories ?? []).some((r) => r.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative w-full max-w-lg rounded-lg border border-[#333] bg-[#141414] shadow-xl flex flex-col max-h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[#262626] px-4 py-3">
          <Search className="w-4 h-4 text-white/30 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by name, key, type, or repo..."
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
          />
          <button
            onClick={onClose}
            className="rounded-md border border-transparent px-2 py-1 text-xs text-white/50 hover:border-[#333] hover:bg-[#1f1f1f] hover:text-white/80 shrink-0"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-white/30">
              {search.trim() ? 'No tasks match your search' : 'No active tasks'}
            </div>
          ) : (
            filtered.map((task) => (
              <button
                key={task.id}
                onClick={() => onSelect(task)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[#1a1a1a] transition-colors border-b border-[#1e1e1e] last:border-b-0"
              >
                <div className="pt-0.5 shrink-0">{getTypeIcon(task.type)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-medium text-white/40">{task.id}</span>
                    <span className="flex items-center gap-0.5 text-[10px] text-white/30 capitalize">
                      {getPriorityIcon(task.priority)}
                      {task.priority}
                    </span>
                    <span className="text-[10px] text-white/25 capitalize">{task.status.replace('-', ' ')}</span>
                  </div>
                  <p className="text-sm text-white/80 truncate">{task.title}</p>
                  {task.repositories && task.repositories.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      {task.repositories.map((repo) => (
                        <span
                          key={repo}
                          className="inline-flex items-center gap-1 rounded bg-[#1a1a1a] border border-[#262626] px-1.5 py-0.5 text-[10px] text-white/45"
                        >
                          <GitBranch className="w-2.5 h-2.5" />
                          {repo}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {task.assignee && (
                  <div
                    className="mt-1 shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/30 text-[10px] font-bold text-[var(--color-primary)]"
                    title={task.assignee}
                  >
                    {getAssigneeInitials(task.assignee)}
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        <div className="border-t border-[#262626] px-4 py-2 text-[11px] text-white/25">
          {filtered.length} task{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    low: 'bg-green-500/10 text-green-400 border-green-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    high: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${styles[level]}`}>
      {level === 'high' && <AlertTriangle className="mr-1 w-3 h-3" />}
      {level} risk
    </span>
  );
}

function FileBadgeTag({ badge }: { badge: FileBadge }) {
  const colors: Record<FileBadge, string> = {
    core: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    helper: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    config: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    UI: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    route: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    service: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    schema: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    test: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  };
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${colors[badge]}`}>
      {badge}
    </span>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex items-center justify-center w-6 h-6 rounded bg-[#1a1a1a] border border-[#262626] text-white/40">
        {icon}
      </div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">{title}</h3>
    </div>
  );
}

function formatAnalyzedAt(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffM = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffMs / 86400000);
    if (diffM < 1) return 'Just now';
    if (diffM < 60) return `${diffM}m ago`;
    if (diffH < 24) return `${diffH}h ago`;
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function TaskCompassView({ task, onBack, orgShortId }: { task: Task; onBack: () => void; orgShortId: string }) {
  const [ctx, setCtx] = useState<CompassContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<string | null>(null);

  const fetchCompass = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/task-compass/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgShortId,
          taskId: task.id,
          taskTitle: task.title,
          taskDescription: task.description || null,
          taskType: task.type,
          repositories: task.repositories || null,
        }),
      });
      if (!res.ok) {
        throw new Error(`Analysis failed (${res.status})`);
      }
      const data: CompassContext = await res.json();
      setCtx(data);
      const analyzedAt = new Date().toISOString();
      setLastAnalyzedAt(analyzedAt);
      setTaskCompassResult(orgShortId, {
        taskId: task.id,
        taskTitle: task.title,
        area: data.area,
        riskLevel: data.riskLevel,
        cautionAreas: data.cautionAreas,
        relevantFiles: data.relevantFiles,
        entryPoints: data.entryPoints,
        analyzedAt,
      });
    } catch (e) {
      console.error('[task-compass] fetch error:', e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  }, [orgShortId, task]);

  useEffect(() => {
    const cached = getTaskCompassResultForTask(orgShortId, task.id);
    if (cached?.area != null) {
      setCtx({
        area: cached.area,
        riskLevel: cached.riskLevel as RiskLevel,
        cautionAreas: cached.cautionAreas ?? [],
        relevantFiles: cached.relevantFiles ?? [],
        entryPoints: cached.entryPoints ?? [],
        ownership: [],
      });
      setLastAnalyzedAt(cached.analyzedAt ?? null);
      setLoading(false);
      return;
    }
    fetchCompass();
  }, [orgShortId, task.id, fetchCompass]);

  return (
    <div className="flex flex-col h-[calc(100vh-220px)]">
      {/* Header bar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-md border border-[#333] bg-[#1a1a1a] px-3 py-1.5 text-sm text-white/60 hover:border-[var(--color-primary)]/40 hover:text-white/90 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
          <span className="text-white/40 font-medium shrink-0">{task.id}</span>
          <span className="text-white/70 truncate">{task.title}</span>
        </div>
        {lastAnalyzedAt && !loading && (
          <span className="text-xs text-white/45 shrink-0">
            Last analysed: {formatAnalyzedAt(lastAnalyzedAt)}
          </span>
        )}
        {!loading && (
          <button
            onClick={fetchCompass}
            title="Regenerate analysis"
            className="flex items-center gap-1.5 rounded-md border border-[#333] bg-[#1a1a1a] px-2.5 py-1.5 text-xs text-white/40 hover:border-[var(--color-primary)]/40 hover:text-white/70 transition-colors shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            Regenerate
          </button>
        )}
      </div>

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 text-[var(--color-primary)] animate-spin" />
          <p className="text-sm text-white/40">Analyzing task against codebase...</p>
        </div>
      )}

      {!loading && error && !ctx && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-400/60" />
          <p className="text-sm text-white/40">Analysis failed: {error}</p>
          <button
            onClick={fetchCompass}
            className="flex items-center gap-1.5 rounded-md border border-[#333] bg-[#1e1e1e] px-3 py-1.5 text-xs text-white/60 hover:text-white/80 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {!loading && <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 space-y-5">
        {/* ===== 1. Task Summary ===== */}
        <div className="rounded-lg border border-[#262626] bg-[#141414] p-5">
          <SectionHeader icon={<ListTodo className="w-3.5 h-3.5" />} title="Task Summary" />
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {getTypeIcon(task.type)}
                <h2 className="text-base font-semibold text-white">{task.title}</h2>
              </div>
              <p className="text-sm text-white/55 leading-relaxed">
                {task.description || 'No description provided.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {ctx && (
                <>
                  <span className="inline-flex items-center rounded-full bg-[#1a1a1a] border border-[#262626] px-2.5 py-0.5 text-[11px] text-white/50">
                    {ctx.area}
                  </span>
                  <RiskBadge level={ctx.riskLevel} />
                </>
              )}
              {task.repositories?.map((repo) => (
                <span
                  key={repo}
                  className="inline-flex items-center gap-1 rounded-full bg-[#1a1a1a] border border-[#262626] px-2 py-0.5 text-[10px] text-white/45"
                >
                  <GitBranch className="w-2.5 h-2.5" />
                  {repo}
                </span>
              ))}
            </div>
          </div>
        </div>

        {ctx ? (
          <>
            {/* ===== 2. Areas to Proceed with Caution ===== */}
            {ctx.cautionAreas.length > 0 && (
              <div className="rounded-lg border border-[#262626] bg-[#141414] p-5">
                <SectionHeader icon={<AlertTriangle className="w-3.5 h-3.5" />} title="Areas to Proceed with Caution" />
                <div className="space-y-2">
                  {ctx.cautionAreas.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-md border border-[#1e1e1e] bg-[#171717] px-3 py-2.5">
                      <FileCode className="mt-0.5 w-3.5 h-3.5 shrink-0 text-amber-400/60" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-xs text-white/70 font-mono">{item.file}</code>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                              item.label === 'manual approval'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}
                          >
                            {item.label === 'manual approval' && <Shield className="mr-0.5 w-2.5 h-2.5" />}
                            {item.label}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-white/40 leading-relaxed">{item.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== 3. Relevant Files ===== */}
            {ctx.relevantFiles.length > 0 && (
              <div className="rounded-lg border border-[#262626] bg-[#141414] p-5">
                <SectionHeader icon={<FileCode className="w-3.5 h-3.5" />} title="Relevant Files" />
                <div className="space-y-2">
                  {ctx.relevantFiles.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-md border border-[#1e1e1e] bg-[#171717] px-3 py-2.5">
                      <FileCode className="mt-0.5 w-3.5 h-3.5 shrink-0 text-white/25" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-xs text-white/70 font-mono truncate">{item.file}</code>
                          <FileBadgeTag badge={item.badge} />
                        </div>
                        <p className="mt-1 text-xs text-white/40 leading-relaxed">{item.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== 4. Entry Points ===== */}
            {ctx.entryPoints.length > 0 && (
              <div className="rounded-lg border border-[#262626] bg-[#141414] p-5">
                <SectionHeader icon={<Play className="w-3.5 h-3.5" />} title="Entry Points" />
                <div className="space-y-2">
                  {ctx.entryPoints.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-md border border-[#1e1e1e] bg-[#171717] px-3 py-2.5">
                      <Play className="mt-0.5 w-3 h-3 shrink-0 text-[var(--color-primary)]/60" />
                      <div className="min-w-0 flex-1">
                        <code className="text-xs text-white/70 font-mono">{item.target}</code>
                        <p className="mt-1 text-xs text-white/40 leading-relaxed">{item.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== 5. Ownership & Context ===== */}
            {ctx.ownership.length > 0 && (
              <div className="rounded-lg border border-[#262626] bg-[#141414] p-5">
                <SectionHeader icon={<Users className="w-3.5 h-3.5" />} title="Ownership & Context" />
                <p className="text-[11px] text-white/30 mb-3 -mt-1">People to contact for questions about this area</p>
                <div className="space-y-2">
                  {ctx.ownership.map((person, i) => {
                    const typeColors: Record<string, string> = {
                      owner: 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border-[var(--color-primary)]/25',
                      contributor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                      reviewer: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    };
                    const initials = person.name
                      .split(/\s+/)
                      .filter(Boolean)
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();
                    return (
                      <div key={i} className="flex items-center gap-3 rounded-md border border-[#1e1e1e] bg-[#171717] px-3 py-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] border border-[#333] text-[11px] font-bold text-white/50">
                          {initials || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-white/80 leading-tight">{person.name}</p>
                          <p className="text-[11px] text-white/35 leading-relaxed mt-0.5">{person.role}</p>
                        </div>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize shrink-0 ${typeColors[person.type]}`}>
                          {person.type}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 rounded-lg border-2 border-dashed border-[#262626] bg-[#141414] flex items-center justify-center py-16">
            <span className="text-sm text-white/30">No compass context available for this task yet.</span>
          </div>
        )}
      </div>}

      {!loading && error && ctx && (
        <div className="mt-2 flex items-center gap-2 px-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400/50 shrink-0" />
          <p className="text-xs text-amber-400/40">
            Live analysis failed — showing cached data. {error}
          </p>
        </div>
      )}
    </div>
  );
}

function MainView({ orgShortId, tasks }: { orgShortId: string; tasks: Task[] }) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (selectedTask) {
    return (
      <TaskCompassView
        task={selectedTask}
        onBack={() => setSelectedTask(null)}
        orgShortId={orgShortId}
      />
    );
  }

  return (
    <div className="flex h-[calc(100vh-220px)] rounded-lg border-2 border-dashed border-[#262626] bg-[#141414] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1a1a1a] border border-[#262626]">
          <ListTodo className="w-6 h-6 text-white/30" />
        </div>
        <p className="text-sm text-white/40">Select a task to get started</p>

        <button
          onClick={() => setPickerOpen(true)}
          className="flex items-center gap-2 rounded-md border border-[#333] bg-[#1e1e1e] px-4 py-2 text-sm font-medium text-white/70 hover:border-[var(--color-primary)]/50 hover:text-white transition-colors"
        >
          Select Task
        </button>
      </div>

      {pickerOpen && (
        <TaskPickerModal
          tasks={tasks}
          onSelect={(task) => {
            setSelectedTask(task);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function BoardView({ tasks }: { tasks: Task[] }) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  return (
    <div className="flex h-[calc(100vh-220px)] gap-4 overflow-x-auto pb-4 pt-2 -mx-4 px-4 custom-scrollbar">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.id);

        return (
          <div key={col.id} className="flex flex-col w-[300px] flex-shrink-0 bg-[#171717] rounded-lg border border-[#262626]">
            {/* Column Header */}
            <div className="flex items-center justify-between p-3 border-b border-[#262626] bg-[#1a1a1a] rounded-t-lg sticky top-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white/90">{col.title}</h3>
                <span className="text-xs font-medium text-white/40 bg-[#262626] px-1.5 py-0.5 rounded-full">
                  {columnTasks.length}
                </span>
              </div>
              <div className="flex gap-1">
                <button className="p-1 text-white/40 hover:text-white/80 hover:bg-[#262626] rounded transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
                <button className="p-1 text-white/40 hover:text-white/80 hover:bg-[#262626] rounded transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tasks Container */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {columnTasks.map((task) => (
                <BoardCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
              ))}

              {columnTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-[#262626] rounded-md text-white/30 text-xs">
                  No tasks
                </div>
              )}
            </div>

            {/* Quick Add Button */}
            <div className="p-2 pt-0 mt-auto">
              <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-white/50 hover:text-white/90 hover:bg-[#262626] rounded transition-colors group">
                <Plus className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80" />
                Create issue
              </button>
            </div>
          </div>
        );
      })}

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}

function getAssigneeLabel(session: { user?: { name?: string | null; email?: string | null } } | null): string {
  if (!session?.user) return 'Me';
  const name = session.user.name?.trim();
  if (name) return name;
  const email = session.user.email?.trim();
  if (email) return email;
  return 'Me';
}

function getAssigneeInitials(assignee: string): string {
  const s = assignee.trim();
  if (!s) return 'Me';
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  if (s.includes('@')) return s.slice(0, 2).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

export default function TaskCompassPage({ params }: PageProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabId>('board');
  const [orgShortId, setOrgShortId] = useState('');

  const assigneeLabel = getAssigneeLabel(session);
  const tasks = useMemo(
    () => MOCK_TASKS.map((t) => ({ ...t, assignee: assigneeLabel })),
    [assigneeLabel]
  );

  useEffect(() => {
    Promise.resolve(params).then((p) => {
      const raw = p.orgShortId || '';
      setOrgShortId(raw.startsWith('org-') ? raw.replace('org-', '') : raw);
    });
  }, [params]);

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'main', label: 'Main', icon: <ListTodo className="w-4 h-4" /> },
    { id: 'board', label: 'Board', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <GanttChart className="w-4 h-4" /> },
  ];

  return (
    <div className="mx-auto max-w-screen-2xl">
      <h1 className="text-3xl font-bold text-white mb-1">Task Compass</h1>

      <div className="flex gap-8 mt-6 border-b border-[#262626]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-0 py-1 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer ${
              activeTab === tab.id
                ? 'text-[var(--color-primary)] border-[var(--color-primary)]'
                : 'text-white hover:text-white/90 border-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-0 pt-4">
        {activeTab === 'main' && <MainView orgShortId={orgShortId} tasks={tasks} />}
        {activeTab === 'board' && <BoardView tasks={tasks} />}
        {activeTab === 'timeline' && <div className="text-white/60 text-sm">Timeline content</div>}
      </div>
    </div>
  );
}
