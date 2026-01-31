import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="px-8 mx-auto max-w-7xl pt-20 pb-16">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
              <span className="px-4 py-2 rounded-full bg-[#171717]/50 border border-[#262626] text-white/70 text-sm">
                Secure & Private
              </span>
              <span className="px-4 py-2 rounded-full bg-[#171717]/50 border border-[#262626] text-white/70 text-sm">
                Free to Start
              </span>
              <span className="px-4 py-2 rounded-full bg-[#171717]/50 border border-[#262626] text-white/70 text-sm">
                Award Winning
              </span>
              <span className="px-4 py-2 rounded-full bg-[#171717]/50 border border-[#262626] text-white/70 text-sm">
                50M+ Generations
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl font-bold text-white leading-tight">
              Your Imagination,{" "}
              <span className="text-[#5C42CE]">
                Powered by AI
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-white/70 max-w-2xl">
              Create breathtaking images, videos, music, and voices with the world's most advanced AI. 
              From concept to reality in seconds.
            </p>

            {/* CTA Button */}
            <button className="mt-8 px-8 py-4 bg-[#171717] border border-[#262626] hover:bg-[#262626] text-white font-semibold rounded-xl cursor-pointer transition-all duration-300 flex items-center gap-3">
              <svg className="w-5 h-5 text-[#5C42CE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Explore AI Studio
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </section>


      </div>
    </>
  );
}
