export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-screen-2xl">
      <div className="min-h-full py-10 text-white">
        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-[#262626] pb-3 mb-8">
          <button className="relative pb-2 text-sm font-medium text-white cursor-pointer">
            Compass
            <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[#7c3aed]" />
          </button>
          <button className="pb-2 text-sm font-medium text-white/60 hover:text-white transition-colors cursor-pointer">
            Tasks
          </button>
          <button className="pb-2 text-sm font-medium text-white/60 hover:text-white transition-colors cursor-pointer">
            Members
          </button>
        </div>

        <div className="space-y-10">
          {/* Hero card */}
          <section className="max-w-4xl">
            <button
              type="button"
              className="w-full bg-gradient-to-r from-[#251438] to-[#1b0f25] border border-[#2a2a2f] rounded-2xl px-8 py-7 shadow-[0_0_40px_rgba(15,23,42,0.6)] cursor-pointer transition-colors text-left hover:border-[#7c3aed]/70"
              aria-label="Open project context"
            >
              <div className="flex items-center justify-between gap-6">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">
                    View Project Context
                  </h1>
                  <p className="mt-2 text-sm text-white/70 leading-relaxed max-w-xl">
                    Get oriented and understand how your organisation works, how the
                    system fits together, and where everything lives before you start
                    making changes.
                  </p>
                </div>
                <div className="flex items-center justify-center text-[#a855f7] hover:text-[#c4b5fd] text-2xl font-semibold transition-colors">
                  <span className="leading-none">&rarr;</span>
                </div>
              </div>
            </button>
          </section>

          {/* List sections */}
          <section className="grid gap-6 max-w-4xl">
          {/* Task Compass */}
          <div className="flex items-center justify-between gap-8 border-b border-[#262626] pb-6">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Task Compass
              </h2>
              <p className="mt-2 text-sm text-white/65 max-w-2xl leading-relaxed">
                See all files and areas relevant to your assigned tasks, track recent
                changes, and understand who owns what.
              </p>
            </div>
            <button
              type="button"
              className="px-5 py-2.5 rounded-full border border-[#3f3f46] text-xs font-medium text-white/80 hover:text-white hover:border-[#7c3aed] hover:bg-[#7c3aed]/10 transition-colors cursor-pointer"
            >
              Open
            </button>
          </div>

          {/* Hot Zones */}
          <div className="flex items-center justify-between gap-8 border-b border-[#262626] pb-6">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Hot Zones
              </h2>
              <p className="mt-2 text-sm text-white/65 max-w-2xl leading-relaxed">
                Explore the most sensitive and high-impact parts of the codebase - 
                areas that change often, break easily, or require extra caution
                before touching.
              </p>
            </div>
            <button
              type="button"
              className="px-5 py-2.5 rounded-full border border-[#3f3f46] text-xs font-medium text-white/80 hover:text-white hover:border-[#7c3aed] hover:bg-[#7c3aed]/10 transition-colors cursor-pointer"
            >
              View
            </button>
          </div>

          {/* Personalized Guide */}
          <div className="flex items-center justify-between gap-8 pb-2">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Get a personalized Guide
              </h2>
              <p className="mt-2 text-sm text-white/65 max-w-2xl leading-relaxed">
                Generate a tailored onboarding plan based on your role, experience,
                current work, and the parts of the system you are most likely to
                interact with.
              </p>
            </div>
            <button
              type="button"
              className="px-5 py-2.5 rounded-full bg-[#7c3aed] hover:bg-[#8b5cf6] text-xs font-semibold text-white rounded-full shadow-lg shadow-[#7c3aed]/40 transition-colors cursor-pointer"
            >
              Start
            </button>
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}

