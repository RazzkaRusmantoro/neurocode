'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import TextInput from '@/app/components/TextInput';
import Chatbot from '@/app/components/Chatbot';
import OnboardingResultPage from './OnboardingResultPage';

const DETAIL_OPTIONS = [
  { value: 'High Level', label: 'High Level' },
  { value: 'Technical', label: 'Technical' },
  { value: 'Balanced', label: 'Balanced' },
] as const;

type DetailPreference = (typeof DETAIL_OPTIONS)[number]['value'];

export type OnboardingPlan = {
  id: string;
  developerName: string;
  role: string;
  experience: string;
  duration: string;
  detailPreference: string;
  generatedAt: string;
};

const PLAN_STORAGE_PREFIX = 'neurocode_onboarding_plan_';

/** TODO: Replace with backend fetch by planId */
function getStoredPlanById(planId: string | null): OnboardingPlan | null {
  if (typeof window === 'undefined' || !planId) return null;
  try {
    const raw = sessionStorage.getItem(`${PLAN_STORAGE_PREFIX}${planId}`);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingPlan;
  } catch {
    return null;
  }
}

function storePlan(plan: OnboardingPlan): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`${PLAN_STORAGE_PREFIX}${plan.id}`, JSON.stringify(plan));
}

export default function OnboardingPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const orgShortId = params?.orgShortId as string | undefined;
  const planId = searchParams.get('planId');

  const plan = useMemo(() => getStoredPlanById(planId), [planId]);

  const [developerName, setDeveloperName] = useState('');
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState('');
  const [duration, setDuration] = useState('');
  const [detailPreference, setDetailPreference] = useState<DetailPreference>('High Level');

  if (planId != null && planId !== '') {
    return <OnboardingResultPage plan={plan} />;
  }

  const requiredFilled =
    developerName.trim() !== '' &&
    role.trim() !== '' &&
    experience.trim() !== '' &&
    duration.trim() !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requiredFilled || !orgShortId) return;

    const mockPlan: OnboardingPlan = {
      id: Date.now().toString(),
      developerName: developerName.trim(),
      role: role.trim(),
      experience: experience.trim(),
      duration: duration.trim(),
      detailPreference,
      generatedAt: new Date().toISOString(),
    };

    storePlan(mockPlan);

    const path = orgShortId?.startsWith('org-') ? orgShortId : `org-${orgShortId}`;
    router.push(`/${path}/onboarding?planId=${mockPlan.id}`);
  };

  return (
    <>
      <div className="mx-auto max-w-screen-2xl">
        <div className="min-h-full py-10 text-white">
          <div className="max-w-[650px] mx-auto">
            <h1 className="text-3xl font-bold text-white text-center mb-10">
              Create an onboarding plan
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <TextInput
                label="Developer Name"
                value={developerName}
                onChange={(e) => setDeveloperName(e.target.value)}
                placeholder="e.g. Mahwan"
                required
              />
              <TextInput
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Backend Engineer"
                required
              />
              <TextInput
                label="Experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. Junior"
                required
              />
              <TextInput
                label="Duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 3 Weeks"
                required
              />

              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">
                  Detail Preference
                </label>
                <div className="flex flex-wrap gap-4">
                  {DETAIL_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="detailPreference"
                        value={opt.value}
                        checked={detailPreference === opt.value}
                        onChange={() => setDetailPreference(opt.value)}
                        className="border-[#424242] bg-[#121215] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      />
                      <span className="text-sm text-white/80">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4 sm:pt-2">
                <button
                  type="submit"
                  disabled={!requiredFilled}
                  className="w-full sm:w-auto px-5 py-2.5 rounded bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors"
                >
                  Generate Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Chatbot />
    </>
  );
}
