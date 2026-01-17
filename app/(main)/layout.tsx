'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardNavbar from '@/app/components/DashboardNavbar';
import Sidebar from '@/app/components/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'unauthenticated') {
    return null;
  }

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  return (
    <div className="h-screen flex bg-transparent">
      {/* Sidebar on the left - full height */}
      <Sidebar isExpanded={isSidebarExpanded} onToggle={toggleSidebar} />
      
      {/* Right side - Navbar and content stacked */}
      <div className="flex-1 flex flex-col overflow-hidden px-6">
        {/* Navbar */}
        <DashboardNavbar userEmail={session?.user?.email} userName={session?.user?.name} />
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

