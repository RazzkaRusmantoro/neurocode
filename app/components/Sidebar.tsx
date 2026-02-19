'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
  userName?: string | null;
  userEmail?: string | null;
}

// Types for menu items
interface SubMenuItem {
  id: string;
  label: string;
}

interface MenuItem {
  id: string;
  label: string;
  iconPath: string;
  route?: string; // Optional route for navigation
  subItems?: SubMenuItem[];
}

// Route mapping for menu items (will be built dynamically with orgShortId)
const MENU_ITEM_ROUTES: Record<string, string> = {
  dashboard: '/dashboard',
  Repositories: '/repositories',
  Settings: '/settings',
  Onboarding: '/onboarding',
};

// Menu items configuration
const MAIN_MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    iconPath: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  },
  {
    id: 'Repositories',
    label: 'Repositories',
    iconPath: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    // route will be built dynamically
  },
  {
    id: 'management',
    label: 'Management',
    iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    subItems: [
      { id: 'Members', label: 'Members' },
      { id: 'Teams', label: 'Teams' },
      { id: 'Projects', label: 'Projects' }
    ]
  },
  {
    id: 'Onboarding',
    label: 'Onboarding',
    iconPath: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'
  },
  {
    id: 'Billing',
    label: 'Billing',
    iconPath: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
  }
];

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

// SubMenuItem component
function SubMenuItem({ 
  item, 
  activeItem, 
  setActiveItem,
  onMinimizeSidebar,
  router,
  pathname
}: { 
  item: SubMenuItem; 
  activeItem: string; 
  setActiveItem: (id: string) => void;
  onMinimizeSidebar?: () => void;
  router?: AppRouterInstance;
  pathname?: string;
}) {
  const isActive = activeItem === item.id;
  
  const handleClick = () => {
    setActiveItem(item.id);
  };
  
  return (
    <li className="relative">
      {/* Curved connection line */}
      <svg className="absolute left-[-21px] top-1/2 -translate-y-1/2 w-[22px] h-[12px] overflow-visible pointer-events-none">
        <path d="M 0 -6 L 0 0 Q 0 6 11 6" stroke="#424242" strokeWidth="1" fill="none" strokeLinecap="round" />
      </svg>
      <button 
        onClick={handleClick}
        className={`w-full text-left pl-4 py-1.5 text-sm rounded-lg transition-colors duration-200 cursor-pointer ${
          isActive ? BUTTON_ACTIVE_CLASSES : BUTTON_INACTIVE_CLASSES
        }`}
      >
        {item.label}
      </button>
    </li>
  );
}

interface MenuItemComponentProps {
  item: MenuItem;
  isExpanded: boolean;
  onToggle: () => void;
  activeItem: string;
  setActiveItem: (id: string) => void;
  router: AppRouterInstance;
  pathname: string;
  isMinimized?: boolean;
  onExpandSidebar?: () => void;
  onMinimizeSidebar?: () => void;
}

