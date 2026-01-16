'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
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
  subItems?: SubMenuItem[];
}

// Menu items configuration
const MAIN_MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    iconPath: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    subItems: [
      { id: 'Overview', label: 'Overview' },
      { id: 'Analytics', label: 'Analytics' }
    ]
  },
  {
    id: 'Repositories',
    label: 'Repositories',
    iconPath: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
  },
  {
    id: 'management',
    label: 'Management',
    iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    subItems: [
      { id: 'Members', label: 'Members' },
      { id: 'Teams', label: 'Teams' },
      { id: 'Tasks', label: 'Tasks' }
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

// SubMenuItem component
function SubMenuItem({ item, index, activeItem, setActiveItem }: { item: SubMenuItem; index: number; activeItem: string; setActiveItem: (id: string) => void }) {
  return (
    <li className="relative">
      {/* Curved connection line */}
      <svg className="absolute left-[-21px] top-1/2 -translate-y-1/2 w-[22px] h-[12px] overflow-visible pointer-events-none">
        <path d="M 0 -6 L 0 0 Q 0 6 11 6" stroke="#424242" strokeWidth="1" fill="none" strokeLinecap="round" />
      </svg>
      <button 
        onClick={() => setActiveItem(item.id)}
        className={`w-full text-left pl-4 py-2 text-sm rounded-lg transition-colors duration-200 cursor-pointer ${
          activeItem === item.id
            ? 'text-white bg-[#2a2a2a]/50 font-bold'
            : 'text-white/60 hover:text-white hover:bg-[#2a2a2a]/50'
        }`}
      >
        {item.label}
      </button>
    </li>
  );
}

// MenuItem component
function MenuItemComponent({ item, isExpanded, onToggle, activeItem, setActiveItem, expandedStates, setExpandedState }: {
  item: MenuItem;
  isExpanded: boolean;
  onToggle: () => void;
  activeItem: string;
  setActiveItem: (id: string) => void;
  expandedStates: Record<string, boolean>;
  setExpandedState: (id: string, value: boolean) => void;
}) {
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const isActive = activeItem === item.id || (hasSubItems && item.subItems?.some(sub => activeItem === sub.id));

  if (hasSubItems) {
    const parentIsActive = item.subItems?.some(sub => activeItem === sub.id);
    
    return (
      <div>
        <button 
          onClick={onToggle}
          className={`w-full text-left pl-4 pr-4 py-3 text-sm rounded-lg transition-colors duration-200 flex items-center justify-between gap-3 cursor-pointer ${
            parentIsActive
              ? 'text-white hover:bg-[#2a2a2a]/50'
              : 'text-white/60 hover:text-white hover:bg-[#2a2a2a]/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.iconPath} />
            </svg>
            <span className={parentIsActive ? 'font-bold' : ''}>{item.label}</span>
          </div>
          <svg className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isExpanded && (
          <div className="relative mt-1">
            {/* Vertical line */}
            <div className="absolute left-[26px] top-0 bottom-0 w-[1.5px] bg-[#424242]"></div>
            <ul className="space-y-1 pl-12">
              {item.subItems!.map((subItem, index) => (
                <SubMenuItem
                  key={subItem.id}
                  item={subItem}
                  index={index}
                  activeItem={activeItem}
                  setActiveItem={setActiveItem}
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
      onClick={() => setActiveItem(item.id)}
      className={`w-full text-left pl-4 py-3 text-sm rounded-lg transition-colors duration-200 flex items-center gap-3 cursor-pointer ${
        activeItem === item.id
          ? 'text-white bg-[#2a2a2a]/50 font-bold'
          : 'text-white/60 hover:text-white hover:bg-[#2a2a2a]/50'
      }`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.iconPath} />
      </svg>
      <span>{item.label}</span>
    </button>
  );
}

export default function Sidebar({ isExpanded, onToggle }: SidebarProps) {
  const router = useRouter();
  const [activeItem, setActiveItem] = useState<string>('');
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({
    dashboard: true,
    management: true
  });

  const setExpandedState = (id: string, value: boolean) => {
    setExpandedStates(prev => ({ ...prev, [id]: value }));
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="h-full w-80">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center p-6 pl-10">
          <img 
            src="/Full-logo.png" 
            alt="Logo" 
            className="h-12 w-auto"
          />
        </div>

        {/* Sidebar Content */}
        <nav className="flex-1 px-6 flex flex-col overflow-y-auto sidebar-scrollbar">
          {/* MAIN Section */}
          <div className="pb-6">
            <h3 className="text-xs text-white/60 pl-4 mb-3">MAIN</h3>
            <ul className="space-y-2">
              {MAIN_MENU_ITEMS.map((item) => (
                <li key={item.id}>
                  <MenuItemComponent
                    item={item}
                    isExpanded={expandedStates[item.id] || false}
                    onToggle={() => setExpandedState(item.id, !expandedStates[item.id])}
                    activeItem={activeItem}
                    setActiveItem={setActiveItem}
                    expandedStates={expandedStates}
                    setExpandedState={setExpandedState}
                  />
                </li>
              ))}
            </ul>
          </div>

          {/* ORGANIZATION Section */}
          <div className="border-t border-[#424242] pt-6 pb-6">
            <h3 className="text-xs text-white/60 pl-4 mb-3">ORGANIZATION</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => setActiveItem('Configurations')}
                  className={`w-full text-left pl-4 py-3 text-sm rounded-lg transition-colors duration-200 flex items-center gap-3 cursor-pointer ${
                    activeItem === 'Configurations'
                      ? 'text-white bg-[#2a2a2a]/50 font-bold'
                      : 'text-white/60 hover:text-white hover:bg-[#2a2a2a]/50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Configurations</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveItem('Identity & Access')}
                  className={`w-full text-left pl-4 py-3 text-sm rounded-lg transition-colors duration-200 flex items-center gap-3 cursor-pointer ${
                    activeItem === 'Identity & Access'
                      ? 'text-white bg-[#2a2a2a]/50 font-bold'
                      : 'text-white/60 hover:text-white hover:bg-[#2a2a2a]/50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span>Identity & Access</span>
                </button>
              </li>
            </ul>
          </div>

          {/* CONFIGURATIONS Section */}
          <div className="border-t border-[#424242] pt-6 pb-6">
            <h3 className="text-xs text-white/60 pl-4 mb-3">CONFIGURATIONS</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => setActiveItem('Settings')}
                  className={`w-full text-left pl-4 py-3 text-sm rounded-lg transition-colors duration-200 flex items-center gap-3 cursor-pointer ${
                    activeItem === 'Settings'
                      ? 'text-white bg-[#2a2a2a]/50 font-bold'
                      : 'text-white/60 hover:text-white hover:bg-[#2a2a2a]/50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Settings</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveItem('Help')}
                  className={`w-full text-left pl-4 py-3 text-sm rounded-lg transition-colors duration-200 flex items-center gap-3 cursor-pointer ${
                    activeItem === 'Help'
                      ? 'text-white bg-[#2a2a2a]/50 font-bold'
                      : 'text-white/60 hover:text-white hover:bg-[#2a2a2a]/50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Help</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left pl-4 py-3 text-sm rounded-lg transition-colors duration-200 flex items-center gap-3 cursor-pointer text-white/60 hover:text-white hover:bg-[#2a2a2a]/50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </aside>
  );
}
