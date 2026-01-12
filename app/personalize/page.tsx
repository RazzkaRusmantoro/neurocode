'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Dropdown from '@/app/components/Dropdown';

const PRIMARY_GOALS = [
  'Understand a new or existing codebase',
  'Speed up development with AI assistance',
  'Improve code quality and maintainability',
  'Onboard new developers faster',
  'Review pull requests more efficiently',
  'Refactor legacy or messy code',
  'Generate or improve documentation',
  'Debug and troubleshoot issues faster',
  'Explore unfamiliar languages or frameworks',
  'Maintain consistency and best practices across projects',
];

const ROLE_OPTIONS = [
  'Backend Developer',
  'Data Engineer',
  'Frontend Developer',
  'Fullstack Developer',
  'DevOps Engineer',
  'ML Engineer',
  'Data Scientist',
  'Mobile Developer',
  'QA Engineer',
  'Product Manager',
  'UI/UX Designer',
  'Security Engineer',
  'Student',
  'Other',
];

export default function PersonalizePage() {
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [role, setRole] = useState('');
  const router = useRouter();

  const isFormComplete = primaryGoal && role;

  const handleNext = () => {
    if (!isFormComplete) return;
    // For now, just redirect to dashboard
    // Later we can add more stages or save the data
    // true dat, i wanna know if i wanna make this personalize page also a popup instead on the dashboard or idk we'll see
    router.push('/dashboard');
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl flex flex-col">
        {/* Welcome Heading */}
        <h1 className="text-3xl font-bold text-left text-white mb-3 flex items-center gap-3">
          <img 
            src="/icon.png" 
            alt="Neurocode Icon" 
            className="h-14 w-14"
          />
          Welcome to NeuroCode! Tell us a bit about yourself.
        </h1>
        
        {/* Subheader */}
        <p className="text-gray-400 text-base mb-8">
          Help us tailor your experience to better serve your needs.
        </p>

        {/* Form Container */}
        <div className="space-y-6">
          {/* Primary Goal Dropdown */}
          <div>
            <label htmlFor="primaryGoal" className="block text-sm font-medium text-gray-300 mb-3">
              What is your primary goal?
            </label>
            <Dropdown
              id="primaryGoal"
              options={PRIMARY_GOALS}
              value={primaryGoal}
              onChange={setPrimaryGoal}
              placeholder="Select"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              What best describes you?
            </label>
            <div className="flex flex-wrap gap-3">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRole(option)}
                  className={`px-4 py-2.5 whitespace-nowrap border rounded-lg cursor-pointer transition-all ${
                    role === option
                      ? 'bg-[#BC4918]/20 border-[#BC4918] text-white'
                      : 'bg-gray-800/30 border-gray-700/30 text-gray-300 hover:bg-gray-800/50 hover:border-gray-600/50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons - Bottom Right */}
        <div className="flex justify-end gap-3 mt-32">
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-gray-400 hover:text-white font-medium underline transition-colors duration-200 cursor-pointer mr-5"
          >
            Skip Personalization
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!isFormComplete}
            className={`px-8 py-1.5 text-sm font-semibold rounded-lg border transition-all duration-300 ease-in-out ${
              isFormComplete
                ? 'bg-[#BC4918] hover:bg-[#D85A2A] text-white border-[#BC4918] hover:border-[#D85A2A] hover:shadow-[0_0_15px_rgba(188,73,24,0.6)] cursor-pointer'
                : 'bg-gray-700/50 text-gray-500 border-gray-700 cursor-not-allowed'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

