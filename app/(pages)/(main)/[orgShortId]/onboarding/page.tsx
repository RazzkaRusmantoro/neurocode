'use client';

import { useRouter, useParams } from 'next/navigation';
import Chatbot from '@/app/components/Chatbot';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useRef, useState, useEffect } from 'react';

// Mock data - replace with actual API calls
const LEARNING_PATH_TASKS = {
  waiting: [
    {
      id: 1,
      title: 'Understand Authentication Flow',
      description: 'Learn how user authentication works in the codebase',
      estimatedTime: '30 min',
      relatedFiles: ['AuthService.ts', 'LoginComponent.tsx'],
      difficulty: 'Beginner',
    },
    {
      id: 2,
      title: 'Explore API Gateway Structure',
      description: 'Understand the API routing and middleware setup',
      estimatedTime: '45 min',
      relatedFiles: ['api-gateway/config.ts', 'middleware.ts'],
      difficulty: 'Intermediate',
    },
    {
      id: 3,
      title: 'Review Database Schema',
      description: 'Get familiar with the data models and relationships',
      estimatedTime: '20 min',
      relatedFiles: ['models/User.ts', 'models/Organization.ts'],
      difficulty: 'Beginner',
    },
  ],
  inProgress: [
    {
      id: 4,
      title: 'Set Up Development Environment',
      description: 'Configure your local development setup',
      estimatedTime: '15 min',
      progress: 60,
      relatedFiles: ['README.md', '.env.example'],
      difficulty: 'Beginner',
      owner: {
        name: 'Alex Chen',
        role: 'Senior Developer',
        avatar: '👨‍💻',
      },
    },
    {
      id: 7,
      title: 'Understanding the Authentication System',
      description: 'Learn how user authentication works in the codebase',
      estimatedTime: '30 min',
      progress: 45,
      relatedFiles: ['AuthService.ts', 'LoginComponent.tsx'],
      difficulty: 'Intermediate',
      owner: {
        name: 'Sarah Johnson',
        role: 'Tech Lead',
        avatar: '👩‍💼',
      },
    },
    {
      id: 8,
      title: 'Mastering the API Gateway Architecture',
      description: 'Understand the API routing and middleware setup',
      estimatedTime: '45 min',
      progress: 30,
      relatedFiles: ['api-gateway/config.ts', 'middleware.ts'],
      difficulty: 'Intermediate',
      owner: {
        name: 'Mike Rodriguez',
        role: 'Backend Developer',
        avatar: '👨‍🔧',
      },
    },
    {
      id: 9,
      title: 'Frontend Component Library Deep Dive',
      description: 'Explore the component structure and design patterns',
      estimatedTime: '25 min',
      progress: 55,
      relatedFiles: ['components/Button.tsx', 'components/Modal.tsx'],
      difficulty: 'Beginner',
      owner: {
        name: 'Emma Wilson',
        role: 'Frontend Lead',
        avatar: '👩‍🎨',
      },
    },
    {
      id: 10,
      title: 'Database Schema and Relationships',
      description: 'Get familiar with the data models and relationships',
      estimatedTime: '20 min',
      progress: 40,
      relatedFiles: ['models/User.ts', 'models/Organization.ts'],
      difficulty: 'Intermediate',
      owner: {
        name: 'David Kim',
        role: 'Database Architect',
        avatar: '👨‍💼',
      },
    },
    {
      id: 11,
      title: 'Testing Framework and Best Practices',
      description: 'Learn how to write and run tests in the codebase',
      estimatedTime: '35 min',
      progress: 25,
      relatedFiles: ['tests/unit/', 'tests/integration/'],
      difficulty: 'Intermediate',
      owner: {
        name: 'Lisa Anderson',
        role: 'QA Engineer',
        avatar: '👩‍🔬',
      },
    },
  ],
  completed: [
    {
      id: 5,
      title: 'Welcome & Introduction',
      description: 'Completed onboarding introduction',
      completedAt: '2 days ago',
      relatedFiles: [],
      difficulty: 'Beginner',
    },
    {
      id: 6,
      title: 'Connect GitHub Repository',
      description: 'Successfully connected your first repository',
      completedAt: '1 day ago',
      relatedFiles: [],
      difficulty: 'Beginner',
    },
  ],
};

