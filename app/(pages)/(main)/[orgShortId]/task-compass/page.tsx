'use client';

import { useState, useRef, useEffect } from 'react';
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
    title: 'Implement Kanban board drag and drop',
    type: 'story',
    priority: 'high',
    status: 'backlog',
    points: 5,
    assignee: 'SD',
    repositories: ['neurocode'],
    description:
      'Allow users to drag and drop issues between columns on the Task Compass board. This is a dummy task for demonstrating the details view.',
  },
  {
    id: 'NC-105',
    title: 'Fix navigation active state bug',
    type: 'bug',
    priority: 'high',
    status: 'backlog',
    assignee: 'JD',
    repositories: ['neurocode'],
    description:
      'The active nav item is not highlighted correctly on some pages. This is a placeholder description only.',
  },
  {
    id: 'NC-106',
    title: 'Add dark mode toggle',
    type: 'task',
    priority: 'medium',
    status: 'backlog',
    points: 2,
    repositories: ['neurocode'],
    description:
      'Introduce a toggle to switch between light and dark themes. All content on this board is dummy for now.',
  },
  {
    id: 'NC-101',
    title: 'Set up Jira integration API endpoints',
    type: 'story',
    priority: 'high',
    status: 'todo',
    points: 8,
    assignee: 'AC',
    repositories: ['neurocode', 'neurocode-python'],
    description:
      'Prepare backend endpoints that will later be wired up to Jira. No real integration is performed in this demo.',
  },
  {
    id: 'NC-102',
    title: 'Design new Task Compass empty states',
    type: 'task',
    priority: 'medium',
    status: 'todo',
    points: 3,
    assignee: 'MK',
    repositories: ['neurocode'],
    description:
      'Create friendly and informative empty states for the Task Compass views. This card exists purely as demo content.',
  },
  {
    id: 'NC-99',
    title: 'Migrate user avatars to new CDN',
    type: 'story',
    priority: 'medium',
    status: 'in-progress',
    points: 5,
    assignee: 'SD',
    repositories: ['neurocode'],
    description:
      'Move existing user avatar assets over to the new CDN provider. This is an example in-progress issue.',
  },
  {
    id: 'NC-95',
    title: 'Memory leak in hot zones dashboard',
    type: 'bug',
    priority: 'high',
    status: 'to-test',
    assignee: 'JD',
    repositories: ['neurocode'],
    description:
      'Investigate and resolve a suspected memory leak in the hot zones dashboard view. Data shown here is dummy only.',
  },
  {
    id: 'NC-92',
    title: 'Update documentation for API v2',
    type: 'task',
    priority: 'low',
    status: 'to-test',
    points: 2,
    assignee: 'AC',
    repositories: ['neurocode-python'],
    description:
      'Refresh public documentation to cover the latest API v2 changes. This card content is placeholder text.',
  },
  {
    id: 'NC-88',
    title: 'Initial setup of Next.js app router',
    type: 'story',
    priority: 'high',
    status: 'completed',
    points: 13,
    assignee: 'MK',
    repositories: ['neurocode'],
    description:
      'Complete the initial setup of the Next.js app router, routing groups, and layouts. Represents a completed demo task.',
  },
  {
    id: 'NC-110',
    title: 'Wire Task Compass to neurocode-python API',
    type: 'story',
    priority: 'high',
    status: 'backlog',
    points: 8,
    assignee: 'AC',
    repositories: ['neurocode', 'neurocode-python'],
    description:
      'Plan and scaffold integration between the Next.js Task Compass board and the neurocode-python FastAPI service. ' +
      'Use the existing FastAPI entrypoints in the neurocode-python repository (e.g. `python run.py` / `python -m neurocode.main`) ' +
      'as the backend for syncing tasks in a future Jira-like workflow. This is a realistic dummy task only; no live integration is performed yet.',
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

const COMPASS_DATA: Record<string, CompassContext> = {
  'NC-104': {
    area: 'Task Compass UI',
    riskLevel: 'medium',
    cautionAreas: [
      { file: 'task-compass/page.tsx', reason: 'Central page with board state — easy to break column rendering', label: 'caution' },
      { file: 'globals.css', reason: 'Global styles affect all pages; custom-scrollbar used here', label: 'caution' },
    ],
    relevantFiles: [
      { file: 'app/(pages)/(main)/[orgShortId]/task-compass/page.tsx', reason: 'Contains the BoardView and all column logic', badge: 'UI' },
      { file: 'app/globals.css', reason: 'Custom scrollbar styles shared with columns', badge: 'config' },
      { file: 'package.json', reason: 'May need a DnD library (e.g. @dnd-kit)', badge: 'config' },
    ],
    entryPoints: [
      { target: 'BoardView()', reason: 'Start here — renders columns and maps tasks' },
      { target: 'BoardCard()', reason: 'The draggable unit; will need drag handle wiring' },
      { target: 'MOCK_TASKS', reason: 'Task data source — status field drives column placement' },
    ],
    ownership: [
      { name: 'SD', role: 'Primary developer for Task Compass frontend', type: 'owner' },
      { name: 'MK', role: 'Set up the app router and layouts', type: 'contributor' },
      { name: 'AC', role: 'Reviews all UI PRs before merge', type: 'reviewer' },
    ],
  },
  'NC-105': {
    area: 'Navigation / Sidebar',
    riskLevel: 'low',
    cautionAreas: [
      { file: 'app/components/Sidebar.tsx', reason: 'Sidebar is shared across all pages — regressions affect everything', label: 'caution' },
    ],
    relevantFiles: [
      { file: 'app/components/Sidebar.tsx', reason: 'Renders the nav items and active state logic', badge: 'UI' },
      { file: 'app/(pages)/(main)/layout.tsx', reason: 'Wraps all main pages; passes route context to sidebar', badge: 'core' },
    ],
    entryPoints: [
      { target: 'Sidebar component', reason: 'Contains the active-link comparison logic' },
      { target: 'usePathname()', reason: 'Next.js hook that provides current route — likely source of mismatch' },
    ],
    ownership: [
      { name: 'JD', role: 'Investigating this bug', type: 'owner' },
      { name: 'MK', role: 'Built the original sidebar layout', type: 'contributor' },
    ],
  },
  'NC-106': {
    area: 'Theme / Settings',
    riskLevel: 'low',
    cautionAreas: [
      { file: 'app/globals.css', reason: 'CSS custom properties drive the theme — changes cascade globally', label: 'caution' },
    ],
    relevantFiles: [
      { file: 'app/globals.css', reason: 'Where --color-primary and dark tokens are defined', badge: 'config' },
      { file: 'app/(pages)/settings/page.tsx', reason: 'Settings page where the toggle would live', badge: 'UI' },
      { file: 'tailwind.config.ts', reason: 'Dark mode strategy (class vs media) needs to match', badge: 'config' },
    ],
    entryPoints: [
      { target: 'globals.css :root', reason: 'See current CSS variable definitions' },
      { target: 'Settings page', reason: 'Where the toggle UI will be placed' },
    ],
    ownership: [
      { name: 'MK', role: 'Owns the design system tokens', type: 'owner' },
      { name: 'SD', role: 'Has context on current color usage', type: 'contributor' },
    ],
  },
  'NC-101': {
    area: 'Integrations / API',
    riskLevel: 'high',
    cautionAreas: [
      { file: 'neurocode-python/neurocode/routes/internal.py', reason: 'Internal routes handle auth tokens — must not be exposed', label: 'manual approval' },
      { file: '.env', reason: 'Will hold Jira API keys — never commit secrets', label: 'manual approval' },
      { file: 'neurocode-python/neurocode/config.py', reason: 'Central config — wrong defaults break all services', label: 'caution' },
    ],
    relevantFiles: [
      { file: 'neurocode-python/neurocode/main.py', reason: 'FastAPI app entrypoint — register new routes here', badge: 'core' },
      { file: 'neurocode-python/neurocode/routes/internal.py', reason: 'Pattern reference for authenticated internal routes', badge: 'route' },
      { file: 'neurocode-python/neurocode/config.py', reason: 'Environment variable loading and service config', badge: 'config' },
      { file: 'neurocode-python/neurocode/models/schemas.py', reason: 'Pydantic models for request/response validation', badge: 'schema' },
      { file: 'app/(pages)/(main)/[orgShortId]/task-compass/page.tsx', reason: 'Frontend consumer that will call the new endpoints', badge: 'UI' },
    ],
    entryPoints: [
      { target: 'neurocode-python/neurocode/main.py', reason: 'See how existing routers are mounted' },
      { target: 'routes/internal.py', reason: 'Copy this pattern for a new jira.py route module' },
      { target: 'models/schemas.py', reason: 'Define Jira payload shapes here first' },
    ],
    ownership: [
      { name: 'AC', role: 'Leading the integration effort', type: 'owner' },
      { name: 'SD', role: 'Will wire the frontend once endpoints exist', type: 'contributor' },
      { name: 'JD', role: 'Security review required for external API access', type: 'reviewer' },
    ],
  },
  'NC-102': {
    area: 'Task Compass UI',
    riskLevel: 'low',
    cautionAreas: [
      { file: 'task-compass/page.tsx', reason: 'Large file — keep empty state components isolated', label: 'caution' },
    ],
    relevantFiles: [
      { file: 'app/(pages)/(main)/[orgShortId]/task-compass/page.tsx', reason: 'All three tab views live here', badge: 'UI' },
      { file: 'app/globals.css', reason: 'Border and color tokens used for empty states', badge: 'config' },
    ],
    entryPoints: [
      { target: 'MainView()', reason: 'Already has the empty-state pattern to extend' },
      { target: 'BoardView()', reason: 'Column empty state ("No tasks") is another location' },
    ],
    ownership: [
      { name: 'MK', role: 'Designing the empty state visuals', type: 'owner' },
      { name: 'SD', role: 'Implements the UI components', type: 'contributor' },
    ],
  },
  'NC-99': {
    area: 'Infrastructure / CDN',
    riskLevel: 'medium',
    cautionAreas: [
      { file: 'neurocode-python/neurocode/services/storage/s3_service.py', reason: 'S3 credentials and bucket config — incorrect changes cause data loss', label: 'manual approval' },
      { file: 'neurocode-python/neurocode/services/storage/storage.py', reason: 'Abstraction layer — changing interface breaks all consumers', label: 'caution' },
    ],
    relevantFiles: [
      { file: 'neurocode-python/neurocode/services/storage/s3_service.py', reason: 'Current S3 upload/download logic for assets', badge: 'service' },
      { file: 'neurocode-python/neurocode/services/storage/storage.py', reason: 'Storage abstraction used across the codebase', badge: 'core' },
      { file: 'neurocode-python/neurocode/config.py', reason: 'CDN URL and bucket names are configured here', badge: 'config' },
    ],
    entryPoints: [
      { target: 'storage.py', reason: 'Understand the storage interface before touching S3 logic' },
      { target: 's3_service.py', reason: 'Actual upload implementation that needs CDN URL rewrite' },
    ],
    ownership: [
      { name: 'SD', role: 'Handling the migration', type: 'owner' },
      { name: 'AC', role: 'Owns the infrastructure config', type: 'reviewer' },
    ],
  },
  'NC-95': {
    area: 'Hot Zones / Performance',
    riskLevel: 'high',
    cautionAreas: [
      { file: 'hot-zones/components/HotZonesDashboard.tsx', reason: '615-line component — memory leak likely in useEffect or event listeners', label: 'caution' },
      { file: 'neurocode-python/neurocode/routes/hot_zones.py', reason: 'If the leak is data-side, large payloads here amplify the problem', label: 'caution' },
    ],
    relevantFiles: [
      { file: 'app/(pages)/(main)/[orgShortId]/hot-zones/components/HotZonesDashboard.tsx', reason: 'Primary suspect — large component with complex state', badge: 'UI' },
      { file: 'neurocode-python/neurocode/routes/hot_zones.py', reason: 'API endpoint returning hot zone data', badge: 'route' },
      { file: 'neurocode-python/neurocode/services/analysis/code_analyzer.py', reason: 'Analysis service that feeds the dashboard', badge: 'service' },
    ],
    entryPoints: [
      { target: 'HotZonesDashboard.tsx useEffect blocks', reason: 'Check for missing cleanup functions and stale closures' },
      { target: 'Browser DevTools → Memory tab', reason: 'Take heap snapshots before and after navigation' },
    ],
    ownership: [
      { name: 'JD', role: 'Investigating the memory leak', type: 'owner' },
      { name: 'SD', role: 'Built the original dashboard component', type: 'contributor' },
      { name: 'MK', role: 'QA — will verify the fix on staging', type: 'reviewer' },
    ],
  },
  'NC-92': {
    area: 'Documentation / API',
    riskLevel: 'low',
    cautionAreas: [
      { file: 'neurocode-python/neurocode/routes/', reason: 'Route docstrings are auto-extracted — keep them accurate', label: 'caution' },
    ],
    relevantFiles: [
      { file: 'neurocode-python/README.md', reason: 'Top-level docs that need updating', badge: 'config' },
      { file: 'neurocode-python/neurocode/routes/documentation.py', reason: 'Documentation generation route', badge: 'route' },
      { file: 'neurocode-python/DOCUMENTATION_JSON_EXAMPLE.json', reason: 'Reference for the expected output shape', badge: 'schema' },
      { file: 'neurocode-python/neurocode/services/config/documentation_schema.json', reason: 'JSON schema the docs must conform to', badge: 'schema' },
    ],
    entryPoints: [
      { target: 'README.md', reason: 'Start by reading what is already documented' },
      { target: 'routes/documentation.py', reason: 'See what the API actually returns today' },
    ],
    ownership: [
      { name: 'AC', role: 'Writing the updated docs', type: 'owner' },
      { name: 'SD', role: 'Implemented the v2 API changes being documented', type: 'contributor' },
    ],
  },
  'NC-110': {
    area: 'Integrations / Full-stack',
    riskLevel: 'high',
    cautionAreas: [
      { file: 'neurocode-python/neurocode/routes/internal.py', reason: 'Auth-gated routes — new endpoints must follow the same pattern', label: 'manual approval' },
      { file: 'neurocode-python/neurocode/services/storage/mongodb_service.py', reason: 'Task data will persist here — schema changes need migration plan', label: 'manual approval' },
      { file: '.env', reason: 'New env vars for Python service URL — do not commit secrets', label: 'caution' },
    ],
    relevantFiles: [
      { file: 'neurocode-python/neurocode/main.py', reason: 'FastAPI entrypoint — mount new task-sync router', badge: 'core' },
      { file: 'neurocode-python/neurocode/routes/internal.py', reason: 'Auth pattern to replicate', badge: 'route' },
      { file: 'neurocode-python/neurocode/services/storage/mongodb_service.py', reason: 'Where synced tasks would be stored', badge: 'service' },
      { file: 'neurocode-python/neurocode/models/schemas.py', reason: 'Define task sync payload models', badge: 'schema' },
      { file: 'app/(pages)/(main)/[orgShortId]/task-compass/page.tsx', reason: 'Frontend that will fetch from the new endpoints', badge: 'UI' },
      { file: 'neurocode-python/neurocode/config.py', reason: 'Service URLs and feature flags', badge: 'config' },
    ],
    entryPoints: [
      { target: 'neurocode-python/neurocode/main.py', reason: 'Understand how routers are registered' },
      { target: 'models/schemas.py', reason: 'Define the Task data contract first' },
      { target: 'task-compass/page.tsx MOCK_TASKS', reason: 'See the shape the frontend already expects' },
    ],
    ownership: [
      { name: 'AC', role: 'Leading the integration — owns both backend endpoints and frontend wiring', type: 'owner' },
      { name: 'SD', role: 'Task Compass frontend — will consume the new API', type: 'contributor' },
      { name: 'JD', role: 'Security review for cross-service communication', type: 'reviewer' },
    ],
  },
};

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
                  {task.assignee}
                </span>
                <span>Demo user</span>
              </div>
            ) : (
              <span className="text-white/40">Unassigned (demo)</span>
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
        <button className="text-white/40 hover:text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-4 h-4" />
        </button>
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
            {task.assignee}
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
  onSelect,
  onClose,
}: {
  onSelect: (task: Task) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTasks = MOCK_TASKS.filter((t) => t.status !== 'completed');

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
                    {task.assignee}
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

function TaskCompassView({ task, onBack }: { task: Task; onBack: () => void }) {
  const ctx = COMPASS_DATA[task.id];

  return (
    <div className="flex flex-col h-[calc(100vh-220px)]">
      {/* Header bar */}
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-md border border-[#333] bg-[#1a1a1a] px-3 py-1.5 text-sm text-white/60 hover:border-[var(--color-primary)]/40 hover:text-white/90 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/40 font-medium">{task.id}</span>
          <span className="text-white/70">{task.title}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 space-y-5">
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
                <div className="space-y-2">
                  {ctx.ownership.map((person, i) => {
                    const typeColors: Record<string, string> = {
                      owner: 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border-[var(--color-primary)]/25',
                      contributor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                      reviewer: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    };
                    return (
                      <div key={i} className="flex items-center gap-3 rounded-md border border-[#1e1e1e] bg-[#171717] px-3 py-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] border border-[#333] text-xs font-bold text-white/60">
                          {person.name}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-white/40 leading-relaxed">{person.role}</p>
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
      </div>
    </div>
  );
}

function MainView() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (selectedTask) {
    return (
      <TaskCompassView
        task={selectedTask}
        onBack={() => setSelectedTask(null)}
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

function BoardView() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  return (
    <div className="flex h-[calc(100vh-220px)] gap-4 overflow-x-auto pb-4 pt-2 -mx-4 px-4 custom-scrollbar">
      {COLUMNS.map((col) => {
        const columnTasks = MOCK_TASKS.filter((t) => t.status === col.id);

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

export default function TaskCompassPage({ params }: PageProps) {
  const [activeTab, setActiveTab] = useState<TabId>('board');

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
        {activeTab === 'main' && <MainView />}
        {activeTab === 'board' && <BoardView />}
        {activeTab === 'timeline' && <div className="text-white/60 text-sm">Timeline content</div>}
      </div>
    </div>
  );
}
