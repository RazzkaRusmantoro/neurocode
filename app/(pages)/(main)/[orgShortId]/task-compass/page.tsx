'use client';

import { useState } from 'react';
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
  ArrowDown
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
}

const COLUMNS: { id: Status; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'to-test', title: 'To Test' },
  { id: 'completed', title: 'Completed' },
];

const MOCK_TASKS: Task[] = [
  { id: 'NC-104', title: 'Implement Kanban board drag and drop', type: 'story', priority: 'high', status: 'backlog', points: 5, assignee: 'SD' },
  { id: 'NC-105', title: 'Fix navigation active state bug', type: 'bug', priority: 'high', status: 'backlog', assignee: 'JD' },
  { id: 'NC-106', title: 'Add dark mode toggle', type: 'task', priority: 'medium', status: 'backlog', points: 2 },
  { id: 'NC-101', title: 'Set up Jira integration API endpoints', type: 'story', priority: 'high', status: 'todo', points: 8, assignee: 'AC' },
  { id: 'NC-102', title: 'Design new Task Compass empty states', type: 'task', priority: 'medium', status: 'todo', points: 3, assignee: 'MK' },
  { id: 'NC-99', title: 'Migrate user avatars to new CDN', type: 'story', priority: 'medium', status: 'in-progress', points: 5, assignee: 'SD' },
  { id: 'NC-95', title: 'Memory leak in hot zones dashboard', type: 'bug', priority: 'high', status: 'to-test', assignee: 'JD' },
  { id: 'NC-92', title: 'Update documentation for API v2', type: 'task', priority: 'low', status: 'to-test', points: 2, assignee: 'AC' },
  { id: 'NC-88', title: 'Initial setup of Next.js app router', type: 'story', priority: 'high', status: 'completed', points: 13, assignee: 'MK' },
];

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

function BoardCard({ task }: { task: Task }) {
  return (
    <div className="bg-[#262626] border border-[#333] hover:border-[var(--color-primary)]/50 hover:bg-[#2a2a2a] transition-colors rounded-md p-3 shadow-sm cursor-grab active:cursor-grabbing group">
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
    </div>
  );
}

function BoardView() {
  return (
    <div className="flex h-[calc(100vh-220px)] gap-4 overflow-x-auto pb-4 pt-2 -mx-4 px-4 custom-scrollbar">
      {COLUMNS.map((col) => {
        const columnTasks = MOCK_TASKS.filter(t => t.status === col.id);
        
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
              {columnTasks.map(task => (
                <BoardCard key={task.id} task={task} />
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
        {activeTab === 'main' && <div className="text-white/60 text-sm">Main content</div>}
        {activeTab === 'board' && <BoardView />}
        {activeTab === 'timeline' && <div className="text-white/60 text-sm">Timeline content</div>}
      </div>
    </div>
  );
}