const QUICK_STATS = {
  progress: 35,
  tasksCompleted: 2,
  tasksTotal: 6,
  daysActive: 3,
  filesExplored: 12,
};

function TaskCard({ task, status }: { task: (typeof LEARNING_PATH_TASKS.waiting[0] | typeof LEARNING_PATH_TASKS.completed[0] | typeof LEARNING_PATH_TASKS.inProgress[0]) & { progress?: number; completedAt?: string; estimatedTime?: string; owner?: { name: string; role: string; avatar: string } }; status: 'waiting' | 'inProgress' | 'completed' }) {
  const router = useRouter();
  const params = useParams();
  const orgShortId = params?.orgShortId as string;

  const handleStartTask = () => {
    // Navigate to task details or code reference
    router.push(`/${orgShortId}/repositories`);
  };

  return (
    <div className="bg-[#171717]/50 backdrop-blur-sm border border-[#262626] rounded-lg p-4 hover:border-[var(--color-primary)]/50 hover:bg-[#171717]/70 transition-all cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-base font-semibold text-white flex-1">{task.title}</h4>
        {task.difficulty && (
          <span className={`text-xs px-2 py-1 rounded ${
            task.difficulty === 'Beginner' 
              ? 'bg-green-500/20 text-green-400' 
              : task.difficulty === 'Intermediate'
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {task.difficulty}
          </span>
        )}
      </div>
      <p className="text-sm text-white/70 mb-3">{task.description}</p>
      
      {status === 'inProgress' && task.progress !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-white/60 mb-1">
            <span>Progress</span>
            <span>{task.progress}%</span>
          </div>
          <div className="w-full bg-[#262626] rounded-full h-1.5">
            <div 
              className="bg-[var(--color-primary)] h-1.5 rounded-full transition-all"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {task.relatedFiles && task.relatedFiles.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-white/50 mb-1">Related files:</p>
          <div className="flex flex-wrap gap-1">
            {task.relatedFiles.slice(0, 2).map((file, idx) => (
              <span key={idx} className="text-xs px-2 py-0.5 bg-[#262626] text-white/70 rounded">
                {file}
              </span>
            ))}
            {task.relatedFiles.length > 2 && (
              <span className="text-xs px-2 py-0.5 text-white/50">
                +{task.relatedFiles.length - 2} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-white/50">{task.estimatedTime || task.completedAt || ''}</span>
        {status !== 'completed' && (
          <button
            onClick={handleStartTask}
            className="text-xs px-3 py-1.5 rounded bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white transition-colors font-medium cursor-pointer"
          >
            {status === 'inProgress' ? 'Continue' : 'Start'}
          </button>
        )}
        {status === 'completed' && (
          <span className="text-xs px-3 py-1.5 rounded bg-green-500/20 text-green-400">
            ✓ Completed
          </span>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const params = useParams();
  const orgShortId = params?.orgShortId as string;
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  // Frontend-only onboarding setup state
  const [showSetup, setShowSetup] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [setupStep, setSetupStep] = useState(0);
  const [experience, setExperience] = useState('');
  const [role, setRole] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [learningStyle, setLearningStyle] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [generatingText, setGeneratingText] = useState('Analyzing repository structure...');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setIsMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const goToNextStep = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSetupStep(s => s + 1);
      setIsTransitioning(false);
    }, 400);
  };

  useEffect(() => {
    if (setupStep === 5) {
      setLoadingProgress(0);
      const progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev < 60) return prev + Math.random() * 15;
          if (prev < 85) return prev + Math.random() * 5;
          return prev;
        });
      }, 500);
      const dotInterval = setInterval(() => {
        setDotCount((prev) => (prev + 1) % 4);
      }, 400);
      const texts = [
        'Analyzing repository structure...',
        'Mapping architectural dependencies...',
        'Extracting code ownership data...',
        'Crafting your personalized path...',
        'Ready to dive in!'
      ];
      let i = 0;
      const textInterval = setInterval(() => {
        i++;
        if (i < texts.length) {
          setGeneratingText(texts[i]);
        } else {
          clearInterval(textInterval);
          clearInterval(progressInterval);
          clearInterval(dotInterval);
          setLoadingProgress(100);
          setTimeout(() => setShowSetup(false), 800);
        }
      }, 1000);
      return () => {
        clearInterval(textInterval);
        clearInterval(progressInterval);
        clearInterval(dotInterval);
      };
    }
  }, [setupStep]);

  const toggleInterest = (id: string) => {
    setInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const navigateToTaskCompass = () => {
    router.push(`/${orgShortId}/task-compass`);
  };

  const navigateToHotZones = () => {
    router.push(`/${orgShortId}/hot-zones`);
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 400; // Adjust based on card width + gap
      const currentScroll = carouselRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      carouselRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth',
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHasMoved(false);
    if (carouselRef.current) {
      carouselRef.current.style.cursor = '';
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setHasMoved(false);
    if (carouselRef.current) {
      carouselRef.current.style.cursor = '';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = x - startX;
    
    // Only start dragging if moved more than 5px
    if (Math.abs(walk) > 5) {
      if (!hasMoved) {
        setHasMoved(true);
        carouselRef.current.style.cursor = 'grabbing';
      }
      e.preventDefault();
      carouselRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.touches[0].pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !carouselRef.current) return;
    const x = e.touches[0].pageX - carouselRef.current.offsetLeft;
    const walk = x - startX;
    
    // Only start dragging if moved more than 5px
    if (Math.abs(walk) > 5) {
      setHasMoved(true);
      carouselRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setHasMoved(false);
  };

  return (
    <>
      {showSetup && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-700 ease-out ${isMounted ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setShowSetup(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`relative bg-[#121215] border border-[#262626] rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl transition-all duration-700 delay-100 ease-out transform ${isMounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowSetup(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Progress Bar */}
            <div className="absolute top-0 left-0 h-1 bg-[#262626] w-full">
              <div 
                className="h-full bg-[var(--color-primary)] transition-all duration-700 ease-in-out"
                style={{ width: `${(setupStep / 5) * 100}%` }}
              />
            </div>

            <div className={`p-10 transition-all duration-400 transform ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
              
              {setupStep === 0 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Let's get you onboarded</h2>
                    <p className="text-white/60">What is your role? This helps us focus on the code and context you'll need most.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'frontend', title: 'Frontend Engineer' },
                      { id: 'backend', title: 'Backend Engineer' },
                      { id: 'fullstack', title: 'Fullstack Engineer' },
                      { id: 'devops', title: 'DevOps / SRE' },
                      { id: 'product', title: 'Product Manager' },
                      { id: 'data', title: 'Data Scientist' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => { setRole(opt.id); goToNextStep(); }}
                        className={`p-4 text-center rounded-xl border transition-all duration-200 group hover:-translate-y-1 cursor-pointer ${
                          role === opt.id 
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-white' 
                            : 'border-[#262626] hover:border-[#404040] bg-[#171717]/50 text-white/70'
                        }`}
                      >
                        <div className="font-medium">{opt.title}</div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Step indicator */}
                  <div className="flex justify-center gap-2 mt-12 pt-4 border-t border-[#262626]">
                    {[0, 1, 2, 3, 4].map(step => (
                      <div key={step} className={`h-1.5 rounded-full transition-all duration-300 ${step === 0 ? 'w-8 bg-[var(--color-primary)]' : 'w-2 bg-[#262626]'}`} />
                    ))}
                  </div>
                </div>
              )}

              {setupStep === 1 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Experience with this stack?</h2>
                    <p className="text-white/60">We'll adjust the depth of our explanations accordingly.</p>
                  </div>
                  <div className="space-y-3">
                    {[
                      { id: 'new', title: 'Brand new', desc: 'I need the basics and foundational concepts' },
                      { id: 'familiar', title: 'Somewhat familiar', desc: 'I know the tech, just need to see how it\'s used here' },
                      { id: 'expert', title: 'Expert', desc: 'Just show me the architecture and where things live' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => { setExperience(opt.id); goToNextStep(); }}
                        className={`w-full p-4 text-left rounded-xl border transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                          experience === opt.id 
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' 
                            : 'border-[#262626] hover:border-[#404040] bg-[#171717]/50'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-white mb-1">{opt.title}</div>
                          <div className="text-sm text-white/50">{opt.desc}</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${experience === opt.id ? 'border-[var(--color-primary)]' : 'border-[#404040]'}`}>
                          {experience === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]" />}
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Step indicator */}
                  <div className="flex justify-center gap-2 mt-12 pt-4 border-t border-[#262626]">
                    {[0, 1, 2, 3, 4].map(step => (
                      <div key={step} className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-[var(--color-primary)]' : step < 1 ? 'w-2 bg-[var(--color-primary)]/50' : 'w-2 bg-[#262626]'}`} />
                    ))}
                  </div>
                </div>
              )}

              {setupStep === 2 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">What size team are you joining?</h2>
                    <p className="text-white/60">This helps us customize our recommendations on team communication and PRs.</p>
                  </div>
                  <div className="space-y-3">
                    {[
                      { id: 'solo', title: 'Just me / Solo contributor', desc: 'I am taking full ownership' },
                      { id: 'small', title: 'Small team (2-5)', desc: 'Tight-knit, agile development' },
                      { id: 'medium', title: 'Medium team (6-15)', desc: 'Established processes and review cycles' },
                      { id: 'large', title: 'Large organization (15+)', desc: 'Complex cross-team collaboration' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => { setTeamSize(opt.id); goToNextStep(); }}
                        className={`w-full p-4 text-left rounded-xl border transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                          teamSize === opt.id 
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' 
                            : 'border-[#262626] hover:border-[#404040] bg-[#171717]/50'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-white mb-1">{opt.title}</div>
                          <div className="text-sm text-white/50">{opt.desc}</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${teamSize === opt.id ? 'border-[var(--color-primary)]' : 'border-[#404040]'}`}>
                          {teamSize === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]" />}
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Step indicator */}
                  <div className="flex justify-center gap-2 mt-12 pt-4 border-t border-[#262626]">
                    {[0, 1, 2, 3, 4].map(step => (
                      <div key={step} className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-[var(--color-primary)]' : step < 2 ? 'w-2 bg-[var(--color-primary)]/50' : 'w-2 bg-[#262626]'}`} />
                    ))}
                  </div>
                </div>
              )}

              {setupStep === 3 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">How do you prefer to learn?</h2>
                    <p className="text-white/60">We'll tailor your onboarding tasks to match your style.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'docs', title: 'Read Documentation', desc: 'Give me the high-level theory first' },
                      { id: 'code', title: 'Dive into Code', desc: 'Let me read the implementation' },
                      { id: 'tasks', title: 'Hands-on Tasks', desc: 'Give me small bugs to fix' },
                      { id: 'visual', title: 'Visual Diagrams', desc: 'Show me the architecture' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => { setLearningStyle(opt.id); goToNextStep(); }}
                        className={`p-4 text-left rounded-xl border transition-all duration-200 group hover:-translate-y-1 cursor-pointer ${
                          learningStyle === opt.id 
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' 
                            : 'border-[#262626] hover:border-[#404040] bg-[#171717]/50'
                        }`}
                      >
                        <div className="font-medium text-white mb-1">{opt.title}</div>
                        <div className="text-xs text-white/50">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Step indicator */}
                  <div className="flex justify-center gap-2 mt-12 pt-4 border-t border-[#262626]">
                    {[0, 1, 2, 3, 4].map(step => (
                      <div key={step} className={`h-1.5 rounded-full transition-all duration-300 ${step === 3 ? 'w-8 bg-[var(--color-primary)]' : step < 3 ? 'w-2 bg-[var(--color-primary)]/50' : 'w-2 bg-[#262626]'}`} />
                    ))}
                  </div>
                </div>
              )}

              {setupStep === 4 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">What do you want to explore first?</h2>
                    <p className="text-white/60">Select up to 3 areas of interest (Optional)</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {[
                      'Authentication', 'Database Schema', 'API Gateway', 
                      'Component Library', 'CI/CD Pipeline', 'State Management',
                      'Testing Strategy', 'Deployment Structure'
                    ].map((topic) => (
                      <button
                        key={topic}
                        onClick={() => toggleInterest(topic)}
                        className={`px-4 py-2 rounded-full border transition-all duration-200 cursor-pointer ${
                          interests.includes(topic)
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/20 text-white'
                            : 'border-[#262626] hover:border-[#404040] bg-transparent text-white/70'
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between mt-12 pt-4 border-t border-[#262626]">
                    <div className="flex gap-2">
                      {[0, 1, 2, 3, 4].map(step => (
                        <div key={step} className={`h-1.5 rounded-full transition-all duration-300 ${step === 4 ? 'w-8 bg-[var(--color-primary)]' : step < 4 ? 'w-2 bg-[var(--color-primary)]/50' : 'w-2 bg-[#262626]'}`} />
                      ))}
                    </div>
                    
                    <button
                      onClick={goToNextStep}
                      className="px-6 py-2 bg-[var(--color-primary)] text-white font-medium rounded-lg transition-all hover:bg-[var(--color-primary-light)] flex items-center gap-2 cursor-pointer"
                    >
                      Generate Path
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {setupStep === 5 && (
                <div className="flex flex-col items-center justify-center min-h-[320px] py-12">
                  <div className="mb-8 scale-[0.8] origin-center">
                    <LoadingSpinner />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-4 w-64 text-center">
                    Preparing your workspace
                    <span className="inline-block text-left" style={{ width: '24px' }}>
                      {'.'.repeat(dotCount)}
                    </span>
                  </h3>
                  <p className="text-sm text-white/50 mb-4 text-center max-w-xs">{generatingText}</p>
                  <div className="w-64 h-1.5 bg-[#212121] rounded-full overflow-hidden border border-white/5 relative">
                    <div 
                      className="absolute top-0 left-0 h-full bg-[var(--color-primary)] rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${Math.min(100, Math.max(0, loadingProgress))}%` }}
                    />
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      <div className={`mx-auto max-w-screen-2xl ${showSetup ? 'opacity-20 pointer-events-none blur-sm' : ''} transition-all duration-500`}>
        <div className="min-h-full py-10 text-white">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Onboarding</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-[#171717]/50 backdrop-blur-sm border border-[#262626] rounded-lg px-4 py-2">
                  <div className="text-xs text-white/50 mb-1">Overall Progress</div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-[#262626] rounded-full h-2">
                      <div 
                        className="bg-[var(--color-primary)] h-2 rounded-full transition-all"
                        style={{ width: `${QUICK_STATS.progress}%` }}
                      />
                  </div>
                    <span className="text-sm font-semibold text-white">{QUICK_STATS.progress}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Two Container Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Task Compass */}
            <button
              onClick={navigateToTaskCompass}
              className="bg-orange-400/20 backdrop-blur-sm border border-orange-400/50 rounded-lg p-6 hover:border-orange-400/80 hover:bg-orange-400/30 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-400/30 rounded-lg text-orange-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Task Compass</h3>
              </div>
              <p className="text-sm text-white/70 mb-4">Discover recommended tasks based on your role and experience level</p>
              <div className="flex items-center text-sm text-orange-300 group-hover:gap-2 transition-all">
                <span>Explore</span>
                <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Hot Zones */}
            <button
              onClick={navigateToHotZones}
              className="bg-orange-400/20 backdrop-blur-sm border border-orange-400/50 rounded-lg p-6 hover:border-orange-400/80 hover:bg-orange-400/30 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-400/30 rounded-lg text-orange-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                        </div>
                <h3 className="text-lg font-semibold text-white">Hot Zones</h3>
                        </div>
              <p className="text-sm text-white/70 mb-4">Identify active areas in the codebase with recent changes and high activity</p>
              <div className="flex items-center text-sm text-orange-300 group-hover:gap-2 transition-all">
                <span>Explore</span>
                <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
                  </div>

          {/* Continue Learning Carousel */}
          <section className="mb-8">
            <div className="bg-[#121215] border border-[#262626] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Continue Learning</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollCarousel('left')}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Scroll left"
                  >
                    <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => scrollCarousel('right')}
                    className="w-10 h-10 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] border border-[var(--color-primary)]/50 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Scroll right"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              <div 
                ref={carouselRef}
                className="flex gap-6 overflow-x-auto hide-scrollbar pb-4 select-none"
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {LEARNING_PATH_TASKS.inProgress.map((item) => (
                  <div
                    key={item.id}
                    className="flex-shrink-0 w-80 bg-[#171717]/50 backdrop-blur-sm border border-[#262626] rounded-lg overflow-hidden hover:border-[var(--color-primary)]/50 hover:bg-[#171717]/70 transition-all group cursor-pointer"
                    onClick={(e) => {
                      if (hasMoved) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  >
                    {/* Image Section */}
                    <div className="relative h-48 bg-gradient-to-br from-[#262626] to-[#171717]">
                    </div>

                    {/* Content Section */}
                    <div className="p-4 flex flex-col h-[180px]">
                      {/* Title */}
                      <h3 className="text-base font-semibold text-white mb-2 line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-white/70 mb-auto line-clamp-2 flex-1">{item.description}</p>

                      {/* Progress Bar - Fixed at bottom */}
                      <div className="mt-auto">
                        <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                          <span>Progress</span>
                          <span>{item.progress}%</span>
                        </div>
                        <div className="w-full bg-[#262626] rounded-full h-1.5">
                          <div 
                            className="bg-[var(--color-primary)] h-1.5 rounded-full transition-all"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Learning Path Section */}
          <section className="mb-8">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white mb-1">Your Learning Path</h2>
              <p className="text-sm text-white/50">Track your progress through personalized onboarding tasks</p>
                    </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Waiting Column */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  <h3 className="text-base font-semibold text-white">Waiting ({LEARNING_PATH_TASKS.waiting.length})</h3>
                    </div>
                <div className="space-y-4">
                  {LEARNING_PATH_TASKS.waiting.map((task) => (
                    <TaskCard key={task.id} task={task} status="waiting" />
                  ))}
                </div>
              </div>

              {/* In Progress Column */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></div>
                  <h3 className="text-base font-semibold text-white">In Progress ({LEARNING_PATH_TASKS.inProgress.length})</h3>
                      </div>
                <div className="space-y-4">
                  {LEARNING_PATH_TASKS.inProgress.map((task) => (
                    <TaskCard key={task.id} task={task} status="inProgress" />
                  ))}
                  {LEARNING_PATH_TASKS.inProgress.length === 0 && (
                    <div className="bg-[#171717]/30 border border-[#262626] rounded-lg p-8 text-center">
                      <p className="text-white/50 text-sm">No tasks in progress</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Completed Column */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <h3 className="text-base font-semibold text-white">Completed ({LEARNING_PATH_TASKS.completed.length})</h3>
                  </div>
                <div className="space-y-4">
                  {LEARNING_PATH_TASKS.completed.map((task) => (
                    <TaskCard key={task.id} task={task} status="completed" />
                ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      <Chatbot orgContext={orgShortId ? { orgShortId } : undefined} />
    </>
  );
}
