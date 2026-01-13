'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const router = useRouter();
  const params = useParams();
  const { status } = useSession();
  const userId = params?.userId as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'unauthenticated') {
    return null;
  }

  const handleBasicPlan = () => {
    router.push(`/setup/organization/${userId}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl flex flex-col">
        {/* Welcome Heading */}
        <h1 className="text-3xl font-bold text-left text-white mb-3 flex items-center gap-3">
          <img 
            src="/icon.png" 
            alt="Neurocode Icon" 
            className="h-14 w-14"
          />
          Choose Your Plan
        </h1>
        
        {/* Subheader */}
        <p className="text-gray-400 text-base mb-8">
          Select the perfect plan to accelerate your development workflow with AI-powered code analysis and assistance.
        </p>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Basic Plan */}
          <div
            className={`relative p-10 bg-[#212121] border border-[#424242] rounded-lg transition-all ${
              selectedPlan === 'basic'
                ? 'border-[#BC4918] bg-[#212121]'
                : 'border-[#424242] hover:border-gray-600/50'
            }`}
          >
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-white mb-2">Basic</h3>
              <div className="flex items-baseline mb-2">
                <span className="text-3xl font-bold text-white">$19</span>
                <span className="text-gray-400 ml-2">/month</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Perfect for getting started with basic code analysis and AI assistance.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedPlan('basic');
                  router.push(`/setup/organization/${userId}`);
                }}
                className="w-full py-2 px-4 bg-[#BC4918] hover:bg-[#D85A2A] text-white font-medium rounded-lg transition-all duration-300 ease-in-out hover:shadow-[0_0_25px_rgba(188,73,24,0.8)] cursor-pointer"
              >
                Select Plan
              </button>
            </div>
            <ul className="space-y-3 mt-10">
              <li className="text-gray-300 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Multi-repository Support (5 repos)
              </li>
              <li className="text-gray-300 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Personalized Onboarding Assistant
              </li>
              <li className="text-gray-300 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Automated Test Case Generation
              </li>
              <li className="text-gray-300 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Direct Code Optimization to Repository
              </li>
            </ul>
          </div>

          {/* Professional Plan - Recommended */}
          <div
            className={`relative p-10 bg-[#212121] border border-[#424242] rounded-lg transition-all ${
              selectedPlan === 'pro'
                ? 'border-[#BC4918] bg-[#212121]'
                : 'border-[#BC4918] hover:border-[#D85A2A]'
            }`}
          >
            {/* Recommended Label */}
            <div className="absolute -top-3 left-4">
              <span className="bg-[#BC4918] text-white text-xs font-semibold px-3 py-1 rounded-full">
                RECOMMENDED
              </span>
            </div>
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-white mb-2">Professional</h3>
              <div className="flex items-baseline mb-2">
                <span className="text-3xl font-bold text-white">$29</span>
                <span className="text-gray-400 ml-2">/month</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Ideal for professional developers who need advanced features and unlimited access.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedPlan('pro');
                  router.push(`/setup/organization/${userId}`);
                }}
                className="w-full py-2 px-4 bg-[#BC4918] hover:bg-[#D85A2A] text-white font-medium rounded-lg transition-all duration-300 ease-in-out hover:shadow-[0_0_25px_rgba(188,73,24,0.8)] cursor-pointer"
              >
                Select Plan
              </button>
            </div>
            <ul className="space-y-3 mt-10">
              <li className="text-gray-300 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Everything in Basic
              </li>
              <li className="text-gray-300 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Multi-repository Support (10 repos)
              </li>
              <li className="text-gray-300 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Priority Processing
              </li>
              <li className="text-gray-300 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Full Jira Integration
              </li>
              <li className="text-gray-300 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                More Team Collaboration Features
              </li>
            </ul>
          </div>

          {/* Enterprise Plan */}
          <div
            className={`relative p-10 bg-[#212121] border border-[#424242] rounded-lg transition-all ${
              selectedPlan === 'enterprise'
                ? 'border-[#BC4918] bg-[#212121]'
                : 'border-[#424242] hover:border-gray-600/50'
            }`}
          >
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-white mb-2">Enterprise</h3>
              <div className="flex items-baseline mb-2">
                <span className="text-3xl font-bold text-white">$59</span>
                <span className="text-gray-400 ml-2">/month</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Complete solution for teams requiring custom integrations and dedicated support.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedPlan('enterprise');
                  router.push(`/setup/organization/${userId}`);
                }}
                className="w-full py-2 px-4 bg-[#BC4918] hover:bg-[#D85A2A] text-white font-medium rounded-lg transition-all duration-300 ease-in-out hover:shadow-[0_0_25px_rgba(188,73,24,0.8)] cursor-pointer"
              >
                Select Plan
              </button>
            </div>
            <ul className="space-y-3 mt-10">
              <li className="text-gray-300 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Everything in Professional
              </li>
              <li className="text-gray-300 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Multi-repository Support (Unlimited repos)
              </li>
              <li className="text-gray-300 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Custom integrations (Slack, custom APIs)
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons - Bottom Right */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={handleBasicPlan}
            className="px-6 py-1.5 text-sm font-medium text-gray-300 hover:text-white transition-all duration-200 cursor-pointer flex items-center gap-2"
          >
            Continue with Basic Plan
            <svg 
              className="w-5 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

