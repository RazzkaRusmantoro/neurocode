'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import type { OnboardingPlan } from './page';

const MENTOR_CHECK_IN = 'Monday 3PM';

const MILESTONES = [
  { week: 'Week 1', title: 'Environment & Architecture' },
  { week: 'Week 2', title: 'Core Services & APIs' },
  { week: 'Week 3', title: 'First Contribution' },
];

const MODULES = [
  { id: 1, title: 'Backend Architecture Overview', estimatedTime: '3–4 hrs', docs: ['System Architecture (High-Level)', 'Service Interaction Diagram'] },
  { id: 2, title: 'Codebase Deep Dive', estimatedTime: '4–6 hrs', docs: ['Backend Code Structure', 'Controllers & Services Walkthrough'] },
  { id: 3, title: 'Environment Setup', estimatedTime: '2 hrs', docs: ['Local Setup Guide', 'Troubleshooting Guide'] },
];

const TIMELINE_DAYS = [
  { id: 1, day: 1, title: 'Environment Setup', outcome: 'Run backend locally', tasks: ['Install dependencies', 'Configure environment variables', 'Start local server'] },
  { id: 2, day: 2, title: 'Architecture Overview', outcome: 'Understand system flow', tasks: ['Review architecture document', 'Study service interaction diagram'] },
  { id: 3, day: 3, title: 'Codebase Navigation', outcome: 'Navigate repo independently', tasks: ['Identify core directories', 'Understand controller-service pattern'] },
  { id: 4, day: 4, title: 'Core Services', outcome: 'Understand main APIs', tasks: ['Explore authentication service', 'Review database schema'] },
  { id: 5, day: 5, title: 'First Contribution', outcome: 'Submit first PR', tasks: ['Fix small bug', 'Add basic logging improvement'] },
];

const SUCCESS_CRITERIA = [
  'Can run backend independently',
  'Understands service interaction flow',
  'Can explain controller-service architecture',
  'Completed first pull request',
  'Successfully deployed to staging',
];

const TOTAL_ITEMS = MODULES.length + TIMELINE_DAYS.length + SUCCESS_CRITERIA.length;

interface OnboardingResultPageProps {
  plan: OnboardingPlan | null;
}

