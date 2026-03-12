'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  getTaskCompassResultsForAssignedTasks,
} from '@/lib/task_compass_storage';
import { getOnboardingProgress } from '@/lib/onboarding/progress';
import { slugify } from '@/lib/utils/slug';

const ACCENT = 'var(--color-primary)';

// Impact activity (Last 7 Days) – same chart as before; data can be replaced when backend provides it
const IMPACT_DATA = [
  { day: 'Mon', score: 20, reason: 'AuthService + PaymentService updated' },
  { day: 'Tue', score: 35, reason: 'API gateway config changed' },
  { day: 'Wed', score: 60, reason: 'AuthService + PaymentService updated' },
  { day: 'Thu', score: 40, reason: 'Database migrations merged' },
  { day: 'Fri', score: 75, reason: 'AuthService + PaymentService updated' },
  { day: 'Sat', score: 30, reason: 'Minor dependency bumps' },
  { day: 'Sun', score: 50, reason: 'AuthService + PaymentService updated' },
];

function ImpactChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: (typeof IMPACT_DATA)[0] }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-[#212121] border border-[#424242] rounded p-3 shadow-lg">
      <p className="text-white/60 text-xs mb-1">{p.day}</p>
      <p className="text-white font-semibold">
        Impact score: <span style={{ color: ACCENT }}>{p.score}</span>
      </p>
      <p className="text-white/70 text-xs mt-1">{p.reason}</p>
    </div>
  );
}

