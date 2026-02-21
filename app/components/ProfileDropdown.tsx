'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useLoadingBar } from '../contexts/LoadingBarContext';

interface ProfileDropdownProps {
  userEmail?: string | null;
  userName?: string | null;
}

export default function ProfileDropdown({ userEmail, userName }: ProfileDropdownProps) {
  const router = useRouter();
  const { startLoading } = useLoadingBar();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    startLoading();
    router.push('/login');
    router.refresh();
  };

  // Get initials from name
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/5 transition-colors duration-200 cursor-pointer"
        aria-label="Profile"
      >
        <img 
          src="/Pfp-placeholder.png" 
          alt="Profile" 
          className="w-8 h-8 rounded object-cover"
        />
        {userName && (
          <span className="text-sm text-white/70 hover:text-white">
            {userName}
          </span>
        )}
      </button>

      {/* Profile Dropdown */}
      <div
        className={`absolute right-0 z-10 mt-2 bg-[#121215] border border-[#262626] rounded shadow-lg overflow-hidden min-w-[240px] transition-all duration-200 ease-in-out ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        {/* Profile Header */}
        <div className="px-4 py-3 border-b border-[#262626]">
          <div className="flex items-center gap-3">
            <img 
              src="/Pfp-placeholder.png" 
              alt="Profile" 
              className="w-10 h-10 rounded object-cover"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">
                {userName || 'User'}
              </span>
              {userEmail && (
                <span className="text-xs text-white/60">
                  {userEmail}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-2 px-2">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              // TODO: Navigate to profile
              console.log('View Profile clicked');
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-[#2a2a2a] transition-colors cursor-pointer flex items-center gap-3 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            View Profile
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              startLoading();
              router.push('/settings');
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-[#2a2a2a] transition-colors cursor-pointer flex items-center gap-3 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              // TODO: Navigate to subscription
              console.log('Subscription clicked');
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-[#2a2a2a] transition-colors cursor-pointer flex items-center gap-3 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Subscription
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-[#262626]"></div>

        {/* Second Menu Items */}
        <div className="py-2 px-2">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              // TODO: Navigate to organizations
              console.log('Organizations clicked');
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-[#2a2a2a] transition-colors cursor-pointer flex items-center gap-3 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Organizations
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              // TODO: Navigate to guide
              console.log('Guide clicked');
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-[#2a2a2a] transition-colors cursor-pointer flex items-center gap-3 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Guide
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              // TODO: Navigate to support
              console.log('Support clicked');
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-[#2a2a2a] transition-colors cursor-pointer flex items-center gap-3 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Support
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-[#262626]"></div>

        {/* Logout Button */}
        <div className="py-2 px-2">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:text-white hover:bg-[#2a2a2a] transition-colors cursor-pointer flex items-center gap-3 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

