'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PersonalizationStep from './components/PersonalizationStep';
import PricingStep from './components/PricingStep';
import OrganizationStep from './components/OrganizationStep';

type Stage = 'personalization' | 'pricing' | 'org';

export default function SetupPage() {
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [role, setRole] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const userId = params?.userId as string;
  
  const currentStage = (searchParams.get('stage') || 'personalization') as Stage;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'unauthenticated') {
    return null;
  }

  const updateStage = (newStage: Stage) => {
    router.push(`/setup/${userId}?stage=${newStage}`);
  };

  const handlePersonalizationNext = () => {
    updateStage('pricing');
  };

  const handlePricingNext = () => {
    updateStage('org');
  };

  const handleOrganizationFinish = () => {
    router.push('/dashboard');
  };

  // Determine which stages should be visible and animated
  const getStageClasses = (stage: Stage) => {
    const stageOrder: Stage[] = ['personalization', 'pricing', 'org'];
    const currentIndex = stageOrder.indexOf(currentStage);
    const stageIndex = stageOrder.indexOf(stage);

    if (stageIndex < currentIndex) {
      // Previous stage - slide left and fade out
      return 'transform -translate-x-full opacity-0 absolute w-full';
    } else if (stageIndex === currentIndex) {
      // Current stage - visible
      return 'transform translate-x-0 opacity-100 relative';
    } else {
      // Future stage - slide in from right
      return 'transform translate-x-full opacity-0 absolute w-full';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className={`w-full ${currentStage === 'pricing' ? 'max-w-6xl' : 'max-w-5xl'} flex flex-col relative overflow-hidden p-6`}>
        {/* Personalization Step */}
        <div className={`transition-all duration-500 ease-in-out ${getStageClasses('personalization')}`}>
          <PersonalizationStep
            primaryGoal={primaryGoal}
            role={role}
            onPrimaryGoalChange={setPrimaryGoal}
            onRoleChange={setRole}
            onNext={handlePersonalizationNext}
          />
        </div>

        {/* Pricing Step */}
        <div className={`transition-all duration-500 ease-in-out ${getStageClasses('pricing')}`}>
          <PricingStep
            selectedPlan={selectedPlan}
            onPlanSelect={setSelectedPlan}
            onNext={handlePricingNext}
          />
        </div>

        {/* Organization Step */}
        <div className={`transition-all duration-500 ease-in-out ${getStageClasses('org')}`}>
          <OrganizationStep
            organizationName={organizationName}
            onOrganizationNameChange={setOrganizationName}
            onNext={() => {}}
            onFinish={handleOrganizationFinish}
          />
        </div>
      </div>
    </div>
  );
}