// MenuItem component
function MenuItemComponent({ 
  item, 
  isExpanded, 
  onToggle, 
  activeItem, 
  setActiveItem, 
  router,
  pathname,
  isMinimized = false,
  onExpandSidebar,
  onMinimizeSidebar
}: MenuItemComponentProps) {
  const hasSubItems = Boolean(item.subItems?.length);
  const isActive = activeItem === item.id || (hasSubItems && item.subItems?.some(sub => activeItem === sub.id));

  const handleMenuItemClick = useCallback(() => {
    setActiveItem(item.id);
    // Extract orgShortId from current pathname
    const match = pathname.match(/\/org-([^/]+)/);
    const orgShortId = match ? match[1] : null;
    
    const baseRoute = item.route || MENU_ITEM_ROUTES[item.id];
    if (baseRoute) {
      const route = orgShortId ? `/org-${orgShortId}${baseRoute}` : baseRoute;
      router.push(route);
    }
  }, [item.id, item.route, setActiveItem, router, pathname]);

  const handleParentClick = useCallback(() => {
    if (isMinimized && hasSubItems) {
      onExpandSidebar?.();
    }
    onToggle();
  }, [isMinimized, hasSubItems, onExpandSidebar, onToggle]);

  if (hasSubItems) {
    const parentIsActive = item.subItems!.some(sub => activeItem === sub.id);
    
    return (
      <div>
        <button 
          onClick={handleParentClick}
          className={`${BUTTON_BASE_CLASSES} ${isMinimized ? '' : 'pr-4 justify-between'} ${
            parentIsActive ? 'text-white hover:bg-[#2a2a2a]/50' : BUTTON_INACTIVE_CLASSES
          }`}
        >
          <div className="flex items-center gap-3">
            <Icon iconPath={item.iconPath} />
            <span className={`${parentIsActive ? 'font-bold' : ''} transition-all duration-300 ${isMinimized ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>{item.label}</span>
          </div>
          <span className={`transition-all duration-300 ${isMinimized ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
            <Icon 
              iconPath="M19 9l-7 7-7-7" 
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </span>
        </button>
        {isExpanded && !isMinimized && (
          <div className="relative mt-1">
            {/* Vertical line */}
            <div className="absolute left-[26px] top-0 bottom-0 w-[1.5px] bg-[#424242]"></div>
            <ul className="space-y-1 pl-12">
              {item.subItems!.map((subItem) => (
                <SubMenuItem
                  key={subItem.id}
                  item={subItem}
                  activeItem={activeItem}
                  setActiveItem={setActiveItem}
                  onMinimizeSidebar={onMinimizeSidebar}
                  router={router}
                  pathname={pathname}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <button 
      onClick={handleMenuItemClick}
      className={`${BUTTON_BASE_CLASSES} ${isActive ? BUTTON_ACTIVE_CLASSES : BUTTON_INACTIVE_CLASSES}`}
    >
      <Icon iconPath={item.iconPath} />
      <span className={`transition-all duration-300 ${isMinimized ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>{item.label}</span>
    </button>
  );
}

export default function Sidebar({ 
  isExpanded, 
  onToggle,
  userName: propUserName,
  userEmail: propUserEmail,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [activeItem, setActiveItem] = useState<string>('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [wasAutoExpanded, setWasAutoExpanded] = useState(false);
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({
    management: true
  });

  // Extract orgShortId from pathname (e.g., /org-x7k2/repositories -> x7k2)
  const getOrgShortIdFromPath = useCallback(() => {
    const match = pathname.match(/\/org-([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  const orgShortId = getOrgShortIdFromPath();

  // Helper to build route with org prefix
  const buildRoute = useCallback((route: string) => {
    if (orgShortId) {
      return `/org-${orgShortId}${route}`;
    }
    return route;
  }, [orgShortId]);

  // Set active item based on current pathname
  useEffect(() => {
    if (pathname.includes('/settings')) {
      setActiveItem('Settings');
    } else if (pathname.includes('/repositories')) {
      setActiveItem('Repositories');
    } else if (pathname.includes('/onboarding')) {
      setActiveItem('Onboarding');
    } else if (pathname.includes('/dashboard') || pathname === '/') {
      setActiveItem('dashboard');
    }
    // Add more route mappings as pages are created
  }, [pathname]);

  // Use props if available, fallback to session
  const userName = propUserName ?? session?.user?.name;
  const userEmail = propUserEmail ?? session?.user?.email;

  const setExpandedState = useCallback((id: string, value: boolean) => {
    setExpandedStates(prev => ({ ...prev, [id]: value }));
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
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

  const handleSettingsClick = useCallback(() => {
    setActiveItem('Settings');
    router.push('/settings');
  }, [router]);

  const handleOrgItemClick = useCallback((itemId: string) => {
    setActiveItem(itemId);
  }, []);

  const handleExpandSidebar = useCallback(() => {
    if (isMinimized) {
      setIsMinimized(false);
      setWasAutoExpanded(true);
    }
  }, [isMinimized]);

  const handleMinimizeSidebar = useCallback(() => {
    setIsMinimized(true);
    setWasAutoExpanded(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (wasAutoExpanded) {
      setIsMinimized(true);
      setWasAutoExpanded(false);
    }
  }, [wasAutoExpanded]);

  return (
    <aside 
      className={`h-full bg-[#121215] border-r border-[#262626] transition-all duration-300 ${isMinimized ? 'w-20' : 'w-80'}`}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className={`flex items-center ${isMinimized ? 'justify-center' : 'justify-between'} p-4 ${isMinimized ? 'px-4' : 'pl-8 pr-4'}`}>
          {!isMinimized && (
            <img 
              src="/Full-logo.png" 
              alt="Logo" 
              className="h-10 w-auto"
            />
          )}
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors duration-200 cursor-pointer"
            aria-label="Minimize sidebar"
          >
            <svg className="w-5 h-5 text-white/70 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMinimized ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-[#262626]"></div>

        {/* Search Bar */}
        <div className={`${isMinimized ? 'px-2' : 'px-4'} pt-4`}>
          {isMinimized ? (
            <button
              type="button"
              className="w-full py-2 flex items-center justify-center bg-[#1a1a1a] border border-[#262626] rounded-lg hover:bg-[#1a1a1a]/80 transition-colors duration-200 cursor-pointer"
              aria-label="Search"
            >
              <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          ) : (
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-3 py-2 bg-[#1a1a1a] border border-[#262626] rounded-lg text-white text-sm placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
              />
            </div>
          )}
        </div>

        {/* Sidebar Content */}
        <nav className={`flex-1 flex flex-col overflow-y-auto sidebar-scrollbar ${isMinimized ? 'px-2' : 'px-4'}`}>
          {/* MAIN Section */}
          <div className="pt-4 pb-3">
            {!isMinimized && <h3 className="text-xs text-white/60 pl-4 mb-2">MAIN</h3>}
            <ul className="space-y-1">
              {MAIN_MENU_ITEMS.map((item) => (
                <li key={item.id}>
                  <MenuItemComponent
                    item={item}
                    isExpanded={expandedStates[item.id] || false}
                    onToggle={() => setExpandedState(item.id, !expandedStates[item.id])}
                    activeItem={activeItem}
                    setActiveItem={setActiveItem}
                    router={router}
                    pathname={pathname}
                    isMinimized={isMinimized}
                    onExpandSidebar={handleExpandSidebar}
                    onMinimizeSidebar={handleMinimizeSidebar}
                  />
                </li>
              ))}
            </ul>
          </div>

          {/* ORGANIZATION Section */}
          <div className={`border-t border-[#262626] ${isMinimized ? '' : '-mx-4'}`}></div>
          <div className="pt-4 pb-3">
            {!isMinimized && <h3 className="text-xs text-white/60 pl-4 mb-2">ORGANIZATION</h3>}
            <ul className="space-y-1">
              <li>
                <button 
                  onClick={() => handleOrgItemClick('Configurations')}
                  className={`${BUTTON_BASE_CLASSES} ${
                    activeItem === 'Configurations' ? BUTTON_ACTIVE_CLASSES : BUTTON_INACTIVE_CLASSES
                  }`}
                >
                  <Icon iconPath={[
                    "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
                    "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  ]} />
                  <span className={`transition-all duration-300 ${isMinimized ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Configurations</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleOrgItemClick('Access')}
                  className={`${BUTTON_BASE_CLASSES} ${
                    activeItem === 'Access' ? BUTTON_ACTIVE_CLASSES : BUTTON_INACTIVE_CLASSES
                  }`}
                >
                  <Icon iconPath="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  <span className={`transition-all duration-300 ${isMinimized ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Access</span>
                </button>
              </li>
            </ul>
          </div>

          {/* CONFIGURATIONS Section */}
          <div className={`border-t border-[#262626] ${isMinimized ? '' : '-mx-4'}`}></div>
          <div className="pt-4 pb-3">
            {!isMinimized && <h3 className="text-xs text-white/60 pl-4 mb-2">CONFIGURATIONS</h3>}
            <ul className="space-y-1">
              <li>
                <button 
                  onClick={handleSettingsClick}
                  className={`${BUTTON_BASE_CLASSES} ${
                    activeItem === 'Settings' ? BUTTON_ACTIVE_CLASSES : BUTTON_INACTIVE_CLASSES
                  }`}
                >
                  <Icon iconPath={[
                    "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
                    "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  ]} />
                  <span className={`transition-all duration-300 ${isMinimized ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Settings</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleOrgItemClick('Help')}
                  className={`${BUTTON_BASE_CLASSES} ${
                    activeItem === 'Help' ? BUTTON_ACTIVE_CLASSES : BUTTON_INACTIVE_CLASSES
                  }`}
                >
                  <Icon iconPath="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <span className={`transition-all duration-300 ${isMinimized ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Help</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={handleLogout}
                  className={`${BUTTON_BASE_CLASSES} ${BUTTON_INACTIVE_CLASSES}`}
                >
                  <Icon iconPath="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  <span className={`transition-all duration-300 ${isMinimized ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Logout</span>
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* Profile Section */}
        <div className={`${isMinimized ? 'px-2' : 'px-4'} py-3`}>
          <div className={`flex items-center ${isMinimized ? 'justify-center' : 'gap-2.5'} p-2.5`}>
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <img 
                src="/Pfp-placeholder.png" 
                alt="Profile" 
                className="w-10 h-10 rounded-lg object-cover shadow-sm"
              />
            </div>
            {/* Full Name */}
            {!isMinimized && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {userName || 'User'}
                </p>
              </div>
            )}
            {/* Settings Icon */}
            {!isMinimized && (
              <button 
                onClick={handleSettingsClick}
                className="flex-shrink-0 p-1.5 hover:bg-white/10 rounded-md transition-all duration-200 cursor-pointer group"
              >
                <Icon 
                  iconPath="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  className="w-5 h-5 text-white/70 group-hover:text-white transition-colors duration-200"
                />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