export default function OnboardingResultPage({ plan }: OnboardingResultPageProps) {
  const { data: session } = useSession();
  const mentorName = session?.user?.name ?? 'You';

  const [moduleCompletion, setModuleCompletion] = useState<boolean[]>([false, false, false]);
  const [timelineCompletion, setTimelineCompletion] = useState<boolean[]>([false, false, false, false, false]);
  const [successCriteriaCompletion, setSuccessCriteriaCompletion] = useState<boolean[]>([false, false, false, false, false]);
  const [moduleExpanded, setModuleExpanded] = useState<boolean[]>([false, false, false]);

  if (!plan) {
    return (
      <div className="mx-auto max-w-screen-2xl">
        <div className="min-h-full py-10 text-white">
          <div className="max-w-[650px] mx-auto text-center">
            <p className="text-lg text-white/80">Plan not found.</p>
          </div>
        </div>
      </div>
    );
  }

  const header = {
    name: plan.developerName,
    role: plan.role,
    experienceLevel: plan.experience,
    duration: plan.duration,
    detailPreference: plan.detailPreference,
  };

  const completed =
    moduleCompletion.filter(Boolean).length +
    timelineCompletion.filter(Boolean).length +
    successCriteriaCompletion.filter(Boolean).length;
  const progress = Math.round((completed / TOTAL_ITEMS) * 100);

  const toggleModule = (i: number) => {
    setModuleCompletion((prev) => { const n = [...prev]; n[i] = !n[i]; return n; });
  };
  const toggleModuleExpanded = (i: number) => {
    setModuleExpanded((prev) => { const n = [...prev]; n[i] = !n[i]; return n; });
  };
  const toggleTimeline = (i: number) => {
    setTimelineCompletion((prev) => { const n = [...prev]; n[i] = !n[i]; return n; });
  };
  const toggleSuccessCriteria = (i: number) => {
    setSuccessCriteriaCompletion((prev) => { const n = [...prev]; n[i] = !n[i]; return n; });
  };

  return (
    <div className="mx-auto max-w-screen-2xl">
      <div className="min-h-full py-10 text-white">
        <div className="space-y-8 max-w-4xl mx-auto">
          <section className="bg-[#171717]/50 border border-[#262626] rounded-xl p-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-6">Hi {header.name}!</h1>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/70">
              <span><span className="text-white/50">Role:</span> {header.role}</span>
              <span><span className="text-white/50">Experience Level:</span> {header.experienceLevel}</span>
              <span><span className="text-white/50">Duration:</span> {header.duration}</span>
              <span><span className="text-white/50">Detail Preference:</span> {header.detailPreference}</span>
            </div>
          </section>

          <section className="bg-[#171717]/50 border border-[#262626] rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white mb-2">{progress}% Complete</p>
                <div className="h-2 bg-[#262626] rounded-full overflow-hidden">
                  <div className="h-full bg-[#FF8D28] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-white/70 shrink-0">
                <span><span className="text-white/50">Mentor:</span> {mentorName}</span>
                <span><span className="text-white/50">Weekly Check-in:</span> {MENTOR_CHECK_IN}</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Milestones</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 md:flex-row md:flex-wrap md:overflow-visible">
              {MILESTONES.map((m, i) => (
                <div key={i} className="flex-shrink-0 w-[280px] md:w-auto md:flex-1 min-w-0 bg-[#171717]/50 border border-[#262626] rounded-xl p-5">
                  <p className="text-xs font-medium text-[#FF8D28] mb-1">Milestone {i + 1}</p>
                  <p className="text-sm text-white/60 mb-1">{m.week}</p>
                  <p className="text-base font-medium text-white">{m.title}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Onboarding Modules</h2>
              <div className="bg-[#171717]/50 border border-[#262626] rounded-xl overflow-hidden max-h-[420px] overflow-y-auto">
                <div className="divide-y divide-[#262626]">
                  {MODULES.map((mod, i) => (
                    <div key={mod.id}>
                      <div className="flex items-center justify-between gap-3 p-5">
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleModuleExpanded(i)} onKeyDown={(e) => e.key === 'Enter' && toggleModuleExpanded(i)} role="button" tabIndex={0} aria-expanded={moduleExpanded[i]}>
                          <p className="text-sm font-medium text-[#FF8D28]">{mod.title}</p>
                          <p className="text-xs text-white/50 mt-0.5">Estimated Time: {mod.estimatedTime}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button type="button" onClick={() => toggleModule(i)} className="py-1.5 px-3 rounded-lg text-xs font-medium border border-[#3f3f46] text-white/80 hover:text-white hover:border-[#FF8D28] hover:bg-[#FF8D28]/10 transition-colors">
                            {moduleCompletion[i] ? 'Done' : 'Mark complete'}
                          </button>
                          <button type="button" onClick={() => toggleModuleExpanded(i)} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors text-sm" aria-label={moduleExpanded[i] ? 'Collapse' : 'Expand'}>
                            {moduleExpanded[i] ? '−' : '+'}
                          </button>
                        </div>
                      </div>
                      {moduleExpanded[i] && (
                        <div className="px-5 pb-5 pt-0 border-t border-[#262626]">
                          <p className="text-xs text-white/50 mb-2">Docs:</p>
                          <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
                            {mod.docs.map((doc, j) => (<li key={j}>{doc}</li>))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Timeline</h2>
              <div className="bg-[#171717]/50 border border-[#262626] rounded-xl overflow-hidden max-h-[420px] overflow-y-auto">
                <div className="divide-y divide-[#262626]">
                  {TIMELINE_DAYS.map((day, i) => (
                    <div key={day.id} className="p-5">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className="text-sm font-medium text-[#FF8D28]">Day {day.day} – {day.title}</p>
                        <button type="button" onClick={() => toggleTimeline(i)} className="shrink-0 py-1.5 px-3 rounded-lg text-xs font-medium border border-[#3f3f46] text-white/80 hover:text-white hover:border-[#FF8D28] hover:bg-[#FF8D28]/10 transition-colors">
                          {timelineCompletion[i] ? 'Done' : 'Mark complete'}
                        </button>
                      </div>
                      <p className="text-xs text-white/60 mb-2">Outcome: {day.outcome}</p>
                      <ul className="text-sm text-white/70 list-disc list-inside space-y-1">
                        {day.tasks.map((task, j) => (<li key={j}>{task}</li>))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Success Criteria</h2>
            <div className="bg-[#171717]/50 border border-[#262626] rounded-xl p-5">
              <ul className="space-y-3">
                {SUCCESS_CRITERIA.map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <input type="checkbox" checked={successCriteriaCompletion[i]} onChange={() => toggleSuccessCriteria(i)} className="rounded border-[#424242] bg-[#121215] text-[#FF8D28] focus:ring-[#FF8D28]" />
                    <span className="text-sm text-white/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="flex justify-center gap-4 pt-4">
            <button type="button" className="px-5 py-2.5 rounded-full border border-[#3f3f46] text-sm font-medium text-white/80 hover:text-white hover:border-[#FF8D28] hover:bg-[#FF8D28]/10 transition-colors">Edit</button>
            <button type="button" className="px-5 py-2.5 rounded-full bg-[#FF8D28] hover:bg-[#FFA94D] text-sm font-semibold text-white transition-colors">Export</button>
          </section>
        </div>
      </div>
    </div>
  );
}