function ActivityBadge({ level }: { level: 'Stable' | 'Moderate Activity' | 'High Activity' }) {
  const styles =
    level === 'High Activity'
      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      : level === 'Moderate Activity'
        ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-[var(--color-primary)]/30'
        : 'bg-white/10 text-white/80 border-[#262626]';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border ${styles}`}>
      {level}
    </span>
  );
}

function CautionBadge({ label }: { label: string }) {
  const isManual = label === 'manual approval';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border ${
        isManual ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      }`}
    >
      {label}
    </span>
  );
}

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const orgSegment = (params?.orgShortId as string) || '';
  const orgShortId = orgSegment.replace(/^org-/, '') || orgSegment;

  const [assignedTaskResults, setAssignedTaskResults] = useState<
    ReturnType<typeof getTaskCompassResultsForAssignedTasks>
  >([]);

  interface OnboardingPathItem {
    id: string;
    title: string;
    summaryDescription: string;
    modules: { id: string; name: string; summaryDescription: string; order: number }[];
  }
  const [onboardingPaths, setOnboardingPaths] = useState<OnboardingPathItem[]>([]);
  const [onboardingProgress, setOnboardingProgress] = useState<Record<string, { status: string; completedAt?: string }>>({});
  const [onboardingLoading, setOnboardingLoading] = useState(true);

  useEffect(() => {
    setAssignedTaskResults(getTaskCompassResultsForAssignedTasks(orgShortId));
  }, [orgShortId]);

  useEffect(() => {
    if (!orgShortId) return;
    setOnboardingProgress(getOnboardingProgress(orgShortId));
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    fetch(`${base}/api/organizations/${orgSegment}/onboarding/generated-paths`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { pathIds: [] }))
      .then((data) => {
        const pathIds: string[] = data.pathIds ?? [];
        if (pathIds.length === 0) {
          setOnboardingPaths([]);
          setOnboardingLoading(false);
          return;
        }
        return fetch(`${base}/api/organizations/${orgSegment}/onboarding/suggested-paths`, { credentials: 'include' })
          .then((r) => (r.ok ? r.json() : { paths: [] }))
          .then((suggested) => {
            const paths: OnboardingPathItem[] = (suggested.paths ?? []).filter((p: OnboardingPathItem) =>
              pathIds.includes(p.id)
            );
            setOnboardingPaths(paths);
          });
      })
      .catch(() => setOnboardingPaths([]))
      .finally(() => setOnboardingLoading(false));
  }, [orgShortId, orgSegment]);

  useEffect(() => {
    if (!orgShortId) return;
    const onFocus = () => setOnboardingProgress(getOnboardingProgress(orgShortId));
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [orgShortId]);

  const allCautionAreas = assignedTaskResults.flatMap((r) =>
    (r.cautionAreas ?? []).map((c) => ({ ...c, _taskTitle: r.taskTitle }))
  );
  const seenCautionFiles = new Set<string>();
  const cautionAreasDeduped = allCautionAreas.filter((c) => {
    if (seenCautionFiles.has(c.file)) return false;
    seenCautionFiles.add(c.file);
    return true;
  });
  const hasAlerts = cautionAreasDeduped.length > 0;

  const totalRelevantFiles = assignedTaskResults.reduce(
    (sum, r) => sum + (r.relevantFiles?.length ?? 0),
    0
  );
  const activityLevel: 'Stable' | 'Moderate Activity' | 'High Activity' =
    totalRelevantFiles >= 6 ? 'High Activity' : totalRelevantFiles >= 1 ? 'Moderate Activity' : 'Stable';

  const TOP_FILES_PER_TASK = 5;

  return (
    <div className="mx-auto max-w-screen-2xl pb-24">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Home</h1>
          <p className="text-white/60">AI-powered insights based on your current work</p>
        </div>
        <div className="flex items-center gap-3">
          <ActivityBadge level={activityLevel} />
        </div>
      </div>

      {/* Impact Activity (Last 7 Days) – same line chart as original */}
      <section className="mb-8">
        <div className="bg-[#262626]/50 border border-[#262626] rounded p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-1">Impact Activity</h3>
            <p className="text-sm text-white/50">Trend of changes affecting your assigned features</p>
          </div>
          <div className="w-full h-[240px] -mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={IMPACT_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis
                  dataKey="day"
                  stroke="#666"
                  fontSize={10}
                  tick={{ fill: '#666' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#666"
                  fontSize={10}
                  tick={{ fill: '#666' }}
                  tickFormatter={(v) => String(v)}
                  width={32}
                  tickMargin={5}
                />
                <Tooltip content={<ImpactChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={ACCENT}
                  strokeWidth={2}
                  dot={{ fill: ACCENT, r: 3, strokeWidth: 2, stroke: '#121215' }}
                  activeDot={{ r: 5, fill: ACCENT }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Onboarding – where you left off, progress, and next steps */}
      <section className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Onboarding</h3>
            <p className="text-sm text-white/50">
              Your learning paths and progress.
            </p>
          </div>
          {onboardingPaths.length > 0 && (
            <button
              type="button"
              onClick={() => router.push(`/${orgSegment}/onboarding`)}
              className="shrink-0 py-2 px-4 rounded text-sm font-medium bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white transition-colors"
            >
              View all in Onboarding
            </button>
          )}
        </div>
        <div className="bg-[#262626]/50 border border-[#262626] rounded overflow-hidden">
          {onboardingLoading ? (
            <div className="py-10 px-6 text-center text-sm text-white/50">Loading…</div>
          ) : onboardingPaths.length === 0 ? (
            <div className="py-10 px-6 text-center">
              <p className="text-sm text-white/50 mb-4">No onboarding paths available yet.</p>
              <button
                type="button"
                onClick={() => router.push(`/${orgSegment}/onboarding`)}
                className="py-2 px-4 rounded text-sm font-medium bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white transition-colors"
              >
                Go to Onboarding
              </button>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {(() => {
                const inProgress = onboardingPaths.filter((p) => onboardingProgress[p.id]?.status === 'started');
                const completed = onboardingPaths.filter((p) => onboardingProgress[p.id]?.status === 'completed');
                const notStarted = onboardingPaths.filter((p) => !onboardingProgress[p.id]?.status);
                const completedCount = completed.length;
                const totalCount = onboardingPaths.length;
                const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                return (
                  <>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="text-white/70">
                        <span className="font-semibold text-white">{completedCount}</span> of {totalCount} paths completed
                      </span>
                      <div className="flex-1 min-w-[120px] max-w-[200px] h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {inProgress.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-white/90 mb-2">Continue where you left off</h4>
                        <div className="space-y-2">
                          {inProgress.slice(0, 2).map((path) => (
                            <div
                              key={path.id}
                              className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-[#1a1a1a] border border-[#333]"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-white truncate">{path.title}</p>
                                <p className="text-xs text-white/50 mt-0.5">{path.modules?.length ?? 0} modules</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => router.push(`/${orgSegment}/onboarding/${slugify(path.title)}`)}
                                className="shrink-0 py-2 px-4 rounded text-sm font-medium bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white transition-colors"
                              >
                                Continue
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {notStarted.length > 0 && (inProgress.length === 0 || notStarted.length > 0) && (
                      <div>
                        <h4 className="text-sm font-semibold text-white/90 mb-2">
                          {inProgress.length > 0 ? 'Start next' : 'Recommended'}
                        </h4>
                        <div className="space-y-2">
                          {notStarted.slice(0, 2).map((path) => (
                            <div
                              key={path.id}
                              className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-[#1a1a1a] border border-[#333]"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-white truncate">{path.title}</p>
                                <p className="text-xs text-white/50 mt-0.5 line-clamp-1">{path.summaryDescription}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => router.push(`/${orgSegment}/onboarding/${slugify(path.title)}`)}
                                className="shrink-0 py-2 px-4 rounded text-sm font-medium border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
                              >
                                Start
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {completedCount === totalCount && totalCount > 0 && (
                      <p className="text-sm text-white/50">You’ve completed all available paths.</p>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </section>

      {/* Needs your attention – only when there are real alerts (from your assigned tasks) */}
      {hasAlerts && (
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Needs Your Attention</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cautionAreasDeduped.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#262626]/50 border border-[#262626] rounded p-6 flex flex-col"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="text-base font-bold text-white font-mono text-sm truncate">{item.file}</h4>
                  <CautionBadge label={item.label} />
                </div>
                <p className="text-sm text-white/70 mb-4 line-clamp-2">{item.reason}</p>
                <button
                  type="button"
                  className="mt-auto w-fit py-2 px-4 rounded text-sm font-medium bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white transition-colors"
                  onClick={() => router.push(`/${orgSegment}/task-compass`)}
                >
                  View in Task Compass
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent changes relevant to you – grouped by task, top files ranked, View all */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Recent Changes Relevant to You</h3>
            <p className="text-sm text-white/50">
              Top relevant files by task (from Task Compass).
            </p>
          </div>
          {assignedTaskResults.length > 0 && (
            <button
              type="button"
              onClick={() => router.push(`/${orgSegment}/task-compass`)}
              className="shrink-0 py-2 px-4 rounded text-sm font-medium bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white transition-colors"
            >
              View all in Task Compass
            </button>
          )}
        </div>
        <div className="bg-[#262626]/50 border border-[#262626] rounded overflow-hidden">
          {assignedTaskResults.length > 0 ? (
            <div className="divide-y divide-[#262626]">
              {assignedTaskResults.map((result) => {
                const files = (result.relevantFiles ?? []).slice(0, TOP_FILES_PER_TASK);
                const taskTitle = result.taskTitle || result.taskId || 'Task';
                const totalCount = result.relevantFiles?.length ?? 0;
                const hasMore = totalCount > TOP_FILES_PER_TASK;
                return (
                  <div key={result.taskId ?? taskTitle} className="p-6">
                    <h4 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
                      {taskTitle}
                      {totalCount > 0 && (
                        <span className="text-xs font-normal text-white/50">
                          ({files.length}{hasMore ? ` of ${totalCount}` : ''} files)
                        </span>
                      )}
                    </h4>
                    <ul className="space-y-2">
                      {files.map((row, idx) => (
                        <li
                          key={idx}
                          className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 px-3 rounded hover:bg-[#121215]/50 transition-colors"
                        >
                          <span className="text-[10px] font-medium text-white/40 w-5 shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="font-mono text-sm text-white font-medium">{row.file}</span>
                          <span className="text-sm text-white/60 flex-1 min-w-0 line-clamp-1">{row.reason}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/50 border border-[#262626] shrink-0">
                            {row.badge}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 px-6 text-center">
              <p className="text-sm text-white/50 mb-4">No task analyses yet.</p>
              <button
                type="button"
                onClick={() => router.push(`/${orgSegment}/task-compass`)}
                className="py-2 px-4 rounded text-sm font-medium bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white transition-colors"
              >
                Analyze a task in Task Compass
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
