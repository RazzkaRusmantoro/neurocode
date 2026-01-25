'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

interface RepoSidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
  userName?: string | null;
  userEmail?: string | null;
}

// Common class names
const BUTTON_BASE_CLASSES = 'w-full text-left pl-4 py-2 text-sm rounded-lg transition-colors duration-200 flex items-center gap-3 cursor-pointer';
const BUTTON_ACTIVE_CLASSES = 'text-white bg-[#2a2a2a]/50 font-bold';
const BUTTON_INACTIVE_CLASSES = 'text-white/60 hover:text-white hover:bg-[#2a2a2a]/50';

// Icon component helper - supports single path or array of paths
function Icon({ iconPath, className = 'w-5 h-5' }: { iconPath: string | string[]; className?: string }) {
  const paths = Array.isArray(iconPath) ? iconPath : [iconPath];
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {paths.map((path, index) => (
        <path key={index} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
      ))}
    </svg>
  );
}

export default function RepoSidebar({ 
  isExpanded, 
  onToggle,
  userName: propUserName,
  userEmail: propUserEmail,
}: RepoSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [activeItem, setActiveItem] = useState<string>('Code Viewer');

  // Use props if available, fallback to session
  const userName = propUserName ?? session?.user?.name;
  const userEmail = propUserEmail ?? session?.user?.email;

  // Extract orgShortId from pathname (e.g., /org-2Sc8S/repo/repo-name -> org-2Sc8S)
  const orgMatch = pathname.match(/\/org-([^/]+)/);
  const orgShortId = orgMatch ? `org-${orgMatch[1]}` : null;

  const handleBackToRepositories = useCallback(() => {
    if (orgShortId) {
      router.push(`/${orgShortId}/repositories`);
    }
  }, [router, orgShortId]);

  const handleSettingsClick = useCallback(() => {
    router.push('/settings');
  }, [router]);

  // Get initials from name - memoized since it depends on userName
  const userInitials = useMemo(() => {
    if (!userName) return 'U';
    const parts = userName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return userName[0]?.toUpperCase() || 'U';
  }, [userName]);

  return (
    <aside className="h-full w-80">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center p-4 pl-8">
          <img 
            src="/Full-logo.png" 
            alt="Logo" 
            className="h-12 w-auto"
          />
        </div>

        {/* Back to Repositories Button */}
        {orgShortId && (
          <div className="px-4 pb-3">
            <button
              onClick={handleBackToRepositories}
              className="w-full text-left pl-4 py-2.5 text-sm rounded-lg transition-colors duration-200 flex items-center gap-3 cursor-pointer text-white/60 hover:text-white hover:bg-[#2a2a2a]/50"
            >
              <Icon iconPath="M10 19l-7-7m0 0l7-7m-7 7h18" />
              <span>Back to Repositories</span>
            </button>
          </div>
        )}

        {/* Sidebar Content */}
        <nav className="flex-1 px-4 flex flex-col overflow-y-auto sidebar-scrollbar">
          {/* Repository Section */}
          <div className="pb-3">
            <h3 className="text-xs text-white/60 pl-4 mb-2">REPOSITORY</h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setActiveItem('Code Viewer')}
                  className={`${BUTTON_BASE_CLASSES} ${activeItem === 'Code Viewer' ? BUTTON_ACTIVE_CLASSES : BUTTON_INACTIVE_CLASSES}`}
                >
                  <Icon iconPath="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  <span>Code Viewer</span>
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* Profile Section */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2.5 p-2.5">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-[#BC4918] flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-semibold">
                  {userInitials}
                </span>
              </div>
            </div>
            {/* Full Name */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {userName || 'User'}
              </p>
            </div>
            {/* Settings Icon */}
            <button 
              onClick={handleSettingsClick}
              className="flex-shrink-0 p-1.5 hover:bg-white/10 rounded-md transition-all duration-200 cursor-pointer group"
            >
              <Icon 
                iconPath={[
                  "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
                  "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                ]}
                className="w-5 h-5 text-white/70 group-hover:text-white transition-colors duration-200"
              />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

