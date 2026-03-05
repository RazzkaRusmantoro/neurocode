/**
 * Onboarding path progress per org (localStorage).
 * Keys: started | completed. Completed when user passes the path quiz.
 */

const STORAGE_PREFIX = 'onboarding_progress_';

export type PathProgressStatus = 'started' | 'completed';

export interface PathProgress {
  status: PathProgressStatus;
  completedAt?: string; // ISO date
  quizScore?: number;  // e.g. 3/5
}

export type OnboardingProgress = Record<string, PathProgress>;

export function getProgressKey(orgShortId: string): string {
  return `${STORAGE_PREFIX}${orgShortId}`;
}

export function getOnboardingProgress(orgShortId: string): OnboardingProgress {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(getProgressKey(orgShortId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as OnboardingProgress;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function setPathProgress(
  orgShortId: string,
  pathId: string,
  progress: PathProgress
): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getOnboardingProgress(orgShortId);
    const next = { ...current, [pathId]: progress };
    localStorage.setItem(getProgressKey(orgShortId), JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function getPathProgress(
  orgShortId: string,
  pathId: string
): PathProgress | null {
  return getOnboardingProgress(orgShortId)[pathId] ?? null;
}
