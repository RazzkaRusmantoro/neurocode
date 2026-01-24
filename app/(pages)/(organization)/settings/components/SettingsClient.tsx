'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import GlowButton from '@/app/components/GlowButton';
import { getGitHubAuthUrl, disconnectGitHub } from '@/actions/github';

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'applications', label: 'Applications' },
  { id: 'billings', label: 'Billings' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'sessions', label: 'Sessions' },
];

interface SettingsClientProps {
  userData: {
    firstName: string;
    lastName: string;
    email: string;
    github: {
      providerAccount: string;
      providerUserId: string;
      accessToken: string;
      scope?: string[];
      connectedAt: Date;
      status: 'active' | 'expired' | 'revoked';
    } | null;
  };
}

export default function SettingsClient({ userData }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState('general');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Check for OAuth callback success/error messages and clean up URL params
  useEffect(() => {
    const githubConnected = searchParams?.get('github_connected');
    const oauthError = searchParams?.get('error');

    if (githubConnected || oauthError) {
      // Clean up URL params after showing message
      const timer = setTimeout(() => {
        router.replace('/settings');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="max-w-screen-2xl mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <div className="mb-5 flex-shrink-0">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex-shrink-0">
          <div className="flex gap-1 border-b border-[#424242]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium transition-colors duration-200 border-b-2 cursor-pointer ${
                  activeTab === tab.id
                    ? 'text-[#BC4918] border-[#BC4918]'
                    : 'text-white/60 border-transparent hover:text-white hover:border-white/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          <div className="p-4">
            {activeTab === 'general' && <GeneralTab userData={userData} session={session} router={router} />}
            {activeTab === 'applications' && <ApplicationsTab />}
            {activeTab === 'billings' && <BillingsTab />}
            {activeTab === 'preferences' && <PreferencesTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'sessions' && <SessionsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

// General Tab Component
interface GeneralTabProps {
  userData: {
    firstName: string;
    lastName: string;
    email: string;
    github: {
      providerAccount: string;
      providerUserId: string;
      accessToken: string;
      scope?: string[];
      connectedAt: Date;
      status: 'active' | 'expired' | 'revoked';
    } | null;
  };
  session: any;
  router: ReturnType<typeof useRouter>;
}

function GeneralTab({ userData, session, router }: GeneralTabProps) {
  const [firstName, setFirstName] = useState(userData.firstName || '');
  const [lastName, setLastName] = useState(userData.lastName || '');
  const [email, setEmail] = useState(userData.email || '');
  const [password, setPassword] = useState('');
  const [bitbucketConnected, setBitbucketConnected] = useState(false);

  // Check if GitHub is connected
  const githubConnected = !!(userData.github && userData.github.status === 'active');
  const githubAccount = userData.github?.providerAccount;

  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleConnectGitHub = async () => {
    if (!session?.user?.id) return;
    
    try {
      const authUrl = await getGitHubAuthUrl(session.user.id);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting GitHub:', error);
    }
  };

  const handleDisconnectGitHub = async () => {
    if (!session?.user?.id) return;
    
    setIsDisconnecting(true);
    try {
      const result = await disconnectGitHub();
      if (result.success) {
        router.refresh(); // Refresh to update UI
      } else {
        console.error('Error disconnecting GitHub:', result.error);
      }
    } catch (error) {
      console.error('Error disconnecting GitHub:', error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>
        
        {/* Profile Picture */}
        <div className="mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-lg bg-[#BC4918] flex items-center justify-center text-white text-2xl font-semibold">
              {firstName[0]?.toUpperCase() || lastName[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="px-4 py-2 bg-[#BC4918] border border-[#BC4918] rounded-lg text-white text-sm hover:bg-[#BC4918]/80 transition-colors duration-200 cursor-pointer"
              >
                Upload Photo
              </button>
              <p className="text-xs text-white/60">JPG, PNG or GIF. Max size 2MB</p>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* First Name and Last Name - Same Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-white mb-2">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2.5 border-none rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#BC4918] transition-all bg-[#FFD45C]/5"
                placeholder="Enter your first name"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-white mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2.5 border-none rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#BC4918] transition-all bg-[#FFD45C]/5"
                placeholder="Enter your last name"
              />
            </div>
          </div>

          {/* Email and Password - Same Row */}
          <div className="grid grid-cols-2 gap-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled
                  className="w-full px-4 py-2.5 pr-10 border-none rounded-lg text-white/40 placeholder-white/30 opacity-60 focus:outline-none focus:ring-0 transition-all cursor-not-allowed bg-[#FFD45C]/5"
                  placeholder="Enter your email"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled
                  className="w-full px-4 py-2.5 pr-10 border-none rounded-lg text-white/40 placeholder-white/30 opacity-60 focus:outline-none focus:ring-0 transition-all cursor-not-allowed bg-[#FFD45C]/5"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="border-t border-[#424242] pt-8">
        <h2 className="text-xl font-semibold text-white mb-6">Connected Accounts</h2>
        
        <div className="space-y-3">
          {/* GitHub Connection */}
          <div className="flex items-center justify-between p-4 bg-[#FFD45C]/5 border-none rounded-lg transition-all duration-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#1a1a1a] border border-[#424242] flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">GitHub</h3>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                    githubConnected 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-[#2a2a2a] text-white/50'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      githubConnected ? 'bg-green-400' : 'bg-white/30'
                    }`}></span>
                    {githubConnected ? 'Connected' : 'Not connected'}
                  </span>
                </div>
                <p className="text-xs text-white/40 mt-0.5">
                  {githubConnected 
                    ? `Connected as @${githubAccount}` 
                    : 'Connect your GitHub account'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={githubConnected ? handleDisconnectGitHub : handleConnectGitHub}
              disabled={isDisconnecting}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                githubConnected
                  ? 'bg-red-900/30 text-red-400 hover:bg-red-900/40 border border-red-600/50 hover:border-red-600'
                  : 'bg-[#181717] text-white hover:bg-[#2d2d2d] border border-[#181717] hover:border-[#2d2d2d]'
              } ${isDisconnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {githubConnected ? (
                'Revoke'
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Connect GitHub
                </>
              )}
            </button>
          </div>

          {/* Bitbucket Connection */}
          <div className="flex items-center justify-between p-4 bg-[#FFD45C]/5 border-none rounded-lg transition-all duration-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#1a1a1a] border border-[#424242] flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7" viewBox="8.4 14.39 2481.29 2231.21" fill="none">
                  <defs>
                    <linearGradient id="bitbucket-gradient" x1="945.1094" y1="1524.8389" x2="944.4923" y2="1524.1893" gradientTransform="matrix(1996.6343 0 0 -1480.3047 -1884485.625 2258195)" gradientUnits="userSpaceOnUse">
                      <stop offset="0.18" stopColor="#0052CC"/>
                      <stop offset="1" stopColor="#2684FF"/>
                    </linearGradient>
                  </defs>
                  <path d="M88.92,14.4C45.02,13.83,8.97,48.96,8.41,92.86c-0.06,4.61,0.28,9.22,1.02,13.77l337.48,2048.72 c8.68,51.75,53.26,89.8,105.74,90.24h1619.03c39.38,0.5,73.19-27.9,79.49-66.78l337.49-2071.78c7.03-43.34-22.41-84.17-65.75-91.2 c-4.55-0.74-9.15-1.08-13.76-1.02L88.92,14.4z M1509.99,1495.09H993.24l-139.92-731h781.89L1509.99,1495.09z" fill="#2684FF"/>
                  <path d="M2379.27,763.06h-745.5l-125.12,730.42H992.31l-609.67,723.67c19.32,16.71,43.96,26,69.5,26.21h1618.13 c39.35,0.51,73.14-27.88,79.44-66.72L2379.27,763.06z" fill="url(#bitbucket-gradient)"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">Bitbucket</h3>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                    bitbucketConnected 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-[#2a2a2a] text-white/50'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      bitbucketConnected ? 'bg-green-400' : 'bg-white/30'
                    }`}></span>
                    {bitbucketConnected ? 'Connected' : 'Not connected'}
                  </span>
                </div>
                <p className="text-xs text-white/40 mt-0.5">Connect your Bitbucket account</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBitbucketConnected(!bitbucketConnected)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                bitbucketConnected
                  ? 'bg-[#2a2a2a] text-white border border-[#424242] hover:bg-[#333333] hover:border-[#4a4a4a]'
                  : 'bg-[#2684FF] text-white hover:bg-[#1F6FE0] border border-[#2684FF] hover:border-[#1F6FE0]'
              }`}
            >
              {bitbucketConnected ? (
                'Disconnect'
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="8.4 14.39 2481.29 2231.21" fill="none">
                    <path d="M88.92,14.4C45.02,13.83,8.97,48.96,8.41,92.86c-0.06,4.61,0.28,9.22,1.02,13.77l337.48,2048.72 c8.68,51.75,53.26,89.8,105.74,90.24h1619.03c39.38,0.5,73.19-27.9,79.49-66.78l337.49-2071.78c7.03-43.34-22.41-84.17-65.75-91.2 c-4.55-0.74-9.15-1.08-13.76-1.02L88.92,14.4z M1509.99,1495.09H993.24l-139.92-731h781.89L1509.99,1495.09z" fill="white"/>
                    <path d="M2379.27,763.06h-745.5l-125.12,730.42H992.31l-609.67,723.67c19.32,16.71,43.96,26,69.5,26.21h1618.13 c39.35,0.51,73.14-27.88,79.44-66.72L2379.27,763.06z" fill="white"/>
                  </svg>
                  Connect Bitbucket
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-[#424242]">
        <GlowButton
          type="button"
          color="#BC4918"
          className="px-6 py-2.5"
        >
          Save Changes
        </GlowButton>
      </div>
    </div>
  );
}

// Placeholder Tab Components
function ApplicationsTab() {
  return (
    <div className="py-8 text-center">
      <p className="text-white/60">Applications settings coming soon</p>
    </div>
  );
}

function BillingsTab() {
  return (
    <div className="py-8 text-center">
      <p className="text-white/60">Billing settings coming soon</p>
    </div>
  );
}

function PreferencesTab() {
  return (
    <div className="py-8 text-center">
      <p className="text-white/60">Preferences settings coming soon</p>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div className="py-8 text-center">
      <p className="text-white/60">Notification settings coming soon</p>
    </div>
  );
}

function SessionsTab() {
  return (
    <div className="py-8 text-center">
      <p className="text-white/60">Active sessions coming soon</p>
    </div>
  );
}

