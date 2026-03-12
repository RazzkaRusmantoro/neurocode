/**
 * Persist Task Compass analysis results per org so the dashboard can show
 * "Needs your attention" (caution areas) and "Recent changes relevant to you"
 * from tasks assigned to the current user.
 */

const STORAGE_PREFIX = 'neurocode_task_compass_';
const STORAGE_VERSION = 2;

export interface StoredCompassResult {
  taskId?: string;
  taskTitle?: string;
  area?: string;
  riskLevel?: string;
  cautionAreas: { file: string; reason: string; label: string }[];
  relevantFiles: { file: string; reason: string; badge: string }[];
  entryPoints?: { target: string; reason: string }[];
  analyzedAt: string; // ISO
}

interface StoredMap {
  version: number;
  results: Record<string, StoredCompassResult>;
}

function getStoredMap(orgShortId: string): StoredMap | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${orgShortId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version === STORAGE_VERSION && parsed?.results && typeof parsed.results === 'object') {
      return parsed as StoredMap;
    }
    if (Array.isArray(parsed?.relevantFiles)) {
      return {
        version: STORAGE_VERSION,
        results: { [parsed.taskId || 'default']: parsed as StoredCompassResult },
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** Returns the single most recent result (for backward compat / Task Compass re-use). */
export function getTaskCompassResult(orgShortId: string): StoredCompassResult | null {
  const map = getStoredMap(orgShortId);
  if (!map || !Object.keys(map.results).length) return null;
  const entries = Object.values(map.results);
  entries.sort((a, b) => (b.analyzedAt || '').localeCompare(a.analyzedAt || ''));
  return entries[0] ?? null;
}

/** Returns cached result for a specific task, or null if none. */
export function getTaskCompassResultForTask(
  orgShortId: string,
  taskId: string
): StoredCompassResult | null {
  const map = getStoredMap(orgShortId);
  if (!map?.results) return null;
  return map.results[taskId] ?? null;
}

/** Returns all stored results for tasks assigned to you (one per analyzed task). */
export function getTaskCompassResultsForAssignedTasks(orgShortId: string): StoredCompassResult[] {
  const map = getStoredMap(orgShortId);
  if (!map) return [];
  return Object.values(map.results).sort(
    (a, b) => (b.analyzedAt || '').localeCompare(a.analyzedAt || '')
  );
}

export function setTaskCompassResult(
  orgShortId: string,
  result: Omit<StoredCompassResult, 'analyzedAt'> & { analyzedAt?: string }
): void {
  if (typeof window === 'undefined') return;
  try {
    const stored: StoredCompassResult = {
      ...result,
      analyzedAt: result.analyzedAt ?? new Date().toISOString(),
    };
    const taskId = result.taskId || 'default';
    const existing = getStoredMap(orgShortId);
    const results: Record<string, StoredCompassResult> = existing?.results
      ? { ...existing.results, [taskId]: stored }
      : { [taskId]: stored };
    localStorage.setItem(
      `${STORAGE_PREFIX}${orgShortId}`,
      JSON.stringify({ version: STORAGE_VERSION, results })
    );
  } catch {
    // ignore
  }
}
